import type { EffectHandle } from '../types'
import type { OceanStormParams } from './params'

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
  z: number // 朝镜头逼近：越大越近越大越快
  size: number
  age: number
  flyDur: number // 喷射时长（帧），之后转为缓慢下滑
  max: number
}

// 海上雷暴：天空 + 雨 + 文字浮动摇晃；海"浪"是一簇簇水珠以随机角度/散开度泼向镜头、由小变大带拖影；
// 闪电随机劈下一/多条照亮天空；命中时文字被劈裂。配程序化海浪+雷声（需手势）。
export function mountOceanStorm(
  container: HTMLElement,
  initial: OceanStormParams,
): EffectHandle<OceanStormParams> {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'display:block;width:100%;height:100%'
  container.appendChild(canvas)
  const ctx = canvas.getContext('2d')!

  let params: OceanStormParams = { ...initial }
  let W = 0
  let H = 0
  let t = 0
  let timeScale = 1
  let debug = false
  let raf = 0

  let flash = 0
  let crack = 0
  let nextStrike = 0
  let nextSplash = 0
  let bolts: Bolt[] = []
  let seam: { x: number; y: number }[] = []
  let rain: RainDrop[] = []
  let splashes: Splash[] = []

  const textImg = document.createElement('canvas')
  const tctx = textImg.getContext('2d')!
  let tw = 0
  let th = 0

  // 水珠柔光贴图（按 dropColor 预渲染）
  const drop = document.createElement('canvas')
  const dctx = drop.getContext('2d')!
  function buildDrop() {
    const S = 32
    drop.width = S
    drop.height = S
    const g = dctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
    g.addColorStop(0, withAlpha(params.dropColor, 1))
    g.addColorStop(0.4, withAlpha(params.dropColor, 0.5))
    g.addColorStop(1, withAlpha(params.dropColor, 0))
    dctx.clearRect(0, 0, S, S)
    dctx.fillStyle = g
    dctx.fillRect(0, 0, S, S)
  }

  const dpr = () => Math.min(window.devicePixelRatio || 1, 2)
  const cssSize = () => {
    const r = container.getBoundingClientRect()
    return { w: Math.max(1, r.width), h: Math.max(1, r.height) }
  }

  function buildText() {
    let fs = Math.min(W * 0.08, 52)
    tctx.font = `600 ${fs}px "Iowan Old Style", Georgia, serif`
    const m = tctx.measureText(params.text).width || 1
    if (m > W * 0.82) fs = (fs * (W * 0.82)) / m
    tw = Math.ceil(Math.min(W * 0.9, m) + fs)
    th = Math.ceil(fs * 1.6)
    textImg.width = Math.max(1, Math.floor(tw * dpr()))
    textImg.height = Math.max(1, Math.floor(th * dpr()))
    tctx.setTransform(dpr(), 0, 0, dpr(), 0, 0)
    tctx.clearRect(0, 0, tw, th)
    tctx.font = `600 ${fs}px "Iowan Old Style", Georgia, serif`
    tctx.fillStyle = params.color
    tctx.textAlign = 'center'
    tctx.textBaseline = 'middle'
    tctx.fillText(params.text, tw / 2, th / 2)
  }

  function build() {
    const { w, h } = cssSize()
    W = w
    H = h
    canvas.width = Math.floor(w * dpr())
    canvas.height = Math.floor(h * dpr())
    ctx.setTransform(dpr(), 0, 0, dpr(), 0, 0)
    buildText()
    buildDrop()
    const n = Math.round(220 * params.rain) + 20
    rain = Array.from({ length: n }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      len: 8 + Math.random() * 14,
      v: 9 + Math.random() * 7,
    }))
  }

  // 一簇水珠泼向镜头：随机起点、随机中心角度、随机散开
  function spawnSplash() {
    if (splashes.length > 520) return
    const ox = Math.random() * W
    const oy = H * 0.4 + Math.random() * H * 0.6
    const angle = Math.random() * Math.PI * 2 // 泼向角度随机
    const spread = Math.random() * params.splashSpread // 散开值随机
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

  function strike() {
    flash = 1
    crack = 1
    playThunder()
    const count = 1 + Math.floor(Math.random() * params.maxBolts)
    bolts = []
    for (let b = 0; b < count; b++) {
      const ox = Math.random() * W
      const ex = ox + (Math.random() - 0.5) * W * 0.2
      const ey = H * (0.5 + Math.random() * 0.4)
      bolts.push(genBolt(ox, ex, ey))
    }
    const seamX = (Math.random() - 0.5) * tw * 0.25
    seam = []
    const segs = 8
    for (let i = 0; i <= segs; i++) {
      seam.push({ x: seamX + (Math.random() - 0.5) * params.boltJitter * 0.8, y: -th / 2 + (i / segs) * th })
    }
  }

  function genBolt(ox: number, ex: number, ey: number): Bolt {
    const steps = 10
    const pts: { x: number; y: number }[] = []
    for (let i = 0; i <= steps; i++) {
      const p = i / steps
      pts.push({ x: ox + (ex - ox) * p + (Math.random() - 0.5) * params.boltJitter, y: p * ey })
    }
    const branches: { x: number; y: number }[][] = []
    const nb = Math.floor(Math.random() * 3)
    for (let k = 0; k < nb; k++) {
      const start = pts[2 + Math.floor(Math.random() * (steps - 4))]
      const br: { x: number; y: number }[] = [start]
      const len = 2 + Math.floor(Math.random() * 3)
      let cx = start.x
      let cy = start.y
      for (let j = 0; j < len; j++) {
        cx += (Math.random() - 0.5) * params.boltJitter * 2.4
        cy += 8 + Math.random() * 26
        br.push({ x: cx, y: cy })
      }
      branches.push(br)
    }
    return { pts, branches }
  }

  function drawTextHalf(side: -1 | 1, gap: number, cx: number, cy: number) {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.beginPath()
    const edge = (side === -1 ? -tw / 2 : tw / 2) + side * (tw * 0.6)
    ctx.moveTo(edge, -th / 2 - 4)
    ctx.lineTo(seam[0].x, -th / 2 - 4)
    for (const p of seam) ctx.lineTo(p.x, p.y)
    ctx.lineTo(edge, th / 2 + 4)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(textImg, -tw / 2 + side * gap, -th / 2, tw, th)
    ctx.restore()
  }

  function render() {
    const amb = params.flicker * 0.06 * (0.5 + 0.5 * Math.sin(t * 7))
    const m = 1 + flash * 1.3 + amb
    const [sr, sg, sb] = hexToRgb(params.skyColor)
    const sky = ctx.createLinearGradient(0, 0, 0, H)
    sky.addColorStop(0, shade(sr, sg, sb, m * 0.85))
    sky.addColorStop(1, shade(sr, sg, sb, m * 1.5))
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, H)

    // 雨
    if (rain.length) {
      ctx.strokeStyle = `rgba(170,195,220,${0.22 + flash * 0.4})`
      ctx.lineWidth = 1
      ctx.beginPath()
      for (const d of rain) {
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x - 2, d.y + d.len)
      }
      ctx.stroke()
    }

    // 文字：浮动 + 摇晃 +（命中时）裂开
    const bobY = Math.sin(t * params.bobSpeed) * params.bobAmp
    const rock = (Math.sin(t * params.bobSpeed * 0.7) * params.rockDeg * Math.PI) / 180
    const cx = W / 2
    const cy = H * 0.45 + bobY
    if (crack > 0.02 && seam.length) {
      const gap = crack * params.maxGap
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(rock)
      ctx.translate(-cx, -cy)
      drawTextHalf(-1, gap, cx, cy)
      drawTextHalf(1, gap, cx, cy)
      ctx.translate(cx, cy)
      ctx.strokeStyle = `rgba(190,230,255,${crack})`
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(seam[0].x, seam[0].y)
      for (const p of seam) ctx.lineTo(p.x, p.y)
      ctx.stroke()
      ctx.restore()
    } else {
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(rock)
      ctx.drawImage(textImg, -tw / 2, -th / 2, tw, th)
      ctx.restore()
    }

    // 水泼向镜头（在文字前面）：拖影 + 由小变大柔光珠
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    for (const d of splashes) {
      // 喷射/黏住时保持可见；进入下滑后期渐隐
      const a0 = 0.7 + flash * 0.3
      let a = a0
      if (d.age >= d.flyDur) {
        const sAge = d.age - d.flyDur
        const sMax = d.max - d.flyDur
        a = a0 * (sAge < sMax * 0.35 ? 1 : Math.max(0, 1 - (sAge - sMax * 0.35) / (sMax * 0.65)))
      }
      const size = d.size * d.z
      // 运动拖影
      ctx.strokeStyle = withAlpha(params.dropColor, a * 0.4)
      ctx.lineWidth = Math.max(0.6, size * 0.5)
      ctx.beginPath()
      ctx.moveTo(d.x - d.vx * d.z * 1.4, d.y - d.vy * d.z * 1.4)
      ctx.lineTo(d.x, d.y)
      ctx.stroke()
      // 水珠
      ctx.globalAlpha = a
      ctx.drawImage(drop, d.x - size, d.y - size, size * 2, size * 2)
      ctx.globalAlpha = 1
    }
    ctx.restore()

    // 闪光大气层
    if (flash > 0.01) {
      ctx.fillStyle = `rgba(225,238,255,${flash * 0.28})`
      ctx.fillRect(0, 0, W, H)
    }

    // 电弧（最上层）
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

    if (debug) {
      ctx.fillStyle = 'rgba(123,255,206,.9)'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(`flash ${flash.toFixed(2)} · bolts ${bolts.length} · drops ${splashes.length}`, 8, 16)
    }
  }

  function update(dt: number) {
    t += dt
    const f = dt * 60
    flash *= 0.86
    crack *= 0.95
    for (const d of rain) {
      d.y += d.v * f
      d.x -= 2 * f
      if (d.y > H) {
        d.y = -d.len
        d.x = Math.random() * W
      }
    }
    // 飞溅生命周期：①喷射冲镜放大 → ②黏住后缓慢向下滑落（同时渐隐）
    for (const d of splashes) {
      d.age += f
      if (d.age < d.flyDur) {
        d.z += params.splashGrowth * 0.05 * f
        d.x += d.vx * d.z * f
        d.y += d.vy * d.z * f
      } else {
        d.vx += (0 - d.vx) * 0.12 * f // 横向速度归零
        d.vy += (params.slide - d.vy) * 0.06 * f // 竖向趋向缓慢下滑终速
        d.x += d.vx * f
        d.y += d.vy * f
      }
    }
    splashes = splashes.filter(
      (d) => d.age < d.max && d.x > -120 && d.x < W + 120 && d.y < H + 120,
    )
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

  // ── 程序化音频：海浪 + 雷声（需手势）──
  let audio: AudioContext | null = null
  let noiseBuf: AudioBuffer | null = null
  function makeNoise(ac: AudioContext, sec: number) {
    const len = ac.sampleRate * sec
    const buf = ac.createBuffer(1, len, ac.sampleRate)
    const d = buf.getChannelData(0)
    let last = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      last = (last + 0.02 * w) / 1.02
      d[i] = last * 3.5
    }
    return buf
  }
  function setupAudio() {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audio = new AC()
    noiseBuf = makeNoise(audio, 2)
    const src = audio.createBufferSource()
    src.buffer = noiseBuf
    src.loop = true
    const lp = audio.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 500
    const g = audio.createGain()
    g.gain.value = 0.16
    src.connect(lp)
    lp.connect(g)
    g.connect(audio.destination)
    const lfo = audio.createOscillator()
    const lg = audio.createGain()
    lfo.frequency.value = 0.12
    lg.gain.value = 600
    lfo.connect(lg)
    lg.connect(lp.frequency)
    src.start()
    lfo.start()
  }
  function playThunder() {
    if (!audio || !noiseBuf) return
    const now = audio.currentTime
    const src = audio.createBufferSource()
    src.buffer = noiseBuf
    const lp = audio.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(1400, now)
    lp.frequency.exponentialRampToValueAtTime(120, now + 1.4)
    const g = audio.createGain()
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.6, now + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.6)
    src.connect(lp)
    lp.connect(g)
    g.connect(audio.destination)
    const rum = audio.createOscillator()
    rum.type = 'sine'
    rum.frequency.value = 55
    const rg = audio.createGain()
    rg.gain.setValueAtTime(0.0001, now)
    rg.gain.exponentialRampToValueAtTime(0.4, now + 0.05)
    rg.gain.exponentialRampToValueAtTime(0.0001, now + 1.8)
    rum.connect(rg)
    rg.connect(audio.destination)
    src.start(now)
    src.stop(now + 1.7)
    rum.start(now)
    rum.stop(now + 1.9)
  }

  const sndBtn = document.createElement('button')
  sndBtn.textContent = '🔊 启用风暴音效'
  sndBtn.style.cssText =
    'position:absolute;left:50%;bottom:14px;transform:translateX(-50%);z-index:5;padding:8px 14px;border:0;border-radius:999px;background:#cfe6f0;color:#10202a;font:600 13px ui-sans-serif;cursor:pointer'
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative'
  container.appendChild(sndBtn)
  sndBtn.onclick = () => {
    try {
      setupAudio()
      void audio?.resume()
    } catch {
      /* 无音频则纯视觉 */
    }
    sndBtn.remove()
  }

  const ro = new ResizeObserver(() => build())
  ro.observe(container)
  build()
  loop()

  return {
    update(next) {
      const rebuild = next.text !== undefined || next.color !== undefined || next.rain !== undefined
      Object.assign(params, next)
      if (next.dropColor !== undefined) buildDrop()
      if (rebuild) build()
    },
    resize() {
      build()
    },
    reset() {
      strike() // Reset = 手动劈闪电
    },
    getParams() {
      return { ...params }
    },
    destroy() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      sndBtn.remove()
      void audio?.close()
      canvas.remove()
    },
    setTimeScale(scale) {
      timeScale = scale
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
function withAlpha(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${a})`
}
function shade(r: number, g: number, b: number, m: number): string {
  return `rgb(${Math.min(255, r * m) | 0},${Math.min(255, g * m) | 0},${Math.min(255, b * m) | 0})`
}
