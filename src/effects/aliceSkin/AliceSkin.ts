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
  el: HTMLElement // 外层 span：做让位 dodge（translate+rotate）
  inner: HTMLElement // 内层 span：做独立无序抖动（不污染外层 rect 几何、不被 fast-path 清掉）
  furniture: boolean
  seed: number
  dispMag: number // 沿逃离方向的当前位移量（px）
  escUx: number // 锁定的逃离方向单位向量 x（0,0 = 未进入让位）
  escUy: number
  rot: number // 当前倾斜角（度）
  // —— 无序抖动（随机数量的词在抖、幅度随机）——
  jAmp: number // 当前抖动幅度（px，eased）
  jTarget: number // 目标幅度（0=不抖；一次 burst 内为随机值）
  jEnd: number // 本次 burst 结束时刻（t）
  jNext: number // 下次"是否开抖"决策时刻（t）
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
  // 自身渲染缩放：portal 等场景 root 被祖先 transform:scale 缩放；getBoundingClientRect 返回的是
  // 视口(缩放)坐标，但纸牌/心菱/单词都按 root 本地未缩放坐标定位 → 把相对坐标除以 selfScale 换回本地坐标
  const selfScale = () => {
    const w = root.offsetWidth
    return w ? root.getBoundingClientRect().width / w : 1
  }
  function getRestPos(kind: 'heart' | 'diamond'): { x: number; y: number; rot: number; w: number } {
    const sc = selfScale()
    const rootR = root.getBoundingClientRect()
    const cardEl = kind === 'heart' ? cardMREl : cardMLEl
    const cardR = cardEl.getBoundingClientRect()
    if (kind === 'heart') {
      return {
        x: (cardR.left - rootR.left) / sc + (cardR.width / sc) * 0.3336,
        y: (cardR.top - rootR.top) / sc + (cardR.height / sc) * 0.3053,
        rot: 0,
        w: (cardR.width / sc) * 0.1743,
      }
    }
    return {
      x: (cardR.left - rootR.left) / sc + (cardR.width / sc) * 0.4416,
      y: (cardR.top - rootR.top) / sc + (cardR.height / sc) * 0.0948,
      rot: 0,
      w: (cardR.width / sc) * 0.3376,
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
  let projDoneT = -Infinity // 上次飞行结束时刻；结束后 JITTER_RESUME_DELAY 秒内仍不抖
  const JITTER_RESUME_DELAY = 2 // 飞行结束后多久恢复抖动（秒）
  let projX = -9999 // 当前飞行物中心（root 坐标系，用于推词）
  let projY = -9999
  // 触发词：抛物线中点经过它的中心；击中后立刻去高亮
  let targetWord: HTMLElement | null = null
  let targetX = 0
  let targetY = 0
  let hitDone = false
  const PROJ_DURATION = 1.6 // 秒（更紧凑的飞行节奏）
  const PROJ_ARC = 32 // 抛物线峰值高度（向上 = -y）
  const PROJ_HALF_W = 12 // 飞行物包围盒半尺寸兜底（无法测量时）
  const PUSH_GAP = 6 // 让位后单词与飞行物之间的最小留白
  const PUSH_ANTICIPATE = 36 // 提前量：飞行物距严格接触还有这么远就开始让位（更顺滑、留呼吸空间）
  const PUSH_EASE = 0.34 // 位移 ease 系数
  const ROT_EASE = 0.18 // 旋转 ease 系数
  const ROT_GAIN = 0.6 // 每 px 位移对应的倾斜量（封顶前）
  const ROT_MAX = 20 // 让位时单词最大倾斜角（度）
  // —— 无序抖动：随机一批词在抖、幅度随机、各自错峰 ——
  const JITTER_CHANCE = 0.5 // 每次决策时开始一段抖动的概率
  const JITTER_AMP_MIN = 1.2 // 抖动幅度随机范围（px）
  const JITTER_AMP_MAX = 5.0
  const JITTER_DUR_MIN = 0.4 // 单段抖动持续（秒）
  const JITTER_DUR_MAX = 1.6
  const JITTER_GAP_MIN = 0.5 // 两次决策间隔（秒，随机 → 无序）
  const JITTER_GAP_MAX = 2.5
  const JITTER_EASE = 0.12 // 幅度淡入淡出
  const JF1 = 31, JF2 = 47, JF3 = 37, JF4 = 53 // 抖动频率（高频不同步 → 无序抖感）
  let lastProjAng = 0 // 飞行物当前行进角（用于其旋转后 AABB 膨胀）

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
      sp.style.display = 'inline-block'
      // 绕中心旋转：让位时词倾斜、且旋转不移动包围盒中心（让位零重叠几何成立的前提）
      sp.style.transformOrigin = 'center center'
      // 内层：承载文字、独立做无序抖动（外层 rect 不含其 transform → 不污染 dodge 几何）
      const inner = document.createElement('span')
      inner.textContent = tok
      inner.style.display = 'inline-block'
      sp.appendChild(inner)
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
        // 捕获词中心（root 本地未缩放坐标），作为抛物线的中点（t=0.5 击中）
        const sc = selfScale()
        const rRect = root.getBoundingClientRect()
        const wRect = sp.getBoundingClientRect()
        targetWord = sp
        targetX = (wRect.left + wRect.width / 2 - rRect.left) / sc
        targetY = (wRect.top + wRect.height / 2 - rRect.top) / sc
        hitDone = false
        // 选边：词偏左 → ♦ 从 cardML 来；词偏右 → ♥ 从 cardMR 来
        const kind: 'heart' | 'diamond' = targetX < rRect.width / sc / 2 ? 'diamond' : 'heart'
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
      words.push({
        el: sp,
        inner,
        furniture: bare.length >= minLen,
        seed: Math.random() * 6.28,
        dispMag: 0,
        escUx: 0,
        escUy: 0,
        rot: 0,
        jAmp: 0,
        jTarget: 0,
        jEnd: 0,
        jNext: Math.random() * JITTER_GAP_MAX, // 错峰，避免所有词同时决策
      })
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
        projDoneT = t // 记录飞行结束时刻 → 抖动冷却 JITTER_RESUME_DELAY 秒后恢复
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
        lastProjAng = ang
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

    // ── 文字让位：飞行物推开沿途单词（2D 径向 + 旋转，全程零重叠，飞过后归位）──
    //   · 进入影响范围时，每个词锁定一个「逃离方向」= 径向远离飞行物（含触发词本身）
    //   · 位移量 = 让该词包围盒与飞行物包围盒分离所需的最小距离（任一轴脱离即不重叠）
    //   · ease 平滑趋近；若某帧 ease 滞后仍重叠 → 硬性补足到严格分离量 → 渲染帧零重叠
    //   · 词按位移量倾斜旋转（叠加每词随机扰动），不再强制正立
    //   · 飞行物离开 / 结束后位移与旋转 ease 回 0 → 单词自然归位
    const rootR2 = root.getBoundingClientRect()
    const sc2 = selfScale() // root 本地未缩放坐标换算
    // 飞行物当前包围盒半宽/半高（计入其行进旋转后的 AABB 膨胀）
    let projHalfX = PROJ_HALF_W
    let projHalfY = PROJ_HALF_W
    if (projectileKind) {
      const pe = projectileKind === 'heart' ? heart : diamond
      const pw = pe.offsetWidth || PROJ_HALF_W * 2
      const ph = pe.offsetHeight || PROJ_HALF_W * 2
      const pa = (lastProjAng * Math.PI) / 180
      const pc = Math.abs(Math.cos(pa))
      const ps = Math.abs(Math.sin(pa))
      projHalfX = (pw * pc + ph * ps) / 2
      projHalfY = (pw * ps + ph * pc) / 2
    }
    // 沿锁定方向 (ux,uy) 把词中心从 base 移到「与飞行物分离」所需的最小位移（任一轴脱离即可）
    const reqMag = (cX: number, cY: number, bx: number, by: number, ux: number, uy: number): number => {
      if (Math.abs(bx) >= cX || Math.abs(by) >= cY) return 0 // 已分离
      let mx = Infinity
      let my = Infinity
      if (ux > 0) mx = (cX - bx) / ux
      else if (ux < 0) mx = (-cX - bx) / ux
      if (uy > 0) my = (cY - by) / uy
      else if (uy < 0) my = (-cY - by) / uy
      if (mx < 0) mx = Infinity
      if (my < 0) my = Infinity
      const m = Math.min(mx, my)
      return Number.isFinite(m) ? m : 0
    }
    for (const w of words) {
      // 空闲态快速跳过（无飞行物、未让位、已正立）→ 不读 rect，省布局开销
      if (!projectileKind && w.dispMag === 0 && w.escUx === 0 && w.escUy === 0 && Math.abs(w.rot) < 0.05) {
        if (w.el.style.transform) w.el.style.transform = ''
        continue
      }
      const rect = w.el.getBoundingClientRect()
      const dxNow = w.dispMag * w.escUx
      const dyNow = w.dispMag * w.escUy
      // 当前 rect 已含 translate(dxNow,dyNow) 与绕中心的 rotate → 换回本地坐标(/sc2)后回推静止中心
      const rcx = (rect.left + rect.width / 2 - rootR2.left) / sc2 - dxNow
      const rcy = (rect.top + rect.height / 2 - rootR2.top) / sc2 - dyNow
      // 词静止包围盒半宽/半高，按当前旋转角膨胀为 AABB
      const hw0 = (w.el.offsetWidth || 16) / 2
      const hh0 = (w.el.offsetHeight || 20) / 2
      const wa = (w.rot * Math.PI) / 180
      const wc = Math.abs(Math.cos(wa))
      const ws = Math.abs(Math.sin(wa))
      const hw = hw0 * wc + hh0 * ws
      const hh = hh0 * wc + hw0 * ws

      const clearX = hw + projHalfX + PUSH_GAP // 严格分离阈值
      const clearY = hh + projHalfY + PUSH_GAP
      const clearXa = clearX + PUSH_ANTICIPATE // 含提前量的让位目标
      const clearYa = clearY + PUSH_ANTICIPATE

      const baseDx = rcx - projX
      const baseDy = rcy - projY

      // 进入影响范围 → 锁定逃离方向（径向远离飞行物；近乎重合时退化为横向让位 + 微上扬）
      if (projectileKind && w.escUx === 0 && w.escUy === 0 && Math.abs(baseDx) < clearXa && Math.abs(baseDy) < clearYa) {
        let ex = baseDx
        let ey = baseDy
        let len = Math.hypot(ex, ey)
        if (len < 1) {
          ex = rcx >= targetX ? 1 : -1
          ey = -0.2
          len = Math.hypot(ex, ey)
        }
        w.escUx = ex / len
        w.escUy = ey / len
      }

      const engaged = w.escUx !== 0 || w.escUy !== 0
      let targetM = 0
      if (projectileKind && engaged) targetM = reqMag(clearXa, clearYa, baseDx, baseDy, w.escUx, w.escUy)
      w.dispMag += (targetM - w.dispMag) * PUSH_EASE
      // 硬保证：ease 滞后仍重叠时，补足到严格分离量 → 本帧渲染零重叠
      if (projectileKind && engaged) {
        const cxp = baseDx + w.dispMag * w.escUx
        const cyp = baseDy + w.dispMag * w.escUy
        if (Math.abs(cxp) < clearX && Math.abs(cyp) < clearY) {
          const mStrict = reqMag(clearX, clearY, baseDx, baseDy, w.escUx, w.escUy)
          if (mStrict > w.dispMag) w.dispMag = mStrict
        }
      }
      // 归位后解除方向锁定
      if (w.dispMag < 0.3 && targetM === 0) {
        w.dispMag = 0
        w.escUx = 0
        w.escUy = 0
      }

      // 旋转：按位移量倾斜，方向取逃离方向 + 每词随机扰动 → 自然、不强制正立
      let targetRot = (Math.sin(w.seed) * 0.7 + (w.escUx >= 0 ? 0.5 : -0.5)) * w.dispMag * ROT_GAIN
      if (targetRot > ROT_MAX) targetRot = ROT_MAX
      else if (targetRot < -ROT_MAX) targetRot = -ROT_MAX
      w.rot += (targetRot - w.rot) * ROT_EASE

      const tx = w.dispMag * w.escUx
      const ty = w.dispMag * w.escUy
      if (w.dispMag > 0.1 || Math.abs(w.rot) > 0.1) {
        w.el.style.transform = `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) rotate(${w.rot.toFixed(2)}deg)`
      } else {
        w.el.style.transform = ''
      }
    }

    // ── 无序抖动（内层 span，独立于 dodge）：随机一批词在抖、幅度随机、各自错峰 ──
    for (const w of words) {
      if (projectileKind || t < projDoneT + JITTER_RESUME_DELAY) {
        // 飞行期间 + 结束后 JITTER_RESUME_DELAY 秒内停止抖动（目标归零、平滑衰减、暂停调度），之后自动恢复
        w.jTarget = 0
      } else {
        if (t >= w.jNext) {
          // 决策：以一定概率开始一段随机幅度/随机时长的抖动
          if (Math.random() < JITTER_CHANCE) {
            w.jTarget = JITTER_AMP_MIN + Math.random() * (JITTER_AMP_MAX - JITTER_AMP_MIN)
            w.jEnd = t + JITTER_DUR_MIN + Math.random() * (JITTER_DUR_MAX - JITTER_DUR_MIN)
          }
          w.jNext = t + JITTER_GAP_MIN + Math.random() * (JITTER_GAP_MAX - JITTER_GAP_MIN)
        }
        if (t >= w.jEnd) w.jTarget = 0 // 本段抖动结束 → 衰减回 0
      }
      w.jAmp += (w.jTarget - w.jAmp) * JITTER_EASE
      if (w.jAmp > 0.05) {
        const a = w.jAmp
        // 每词两条不同频正弦叠加 + 各自相位(seed) → 不同步、无序
        const jx = (Math.sin(t * JF1 + w.seed * 7.3) + Math.sin(t * JF2 + w.seed * 2.1)) * 0.5 * a
        const jy = (Math.sin(t * JF3 + w.seed * 4.7) + Math.sin(t * JF4 + w.seed * 3.4)) * 0.5 * a
        const jr = Math.sin(t * JF1 + w.seed * 5.5) * a * 0.4
        w.inner.style.transform = `translate(${jx.toFixed(2)}px,${jy.toFixed(2)}px) rotate(${jr.toFixed(2)}deg)`
      } else if (w.inner.style.transform) {
        w.inner.style.transform = ''
      }
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
