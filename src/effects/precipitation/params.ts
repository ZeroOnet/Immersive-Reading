import type { ParamSchema } from '../types'

export interface PrecipitationParams {
  mode: 'rain' | 'snow'
  count: number // 粒子数
  speed: number // 下落速度
  wind: number // 横向风（正=右）
  size: number // 粒子大小（雨=线长系数 / 雪=半径）
  color: string
  opacity: number // 0..1
}

export const defaultParams: PrecipitationParams = {
  mode: 'rain',
  count: 320,
  speed: 9,
  wind: 1.6,
  size: 1,
  color: '#bcd3e6',
  opacity: 0.6,
}

export const presets: Record<string, PrecipitationParams> = {
  rain: { ...defaultParams },
  storm_rain: { ...defaultParams, count: 520, speed: 14, wind: 3.2, opacity: 0.7 },
  snow: { mode: 'snow', count: 240, speed: 1.6, wind: 0.6, size: 2.6, color: '#ffffff', opacity: 0.9 },
}

export const schema: ParamSchema<PrecipitationParams> = {
  mode: { type: 'select', label: '类型', options: ['rain', 'snow'] },
  count: { type: 'range', label: '数量', min: 20, max: 800, step: 10 },
  speed: { type: 'range', label: '速度', min: 0.5, max: 20, step: 0.5 },
  wind: { type: 'range', label: '风', min: -6, max: 6, step: 0.2 },
  size: { type: 'range', label: '大小', min: 0.4, max: 5, step: 0.1 },
  color: { type: 'color', label: '颜色' },
  opacity: { type: 'range', label: '不透明度', min: 0.1, max: 1, step: 0.05 },
}
