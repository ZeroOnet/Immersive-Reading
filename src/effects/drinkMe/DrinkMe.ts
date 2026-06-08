import type { EffectHandle } from '../types'
import type { DrinkMeParams } from './params'

interface WordEl {
  el: HTMLElement
  furniture: boolean
  seed: number
}

// 最出彩：《爱丽丝》喝下药水，文字忽大忽小、行距拉开、长词像家具一样膨胀，
// 一个会随文字变大而变小的 Alice 在字里行间穿行。
// 交互：点 🧪 DRINK ME 变大 / 🍰 EAT ME 变小（再点一次回正）。
export function mountDrinkMe(
  container: HTMLElement,
  initial: DrinkMeParams,
): EffectHandle<DrinkMeParams> {
  let params: DrinkMeParams = { ...initial }

  const root = document.createElement('div')
  root.style.cssText =
    'position:relative;width:100%;height:100%;overflow:hidden;display:grid;place-items:center;' +
    'padding:8% 8% 16%;font-family:"Iowan Old Style",Georgia,serif;' +
    'background:radial-gradient(120% 90% at 50% 0%, #1a1030, #0b0716);'
  container.appendChild(root)

  const para = document.createElement('p')
  para.style.cssText = 'margin:0;max-width:680px;text-align:center;transition:none;will-change:font-size,line-height;'
  root.appendChild(para)

  const alice = document.createElement('div')
  alice.textContent = '👧'
  alice.style.cssText = 'position:absolute;z-index:4;pointer-events:none;will-change:transform;line-height:1;'
  root.appendChild(alice)

  // 药瓶
  const bar = document.createElement('div')
  bar.style.cssText = 'position:absolute;left:0;right:0;bottom:14px;z-index:5;display:flex;gap:12px;justify-content:center;'
  const drinkBtn = mkBottle('🧪', 'DRINK ME')
  const eatBtn = mkBottle('🍰', 'EAT ME')
  bar.append(drinkBtn.wrap, eatBtn.wrap)
  root.appendChild(bar)

  function mkBottle(icon: string, label: string) {
    const wrap = document.createElement('button')
    wrap.style.cssText =
      'display:flex;flex-direction:column;align-items:center;gap:2px;border:0;background:transparent;cursor:pointer;' +
      '-webkit-tap-highlight-color:transparent;'
    const ic = document.createElement('div')
    ic.textContent = icon
    ic.style.cssText = 'font-size:30px;line-height:1;filter:drop-shadow(0 2px 6px #0008);transition:transform .15s;'
    const tag = document.createElement('div')
    tag.textContent = label
    tag.style.cssText =
      'font:600 10px ui-sans-serif,system-ui;letter-spacing:.18em;color:#0b0716;background:' +
      params.accent +
      ';padding:3px 8px;border-radius:999px;'
    wrap.append(ic, tag)
    wrap.onmousedown = () => (ic.style.transform = 'scale(.85)')
    wrap.onmouseup = () => (ic.style.transform = '')
    return { wrap, tag }
  }

  let words: WordEl[] = []
  let W = 0
  let H = 0
  let t = 0
  let timeScale = 1
  let debug = false
  let raf = 0
  let scale = 1
  let target = 1
  let potion: 'none' | 'drink' | 'eat' = 'none'

  function measure() {
    const r = container.getBoundingClientRect()
    W = Math.max(1, r.width)
    H = Math.max(1, r.height)
  }

  function build() {
    measure()
    para.textContent = ''
    words = []
    const minLen = params.furnitureMinLen
    for (const tok of params.text.split(/(\s+)/)) {
      if (!tok.trim()) {
        para.appendChild(document.createTextNode(tok))
        continue
      }
      const span = document.createElement('span')
      span.textContent = tok
      span.style.display = 'inline-block'
      span.style.color = params.color
      span.style.transformOrigin = 'center bottom'
      const bare = tok.replace(/[^A-Za-z']/g, '')
      const furniture = bare.length >= minLen
      if (furniture) span.style.color = params.accent
      para.appendChild(span)
      words.push({ el: span, furniture, seed: Math.random() * 6.28 })
    }
  }

  function setPotion(which: 'drink' | 'eat') {
    potion = potion === which ? 'none' : which
    target = potion === 'drink' ? params.maxScale : potion === 'eat' ? params.minScale : 1
  }
  drinkBtn.wrap.onclick = () => setPotion('drink')
  eatBtn.wrap.onclick = () => setPotion('eat')

  function update(dt: number) {
    t += dt
    scale += (target - scale) * (params.ease * dt * 60)
  }

  function render() {
    // 全局变大变小 + 行距拉开
    para.style.fontSize = (params.baseFontSize * scale).toFixed(2) + 'px'
    para.style.lineHeight = (1.4 + Math.max(0, scale - 1) * params.lineHeightExpand).toFixed(2)

    // 长词像家具一样膨胀（喝大后才膨胀，带轻微脉动）
    const grow = Math.max(0, scale - 1)
    for (const w of words) {
      if (!w.furniture || grow < 0.02) {
        w.el.style.transform = ''
        continue
      }
      const pulse = 0.6 + 0.4 * Math.sin(t * 2.2 + w.seed)
      const f = 1 + params.furnitureExtra * grow * pulse
      w.el.style.transform = `scale(${f.toFixed(3)})`
    }

    // Alice：随文字变大而变小，在字里行间横穿
    const wx = (t * params.aliceSpeed) % 1
    const x = 12 + wx * (W - 36)
    const y = H * 0.5 + Math.sin(t * 3) * H * 0.14 - 10
    const aScale = Math.max(0.4, 1 / (0.7 + scale * 0.5))
    const hop = Math.abs(Math.sin(t * 7)) * 6
    alice.style.fontSize = params.aliceSize + 'px'
    alice.style.transform = `translate(${x.toFixed(1)}px, ${(y - hop).toFixed(1)}px) scale(${aScale.toFixed(2)}) scaleX(${Math.sin(t * params.aliceSpeed * 6.28) >= 0 ? 1 : -1})`

    if (debug) {
      let dbg = root.querySelector<HTMLElement>('.dbg')
      if (!dbg) {
        dbg = document.createElement('div')
        dbg.className = 'dbg'
        dbg.style.cssText = 'position:absolute;left:8px;top:8px;z-index:6;font:11px ui-monospace,monospace;color:#7bffce;'
        root.appendChild(dbg)
      }
      dbg.textContent = `scale ${scale.toFixed(2)} · potion ${potion}`
    }
  }

  function loop() {
    raf = requestAnimationFrame(loop)
    const dt = 0.016 * timeScale
    if (dt > 0) update(dt)
    render()
  }

  const ro = new ResizeObserver(() => measure())
  ro.observe(container)
  build()
  loop()

  return {
    update(next) {
      const rebuild = next.text !== undefined || next.furnitureMinLen !== undefined || next.color !== undefined || next.accent !== undefined
      Object.assign(params, next)
      if (rebuild) build()
    },
    resize() {
      measure()
    },
    reset() {
      potion = 'none'
      target = 1
    },
    getParams() {
      return { ...params }
    },
    destroy() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      root.remove()
    },
    setTimeScale(s) {
      timeScale = s
    },
    step() {
      update(0.016)
      render()
    },
    setDebug(on) {
      debug = on
      if (!on) root.querySelector('.dbg')?.remove()
    },
    // DOM 效果，无 canvas → 不实现 snapshot（lab 截图按钮优雅跳过）
  }
}
