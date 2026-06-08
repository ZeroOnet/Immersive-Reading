import type { EffectHandle } from '../types'
import type { PageBurnParams } from './params'

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
}

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a || 1)))
  return t * t * (3 - 2 * t)
}

// 仿真纸张燃烧：噪声阈值溶解。每像素有一个"燃烧次序"D（离边越近 + 噪声扰动越小→越先烧）；
// burn 推进时扫过 D → 烧穿(透明露暗底) / 余烬鳞带(白热→橙→焦黑) / 焦黄纸 / 完好纸。
export function mountPageBurn(
  container: HTMLElement,
  initial: PageBurnParams,
): EffectHandle<PageBurnParams> {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'display:block;width:100%;height:100%'
  container.appendChild(canvas)
  const ctx = canvas.getContext('2d')!

  const baseCv = document.createElement('canvas') // 纸+墨（未烧）
  const bctx = baseCv.getContext('2d')!
  const burnCv = document.createElement('canvas') // 烧后结果（静态，burn 变才重算）
  const burnCtx = burnCv.getContext('2d')!

  let params: PageBurnParams = { ...initial }
  let BW = 0
  let BH = 0
  let t = 0
  let timeScale = 1
  let debug = false
  let raf = 0
  let seed = Math.random() * 1000
  let D: Float32Array = new Float32Array(0)
  let baseData: Uint8ClampedArray = new Uint8ClampedArray(0)
  let out: ImageData | null = null
  let rimPts: number[] = [] // 余烬前沿采样点（喷火星用），成对 x,y
  let sparks: Spark[] = []

  const cssSize = () => {
    const r = container.getBoundingClientRect()
    return { w: Math.max(1, r.width), h: Math.max(1, r.height) }
  }

  // 值噪声 + fbm
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

  function wrap(text: string, maxW: number): string[] {
    const o: string[] = []
    let cur = ''
    for (const w of text.split(' ')) {
      const test = cur ? cur + ' ' + w : w
      if (bctx.measureText(test).width > maxW && cur) {
        o.push(cur)
        cur = w
      } else cur = test
    }
    if (cur) o.push(cur)
    return o
  }

  function build() {
    const { w, h } = cssSize()
    const scale = Math.min(1.3, 1000 / Math.max(w, h))
    BW = Math.max(1, Math.round(w * scale))
    BH = Math.max(1, Math.round(h * scale))
    for (const c of [canvas, baseCv, burnCv]) {
      c.width = BW
      c.height = BH
    }

    // 基底：纸 + 墨（墨水画文字）
    bctx.setTransform(1, 0, 0, 1, 0, 0)
    bctx.fillStyle = params.paperColor
    bctx.fillRect(0, 0, BW, BH)
    const fs = Math.min(BW * 0.05, 30)
    bctx.font = `500 ${fs}px Georgia, serif`
    bctx.fillStyle = params.textColor
    bctx.textAlign = 'center'
    bctx.textBaseline = 'middle'
    const lines = wrap(params.text, BW * 0.66)
    const lh = fs * 1.5
    let y = BH / 2 - (lines.length * lh) / 2 + lh / 2
    for (const ln of lines) {
      bctx.fillText(ln, BW / 2, y)
      y += lh
    }
    baseData = bctx.getImageData(0, 0, BW, BH).data.slice()

    // 燃烧次序场 D
    D = new Float32Array(BW * BH)
    const reach = params.edgeReach * Math.min(BW, BH)
    for (let py = 0; py < BH; py++) {
      for (let px = 0; px < BW; px++) {
        const dEdge = Math.min(px, py, BW - 1 - px, BH - 1 - py)
        const edgeF = 1 - smoothstep(0, reach, dEdge) // 1 边缘 → 0 内部
        const n = fbm(px, py)
        let d = 1 - edgeF + (n - 0.5) * params.ragged
        D[py * BW + px] = d < 0 ? 0 : d > 1 ? 1 : d
      }
    }
    out = burnCtx.createImageData(BW, BH)
    compose()
  }

  // burn / 颜色 / 带宽变化时重算烧后结果（不每帧跑）
  function compose() {
    if (!out) return
    const o = out.data
    const ember = params.ember
    const scorch = params.scorch
    const [vr, vg, vb] = hexToRgb(params.voidColor)
    const [cr, cg, cb] = hexToRgb(params.charColor)
    const [er, eg, eb] = hexToRgb(params.emberColor)
    rimPts = []
    for (let i = 0, p = 0; i < D.length; i++, p += 4) {
      const d = D[i] - params.burn
      if (params.burn > 0.001 && d < -ember) {
        // 已烧穿 → 暗底
        o[p] = vr
        o[p + 1] = vg
        o[p + 2] = vb
        o[p + 3] = 255
      } else if (params.burn > 0.001 && d < ember) {
        // 余烬鳞带：consumed 侧白热 → 橙 → 焦黑（paper 侧）
        const hh = 1 - (d + ember) / (2 * ember) // 1 热端 → 0 纸端
        let r, g, b
        if (hh > 0.6) {
          const k = (hh - 0.6) / 0.4
          r = er + (255 - er) * k
          g = eg + (235 - eg) * k
          b = eb + (180 - eb) * k
        } else {
          const k = hh / 0.6
          r = cr + (er - cr) * k
          g = cg + (eg - cg) * k
          b = cb + (eb - cb) * k
        }
        o[p] = r
        o[p + 1] = g
        o[p + 2] = b
        o[p + 3] = 255
        if ((i & 31) === 0 && rimPts.length < 4000) rimPts.push(i % BW, (i / BW) | 0)
      } else if (d < ember + scorch) {
        // 焦黄过渡：把纸+墨往焦黑压暗
        const s = 1 - (d - ember) / (scorch || 1)
        const k = s * 0.7
        o[p] = baseData[p] + (cr - baseData[p]) * k
        o[p + 1] = baseData[p + 1] + (cg - baseData[p + 1]) * k
        o[p + 2] = baseData[p + 2] + (cb - baseData[p + 2]) * k
        o[p + 3] = 255
      } else {
        // 完好纸
        o[p] = baseData[p]
        o[p + 1] = baseData[p + 1]
        o[p + 2] = baseData[p + 2]
        o[p + 3] = 255
      }
    }
    burnCtx.putImageData(out, 0, 0)
  }

  function spawnSparks() {
    if (params.burn < 0.04 || rimPts.length < 2) return
    const n = Math.round(params.sparks * params.burn * 0.1)
    for (let i = 0; i < n; i++) {
      const k = ((Math.random() * (rimPts.length >> 1)) | 0) * 2
      sparks.push({
        x: rimPts[k],
        y: rimPts[k + 1],
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(0.4 + Math.random() * 1.4),
        life: 0,
        max: 30 + Math.random() * 50,
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
      ctx.fillRect(s.x, s.y, 1.6, 1.6)
    }
    ctx.restore()
    if (debug) {
      ctx.fillStyle = 'rgba(123,255,206,.9)'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(`burn ${params.burn.toFixed(2)} · ${BW}x${BH} · sparks ${sparks.length}`, 8, 16)
    }
  }

  function update(dt: number) {
    t += dt
    const f = dt * 60
    spawnSparks()
    for (const s of sparks) {
      s.x += s.vx * f
      s.y += s.vy * f
      s.vx += (Math.random() - 0.5) * 0.1
      s.life += f
    }
    sparks = sparks.filter((s) => s.life < s.max)
    if (audio && t >= nextBoom) {
      playBoom()
      nextBoom = t + 0.7 + Math.random() * 2.2
    }
  }

  function loop() {
    raf = requestAnimationFrame(loop)
    const dt = 0.016 * timeScale
    if (dt > 0) update(dt)
    render()
  }

  // ── 程序化音频：火/隆隆底噪 + 随机炮声（需手势）──
  let audio: AudioContext | null = null
  let noiseBuf: AudioBuffer | null = null
  let nextBoom = 1.5
  function makeNoiseBuf(ac: AudioContext, sec: number) {
    const len = ac.sampleRate * sec
    const buf = ac.createBuffer(1, len, ac.sampleRate)
    const dd = buf.getChannelData(0)
    let last = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      last = (last + 0.02 * w) / 1.02
      dd[i] = last * 3.5
    }
    return buf
  }
  function setupAudio() {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audio = new AC()
    noiseBuf = makeNoiseBuf(audio, 2)
    const src = audio.createBufferSource()
    src.buffer = noiseBuf
    src.loop = true
    const lp = audio.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 320
    const g = audio.createGain()
    g.gain.value = 0.12
    src.connect(lp)
    lp.connect(g)
    g.connect(audio.destination)
    src.start()
  }
  function playBoom() {
    if (!audio || !noiseBuf) return
    const now = audio.currentTime
    const src = audio.createBufferSource()
    src.buffer = noiseBuf
    const lp = audio.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(900, now)
    lp.frequency.exponentialRampToValueAtTime(90, now + 0.8)
    const g = audio.createGain()
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(0.35 + Math.random() * 0.25, now + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.9)
    src.connect(lp)
    lp.connect(g)
    g.connect(audio.destination)
    src.start(now)
    src.stop(now + 1)
  }

  const sndBtn = document.createElement('button')
  sndBtn.textContent = '🔊 启用战场音效'
  sndBtn.style.cssText =
    'position:absolute;left:50%;bottom:14px;transform:translateX(-50%);z-index:5;padding:8px 14px;border:0;border-radius:999px;background:#ff7a2a;color:#1a0d04;font:600 13px ui-sans-serif;cursor:pointer'
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

  const STRUCTURAL = ['text', 'paperColor', 'textColor', 'edgeReach', 'ragged']
  return {
    update(next) {
      const keys = Object.keys(next)
      Object.assign(params, next)
      if (keys.some((k) => STRUCTURAL.includes(k))) build()
      else compose()
    },
    resize() {
      build()
    },
    reset() {
      seed = Math.random() * 1000 // 重烧出不同焦痕形状
      sparks = []
      build()
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
