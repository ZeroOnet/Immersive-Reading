import type { EffectHandle } from '../types'
import type { AliceFallSkinParams } from './params'
import bgVideo from './bg.mp4'

// 设计帧 375×794。Figma 节点的栅格图导出为空白占位，故装饰图改用主题符号、螺旋与背景用代码绘制。
const DW = 375
const DH = 794

// 装饰图槽位（设计坐标 + 文件名 + emoji 占位）。objects/oXX.png 存在就用真图，否则用 emoji。
// 真图导出清单见 objects/MANIFEST.md。
const OBJ_IMGS = import.meta.glob('./objects/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const SLOTS = [
  { f: 'o00', x: 0, y: 38, w: 60, h: 98, e: '🐇' },
  { f: 'o01', x: 310, y: 158, w: 41, h: 72, e: '🍄' },
  { f: 'o02', x: 330, y: 392, w: 45, h: 73, e: '🍵' },
  { f: 'o03', x: 319, y: 505, w: 26, h: 37, e: '🔑' },
  { f: 'o04', x: 319, y: 565, w: 56, h: 57, e: '⏰' },
  { f: 'o05', x: 0, y: 535, w: 30, h: 67, e: '🌿' },
  { f: 'o06', x: 0, y: 315, w: 24, h: 44, e: '🧪' },
  { f: 'o07', x: 75, y: 64, w: 23, h: 21, e: '♥️' },
  { f: 'o08', x: 189, y: 10, w: 36, h: 57, e: '🌹' },
  { f: 'o09', x: 0, y: 442, w: 33, h: 54, e: '♠️' },
  { f: 'o10', x: 286, y: 39, w: 89, h: 127, e: '🎩' },
  { f: 'o11', x: 4, y: 221, w: 19, h: 22, e: '♦️' },
  { f: 'o12', x: 279, y: 611, w: 34, h: 20, e: '♣️' },
  { f: 'o13', x: 272, y: 170, w: 10, h: 11, e: '✨' },
  { f: 'o14', x: 344, y: 241, w: 7, h: 10, e: '⭐' },
  { f: 'o15', x: 321, y: 368, w: 13, h: 12, e: '🔸' },
  { f: 'o16', x: 10, y: 273, w: 8, h: 14, e: '🔹' },
  { f: 'o17', x: 141, y: 29, w: 27, h: 38, e: '🃏' },
  { f: 'o18', x: 304, y: 262, w: 71, h: 93, e: '🐛' },
]

interface Body {
  el: HTMLElement
  hx: number
  hy: number
  hw: number
  hh: number
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vrot: number
}

// 《爱丽丝梦游仙境·掉进兔子洞》皮肤（Figma 24:104）：晕影背景 + 标题/正文(公版原文) + 散落主题装饰 + 底部旋涡；
// 晃动屏幕(或点按钮)→ 图片与文字一起掉落堆积（旋涡不掉）；再晃一下 → 全部归位。
export function mountAliceFallSkin(
  container: HTMLElement,
  initial: AliceFallSkinParams,
): EffectHandle<AliceFallSkinParams> {
  ensureFonts()
  let params: AliceFallSkinParams = { ...initial }

  const root = document.createElement('div')
  root.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;background:#f3eee4;'
  container.appendChild(root)

  // 可滚动容器：窗口比设计帧矮时纵向滚动，文字不会被裁掉
  const scroller = document.createElement('div')
  scroller.className = 'alicefall-scroll'
  scroller.style.cssText =
    'position:absolute;inset:0;z-index:1;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;'
  root.appendChild(scroller)

  // 设计帧画布：宽度撑满，高度 = 设计高 × 缩放（measure 中设置），整体随 scroller 滚动
  const sheet = document.createElement('div')
  sheet.style.cssText = 'position:relative;width:100%;'
  scroller.appendChild(sheet)

  // 背景视频（用户提供，1.5 倍速）
  const bgEl = document.createElement('video')
  bgEl.src = bgVideo
  bgEl.loop = true
  bgEl.autoplay = true
  bgEl.playsInline = true
  bgEl.setAttribute('playsinline', '')
  bgEl.setAttribute('webkit-playsinline', '')
  bgEl.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;pointer-events:none;'
  sheet.appendChild(bgEl)
  // 带声优先播放，被浏览器拒则降级静音播 + 首次手势解除静音（wutheringSkin 模式）
  bgEl.muted = false
  bgEl.volume = 1
  bgEl.play().catch(() => {
    bgEl.muted = true
    void bgEl.play().catch(() => {})
    const unmute = () => {
      bgEl.muted = false
      void bgEl.play().catch(() => {})
    }
    window.addEventListener('click', unmute, { once: true })
    window.addEventListener('touchstart', unmute, { once: true, passive: true })
    window.addEventListener('keydown', unmute, { once: true })
  })

  // 缩放舞台：设计 375×794 → 容器宽度
  const stage = document.createElement('div')
  stage.style.cssText = `position:absolute;left:0;top:0;width:${DW}px;height:${DH}px;transform-origin:0 0;z-index:2;`
  sheet.appendChild(stage)

  // 文字
  const title = document.createElement('p')
  title.style.cssText = "position:absolute;left:34px;top:110px;margin:0;font-family:'Grenze Gotisch',serif;font-size:34px;line-height:34px;white-space:nowrap;z-index:3;"
  stage.appendChild(title)
  const subtitle = document.createElement('p')
  subtitle.style.cssText = "position:absolute;left:34px;top:150px;margin:0;font-family:'MiSans VF','PingFang SC',system-ui,sans-serif;font-size:18px;white-space:nowrap;z-index:3;"
  stage.appendChild(subtitle)
  const bodyP = document.createElement('p')
  bodyP.style.cssText = "position:absolute;left:38px;top:192px;width:283px;margin:0;font-family:'Source Serif Pro',Georgia,serif;font-size:20px;line-height:30.5px;z-index:3;"
  stage.appendChild(bodyP)

  // 装饰：有真图(objects/oXX.png)就用 img，否则 emoji 占位。悬停显示文件名、Enter 复制。
  let hovered: string | null = null
  const objEls: HTMLElement[] = []
  for (const sl of SLOTS) {
    const file = sl.f + '.png'
    const url = OBJ_IMGS['./objects/' + sl.f + '.png']
    let el: HTMLElement
    if (url) {
      const im = document.createElement('img')
      im.src = url
      im.style.cssText = `position:absolute;left:${sl.x}px;top:${sl.y}px;width:${sl.w}px;height:${sl.h}px;object-fit:contain;will-change:transform;filter:drop-shadow(0 2px 4px #0006);z-index:1;`
      el = im
    } else {
      const fs = Math.max(14, Math.min(sl.w, sl.h))
      const d = document.createElement('div')
      d.textContent = sl.e
      d.style.cssText = `position:absolute;left:${sl.x}px;top:${sl.y}px;font-size:${fs}px;line-height:1;will-change:transform;filter:drop-shadow(0 2px 4px #0007);z-index:1;`
      el = d
    }
    el.title = file // 原生悬停提示：文件名
    el.style.cursor = 'pointer'
    el.addEventListener('pointerenter', () => (hovered = file))
    el.addEventListener('pointerleave', () => {
      if (hovered === file) hovered = null
    })
    stage.appendChild(el)
    objEls.push(el)
  }

  // 状态栏
  const status = document.createElement('div')
  status.style.cssText =
    'position:absolute;left:0;right:0;top:0;height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 20px 0 28px;color:#1a140c;z-index:6;'
  status.innerHTML =
    '<span style="font:600 15px/1 -apple-system,system-ui;letter-spacing:-.3px">9:41</span>' +
    '<span style="display:flex;align-items:center;gap:6px">' +
    '<svg width="18" height="11" viewBox="0 0 18 11" fill="#1a140c"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="5" y="4.5" width="3" height="6.5" rx="1"/><rect x="10" y="2" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="11" rx="1"/></svg>' +
    '<svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="#1a140c" stroke-width="1.4"><path d="M1 4.5a10 10 0 0 1 14 0M3.5 7a6 6 0 0 1 9 0M6 9.3a2.5 2.5 0 0 1 4 0"/></svg>' +
    '<svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="#1a140c" stroke-opacity=".5"/><rect x="2" y="2" width="17" height="8" rx="1.5" fill="#1a140c"/><rect x="23" y="3.5" width="2" height="5" rx="1" fill="#1a140c" fill-opacity=".5"/></svg>' +
    '</span>'
  stage.appendChild(status)


  // 晃动按钮
  const btn = document.createElement('button')
  btn.style.cssText =
    'position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:8;padding:9px 16px;border:0;border-radius:999px;background:rgba(247,240,224,.92);color:#2a241a;font:600 13px ui-sans-serif;cursor:pointer;box-shadow:0 2px 10px #0006;'
  root.appendChild(btn)

  // 悬停的装饰 → Enter 复制其文件名
  let toastTimer = 0
  const toast = document.createElement('div')
  toast.style.cssText =
    'position:absolute;left:50%;top:14px;transform:translateX(-50%);z-index:9;padding:6px 12px;border-radius:8px;background:rgba(20,16,11,.85);color:#fff;font:600 12px ui-monospace,monospace;opacity:0;transition:opacity .25s;pointer-events:none;'
  root.appendChild(toast)
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && hovered) {
      e.preventDefault()
      void navigator.clipboard?.writeText(hovered)
      toast.textContent = '已复制 ' + hovered
      toast.style.opacity = '1'
      window.clearTimeout(toastTimer)
      toastTimer = window.setTimeout(() => (toast.style.opacity = '0'), 1300)
    }
  }
  window.addEventListener('keydown', onKey)

  // ── 状态 ──
  let W = 0
  let s = 1
  let t = 0
  let timeScale = 1
  let raf = 0
  let fallen = false
  let settled = false // 掉落堆好后冻结静止
  let calmFrames = 0
  let fallFrames = 0
  let bodies: Body[] = []
  const textBodies: Body[] = []

  const setBtnLabel = () => (btn.textContent = fallen ? '🫳 再晃一下 · 归位' : '🫳 晃动屏幕 · 掉落')
  const toggle = () => {
    fallen = !fallen
    settled = false
    calmFrames = 0
    fallFrames = 0
    setBtnLabel()
  }

  function splitInto(el: HTMLElement, text: string, chars: boolean) {
    el.innerHTML = ''
    const units = chars ? [...text] : text.split(/(\s+)/)
    for (const tok of units) {
      if (!chars && !tok.trim()) {
        el.appendChild(document.createTextNode(tok))
        continue
      }
      const sp = document.createElement('span')
      sp.textContent = tok
      sp.style.display = 'inline-block'
      sp.style.willChange = 'transform'
      el.appendChild(sp)
      textBodies.push({ el: sp, hx: 0, hy: 0, hw: 0, hh: 0, x: 0, y: 0, vx: 0, vy: 0, rot: 0, vrot: 0 })
    }
  }

  function applyText() {
    title.innerHTML = ''
    subtitle.innerHTML = ''
    bodyP.innerHTML = ''
    textBodies.length = 0
    title.style.color = params.titleColor
    subtitle.style.color = params.subtitleColor
    bodyP.style.color = params.bodyColor
    splitInto(title, params.title, false)
    splitInto(subtitle, params.subtitle, true)
    splitInto(bodyP, params.body, false)
  }

  function rebuildBodies() {
    bodies = []
    SLOTS.forEach((o, i) => {
      const cx = o.x + o.w / 2
      const cy = o.y + o.h / 2
      bodies.push({ el: objEls[i], hx: cx, hy: cy, hw: o.w / 2, hh: o.h / 2, x: cx, y: cy, vx: 0, vy: 0, rot: 0, vrot: 0 })
    })
    const sr = stage.getBoundingClientRect()
    for (const b of textBodies) {
      b.el.style.transform = ''
      const r = b.el.getBoundingClientRect()
      const dw = r.width / s
      const dh = r.height / s
      b.hw = dw / 2
      b.hh = dh / 2
      b.hx = (r.left - sr.left) / s + b.hw
      b.hy = (r.top - sr.top) / s + b.hh
      b.x = b.hx
      b.y = b.hy
      bodies.push(b)
    }
  }

  function measure() {
    const r = container.getBoundingClientRect()
    W = Math.max(1, r.width)
    s = W / DW
    stage.style.transform = `scale(${s})`
    sheet.style.height = `${DH * s}px` // 缩放后的设计帧真实高度 → scroller 据此决定是否滚动
  }

  function tick(dt: number) {
    t += dt
    const f = dt * 60
    if (fallen && settled) {
      // 已落定 → 不再做位移/碰撞物理，但**维持翻滚**：每个 body 用各自的 vrot 持续旋转
      for (const b of bodies) {
        b.rot += b.vrot * f
        b.el.style.transform = `translate(${(b.x - b.hx).toFixed(2)}px,${(b.y - b.hy).toFixed(2)}px) rotate(${b.rot.toFixed(3)}rad)`
      }
      return
    }

    let maxSp = 0
    for (const b of bodies) {
      if (!fallen) {
        b.vx += (b.hx - b.x) * params.spring * f
        b.vy += (b.hy - b.y) * params.spring * f
        b.vrot += (0 - b.rot) * params.spring * f
        b.vx *= 0.8
        b.vy *= 0.8
        b.vrot *= 0.8
      } else {
        b.vy += params.gravity * f
        b.vrot += (Math.random() - 0.5) * 0.06 * params.spin * f
        b.vx *= 0.99
        b.vy *= 0.995
      }
      b.x += b.vx * f
      b.y += b.vy * f
      b.rot += b.vrot * f
      if (b.x < b.hw) {
        b.x = b.hw
        b.vx *= -params.bounce
      } else if (b.x > DW - b.hw) {
        b.x = DW - b.hw
        b.vx *= -params.bounce
      }
      if (b.y < b.hh) {
        b.y = b.hh
        b.vy *= -params.bounce
      } else if (b.y > DH - b.hh) {
        b.y = DH - b.hh
        b.vy *= -params.bounce
        b.vx *= 0.8
        if (Math.abs(b.vy) < 0.9) b.vy = 0 // 落到底就停住
      }
      const sp = Math.hypot(b.vx, b.vy)
      if (sp > maxSp) maxSp = sp
    }

    if (fallen) {
      for (let i = 0; i < bodies.length; i++) {
        const a = bodies[i]
        const ra = (a.hw + a.hh) * 0.5
        for (let j = i + 1; j < bodies.length; j++) {
          const c = bodies[j]
          const rc = (c.hw + c.hh) * 0.5
          const dx = c.x - a.x
          const dy = c.y - a.y
          const min = (ra + rc) * 0.7
          const d2 = dx * dx + dy * dy
          if (d2 > 0.01 && d2 < min * min) {
            const d = Math.sqrt(d2)
            const push = ((min - d) / d) * 0.3
            a.x -= dx * push
            a.y -= dy * push
            c.x += dx * push
            c.y += dy * push
          }
        }
      }
    }

    for (const b of bodies) {
      b.el.style.transform = `translate(${(b.x - b.hx).toFixed(2)}px,${(b.y - b.hy).toFixed(2)}px) rotate(${b.rot.toFixed(3)}rad)`
    }

    // 掉落后判定"堆好"→ 冻结位移，但给每个 body 派发一个缓慢的 vrot → 持续翻滚
    if (fallen) {
      fallFrames++
      if (maxSp < 0.15) calmFrames++
      else calmFrames = 0
      if (!settled && (calmFrames > 24 || fallFrames > 180)) {
        // 落定后保留各 body 掉落时的 vrot → 翻滚速度不突然衰减，始终保持同样的滚动速度
        settled = true
      }
    }
  }

  function loop() {
    raf = requestAnimationFrame(loop)
    const dt = 0.016 * timeScale
    if (dt > 0) tick(dt)
  }

  // 真机摇晃 → 切换
  let lastMag = 0
  let lastShake = 0
  const onMotion = (e: DeviceMotionEvent) => {
    const a = e.accelerationIncludingGravity
    if (!a) return
    const mag = Math.hypot(a.x || 0, a.y || 0, a.z || 0)
    const now = Date.now()
    if (Math.abs(mag - lastMag) > 16 && now - lastShake > 900) {
      lastShake = now
      toggle()
    }
    lastMag = mag
  }
  window.addEventListener('devicemotion', onMotion)
  btn.onclick = async () => {
    const DME = window.DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }
    if (DME && typeof DME.requestPermission === 'function') {
      try {
        await DME.requestPermission()
      } catch {
        /* 拒绝则仅按钮可用 */
      }
    }
    toggle()
  }

  const ro = new ResizeObserver(() => {
    measure()
    rebuildBodies()
  })
  ro.observe(container)

  setBtnLabel()
  applyText()
  measure()
  rebuildBodies()
  if ('fonts' in document) void (document as Document).fonts.ready.then(() => rebuildBodies())
  loop()

  return {
    update(next) {
      Object.assign(params, next)
      const k = Object.keys(next)
      if (k.some((x) => ['title', 'subtitle', 'body', 'titleColor', 'subtitleColor', 'bodyColor'].includes(x))) {
        applyText()
        rebuildBodies()
      }
    },
    resize() {
      measure()
      rebuildBodies()
    },
    reset() {
      fallen = false
      setBtnLabel()
    },
    getParams() {
      return { ...params }
    },
    destroy() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('devicemotion', onMotion)
      window.removeEventListener('keydown', onKey)
      btn.remove()
      root.remove()
    },
    setTimeScale(v) {
      timeScale = v
    },
    step() {
      tick(0.016)
    },
    setDebug() {
      /* no-op */
    },
  }
}

function ensureFonts() {
  if (document.getElementById('alicefall-fonts')) return
  const l = document.createElement('link')
  l.id = 'alicefall-fonts'
  l.rel = 'stylesheet'
  l.href = 'https://fonts.googleapis.com/css2?family=Grenze+Gotisch:wght@400&family=Source+Serif+Pro:wght@400&display=swap'
  document.head.appendChild(l)
  const st = document.createElement('style')
  st.textContent = '.alicefall-scroll::-webkit-scrollbar{display:none}' // 隐藏滚动条，避免占宽导致横向溢出
  document.head.appendChild(st)
}
