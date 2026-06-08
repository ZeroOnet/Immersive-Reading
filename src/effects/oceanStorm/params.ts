import type { ParamSchema } from '../types'

export interface OceanStormParams {
  text: string
  bobAmp: number // 文字上下浮动 px
  bobSpeed: number
  rockDeg: number // 摇晃旋转幅度
  rain: number // 雨强 0..1
  // —— 水泼向镜头的飞溅 ——
  splashRate: number // 每秒迸射几簇
  dropsPerBurst: number // 每簇水珠数
  splashSpread: number // 散开角（弧度，越大越散）
  splashSpeed: number // 迸射速度
  splashGrowth: number // 冲向镜头的放大速度
  slide: number // 黏住后向下滑落的速度
  maxBolts: number // 每次闪电最多几条
  strikeInterval: number // 自动闪电间隔秒（0=仅手动 Reset）
  maxGap: number // 闪电劈裂文字错位 px
  boltJitter: number // 电弧锯齿
  flicker: number // 暴风前背景明暗闪烁
  skyColor: string
  dropColor: string
  color: string // 文字色
}

export const defaultParams: OceanStormParams = {
  text: 'he was alone with the sea',
  bobAmp: 9,
  bobSpeed: 1,
  rockDeg: 2,
  rain: 0.5,
  splashRate: 2,
  dropsPerBurst: 16,
  splashSpread: 1.1,
  splashSpeed: 3,
  splashGrowth: 1,
  slide: 0.7,
  maxBolts: 3,
  strikeInterval: 5,
  maxGap: 18,
  boltJitter: 22,
  flicker: 0.3,
  skyColor: '#0a0f1c',
  dropColor: '#bfe6ff',
  color: '#cfe6f0',
}

export const presets: Record<string, OceanStormParams> = {
  oldman: { ...defaultParams },
  calm: { ...defaultParams, rain: 0.15, splashRate: 0.8, dropsPerBurst: 8, strikeInterval: 0, flicker: 0.1 },
  drenched: { ...defaultParams, splashRate: 4, dropsPerBurst: 26, splashSpread: 1.6, splashSpeed: 4 },
}

export const schema: ParamSchema<OceanStormParams> = {
  text: { type: 'text', label: '文字' },
  bobAmp: { type: 'range', label: '浮动幅度', min: 0, max: 30, step: 1 },
  bobSpeed: { type: 'range', label: '浪速(文字)', min: 0.2, max: 3, step: 0.1 },
  rockDeg: { type: 'range', label: '摇晃', min: 0, max: 8, step: 0.2 },
  rain: { type: 'range', label: '雨强', min: 0, max: 1, step: 0.05 },
  splashRate: { type: 'range', label: '飞溅频率(/s)', min: 0, max: 8, step: 0.5 },
  dropsPerBurst: { type: 'range', label: '每簇水珠', min: 2, max: 40, step: 1 },
  splashSpread: { type: 'range', label: '散开角', min: 0.1, max: 3.14, step: 0.05 },
  splashSpeed: { type: 'range', label: '迸射速度', min: 1, max: 8, step: 0.5 },
  splashGrowth: { type: 'range', label: '冲镜放大', min: 0.3, max: 3, step: 0.1 },
  slide: { type: 'range', label: '下滑速度', min: 0.1, max: 3, step: 0.1 },
  maxBolts: { type: 'range', label: '最多闪电数', min: 1, max: 6, step: 1 },
  strikeInterval: { type: 'range', label: '闪电间隔(s,0=手动)', min: 0, max: 12, step: 1 },
  maxGap: { type: 'range', label: '裂缝错位', min: 0, max: 40, step: 1 },
  boltJitter: { type: 'range', label: '电弧锯齿', min: 4, max: 50, step: 1 },
  flicker: { type: 'range', label: '明暗闪烁', min: 0, max: 1, step: 0.05 },
  skyColor: { type: 'color', label: '天空色' },
  dropColor: { type: 'color', label: '水珠色' },
  color: { type: 'color', label: '文字色' },
}
