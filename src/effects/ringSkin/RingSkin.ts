import type { EffectHandle } from '../types'
import type { RingSkinParams } from './params'
import bgImg from './bg.png'
import ringImg from './ring.png'
import titleLogo from './titleLogo.png'

const DW = 375 // 设计帧宽（内容按此列宽固定排版）

// 《指环王》阅读页皮肤（Figma 31:365 / 咒语 31:456）。
// 咒语效果：未激发=低可见度金字；按住指环念咒 → 在咒语原位逐词点亮金字（覆盖未激发字）。
// 已激发进度保存在 params.fill，驱动底部指环动画进度。
export function mountRingSkin(container: HTMLElement, initial: RingSkinParams): EffectHandle<RingSkinParams> {
  ensureStyles()
  let params: RingSkinParams = { ...initial }

  const root = document.createElement('div')
  root.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;background:#0a0705;touch-action:none;'
  container.appendChild(root)

  // 背景（黑暗氛围图，object-cover 撑满）
  const bg = document.createElement('img')
  bg.src = bgImg
  bg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;z-index:0;'
  root.appendChild(bg)

  // 压暗渐变（顶/底略压暗，正文更清晰）
  const scrim = document.createElement('div')
  scrim.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1;'
  root.appendChild(scrim)

  // 咒语激发时的明亮粒子层（叠加发光）。置于文字层(col,z2)之下，确保不遮挡咒语本身。
  const fx = document.createElement('canvas')
  fx.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;'
  root.appendChild(fx)
  const fxCtx = fx.getContext('2d')!

  // 内容列：固定 375 宽居中，按设计坐标绝对定位
  const col = document.createElement('div')
  col.style.cssText = `position:absolute;left:50%;top:0;width:${DW}px;height:100%;transform:translateX(-50%);z-index:2;`
  root.appendChild(col)

  // 底部至尊魔戒（图片占位；后续替换为跟随咒语进度的视频）。按住它念咒。
  const ring = document.createElement('img')
  ring.src = ringImg
  ring.draggable = false
  ring.style.cssText = 'position:absolute;left:50%;pointer-events:auto;cursor:pointer;touch-action:none;user-select:none;-webkit-user-drag:none;'
  col.appendChild(ring)

  // 顶部英文标识（设计 31:402，left24 top116 210×103）
  const logo = document.createElement('img')
  logo.src = titleLogo
  logo.style.cssText = 'position:absolute;left:24px;top:116px;width:210px;height:auto;pointer-events:none;'
  col.appendChild(logo)

  // 标题背后的暗化模糊条（设计 34:472），提升标题可读性
  const titleBlur = document.createElement('div')
  titleBlur.style.cssText =
    'position:absolute;left:18px;top:198px;width:220px;height:64px;border-radius:0 20px 20px 0;filter:blur(12px);' +
    'background:linear-gradient(269deg, rgba(20,14,6,0) 0%, rgba(20,14,6,.72) 18%);pointer-events:none;'
  col.appendChild(titleBlur)

  const titleEl = document.createElement('p')
  titleEl.style.cssText =
    "position:absolute;left:28px;top:206px;margin:0;font-family:'Source Han Serif CN','Songti SC',serif;font-weight:500;font-size:30px;letter-spacing:6px;"
  col.appendChild(titleEl)

  const bodyP = document.createElement('p')
  bodyP.style.cssText =
    "position:absolute;left:28px;top:270px;width:286px;margin:0;font-family:'Source Serif Pro',Georgia,serif;font-size:21px;line-height:31px;"
  col.appendChild(bodyP)

  // 召唤提示（Figma 38:695）：橙色发光胶囊 + 中文 hint，置于正文与咒语之间。
  // 位置在 relayoutHint() 中按"正文底 +28、自身 40 高、咒语顶 +28"动态算出。
  const hintBox = document.createElement('div')
  hintBox.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);width:247px;height:40px;pointer-events:none;'
  // 椭圆暖光背景（替代单层 plus-lighter 模糊胶囊 —— col 有 z-index 隔离堆叠
  // 上下文，plus-lighter 无法和底图叠加，肉眼几乎看不到）。两层：
  // ① 外层椭圆向四周渐隐，营造"光晕区"
  // ② 内层与 Figma 38:696 spec 一致的胶囊（plus-lighter）叠出最亮中心
  const hintHalo = document.createElement('div')
  hintHalo.style.cssText =
    'position:absolute;left:-32px;right:-32px;top:-16px;bottom:-16px;pointer-events:none;' +
    'background:radial-gradient(ellipse 56% 62% at 50% 50%,rgba(255,170,82,.42) 0%,rgba(255,147,35,.22) 42%,rgba(255,147,35,0) 76%);' +
    'filter:blur(6px);'
  hintBox.appendChild(hintHalo)
  const hintGlow = document.createElement('div')
  hintGlow.style.cssText =
    'position:absolute;inset:0;background:rgba(255,147,35,.16);filter:blur(10px);mix-blend-mode:plus-lighter;border-radius:100px;'
  hintBox.appendChild(hintGlow)
  const hintText = document.createElement('p')
  hintText.textContent = '念出铭文，唤醒魔戒之力'
  hintText.style.cssText =
    "position:absolute;left:0;right:0;top:50%;margin:0;transform:translateY(-50%);text-align:center;" +
    "font-family:'Source Han Serif CN','Songti SC',serif;font-weight:500;font-size:18px;letter-spacing:1.08px;" +
    'color:rgba(243,179,119,.8);text-shadow:0 0 2px rgba(255,208,147,.6);white-space:nowrap;'
  hintBox.appendChild(hintText)
  col.appendChild(hintBox)

  // 咒语容器：未激发层（hollow，定义版位）+ 激发层（active，逐词点亮，正下方 15px）
  const quoteWrap = document.createElement('div')
  quoteWrap.style.cssText =
    "position:absolute;left:50%;width:328px;transform:translateX(-50%);text-align:center;" +
    "font-family:'Cormorant',Georgia,serif;font-weight:500;font-size:30px;line-height:36px;"
  col.appendChild(quoteWrap)
  let activeWords: HTMLElement[] = []

  // 状态栏（始终可见）
  const status = document.createElement('div')
  status.style.cssText =
    'position:absolute;left:0;right:0;top:0;height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 20px 0 28px;z-index:6;'
  col.appendChild(status)

  // ── 运行态 ──
  let raf = 0
  let t = 0
  let timeScale = 1
  let holding = false

  // 火焰粒子（从激发文字的字形边缘沿笔画切线流动）
  interface Spark { x: number; y: number; tx: number; ty: number; speed: number; life: number; max: number; size: number }
  let sparks: Spark[] = []
  // hint 文字飘散粒子（开始念咒时由文字字形采样而来）
  interface Dust { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number }
  let dust: Dust[] = []
  let hintDispersed = false
  let FXW = 0
  let FXH = 0
  function sizeFx() {
    const r = container.getBoundingClientRect()
    FXW = Math.max(1, r.width)
    FXH = Math.max(1, r.height)
    const dp = Math.min(window.devicePixelRatio || 1, 2)
    fx.width = Math.floor(FXW * dp)
    fx.height = Math.floor(FXH * dp)
    fxCtx.setTransform(dp, 0, 0, dp, 0, 0)
  }

  // 离屏：检测每个词字形的"边缘像素"，作为火焰发射点（box 局部 CSS 坐标）
  const og = document.createElement('canvas')
  const ogCtx = og.getContext('2d', { willReadFrequently: true })!
  const edgeCache = new Map<number, { x: number; y: number; cx: number; cy: number }[]>()
  function wordEdges(i: number): { x: number; y: number; cx: number; cy: number }[] {
    const cached = edgeCache.get(i)
    if (cached) return cached
    const el = activeWords[i]
    const tok = el.textContent || ''
    const r = el.getBoundingClientRect()
    const bw = Math.max(1, r.width)
    const bh = Math.max(1, r.height)
    const dp = Math.min(window.devicePixelRatio || 1, 2)
    og.width = Math.ceil(bw * dp)
    og.height = Math.ceil(bh * dp)
    ogCtx.setTransform(dp, 0, 0, dp, 0, 0)
    ogCtx.clearRect(0, 0, bw, bh)
    ogCtx.fillStyle = '#fff'
    ogCtx.textAlign = 'center'
    ogCtx.textBaseline = 'middle'
    ogCtx.font = "500 30px 'Cormorant', Georgia, serif"
    ogCtx.fillText(tok, bw / 2, bh / 2)
    const W2 = og.width
    const H2 = og.height
    const data = ogCtx.getImageData(0, 0, W2, H2).data
    const A = (x: number, y: number) => (x < 0 || y < 0 || x >= W2 || y >= H2 ? 0 : data[(y * W2 + x) * 4 + 3])
    const pts: { x: number; y: number; cx: number; cy: number }[] = []
    const ccx = W2 / 2
    const ccy = H2 / 2
    const step = Math.max(2, Math.round(dp))
    for (let y = 0; y < H2; y += step) {
      for (let x = 0; x < W2; x += step) {
        if (A(x, y) <= 100) continue
        // 字形内、且邻接到字外 → 边缘
        if (A(x - step, y) <= 100 || A(x + step, y) <= 100 || A(x, y - step) <= 100 || A(x, y + step) <= 100) {
          let dx = x - ccx
          let dy = y - ccy
          const len = Math.hypot(dx, dy) || 1
          dx /= len
          dy /= len
          pts.push({ x: x / dp, y: y / dp, cx: dx, cy: dy }) // CSS 坐标 + 朝外法线
        }
      }
    }
    // 限量
    let out = pts
    if (pts.length > 180) {
      out = []
      const stride = pts.length / 180
      for (let k = 0; k < 180; k++) out.push(pts[Math.floor(k * stride)])
    }
    edgeCache.set(i, out)
    return out
  }

  // 构建未激发层 + 逐词激发层
  function buildQuote() {
    quoteWrap.innerHTML = ''
    activeWords = []
    edgeCache.clear() // 文案变更 → 字形边缘缓存失效
    const [r, g, b] = hexToRgb(params.quoteColor)

    // 未激发（hollow）：低可见度金字 + 柔光，定义整体版位
    const hollow = document.createElement('p')
    hollow.textContent = params.quote
    hollow.style.cssText =
      `margin:0;white-space:pre-line;color:rgba(${r},${g},${b},${params.hollowAlpha});text-shadow:0 0 3px rgba(255,197,142,.6);`
    quoteWrap.appendChild(hollow)

    // 激发（active）：与未激发层同位叠放，逐词在原位点亮（覆盖未激发字）
    const active = document.createElement('div')
    active.style.cssText = 'position:absolute;left:0;top:0;width:100%;'
    params.quote.split('\n').forEach((line) => {
      const ld = document.createElement('div')
      line.split(' ').forEach((tok, ti) => {
        if (ti > 0) ld.appendChild(document.createTextNode(' '))
        if (!tok) return
        const w = document.createElement('span')
        w.textContent = tok
        w.style.cssText =
          `display:inline-block;opacity:0;color:${params.quoteColor};text-shadow:0 0 3px #FFC58E;will-change:opacity;`
        ld.appendChild(w)
        activeWords.push(w)
      })
      active.appendChild(ld)
    })
    quoteWrap.appendChild(active)
    renderQuote()
  }

  // 每帧按 fill(已激发进度) 逐词在原位点亮激发层
  function renderQuote() {
    const n = activeWords.length
    if (!n) return
    const a = Math.max(0, Math.min(1, params.fill)) * n // 已点亮的"词进度"
    for (let i = 0; i < n; i++) {
      const p = Math.max(0, Math.min(1, a - i)) // 该词点亮度 0→1
      activeWords[i].style.opacity = p.toFixed(3)
    }
    applyRingProgress()
  }

  function applyRing() {
    // 注意：top 不在这里设置 —— 由 relayoutHint 按"咒语底 + ringGap"动态算
    ring.style.width = `${320 * params.ringScale}px`
    ring.style.height = 'auto'
    ring.style.transform = 'translateX(-50%)'
  }

  // 指环动画"播放进度"由已激发咒语进度驱动（当前为图片占位 → 亮度/辉光随进度增强；
  // 替换为 <video> 时改为 video.currentTime = params.fill * duration）
  // 未开始念咒（fill=0 且没按住）时，高光在 0..1 之间呼吸往复，提示用户点击
  function applyRingProgress() {
    const fill = Math.max(0, Math.min(1, params.fill))
    if (fill <= 0 && !holding) {
      // 呼吸节律：完整一次 ~2.6s；k ∈ [0,1]
      const k = 0.5 - 0.5 * Math.cos(t * 2.4)
      const gl = 8 + 36 * k
      const op = 0.12 + 0.66 * k
      ring.style.filter = `brightness(${(0.78 + 0.5 * k).toFixed(2)}) drop-shadow(0 0 ${gl.toFixed(0)}px rgba(255,160,60,${op.toFixed(2)}))`
      return
    }
    const pulse = 0.06 * Math.sin(t * 2)
    const gl = 8 + 34 * fill
    const op = 0.18 + 0.5 * fill + pulse
    ring.style.filter = `brightness(${(0.82 + 0.5 * fill).toFixed(2)}) drop-shadow(0 0 ${gl.toFixed(0)}px rgba(255,160,60,${op.toFixed(2)}))`
  }

  function applyText() {
    titleEl.textContent = params.title
    titleEl.style.color = params.titleColor
    bodyP.textContent = params.body
    bodyP.style.color = params.bodyColor
    buildQuote()
    relayoutHint()
    // 字体异步加载完后再校准一次，避免字体替换导致正文高度回跳
    if (document.fonts?.ready) void document.fonts.ready.then(relayoutHint)
  }

  // 整列垂直排版：正文 → +28 → hint(40h) → +28 → 咒语 → +ringGap → 指环
  function relayoutHint() {
    const bodyBottom = bodyP.offsetTop + bodyP.offsetHeight
    hintBox.style.top = `${bodyBottom + 28}px`
    const quoteTop = bodyBottom + 28 + 40 + 28
    quoteWrap.style.top = `${quoteTop}px`
    ring.style.top = `${quoteTop + quoteWrap.offsetHeight + params.ringGap}px`
  }

  function applyScrim() {
    const s = params.scrim
    scrim.style.background =
      `linear-gradient(180deg, rgba(8,5,3,${(s * 0.85).toFixed(2)}) 0%, rgba(8,5,3,${(s * 0.2).toFixed(2)}) 26%, ` +
      `rgba(8,5,3,${(s * 0.15).toFixed(2)}) 58%, rgba(8,5,3,${(s * 0.55).toFixed(2)}) 100%)`
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

  // 从"正在点亮的词"的字形边缘沿笔画切线流动火焰粒子
  // 笔画切线 = 旋转 90° 的"朝外法线"(e.cx, e.cy) → (−cy, cx) 或 (cy, −cx)，随机正反向贴笔画跑
  function spawnSparks() {
    if (!holding || params.fill >= 1) return
    const n = activeWords.length
    if (!n) return
    const a = params.fill * n
    const lead = Math.min(n - 1, Math.floor(a))
    const edges = wordEdges(lead)
    if (!edges.length) return
    const r = activeWords[lead].getBoundingClientRect()
    const cr = container.getBoundingClientRect()
    const x0 = r.left - cr.left
    const y0 = r.top - cr.top
    for (let i = 0; i < 7; i++) {
      const e = edges[(Math.random() * edges.length) | 0]
      const sign = Math.random() < 0.5 ? 1 : -1
      sparks.push({
        // 紧贴笔画边缘（仅向外偏 0.6px，看起来粘在字形上）
        x: x0 + e.x + e.cx * 0.6,
        y: y0 + e.y + e.cy * 0.6,
        // 沿切线方向（顺/逆笔画各半）
        tx: -e.cy * sign,
        ty: e.cx * sign,
        speed: 38 + Math.random() * 42,
        life: 0,
        max: 0.45 + Math.random() * 0.5,
        size: 1.0 + Math.random() * 2.0,
      })
    }
    if (sparks.length > 460) sparks = sparks.slice(-460)
  }
  function updateSparks(dt: number) {
    for (const s of sparks) {
      // 主运动：沿笔画切线向前
      s.x += s.tx * s.speed * dt
      // 次运动：火焰天性微微上飘（仅在生命后段，避免立即偏离笔画）
      s.y += s.ty * s.speed * dt - 14 * dt * (s.life / s.max)
      // 速度衰减 → 越接近熄灭越慢
      s.speed *= 1 - Math.min(1, dt * 0.7)
      s.life += dt
    }
    sparks = sparks.filter((s) => s.life < s.max)
  }
  function renderSparks() {
    fxCtx.clearRect(0, 0, FXW, FXH)
    if (!sparks.length && !dust.length) return
    fxCtx.save()
    fxCtx.globalCompositeOperation = 'lighter'
    for (const s of sparks) {
      const k = 1 - s.life / s.max // 1(新生/炽白) → 0(熄灭/暗红)
      const sz = s.size * (0.35 + k * 0.95)
      const g = (70 + 175 * k) | 0
      const b = (18 * k * k) | 0
      const al = k * k * 0.95
      fxCtx.shadowColor = `rgba(255,140,40,${(al * 0.8).toFixed(3)})`
      fxCtx.shadowBlur = 5 + 12 * k
      fxCtx.fillStyle = `rgba(255,${g},${b},${al.toFixed(3)})`
      fxCtx.beginPath()
      fxCtx.arc(s.x, s.y, sz, 0, Math.PI * 2)
      fxCtx.fill()
    }
    for (const d of dust) {
      const k = 1 - d.life / d.max
      const sz = d.size * (0.55 + k * 0.7)
      const g = (150 + 70 * k) | 0
      const al = k * k * 0.9
      fxCtx.shadowColor = `rgba(255,170,80,${(al * 0.7).toFixed(3)})`
      fxCtx.shadowBlur = 4 + 10 * k
      fxCtx.fillStyle = `rgba(255,${g},${(90 * k) | 0},${al.toFixed(3)})`
      fxCtx.beginPath()
      fxCtx.arc(d.x, d.y, sz, 0, Math.PI * 2)
      fxCtx.fill()
    }
    fxCtx.restore()
  }

  // hint「念出铭文…」按字形采样为粒子，向外飘散
  function sampleHintDust() {
    const r = hintText.getBoundingClientRect()
    const cr = container.getBoundingClientRect()
    const bw = Math.max(1, r.width)
    const bh = Math.max(1, r.height)
    const x0 = r.left - cr.left
    const y0 = r.top - cr.top
    const dp = Math.min(window.devicePixelRatio || 1, 2)
    og.width = Math.ceil(bw * dp)
    og.height = Math.ceil(bh * dp)
    ogCtx.setTransform(dp, 0, 0, dp, 0, 0)
    ogCtx.clearRect(0, 0, bw, bh)
    ogCtx.fillStyle = '#fff'
    ogCtx.textAlign = 'center'
    ogCtx.textBaseline = 'middle'
    ogCtx.font = "500 18px 'Source Han Serif CN','Songti SC',serif"
    // letterSpacing 在新版浏览器支持；不支持时退化为无字距（采样略密一点，视觉影响小）
    type CtxWithLS = CanvasRenderingContext2D & { letterSpacing?: string }
    ;(ogCtx as CtxWithLS).letterSpacing = '1.08px'
    ogCtx.fillText('念出铭文，唤醒魔戒之力', bw / 2, bh / 2)
    const W2 = og.width
    const H2 = og.height
    const data = ogCtx.getImageData(0, 0, W2, H2).data
    const step = Math.max(2, Math.round(dp * 2))
    const cx = bw / 2
    for (let y = 0; y < H2; y += step) {
      for (let x = 0; x < W2; x += step) {
        if (data[(y * W2 + x) * 4 + 3] <= 110) continue
        const px = x / dp
        const py = y / dp
        // 越靠两侧、越靠下，初速度越大 → 整体往外炸开 + 略上浮
        const sx = (px - cx) / Math.max(1, cx)
        dust.push({
          x: x0 + px,
          y: y0 + py,
          vx: sx * (18 + Math.random() * 22) + (Math.random() - 0.5) * 12,
          vy: -(10 + Math.random() * 22) - py * 0.2,
          life: 0,
          max: 0.7 + Math.random() * 0.6,
          size: 0.7 + Math.random() * 1.0,
        })
      }
    }
  }
  function updateDust(dt: number) {
    for (const d of dust) {
      d.x += d.vx * dt
      d.y += d.vy * dt
      d.vx *= 1 - Math.min(1, dt * 1.2)
      d.vy += 16 * dt // 轻微下沉（飘散末段）
      d.life += dt
    }
    dust = dust.filter((d) => d.life < d.max)
  }
  function disperseHint() {
    if (hintDispersed) return
    hintDispersed = true
    sampleHintDust()
    hintBox.style.transition = 'opacity .35s ease-out'
    hintBox.style.opacity = '0'
  }
  function restoreHint() {
    if (!hintDispersed) return
    hintDispersed = false
    hintBox.style.transition = 'opacity .5s ease-in'
    hintBox.style.opacity = '1'
  }

  function tick(dt: number) {
    t += dt
    if (holding && params.fill < 1) {
      params.fill = Math.min(1, params.fill + params.fillRate * dt) // 念咒累加并保存进度
    }
    renderQuote()
    spawnSparks()
    updateSparks(dt)
    updateDust(dt)
  }
  function loop() {
    raf = requestAnimationFrame(loop)
    const dt = 0.016 * timeScale
    if (dt > 0) tick(dt)
    renderSparks()
  }

  // 按住指环念咒
  const startChant = (e: Event) => {
    e.preventDefault()
    if (params.fill >= 1) return // 已完全激发 → 按住无反应
    holding = true
    disperseHint() // 开始念咒 → hint 文字以粒子飘散消失
  }
  const stopChant = () => {
    if (!holding) return
    holding = false
    if (params.fill < 1) {
      params.fill = 0 // 松手时进度未满 → 取消回填，下次从 0 开始
      restoreHint() // 进度回滚 → hint 重新淡入，下次再念
    }
  }
  ring.addEventListener('pointerdown', startChant)
  window.addEventListener('pointerup', stopChant)
  ring.addEventListener('pointercancel', stopChant)

  applyText()
  applyScrim()
  applyStatus()
  applyRing()
  sizeFx()
  const ro = new ResizeObserver(() => sizeFx())
  ro.observe(container)
  loop()

  return {
    update(next) {
      const keys = Object.keys(next)
      Object.assign(params, next)
      if (keys.some((k) => ['title', 'body', 'titleColor', 'bodyColor'].includes(k))) applyText()
      else if (keys.some((k) => ['quote', 'quoteColor', 'hollowAlpha'].includes(k))) buildQuote()
      else renderQuote()
      if (next.scrim !== undefined) applyScrim()
      if (next.timeColor !== undefined) applyStatus()
      if (next.ringScale !== undefined) applyRing()
      if (next.ringGap !== undefined) relayoutHint()
    },
    resize() {
      sizeFx()
      relayoutHint()
    },
    reset() {
      params.fill = 0 // 清空已激发进度
      holding = false
      sparks = []
      dust = []
      restoreHint() // hint 重新出现，等待下一次念咒
      renderQuote()
    },
    getParams() {
      return { ...params } // params.fill 即已保存的已激发咒语进度
    },
    destroy() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      ring.removeEventListener('pointerdown', startChant)
      window.removeEventListener('pointerup', stopChant)
      ring.removeEventListener('pointercancel', stopChant)
      root.remove()
    },
    setTimeScale(s) {
      timeScale = s
    },
    step() {
      tick(0.016)
    },
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function ensureStyles() {
  if (document.getElementById('ring-skin-fonts')) return
  const l = document.createElement('link')
  l.id = 'ring-skin-fonts'
  l.rel = 'stylesheet'
  l.href = 'https://fonts.googleapis.com/css2?family=Cormorant:wght@500;600&family=Source+Serif+Pro:wght@400&display=swap'
  document.head.appendChild(l)
}
