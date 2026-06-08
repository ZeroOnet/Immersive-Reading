import './portal.css'
import { SCREENS, type PortalScreen } from './data'
import { createGlobalPhone } from './phone'

const app = document.getElementById('app')!

// 全局手机：fixed 叠在所有屏之上，按当前屏切换内容
const phone = createGlobalPhone()
document.body.appendChild(phone.el)

function buildScreen(s: PortalScreen): HTMLElement {
  const sec = document.createElement('section')
  sec.className = `screen screen--${s.kind}${s.effectId ? ' has-phone' : ' no-phone'}`
  sec.dataset.effect = s.effectId ?? ''
  if (s.accent) sec.style.setProperty('--accent', s.accent)

  const copy = document.createElement('div')
  copy.className = 'copy'
  if (s.eyebrow) {
    const e = document.createElement('p')
    e.className = 'eyebrow'
    e.textContent = s.eyebrow
    copy.appendChild(e)
  }
  const h = document.createElement('h2')
  h.textContent = s.title
  copy.appendChild(h)
  for (const line of s.lines ?? []) {
    const p = document.createElement('p')
    p.className = 'line'
    p.textContent = line
    copy.appendChild(p)
  }
  if (s.book) {
    const b = document.createElement('p')
    b.className = 'book'
    b.textContent = s.book
    copy.appendChild(b)
  }
  if (s.hint) {
    const hint = document.createElement('p')
    hint.className = 'hint'
    hint.textContent = `↳ ${s.hint}`
    copy.appendChild(hint)
  }
  sec.appendChild(copy)
  return sec
}

const sections = SCREENS.map((s) => {
  const el = buildScreen(s)
  app.appendChild(el)
  return el
})

// 当前最居中的屏 → 驱动手机内容 + 局部强调色
const io = new IntersectionObserver(
  (entries) => {
    let best: IntersectionObserverEntry | null = null
    for (const e of entries) {
      if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) best = e
    }
    if (!best || best.intersectionRatio < 0.55) return
    const el = best.target as HTMLElement
    phone.show(el.dataset.effect || null)
    document.body.style.setProperty('--accent', getComputedStyle(el).getPropertyValue('--accent') || '#66cbe1')
  },
  { threshold: [0.55, 0.8] },
)
sections.forEach((s) => io.observe(s))

// 手机内部恒为 375×814（保住各 effect 的固定 px 布局），整体按视口高度等比缩放
function fitPhone() {
  const scale = Math.min(1, (window.innerHeight * 0.86) / 814)
  document.documentElement.style.setProperty('--phone-scale', scale.toFixed(3))
}
fitPhone()
window.addEventListener('resize', () => {
  fitPhone()
  phone.resize()
})

// 首屏即激活第一屏的手机内容（IO 在初次进入时也会触发，这里兜底）
phone.show(SCREENS[0].effectId ?? null)

