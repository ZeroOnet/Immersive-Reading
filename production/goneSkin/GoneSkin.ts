import type { EffectHandle } from '../types'
import type { GoneSkinParams } from './params'
import bgVideo from './bg.mp4'
import ov2 from './ov2.png'
import titleArt from './title.png'

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
}

// 《飘》阅读页皮肤（Figma 9:689）：设计稿火/战争背景 + 艺术字标题；
// Page Burn 把页面边缘炭化燃烧（透明底，烧穿处露出背景的火）、余烬前沿向内推进、火星升腾。
export function mountGoneSkin(container: HTMLElement, initial: GoneSkinParams): EffectHandle<GoneSkinParams> {
  ensureFonts()
  let params: GoneSkinParams = { ...initial }

  const root = document.createElement('div')
  root.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;background:#160a06;touch-action:none;'
  container.appendChild(root)

  // 背景：火光燃烧视频（首帧=尾帧无缝循环），带声播放。
  // 视频相对屏幕(375×794)的位置/尺寸取自 Figma node 345:474（x=0 y=0 w=375 h=794）；溢出由 root overflow:hidden 裁掉
  // 浏览器禁止带声 autoplay → 被拒时降级静音播 + 首次交互（点击/触摸/按键）解除静音
  const BG_VIDEO_FRAME = { left: 0, top: 0, width: 375, height: 794 }
  const bg = document.createElement('video')
  bg.src = bgVideo
  bg.autoplay = true
  bg.loop = true
  bg.playsInline = true
  bg.setAttribute('playsinline', '')
  bg.setAttribute('webkit-playsinline', '')
  bg.style.cssText =
    `position:absolute;left:${BG_VIDEO_FRAME.left}px;top:${BG_VIDEO_FRAME.top}px;width:${BG_VIDEO_FRAME.width}px;height:${BG_VIDEO_FRAME.height}px;` +
    'object-fit:cover;pointer-events:none;'
  root.appendChild(bg)
  bg.muted = false
  bg.volume = 1
  bg.play().catch(() => {
    bg.muted = true
    void bg.play().catch(() => {})
    const unmute = () => {
      bg.muted = false
      void bg.play().catch(() => {})
    }
    window.addEventListener('click', unmute, { once: true })
    window.addEventListener('touchstart', unmute, { once: true, passive: true })
    window.addEventListener('keydown', unmute, { once: true })
  })
  const tint = document.createElement('img')
  tint.src = ov2
  tint.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;'
  root.appendChild(tint)

  const scrim = document.createElement('div')
  scrim.style.cssText = 'position:absolute;inset:0;pointer-events:none;'
  root.appendChild(scrim)

  // Page Burn 画布（炭化前沿 + 火星），透明底，在背景之上、文字之下
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;'
  root.appendChild(canvas)
  const ctx = canvas.getContext('2d')!
  const burnCv = document.createElement('canvas')
  const burnCtx = burnCv.getContext('2d')!

  const col = document.createElement('div')
  col.style.cssText = 'position:absolute;inset:0;max-width:390px;margin:0 auto;pointer-events:none;z-index:1;'
  root.appendChild(col)

  const status = document.createElement('div')
  status.style.cssText =
    'position:absolute;left:0;right:0;top:0;height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 20px 0 28px;color:#d4cfc9;z-index:3;'
  status.innerHTML =
    '<span style="font:600 15px/1 -apple-system,system-ui;letter-spacing:-.3px">9:41</span>' +
    '<span style="display:flex;align-items:center;gap:6px">' +
    '<svg width="18" height="11" viewBox="0 0 18 11" fill="#d4cfc9"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="5" y="4.5" width="3" height="6.5" rx="1"/><rect x="10" y="2" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="11" rx="1"/></svg>' +
    '<svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="#d4cfc9" stroke-width="1.4"><path d="M1 4.5a10 10 0 0 1 14 0M3.5 7a6 6 0 0 1 9 0M6 9.3a2.5 2.5 0 0 1 4 0"/></svg>' +
    '<svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="#d4cfc9" stroke-opacity=".5"/><rect x="2" y="2" width="17" height="8" rx="1.5" fill="#d4cfc9"/><rect x="23" y="3.5" width="2" height="5" rx="1" fill="#d4cfc9" fill-opacity=".5"/></svg>' +
    '</span>'
  root.appendChild(status) // 状态栏在灰烬层之上，始终可见

  const titleEl = document.createElement('img')
  titleEl.src = titleArt
  titleEl.alt = 'Gone with the Wind'
  titleEl.style.cssText = 'position:absolute;left:24px;top:76px;width:241px;height:auto;pointer-events:none;'
  col.appendChild(titleEl)

  const subtitle = document.createElement('p')
  subtitle.style.cssText =
    "position:absolute;left:28px;top:180px;margin:0;font-family:'Source Han Serif CN','Songti SC',serif;font-weight:400;font-size:28px;"
  col.appendChild(subtitle)

  const bodyBox = document.createElement('div')
  bodyBox.style.cssText =
    "position:absolute;left:28px;top:238px;width:301px;font-family:'Source Serif Pro',Georgia,serif;font-weight:300;font-size:21px;line-height:31px;"
  col.appendChild(bodyBox)

  const quote = document.createElement('p')
  quote.style.cssText =
    "position:absolute;left:28px;top:610px;width:236px;margin:0;font-family:'Kalam',cursive;font-size:28px;line-height:34px;"
  col.appendChild(quote)

  // ── 画布状态 ──
  let BW = 0
  let BH = 0
  let t = 0
  let timeScale = 1
  let debug = false
  let raf = 0
  let seed = Math.random() * 1000
  let D = new Float32Array(0)
  let E = new Float32Array(0) // 手动擦除强度（0=未擦除，1=完全擦掉灰烬→露出内容）
  let eraseDirty = false
  let out: ImageData | null = null
  let rimPts: number[] = []
  // 开场动画：燃烧进度从 1 退到 params.burn（满屏黑灰烬 → 显出内容）
  let introBurn = 1
  let introActive = true
  const curBurn = () => (introActive ? introBurn : params.burn)
  let sparks: Spark[] = []

  const rand2 = (x: number, y: number, s: number) => {
    const n = Math.sin(x * 127.1 + y * 311.7 + s * 53.7) * 43758.5453
    return n - Math.floor(n)
  }
  function vnoise(px: number, py: number, freq: number, s: number) {
    const x = px * freq
    const y = py * freq
    const x0 = Math.floor(x)
    const y0 = Math.floor(y)
    const fx = x - x0
    const fy = y - y0
    const a = rand2(x0, y0, s)
    const b = rand2(x0 + 1, y0, s)
    const c = rand2(x0, y0 + 1, s)
    const d = rand2(x0 + 1, y0 + 1, s)
    const u = fx * fx * (3 - 2 * fx)
    const v = fy * fy * (3 - 2 * fy)
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
  }
  const fbm = (px: number, py: number) => {
    let f = 0
    let amp = 0.5
    let fr = 1
    for (let i = 0; i < 3; i++) {
      f += amp * vnoise(px, py, 0.012 * fr, seed + i)
      fr *= 2
      amp *= 0.5
    }
    return f
  }
  const smoothstep = (a: number, b: number, x: number) => {
    const k = Math.max(0, Math.min(1, (x - a) / (b - a || 1)))
    return k * k * (3 - 2 * k)
  }

  const cssSize = () => {
    const r = container.getBoundingClientRect()
    return { w: Math.max(1, r.width), h: Math.max(1, r.height) }
  }

  function build() {
    const { w, h } = cssSize()
    const scale = Math.min(1.3, 1000 / Math.max(w, h))
    BW = Math.max(1, Math.round(w * scale))
    BH = Math.max(1, Math.round(h * scale))
    canvas.width = BW
    canvas.height = BH
    burnCv.width = BW
    burnCv.height = BH
    D = new Float32Array(BW * BH)
    E = new Float32Array(BW * BH)
    const reach = params.edgeReach * Math.min(BW, BH)
    for (let py = 0; py < BH; py++) {
      for (let px = 0; px < BW; px++) {
        const dEdge = Math.min(px, py, BW - 1 - px, BH - 1 - py)
        const edgeF = 1 - smoothstep(0, reach, dEdge)
        const d = 1 - edgeF + (fbm(px, py) - 0.5) * params.ragged
        D[py * BW + px] = d < 0 ? 0 : d > 1 ? 1 : d
      }
    }
    out = burnCtx.createImageData(BW, BH)
    compose()
  }

  // 烧过区域=不透明黑色灰烬(带颗粒)；余烬鳞带(ember→char)；内侧焦黄；完好中心透明(显示内容)。
  function compose() {
    if (!out) return
    const o = out.data
    rimPts = []
    const burn = curBurn()
    // burn≈0：完全完好，全透明
    if (burn <= 0.001) {
      for (let p = 3; p < o.length; p += 4) o[p] = 0
      burnCtx.putImageData(out, 0, 0)
      return
    }
    const ember = params.ember
    const scorch = 0.06
    const [cr, cg, cb] = hexToRgb(params.charColor)
    const [er, eg, eb] = hexToRgb(params.emberColor)
    const [ar, ag, ab] = hexToRgb(params.ashColor)
    for (let i = 0, p = 0; i < D.length; i++, p += 4) {
      const d = D[i] - burn
      if (d >= ember + scorch) {
        o[p + 3] = 0 // 完好中心：透明
      } else if (d < -ember) {
        // 烧过 → 黑色灰烬（颗粒感）
        const py = (i / BW) | 0
        const px = i - py * BW
        const lum = 0.55 + 0.6 * rand2(px, py, seed + 9)
        o[p] = Math.min(255, ar * lum)
        o[p + 1] = Math.min(255, ag * lum)
        o[p + 2] = Math.min(255, ab * lum)
        o[p + 3] = 255
      } else if (d < ember) {
        // 余烬鳞带 ember→char
        const h = 1 - (d + ember) / (2 * ember)
        let r, g, b
        if (h > 0.6) {
          const k = (h - 0.6) / 0.4
          r = er + (255 - er) * k
          g = eg + (235 - eg) * k
          b = eb + (180 - eb) * k
        } else {
          const k = h / 0.6
          r = cr + (er - cr) * k
          g = cg + (eg - cg) * k
          b = cb + (eb - cb) * k
        }
        o[p] = r
        o[p + 1] = g
        o[p + 2] = b
        o[p + 3] = 255
        if ((i & 31) === 0 && rimPts.length < 4000) {
          const ry = (i / BW) | 0
          rimPts.push(i - ry * BW, ry)
        }
      } else {
        // 焦黄过渡（内侧，半透明压暗）
        const s = 1 - (d - ember) / scorch
        o[p] = cr
        o[p + 1] = cg
        o[p + 2] = cb
        o[p + 3] = (s * 150) | 0
      }
      // 手动擦除：滑过处把灰烬透明度抹掉，露出下方内容
      const e = E[i]
      if (e > 0 && o[p + 3] > 0) o[p + 3] = (o[p + 3] * (1 - e)) | 0
    }
    burnCtx.putImageData(out, 0, 0)
  }

  function spawnSparks() {
    if (rimPts.length < 2) return
    const n = Math.round(params.sparks * 0.1)
    for (let i = 0; i < n; i++) {
      const k = ((Math.random() * (rimPts.length >> 1)) | 0) * 2
      sparks.push({
        x: rimPts[k],
        y: rimPts[k + 1],
        vx: (Math.random() - 0.5) * 0.5,
        vy: -(0.4 + Math.random() * 1.4),
        life: 0,
        max: 40 + Math.random() * 60,
      })
    }
    if (sparks.length > 700) sparks = sparks.slice(-700)
  }

  function render() {
    ctx.clearRect(0, 0, BW, BH)
    ctx.drawImage(burnCv, 0, 0)
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    for (const s of sparks) {
      const a = Math.max(0, 1 - s.life / s.max)
      ctx.fillStyle = `rgba(255,${(150 + 80 * a) | 0},70,${a})`
      ctx.fillRect(s.x, s.y, 1.4, 1.4)
    }
    ctx.restore()
    if (debug) {
      ctx.fillStyle = 'rgba(123,255,206,.9)'
      ctx.font = '10px ui-monospace, monospace'
      ctx.fillText(`burn ${params.burn.toFixed(2)} · sparks ${sparks.length}`, 6, 14)
    }
  }

  function update(dt: number) {
    t += dt
    const f = dt * 60
    // 开场：燃烧进度从 1 缓动到目标，逐帧重算灰烬（一次性）
    if (introActive) {
      introBurn += (params.burn - introBurn) * 0.045 * f
      if (Math.abs(introBurn - params.burn) < 0.004) {
        introActive = false
        introBurn = params.burn
      }
      compose()
    }
    spawnSparks()
    for (const s of sparks) {
      s.x += s.vx * f
      s.y += s.vy * f
      s.vx += (Math.random() - 0.5) * 0.1
      s.life += f
    }
    sparks = sparks.filter((s) => s.life < s.max)
  }

  function loop() {
    raf = requestAnimationFrame(loop)
    const dt = 0.016 * timeScale
    if (dt > 0) update(dt)
    if (eraseDirty) {
      if (!introActive) compose() // intro 期间 update() 每帧已重算
      eraseDirty = false
    }
    render()
  }

  // ── 滑动擦除：手指/鼠标划过的灰烬被抹掉，露出下方文字 ──
  let dragging = false
  let lastFx = 0
  let lastFy = 0
  const toField = (e: PointerEvent) => {
    const r = container.getBoundingClientRect()
    return {
      fx: ((e.clientX - r.left) / Math.max(1, r.width)) * BW,
      fy: ((e.clientY - r.top) / Math.max(1, r.height)) * BH,
    }
  }
  function stamp(fx: number, fy: number) {
    const R = Math.max(6, params.eraseRadius * Math.min(BW, BH))
    const R2 = R * R
    const x0 = Math.max(0, Math.floor(fx - R))
    const x1 = Math.min(BW - 1, Math.ceil(fx + R))
    const y0 = Math.max(0, Math.floor(fy - R))
    const y1 = Math.min(BH - 1, Math.ceil(fy + R))
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - fx
        const dy = y - fy
        const d2 = dx * dx + dy * dy
        if (d2 > R2) continue
        const fall = 1 - Math.sqrt(d2) / R
        const v = E[y * BW + x] + fall * fall * 0.85
        E[y * BW + x] = v > 1 ? 1 : v
      }
    }
  }
  function paintTo(fx: number, fy: number) {
    const dx = fx - lastFx
    const dy = fy - lastFy
    const step = Math.max(1, params.eraseRadius * Math.min(BW, BH) * 0.4)
    const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / step))
    for (let k = 1; k <= n; k++) stamp(lastFx + (dx * k) / n, lastFy + (dy * k) / n)
    lastFx = fx
    lastFy = fy
    eraseDirty = true
  }
  const onMove = (e: PointerEvent) => {
    if (!dragging) return
    const { fx, fy } = toField(e)
    paintTo(fx, fy)
  }
  const onUp = () => {
    dragging = false
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', onUp)
  }
  const onDown = (e: PointerEvent) => {
    dragging = true
    const { fx, fy } = toField(e)
    lastFx = fx
    lastFy = fy
    stamp(fx, fy)
    eraseDirty = true
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }
  root.addEventListener('pointerdown', onDown)

  function applyText() {
    subtitle.textContent = params.subtitle
    subtitle.style.color = params.subtitleColor
    quote.textContent = params.quote
    quote.style.color = params.quoteColor
    bodyBox.style.color = params.bodyColor
    bodyBox.innerHTML = ''
    params.body.split(/\n\s*\n/).forEach((para, i) => {
      const p = document.createElement('p')
      p.textContent = para.trim()
      p.style.cssText = i === 0 ? 'margin:0' : 'margin:24px 0 0'
      bodyBox.appendChild(p)
    })
  }
  function applyScrim() {
    const s = params.scrim
    scrim.style.background =
      `linear-gradient(180deg, rgba(10,5,3,${(s * 0.7).toFixed(2)}) 0%, rgba(10,5,3,${(s * 0.15).toFixed(2)}) 30%, ` +
      `rgba(10,5,3,${(s * 0.1).toFixed(2)}) 55%, rgba(10,5,3,${(s * 0.6).toFixed(2)}) 100%)`
  }

  applyText()
  applyScrim()
  const ro = new ResizeObserver(() => build())
  ro.observe(container)
  build()
  loop()

  const STRUCTURAL = ['edgeReach', 'ragged']
  return {
    update(next) {
      const keys = Object.keys(next)
      Object.assign(params, next)
      if (keys.some((k) => ['subtitle', 'body', 'quote', 'subtitleColor', 'bodyColor', 'quoteColor'].includes(k))) applyText()
      if (next.scrim !== undefined) applyScrim()
      if (keys.some((k) => STRUCTURAL.includes(k))) build()
      else if (keys.some((k) => ['burn', 'ember', 'charColor', 'emberColor', 'ashColor'].includes(k))) compose()
    },
    resize() {
      build()
    },
    reset() {
      seed = Math.random() * 1000
      sparks = []
      introBurn = 1
      introActive = true // 重放开场动画
      build()
    },
    getParams() {
      return { ...params }
    },
    destroy() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      root.remove()
    },
    setTimeScale(s) {
      timeScale = s
    },
    step() {
      update(0.016)
      render()
    },
    setDebug(on) {
      debug = on
    },
    snapshot() {
      return canvas.toDataURL('image/png')
    },
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function ensureFonts() {
  if (document.getElementById('gone-skin-fonts')) return
  const l = document.createElement('link')
  l.id = 'gone-skin-fonts'
  l.rel = 'stylesheet'
  l.href = 'https://fonts.googleapis.com/css2?family=Source+Serif+Pro:wght@300&family=Kalam:wght@400&display=swap'
  document.head.appendChild(l)
}
