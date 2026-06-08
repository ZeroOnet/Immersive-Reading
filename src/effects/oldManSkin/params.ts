import type { ParamSchema } from '../types'

export interface OldManSkinParams {
  // —— 文字 ——
  title: string
  subtitle: string
  body: string // 段落用空行分隔
  titleColor: string
  subtitleColor: string
  bodyColor: string
  scrim: number // 背景压暗（保证文字可读）
  // —— 风暴（Ocean Storm 全参数）——
  bobAmp: number // 文字随浪浮动幅度
  bobSpeed: number
  rockDeg: number // 摇晃
  rain: number // 雨强
  splashRate: number // 水泼飞溅频率（0=关）
  dropsPerBurst: number
  splashSpread: number // 散开角
  splashSpeed: number
  splashGrowth: number // 冲镜放大
  slide: number // 黏住后下滑速度
  strikeInterval: number // 自动闪电间隔(s,0=仅手动)
  maxBolts: number // 每次最多闪电数
  boltJitter: number // 电弧锯齿
  maxGap: number // 文字被劈裂的撕裂幅度
  flicker: number // 背景明暗闪烁
  dropColor: string // 水珠色
}

const BODY = `Have you ever stood where the sea seems endless, and felt how solitude presses in even as courage rises up? Then, step onto this small boat and enter a timeless story of an old fisherman who sails far beyond the shore, meeting the vast ocean with nothing but his skill, his endurance, and his unyielding will.

Written by Ernest Hemingway, this spare and powerful novella follows Santiago as he drifts into deep waters, where struggle, dignity, and the harsh beauty of the sea become one. Beneath the crash of waves and the threat of storm, it is a journey about loneliness, defiance, and what it means to remain unbroken.`

export const defaultParams: OldManSkinParams = {
  title: 'The Old Man and the Sea',
  subtitle: '老人与海',
  body: BODY,
  titleColor: '#c5bba5',
  subtitleColor: '#afafaf',
  bodyColor: '#c5bba5',
  scrim: 0.28,
  bobAmp: 9,
  bobSpeed: 1,
  rockDeg: 2,
  rain: 0.5,
  splashRate: 0,
  dropsPerBurst: 16,
  splashSpread: 1.1,
  splashSpeed: 3,
  splashGrowth: 1,
  slide: 0.7,
  strikeInterval: 6,
  maxBolts: 3,
  boltJitter: 22,
  maxGap: 14,
  flicker: 0.3,
  dropColor: '#bfe6ff',
}

export const presets: Record<string, OldManSkinParams> = {
  oldman: { ...defaultParams },
  calm: { ...defaultParams, rain: 0.2, strikeInterval: 0, flicker: 0.1, scrim: 0.42 },
  drenched: { ...defaultParams, rain: 0.85, splashRate: 4, dropsPerBurst: 24, splashSpread: 1.6, scrim: 0.32 },
}

export const schema: ParamSchema<OldManSkinParams> = {
  title: { type: 'text', label: '标题' },
  subtitle: { type: 'text', label: '副标题' },
  body: { type: 'text', label: '正文' },
  titleColor: { type: 'color', label: '标题色' },
  subtitleColor: { type: 'color', label: '副标题色' },
  bodyColor: { type: 'color', label: '正文色' },
  scrim: { type: 'range', label: '压暗', min: 0, max: 1, step: 0.05 },
  bobAmp: { type: 'range', label: '浮动幅度', min: 0, max: 30, step: 1 },
  bobSpeed: { type: 'range', label: '浪速', min: 0.2, max: 10, step: 0.1 },
  rockDeg: { type: 'range', label: '摇晃', min: 0, max: 8, step: 0.2 },
  rain: { type: 'range', label: '雨强', min: 0, max: 1, step: 0.05 },
  splashRate: { type: 'range', label: '飞溅频率(0=关)', min: 0, max: 8, step: 0.5 },
  dropsPerBurst: { type: 'range', label: '每簇水珠', min: 2, max: 40, step: 1 },
  splashSpread: { type: 'range', label: '散开角', min: 0.1, max: 3.14, step: 0.05 },
  splashSpeed: { type: 'range', label: '迸射速度', min: 1, max: 8, step: 0.5 },
  splashGrowth: { type: 'range', label: '冲镜放大', min: 0.3, max: 3, step: 0.1 },
  slide: { type: 'range', label: '下滑速度', min: 0.1, max: 3, step: 0.1 },
  strikeInterval: { type: 'range', label: '闪电间隔(s,0=手动)', min: 0, max: 12, step: 1 },
  maxBolts: { type: 'range', label: '最多闪电数', min: 1, max: 6, step: 1 },
  boltJitter: { type: 'range', label: '电弧锯齿', min: 4, max: 50, step: 1 },
  maxGap: { type: 'range', label: '撕裂幅度', min: 0, max: 40, step: 1 },
  flicker: { type: 'range', label: '明暗闪烁', min: 0, max: 1, step: 0.05 },
  dropColor: { type: 'color', label: '水珠色' },
}
