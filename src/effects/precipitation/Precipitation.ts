import type { EffectHandle } from '../types'
import type { PrecipitationParams } from './params'

interface Drop {
  x: number
  y: number
  z: number // 0..1 景深：越大越近越快越大
  sway: number // 雪的横摆相位
}

// 通用雨/雪粒子效果（可被其它场景复用思路；此处作为独立 lab 效果）。
export function mountPrecipitation(
  container: HTMLElement,
  initial: PrecipitationParams,
): EffectHandle<PrecipitationParams> {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'display:block;width:100%;height:100%;background:#0a0f1c'
  container.appendChild(canvas)
  const ctx = canvas.getContext('2d')!

  let params: PrecipitationParams = { ...initial }
  let drops: Drop[] = []
  let W = 0
  let H = 0
  let t = 0
  let timeScale = 1
  let debug = false
  let raf = 0
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
    drops = Array.from({ length: params.count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      z: 0.4 + Math.random() * 0.6,
      sway: Math.random() * 6.28,
    }))
  }

  function update(dt: number) {
    t += dt
    const f = dt * 60
    for (const d of drops) {
      if (params.mode === 'snow') {
        d.y += params.speed * d.z * f
        d.x += (params.wind * d.z + Math.sin(t * 1.5 + d.sway) * 0.6) * f
      } else {
        d.y += params.speed * 2 * d.z * f
        d.x += params.wind * d.z * 2 * f
      }
      if (d.y > H + 20) {
        d.y = -20
        d.x = Math.random() * W
      }
      if (d.x > W + 20) d.x -= W + 40
      else if (d.x < -20) d.x += W + 40
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H)
    const [r, g, b] = hexToRgb(params.color)
    if (params.mode === 'snow') {
      for (const d of drops) {
        const rad = params.size * d.z
        ctx.globalAlpha = params.opacity * d.z
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.beginPath()
        ctx.arc(d.x, d.y, rad, 0, Math.PI * 2)
        ctx.fill()
      }
    } else {
      ctx.lineCap = 'round'
      for (const d of drops) {
        const len = (6 + params.speed * 1.2) * params.size * d.z
        ctx.globalAlpha = params.opacity * d.z
        ctx.strokeStyle = `rgb(${r},${g},${b})`
        ctx.lineWidth = Math.max(0.6, params.size * d.z)
        ctx.beginPath()
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x - params.wind * d.z * 2, d.y + len)
        ctx.stroke()
      }
    }
    ctx.globalAlpha = 1
    if (debug) {
      ctx.fillStyle = 'rgba(123,255,206,.9)'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(`${params.mode} · ${drops.length}`, 8, 16)
    }
  }

  function loop() {
    raf = requestAnimationFrame(loop)
    const dt = 0.016 * timeScale
    if (dt > 0) update(dt)
    render()
  }

  const ro = new ResizeObserver(() => build())
  ro.observe(container)
  build()
  loop()

  return {
    update(next) {
      const rebuild = next.count !== undefined || next.mode !== undefined
      Object.assign(params, next)
      if (rebuild) build()
    },
    resize() {
      build()
    },
    reset() {
      build()
    },
    getParams() {
      return { ...params }
    },
    destroy() {
      cancelAnimationFrame(raf)
      ro.disconnect()
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
