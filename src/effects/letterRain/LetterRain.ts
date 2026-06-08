import type { EffectHandle } from '../types'
import type { LetterRainParams } from './params'

interface Letter {
  ch: string
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vr: number
  size: number
  r: number // 物理半径
}

// 物理互动：设备倾斜/摇晃 → 字母在重力下掉落、堆积在屏幕边缘。
// 桌面无传感器：用 gravityAngle 滑块模拟倾斜，Reset(=摇晃) 让字母重新扬起。
export function mountLetterRain(
  container: HTMLElement,
  initial: LetterRainParams,
): EffectHandle<LetterRainParams> {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none'
  container.appendChild(canvas)
  const ctx = canvas.getContext('2d')!

  let params: LetterRainParams = { ...initial }
  let letters: Letter[] = []
  let W = 0
  let H = 0
  let timeScale = 1
  let debug = false
  let raf = 0

  // 真机体感（覆盖 gravityAngle）
  let deviceActive = false
  let liveAngle = 90
  let lastAccel = 0

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
    spawn()
  }

  function spawn() {
    const chars = params.text.split('').filter((c) => c.trim().length > 0).slice(0, 90)
    letters = chars.map((ch) => {
      const size = params.sizeMin + Math.random() * Math.max(0, params.sizeMax - params.sizeMin)
      return {
        ch,
        x: W * 0.2 + Math.random() * W * 0.6,
        y: H * 0.1 + Math.random() * H * 0.25,
        vx: (Math.random() - 0.5) * 2,
        vy: 0,
        rot: (Math.random() - 0.5) * 0.6,
        vr: (Math.random() - 0.5) * 0.04,
        size,
        r: size * 0.42,
      }
    })
  }

  function gravityVec() {
    const deg = deviceActive ? liveAngle : params.gravityAngle
    const rad = (deg * Math.PI) / 180
    return { gx: Math.cos(rad) * params.gravity, gy: Math.sin(rad) * params.gravity }
  }

  function update(dt: number) {
    const f = dt * 60
    const { gx, gy } = gravityVec()
    for (const L of letters) {
      L.vx += gx * f
      L.vy += gy * f
      L.vx *= params.airFriction
      L.vy *= params.airFriction
      L.x += L.vx * f
      L.y += L.vy * f
      L.rot += L.vr * f
      // 边界碰撞 + 切向摩擦（落地后不会无限滑）
      if (L.x < L.r) { L.x = L.r; L.vx *= -params.bounce; L.vy *= 0.8 }
      else if (L.x > W - L.r) { L.x = W - L.r; L.vx *= -params.bounce; L.vy *= 0.8 }
      if (L.y < L.r) { L.y = L.r; L.vy *= -params.bounce; L.vx *= 0.8 }
      else if (L.y > H - L.r) { L.y = H - L.r; L.vy *= -params.bounce; L.vx *= 0.8 }
    }
    // 互斥 → 堆积成一堆而非叠在一点（n≤90，O(n²) 可接受）
    if (params.repulsion > 0) {
      for (let i = 0; i < letters.length; i++) {
        const a = letters[i]
        for (let j = i + 1; j < letters.length; j++) {
          const b = letters[j]
          const dx = b.x - a.x
          const dy = b.y - a.y
          const min = a.r + b.r
          const d2 = dx * dx + dy * dy
          if (d2 > 0 && d2 < min * min) {
            const d = Math.sqrt(d2)
            const push = ((min - d) / d) * params.repulsion * 0.5
            const px = dx * push
            const py = dy * push
            a.x -= px; a.y -= py
            b.x += px; b.y += py
          }
        }
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H)
    if (debug) {
      ctx.strokeStyle = 'rgba(123,255,206,.4)'
      ctx.strokeRect(0.5, 0.5, W - 1, H - 1)
      const { gx, gy } = gravityVec()
      ctx.strokeStyle = 'rgba(255,120,180,.8)'
      ctx.beginPath()
      ctx.moveTo(W / 2, H / 2)
      ctx.lineTo(W / 2 + gx * 200, H / 2 + gy * 200) // 重力方向箭头
      ctx.stroke()
    }
    ctx.fillStyle = params.color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const L of letters) {
      ctx.save()
      ctx.translate(L.x, L.y)
      ctx.rotate(L.rot)
      ctx.font = `${L.size}px Georgia, serif`
      ctx.fillText(L.ch, 0, 0)
      ctx.restore()
    }
    if (debug) {
      ctx.fillStyle = 'rgba(123,255,206,.9)'
      ctx.font = '11px ui-monospace, monospace'
      ctx.fillText(`letters ${letters.length} · ${deviceActive ? 'device-tilt' : 'slider'}`, 8, 16)
    }
  }

  function loop() {
    raf = requestAnimationFrame(loop)
    const dt = 0.016 * timeScale
    if (dt > 0) update(dt)
    render()
  }

  function relift() {
    for (const L of letters) {
      L.x = W * 0.2 + Math.random() * W * 0.6
      L.y = H * 0.1 + Math.random() * H * 0.3
      L.vx = (Math.random() - 0.5) * 6
      L.vy = -Math.random() * 6
    }
  }

  // ── 设备体感 ──
  const onOrient = (e: DeviceOrientationEvent) => {
    if (e.gamma == null || e.beta == null) return
    deviceActive = true
    // gamma 左右倾 (-90..90)，beta 前后倾 (-180..180)；映射成屏幕重力方向
    const gx = Math.max(-1, Math.min(1, e.gamma / 45))
    const gy = Math.max(-1, Math.min(1, e.beta / 45))
    liveAngle = (Math.atan2(gy || 0.001, gx) * 180) / Math.PI
  }
  const onMotion = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity
    if (!a) return
    const mag = Math.hypot(a.x || 0, a.y || 0, a.z || 0)
    if (Math.abs(mag - lastAccel) > 14) relift() // 摇晃 → 字母重新扬起再落
    lastAccel = mag
  }
  function subscribe() {
    window.addEventListener('deviceorientation', onOrient)
    window.addEventListener('devicemotion', onMotion)
  }
  // iOS 13+ 需在用户手势里申请权限；否则直接订阅
  const DOE = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }
  let permBtn: HTMLButtonElement | null = null
  if (DOE && typeof DOE.requestPermission === 'function') {
    permBtn = document.createElement('button')
    permBtn.textContent = '🔓 启用体感'
    permBtn.style.cssText =
      'position:absolute;left:50%;top:14px;transform:translateX(-50%);z-index:5;padding:8px 14px;border:0;border-radius:999px;background:#cbb8ff;color:#1a1230;font:600 13px ui-sans-serif;cursor:pointer'
    if (getComputedStyle(container).position === 'static') container.style.position = 'relative'
    container.appendChild(permBtn)
    permBtn.onclick = async () => {
      try {
        await DOE.requestPermission?.()
        const DME = window.DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }
        await DME?.requestPermission?.()
        subscribe()
      } catch {
        /* 用户拒绝：留在滑块模拟模式 */
      }
      permBtn?.remove()
      permBtn = null
    }
  } else {
    subscribe()
  }

  const ro = new ResizeObserver(() => build())
  ro.observe(container)
  build()
  loop()

  return {
    update(next) {
      const rebuild =
        next.text !== undefined || next.sizeMin !== undefined || next.sizeMax !== undefined
      Object.assign(params, next)
      if (rebuild) build()
    },
    resize() {
      build()
    },
    reset() {
      relift() // = 摇晃
    },
    getParams() {
      return { ...params }
    },
    destroy() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('deviceorientation', onOrient)
      window.removeEventListener('devicemotion', onMotion)
      permBtn?.remove()
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
