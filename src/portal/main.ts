import './portal.css'
import { effects } from '../effects/registry'
import type { EffectHandle, EffectModule } from '../effects/types'

// ============================================================
// 核心交互：固定视口 + 分页淡入淡出（iOS UIScrollView isPagingEnabled 式）
//   视口不滚动；滚轮/键盘/触摸手势触发整页 crossfade 替换内容。
//   每页 1470×设计高，绝对居中，按 min(窗口宽/1470, 窗口高/页高) 等比缩放铺进窗口。
// ============================================================
const STAGE_W = 1470
const viewport = document.getElementById('portal-viewport')!
const pages = Array.from(viewport.querySelectorAll<HTMLElement>('.page'))

function fit() {
  for (const p of pages) {
    const s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / p.offsetHeight)
    p.style.transform = `translate(-50%, -50%) scale(${s})`
  }
}
fit()
window.addEventListener('resize', fit)
if (document.fonts?.ready) void document.fonts.ready.then(fit)
new ResizeObserver(fit).observe(viewport)

// ── 分页导航 ──
let cur = pages.findIndex((p) => p.classList.contains('active'))
if (cur < 0) {
  cur = 0
  pages[0]?.classList.add('active')
}
let lock = false
function goTo(i: number) {
  i = Math.max(0, Math.min(pages.length - 1, i))
  if (i === cur || lock) return
  const prev = cur
  pages[prev].classList.remove('active')
  pages[i].classList.add('active')
  cur = i
  onPageChange(pages[prev], pages[i])
  lock = true
  window.setTimeout(() => (lock = false), 750) // 翻页动画期间锁住，防连跳
}

// 滚轮：卡片内部阅读页自己滚动，其余区域翻页。
// 触控板惯性会连发 wheel，用「滚动停止 160ms 才解锁」吃掉惯性，一次手势只翻一页。
let wheelCooldown = false
let wheelTimer = 0
window.addEventListener(
  'wheel',
  (e) => {
    if ((e.target as HTMLElement)?.closest?.('.m1-card')) return
    e.preventDefault()
    window.clearTimeout(wheelTimer)
    wheelTimer = window.setTimeout(() => (wheelCooldown = false), 160)
    if (wheelCooldown || lock || Math.abs(e.deltaY) < 8) return
    wheelCooldown = true
    goTo(cur + (e.deltaY > 0 ? 1 : -1))
  },
  { passive: false },
)
// 键盘
window.addEventListener('keydown', (e) => {
  if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
    e.preventDefault()
    goTo(cur + 1)
  } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
    e.preventDefault()
    goTo(cur - 1)
  }
})
// 触摸滑动
let touchY = 0
window.addEventListener('touchstart', (e) => (touchY = e.touches[0].clientY), { passive: true })
window.addEventListener(
  'touchend',
  (e) => {
    const dy = touchY - e.changedTouches[0].clientY
    if (Math.abs(dy) > 40) goTo(cur + (dy > 0 ? 1 : -1))
  },
  { passive: true },
)

// ============================================================
// 各页的 product 挂载：进入该页激活态才挂载实跑 effect，离开即销毁
//   模块一 · 置身其中（呼啸山庄）：书卡占位 → 实跑 wutheringSkin（带声、带吹字交互）
//   背景用设计图，不在此挂载。
// ============================================================
const wuthering = effects.find((e) => e.id === 'wutheringSkin') as EffectModule<unknown> | undefined
const m1Card = document.getElementById('m1-card')
let m1Handle: EffectHandle<unknown> | null = null
function mountM1() {
  if (m1Handle || !wuthering || !m1Card) return
  m1Handle = wuthering.mount(m1Card, structuredClone(wuthering.defaultParams))
}
function unmountM1() {
  m1Handle?.destroy()
  m1Handle = null
}

function onPageChange(prevPage: HTMLElement, nextPage: HTMLElement) {
  if (nextPage.classList.contains('module1')) mountM1()
  if (prevPage.classList.contains('module1')) unmountM1()
}

// 首屏即激活页若是模块一则挂载（一般是 hero，不挂）
if (pages[cur]?.classList.contains('module1')) mountM1()
