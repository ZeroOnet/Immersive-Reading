import type { ParamSchema } from '../types'

export interface VeilSkinParams {
  // 标题
  titleEn: string
  titleZh: string
  // 正文段落（点击触发解释卡）
  body: string
  bodyColor: string
  // 底部 Kalam 手写台词（小说结尾 Walter 临终一句）
  phrase1: string // "The dog
  phrase2: string // it was
  phrase3: string // that died."
  phraseColor: string
  // 中文译文
  translation: string
  translationColor: string
  // 解释卡（点击正文 → 揭示 Walter 这句话的含义）
  tooltipOpen: number // 0..1 解释卡展开进度（Lab 可拖动预览；运行时点击切换）
  noteIntro: string // 解释卡上半段（混排）
  noteIntroBold: string // 关键词："自嘲式暗讽"
  noteSrcPrefix: string // "(原句出自"
  noteSrc: string // "《疯狗之死挽歌》"
  noteSrcSuffix: string // ")，这里表达的意思是："
  noteQuote: string // 引用框文字（含**加粗**标记）
  // 视觉
  scrim: number
  timeColor: string
}

const BODY =
  'In the end, love is no longer a feeling but a choice made in the face of suffering. ' +
  'In a remote Chinese town racked by cholera, where the air is thick with fear and the stench of death, ' +
  'a doctor who once fled from marriage stays behind to serve. Exhausted,\nhollowed out.'

// **xxx** 包裹的片段会渲染为加粗（VeilSkin 内部解析）
const NOTE_QUOTE = '我原本想**用霍乱惩罚你**，没想到**最后死的却是我自己**。'

export const defaultParams: VeilSkinParams = {
  titleEn: 'The Painted Veil',
  titleZh: '面纱',
  body: BODY,
  bodyColor: '#eae5dc',
  phrase1: '“The dog',
  phrase2: 'it was',
  phrase3: 'that died.”',
  phraseColor: '#d1a96d',
  translation: '（死的确是狗）',
  translationColor: '#d6c8b1',
  tooltipOpen: 0,
  noteIntro: '这是 Walter 临死前留下的一句',
  noteIntroBold: '自嘲式暗讽',
  noteSrcPrefix: '（原句出自',
  noteSrc: '《疯狗之死挽歌》',
  noteSrcSuffix: '），这里表达的意思是：',
  noteQuote: NOTE_QUOTE,
  scrim: 0.18,
  timeColor: '#d6c8b1',
}

export const presets: Record<string, VeilSkinParams> = {
  veiled: { ...defaultParams }, // 点击前：纯净段落
  revealed: { ...defaultParams, tooltipOpen: 1 }, // 点击后：解释卡展开
}

export const schema: ParamSchema<VeilSkinParams> = {
  titleEn: { type: 'text', label: '英文标题' },
  titleZh: { type: 'text', label: '中文标题' },
  body: { type: 'text', label: '正文段落' },
  bodyColor: { type: 'color', label: '正文色' },
  phrase1: { type: 'text', label: '台词 1' },
  phrase2: { type: 'text', label: '台词 2' },
  phrase3: { type: 'text', label: '台词 3' },
  phraseColor: { type: 'color', label: '台词色' },
  translation: { type: 'text', label: '译文' },
  translationColor: { type: 'color', label: '译文色' },
  tooltipOpen: { type: 'range', label: '解释卡', min: 0, max: 1, step: 0.01 },
  noteIntro: { type: 'text', label: '解释·前言' },
  noteIntroBold: { type: 'text', label: '解释·关键词' },
  noteSrcPrefix: { type: 'text', label: '解释·出处前' },
  noteSrc: { type: 'text', label: '解释·出处名' },
  noteSrcSuffix: { type: 'text', label: '解释·出处后' },
  noteQuote: { type: 'text', label: '解释·引文（**加粗**）' },
  scrim: { type: 'range', label: '压暗', min: 0, max: 0.5, step: 0.02 },
  timeColor: { type: 'color', label: '状态栏色' },
}
