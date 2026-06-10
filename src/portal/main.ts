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

const STAGE_H = 956

// 所有页面都保持 Figma 设计画布尺寸，再按窗口等比缩放居中。
function fit() {
  document.documentElement.style.setProperty('--phone-scale', '1')
  for (const p of pages) {
    const pageH = p.classList.contains('poster') ? p.offsetHeight : STAGE_H
    const s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / pageH)
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

// 模块二·血字的研究（m2-sherlock）：demo 卡片 → 实跑 sherlockSkin；左侧三按钮触发三状态
let sherlockHandle: EffectHandle<unknown> | null = null
let sherlockBgm: HTMLAudioElement | null = null
let sherlockBgmCleanup: (() => void) | null = null
const sherlockRainUrl = new URL('./assets/audio/m2-sherlock-rain.mp3', import.meta.url).href
function mountSherlock() {
  if (sherlockHandle) return
  const card = document.getElementById('m2sh-card')
  const sk = effect('sherlockSkin')
  if (card && sk) sherlockHandle = sk.mount(card, structuredClone(sk.defaultParams))
  // 进页时按钮高亮重置到 STEP 1
  document
    .querySelectorAll<HTMLElement>('.m2-step')
    .forEach((b) => b.classList.toggle('active', b.dataset.step === '1'))
  // 背景雨声循环；浏览器禁止带声 autoplay → 首次交互后再播
  sherlockBgm = new Audio(sherlockRainUrl)
  sherlockBgm.loop = true
  sherlockBgm.volume = 0.45
  sherlockBgm.play().catch(() => {
    const start = () => {
      void sherlockBgm?.play().catch(() => {})
    }
    window.addEventListener('click', start, { once: true })
    window.addEventListener('touchstart', start, { once: true, passive: true })
    window.addEventListener('keydown', start, { once: true })
    sherlockBgmCleanup = () => {
      window.removeEventListener('click', start)
      window.removeEventListener('touchstart', start)
      window.removeEventListener('keydown', start)
    }
  })
}
function unmountSherlock() {
  sherlockHandle?.destroy()
  sherlockHandle = null
  sherlockBgm?.pause()
  sherlockBgm = null
  sherlockBgmCleanup?.()
  sherlockBgmCleanup = null
}
// 三按钮接线：点击切换高亮 + 调 sherlock.demoStep
document.querySelectorAll<HTMLElement>('.m2-step').forEach((btn) => {
  btn.addEventListener('click', () => {
    const step = Number(btn.dataset.step)
    document.querySelectorAll('.m2-step').forEach((b) => b.classList.toggle('active', b === btn))
    sherlockHandle?.demoStep?.(step)
  })
})

// 模块二·指环王（m2-ring）：demo 卡片 → 实跑 ringSkin（点指环录音念咒）
let ringHandle: EffectHandle<unknown> | null = null
function mountRing() {
  if (ringHandle) return
  const card = document.getElementById('m2ring-card')
  const rk = effect('ringSkin')
  if (card && rk) ringHandle = rk.mount(card, structuredClone(rk.defaultParams))
}
function unmountRing() {
  ringHandle?.destroy()
  ringHandle = null
}

// 模块三·爱丽丝（m3-alice）：demo 卡片 → 实跑 aliceSkin（点击词 → 纸牌飞出撞散文字）
let aliceHandle: EffectHandle<unknown> | null = null
function mountAlice() {
  if (aliceHandle) return
  const card = document.getElementById('m3alice-card')
  const ak = effect('aliceSkin')
  if (card && ak) aliceHandle = ak.mount(card, structuredClone(ak.defaultParams))
}
function unmountAlice() {
  aliceHandle?.destroy()
  aliceHandle = null
}

// 模块三·爱丽丝晃动掉落（m3-fall）：demo 卡片 → 实跑 aliceFallSkin；摇一摇按钮 → 掉落 + demo 屏左右摇摆
let fallHandle: EffectHandle<unknown> | null = null
function mountFall() {
  if (fallHandle) return
  const card = document.getElementById('m3fall-card')
  const fk = effect('aliceFallSkin')
  if (card && fk) {
    const p = structuredClone(fk.defaultParams) as Record<string, unknown>
    p.showButton = false // 门户里隐藏 demo 底部按钮，由摇一摇按钮驱动
    fallHandle = fk.mount(card, p)
  }
}
function unmountFall() {
  fallHandle?.destroy()
  fallHandle = null
}
// 摇一摇按钮：触发掉落(toggle) + demo 卡片左右摇摆
document.querySelector<HTMLElement>('.m3-shake-btn')?.addEventListener('click', () => {
  fallHandle?.demoStep?.(1)
  const card = document.getElementById('m3fall-card')
  if (card) {
    card.classList.remove('m3-shaking')
    void card.offsetWidth // 强制 reflow → 重启摇摆动画
    card.classList.add('m3-shaking')
  }
})

// 模块四·言下之意（m4-undertone）：实跑 veilSkin。
// 演示屏内点击「The dog it was that died」三段台词 / 呼吸点会 toggle veilSkin 的 tooltipOpen，
// 这里 rAF 轮询 tooltipOpen，把大屏左侧 (原句 ↔ 解释卡) 同步切换：>0.5 → .is-after
type UndertoneParams = { tooltipOpen?: number }
let undertoneHandle: EffectHandle<UndertoneParams> | null = null
let undertoneRaf = 0
function mountUndertone() {
  if (undertoneHandle) return
  const card = document.getElementById('m4u-card')
  const sect = document.querySelector<HTMLElement>('.m4-undertone')
  const vk = effect('veilSkin') as EffectModule<UndertoneParams> | undefined
  if (!card || !sect || !vk) return
  undertoneHandle = vk.mount(card, structuredClone(vk.defaultParams))
  sect.classList.remove('is-after')
  const sync = () => {
    const p = undertoneHandle?.getParams?.()
    const open = typeof p?.tooltipOpen === 'number' ? p.tooltipOpen : 0
    sect.classList.toggle('is-after', open > 0.5)
    undertoneRaf = requestAnimationFrame(sync)
  }
  undertoneRaf = requestAnimationFrame(sync)
}
function unmountUndertone() {
  cancelAnimationFrame(undertoneRaf)
  undertoneRaf = 0
  undertoneHandle?.destroy()
  undertoneHandle = null
  document.querySelector('.m4-undertone')?.classList.remove('is-after')
}

// 模块四·言下之意第二页（m4-veil-smoke）：实跑 veilSmokeSkin。
// 大屏：迷雾 canvas（同 veilSmokeSkin 粒子做法，smoke.png × N 旋转面片）+ Kalam 台词 A↔B
// 点击演示屏烟雾 或 大屏迷雾区，都 toggle veilSmokeSkin.state（演示屏内自带 click→tweenState；
// 大屏点击通过 demoStep(1) 进入同一条 tween）。rAF 轮询 state 把 .is-after 同步到大屏，文字 crossfade
type VeilSmokeParams = { state?: number }
let veilSmokeHandle: EffectHandle<VeilSmokeParams> | null = null
let veilSmokeRaf = 0
let veilSmokeFogRaf = 0
function mountVeilSmoke() {
  if (veilSmokeHandle) return
  const card = document.getElementById('m4vs-card')
  const sect = document.querySelector<HTMLElement>('.m4-veil-smoke')
  const fogWrap = sect?.querySelector<HTMLElement>('.m4-fog')
  const canvas = sect?.querySelector<HTMLCanvasElement>('.m4-fog-canvas')
  const vsk = effect('veilSmokeSkin') as EffectModule<VeilSmokeParams> | undefined
  if (!card || !sect || !fogWrap || !canvas || !vsk) return

  veilSmokeHandle = vsk.mount(card, structuredClone(vsk.defaultParams))
  sect.classList.remove('is-after')
  sect.classList.remove('is-particle')

  // ── 大屏 Kalam 台词粒子层 ─────────────────────────────────────────────
  // 默认 HTML 文本（轻量）；state 处于转换中间态时切到粒子 canvas（重，但仅 ~1s）；
  // 落定后回 HTML。canvas/HTML 之间用 opacity crossfade。
  // 粒度比 phone（step=dp、dot=1×1）粗一倍：step=dp*2、dot=2×2 → 粒子数 ~1/4
  const textCanvas = document.createElement('canvas')
  textCanvas.className = 'm4-fog-text-canvas'
  const fogTextEl = sect.querySelector<HTMLElement>('.m4-fog-text')!
  fogTextEl.appendChild(textCanvas)
  const tctx = textCanvas.getContext('2d')!
  interface TP { x: number; y: number; ax: number; ay: number; bx: number; by: number }
  let textParticles: TP[] = []
  let TCW = 0
  let TCH = 0
  function sizeTextCanvas() {
    const r = textCanvas.getBoundingClientRect()
    TCW = Math.max(1, r.width)
    TCH = Math.max(1, r.height)
    const dp = Math.min(window.devicePixelRatio || 1, 2)
    textCanvas.width = Math.floor(TCW * dp)
    textCanvas.height = Math.floor(TCH * dp)
    tctx.setTransform(dp, 0, 0, dp, 0, 0)
  }
  // 把 text 渲到离屏 canvas，按 alpha 取点。topRel = 文字中心相对画布高度的比例
  function sampleText(text: string, fontPx: number, lineH: number, topRel: number): { x: number; y: number }[] {
    const lines = text.split('\n')
    const dp = Math.min(window.devicePixelRatio || 1, 2)
    const off = document.createElement('canvas')
    off.width = Math.ceil(TCW * dp)
    off.height = Math.ceil(TCH * dp)
    const oc = off.getContext('2d')!
    oc.setTransform(dp, 0, 0, dp, 0, 0)
    oc.fillStyle = '#fff'
    oc.font = `400 ${fontPx}px Kalam, cursive`
    oc.textAlign = 'center'
    oc.textBaseline = 'middle'
    const startY = topRel * TCH + fontPx / 2
    lines.forEach((ln, i) => oc.fillText(ln, TCW / 2, startY + i * lineH))
    const data = oc.getImageData(0, 0, off.width, off.height).data
    const step = Math.max(2, Math.round(dp * 2))
    const out: { x: number; y: number }[] = []
    for (let y = 0; y < off.height; y += step) {
      for (let x = 0; x < off.width; x += step) {
        if (data[(y * off.width + x) * 4 + 3] > 120) out.push({ x: x / dp, y: y / dp })
      }
    }
    return out
  }
  function buildTextParticles() {
    sizeTextCanvas()
    // 与 CSS 的 .m4-fog-en-a / .m4-fog-en-b 位置 / 字号对齐
    const aPts = sampleText('“You know I adore you.”', 56, 60, 0.2464)
    const bPts = sampleText('“But not enough to risk\nanything.”', 56, 60, 0.1819)
    const N = Math.max(aPts.length, bPts.length)
    textParticles = []
    for (let i = 0; i < N; i++) {
      const a = aPts[i % aPts.length]
      const b = bPts[i % bPts.length]
      textParticles.push({ x: a.x, y: a.y, ax: a.x, ay: a.y, bx: b.x, by: b.y })
    }
  }
  function drawTextParticles(s: number) {
    tctx.clearRect(0, 0, TCW, TCH)
    // A → B 颜色插值（#bb915a → #a4a4a4）
    const r = Math.round(0xbb + (0xa4 - 0xbb) * s)
    const g = Math.round(0x91 + (0xa4 - 0x91) * s)
    const b = Math.round(0x5a + (0xa4 - 0x5a) * s)
    const col = `rgb(${r},${g},${b})`
    tctx.fillStyle = col
    tctx.shadowColor = col
    tctx.shadowBlur = 3
    for (const p of textParticles) {
      p.x = p.ax + (p.bx - p.ax) * s
      p.y = p.ay + (p.by - p.ay) * s
      tctx.fillRect(p.x, p.y, 2, 2)
    }
    tctx.shadowBlur = 0
  }
  // 字体加载完先采一遍兜底（防 Kalam 未就绪时落到 cursive 默认，位置偏）
  ;(document.fonts?.ready ?? Promise.resolve()).then(() => buildTextParticles())
  let inTextTransition = false

  // 大屏迷雾粒子：N 个 smoke.png 面片随机位置/尺寸/角度，每帧自转 → 翻滚烟雾
  const ctx = canvas.getContext('2d')!
  const tex = new Image()
  tex.src = new URL('../effects/veilSmokeSkin/smoke.png', import.meta.url).href
  interface Plane { x: number; y: number; size: number; rot: number; rotSpeed: number; alpha: number }
  let planes: Plane[] = []
  let SW = 0
  let SH = 0
  function spawn(): Plane {
    return {
      x: (Math.random() - 0.15) * SW * 1.3,
      y: SH * (0.3 + Math.random() * 0.7),
      size: 320 + Math.random() * 360,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.32,
      alpha: 0.07 + Math.random() * 0.13,
    }
  }
  function sizeFog() {
    const r = canvas!.getBoundingClientRect()
    SW = Math.max(1, r.width)
    SH = Math.max(1, r.height)
    const dp = Math.min(window.devicePixelRatio || 1, 2)
    canvas!.width = Math.floor(SW * dp)
    canvas!.height = Math.floor(SH * dp)
    ctx.setTransform(dp, 0, 0, dp, 0, 0)
    planes = Array.from({ length: 60 }, spawn)
  }
  let lastT = performance.now()
  const fogTick = () => {
    const now = performance.now()
    const dt = Math.min(0.05, (now - lastT) / 1000)
    lastT = now
    for (const p of planes) p.rot += p.rotSpeed * dt
    ctx.clearRect(0, 0, SW, SH)
    // 与演示屏同步：state 0 满 alpha；state 1 零 alpha（粒子被"潜台词"取代）。线性渐隐
    const s = veilSmokeHandle?.getParams?.()?.state
    const visAlpha = 1 - Math.max(0, Math.min(1, typeof s === 'number' ? s : 0))
    if (visAlpha > 0.005 && tex.complete && tex.naturalWidth > 0) {
      for (const p of planes) {
        ctx.globalAlpha = p.alpha * visAlpha
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.drawImage(tex, -p.size / 2, -p.size / 2, p.size, p.size)
        ctx.restore()
      }
      ctx.globalAlpha = 1
    }
    veilSmokeFogRaf = requestAnimationFrame(fogTick)
  }
  sizeFog()
  veilSmokeFogRaf = requestAnimationFrame(fogTick)
  // 容器尺寸变化时重采样
  const ro = new ResizeObserver(() => sizeFog())
  ro.observe(canvas)

  // 大屏迷雾区点击 → 通过 demoStep(1) 触发演示屏同一条 tween（state 反转）
  const onFogClick = () => veilSmokeHandle?.demoStep?.(1)
  fogWrap.addEventListener('click', onFogClick)

  // rAF 同步 state → 大屏 .is-after（>0.5 切到 B 台词），并在转换中间态 (0.05~0.95) 切到粒子
  const sync = () => {
    const p = veilSmokeHandle?.getParams?.()
    const s = typeof p?.state === 'number' ? p.state : 0
    sect.classList.toggle('is-after', s > 0.5)
    const inT = s > 0.05 && s < 0.95
    if (inT && !inTextTransition) {
      buildTextParticles() // 进入转换：重采（兜底 canvas 尺寸 / 字体可能变了）
      sect.classList.add('is-particle')
      inTextTransition = true
    } else if (!inT && inTextTransition) {
      sect.classList.remove('is-particle')
      inTextTransition = false
    }
    if (inTextTransition) drawTextParticles(s)
    veilSmokeRaf = requestAnimationFrame(sync)
  }
  veilSmokeRaf = requestAnimationFrame(sync)

  // 卸载时清理
  veilSmokeCleanup = () => {
    ro.disconnect()
    fogWrap.removeEventListener('click', onFogClick)
    textCanvas.remove()
  }
}
// 模块四·言下之意第三页（m4-pride）：实跑 prideSkin。
// 演示屏 prideSkin 自带「水平拖动揭开」交互（peel 0→1）。大屏每帧把 peel 推到 clip-path：
// 谎言贴纸（cardA，在上）从右往左被裁掉，露出底层真话（cardB），物理进度跟 phone 1:1 同步。
// 中文译文 a/b 双语用线性 opacity（最大 60%，与设计稿一致）。
type PrideParams = { peel?: number }
let prideHandle: EffectHandle<PrideParams> | null = null
let prideRaf = 0
function mountPride() {
  if (prideHandle) return
  const card = document.getElementById('m4pr-card')
  const sect = document.querySelector<HTMLElement>('.m4-pride')
  const cardA = sect?.querySelector<HTMLElement>('.m4-pride-card-a')
  const zhA = sect?.querySelector<HTMLElement>('.m4-pride-zh-a')
  const zhB = sect?.querySelector<HTMLElement>('.m4-pride-zh-b')
  const pr = effect('prideSkin') as EffectModule<PrideParams> | undefined
  if (!card || !sect || !cardA || !zhA || !zhB || !pr) return
  prideHandle = pr.mount(card, structuredClone(pr.defaultParams))
  const sync = () => {
    const p = prideHandle?.getParams?.()
    const peel = Math.max(0, Math.min(1, typeof p?.peel === 'number' ? p.peel : 0))
    const cut = ((1 - peel) * 100).toFixed(2) // 谎言贴纸保留的左侧宽度
    cardA.style.clipPath = `polygon(0 0, ${cut}% 0, ${cut}% 100%, 0 100%)`
    zhA.style.opacity = ((1 - peel) * 0.6).toFixed(3)
    zhB.style.opacity = (peel * 0.6).toFixed(3)
    prideRaf = requestAnimationFrame(sync)
  }
  prideRaf = requestAnimationFrame(sync)
}
function unmountPride() {
  cancelAnimationFrame(prideRaf)
  prideRaf = 0
  prideHandle?.destroy()
  prideHandle = null
  // 让 CSS 默认重新接管
  const sect = document.querySelector('.m4-pride')
  sect?.querySelectorAll<HTMLElement>('.m4-pride-card-a, .m4-pride-zh-a, .m4-pride-zh-b').forEach((el) => {
    el.style.removeProperty('opacity')
    el.style.removeProperty('clip-path')
  })
}

let veilSmokeCleanup: (() => void) | null = null
function unmountVeilSmoke() {
  cancelAnimationFrame(veilSmokeRaf)
  cancelAnimationFrame(veilSmokeFogRaf)
  veilSmokeRaf = 0
  veilSmokeFogRaf = 0
  veilSmokeCleanup?.()
  veilSmokeCleanup = null
  veilSmokeHandle?.destroy()
  veilSmokeHandle = null
  const sect = document.querySelector('.m4-veil-smoke')
  sect?.classList.remove('is-after')
  sect?.classList.remove('is-particle')
}

// ── 首页演示屏 phone：扇贝阅读 App 开屏视频 ──
// 不自动播放、不循环：点击居中的播放图标才播；播放中隐藏图标；播完暂停在最后一帧并重现图标。
// is-playing：显示视频、隐藏图标；非 is-playing：显示静态截图(book-front)、显示图标
const heroVideo = document.getElementById('hero-demo-video') as HTMLVideoElement | null
const heroPlay = document.getElementById('hero-demo-play')
const heroStack = document.getElementById('hero-stack')
if (heroVideo && heroPlay && heroStack) {
  heroPlay.addEventListener('click', () => {
    heroVideo.currentTime = 0 // 每次从头播
    void heroVideo.play()
  })
  heroVideo.addEventListener('play', () => heroStack.classList.add('is-playing'))
  heroVideo.addEventListener('ended', () => heroStack.classList.remove('is-playing'))
}
// 进入/离开首页都复位：暂停、回到首帧、回到静态截图并显示播放图标
function resetHeroVideo() {
  if (!heroVideo || !heroStack) return
  heroVideo.pause()
  heroVideo.currentTime = 0
  heroStack.classList.remove('is-playing')
}

function onPageChange(prevPage: HTMLElement, nextPage: HTMLElement) {
  if (prevPage.classList.contains('hero')) resetHeroVideo()
  if (nextPage.classList.contains('hero')) resetHeroVideo()
  if (prevPage.classList.contains('m1-wuther')) unmountWuther()
  if (prevPage.classList.contains('m1-oldman')) unmountOldman()
  if (prevPage.classList.contains('m1-gone')) unmountGone()
  if (prevPage.classList.contains('m2-sherlock')) unmountSherlock()
  if (prevPage.classList.contains('m2-ring')) unmountRing()
  if (prevPage.classList.contains('m3-alice')) unmountAlice()
  if (prevPage.classList.contains('m3-fall')) unmountFall()
  if (prevPage.classList.contains('m4-undertone')) unmountUndertone()
  if (prevPage.classList.contains('m4-veil-smoke')) unmountVeilSmoke()
  if (prevPage.classList.contains('m4-pride')) unmountPride()
  if (nextPage.classList.contains('m1-wuther')) mountWuther()
  if (nextPage.classList.contains('m1-oldman')) mountOldman()
  if (nextPage.classList.contains('m1-gone')) mountGone()
  if (nextPage.classList.contains('m2-sherlock')) mountSherlock()
  if (nextPage.classList.contains('m2-ring')) mountRing()
  if (nextPage.classList.contains('m3-alice')) mountAlice()
  if (nextPage.classList.contains('m3-fall')) mountFall()
  if (nextPage.classList.contains('m4-undertone')) mountUndertone()
  if (nextPage.classList.contains('m4-veil-smoke')) mountVeilSmoke()
  if (nextPage.classList.contains('m4-pride')) mountPride()
}

// 首屏激活页兜底（一般是 hero，不挂）
const active = pages[cur]
if (active?.classList.contains('m1-wuther')) mountWuther()
if (active?.classList.contains('m1-oldman')) mountOldman()
if (active?.classList.contains('m1-gone')) mountGone()
if (active?.classList.contains('m2-sherlock')) mountSherlock()
if (active?.classList.contains('m2-ring')) mountRing()
if (active?.classList.contains('m3-alice')) mountAlice()
if (active?.classList.contains('m3-fall')) mountFall()
if (active?.classList.contains('m4-undertone')) mountUndertone()
if (active?.classList.contains('m4-veil-smoke')) mountVeilSmoke()
if (active?.classList.contains('m4-pride')) mountPride()
