import type { ParamSchema } from '../types'

export interface GoneSkinParams {
  // —— 文字（标题为艺术字图片，不在此）——
  subtitle: string
  body: string // 段落用空行分隔
  quote: string // 底部手写体引文
  subtitleColor: string
  bodyColor: string
  quoteColor: string
  scrim: number
  // —— Page Burn（边缘炭化燃烧）——
  burn: number // 0..1 炭化前沿从边缘向内推进
  edgeReach: number // 可燃范围（占短边）
  ragged: number // 前沿碎裂
  ember: number // 余烬鳞带半宽（D 空间）
  sparks: number // 火星数
  charColor: string // 焦黑色
  emberColor: string // 余烬色
  ashColor: string // 烧过后的黑色灰烬色
  eraseRadius: number // 滑动擦除的笔刷半径（占短边比例）
}

// 设计稿内的文案（9:697 / 9:702）
const BODY = `Margaret Mitchell weaves a sweeping saga of pride.

At its heart is Scarlett O’Hara— beautiful, headstrong, and unapologetically determined. As war tears her world apart and everything she knew turns to ashes, she makes a vow that will carry her through:`

export const defaultParams: GoneSkinParams = {
  subtitle: '飘',
  body: BODY,
  quote: '“As God is my witness, I’ll never be hungry again.”',
  subtitleColor: '#d1a96d',
  bodyColor: '#d7c1a9',
  quoteColor: '#d7c1a9',
  scrim: 0.18,
  burn: 0.01, // 开场动画从 1 退到这里（仅留极薄焦边）
  edgeReach: 1,
  ragged: 0.85,
  ember: 0.05,
  sparks: 50,
  charColor: '#1a0f0b', // 炭黑（≈ demo char[26,15,11]）
  emberColor: '#ff6a1a', // 灼烧前沿辉光色
  ashColor: '#0d0907',
  eraseRadius: 0.1,
}

export const presets: Record<string, GoneSkinParams> = {
  pristine: { ...defaultParams }, // burn 0，完好
  ashes: { ...defaultParams, burn: 0.32 },
  inferno: { ...defaultParams, burn: 0.5, sparks: 90, edgeReach: 0.42 },
}

export const schema: ParamSchema<GoneSkinParams> = {
  subtitle: { type: 'text', label: '副标题' },
  body: { type: 'text', label: '正文' },
  quote: { type: 'text', label: '引文' },
  subtitleColor: { type: 'color', label: '副标题色' },
  bodyColor: { type: 'color', label: '正文色' },
  quoteColor: { type: 'color', label: '引文色' },
  scrim: { type: 'range', label: '压暗', min: 0, max: 1, step: 0.05 },
  burn: { type: 'range', label: '燃烧进度', min: 0, max: 1, step: 0.001 },
  edgeReach: { type: 'range', label: '可燃范围', min: 0.1, max: 1, step: 0.01 },
  ragged: { type: 'range', label: '前沿碎裂', min: 0, max: 1, step: 0.05 },
  ember: { type: 'range', label: '余烬带宽', min: 0, max: 0.15, step: 0.001 },
  sparks: { type: 'range', label: '火星数', min: 0, max: 140, step: 1 },
  charColor: { type: 'color', label: '焦黑色' },
  emberColor: { type: 'color', label: '余烬色' },
  ashColor: { type: 'color', label: '灰烬色' },
  eraseRadius: { type: 'range', label: '擦除笔刷', min: 0.03, max: 0.25, step: 0.01 },
}
