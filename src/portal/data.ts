// 门户屏幕配置：唯一文案真源。main.ts 据此构建 scroll-snap 各屏。
// effectId 有值 → 该屏激活时全局手机挂这个 effect（手动体验）；无值 → 纯文字屏，手机淡出。

export interface PortalScreen {
  id: string
  kind: 'hero' | 'text' | 'module'
  eyebrow?: string // 模块标签，如 "01 · 氛围营造"
  title: string
  lines?: string[] // 副文案（每行一段）
  effectId?: string // 挂进全局手机的 effect id（见 effects/registry）
  book?: string // 书名标注
  hint?: string // 操作提示，如 "点击词语试试"
  accent?: string // 该屏强调色（局部光源）
}

export const SCREENS: PortalScreen[] = [
  {
    id: 'hero',
    kind: 'hero',
    title: '文本显灵 · Magic Text Reading',
    lines: [
      'AI 时代内容消费新体验 — 多模态互动式阅读',
      '让文字不再只是被阅读，而是可以被触发、被听见、被点亮、被揭开。',
    ],
    effectId: 'goneSkin',
    accent: '#ff7a3c',
    hint: '向下滚动开始',
  },
  {
    id: 'concept',
    kind: 'text',
    eyebrow: '核心理念',
    title: '不是把素材放在一起，而是让多模态和文本发生反应。',
    lines: ['文本内容 + 视觉场景 + 声音反馈 + 动态视频 + 用户行为 = 沉浸式文学体验'],
  },
  {
    id: 'sherlock',
    kind: 'module',
    eyebrow: '02 · 氛围营造 + 互动',
    title: '视觉解谜：RACHE 的两层反转',
    lines: ['读者不只是看见线索，而是通过推理、点击亲手触发关键意义。'],
    effectId: 'sherlockSkin',
    book: '《血字的研究》',
    hint: '点高亮文本 / 底部「查看案发现场」',
    accent: '#e63b3b',
  },
  {
    id: 'alice',
    kind: 'module',
    eyebrow: '03 · WOW 奇幻体验',
    title: '点击词语，纸牌击碎文字',
    lines: ['图形飞过文本，文字被撞散、旋转、再归位——荒诞就是页面本身的物理规则。'],
    effectId: 'aliceSkin',
    book: '《爱丽丝梦游奇境记》',
    hint: '点击正文里的词',
    accent: '#d11f3a',
  },
  {
    id: 'pride',
    kind: 'module',
    eyebrow: '04 · 走进角色内心',
    title: '揭开表白下面的傲慢',
    lines: ['表面是爱意；拖开纸条，底层浮现“我觉得你配不上我”。'],
    effectId: 'prideSkin',
    book: '《傲慢与偏见》',
    hint: '从右往左拖动贴纸',
    accent: '#b79f82',
  },
  {
    id: 'closing',
    kind: 'text',
    eyebrow: '结尾',
    title: '让每一本书，都拥有自己的进入方式。',
    lines: [
      '过去，阅读是在页面上理解文字。',
      '现在，阅读成为一种进入作品的方式：听见风暴，点亮咒语，坠入兔子洞，也揭开人物没有说出口的真心。',
    ],
  },
]
