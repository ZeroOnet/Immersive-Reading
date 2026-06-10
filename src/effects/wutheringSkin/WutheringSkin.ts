import type { EffectHandle } from '../types'
import type { WutheringSkinParams } from './params'
import bgVideo from './bg.mp4'

interface Unit {
  el: HTMLElement
  seed: number
}

// 《呼啸山庄》阅读页皮肤（Figma 5:436）：静态背景；荒原风把整页文字吹得偏移/倾斜/拉扯/模糊（Storm Text），
// 并有手绘风线掠过画面；滚动加阵风；点关键词风停、显影隐藏句。整篇可滚动、标题不吸顶、隐藏滚动条。
export function mountWutheringSkin(
  container: HTMLElement,
  initial: WutheringSkinParams,
): EffectHandle<WutheringSkinParams> {
  ensureFonts()
  ensureStyle()
  let params: WutheringSkinParams = { ...initial }

  const root = document.createElement('div')
  root.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;background:#0a0d0f;'
  container.appendChild(root)

  // 背景视频相对屏幕(375×794)的位置/尺寸，取自 Figma node 99:63（x=0 y=-1 w=449 h=799）：
  //   左对齐、顶部上溢 1px、右溢 74、底溢 4；溢出屏幕部分由 root overflow:hidden 裁掉。
  const BG_VIDEO_FRAME = { left: 0, top: -1, width: 449, height: 799 }
  // 背景视频（替代之前的 bg1/bg2 双图层）
  const bgVid = document.createElement('video')
  bgVid.src = bgVideo
  bgVid.autoplay = true
  bgVid.loop = true
  bgVid.playsInline = true
  bgVid.setAttribute('playsinline', '')
  bgVid.setAttribute('webkit-playsinline', '')
  bgVid.style.cssText =
    `position:absolute;left:${BG_VIDEO_FRAME.left}px;top:${BG_VIDEO_FRAME.top}px;width:${BG_VIDEO_FRAME.width}px;height:${BG_VIDEO_FRAME.height}px;` +
    'object-fit:cover;pointer-events:none;' // scaleAspectFill；frame 取自 Figma node 99:63
  root.appendChild(bgVid)
  // 自动播放策略：浏览器禁止带声音的视频自动播放。
  // 先试带声播 → 被拒时降级静音播 + 注册首次点击解除静音
  bgVid.muted = false
  bgVid.volume = 1
  bgVid.play().catch(() => {
    bgVid.muted = true
    void bgVid.play().catch(() => {})
    const unmute = () => {
      bgVid.muted = false
      void bgVid.play().catch(() => {})
    }
    window.addEventListener('click', unmute, { once: true })
    window.addEventListener('touchstart', unmute, { once: true, passive: true })
    window.addEventListener('keydown', unmute, { once: true })
  })

  const scrim = document.createElement('div')
  scrim.style.cssText = 'position:absolute;inset:0;pointer-events:none;'
  root.appendChild(scrim)

  const col = document.createElement('div')
  col.style.cssText = 'position:absolute;inset:0;max-width:390px;margin:0 auto;pointer-events:none;'
  root.appendChild(col)

  const status = document.createElement('div')
  status.style.cssText =
    'position:absolute;left:0;right:0;top:0;height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 20px 0 28px;color:#d4cfc9;z-index:3;'
  status.innerHTML =
    '<span style="font:600 15px/1 -apple-system,system-ui;letter-spacing:-.3px">9:41</span>' +
    '<span style="display:flex;align-items:center;gap:6px">' +
    '<svg width="18" height="11" viewBox="0 0 18 11" fill="#d4cfc9"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="5" y="4.5" width="3" height="6.5" rx="1"/><rect x="10" y="2" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="11" rx="1"/></svg>' +
    '<svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="#d4cfc9" stroke-width="1.4"><path d="M1 4.5a10 10 0 0 1 14 0M3.5 7a6 6 0 0 1 9 0M6 9.3a2.5 2.5 0 0 1 4 0"/></svg>' +
    '<svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="#d4cfc9" stroke-opacity=".5"/><rect x="2" y="2" width="17" height="8" rx="1.5" fill="#d4cfc9"/><rect x="23" y="3.5" width="2" height="5" rx="1" fill="#d4cfc9" fill-opacity=".5"/></svg>' +
    '</span>'
  col.appendChild(status)

  const scrollWrap = document.createElement('div')
  scrollWrap.className = 'wuth-body'
  scrollWrap.style.cssText =
    'position:absolute;left:0;right:0;top:44px;bottom:0;overflow-y:auto;pointer-events:auto;-webkit-overflow-scrolling:touch;'
  col.appendChild(scrollWrap)

  const inner = document.createElement('div')
  inner.style.cssText = 'padding:34px 0 40px;'
  scrollWrap.appendChild(inner)

  const title = document.createElement('h1')
  title.style.cssText =
    "margin:0 0 0 24px;font-family:'Cormorant',Georgia,serif;font-weight:600;font-size:48px;line-height:58px;letter-spacing:-2.4px;white-space:nowrap;"
  inner.appendChild(title)

  const subtitle = document.createElement('p')
  subtitle.style.cssText =
    "margin:-2px 0 0 28px;font-family:'Source Han Serif CN','Noto Serif SC','Songti SC',serif;font-weight:500;font-size:32px;line-height:46px;white-space:nowrap;"
  inner.appendChild(subtitle)

  const bodyBox = document.createElement('div')
  bodyBox.style.cssText =
    "margin:15px 46px 0 28px;font-family:'Source Serif Pro',Georgia,serif;font-weight:300;font-size:21px;line-height:31px;"
  inner.appendChild(bodyBox)

  const hidden = document.createElement('div')
  hidden.style.cssText =
    "position:absolute;left:0;right:0;bottom:11%;text-align:center;font-style:italic;opacity:0;transition:opacity .8s ease;" +
    "font-family:'Source Serif Pro',Georgia,serif;font-weight:300;font-size:clamp(1rem,3.4vw,1.3rem);pointer-events:none;z-index:2;"
  col.appendChild(hidden)

  // ── 状态 ──
  let t = 0
  let timeScale = 1
  let debug = false
  let raf = 0
  let gust = 0
  let calmUntil = -1
  let lastScroll = 0
  let units: Unit[] = []

  function splitInto(el: HTMLElement, text: string, isBody: boolean) {
    el.innerHTML = ''
    const key = params.keyword.toLowerCase().replace(/[^a-z']/g, '')
    for (const tok of text.split(/(\s+)/)) {
      if (!tok.trim()) {
        el.appendChild(document.createTextNode(tok))
        continue
      }
      const makeSpan = (ch: string) => {
        const sp = document.createElement('span')
        sp.textContent = ch
        sp.style.display = 'inline-block'
        el.appendChild(sp)
        units.push({ el: sp, seed: Math.random() * 6.28 })
        return sp
      }
      if (/[一-鿿]/.test(tok)) {
        for (const ch of [...tok]) makeSpan(ch)
      } else {
        const sp = makeSpan(tok)
        if (isBody && tok.toLowerCase().replace(/[^a-z']/g, '') === key) {
          sp.style.cursor = 'pointer'
          sp.style.textDecoration = 'underline'
          sp.style.textUnderlineOffset = '4px'
          sp.style.color = '#bfe6ff'
          sp.addEventListener('click', calm)
        }
      }
    }
  }

  function calm() {
    calmUntil = t + 2.6
  }

  function applyText() {
    units = []
    title.style.color = params.titleColor
    subtitle.style.color = params.subtitleColor
    bodyBox.style.color = params.bodyColor
    hidden.style.color = params.titleColor
    hidden.textContent = params.hiddenSentence
    splitInto(title, params.title, false)
    splitInto(subtitle, params.subtitle, false)
    bodyBox.innerHTML = ''
    params.body.split(/\n\s*\n/).forEach((para) => {
      const p = document.createElement('p')
      p.style.cssText = 'margin:0 0 24px'
      bodyBox.appendChild(p)
      splitInto(p, para.trim(), true)
    })
  }
  function applyScrim() {
    const s = params.scrim
    scrim.style.background =
      `linear-gradient(180deg, rgba(8,10,12,${(s * 0.7).toFixed(2)}) 0%, rgba(8,10,12,${(s * 0.2).toFixed(2)}) 28%, ` +
      `rgba(8,10,12,${(s * 0.1).toFixed(2)}) 52%, rgba(8,10,12,${(s * 0.55).toFixed(2)}) 100%)`
  }

  function tick(dt: number) {
    t += dt
    gust *= 0.94
    const calmActive = t < calmUntil
    const ambient = 0.12 * (0.5 + 0.5 * Math.sin(t * 0.6))
    const swayI = calmActive ? 0 : Math.min(1.4, params.windIntensity + ambient + gust)

    // 文字施风：偏移/倾斜/拉扯 + 整体模糊（模糊随风强，滑块即时生效）
    for (const u of units) {
      const s = u.seed
      const dx = Math.sin(t * 3 + s) * params.shake * swayI
      const dy = Math.cos(t * 2.3 + s * 1.7) * params.shake * 0.6 * swayI
      const sk = Math.sin(t * 1.7 + s) * params.skew * swayI
      const sx = 1 + Math.sin(t * 2 + s) * params.stretch * swayI
      u.el.style.transform = `translate(${dx.toFixed(2)}px,${dy.toFixed(2)}px) skewX(${sk.toFixed(2)}deg) scaleX(${sx.toFixed(3)})`
    }
    const blurPx = swayI * params.blur
    inner.style.filter = blurPx > 0.05 ? `blur(${blurPx.toFixed(2)}px)` : 'none'
    // 点 wind 不再弹出底部隐藏台词（仅保留「风停」效果）；hidden 始终隐藏
  }

  function loop() {
    raf = requestAnimationFrame(loop)
    const dt = 0.016 * timeScale
    if (dt > 0) tick(dt)
  }

  const onScroll = () => {
    const s = scrollWrap.scrollTop
    gust += Math.min(0.7, Math.abs(s - lastScroll) * 0.01 * params.gustReactivity)
    lastScroll = s
  }
  scrollWrap.addEventListener('scroll', onScroll, { passive: true })

  applyText()
  applyScrim()
  loop()

  return {
    update(next) {
      Object.assign(params, next)
      const k = Object.keys(next)
      if (k.some((x) => ['title', 'subtitle', 'body', 'titleColor', 'subtitleColor', 'bodyColor', 'keyword', 'hiddenSentence'].includes(x))) applyText()
      if (next.scrim !== undefined) applyScrim()
    },
    resize() {},
    reset() {
      calmUntil = -1
      gust = 0
    },
    getParams() {
      return { ...params }
    },
    destroy() {
      cancelAnimationFrame(raf)
      scrollWrap.removeEventListener('scroll', onScroll)
      root.remove()
    },
    setTimeScale(s) {
      timeScale = s
    },
    step() {
      tick(0.016)
    },
    setDebug(on) {
      debug = on
      hidden.style.outline = debug ? '1px dashed rgba(123,255,206,.4)' : 'none'
    },
  }
}

function ensureFonts() {
  if (document.getElementById('wuth-skin-fonts')) return
  const l = document.createElement('link')
  l.id = 'wuth-skin-fonts'
  l.rel = 'stylesheet'
  l.href = 'https://fonts.googleapis.com/css2?family=Cormorant:wght@600&family=Noto+Serif+SC:wght@500&family=Source+Serif+Pro:wght@300&display=swap'
  document.head.appendChild(l)
}
function ensureStyle() {
  if (document.getElementById('wuth-style')) return
  const s = document.createElement('style')
  s.id = 'wuth-style'
  s.textContent = '.wuth-body{scrollbar-width:none;-ms-overflow-style:none}.wuth-body::-webkit-scrollbar{width:0;height:0;display:none}'
  document.head.appendChild(s)
}
