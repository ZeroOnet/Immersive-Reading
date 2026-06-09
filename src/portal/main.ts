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

// .fill 页用 CSS 铺满窗口(100vw×100vh)，无需 transform；只有 .poster 页按窗口等比缩放居中
function fit() {
  // 演示真机：原生 375×794，顶部锚定 18.72%(设计位置)，底部受窗口约束 → 高度不足时从顶部等比压缩
  // （只缩不放大）。可用高度 = 窗口高 ×(1-0.1872) - 16px 底部留白。
  const phoneScale = Math.min(1, (window.innerHeight * (1 - 0.1872) - 16) / 794)
  document.documentElement.style.setProperty('--phone-scale', phoneScale.toFixed(4))
  for (const p of pages) {
    if (!p.classList.contains('poster')) continue
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
//   背景用设计图，不在此挂载。
// ============================================================
const byId = new Map(effects.map((e) => [e.id, e]))
function effect(id: string) {
  return byId.get(id) as EffectModule<unknown> | undefined
}

// 模块一·呼啸山庄（m1-wuther）：书卡 → 实跑 wutheringSkin（无粒子）
let wutherHandle: EffectHandle<unknown> | null = null
function mountWuther() {
  if (wutherHandle) return
  const card = document.getElementById('m1-card')
  const m = effect('wutheringSkin')
  if (card && m) wutherHandle = m.mount(card, structuredClone(m.defaultParams))
}
function unmountWuther() {
  wutherHandle?.destroy()
  wutherHandle = null
}

// 模块一·老人与海（m1-oldman）：书卡 → 实跑 oldManSkin；整屏「同款雨」→ precipitation(透明)
let oldmanHandle: EffectHandle<unknown> | null = null
let rainHandle: EffectHandle<unknown> | null = null
function mountOldman() {
  if (oldmanHandle) return
  const card = document.getElementById('m1b-card')
  const om = effect('oldManSkin')
  if (card && om) oldmanHandle = om.mount(card, structuredClone(om.defaultParams))
  const rainBox = document.getElementById('m1b-rain')
  const pr = effect('precipitation')
  if (rainBox && pr) {
    rainHandle = pr.mount(rainBox, structuredClone(pr.defaultParams))
    const cv = rainBox.querySelector('canvas')
    if (cv) cv.style.background = 'transparent' // 雨原语自带深蓝底，叠加层需透明
  }
}
function unmountOldman() {
  oldmanHandle?.destroy()
  oldmanHandle = null
  rainHandle?.destroy()
  rainHandle = null
}

// 模块一·飘（m1-gone）：书卡 → 实跑 goneSkin（Page Burn）；burn=0 → 开场燃烧进度 1→0
let goneHandle: EffectHandle<unknown> | null = null
function mountGone() {
  if (goneHandle) return
  const card = document.getElementById('m1c-card')
  const g = effect('goneSkin')
  if (card && g) {
    const p = structuredClone(g.defaultParams) as Record<string, unknown>
    p.burn = 0 // 燃烧进度范围 1→0（开场 introBurn 1 → burn 0）
    p.edgeReach = 1 // 可燃范围
    p.ragged = 0.35 // 前沿碎裂
    p.ember = 0.025 // 余烬带宽
    goneHandle = g.mount(card, p)
  }
}
function unmountGone() {
  goneHandle?.destroy()
  goneHandle = null
}

function onPageChange(prevPage: HTMLElement, nextPage: HTMLElement) {
  if (prevPage.classList.contains('m1-wuther')) unmountWuther()
  if (prevPage.classList.contains('m1-oldman')) unmountOldman()
  if (prevPage.classList.contains('m1-gone')) unmountGone()
  if (nextPage.classList.contains('m1-wuther')) mountWuther()
  if (nextPage.classList.contains('m1-oldman')) mountOldman()
  if (nextPage.classList.contains('m1-gone')) mountGone()
}

// 首屏激活页兜底（一般是 hero，不挂）
const active = pages[cur]
if (active?.classList.contains('m1-wuther')) mountWuther()
if (active?.classList.contains('m1-oldman')) mountOldman()
if (active?.classList.contains('m1-gone')) mountGone()
