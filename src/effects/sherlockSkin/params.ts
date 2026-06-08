import type { ParamSchema } from '../types'

export interface SherlockSkinParams {
  titleEn: string
  titleZh: string
  // 段落用 \n\n 分隔。markdown 扩展：
  //   **xxx**   → 关键词高亮（粗体 + keywordColor）
  //   ((xxx))   → 可点击触发"展开浮层"的子串
  //   __xxx__   → 在浮层中逐词加红色下划线的子串（须位于 ((...)) 内）
  body: string
  // 颜色
  titleColor: string
  bodyColor: string
  keywordColor: string
  underlineColor: string // 逐词下划线颜色
  timeColor: string
  // 底部 CTA 卡片
  ctaLabel: string
  scrim: number
  // 展开浮层中的人物姓名（按 body 中 ((...)) trigger 出现顺序对应）
  characterNames: string[]
}

const BODY =
  '“Look at that!” Inspector G. Lestrade said, triumphantly.\n\n' +
  'I have remarked that the paper had fallen away in parts. In this particular corner of the room a large piece had peeled off, ' +
  'leaving a yellow square of coarse plastering. Across this bare space there was scrawled in blood-red letters a single word — **RACHE**.\n\n' +
  '“And what does it mean now that you have found it?” asked Gregson in a depreciatory voice.\n\n' +
  '“((Mean? __Why, it means that the writer was going to put the female name **Rachel**,__)) but was disturbed before he or she had time to finish. ' +
  'You mark my words, when this case comes to be cleared up you will find that a woman named **Rachel**.”\n\n' +
  '“If this man was murdered, how was it done?” asked the former.\n\n' +
  '“Poison,” said Sherlock Holmes curtly, and strode off. “One other thing, Lestrade,” he added, turning round at the door: ' +
  '((“**Rache**,” is __the German for “revenge”; so don’t lose your time looking for Miss **Rachel**__.”))' +
  // 末尾三个空段：给末段 trigger 留滚动余量，scrollIntoView 才能把它推到 body 新窗口中部
  '\n\n\n\n\n\n'

export const defaultParams: SherlockSkinParams = {
  titleEn: 'A Study in Scarlet',
  titleZh: '血字的研究',
  body: BODY,
  titleColor: '#c0c9ca',
  bodyColor: '#c0c9ca',
  keywordColor: '#66cbe1',
  underlineColor: '#e63b3b',
  timeColor: '#ffffff',
  ctaLabel: '查看案发现场',
  scrim: 0.25,
  characterNames: ['Inspector Lestrade', 'Sherlock Holmes'],
}

export const presets: Record<string, SherlockSkinParams> = {
  default: { ...defaultParams },
}

export const schema: ParamSchema<SherlockSkinParams> = {
  titleEn: { type: 'text', label: '英文标题' },
  titleZh: { type: 'text', label: '中文标题' },
  body: { type: 'text', label: '正文（**关键词** / ((可点击__逐词下划线__))' },
  titleColor: { type: 'color', label: '标题色' },
  bodyColor: { type: 'color', label: '正文色' },
  keywordColor: { type: 'color', label: '关键词色' },
  underlineColor: { type: 'color', label: '下划线色' },
  timeColor: { type: 'color', label: '状态栏色' },
  ctaLabel: { type: 'text', label: '底部按钮' },
  scrim: { type: 'range', label: '压暗', min: 0, max: 0.8, step: 0.02 },
  // characterNames 是数组，Lab 简单 schema 不直接支持；通过 update() 注入即可
}
