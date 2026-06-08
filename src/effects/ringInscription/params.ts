import type { ParamSchema } from '../types'

export interface RingInscriptionParams {
  text: string
  fill: number // 0..1 显现/填充进度（可拖动预览；召唤会累加）
  fillRate: number // 召唤填充速度
  threshold: number // 触发填充的音量阈值
  radiusFactor: number // 环半径（占短边）
  fontSize: number
  shimmerSpeed: number // 金色流动速度
  etchColor: string // 被雨冲淡的刻痕色
  goldColor: string
  glowColor: string
  rain: number // 雨痕强度 0..1
}

export const defaultParams: RingInscriptionParams = {
  text: 'speak louder and the gold shall answer the ancient call',
  fill: 0,
  fillRate: 0.55,
  threshold: 0.06,
  radiusFactor: 0.34,
  fontSize: 22,
  shimmerSpeed: 3,
  etchColor: '#5b5446',
  goldColor: '#ffcf6a',
  glowColor: '#ffae33',
  rain: 0.5,
}

export const presets: Record<string, RingInscriptionParams> = {
  ring: { ...defaultParams },
  // 容易显现：阈值低、填充快（演示/嘈杂环境）
  easy: { ...defaultParams, threshold: 0.03, fillRate: 0.9, rain: 0.3 },
}

export const schema: ParamSchema<RingInscriptionParams> = {
  text: { type: 'text', label: '铭文' },
  fill: { type: 'range', label: '填充进度', min: 0, max: 1, step: 0.01 },
  fillRate: { type: 'range', label: '召唤速度', min: 0.1, max: 1.5, step: 0.05 },
  threshold: { type: 'range', label: '音量阈值', min: 0.01, max: 0.2, step: 0.01 },
  radiusFactor: { type: 'range', label: '环半径', min: 0.2, max: 0.45, step: 0.01 },
  fontSize: { type: 'range', label: '字号', min: 12, max: 40, step: 1 },
  shimmerSpeed: { type: 'range', label: '流动速度', min: 0, max: 8, step: 0.5 },
  etchColor: { type: 'color', label: '刻痕色' },
  goldColor: { type: 'color', label: '金色' },
  glowColor: { type: 'color', label: '辉光色' },
  rain: { type: 'range', label: '雨痕', min: 0, max: 1, step: 0.05 },
}
