import type { EffectHandle } from '../types'
import type { OldManSkinParams } from './params'
import bg from './bg.mp4'

interface Bolt {
  pts: { x: number; y: number }[]
  branches: { x: number; y: number }[][]
}
interface RainDrop {
  x: number
  y: number
  len: number
  v: number
}
interface Splash {
  x: number
  y: number
  vx: number
  vy: number
  z: number
  size: number
  age: number
  flyDur: number
  max: number
}

// 《老人与海》阅读页皮肤：静态背景；全部文字随浪浮动、闪电随机劈中任意一段文字撕裂、整体发光；
// 风暴氛围（雨/水泼飞溅/闪电/明暗闪烁）支持与 Ocean Storm 同等的全部参数。
export function mountOldManSkin(
  container: HTMLElement,
  initial: OldManSkinParams,
): EffectHandle<OldManSkinParams> {
  ensureFonts()
  ensureStyle()
  let params: OldManSkinParams = { ...initial }

  const root = document.createElement('div')
  root.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;background:#0a0f1c;'
  container.appendChild(root)

  // 背景：海面缓慢涌浪视频（首帧=尾帧无缝循环），带声播放。
  // 浏览器禁止带声 autoplay → 被拒时降级静音播 + 首次交互（点击/触摸/按键）解除静音
  const im = document.createElement('video')
  im.src = bg
  im.autoplay = true
  im.loop = true
  im.playsInline = true
  im.setAttribute('playsinline', '')
  im.setAttribute('webkit-playsinline', '')
  im.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;'
  root.appendChild(im)
  im.muted = false
  im.volume = 1
  im.play().catch(() => {
    im.muted = true
    void im.play().catch(() => {})
    const unmute = () => {
      im.muted = false
      void im.play().catch(() => {})
    }
    window.addEventListener('click', unmute, { once: true })
    window.addEventListener('touchstart', unmute, { once: true, passive: true })
    window.addEventListener('keydown', unmute, { once: true })
  })

  const scrim = document.createElement('div')
  scrim.style.cssText = 'position:absolute;inset:0;pointer-events:none;'
  root.appendChild(scrim)

  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;'
  root.appendChild(canvas)
  const ctx = canvas.getContext('2d')!

  const col = document.createElement('div')
  col.style.cssText = 'position:absolute;inset:0;max-width:390px;margin:0 auto;pointer-events:none;'
  root.appendChild(col)

  const status = document.createElement('div')
  status.style.cssText =
    'position:absolute;left:0;right:0;top:0;height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 20px 0 28px;color:#d4cfc9;'
  status.innerHTML =
    '<span style="font:600 15px/1 -apple-system,system-ui;letter-spacing:-.3px">9:41</span>' +
    '<span style="display:flex;align-items:center;gap:6px">' +
    '<svg width="18" height="11" viewBox="0 0 18 11" fill="#d4cfc9"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="5" y="4.5" width="3" height="6.5" rx="1"/><rect x="10" y="2" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="11" rx="1"/></svg>' +
    '<svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="#d4cfc9" stroke-width="1.4"><path d="M1 4.5a10 10 0 0 1 14 0M3.5 7a6 6 0 0 1 9 0M6 9.3a2.5 2.5 0 0 1 4 0"/></svg>' +
    '<svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="#d4cfc9" stroke-opacity=".5"/><rect x="2" y="2" width="17" height="8" rx="1.5" fill="#d4cfc9"/><rect x="23" y="3.5" width="2" height="5" rx="1" fill="#d4cfc9" fill-opacity=".5"/></svg>' +
    '</span>'
  col.appendChild(status)

  // 整篇可滚动（标题不吸顶，随内容一起滚动）；状态栏下方起，隐藏滚动条
  const scrollWrap = document.createElement('div')
  scrollWrap.className = 'oms-body'
  scrollWrap.style.cssText =
    'position:absolute;left:0;right:0;top:44px;bottom:0;overflow-y:auto;pointer-events:auto;-webkit-overflow-scrolling:touch;'
  col.appendChild(scrollWrap)

  // 浮动内层：标题+副标题+正文一起随浪浮动 / 闪电发光（流式排版，标题在最上）
  const floatInner = document.createElement('div')
  floatInner.style.cssText = 'will-change:transform;padding:34px 0 40px;'
  scrollWrap.appendChild(floatInner)

  const title = document.createElement('h1')
  title.className = 'oms-text'
  title.style.cssText =
    "margin:0 0 0 24px;width:260px;font-family:'Cormorant',Georgia,serif;font-weight:700;font-size:48px;line-height:48px;"
  floatInner.appendChild(title)

  const subtitle = document.createElement('p')
  subtitle.className = 'oms-text'
  subtitle.style.cssText =
    "margin:8px 0 0 28px;font-family:'MiSans VF','PingFang SC',system-ui,sans-serif;font-size:20px;"
  floatInner.appendChild(subtitle)

  const bodyBox = document.createElement('div')
  bodyBox.style.cssText =
    "margin:24px 46px 0 28px;font-family:'Source Serif Pro',Georgia,serif;font-size:21px;line-height:31px;"
  floatInner.appendChild(bodyBox)

  // ── 画布状态 ──
  let W = 0
  let H = 0
  let t = 0
  let timeScale = 1
  let debug = false
  let raf = 0
  let flash = 0
  let nextStrike = 0
  let nextSplash = 0
  let bolts: Bolt[] = []
  let rain: RainDrop[] = []
  let splashes: Splash[] = []

  const dropSprite = document.createElement('canvas')
  const dctx = dropSprite.getContext('2d')!
  function buildDrop() {
    const S = 32
    dropSprite.width = S
    dropSprite.height = S
    const [r, g, b] = hexToRgb(params.dropColor)
    const grad = dctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
    grad.addColorStop(0, `rgba(${r},${g},${b},1)`)
    grad.addColorStop(0.4, `rgba(${r},${g},${b},0.5)`)
    grad.addColorStop(1, `rgba(${r},${g},${b},0)`)
    dctx.clearRect(0, 0, S, S)
    dctx.fillStyle = grad
    dctx.fillRect(0, 0, S, S)
  }

  const dpr = () => Math.min(window.devicePixelRatio || 1, 2)
  const cssSize = () => {
    const r = container.getBoundingClientRect()
    return { w: Math.max(1, r.width), h: Math.max(1, r.height) }
  }

  function build() {
    const { w, h } = cssSize()
    W = w
    H = h
    canvas.width = Math.floor(w * dpr())
    canvas.height = Math.floor(h * dpr())
    ctx.setTransform(dpr(), 0, 0, dpr(), 0, 0)
    buildDrop()
    const n = Math.round(200 * params.rain) + 16
    rain = Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      len: 8 + Math.random() * 14,
      v: 9 + Math.random() * 7,
    }))
  }

  function genBolt(ox: number, ex: number, ey: number): Bolt {
    const jit = params.boltJitter
    const steps = 10
    const pts: { x: number; y: number }[] = []
    for (let i = 0; i <= steps; i++) {
      const p = i / steps
      pts.push({ x: ox + (ex - ox) * p + (Math.random() - 0.5) * jit, y: p * ey })
    }
    const branches: { x: number; y: number }[][] = []
    const nb = Math.floor(Math.random() * 3)
    for (let k = 0; k < nb; k++) {
      const start = pts[2 + Math.floor(Math.random() * (steps - 4))]
      const br: { x: number; y: number }[] = [start]
      let cx = start.x
      let cy = start.y
      const len = 2 + Math.floor(Math.random() * 3)
      for (let j = 0; j < len; j++) {
        cx += (Math.random() - 0.5) * jit * 2.4
        cy += 8 + Math.random() * 26
        br.push({ x: cx, y: cy })
      }
      branches.push(br)
    }
    return { pts, branches }
  }

  function spawnSplash() {
    if (params.splashRate <= 0 || splashes.length > 480) return
    const ox = Math.random() * W
    const oy = H * 0.4 + Math.random() * H * 0.6
    const angle = Math.random() * Math.PI * 2
    const spread = Math.random() * params.splashSpread
    for (let i = 0; i < params.dropsPerBurst; i++) {
      const a = angle + (Math.random() - 0.5) * 2 * spread
      const sp = params.splashSpeed * (0.5 + Math.random())
      splashes.push({
        x: ox,
        y: oy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        z: 0.25 + Math.random() * 0.2,
        size: 3 + Math.random() * 6,
        age: 0,
        flyDur: 12 + Math.random() * 12,
        max: 150 + Math.random() * 130,
      })
    }
  }

  // 闪电：随机劈中任意一段文字 → 撕裂；电弧指向它，外加几条随机
  function strike() {
    flash = 1
    const targets: HTMLElement[] = [title, subtitle, ...(Array.from(bodyBox.children) as HTMLElement[])]
    const target = targets[(Math.random() * targets.length) | 0]
    let tx = Math.random() * W
    let ty = H * 0.5
    if (target) {
      target.style.setProperty('--g', (params.maxGap * 0.5).toFixed(1) + 'px')
      target.classList.remove('oms-struck')
      void target.offsetWidth
      target.classList.add('oms-struck')
      window.setTimeout(() => target.classList.remove('oms-struck'), 560)
      const rr = root.getBoundingClientRect()
      const er = target.getBoundingClientRect()
      tx = er.left - rr.left + er.width / 2
      ty = er.top - rr.top + er.height / 2
    }
    bolts = [genBolt(tx + (Math.random() - 0.5) * 50, tx, ty)]
    const extra = Math.floor(Math.random() * params.maxBolts)
    for (let b = 0; b < extra; b++) {
      const ox = Math.random() * W
      bolts.push(genBolt(ox, ox + (Math.random() - 0.5) * W * 0.2, H * (0.4 + Math.random() * 0.5)))
    }
  }

  function applyFloat() {
    const tb = Math.sin(t * params.bobSpeed) * params.bobAmp * 0.4
    const tr = (Math.sin(t * params.bobSpeed * 0.7) * params.rockDeg * Math.PI) / 180 * 0.35
    floatInner.style.transform = `translateY(${tb.toFixed(2)}px) rotate(${tr.toFixed(4)}rad)`
    floatInner.style.textShadow =
      flash > 0.02 ? `0 0 ${(flash * 12).toFixed(1)}px rgba(205,232,255,${(flash * 0.7).toFixed(2)})` : 'none'
  }

  function render() {
    ctx.clearRect(0, 0, W, H)

    // 背景明暗闪烁
    if (params.flicker > 0) {
      const fl = params.flicker * 0.05 * (0.5 + 0.5 * Math.sin(t * 9))
      ctx.fillStyle = `rgba(180,200,230,${fl.toFixed(3)})`
      ctx.fillRect(0, 0, W, H)
    }

    // 雨
    if (rain.length) {
      ctx.strokeStyle = `rgba(180,205,230,${0.18 + flash * 0.4})`
      ctx.lineWidth = 1
      ctx.beginPath()
      for (const d of rain) {
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x - 2, d.y + d.len)
      }
      ctx.stroke()
    }

    // 水泼飞溅
    if (splashes.length) {
      ctx.save()
      ctx.globalCompositeOperation = 'lighter'
      for (const d of splashes) {
        const a0 = 0.6 + flash * 0.3
        let a = a0
        if (d.age >= d.flyDur) {
          const sAge = d.age - d.flyDur
          const sMax = d.max - d.flyDur
          a = a0 * (sAge < sMax * 0.35 ? 1 : Math.max(0, 1 - (sAge - sMax * 0.35) / (sMax * 0.65)))
        }
        const size = d.size * d.z
        ctx.globalAlpha = a
        ctx.drawImage(dropSprite, d.x - size, d.y - size, size * 2, size * 2)
        ctx.globalAlpha = 1
      }
      ctx.restore()
    }

    // 闪光
    if (flash > 0.01) {
      ctx.fillStyle = `rgba(225,238,255,${flash * 0.22})`
      ctx.fillRect(0, 0, W, H)
    }

    // 电弧
    if (flash > 0.18 && bolts.length) {
      ctx.strokeStyle = `rgba(225,242,255,${flash})`
      ctx.shadowColor = '#bfe0ff'
      ctx.shadowBlur = 16
      for (const bo of bolts) {
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(bo.pts[0].x, bo.pts[0].y)
        for (const p of bo.pts) ctx.lineTo(p.x, p.y)
        ctx.stroke()
        ctx.lineWidth = 1
        for (const br of bo.branches) {
          ctx.beginPath()
          ctx.moveTo(br[0].x, br[0].y)
          for (const p of br) ctx.lineTo(p.x, p.y)
          ctx.stroke()
        }
      }
      ctx.shadowBlur = 0
    }

    applyFloat()

    if (debug) {
      ctx.fillStyle = 'rgba(123,255,206,.9)'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(`flash ${flash.toFixed(2)} · bolts ${bolts.length} · drops ${splashes.length}`, 8, 30)
    }
  }

  function update(dt: number) {
    t += dt
    const f = dt * 60
    flash *= 0.86
    for (const d of rain) {
      d.y += d.v * f
      d.x -= 2 * f
      if (d.y > H) {
        d.y = -d.len
        d.x = Math.random() * W
      }
    }
    for (const d of splashes) {
      d.age += f
      if (d.age < d.flyDur) {
        d.z += params.splashGrowth * 0.05 * f
        d.x += d.vx * d.z * f
        d.y += d.vy * d.z * f
      } else {
        d.vx += (0 - d.vx) * 0.12 * f
        d.vy += (params.slide - d.vy) * 0.06 * f
        d.x += d.vx * f
        d.y += d.vy * f
      }
    }
    splashes = splashes.filter((d) => d.age < d.max && d.x > -120 && d.x < W + 120 && d.y < H + 120)
    if (params.splashRate > 0 && t >= nextSplash) {
      spawnSplash()
      nextSplash = t + (1 / params.splashRate) * (0.6 + Math.random() * 0.8)
    }
    if (params.strikeInterval > 0 && t >= nextStrike) {
      strike()
      nextStrike = t + params.strikeInterval
    }
  }

  function loop() {
    raf = requestAnimationFrame(loop)
    const dt = 0.016 * timeScale
    if (dt > 0) update(dt)
    render()
  }

  // ── DOM 文字内容 ──
  function applyText() {
    title.textContent = params.title
    title.setAttribute('data-text', params.title)
    title.style.color = params.titleColor
    subtitle.textContent = params.subtitle
    subtitle.setAttribute('data-text', params.subtitle)
    subtitle.style.color = params.subtitleColor
    bodyBox.style.color = params.bodyColor
    bodyBox.innerHTML = ''
    params.body.split(/\n\s*\n/).forEach((para) => {
      const txt = para.trim()
      const p = document.createElement('p')
      p.className = 'oms-text'
      p.textContent = txt
      p.setAttribute('data-text', txt)
      p.style.cssText = 'margin:0 0 24px'
      bodyBox.appendChild(p)
    })
  }
  function applyScrim() {
    const s = params.scrim
    scrim.style.background =
      `linear-gradient(180deg, rgba(8,12,20,${(s * 0.7).toFixed(2)}) 0%, rgba(8,12,20,${(s * 0.2).toFixed(2)}) 28%, ` +
      `rgba(8,12,20,${(s * 0.1).toFixed(2)}) 52%, rgba(8,12,20,${(s * 0.55).toFixed(2)}) 100%)`
  }

  applyText()
  applyScrim()
  const ro = new ResizeObserver(() => build())
  ro.observe(container)
  build()
  loop()

  return {
    update(next) {
      Object.assign(params, next)
      const k = Object.keys(next)
      if (k.some((x) => ['title', 'subtitle', 'body', 'titleColor', 'subtitleColor', 'bodyColor'].includes(x))) applyText()
      if (next.scrim !== undefined) applyScrim()
      if (next.dropColor !== undefined) buildDrop()
      if (next.rain !== undefined) build()
    },
    resize() {
      build()
    },
    reset() {
      strike()
    },
    getParams() {
      return { ...params }
    },
    destroy() {
      cancelAnimationFrame(raf)
      ro.disconnect()
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
  if (document.getElementById('oldman-skin-fonts')) return
  const l = document.createElement('link')
  l.id = 'oldman-skin-fonts'
  l.rel = 'stylesheet'
  l.href = 'https://fonts.googleapis.com/css2?family=Cormorant:wght@700&family=Source+Serif+Pro:wght@400&display=swap'
  document.head.appendChild(l)
}
function ensureStyle() {
  if (document.getElementById('oms-style')) return
  const s = document.createElement('style')
  s.id = 'oms-style'
  s.textContent =
    '.oms-body{scrollbar-width:none;-ms-overflow-style:none}.oms-body::-webkit-scrollbar{width:0;height:0;display:none}' +
    '.oms-text{position:relative}' +
    '.oms-text::before,.oms-text::after{content:attr(data-text);position:absolute;left:0;top:0;width:100%;pointer-events:none;opacity:0;color:#eaf4ff}' +
    '.oms-text.oms-struck{color:transparent}' +
    '.oms-text.oms-struck::before{opacity:1;clip-path:inset(0 0 50% 0);text-shadow:0 0 10px #bfe0ff,0 0 22px #7db4ff;animation:oms-ct .55s ease-out forwards}' +
    '.oms-text.oms-struck::after{opacity:1;clip-path:inset(50% 0 0 0);text-shadow:0 0 10px #bfe0ff,0 0 22px #7db4ff;animation:oms-cb .55s ease-out forwards}' +
    '@keyframes oms-ct{0%{transform:translate(0,0)}12%{transform:translate(calc(var(--g,7px)*-1),calc(var(--g,7px)*-0.7)) rotate(-1.2deg)}100%{transform:translate(0,0);opacity:0}}' +
    '@keyframes oms-cb{0%{transform:translate(0,0)}12%{transform:translate(var(--g,7px),calc(var(--g,7px)*0.7)) rotate(1.2deg)}100%{transform:translate(0,0);opacity:0}}'
  document.head.appendChild(s)
}
