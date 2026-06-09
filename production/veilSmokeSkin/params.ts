import type { ParamSchema } from '../types'

export interface VeilSmokeSkinParams {
  titleEn: string
  titleZh: string
  body: string
  bodyColor: string
  // 两组台词（点击烟雾在它们之间切换）
  phraseA: string // "You know I adore you."
  phraseAZh: string // 「（你知道我有多爱你）」
  phraseAColor: string
  phraseB: string // "But not enough to risk anything."
  phraseBZh: string // 「（但不足以冒任何风险）」
  phraseBColor: string
  // 0 → phraseA（烟雾在上位）；1 → phraseB（烟雾下移 60px）
  state: number
  // 视觉
  scrim: number
  timeColor: string
}

const BODY =
  'In the end, love is no longer a feeling but a choice made in the face of suffering. ' +
  'In a remote Chinese town racked by cholera, where the air is thick with fear and the stench of death, ' +
  'a doctor who once fled from marriage stays\nbehind to serve.'

export const defaultParams: VeilSmokeSkinParams = {
  titleEn: 'The Painted Veil',
  titleZh: '面纱',
  body: BODY,
  bodyColor: '#b3b0a6',
  phraseA: '“You know I adore you.”',
  phraseAZh: '（你知道我有多爱你）',
  phraseAColor: '#bb915a',
  phraseB: '“But not enough to risk\nanything.”',
  phraseBZh: '（但不足以冒任何风险）',
  phraseBColor: '#a4a4a4',
  state: 0,
  scrim: 0.35,
  timeColor: '#bbb09a',
}

export const presets: Record<string, VeilSmokeSkinParams> = {
  tender: { ...defaultParams }, // 第一句：「你知道我有多爱你」
  bitter: { ...defaultParams, state: 1 }, // 第二句：「但不足以冒任何风险」
}

export const schema: ParamSchema<VeilSmokeSkinParams> = {
  titleEn: { type: 'text', label: '英文标题' },
  titleZh: { type: 'text', label: '中文标题' },
  body: { type: 'text', label: '正文' },
  bodyColor: { type: 'color', label: '正文色' },
  phraseA: { type: 'text', label: '台词 A·EN' },
  phraseAZh: { type: 'text', label: '台词 A·ZH' },
  phraseAColor: { type: 'color', label: '台词 A 色' },
  phraseB: { type: 'text', label: '台词 B·EN' },
  phraseBZh: { type: 'text', label: '台词 B·ZH' },
  phraseBColor: { type: 'color', label: '台词 B 色' },
  state: { type: 'range', label: '状态 A→B', min: 0, max: 1, step: 0.01 },
  scrim: { type: 'range', label: '压暗', min: 0, max: 0.8, step: 0.02 },
  timeColor: { type: 'color', label: '状态栏色' },
}
