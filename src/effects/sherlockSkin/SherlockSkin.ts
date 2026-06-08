import type { EffectHandle } from '../types'
import type { SherlockSkinParams } from './params'
import bgImg from './bg.png'
import avatarLestradeImg from './avatarLestrade.png'
import avatarHolmesImg from './avatarHolmes.png'

// 按 body 中 ((...)) trigger 出现顺序对应；index 越界回落到最后一个
const AVATARS = [avatarLestradeImg, avatarHolmesImg]

const DW = 375

// 《血字的研究》皮肤（Figma 51:1092 / 51:1501）：
// 主页 = 标题 + 副标题 + 4 段正文（含蓝字 RACHE / Rachel）+ 底部 CTA。
// 点击正文里 ((...)) 标记的句子 → 进入"展开浮层"态：
//   · 正文 blur+淡化；浮层显示该句的清晰版（位 y=303）；__...__ 的子串内每个词依次添加红色下划线；
//   · 左下角浮出 Inspector Lestrade 头像 + 姓名 bubble；
//   · 点击其他区域 → 收起还原
export function mountSherlockSkin(container: HTMLElement, initial: SherlockSkinParams): EffectHandle<SherlockSkinParams> {
  ensureStyles()
  let params: SherlockSkinParams = { ...initial }

  const root = document.createElement('div')
  root.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;background:#000;touch-action:none;'
  container.appendChild(root)

  const bg = document.createElement('img')
  bg.src = bgImg
  bg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;pointer-events:none;z-index:0;'
  root.appendChild(bg)

  const scrim = document.createElement('div')
  scrim.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1;'
  root.appendChild(scrim)

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
    "position:absolute;left:28px;right:18px;top:104px;margin:0;font-family:'Grenze Gotisch','UnifrakturMaguntia',serif;font-weight:400;font-size:40px;line-height:34px;color:#c0c9ca;white-space:nowrap;text-shadow:0 4px 4px rgba(0,0,0,.25);"
  col.appendChild(titleEn)
  const titleZh = document.createElement('p')
  titleZh.style.cssText =
    "position:absolute;left:28px;top:144px;margin:0;font-family:'Source Han Serif CN','Songti SC',serif;font-weight:600;font-size:28px;color:#c0c9ca;white-space:nowrap;text-shadow:0 4px 4px rgba(0,0,0,.25);"
  col.appendChild(titleZh)

  // 正文容器（top=204 bottom=240 → 与底部 CTA 留 16px 间距、不重叠；overflow-y:auto 长文可滚）
  // 展开态加 .sh-shifted → bottom 抬到 292（避开 bubble 高度 + 16px 间距），文字"上缩"
  const bodyBox = document.createElement('div')
  bodyBox.className = 'sherlock-body'
  bodyBox.style.cssText =
    "position:absolute;left:28px;top:204px;bottom:240px;width:306px;font-family:'Source Serif Pro',Georgia,serif;font-weight:400;font-size:20px;line-height:31px;color:#c0c9ca;" +
    'overflow-y:auto;pointer-events:auto;touch-action:pan-y;-webkit-overflow-scrolling:touch;transition:filter .35s ease, opacity .35s ease, bottom .35s ease;'
  col.appendChild(bodyBox)

  // 人物 bubble（头像 + 姓名）：与 CTA 同样 bottom 锚定，距 CTA 顶 12px
  //   CTA 是 bottom:36 + height:188 → CTA 顶 = bottom:224；bubble 底 = 224 + 12 = bottom:236
  const bubble = document.createElement('div')
  bubble.className = 'sherlock-bubble'
  bubble.style.cssText =
    'position:absolute;left:20px;bottom:236px;display:flex;align-items:center;gap:8px;padding:4px 12px 4px 4px;' +
    'background:rgba(20,25,28,.55);border-radius:100px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);' +
    'opacity:0;transform:translateY(-6px);transition:opacity .35s ease, transform .35s ease;pointer-events:none;z-index:4;'
  const avatarEl = document.createElement('img')
  avatarEl.src = AVATARS[0]
  avatarEl.style.cssText = 'width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;display:block;'
  const nameEl = document.createElement('span')
  nameEl.style.cssText = "font-family:'Source Serif Pro',Georgia,serif;font-size:22px;line-height:22px;color:#c0c9ca;white-space:nowrap;"
  bubble.appendChild(avatarEl)
  bubble.appendChild(nameEl)
  col.appendChild(bubble)

  // 底部 CTA
  const cta = document.createElement('button')
  cta.style.cssText =
    'position:absolute;left:36px;bottom:36px;width:303px;height:188px;background:transparent;border:1px solid rgba(255,255,255,.35);border-radius:20px;opacity:.78;' +
    'cursor:pointer;pointer-events:auto;display:flex;align-items:center;justify-content:center;padding:0;color:rgba(192,201,202,.55);' +
    "font-family:'MiSans VF','PingFang SC',system-ui,sans-serif;font-size:22px;letter-spacing:.5px;transition:background-color .25s ease, opacity .25s ease, transform .15s ease;"
  col.appendChild(cta)
  cta.addEventListener('pointerdown', () => {
    cta.style.transform = 'scale(.98)'
    cta.style.background = 'rgba(102,203,225,.08)'
  })
  const releaseCTA = () => {
    cta.style.transform = ''
    cta.style.background = ''
  }
  cta.addEventListener('pointerup', releaseCTA)
  cta.addEventListener('pointerleave', releaseCTA)

  // ── 展开/收起状态 ──
  let expanded = false
  let activeTriggerIdx = -1 // 当前被点击展开的 trigger 索引（用于决定哪个角色 + 限定下划线范围）
  let underlineTimers: number[] = []
  let triggerSpans: HTMLElement[] = []

  function clearUnderlineAnimation() {
    underlineTimers.forEach((t) => window.clearTimeout(t))
    underlineTimers = []
    bodyBox.querySelectorAll('.sh-ul-word').forEach((w) => w.classList.remove('active'))
  }
  function runUnderlineAnimation(triggerIdx: number) {
    clearUnderlineAnimation()
    const trig = triggerSpans[triggerIdx]
    if (!trig) return
    // 仅激活点击的那个 trigger 内部的 word
    const words = Array.from(trig.querySelectorAll<HTMLElement>('.sh-ul-word'))
    words.forEach((w, i) => {
      const t = window.setTimeout(() => w.classList.add('active'), 90 + i * 110)
      underlineTimers.push(t)
    })
  }
  function updateBubble(triggerIdx: number) {
    const i = Math.min(Math.max(0, triggerIdx), AVATARS.length - 1)
    avatarEl.src = AVATARS[i]
    nameEl.textContent = params.characterNames[i] ?? ''
  }
  // 展开后把 trigger 滚入新（更窄）body 窗口中央 → 永远在 bubble 上方
  function ensureTriggerVisible(triggerIdx: number) {
    requestAnimationFrame(() => {
      const trig = triggerSpans[triggerIdx]
      if (!trig) return
      trig.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
  }
  function setExpanded(on: boolean, triggerIdx: number = -1) {
    if (expanded === on && activeTriggerIdx === triggerIdx) return
    expanded = on
    activeTriggerIdx = on ? triggerIdx : -1
    if (on) {
      updateBubble(triggerIdx)
      bodyBox.classList.add('sh-dim-active')
      // 抬高 body 底边 → 与 bubble 留 16px 空隙、文字向上缩入新窗口
      bodyBox.classList.add('sh-shifted')
      // 当前 trigger 不 dim、其他 trigger 与普通文字一起 dim
      triggerSpans.forEach((s, i) => s.classList.toggle('sh-dim', i !== triggerIdx))
      bubble.style.opacity = '1'
      bubble.style.transform = 'translateY(0)'
      runUnderlineAnimation(triggerIdx)
      ensureTriggerVisible(triggerIdx)
    } else {
      bodyBox.classList.remove('sh-dim-active')
      bodyBox.classList.remove('sh-shifted')
      triggerSpans.forEach((s) => s.classList.remove('sh-dim'))
      bubble.style.opacity = '0'
      bubble.style.transform = 'translateY(-6px)'
      clearUnderlineAnimation()
    }
  }
  // 点击展开后其他区域：收起。trigger 自己 stopPropagation 不会触发 collapse。
  root.addEventListener('click', () => {
    if (expanded) setExpanded(false)
  })

  // ── 渲染 ──
  // 解析 **xxx** → keyword 高亮 span；其他文本以纯文本节点追加（不再吐 __ 字符）
  function appendInlineKw(target: Node, text: string, color: string) {
    text.split(/(\*\*[^*]+?\*\*)/g).forEach((seg) => {
      if (seg.startsWith('**') && seg.endsWith('**')) {
        const sp = document.createElement('span')
        sp.style.cssText = `font-weight:700;color:${color};`
        sp.textContent = seg.slice(2, -2)
        target.appendChild(sp)
      } else if (seg) {
        target.appendChild(document.createTextNode(seg))
      }
    })
  }
  // 解析 __xxx__（先于 **）→ 子串里 ** 仍然有效；body 视图里 __ 标记被剥掉、不显示
  function appendInline(target: Node, text: string, color: string) {
    text.split(/(__[^_]+?__)/g).forEach((seg) => {
      if (seg.startsWith('__') && seg.endsWith('__')) {
        appendInlineKw(target, seg.slice(2, -2), color)
      } else if (seg) {
        appendInlineKw(target, seg, color)
      }
    })
  }
  // 渲染 body：按 \n\n 分段。每段：
  //   · ((...))    → trigger span（点击触发展开；自带 cursor:pointer；不带 .sh-dim 保持清晰）
  //     trigger 内的 __xxx__ 子串里每个 word 包成 .sh-ul-word → 原位添加下划线动画
  //   · 其他文本    → .sh-dim span（激活态时 blur+淡化）
  //   · 不含 trigger 的段落本身直接 .sh-dim
  function renderBody() {
    bodyBox.innerHTML = ''
    triggerSpans = []
    // 字面量 \n\n 分段：连续多个 \n\n 不会被合并为单个分隔符 → 可生成多个连续空段
    const paras = params.body.split('\n\n')
    paras.forEach((para, i) => {
      const p = document.createElement('p')
      p.style.cssText = `margin:0 0 ${i < paras.length - 1 ? 8 : 0}px 0;line-height:31px;`
      if (!para.trim()) {
        // 空段：放一个 nbsp 撑出 line-height 的高度（给末段 trigger 留滚动余量）
        p.appendChild(document.createTextNode(' '))
        bodyBox.appendChild(p)
        return
      }
      const parts = para.split(/(\(\([\s\S]+?\)\))/g)
      let hasTrigger = false
      parts.forEach((seg) => {
        if (seg.startsWith('((') && seg.endsWith('))')) {
          hasTrigger = true
          const trig = document.createElement('span')
          trig.className = 'sh-trigger'
          trig.style.cssText = 'cursor:pointer;'
          // trigger 内：先拆 __xxx__；命中部分用 \S+\s* 把"词 + 后跟空格"作为一个 token
          //   → 相邻 token 的下划线在空格处自然衔接成连续线，没有断点
          seg
            .slice(2, -2)
            .split(/(__[^_]+?__)/g)
            .forEach((trigSeg) => {
              if (trigSeg.startsWith('__') && trigSeg.endsWith('__')) {
                const inner = trigSeg.slice(2, -2)
                const tokens = inner.match(/\S+\s*/g) ?? []
                tokens.forEach((tok) => {
                  const w = document.createElement('span')
                  w.className = 'sh-ul-word'
                  w.style.setProperty('--ul-color', params.underlineColor)
                  appendInlineKw(w, tok, params.keywordColor)
                  trig.appendChild(w)
                })
              } else if (trigSeg) {
                appendInlineKw(trig, trigSeg, params.keywordColor)
              }
            })
          const myIdx = triggerSpans.length
          triggerSpans.push(trig)
          trig.addEventListener('click', (e) => {
            e.stopPropagation()
            // 点同一个 trigger 折叠；点不同 trigger 切换角色
            if (expanded && activeTriggerIdx === myIdx) setExpanded(false)
            else setExpanded(true, myIdx)
          })
          p.appendChild(trig)
        } else if (seg) {
          // 非 trigger 文本：包成 .sh-dim span，激活态时 blur+淡化
          const dim = document.createElement('span')
          dim.className = 'sh-dim'
          appendInline(dim, seg, params.keywordColor)
          p.appendChild(dim)
        }
      })
      if (!hasTrigger) p.classList.add('sh-dim')
      bodyBox.appendChild(p)
    })
  }

  // ── apply ──
  function applyText() {
    titleEn.textContent = params.titleEn
    titleEn.style.color = params.titleColor
    titleZh.textContent = params.titleZh
    titleZh.style.color = params.titleColor
    bodyBox.style.color = params.bodyColor
    renderBody()
    // 文本重建后若仍处于展开态，重新跑动画 + 重新同步 bubble
    if (expanded && activeTriggerIdx >= 0) {
      updateBubble(activeTriggerIdx)
      triggerSpans.forEach((s, i) => s.classList.toggle('sh-dim', i !== activeTriggerIdx))
    }
    cta.textContent = params.ctaLabel
    // 文本重渲染会清掉之前的 trigger 监听，这里如果是展开态需要重跑动画
    if (expanded && activeTriggerIdx >= 0) runUnderlineAnimation(activeTriggerIdx)
  }
  function applyScrim() {
    const s = params.scrim
    scrim.style.background =
      `linear-gradient(180deg, rgba(0,0,0,${(s * 0.95).toFixed(2)}) 0%, rgba(0,0,0,${(s * 0.4).toFixed(2)}) 24%, ` +
      `rgba(0,0,0,${(s * 0.2).toFixed(2)}) 64%, rgba(0,0,0,${(s * 0.7).toFixed(2)}) 100%)`
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

  applyText()
  applyScrim()
  applyStatus()

  return {
    update(next) {
      Object.assign(params, next)
      const keys = Object.keys(next)
      if (
        keys.some((k) =>
          ['titleEn', 'titleZh', 'body', 'titleColor', 'bodyColor', 'keywordColor', 'underlineColor', 'ctaLabel', 'characterNames'].includes(k),
        )
      )
        applyText()
      if (next.scrim !== undefined) applyScrim()
      if (next.timeColor !== undefined) applyStatus()
    },
    resize() {},
    reset() {
      setExpanded(false)
    },
    getParams() {
      return { ...params }
    },
    destroy() {
      clearUnderlineAnimation()
      root.remove()
    },
  }
}

function ensureStyles() {
  if (document.getElementById('sherlock-skin-fonts')) return
  const l = document.createElement('link')
  l.id = 'sherlock-skin-fonts'
  l.rel = 'stylesheet'
  l.href =
    'https://fonts.googleapis.com/css2?family=Grenze+Gotisch:wght@400;500&family=Source+Serif+Pro:wght@400;700&family=UnifrakturMaguntia&display=swap'
  document.head.appendChild(l)
  const st = document.createElement('style')
  st.id = 'sherlock-skin-style'
  st.textContent =
    // 隐藏滚动条
    '.sherlock-body{scrollbar-width:none;-ms-overflow-style:none}' +
    '.sherlock-body::-webkit-scrollbar{width:0;height:0;display:none}' +
    // 选择性 blur：激活后 .sh-dim 元素（非 trigger 文本/段落）blur+淡化，trigger 保持清晰
    '.sh-dim{transition:filter .35s ease, opacity .35s ease}' +
    '.sherlock-body.sh-dim-active .sh-dim{filter:blur(2px);opacity:.28}' +
    // 展开态：body 底部抬高 → 给 bubble 留 16px 间距（bubble bottom 236 + height 40 + gap 16 = 292）
    '.sherlock-body.sh-shifted{bottom:292px}' +
    // 逐词下划线：用 background-image linear-gradient，宽度从 0% → 100% 扫出（在原位）
    '.sh-ul-word{background-image:linear-gradient(to right,var(--ul-color,#e63b3b),var(--ul-color,#e63b3b));' +
    'background-repeat:no-repeat;background-position:0 100%;background-size:0% 2px;transition:background-size .22s ease-out}' +
    '.sh-ul-word.active{background-size:100% 2px}' +
    '.sh-trigger{cursor:pointer}'
  document.head.appendChild(st)
}
