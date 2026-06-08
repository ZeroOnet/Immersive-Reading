import type { EffectHandle } from '../types'
import type { TextParticlesParams } from './params'

interface Particle {
  hx: number
  hy: number
  x: number
  y: number
  vx: number
  vy: number
  seed: number
  sizeMul: number
  bright: number
}

// 纯效果，参数化，零调试代码、零业务。给 container + params 即可运行。
export function mountTextParticles(
  container: HTMLElement,
  initial: TextParticlesParams,
): EffectHandle<TextParticlesParams> {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none'
  container.appendChild(canvas)
  const ctx = canvas.getContext('2d')!

  let params: TextParticlesParams = { ...initial }
  let particles: Particle[] = []
  let W = 0
  let H = 0
  let t = 0
  let timeScale = 1
  let debug = false
  let raf = 0
  const pointer = { x: -1, y: -1, active: false }
  const dpr = () => Math.min(window.devicePixelRatio || 1, 2)

  // 柔光点贴图（interactive 模式用，按颜色预渲染）
  const sprite = document.createElement('canvas')
  const sctx = sprite.getContext('2d')!
  function buildSprite() {
    const S = 32
    sprite.width = S
    sprite.height = S
    const g = sctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2)
    g.addColorStop(0, withAlpha(params.color, 1))
    g.addColorStop(0.35, withAlpha(params.color, 0.55))
    g.addColorStop(1, withAlpha(params.color, 0))
    sctx.clearRect(0, 0, S, S)
    sctx.fillStyle = g
    sctx.fillRect(0, 0, S, S)
  }

  function cssSize() {
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
    buildSprite()

    // 把文字画到离屏 canvas，按 alpha 采样成点
    const off = document.createElement('canvas')
    const octx = off.getContext('2d')!
    const fs = Math.min(w * 0.28, 240)
    octx.font = `900 ${fs}px Georgia, serif`
    const tw = Math.ceil(octx.measureText(params.text || ' ').width) || 1
    const th = Math.ceil(fs * 1.3)
    off.width = tw
    off.height = th
    octx.font = `900 ${fs}px Georgia, serif`
    octx.fillStyle = '#fff'
    octx.textBaseline = 'middle'
    octx.fillText(params.text || '', 0, th / 2)
    const data = octx.getImageData(0, 0, tw, th).data
    const step = Math.max(2, Math.round(params.density))
    const ox = w / 2 - tw / 2
    const oy = h / 2 - th / 2
    const pts: { hx: number; hy: number }[] = []
    for (let y = 0; y < th; y += step)
      for (let x = 0; x < tw; x += step)
        if (data[(y * tw + x) * 4 + 3] > 128) pts.push({ hx: ox + x, hy: oy + y })

    particles = pts.map((p, i) => {
      const old = particles[i]
      return {
        hx: p.hx,
        hy: p.hy,
        x: old ? old.x : w / 2 + (Math.random() - 0.5) * w,
        y: old ? old.y : h / 2 + (Math.random() - 0.5) * h,
        vx: 0,
        vy: 0,
        seed: old ? old.seed : Math.random() * 6.28,
        sizeMul: old ? old.sizeMul : 0.6 + Math.random() * 1.0,
        bright: old ? old.bright : 0.45 + Math.random() * 0.55,
      }
    })
  }

  function moundY(x: number) {
    const cx = W / 2
    const halfW = W * 0.34
    const peak = H * 0.34
    const d = Math.abs(x - cx)
    return H - 20 - Math.max(0, peak * (1 - d / halfW))
  }

  function update(dt: number) {
    t += dt
    const f = dt * 60
    for (const p of particles) {
      switch (params.mode) {
        case 'interactive': {
          // 回到原位（带极轻 idle 漂移）+ 指针排斥 + 阻尼
          const tx = p.hx + Math.sin(t * 1.1 + p.seed) * params.idle
          const ty = p.hy + Math.cos(t * 1.4 + p.seed * 1.3) * params.idle
          p.vx += (tx - p.x) * params.spring * f
          p.vy += (ty - p.y) * params.spring * f
          if (pointer.active) {
            const dx = p.x - pointer.x
            const dy = p.y - pointer.y
            const dist = Math.hypot(dx, dy)
            if (dist < params.pointerRadius && dist > 0.001) {
              const force = (1 - dist / params.pointerRadius) * params.pointerForce
              p.vx += (dx / dist) * force * f
              p.vy += (dy / dist) * force * f
            }
          }
          p.vx *= params.damping
          p.vy *= params.damping
          p.x += p.vx * f
          p.y += p.vy * f
          break
        }
        case 'assemble':
          p.x += (p.hx - p.x) * params.ease
          p.y += (p.hy - p.y) * params.ease
          break
        case 'wind': {
          const sway = Math.sin(t * 1.6 + p.hy * 0.02 + p.seed) * params.windAmplitude * (1 + (H - p.hy) / H)
          p.x += (p.hx + sway - p.x) * 0.2
          p.y += (p.hy + Math.cos(t + p.seed) * 3 - p.y) * 0.2
          break
        }
        case 'collapse': {
          p.vy += 0.6
          p.x += p.vx
          p.y += p.vy
          p.vx += (W / 2 - p.x) * 0.0002
          const my = moundY(p.x)
          if (p.y >= my) {
            p.y = my
            p.vy *= -0.18
            p.vx *= 0.7
            if (Math.abs(p.vy) < 0.6) p.vy = 0
          }
          break
        }
        case 'gravity':
          if (pointer.active) {
            const dx = pointer.x - p.x
            const dy = pointer.y - p.y
            const d2 = dx * dx + dy * dy + 400
            const fg = (params.gravityStrength * 1400) / d2
            p.vx += dx * fg * 0.02
            p.vy += dy * fg * 0.02
          }
          p.vx += (p.hx - p.x) * 0.004
          p.vy += (p.hy - p.y) * 0.004
          p.vx *= 0.9
          p.vy *= 0.9
          p.x += p.vx
          p.y += p.vy
          break
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H)
    if (debug) {
      ctx.strokeStyle = 'rgba(123,255,206,.45)'
      ctx.strokeRect(0.5, 0.5, W - 1, H - 1)
      ctx.fillStyle = 'rgba(123,255,206,.35)'
      for (const p of particles) ctx.fillRect(p.hx, p.hy, 1, 1) // 采样目标点
    }

    if (params.mode === 'interactive') {
      // 柔和发光点 + 叠加混合（靠近指针更亮）
      ctx.globalCompositeOperation = 'lighter'
      for (const p of particles) {
        let b = p.bright
        if (pointer.active) {
          const dist = Math.hypot(p.x - pointer.x, p.y - pointer.y)
          if (dist < params.pointerRadius) b += (1 - dist / params.pointerRadius) * 0.9
        }
        ctx.globalAlpha = Math.min(1, b) * (0.35 + params.glow * 0.65)
        const r = params.particleSize * p.sizeMul * 2.2
        ctx.drawImage(sprite, p.x - r, p.y - r, r * 2, r * 2)
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    } else {
      ctx.fillStyle = params.color
      for (const p of particles) ctx.fillRect(p.x, p.y, params.particleSize, params.particleSize)
    }

    if (debug) {
      ctx.fillStyle = 'rgba(123,255,206,.9)'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(`particles ${particles.length} · ${params.mode}`, 8, 16)
    }
  }

  function loop() {
    raf = requestAnimationFrame(loop)
    const dt = 0.016 * timeScale
    if (dt > 0) update(dt)
    render()
  }

  // 指针：interactive 模式排斥、gravity 模式吸引
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect()
    pointer.x = e.clientX - r.left
    pointer.y = e.clientY - r.top
    pointer.active = true
  }
  const onLeave = () => {
    pointer.active = false
  }
  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerdown', onMove)
  canvas.addEventListener('pointerleave', onLeave)
  window.addEventListener('pointerup', onLeave)

  const ro = new ResizeObserver(() => build())
  ro.observe(container)

  build()
  loop()

  return {
    update(next) {
      const rebuild = next.text !== undefined || next.density !== undefined
      Object.assign(params, next)
      if (next.color !== undefined) buildSprite()
      if (rebuild) build()
    },
    resize() {
      build()
    },
    reset() {
      particles = []
      build()
    },
    getParams() {
      return { ...params }
    },
    destroy() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerdown', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('pointerup', onLeave)
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
