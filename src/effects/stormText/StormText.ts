import type { EffectHandle } from '../types'
import type { StormTextParams } from './params'

interface Word {
  el: HTMLElement
  seed: number
}

// 模拟显示世界：让一段「可读正文」像荒原风暴一样抖动/倾斜/拉扯/模糊。
// 驱动量 intensity = 基础风强 + 环境振荡 + 阵风(滚轮/滚动速度)。
// 点击关键词 → 风暴短暂平息 → 显影隐藏句。正文始终可读、关键词可点。
export function mountStormText(
  container: HTMLElement,
  initial: StormTextParams,
): EffectHandle<StormTextParams> {
  let params: StormTextParams = { ...initial }

  const root = document.createElement('div')
  root.style.cssText =
    'position:relative;width:100%;height:100%;display:grid;place-items:center;overflow:hidden;' +
    'padding:8% 9%;font-family:"Iowan Old Style",Georgia,serif;'
  container.appendChild(root)

  const para = document.createElement('p')
  para.style.cssText =
    'margin:0;max-width:640px;font-size:clamp(1.1rem,3.4vw,1.6rem);line-height:1.8;text-align:center;will-change:filter;'
  root.appendChild(para)

  const hidden = document.createElement('div')
  hidden.style.cssText =
    'position:absolute;left:0;right:0;bottom:11%;text-align:center;font-style:italic;opacity:0;' +
    'transition:opacity .8s ease;font-size:clamp(1rem,3vw,1.3rem);pointer-events:none;'
  root.appendChild(hidden)

  const readout = document.createElement('div')
  readout.style.cssText =
    'position:absolute;left:8px;top:8px;font:11px ui-monospace,monospace;color:rgba(123,255,206,.9);display:none;'
  root.appendChild(readout)

  let words: Word[] = []
  let t = 0
  let timeScale = 1
  let debug = false
  let raf = 0
  let intensity = params.windIntensity
  let gust = 0
  let calmUntilT = -1

  function calm() {
    calmUntilT = t + 2.6 // 以累计时间计，暂停/慢放时同步冻结
  }

  function build() {
    para.textContent = ''
    words = []
    hidden.textContent = params.hiddenSentence
    hidden.style.color = params.keywordColor
    const key = params.keyword.toLowerCase().replace(/[^a-z']/g, '')
    for (const tok of params.paragraph.split(/(\s+)/)) {
      if (!tok.trim()) {
        para.appendChild(document.createTextNode(tok))
        continue
      }
      const span = document.createElement('span')
      span.textContent = tok
      span.style.display = 'inline-block'
      span.style.color = params.color
      if (tok.toLowerCase().replace(/[^a-z']/g, '') === key) {
        span.style.color = params.keywordColor
        span.style.cursor = 'pointer'
        span.style.textDecoration = 'underline'
        span.style.textUnderlineOffset = '4px'
        span.addEventListener('click', calm)
      }
      para.appendChild(span)
      words.push({ el: span, seed: Math.random() * 6.28 })
    }
  }

  function frameUpdate(dt: number) {
    t += dt
    gust *= 0.94
    const calmActive = t < calmUntilT
    const ambient = 0.12 * (0.5 + 0.5 * Math.sin(t * 0.6))
    const target = calmActive ? 0 : Math.min(1.4, params.windIntensity + ambient + gust)
    intensity += (target - intensity) * 0.1
    hidden.style.opacity = calmActive ? '1' : '0'

    for (const w of words) {
      const s = w.seed
      const dx = Math.sin(t * 3 + s) * params.shake * intensity
      const dy = Math.cos(t * 2.3 + s * 1.7) * params.shake * 0.6 * intensity
      const sk = Math.sin(t * 1.7 + s) * params.skew * intensity
      const sx = 1 + Math.sin(t * 2 + s) * params.stretch * intensity
      w.el.style.transform = `translate(${dx.toFixed(2)}px,${dy.toFixed(2)}px) skewX(${sk.toFixed(2)}deg) scaleX(${sx.toFixed(3)})`
    }
    para.style.filter = `blur(${(intensity * params.blur).toFixed(2)}px)`
    if (debug) readout.textContent = `intensity ${intensity.toFixed(2)} · ${calmActive ? 'CALM' : 'storm'}`
  }

  function loop() {
    raf = requestAnimationFrame(loop)
    const dt = 0.016 * timeScale
    if (dt > 0) frameUpdate(dt)
  }

  // 阵风：滚轮（成品里换成 Lenis/ScrollTrigger 的滚动速度）
  const onWheel = (e: WheelEvent) => {
    gust += Math.min(0.6, Math.abs(e.deltaY) * 0.0009 * params.gustReactivity)
  }
  root.addEventListener('wheel', onWheel, { passive: true })

  build()
  loop()

  return {
    update(next) {
      const rebuild =
        next.paragraph !== undefined || next.keyword !== undefined || next.hiddenSentence !== undefined
      Object.assign(params, next)
      if (rebuild) build()
    },
    resize() {
      /* DOM 自适应，无需重建 */
    },
    reset() {
      calmUntilT = -1
      gust = 0
      for (const w of words) w.seed = Math.random() * 6.28
    },
    getParams() {
      return { ...params }
    },
    destroy() {
      cancelAnimationFrame(raf)
      root.removeEventListener('wheel', onWheel)
      root.remove()
    },
    setTimeScale(scale) {
      timeScale = scale
    },
    step() {
      frameUpdate(0.016)
    },
    setDebug(on) {
      debug = on
      readout.style.display = on ? 'block' : 'none'
    },
    // 故意不实现 snapshot —— DOM 效果无 canvas，lab 的截图按钮会优雅跳过（证明可选能力降级）
  }
}
