import type { EffectHandle } from '../types'
import type { PrideSkinParams } from './params'
import bgVideo from './bg.mp4'
import bgOverlayImg from './bgOverlay.png'
import stickerShadowSvg from './stickerShadow.svg'
import stickerPaperImg from './stickerPaper.png'
import truthEnHandSvg from './truthEnHand.svg'

const DW = 375 // 设计列宽
const STICKER_W = 319
const STICKER_H = 48
const LAYER_W = 322 // 比贴纸略宽，留点边缘卷起的余地
const LAYER_H = 100

// 《傲慢与偏见》皮肤：Darcy 表面说"我深爱你"，贴纸下藏着原话"我觉得你配不上我"。
// 交互：左端粘住（锚点），右端是开口（可抓的卷起端）；指针在贴纸上向右拖动 → 沿 Y 轴翻折，
// 同时横向拉伸（创口贴胶层弹性）。松手未达阈值则按弹簧物理自然垂落回原位；达阈值则完成揭开。
// 中文译文在完全揭开（peel ≥ 0.95）后**二态切换**——不是渐变，与设计稿同步。
export function mountPrideSkin(container: HTMLElement, initial: PrideSkinParams): EffectHandle<PrideSkinParams> {
  ensureStyles()
  let params: PrideSkinParams = { ...initial }

  const root = document.createElement('div')
  root.style.cssText =
    'position:relative;width:100%;height:100%;overflow:hidden;background:#4b4b4b;touch-action:none;'
  container.appendChild(root)

  // 背景：天空薄云缓慢漂移视频（首帧=尾帧无缝循环）+ 大气覆盖层（设计 58:3525），带声播放。
  // 浏览器禁止带声 autoplay → 被拒时降级静音播 + 首次交互（点击/触摸/按键）解除静音
  // 视频相对屏幕(375×794)的位置/尺寸取自 Figma node 345:656（x=-44 y=0 w=500 h=888）；溢出由 root overflow:hidden 裁掉
  const BG_VIDEO_FRAME = { left: -44, top: 0, width: 500, height: 888 }
  const bg = document.createElement('video')
  bg.src = bgVideo
  bg.autoplay = true
  bg.loop = true
  bg.playsInline = true
  bg.setAttribute('playsinline', '')
  bg.setAttribute('webkit-playsinline', '')
  bg.style.cssText =
    `position:absolute;left:${BG_VIDEO_FRAME.left}px;top:${BG_VIDEO_FRAME.top}px;width:${BG_VIDEO_FRAME.width}px;height:${BG_VIDEO_FRAME.height}px;` +
    'object-fit:cover;pointer-events:none;z-index:0;'
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
  const bgOv = document.createElement('img')
  bgOv.src = bgOverlayImg
  bgOv.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.4;pointer-events:none;z-index:0;'
  root.appendChild(bgOv)

  // 顶部压暗（设计 58:3527：from-black 1% → transparent 15%，overlay 20%）
  const scrim = document.createElement('div')
  scrim.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1;mix-blend-mode:overlay;'
  root.appendChild(scrim)

  // 375 内容列居中
  const col = document.createElement('div')
  col.style.cssText = `position:absolute;left:50%;top:0;width:${DW}px;height:100%;transform:translateX(-50%);z-index:2;`
  root.appendChild(col)

  // 状态栏
  const status = document.createElement('div')
  status.style.cssText =
    'position:absolute;left:0;right:0;top:0;height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 20px 0 28px;z-index:6;'
  col.appendChild(status)

  // 标题（58:3500 + 58:3501）
  const titleEn = document.createElement('p')
  // 字体栈先 Apple 系统 'Bodoni 72'（窄于 Web 的 Bodoni Moda），iPhone 上直接命中；
  // 再 fallback Bodoni Moda（更宽）→ 用更紧字距与略小字号兜住 375 列宽不溢出
  titleEn.style.cssText =
    "position:absolute;left:28px;right:18px;top:104px;margin:0;font-family:'Bodoni 72','Bodoni Moda',serif;font-weight:400;font-size:42px;letter-spacing:-.42px;line-height:34px;color:#565574;white-space:nowrap;"
  col.appendChild(titleEn)
  const titleZh = document.createElement('p')
  titleZh.style.cssText =
    "position:absolute;left:28px;top:144px;margin:0;font-family:'Source Han Serif CN','Songti SC',serif;font-weight:500;font-size:31px;color:#7d6355;white-space:nowrap;"
  col.appendChild(titleZh)

  // 正文（58:3483，306w 20px/30）
  const body = document.createElement('div')
  body.style.cssText =
    "position:absolute;left:28px;top:205px;width:306px;font-family:'Source Serif Pro',Georgia,serif;font-weight:300;font-size:20px;line-height:30px;color:#585054;"
  col.appendChild(body)

  // 揭示堆叠：truth 在下 + lie 在上（可撕）。perspective 设在 stack 本地，避免被 col 的 translateX 隔离
  const stack = document.createElement('div')
  stack.style.cssText =
    'position:absolute;left:0;right:0;top:584px;height:100px;perspective:1100px;perspective-origin:30% 50%;transform-style:preserve-3d;'
  col.appendChild(stack)

  // ── 下层：真话（始终摆在那儿，等待被发现）
  const truthLayer = document.createElement('div')
  truthLayer.style.cssText = 'position:absolute;inset:0;'
  stack.appendChild(truthLayer)
  // 白色胶带本体（58:3549：311×48，inset 阴影）
  const truthSticker = document.createElement('div')
  truthSticker.style.cssText =
    'position:absolute;left:50%;top:6px;transform:translateX(-50%);width:311px;height:48px;background:#fff;border-radius:2px;' +
    'box-shadow:2px -2px 1px 0 rgba(255,255,255,.4),inset 1px 1px 4px 0 rgba(0,0,0,.4);'
  truthLayer.appendChild(truthSticker)
  // 左侧浅棕胶贴（58:3551：14×48，蜡纸感）
  const truthTape = document.createElement('div')
  truthTape.style.cssText =
    'position:absolute;left:-14px;top:0;width:14px;height:48px;' +
    'background:linear-gradient(90deg,rgba(0,0,0,.2),rgba(0,0,0,.2)),linear-gradient(90deg,rgb(232,214,194),rgb(232,214,194));' +
    'box-shadow:-4px 0 2px 0 rgba(0,0,0,.24);'
  truthSticker.appendChild(truthTape)
  const truthEn = document.createElement('img')
  truthEn.src = truthEnHandSvg
  truthEn.style.cssText =
    'position:absolute;left:17.6px;top:15.05px;width:274.25px;height:20.47px;object-fit:contain;pointer-events:none;'
  truthSticker.appendChild(truthEn)
  // 中文译文：静态层（不跟贴纸翻折），lie/truth 同位叠放，揭开后做交叉渐变
  const lieZh = document.createElement('p')
  lieZh.style.cssText =
    "position:absolute;left:0;right:0;top:66px;margin:0;text-align:center;font-family:'JiangCheng XieHei','PingFang SC',sans-serif;" +
    'font-weight:200;font-size:20px;line-height:23px;color:#544e44;opacity:.5;transform:translateX(-5.5px);transition:opacity .3s ease-out;white-space:nowrap;will-change:opacity;'
  truthLayer.appendChild(lieZh)
  const truthZh = document.createElement('p')
  truthZh.style.cssText =
    "position:absolute;left:0;right:0;top:66px;margin:0;text-align:center;font-family:'JiangCheng XieHei','PingFang SC',sans-serif;" +
    'font-weight:200;font-size:20px;line-height:23px;color:#544e44;opacity:0;transform:translateX(-8.5px);transition:opacity .3s ease-out;white-space:nowrap;will-change:opacity;'
  truthLayer.appendChild(truthZh)

  // ── 上层：甜言（可撕）。整层位置固定 —— 只允许水平右→左揭开，折痕恒竖直
  const stickerLeft = (LAYER_W - STICKER_W) / 2
  const lieLayer = document.createElement('div')
  lieLayer.style.cssText =
    `position:absolute;left:calc(50% - ${LAYER_W / 2}px);top:0;width:${LAYER_W}px;height:${LAYER_H}px;` +
    'will-change:opacity;cursor:grab;touch-action:none;'
  stack.appendChild(lieLayer)
  // 贴纸下方的卷起阴影（Figma Vector 1，320×58 黑色 28%+ 模糊）；露出底+右下角
  const stickerShadow = document.createElement('div')
  stickerShadow.style.cssText =
    `position:absolute;left:${stickerLeft - 2}px;top:8px;width:${STICKER_W + 1}px;height:${STICKER_H + 10}px;` +
    `background-image:url(${stickerShadowSvg});background-size:100% 100%;background-repeat:no-repeat;pointer-events:none;`
  lieLayer.appendChild(stickerShadow)
  // stuck：粘在页面上的部分。clip-path 从右往左缩，文字/纸纹随折痕被剪掉
  const stuck = document.createElement('div')
  stuck.style.cssText =
    `position:absolute;left:${stickerLeft}px;top:6px;width:${STICKER_W}px;height:${STICKER_H}px;border-radius:2px;overflow:hidden;` +
    `background-image:url(${stickerPaperImg});background-size:375px 577px;background-position:-28px -445px;background-repeat:no-repeat;` +
    'box-shadow:2px -1px 1px 0 rgba(255,255,255,.9);will-change:clip-path,filter;'
  lieLayer.appendChild(stuck)
  const lieEn = document.createElement('p')
  lieEn.style.cssText =
    "position:absolute;left:6px;right:6px;top:50%;margin:0;transform:translateY(-50%);text-align:center;" +
    "font-family:'Source Serif Pro',Georgia,serif;font-weight:500;font-size:20px;letter-spacing:0;line-height:31px;color:#544e44;white-space:nowrap;"
  stuck.appendChild(lieEn)
  // flap：翻起的部分。与 stuck 同尺寸/同纹理（保证折痕处纹理连续），靠 clip-path 切出
  // "折痕右侧"区域，再绕**折痕轴**（与起手方向垂直的页面内轴）做 3D 旋转 90°→180°
  const flap = document.createElement('div')
  flap.style.cssText =
    `position:absolute;left:${stickerLeft}px;top:6px;width:${STICKER_W}px;height:${STICKER_H}px;border-radius:2px;` +
    'backface-visibility:visible;' +
    `background-image:linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25)),url(${stickerPaperImg});` +
    'background-size:100% 100%,375px 577px;background-position:0 0,-28px -445px;background-repeat:no-repeat,no-repeat;' +
    'will-change:transform,clip-path,opacity;pointer-events:none;'
  lieLayer.appendChild(flap)

  // ── 运行态：拖拽 + 弹簧物理 ──
  let raf = 0
  let timeScale = 1
  let dragging = false
  let prevX = 0 // 上一次 pointermove 的 x（仅用水平增量）
  let velocity = 0 // peel 单位/秒
  let lastMoveT = 0
  let settled = false // 静止态（避免 raf 浪费）
  // 拖拽行程换算：水平拽这么远 = 揭完。约等于一个贴纸宽度。
  const PULL_DIST = 280

  function applyText() {
    titleEn.textContent = params.titleEn
    titleZh.textContent = params.titleZh
    body.innerHTML = ''
    params.body.split(/\n\s*\n/).forEach((p, i, arr) => {
      const para = document.createElement('p')
      para.textContent = p.trim()
      para.style.cssText = `margin:0 0 ${i < arr.length - 1 ? 8 : 0}px 0;color:${params.bodyColor};`
      body.appendChild(para)
    })
    lieEn.textContent = params.lieEn
    lieZh.textContent = params.lieZh
    truthEn.alt = params.truthEn
    truthZh.textContent = params.truthZh
  }

  function applyScrim() {
    const s = params.scrim
    scrim.style.background = `linear-gradient(180deg, rgba(0,0,0,${s.toFixed(2)}) 1.2%, rgba(0,0,0,0) 15.4%)`
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

  // peel 状态 → 可视变换：竖直折痕从右向左推进（只允许水平右→左揭开）；
  //   - stuck 用 clip-path 从右边裁掉已撕走的宽度
  //   - flap 紧贴 fold 右侧，绕竖直折痕做 rotateY(90°→180°)，右端升起再折回、背面更暗
  // 中文译文在 peel ≥ 0.95 完成态二态切换；贴纸本身位置固定（lieLayer 不旋转/不平移）。
  function applyPeel() {
    const p = Math.max(0, Math.min(1, params.peel))
    // 只允许水平右→左揭开 → 折痕恒竖直（phi=0），下方几何随之退化为直折
    const phiDeg = 0
    const phiRad = (phiDeg * Math.PI) / 180
    const tan = Math.tan(phiRad)
    const halfH = STICKER_H / 2
    const tiltOff = halfH * Math.abs(tan) // 折痕在顶/底相对中点的水平偏移
    // peel∈[0,1] 把折痕中心从"贴纸右端外"扫到"贴纸左端外"
    const maxX = STICKER_W + tiltOff
    const minX = -tiltOff
    const foldCx = maxX - p * (maxX - minX)
    const foldXTop = foldCx + halfH * tan
    const foldXBot = foldCx - halfH * tan

    // stuck：保留折痕左侧
    stuck.style.clipPath = `polygon(0 0,${foldXTop.toFixed(1)}px 0,${foldXBot.toFixed(1)}px ${STICKER_H}px,0 ${STICKER_H}px)`
    // shadow：尺寸 320×58、相对 stuck (+2,-2) 偏移。沿同一斜折痕线**外推**到 shadow 顶
    // (sticker y=2 → shadow y=0) 和底 (sticker y=60 → shadow y=58)，覆盖整张阴影高度
    //（之前只覆盖到 y=46，把视觉最显的底部 12px 卷起阴影裁掉了 → 看起来"阴影丢了"）
    const SH_H = STICKER_H + 10 // 58
    const slope = (foldXBot - foldXTop) / STICKER_H
    const shFoldXTop = foldXTop + slope * 2 + 2 // shadow y=0
    const shFoldXBot = foldXTop + slope * (STICKER_H + 12) + 2 // shadow y=58
    stickerShadow.style.clipPath = `polygon(0 0,${shFoldXTop.toFixed(1)}px 0,${shFoldXBot.toFixed(1)}px ${SH_H}px,0 ${SH_H}px)`
    // flap：保留折痕右侧（与 stuck 同 div 尺寸/同纹理，clip 出右半）
    flap.style.clipPath = `polygon(${foldXTop.toFixed(1)}px 0,${STICKER_W}px 0,${STICKER_W}px ${STICKER_H}px,${foldXBot.toFixed(1)}px ${STICKER_H}px)`
    // 折痕轴 = 从折痕顶到底的方向（页面内向量，z=0）
    const axX = foldXBot - foldXTop
    const axY = STICKER_H
    const axLen = Math.hypot(axX, axY) || 1
    // 旋转支点放在折痕中点（flap 自身坐标系）
    const foldMidX = (foldXTop + foldXBot) / 2
    flap.style.transformOrigin = `${foldMidX.toFixed(1)}px ${halfH}px`
    // 90°：edge-on（刚被掀起，看不到面）→ 180°：折回贴纸背面盖在 stuck 上方
    const flapAng = 90 + p * 90
    flap.style.transform = `rotate3d(${(axX / axLen).toFixed(4)},${(axY / axLen).toFixed(4)},0,${flapAng.toFixed(1)}deg)`
    flap.style.opacity = p > 0.02 ? '1' : '0'
    // stuck 悬浮阴影：peel>0 才出现
    stuck.style.filter = p > 0 ? `drop-shadow(0 ${(p * 10).toFixed(1)}px ${(p * 12).toFixed(1)}px rgba(0,0,0,${(p * 0.32).toFixed(2)}))` : 'none'
    // 完成临界（p≥0.86）整层淡出，不再做任何位移/旋转
    const fade = p < 0.86 ? 1 : Math.max(0, (1 - p) / 0.14)
    lieLayer.style.opacity = fade.toFixed(3)
    // 二态译文切换
    const peeled = p >= 0.95
    titleEn.style.color = peeled ? '#8d8e9d' : '#565574'
    titleZh.style.color = peeled ? '#b79f82' : '#7d6355'
    lieZh.style.opacity = peeled ? '0' : '.5'
    truthZh.style.opacity = peeled ? '.5' : '0'
  }

  // ── 拖拽：只允许水平右→左揭开。peel 按水平增量累加（向左推进、向右回退），竖直移动忽略。
  const onPointerDown = (e: PointerEvent) => {
    if (params.peel >= 1) return // 已完成
    e.preventDefault()
    dragging = true
    settled = false
    prevX = e.clientX
    velocity = 0
    lastMoveT = performance.now()
    lieLayer.setPointerCapture?.(e.pointerId)
    lieLayer.style.cursor = 'grabbing'
  }
  const onPointerMove = (e: PointerEvent) => {
    if (!dragging) return
    // 只认水平增量（向左为正 → 揭开推进；向右 → 回退）。竖直移动忽略。
    const dxInc = prevX - e.clientX
    prevX = e.clientX
    const newPeel = Math.max(0, Math.min(1, params.peel + dxInc / PULL_DIST))
    const now = performance.now()
    const dt = Math.max(1, now - lastMoveT) / 1000
    velocity = (newPeel - params.peel) / dt
    params.peel = newPeel
    lastMoveT = now
    applyPeel()
  }
  const onPointerUp = () => {
    if (!dragging) return
    dragging = false
    settled = false
    lieLayer.style.cursor = 'grab'
    // 不在此处判定阈值 —— 物理 loop 会基于 peel 与 releaseThreshold 自动选目标
  }
  lieLayer.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)

  // 弹簧物理：松手后向 target 回弹/落定。target = peel>=threshold ? 1 : 0
  function physicsTick(dt: number) {
    const target = params.peel >= params.releaseThreshold ? 1 : 0
    const dx = params.peel - target
    if (Math.abs(dx) < 1e-3 && Math.abs(velocity) < 1e-3) {
      params.peel = target
      velocity = 0
      settled = true
      applyPeel()
      return
    }
    const k = params.stiffness
    const c = params.damping
    const accel = -k * dx - c * velocity
    velocity += accel * dt
    params.peel = Math.max(0, Math.min(1, params.peel + velocity * dt))
    applyPeel()
  }

  function loop() {
    raf = requestAnimationFrame(loop)
    if (settled || dragging) return
    const dt = 0.016 * timeScale
    if (dt <= 0) return
    physicsTick(dt)
  }

  applyText()
  applyScrim()
  applyStatus()
  applyPeel()
  loop()

  return {
    update(next) {
      Object.assign(params, next)
      const keys = Object.keys(next)
      if (
        keys.some((k) =>
          ['titleEn', 'titleZh', 'body', 'bodyColor', 'lieEn', 'lieZh', 'truthEn', 'truthZh'].includes(k),
        )
      )
        applyText()
      if (next.scrim !== undefined) applyScrim()
      if (next.timeColor !== undefined) applyStatus()
      if (next.peel !== undefined) {
        velocity = 0
        settled = false
        applyPeel()
      }
    },
    resize() {},
    reset() {
      params.peel = 0
      velocity = 0
      dragging = false
      settled = false
      applyPeel()
    },
    getParams() {
      return { ...params }
    },
    destroy() {
      cancelAnimationFrame(raf)
      lieLayer.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      root.remove()
    },
    setTimeScale(s) {
      timeScale = s
    },
    step() {
      physicsTick(0.016)
    },
  }
}

function ensureStyles() {
  if (document.getElementById('pride-skin-fonts')) return
  const l = document.createElement('link')
  l.id = 'pride-skin-fonts'
  l.rel = 'stylesheet'
  l.href =
    'https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@400;500&family=Source+Serif+Pro:wght@300;500&family=Kalam:wght@400&display=swap'
  document.head.appendChild(l)
}
