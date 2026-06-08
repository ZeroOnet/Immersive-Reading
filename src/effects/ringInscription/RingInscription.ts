import type { EffectHandle } from '../types'
import type { RingInscriptionParams } from './params'

interface RainDrop {
  x: number
  y: number
  len: number
  v: number
}

// 《魔戒》气质：被雨冲淡的环形铭文，需要"大声召唤"冲洗显现。
// 麦克风音量（连续）→ 实时亮度/清晰度；持续召唤累积金色填充（像指纹录入），填满即铭文绽放。
// 交互：点「开始召唤」启用麦克风读出铭文；或在画面上按住作为无麦兜底。
export function mountRingInscription(
  container: HTMLElement,
  initial: RingInscriptionParams,
): EffectHandle<RingInscriptionParams> {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none'
  container.appendChild(canvas)
  const ctx = canvas.getContext('2d')!

  let params: RingInscriptionParams = { ...initial }
  let W = 0
  let H = 0
  let t = 0
  let timeScale = 1
  let debug = false
  let raf = 0
  let glow = 0
  let micVol = 0
  let holding = false
  let rain: RainDrop[] = []

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
    rain = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      len: 8 + Math.random() * 16,
      v: 3 + Math.random() * 4,
    }))
  }

  const chars = () => [...params.text]

  function update(dt: number) {
    t += dt
    const vol = Math.max(micVol, holding ? 1 : 0)
    glow += (vol - glow) * 0.15
    if (vol > params.threshold) {
      params.fill = Math.min(1, params.fill + (vol - params.threshold) * params.fillRate * dt)
    }
    const f = dt * 60
    for (const d of rain) {
      d.y += d.v * f
      if (d.y > H) {
        d.y = -d.len
        d.x = Math.random() * W
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H)
    const cx = W / 2
    const cy = H / 2
    const R = Math.min(W, H) * params.radiusFactor
    const fill = params.fill
    const clarity = 0.22 + glow * 0.5 // 实时：越大声整体越清晰

    // 雨痕（随填充完成而消退）
    const rainA = params.rain * (1 - fill) * 0.5
    if (rainA > 0.01) {
      ctx.strokeStyle = `rgba(150,170,200,${rainA})`
      ctx.lineWidth = 1
      ctx.beginPath()
      for (const d of rain) {
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x - 1, d.y + d.len)
      }
      ctx.stroke()
    }

    // 环带刻痕（两道淡圈）
    ctx.strokeStyle = `rgba(120,112,96,${0.15 + glow * 0.15})`
    ctx.lineWidth = 1
    for (const rr of [R + params.fontSize * 0.9, R - params.fontSize * 0.9]) {
      ctx.beginPath()
      ctx.arc(cx, cy, rr, 0, Math.PI * 2)
      ctx.stroke()
    }

    const cs = chars()
    const N = cs.length
    const [gr, gg, gb] = hexToRgb(params.goldColor)
    for (let i = 0; i < N; i++) {
      const ch = cs[i]
      if (!ch.trim()) continue
      const a = -Math.PI / 2 + (i / N) * Math.PI * 2
      const x = cx + R * Math.cos(a)
      const y = cy + R * Math.sin(a)
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(a + Math.PI / 2)
      ctx.font = `600 ${params.fontSize}px Georgia, serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // 1) 刻痕底（始终可见、被雨冲淡）
      ctx.fillStyle = withAlpha(params.etchColor, clarity)
      ctx.fillText(ch, 0, 0)

      // 2) 金色填充（按进度的前沿推进 + 流动微光 + 实时辉光）
      const ga = Math.max(0, Math.min(1, fill * N - i))
      if (ga > 0) {
        const shimmer = 0.6 + 0.4 * Math.sin(i * 0.5 - t * params.shimmerSpeed)
        const lead = ga < 1 ? 1 - ga : 0 // 前沿（湿润端）更白亮
        const r = Math.min(255, gr * shimmer + 255 * lead * 0.6)
        const g = Math.min(255, gg * shimmer + 245 * lead * 0.6)
        const b = Math.min(255, gb * shimmer + 200 * lead * 0.4)
        ctx.shadowColor = params.glowColor
        ctx.shadowBlur = 6 + glow * 22 + lead * 14
        ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${ga})`
        ctx.fillText(ch, 0, 0)
        ctx.shadowBlur = 0
      }
      ctx.restore()
    }

    // 填满 → 绽放
    if (fill > 0.985) {
      const g = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 1.4)
      const pulse = 0.25 + 0.15 * Math.sin(t * 4)
      g.addColorStop(0, withAlpha(params.glowColor, pulse))
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)
    }

    if (debug) {
      ctx.fillStyle = 'rgba(123,255,206,.9)'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(`fill ${fill.toFixed(2)} · vol ${Math.max(micVol, holding ? 1 : 0).toFixed(2)} · glow ${glow.toFixed(2)}`, 8, 16)
    }
  }

  function loop() {
    raf = requestAnimationFrame(loop)
    const dt = 0.016 * timeScale
    if (dt > 0) update(dt)
    render()
  }

  // 按住 = 无麦兜底召唤
  const onDown = () => (holding = true)
  const onUp = () => (holding = false)
  canvas.addEventListener('pointerdown', onDown)
  window.addEventListener('pointerup', onUp)
  canvas.addEventListener('pointerleave', onUp)

  // 麦克风：连续 RMS → micVol
  let audio: AudioContext | null = null
  let stream: MediaStream | null = null
  function startMic() {
    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
      .then((s) => {
        stream = s
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        audio = new AC()
        const src = audio.createMediaStreamSource(s)
        const an = audio.createAnalyser()
        an.fftSize = 1024
        src.connect(an)
        const buf = new Float32Array(an.fftSize)
        const tick = () => {
          if (!audio) return
          requestAnimationFrame(tick)
          an.getFloatTimeDomainData(buf)
          let sum = 0
          for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
          const rms = Math.sqrt(sum / buf.length)
          micVol += (Math.min(1, rms * 3) - micVol) * 0.4
        }
        tick()
        hint.textContent = '🎙 召唤中…读出铭文，越大声越快显现'
      })
      .catch(() => {
        hint.textContent = '麦克风不可用 → 按住画面召唤（无麦兜底）'
      })
  }

  const btn = document.createElement('button')
  btn.textContent = '🔥 开始召唤'
  btn.style.cssText =
    'position:absolute;left:50%;bottom:16px;transform:translateX(-50%);z-index:5;padding:9px 16px;border:0;border-radius:999px;background:#ffcf6a;color:#2a1c06;font:600 13px ui-sans-serif;cursor:pointer'
  const hint = document.createElement('div')
  hint.textContent = '点「开始召唤」并读出铭文；无麦克风可按住画面'
  hint.style.cssText =
    'position:absolute;left:50%;bottom:54px;transform:translateX(-50%);z-index:5;font:12px ui-sans-serif;color:#b9b0a0;white-space:nowrap;text-shadow:0 1px 4px #000'
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative'
  container.append(btn, hint)
  btn.onclick = () => {
    startMic()
    void audio?.resume()
  }

  const ro = new ResizeObserver(() => build())
  ro.observe(container)
  build()
  loop()

  return {
    update(next) {
      Object.assign(params, next)
    },
    resize() {
      build()
    },
    reset() {
      params.fill = 0 // 重新被雨冲淡
    },
    getParams() {
      return { ...params }
    },
    destroy() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      canvas.removeEventListener('pointerleave', onUp)
      stream?.getTracks().forEach((tr) => tr.stop())
      void audio?.close()
      btn.remove()
      hint.remove()
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
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`
}
