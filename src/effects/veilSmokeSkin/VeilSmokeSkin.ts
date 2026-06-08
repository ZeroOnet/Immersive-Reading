import type { EffectHandle } from '../types'
import type { VeilSmokeSkinParams } from './params'
import bgAImg from './bgA.png'
import bgBImg from './bgB.png'
import smokeTextureUrl from './smoke.png'

const DW = 375

// 《面纱·烟雾》皮肤：底部烟雾连续 上下浮动 + 左右循环；点击烟雾在两句台词间切换，
// 切换时 Kalam 主台词以"粒子重组"形式从 A 飞向 B（共享一套粒子，两套目标插值 + 物理 ease）；
// 同步：烟雾基准 Y 平滑漂移、底层人物图 A↔B 渐变、translation 也跟着淡入/淡出
export function mountVeilSmokeSkin(
  container: HTMLElement,
  initial: VeilSmokeSkinParams,
): EffectHandle<VeilSmokeSkinParams> {
  ensureStyles()
  let params: VeilSmokeSkinParams = { ...initial }

  const root = document.createElement('div')
  root.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;background:#000;touch-action:none;'
  container.appendChild(root)

  // 背景：state A / B 各一张整屏图，按 state 交叉淡化
  function mkBg(src: string): HTMLImageElement {
    const el = document.createElement('img')
    el.src = src
    el.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;pointer-events:none;z-index:0;transition:opacity .7s ease;'
    return el
  }
  const bgA = mkBg(bgAImg)
  const bgB = mkBg(bgBImg)
  root.appendChild(bgA)
  root.appendChild(bgB)

  // 压暗（顶轻、底重，保证 Kalam 区可读）
  const scrim = document.createElement('div')
  scrim.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:2;mix-blend-mode:multiply;'
  root.appendChild(scrim)
  // 一抹 teal 偏色（设计 78:7468，#0c3e2e × 20%）
  const tint = document.createElement('div')
  tint.style.cssText = 'position:absolute;inset:0;background:#0c3e2e;opacity:.18;pointer-events:none;z-index:2;'
  root.appendChild(tint)

  // 内容列。pointer-events:none 让点击穿透到下方的烟雾层（标题/正文/状态栏不需点击）
  const col = document.createElement('div')
  col.style.cssText = `position:absolute;left:50%;top:0;width:${DW}px;height:100%;transform:translateX(-50%);z-index:5;pointer-events:none;`
  root.appendChild(col)

  // 状态栏
  const status = document.createElement('div')
  status.style.cssText =
    'position:absolute;left:0;right:0;top:0;height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 20px 0 28px;z-index:6;'
  col.appendChild(status)

  // 标题
  const titleEn = document.createElement('p')
  titleEn.style.cssText =
    "position:absolute;left:28px;right:18px;top:104px;margin:0;font-family:'Bodoni 72','Bodoni Moda',serif;font-weight:400;font-size:42px;letter-spacing:-.42px;line-height:34px;color:#b48d5d;white-space:nowrap;"
  col.appendChild(titleEn)
  const titleZh = document.createElement('p')
  titleZh.style.cssText =
    "position:absolute;left:28px;top:144px;margin:0;font-family:'Source Han Serif CN','Songti SC',serif;font-weight:600;font-size:33px;color:#b48d5d;white-space:nowrap;"
  col.appendChild(titleZh)

  // 正文
  const body = document.createElement('p')
  body.style.cssText =
    "position:absolute;left:28px;top:209px;width:256px;margin:0;font-family:'Source Serif Pro',Georgia,serif;font-weight:400;font-size:21px;line-height:32px;color:#b3b0a6;white-space:pre-wrap;"
  col.appendChild(body)

  // 烟雾画布全屏：上方留出空间让 plane 自然淡出，避免硬切；生成区域仍只在底部 340px
  const SMOKE_GEN_H = 340
  const smokeWrap = document.createElement('div')
  smokeWrap.style.cssText = 'position:absolute;inset:0;pointer-events:auto;cursor:pointer;z-index:3;'
  root.appendChild(smokeWrap)
  const smokeCanvas = document.createElement('canvas')
  smokeCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;'
  smokeWrap.appendChild(smokeCanvas)
  const skCtx = smokeCanvas.getContext('2d')!

  // 真实烟雾贴图（codepen NWqPXGX 同款 Smoke-Element.png）—— 比任何程序化 sprite 都自然。
  // 复刻其 Three.js 做法但移到 2D：N 个面片随机位置/尺寸/旋转，每帧自转 → 多片重叠就像翻滚烟雾
  const smokeTex = new Image()
  smokeTex.src = smokeTextureUrl
  interface Plane {
    x: number
    y: number
    size: number
    rotation: number
    rotSpeed: number
    alpha: number
  }
  let planes: Plane[] = []
  let SW = 0
  let SH = 0
  function spawnPlane(): Plane {
    // y 仍只在画布底部 SMOKE_GEN_H 范围内生成；canvas 全屏只是给上缘留淡出空间
    const genTop = SH - SMOKE_GEN_H
    return {
      x: (Math.random() - 0.15) * SW * 1.3, // 略向外溢出，避免侧边露空
      y: genTop + Math.random() * SMOKE_GEN_H * 1.1,
      size: 240 + Math.random() * 280,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.32,
      alpha: 0.07 + Math.random() * 0.13, // 单片更低 alpha → 整体更稀薄
    }
  }
  function sizeSmoke() {
    const r = smokeWrap.getBoundingClientRect()
    SW = Math.max(1, r.width)
    SH = Math.max(1, r.height)
    const dp = Math.min(window.devicePixelRatio || 1, 2)
    smokeCanvas.width = Math.floor(SW * dp)
    smokeCanvas.height = Math.floor(SH * dp)
    skCtx.setTransform(dp, 0, 0, dp, 0, 0)
    planes = Array.from({ length: 75 }, spawnPlane) // 数量从 120 减到 75
  }
  function tickSmoke(dt: number) {
    for (const p of planes) p.rotation += p.rotSpeed * dt
  }
  function drawSmoke() {
    skCtx.clearRect(0, 0, SW, SH)
    if (!smokeTex.complete || smokeTex.naturalWidth === 0) return
    // 烟雾只在 A 显示：(1 - state) 0→1 之间渐变；进 B 自动渐隐、回 A 自动渐出
    const visAlpha = 1 - Math.max(0, Math.min(1, params.state))
    if (visAlpha <= 0.005) return
    for (const p of planes) {
      skCtx.globalAlpha = p.alpha * visAlpha
      skCtx.save()
      skCtx.translate(p.x, p.y)
      skCtx.rotate(p.rotation)
      skCtx.drawImage(smokeTex, -p.size / 2, -p.size / 2, p.size, p.size)
      skCtx.restore()
    }
    skCtx.globalAlpha = 1
  }

  // Kalam 台词粒子画布（z:4，在烟雾之上但不挡点击）
  const fxCanvas = document.createElement('canvas')
  fxCanvas.style.cssText = 'position:absolute;left:0;right:0;top:580px;height:90px;width:100%;pointer-events:none;z-index:4;'
  col.appendChild(fxCanvas)
  const fxCtx = fxCanvas.getContext('2d')!

  // 译文（DOM，淡入淡出 A↔B）
  const trA = document.createElement('p')
  trA.style.cssText =
    "position:absolute;left:0;right:0;top:670px;margin:0;text-align:center;font-family:'Source Han Sans CN','PingFang SC',sans-serif;font-weight:300;font-size:20px;color:rgba(255,255,255,.65);transition:opacity .4s ease;pointer-events:none;z-index:5;"
  col.appendChild(trA)
  const trB = document.createElement('p')
  trB.style.cssText = trA.style.cssText
  col.appendChild(trB)

  // ── 粒子（共享一套，两套 target 插值）──
  interface P {
    x: number
    y: number
    tAx: number
    tAy: number
    tBx: number
    tBy: number
  }
  let particles: P[] = []
  let CW = 0
  let CH = 0
  function sizeCanvas() {
    const r = fxCanvas.getBoundingClientRect()
    CW = Math.max(1, r.width)
    CH = Math.max(1, r.height)
    const dp = Math.min(window.devicePixelRatio || 1, 2)
    fxCanvas.width = Math.floor(CW * dp)
    fxCanvas.height = Math.floor(CH * dp)
    fxCtx.setTransform(dp, 0, 0, dp, 0, 0)
  }
  // 离屏采样：把文本画到离屏 canvas，按 alpha 取像素点。
  // 如果任何一行宽度超过画布有效宽度，整段按比例缩字号 → 避免长文案左右出界
  function sampleText(text: string, fontPx: number, lineH: number): { x: number; y: number }[] {
    const off = document.createElement('canvas')
    const dp = Math.min(window.devicePixelRatio || 1, 2)
    const lines = text.split('\n')
    const w = CW
    const h = CH
    off.width = Math.ceil(w * dp)
    off.height = Math.ceil(h * dp)
    const oc = off.getContext('2d')!
    oc.setTransform(dp, 0, 0, dp, 0, 0)
    // 先用初始字号探测每行宽度，必要时缩小到能塞进 maxW
    const maxW = w - 24 // 左右各留 12px 边距
    oc.font = `400 ${fontPx}px Kalam, cursive`
    let widest = 0
    for (const ln of lines) widest = Math.max(widest, oc.measureText(ln).width)
    let fs = fontPx
    let lh = lineH
    if (widest > maxW) {
      const k = maxW / widest
      fs = fontPx * k
      lh = lineH * k
    }
    oc.fillStyle = '#fff'
    oc.font = `400 ${fs}px Kalam, cursive`
    oc.textAlign = 'center'
    oc.textBaseline = 'middle'
    const total = (lines.length - 1) * lh + fs
    const startY = (h - total) / 2 + fs / 2
    lines.forEach((ln, i) => oc.fillText(ln, w / 2, startY + i * lh))
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
  function rebuild() {
    sizeCanvas()
    const aPts = sampleText(params.phraseA, 31, 40)
    const bPts = sampleText(params.phraseB, 30, 36)
    const N = Math.max(aPts.length, bPts.length)
    const newPs: P[] = []
    for (let i = 0; i < N; i++) {
      const a = aPts[i % aPts.length]
      const b = bPts[i % bPts.length]
      const old = particles[i]
      newPs.push({
        x: old?.x ?? a.x,
        y: old?.y ?? a.y,
        tAx: a.x,
        tAy: a.y,
        tBx: b.x,
        tBy: b.y,
      })
    }
    particles = newPs
  }

  function lerpColor(a: string, b: string, t: number): string {
    const [ar, ag, ab] = hexToRgb(a)
    const [br, bg, bb] = hexToRgb(b)
    return `rgba(${Math.round(ar + (br - ar) * t)},${Math.round(ag + (bg - ag) * t)},${Math.round(ab + (bb - ab) * t)},1)`
  }

  function drawParticles() {
    const s = Math.max(0, Math.min(1, params.state))
    fxCtx.clearRect(0, 0, CW, CH)
    const col = lerpColor(params.phraseAColor, params.phraseBColor, s)
    fxCtx.fillStyle = col
    fxCtx.shadowColor = col
    fxCtx.shadowBlur = 3
    for (const p of particles) fxCtx.fillRect(p.x, p.y, 2, 2)
    fxCtx.shadowBlur = 0
  }
  function tickParticles() {
    const s = Math.max(0, Math.min(1, params.state))
    for (const p of particles) {
      const tx = p.tAx + (p.tBx - p.tAx) * s
      const ty = p.tAy + (p.tBy - p.tAy) * s
      p.x += (tx - p.x) * 0.16
      p.y += (ty - p.y) * 0.16
    }
  }

  // 不再做整层位移；切换由"厚→薄→厚"脉冲驱动（薄时切 state，状态变化在视觉上"被烟雾盖住"）
  function applySmoke() {
    /* no-op — 脉冲与位置无关 */
  }
  function applyForegroundFade() {
    const s = Math.max(0, Math.min(1, params.state))
    bgA.style.opacity = (1 - s).toFixed(3)
    bgB.style.opacity = s.toFixed(3)
  }
  function applyTranslationFade() {
    const s = Math.max(0, Math.min(1, params.state))
    trA.style.opacity = (1 - s).toFixed(3)
    trB.style.opacity = s.toFixed(3)
  }

  // 主循环：推进文字粒子 + 推进烟雾 puff
  let raf = 0
  let lastT = performance.now()
  function loop() {
    raf = requestAnimationFrame(loop)
    const now = performance.now()
    const dt = Math.min(0.05, (now - lastT) / 1000)
    lastT = now
    tickSmoke(dt)
    drawSmoke()
    tickParticles()
    drawParticles()
  }

  // ── state 自驱动平滑（click 触发瞬间，state 从当前值动画到目标值；Lab 拖滑杆时直接设）
  let stateTween = 0
  let stateTarget = params.state
  function tweenState(to: number) {
    stateTarget = to
    if (stateTween) return
    const step = () => {
      const cur = params.state
      const next = cur + (stateTarget - cur) * 0.07
      if (Math.abs(stateTarget - next) < 0.003) {
        params.state = stateTarget
        applySmoke()
        applyForegroundFade()
        applyTranslationFade()
        stateTween = 0
        return
      }
      params.state = next
      applySmoke()
      applyForegroundFade()
      applyTranslationFade()
      stateTween = requestAnimationFrame(step)
    }
    stateTween = requestAnimationFrame(step)
  }

  // 点击 → 直接 tweenState；烟雾 alpha 绑定 (1 - state)，过渡中自然渐隐/渐出
  const onSmokeClick = (e: Event) => {
    e.stopPropagation()
    tweenState(params.state > 0.5 ? 0 : 1)
  }
  smokeWrap.addEventListener('click', onSmokeClick)

  // ── apply 系列 ──
  function applyText() {
    titleEn.textContent = params.titleEn
    titleZh.textContent = params.titleZh
    body.innerHTML = params.body.replace(/\n/g, '<br/>')
    body.style.color = params.bodyColor
    trA.textContent = params.phraseAZh
    trB.textContent = params.phraseBZh
  }
  function applyScrim() {
    const s = params.scrim
    scrim.style.background = `linear-gradient(180deg, rgba(0,0,0,0) 25%, rgba(0,0,0,${(s * 0.85).toFixed(2)}) 100%)`
  }
  function applyStatus() {
    const c = params.timeColor
    status.innerHTML =
      `<span style="font:600 15px/1 -apple-system,system-ui;letter-spacing:-.3px;color:${c}">9:41</span>` +
      '<span style="display:flex;align-items:center;gap:6px">' +
      `<svg width="18" height="11" viewBox="0 0 18 11" fill="${c}"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="5" y="4.5" width="3" height="6.5" rx="1"/><rect x="10" y="2" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="11" rx="1"/></svg>` +
      `<svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="${c}" stroke-width="1.4"><path d="M1 4.5a10 10 0 0 1 14 0M3.5 7a6 6 0 0 1 9 0M6 9.3a2.5 2.5 0 0 1 4 0"/></svg>` +
      `<svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="${c}" stroke-opacity=".5"/><rect x="2" y="2" width="17" height="8" rx="1.5" fill="${c}"/><rect x="23" y="3.5" width="2" height="5" rx="1" fill="${c}" fill-opacity=".5"/></svg>` +
      '</span>'
  }

  applyText()
  applyScrim()
  applyStatus()
  applySmoke()
  applyForegroundFade()
  applyTranslationFade()
  sizeSmoke()
  // 等字体加载完再采样，避免落到 cursive 系统兜底（位置会大幅偏）
  ;(document.fonts?.ready ?? Promise.resolve()).then(() => rebuild())
  // 兜底：字体未加载也先用现有字形采一遍（出现 Kalam 后会被 update text/state 再触发）
  rebuild()

  const ro = new ResizeObserver(() => {
    rebuild()
    sizeSmoke()
  })
  ro.observe(fxCanvas)
  ro.observe(smokeWrap)
  loop()

  return {
    update(next) {
      Object.assign(params, next)
      const keys = Object.keys(next)
      if (keys.some((k) => ['titleEn', 'titleZh', 'body', 'bodyColor', 'phraseAZh', 'phraseBZh'].includes(k))) applyText()
      if (keys.some((k) => ['phraseA', 'phraseB'].includes(k))) rebuild()
      if (next.scrim !== undefined) applyScrim()
      if (next.timeColor !== undefined) applyStatus()
      if (next.state !== undefined) {
        applySmoke()
        applyForegroundFade()
        applyTranslationFade()
      }
    },
    resize() {
      rebuild()
    },
    reset() {
      params.state = 0
      stateTarget = 0
      applySmoke()
      applyForegroundFade()
      applyTranslationFade()
    },
    getParams() {
      return { ...params }
    },
    destroy() {
      cancelAnimationFrame(raf)
      if (stateTween) cancelAnimationFrame(stateTween)
      ro.disconnect()
      smokeWrap.removeEventListener('click', onSmokeClick)
      root.remove()
    },
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function ensureStyles() {
  if (document.getElementById('veil-smoke-fonts')) return
  const l = document.createElement('link')
  l.id = 'veil-smoke-fonts'
  l.rel = 'stylesheet'
  l.href =
    'https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@400;500&family=Source+Serif+Pro:wght@400&family=Kalam:wght@300;400;700&display=swap'
  document.head.appendChild(l)
}
