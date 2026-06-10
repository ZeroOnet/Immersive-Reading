import type { EffectHandle } from '../types'
import type { VeilSkinParams } from './params'
import bgVideo from './bg.mp4'
import bgOverlayImg from './bgOverlay.png'
import dotSvg from './dot.svg'

const DW = 375 // 设计列宽

// 《面纱》皮肤：标题 + 一整段冷静叙述的正文 + 底部一句斜体 Kalam 台词「The dog it was that died.」
// 交互：点击正文段落 → 段落 blur+淡化、右下角弹出一张米色解释卡，揭示 Walter 临终自嘲的真意：
//   "我原本想用霍乱惩罚你，没想到最后死的却是我自己"。再点一次（或解释卡内任意处）→ 收起还原
export function mountVeilSkin(container: HTMLElement, initial: VeilSkinParams): EffectHandle<VeilSkinParams> {
  ensureStyles()
  let params: VeilSkinParams = { ...initial }

  const root = document.createElement('div')
  root.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;background:#4b4b4b;touch-action:none;'
  container.appendChild(root)

  // 背景：油灯火焰闪烁视频（首帧=尾帧无缝循环）+ 大气覆盖层，带声播放。
  // 视频相对屏幕(375×794)的位置/尺寸取自 Figma node 101:69（x=-6 y=-27 w=468 h=832）；溢出由 root overflow:hidden 裁掉
  // 浏览器禁止带声 autoplay → 被拒时降级静音播 + 首次交互（点击/触摸/按键）解除静音
  const BG_VIDEO_FRAME = { left: -6, top: -27, width: 468, height: 832 }
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
  bgOv.style.cssText = bg.style.cssText
  root.appendChild(bgOv)

  // 压暗
  const scrim = document.createElement('div')
  scrim.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1;'
  root.appendChild(scrim)

  // 内容列 375 居中
  const col = document.createElement('div')
  col.style.cssText = `position:absolute;left:50%;top:0;width:${DW}px;height:100%;transform:translateX(-50%);z-index:2;`
  root.appendChild(col)

  // 状态栏
  const status = document.createElement('div')
  status.style.cssText =
    'position:absolute;left:0;right:0;top:0;height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 20px 0 28px;z-index:6;'
  col.appendChild(status)

  // 标题
  const titleEn = document.createElement('p')
  titleEn.style.cssText =
    "position:absolute;left:28px;right:18px;top:104px;margin:0;font-family:'Bodoni 72','Bodoni Moda',serif;font-weight:400;font-size:42px;letter-spacing:-.42px;line-height:34px;color:#d6c8b1;white-space:nowrap;"
  col.appendChild(titleEn)
  const titleZh = document.createElement('p')
  titleZh.style.cssText =
    "position:absolute;left:28px;top:144px;margin:0;font-family:'Source Han Serif CN','Songti SC',serif;font-weight:500;font-size:33px;color:#d6c8b1;white-space:nowrap;"
  col.appendChild(titleZh)

  // 正文段落（解释卡打开时被模糊+淡化，但不再是点击触发区）
  const body = document.createElement('p')
  body.style.cssText =
    "position:absolute;left:28px;top:209px;width:256px;margin:0;font-family:'Source Serif Pro',Georgia,serif;font-weight:300;font-size:21px;line-height:32px;color:#eae5dc;white-space:pre-wrap;pointer-events:none;" +
    'transition:filter .35s ease, opacity .35s ease;will-change:filter,opacity;'
  col.appendChild(body)

  // 底部手写体台词三段：Figma 用「flex-center 定位框 + 内层 rotate 包装 + <p>」三层结构，
  // 旋转中心 = 定位框中心；直接用 transform-origin: 0 50% 会偏位
  function makePhrase(leftPx: number, topPx: number, wPx: number, hPx: number, rotDeg: number, extraTfm = '') {
    const wrap = document.createElement('div')
    wrap.style.cssText =
      `position:absolute;left:${leftPx}px;top:${topPx}px;width:${wPx}px;height:${hPx}px;` +
      'display:flex;align-items:center;justify-content:center;pointer-events:none;' +
      (extraTfm ? `transform:${extraTfm};` : '')
    const rotor = document.createElement('div')
    rotor.style.cssText = `transform:rotate(${rotDeg}deg);`
    const p = document.createElement('p')
    p.style.cssText = 'margin:0;white-space:nowrap;'
    rotor.appendChild(p)
    wrap.appendChild(rotor)
    return { wrap, p }
  }
  // phrase 字体样式（统一应用）
  const PHRASE_CSS =
    "font-family:'Kalam',cursive;font-weight:400;font-size:30px;line-height:41px;text-shadow:0 1px 2px rgba(0,0,0,.35);"
  // 设计稿坐标 + 尺寸（每段都用 flex-center 居中、再内层 rotate）
  const ph1 = makePhrase(7.21, 631.5, 122.956, 80.645, 21.49)
  const ph2 = makePhrase(126.6, 680.19, 85.799, 59.281, 14.55)
  const ph3 = makePhrase(99.74, 706.32, 143.96, 77.978, 16.25)
  ;[ph1, ph2, ph3].forEach((ph) => {
    ph.p.style.cssText += PHRASE_CSS
    col.appendChild(ph.wrap)
  })
  // 小圆点：呼吸灯动效（CSS @keyframes），提示用户这里可点
  const dot = document.createElement('img')
  dot.src = dotSvg
  dot.className = 'veil-breath'
  dot.style.cssText = 'position:absolute;left:223px;top:713px;width:10px;height:10px;cursor:pointer;'
  col.appendChild(dot)

  // 中文译文（江城斜黑，斜置 24.43°）。Figma 多了一层 -translate-x-1/2，必须显式加 translateX(-50%)
  const tr = makePhrase(0, 698.06, 139.709, 80.083, 24.43, 'translateX(-50%)')
  tr.wrap.style.left = 'calc(50% - 116.49px)'
  tr.p.style.cssText +=
    "font-family:'Noto Sans SC','Source Han Sans CN','PingFang SC',sans-serif;font-style:italic;font-weight:300;font-size:20px;line-height:23px;letter-spacing:.4px;text-shadow:0 1px 2px rgba(0,0,0,.4);"
  col.appendChild(tr.wrap)

  // 解释卡（设计 58:3981 + 58:3982）：米色 blur 背板 + 上方说明 + 引用框
  // 整张卡用 opacity + transform 做出现/收起动画，初始隐藏
  const noteBox = document.createElement('div')
  noteBox.style.cssText =
    'position:absolute;left:209px;top:438px;width:150px;height:252px;pointer-events:none;will-change:opacity,transform;'
  col.appendChild(noteBox)
  // 内嵌一层 "卡纸" 做带 blur 的米色背板（filter 不能加在 noteBox，否则文字会糊）
  const noteBackdrop = document.createElement('div')
  noteBackdrop.style.cssText =
    'position:absolute;inset:0;background:#d6c8b1;border:9px solid #d6c8b1;border-radius:16px;' +
    'opacity:.96;filter:blur(3px);box-shadow:0 6px 24px rgba(0,0,0,.35);'
  noteBox.appendChild(noteBackdrop)
  // 内容（在 backdrop 之上，不被模糊；padding 把它推进 backdrop 的有效内框）
  const noteContent = document.createElement('div')
  noteContent.style.cssText =
    'position:absolute;left:15px;top:16px;width:120px;display:flex;flex-direction:column;gap:16px;' +
    // 设计字体「将城斜黑」(JiangChengXieHei) 是斜黑体、自带斜，不可加载 → 用思源黑/苹方 + font-style:italic 近似那个斜。
    // 强调一律用字重(下方 500/700/900)，不靠 CSS 斜体：斜来自字体、加粗来自字重，二者区分。
    "font-family:'Noto Sans SC','Source Han Sans CN','PingFang SC',sans-serif;font-style:italic;color:#1e2e2e;"
  noteBox.appendChild(noteContent)
  // 上半段（混合字号/字重的说明文）
  const noteText = document.createElement('p')
  noteText.style.cssText = 'margin:0;line-height:20px;color:#1e2e2e;'
  noteContent.appendChild(noteText)
  // 引用块（左边线 + teal 文字）
  const quoteWrap = document.createElement('div')
  quoteWrap.style.cssText =
    'border-left:2px solid rgba(30,46,46,.2);padding-left:8px;display:flex;align-items:center;min-height:80px;'
  noteContent.appendChild(quoteWrap)
  const quoteText = document.createElement('p')
  quoteText.style.cssText = 'margin:0;font-size:16px;line-height:22px;font-weight:500;color:#30858c;mix-blend-mode:multiply;'
  quoteWrap.appendChild(quoteText)

  // ── 应用文案/视觉 ──
  function applyText() {
    titleEn.textContent = params.titleEn
    titleZh.textContent = params.titleZh
    body.innerHTML = params.body.replace(/\n/g, '<br/>')
    body.style.color = params.bodyColor
    ph1.p.textContent = params.phrase1
    ph2.p.textContent = params.phrase2
    ph3.p.textContent = params.phrase3
    ;[ph1, ph2, ph3].forEach((ph) => (ph.p.style.color = params.phraseColor))
    tr.p.textContent = params.translation
    tr.p.style.color = params.translationColor
    // 解释卡内容：对齐 Figma 58:3983 / 58:3985。基础 300、强调 500，出处 13px 40% 暗、书名 700，后半句回 15px 满色。
    const introWalter = esc(params.noteIntro).replace('Walter', '<span style="font-weight:500">Walter</span>') // Walter 加粗 500
    const closeParen = esc(params.noteSrcSuffix.charAt(0)) // "）" 仍属暗淡出处段
    const afterParen = esc(params.noteSrcSuffix.slice(1)) // "，这里表达的意思是：" 回 15px 满色
    noteText.innerHTML =
      `<span style="font-size:15px;font-weight:300">${introWalter} </span>` +
      `<span style="font-size:15px;font-weight:500">${esc(params.noteIntroBold)}</span>` +
      `<span style="font-size:13px;color:rgba(30,46,46,.4)"> ${esc(params.noteSrcPrefix)}</span>` +
      `<span style="font-size:13px;font-weight:700;color:rgba(30,46,46,.4)">${esc(params.noteSrc)}</span>` +
      `<span style="font-size:13px;color:rgba(30,46,46,.4)">${closeParen}</span>` +
      `<span style="font-size:15px;font-weight:300">${afterParen}</span>`
    // 引文：第一处加粗 900、第二处 700（设计 58:3985）
    let qBold = 0
    const qWeights = [900, 700]
    quoteText.innerHTML = params.noteQuote
      .split(/(\*\*[^*]+\*\*)/g)
      .map((seg) => {
        if (seg.startsWith('**') && seg.endsWith('**')) {
          const w = qWeights[qBold] ?? 700
          qBold++
          return `<b style="font-weight:${w}">${esc(seg.slice(2, -2))}</b>`
        }
        return esc(seg)
      })
      .join('')
  }
  function applyScrim() {
    const s = params.scrim
    scrim.style.background = `linear-gradient(180deg, rgba(0,0,0,${(s * 0.8).toFixed(2)}) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 70%, rgba(0,0,0,${(s * 0.6).toFixed(2)}) 100%)`
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

  // 解释卡 / 正文状态映射：tooltipOpen ∈ [0,1]
  //  body: opacity 1→0.28、filter blur 0→2px
  //  noteBox: opacity 0→1、translateY +14px→0、scale .96→1（轻微浮入）
  function applyOpen() {
    const o = Math.max(0, Math.min(1, params.tooltipOpen))
    const bodyOpacity = 1 - o * 0.72
    const bodyBlur = (o * 2).toFixed(2)
    body.style.opacity = bodyOpacity.toFixed(3)
    body.style.filter = `blur(${bodyBlur}px)`
    noteBox.style.opacity = o.toFixed(3)
    noteBox.style.transform = `translateY(${((1 - o) * 14).toFixed(1)}px) scale(${(0.96 + o * 0.04).toFixed(3)})`
    noteBox.style.pointerEvents = o > 0.5 ? 'auto' : 'none'
  }
  // 切换动画：用 raf 自驱（不依赖 CSS transition 在 .style 直写时的兼容性）
  let raf = 0
  let target = params.tooltipOpen
  function tweenTo(v: number) {
    target = Math.max(0, Math.min(1, v))
    if (raf) return
    const tick = () => {
      const cur = params.tooltipOpen
      const next = cur + (target - cur) * 0.18
      if (Math.abs(target - next) < 0.002) {
        params.tooltipOpen = target
        applyOpen()
        raf = 0
        return
      }
      params.tooltipOpen = next
      applyOpen()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
  }

  // 点击"The dog it was that died"三段台词 / 或呼吸的圆点 → 触发解释卡
  const onTriggerClick = (e: Event) => {
    e.stopPropagation()
    tweenTo(params.tooltipOpen > 0.5 ? 0 : 1)
  }
  const onNoteClick = (e: Event) => {
    e.stopPropagation()
    tweenTo(0)
  }
  ;[ph1, ph2, ph3].forEach((ph) => {
    ph.wrap.style.pointerEvents = 'auto'
    ph.wrap.style.cursor = 'pointer'
    ph.wrap.addEventListener('click', onTriggerClick)
  })
  dot.addEventListener('click', onTriggerClick)
  noteBox.addEventListener('click', onNoteClick)

  applyText()
  applyScrim()
  applyStatus()
  applyOpen()

  return {
    update(next) {
      Object.assign(params, next)
      const keys = Object.keys(next)
      if (
        keys.some((k) =>
          [
            'titleEn', 'titleZh', 'body', 'bodyColor', 'phrase1', 'phrase2', 'phrase3', 'phraseColor',
            'translation', 'translationColor', 'noteIntro', 'noteIntroBold', 'noteSrcPrefix', 'noteSrc',
            'noteSrcSuffix', 'noteQuote',
          ].includes(k),
        )
      )
        applyText()
      if (next.scrim !== undefined) applyScrim()
      if (next.timeColor !== undefined) applyStatus()
      if (next.tooltipOpen !== undefined) applyOpen()
    },
    resize() {},
    reset() {
      params.tooltipOpen = 0
      applyOpen()
    },
    getParams() {
      return { ...params }
    },
    destroy() {
      if (raf) cancelAnimationFrame(raf)
      ;[ph1, ph2, ph3].forEach((ph) => ph.wrap.removeEventListener('click', onTriggerClick))
      dot.removeEventListener('click', onTriggerClick)
      noteBox.removeEventListener('click', onNoteClick)
      root.remove()
    },
  }
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function ensureStyles() {
  if (document.getElementById('veil-skin-fonts')) return
  const l = document.createElement('link')
  l.id = 'veil-skin-fonts'
  l.rel = 'stylesheet'
  l.href =
    'https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@400;500&family=Noto+Sans+SC:wght@300;500;700;900&family=Source+Serif+Pro:wght@300&family=Kalam:wght@300;400;700&display=swap'
  document.head.appendChild(l)
  // 呼吸灯：1.6s 一次的 scale + opacity + drop-shadow 循环
  const st = document.createElement('style')
  st.id = 'veil-skin-style'
  st.textContent =
    '@keyframes veil-breath{' +
    '0%,100%{opacity:.55;transform:scale(1);filter:drop-shadow(0 0 2px rgba(255,255,255,.35))}' +
    '50%{opacity:1;transform:scale(1.45);filter:drop-shadow(0 0 8px rgba(255,255,255,.9))}' +
    '}' +
    '.veil-breath{animation:veil-breath 1.6s ease-in-out infinite;transform-origin:center center;will-change:transform,opacity,filter}'
  document.head.appendChild(st)
}
