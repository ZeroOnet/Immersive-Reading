import type { EffectHandle } from '../types'
import type { AliceSkinParams } from './params'
// 新分层 UI（Figma 111:442 / 111:515）：绿丝绒底图 + 6 张卡牌素材按 Figma 坐标叠放
import bgFelt from './bgFelt.png'
import cardTL from './cardTL.png'
import cardTR from './cardTR.png'
import cardML from './cardML.png'
import cardMR from './cardMR.png'
import cardBL from './cardBL.png'
import cardBM from './cardBM.png'
import heartImg from './heart.png'
import diamondImg from './diamond.png'

interface Word {
  el: HTMLElement
  furniture: boolean
  seed: number
  pushX: number // 当前被心形推开的横向位移
}

// 《爱丽丝梦游仙境》阅读页皮肤（Figma 14:765）：Wonderland 静态背景 + 艺术字标题；
// Drink Me / Eat Me 让正文忽大忽小（长词像家具一样膨胀）；wondered / tumbled 可点击切换高亮态。
export function mountAliceSkin(container: HTMLElement, initial: AliceSkinParams): EffectHandle<AliceSkinParams> {
  ensureFonts()
  let params: AliceSkinParams = { ...initial }

  const root = document.createElement('div')
  root.style.cssText = 'position:relative;width:100%;height:100%;overflow:hidden;background:#1b1530;'
  container.appendChild(root)

  // 背景：绿底铺满整个 root（iPad 等宽屏也是满屏绿丝绒）
  const bgWrap = document.createElement('div')
  bgWrap.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0;'
  root.appendChild(bgWrap)
  const bgFeltEl = document.createElement('img')
  bgFeltEl.src = bgFelt
  bgFeltEl.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;'
  bgWrap.appendChild(bgFeltEl)
  // stage 撑满整个 root → 卡牌的 left:0 / right:0 / bottom:0 直接锚到屏幕边缘
  // 卡牌尺寸用设计 px（固有尺寸），不再用 transform:scale 等比拉伸 → iPad 等宽屏不会放大
  const DW = 375
  const stage = document.createElement('div')
  stage.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:0;'
  root.appendChild(stage)
  function mkCard(src: string, css: string): HTMLImageElement {
    const im = document.createElement('img')
    im.src = src
    im.style.cssText = `position:absolute;${css};user-select:none;pointer-events:none;`
    return im
  }
  // 卡牌按 Figma 固有设计 px 渲染；left:0 / right:0 / bottom:0 锚到 root（= 容器 = 屏幕）边缘
  const cardMREl = mkCard(cardMR, 'top:455px;right:0;width:120px;height:439px')
  const cardMLEl = mkCard(cardML, 'top:269px;left:0;width:77px;height:338px')
  stage.append(
    mkCard(cardTL, 'top:0;left:0;width:286px;height:256px'),
    mkCard(cardTR, 'top:30px;right:0;width:162px;height:457px'),
    mkCard(cardBL, 'bottom:0;left:-4px;width:101px;height:213px'),
    mkCard(cardBM, 'bottom:0;left:-2px;width:306px;height:91px'),
    cardMLEl, // 后 append → 顶层
    cardMREl,
  )
  function applyStageScale() {
    // 无需 scale：贴图按固有 px 渲染；编辑预留接口供未来 fit 控制
  }
  applyStageScale()

  const scrim = document.createElement('div')
  scrim.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:1;'
  root.appendChild(scrim)

  const col = document.createElement('div')
  // 与 stage 共享同一中心轴：max-width = DW，margin:0 auto 居中 → 文字与卡牌左右边对齐
  col.style.cssText = `position:absolute;inset:0;max-width:${DW}px;margin:0 auto;pointer-events:none;z-index:2;`
  root.appendChild(col)

  const status = document.createElement('div')
  status.style.cssText =
    'position:absolute;left:0;right:0;top:0;height:44px;display:flex;align-items:center;justify-content:space-between;padding:0 20px 0 28px;color:#d4cfc9;'
  status.innerHTML =
    '<span style="font:600 15px/1 -apple-system,system-ui;letter-spacing:-.3px">9:41</span>' +
    '<span style="display:flex;align-items:center;gap:6px">' +
    '<svg width="18" height="11" viewBox="0 0 18 11" fill="#d4cfc9"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="5" y="4.5" width="3" height="6.5" rx="1"/><rect x="10" y="2" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="11" rx="1"/></svg>' +
    '<svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="#d4cfc9" stroke-width="1.4"><path d="M1 4.5a10 10 0 0 1 14 0M3.5 7a6 6 0 0 1 9 0M6 9.3a2.5 2.5 0 0 1 4 0"/></svg>' +
    '<svg width="26" height="12" viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="#d4cfc9" stroke-opacity=".5"/><rect x="2" y="2" width="17" height="8" rx="1.5" fill="#d4cfc9"/><rect x="23" y="3.5" width="2" height="5" rx="1" fill="#d4cfc9" fill-opacity=".5"/></svg>' +
    '</span>'
  col.appendChild(status)

  const subtitle = document.createElement('p')
  subtitle.style.cssText =
    "position:absolute;left:75px;top:277px;margin:0;font-family:'Noto Serif SC',serif;font-weight:600;font-size:20px;white-space:nowrap;transform-origin:left center;"
  col.appendChild(subtitle)

  const bodyP = document.createElement('p')
  bodyP.style.cssText = "position:absolute;left:83px;top:328px;width:210px;margin:0;font-family:'Noto Serif SC',serif;font-size:19px;line-height:1.47;"
  col.appendChild(bodyP)

  // 飞行物：心形（来自 Queen 牌 cardMR）/ 菱形（来自 Jack 牌 cardML）
  // 初始贴在卡牌上、点击后从那个位置飞出、动画结束后隐藏；再点又从原位飞起
  function mkProjectile(src: string): HTMLImageElement {
    const im = document.createElement('img')
    im.src = src
    im.alt = ''
    im.style.cssText =
      'position:absolute;left:0;top:0;width:24px;height:auto;pointer-events:none;z-index:3;opacity:0;' +
      'will-change:transform,opacity;'
    return im
  }
  const heart = mkProjectile(heartImg)
  const diamond = mkProjectile(diamondImg)
  root.append(heart, diamond)
  // 飞行物初始位置：相对卡牌的 inset 比例（Figma 静止态：心形 111:499 / 菱形 111:463）
  //   ♥ 在 cardMR 的 inset[30.53% 49.21% 63.8% 33.36%] → left:33.36% top:30.53% 宽:17.43% 高:5.67%，无旋转
  //   ♦ 在 cardML 的 inset[9.48% 22.08% 80.84% 44.16%]  → left:44.16% top:9.48%  宽:33.76% 高:9.68%，无旋转
  function getRestPos(kind: 'heart' | 'diamond'): { x: number; y: number; rot: number; w: number } {
    const rootR = root.getBoundingClientRect()
    const cardEl = kind === 'heart' ? cardMREl : cardMLEl
    const cardR = cardEl.getBoundingClientRect()
    if (kind === 'heart') {
      return {
        x: cardR.left - rootR.left + cardR.width * 0.3336,
        y: cardR.top - rootR.top + cardR.height * 0.3053,
        rot: 0,
        w: cardR.width * 0.1743,
      }
    }
    return {
      x: cardR.left - rootR.left + cardR.width * 0.4416,
      y: cardR.top - rootR.top + cardR.height * 0.0948,
      rot: 0,
      w: cardR.width * 0.3376,
    }
  }
  function placeAtRest(kind: 'heart' | 'diamond', scale: number = 1) {
    const p = getRestPos(kind)
    const el = kind === 'heart' ? heart : diamond
    el.style.width = `${p.w.toFixed(1)}px`
    el.style.height = 'auto'
    el.style.opacity = '1'
    el.style.transform =
      `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) rotate(${p.rot}deg) scale(${scale.toFixed(3)})`
  }
  // 飞行结束后在起点位置 spring 重生：scale 0 → 峰值 ≈1.2 → 回落 1.0
  // 用 Penner easeOutBack，c1=2.7 → 峰值 ≈1.212 @ t≈0.514，t=0 → 0，t=1 → 1
  function springScale(t: number): number {
    if (t <= 0) return 0
    if (t >= 1) return 1
    const c1 = 2.7
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }
  // 每个图标独立的"回归进度"：null = 静态(scale=1)，0..1 = spring 进行中
  let heartRegrowT: number | null = null
  let diamondRegrowT: number | null = null
  const REGROW_DURATION = 0.55 // 秒

  // ── 状态 ──
  let t = 0
  let timeScale = 1
  let raf = 0
  let words: Word[] = []
  // 活跃飞行物种类（null = 无）。同一时刻只有一个；新点击会替换旧的
  let projectileKind: 'heart' | 'diamond' | null = null
  let projT = 0 // 0..1 动画进度
  let projX = -9999 // 当前飞行物中心（root 坐标系，用于推词）
  let projY = -9999
  // 触发词：抛物线中点经过它的中心；击中后立刻去高亮
  let targetWord: HTMLElement | null = null
  let targetX = 0
  let targetY = 0
  let hitDone = false
  const PROJ_DURATION = 1.6 // 秒（更紧凑的飞行节奏）
  const PROJ_ARC = 32 // 抛物线峰值高度（向上 = -y）
  const PROJ_HALF_W = 18 // 飞行物半宽估值（与图标渲染尺寸接近）
  const PUSH_RADIUS = 90 // 飞行物周围 x 距离 < 这个值 → 开始推开
  const PUSH_VERT = 26 // 飞行物周围 y 距离 < 这个值 → 算同一行
  const PUSH_GAP = 8 // 词推开后与飞行物之间的留白
  const PUSH_EASE = 0.55 // 推开 ease 系数（更跟手）

  function measure() {
    // 容器尺寸变化时同步缩放 stage（卡牌按设计稿大小渲染、再按容器宽度等比缩放）
    applyStageScale()
  }

  function applyText() {
    subtitle.textContent = params.subtitle
    subtitle.style.color = params.subtitleColor
    bodyP.style.color = params.bodyColor
    bodyP.innerHTML = ''
    words = []
    const minLen = params.furnitureMinLen
    for (const tok of params.body.split(/(\s+)/)) {
      if (!tok.trim()) {
        bodyP.appendChild(document.createTextNode(tok))
        continue
      }
      const sp = document.createElement('span')
      sp.textContent = tok
      sp.style.display = 'inline-block'
      sp.style.transformOrigin = 'center bottom'
      bodyP.appendChild(sp)
      const bare = tok.replace(/[^A-Za-z']/g, '')
      // 所有正文词都可点击 → 飞行+穿透+spring 回归
      // 触发哪个图标？取词中心 x 与容器中线比较：左半屏 → 菱形(cardML)，右半屏 → 心形(cardMR)
      // 让飞行物从更近的牌出发，路径更自然
      sp.classList.add('alice-clickable')
      sp.addEventListener('click', (e) => {
        e.stopPropagation()
        // 替换式高亮：任何旧高亮先清掉，再点亮当前词
        for (const w of words) w.el.classList.remove('alice-active')
        sp.classList.add('alice-active')
        // 捕获词中心（root 坐标），作为抛物线的中点（t=0.5 击中）
        const rRect = root.getBoundingClientRect()
        const wRect = sp.getBoundingClientRect()
        targetWord = sp
        targetX = wRect.left + wRect.width / 2 - rRect.left
        targetY = wRect.top + wRect.height / 2 - rRect.top
        hitDone = false
        // 选边：词偏左 → ♦ 从 cardML 来；词偏右 → ♥ 从 cardMR 来
        const kind: 'heart' | 'diamond' = targetX < rRect.width / 2 ? 'diamond' : 'heart'
        projectileKind = kind
        projT = 0
        if (kind === 'heart') {
          heartRegrowT = null // 取消可能正在进行的 spring 回归
          heart.style.opacity = '1'
        } else {
          diamondRegrowT = null
          diamond.style.opacity = '1'
        }
      })
      words.push({ el: sp, furniture: bare.length >= minLen, seed: Math.random() * 6.28, pushX: 0 })
    }
  }
  function applyScrim() {
    const s = params.scrim
    scrim.style.background =
      `linear-gradient(180deg, rgba(12,8,24,${(s * 0.6).toFixed(2)}) 0%, rgba(12,8,24,${(s * 0.12).toFixed(2)}) 30%, ` +
      `rgba(12,8,24,${(s * 0.1).toFixed(2)}) 60%, rgba(12,8,24,${(s * 0.5).toFixed(2)}) 100%)`
  }

  function tick(dt: number) {
    t += dt

    // 飞行物：动画态沿抛物线 start → target → mirror(start) 飞行，t=0.5 时正好穿过目标词中心；
    // 击中目标后立刻去掉目标词高亮；动画结束后在起点位置触发 spring 重生
    projX = -9999
    projY = -9999
    if (projectileKind && targetWord) {
      projT += dt / PROJ_DURATION
      if (projT >= 1) {
        // 终点消失，立刻在起点 (rest) 开启 spring 回归（scale 0 → 1.2 → 1.0）
        const finishedKind = projectileKind
        const el = finishedKind === 'heart' ? heart : diamond
        el.style.opacity = '0'
        if (finishedKind === 'heart') heartRegrowT = 0
        else diamondRegrowT = 0
        projectileKind = null
        targetWord = null
      } else {
        const rest = getRestPos(projectileKind)
        const startX = rest.x
        const startY = rest.y
        // y 轴向下：arcDir=-1 表示抛物线向上拱起；峰值高度 PROJ_ARC
        // 推导：projY(t) = lerpY(t) + arcDir*sin(πt)*PROJ_ARC
        //       要求 projY(0.5) = targetY → endY = 2*(targetY - arcDir*PROJ_ARC) - startY
        const arcDir = -1
        const endX = 2 * targetX - startX
        const endY = 2 * (targetY - arcDir * PROJ_ARC) - startY
        projX = startX + (endX - startX) * projT
        const lerpY = startY + (endY - startY) * projT
        projY = lerpY + arcDir * Math.sin(projT * Math.PI) * PROJ_ARC
        const ang = rest.rot + (Math.atan2(endY - startY, endX - startX) * (180 / Math.PI) - rest.rot) * projT
        const el = projectileKind === 'heart' ? heart : diamond
        el.style.transform = `translate(${projX.toFixed(1)}px,${projY.toFixed(1)}px) rotate(${ang.toFixed(1)}deg)`
        el.style.opacity = '1'
        // 击中：穿过中点立即清掉触发词的选中边框
        if (!hitDone && projT >= 0.5) {
          targetWord.classList.remove('alice-active')
          hitDone = true
        }
      }
    }
    // rest / spring 回归：飞行中的图标由飞行分支自己 set transform，这里只更新另一个
    //   · regrowT === null → 安静停在 rest 上（scale=1）
    //   · regrowT 0..1     → 推进 spring，placeAtRest(kind, springScale(regrowT))
    function updateIconRest(kind: 'heart' | 'diamond') {
      if (projectileKind === kind) return
      if (kind === 'heart') {
        if (heartRegrowT !== null) {
          heartRegrowT += dt / REGROW_DURATION
          if (heartRegrowT >= 1) heartRegrowT = null
        }
        placeAtRest('heart', heartRegrowT === null ? 1 : springScale(heartRegrowT))
      } else {
        if (diamondRegrowT !== null) {
          diamondRegrowT += dt / REGROW_DURATION
          if (diamondRegrowT >= 1) diamondRegrowT = null
        }
        placeAtRest('diamond', diamondRegrowT === null ? 1 : springScale(diamondRegrowT))
      }
    }
    updateIconRest('heart')
    updateIconRest('diamond')

    // 文字路径排除（散开后不回归原位）：
    //   · 方向**固定**为「远离触发词」(sign 取 wx - targetX) → 不再因 dx 变号反向抖
    //   · 推力 = 飞行物半宽 + 该词半宽 + 留白，保证飞行物正中压上词时零重叠
    //   · ease 只允许放大 |pushX|（同向更远）→ 词被推开后不缩回
    //   · 飞行物远离 (pushTarget=0) 时 pushX 不变 → 散开姿态保持
    const rootR2 = root.getBoundingClientRect()
    for (const w of words) {
      // 触发词本身不被推开 —— 抛物线就是要穿过它
      if (w.el === targetWord) {
        w.el.style.transform = Math.abs(w.pushX) > 0.05 ? `translateX(${w.pushX.toFixed(2)}px)` : ''
        continue
      }
      let pushTarget = 0
      if (projectileKind) {
        const wRect = w.el.getBoundingClientRect()
        const wx = wRect.left + wRect.width / 2 - rootR2.left
        const wy = wRect.top + wRect.height / 2 - rootR2.top
        const dy = wy - projY
        if (Math.abs(dy) < PUSH_VERT) {
          const dx = wx - projX
          const adx = Math.abs(dx)
          if (adx < PUSH_RADIUS) {
            // 方向：以触发词为锚，左侧词向左、右侧词向右（动画期间不翻转）
            const sign = wx >= targetX ? 1 : -1
            // 让出空间 = 飞行物半宽 + 这个词的半宽 + 留白 → 零重叠保证
            const clearance = PROJ_HALF_W + wRect.width / 2 + PUSH_GAP
            const verticalFalloff = 1 - Math.abs(dy) / PUSH_VERT
            const horizontalFalloff = 1 - adx / PUSH_RADIUS
            pushTarget = sign * clearance * horizontalFalloff * verticalFalloff
          }
        }
      }
      // 只放大同向 |pushX|；不缩、不反向 → 词散开后定格
      if (pushTarget !== 0 && Math.abs(pushTarget) > Math.abs(w.pushX) && Math.sign(pushTarget) === (w.pushX === 0 ? Math.sign(pushTarget) : Math.sign(w.pushX))) {
        w.pushX += (pushTarget - w.pushX) * PUSH_EASE
      }
      w.el.style.transform = Math.abs(w.pushX) > 0.05 ? `translateX(${w.pushX.toFixed(2)}px)` : ''
    }
  }

  function loop() {
    raf = requestAnimationFrame(loop)
    const dt = 0.016 * timeScale
    if (dt > 0) tick(dt)
  }

  const ro = new ResizeObserver(() => measure())
  ro.observe(container)

  measure()
  applyText()
  applyScrim()
  loop()

  return {
    update(next) {
      Object.assign(params, next)
      const k = Object.keys(next)
      if (k.some((x) => ['subtitle', 'body', 'subtitleColor', 'bodyColor', 'furnitureMinLen'].includes(x))) applyText()
      if (next.scrim !== undefined) applyScrim()
    },
    resize() {
      measure()
    },
    reset() {
      projectileKind = null
      projT = 0
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
      tick(0.016)
    },
    setDebug() {
      /* no-op */
    },
  }
}

function ensureFonts() {
  if (document.getElementById('alice-skin-fonts')) return
  const l = document.createElement('link')
  l.id = 'alice-skin-fonts'
  l.rel = 'stylesheet'
  l.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600&display=swap'
  document.head.appendChild(l)
  // 可点击词点击态样式（Figma 111:473）
  const st = document.createElement('style')
  st.id = 'alice-skin-style'
  st.textContent =
    '.alice-clickable{cursor:pointer;pointer-events:auto;transition:background-color .22s ease,color .22s ease,padding .22s ease,text-shadow .22s ease}' +
    '.alice-clickable.alice-active{background:rgba(0,0,0,.28);color:#faf3d5;padding:2px 4px 6px;border-radius:8px;' +
    'text-shadow:0 0 12px rgba(250,243,213,.6),0 0 2px #faf3d5}'
  document.head.appendChild(st)
}
