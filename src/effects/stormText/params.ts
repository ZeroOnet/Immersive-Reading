import type { ParamSchema } from '../types'

export interface StormTextParams {
  paragraph: string
  keyword: string // 可点击、点了平息风暴的关键词
  hiddenSentence: string // 平息后显影的隐藏句
  windIntensity: number // 基础风强 0..1（桌面用它当 baseline；真机/成品由滚动速度叠加）
  gustReactivity: number // 滚轮/滚动叠加阵风的灵敏度
  shake: number // 最大位移 px
  skew: number // 最大倾斜 deg
  stretch: number // 最大横向拉扯（scaleX 偏移）
  blur: number // 最大模糊 px
  color: string
  keywordColor: string
}

export const defaultParams: StormTextParams = {
  paragraph:
    'The wind came down off the moor and pulled at every word on the page, as if the house itself were breathing.',
  keyword: 'house',
  hiddenSentence: 'The house remembers every word.',
  windIntensity: 0.35,
  gustReactivity: 1,
  shake: 6,
  skew: 5,
  stretch: 0.06,
  blur: 2.2,
  color: '#d8d2e6',
  keywordColor: '#9ad8ff',
}

export const presets: Record<string, StormTextParams> = {
  // 《呼啸山庄》：冷、烈、荒原
  wuthering: { ...defaultParams },
  // 微风：几乎静止，适合演示"风停显字"
  breeze: { ...defaultParams, windIntensity: 0.12, shake: 3, skew: 2, blur: 1 },
}

export const schema: ParamSchema<StormTextParams> = {
  paragraph: { type: 'text', label: '正文' },
  keyword: { type: 'text', label: '关键词(可点)' },
  hiddenSentence: { type: 'text', label: '隐藏句' },
  windIntensity: { type: 'range', label: '风强(基础)', min: 0, max: 1, step: 0.01 },
  gustReactivity: { type: 'range', label: '阵风灵敏度', min: 0, max: 3, step: 0.1 },
  shake: { type: 'range', label: '位移', min: 0, max: 16, step: 0.5 },
  skew: { type: 'range', label: '倾斜', min: 0, max: 16, step: 0.5 },
  stretch: { type: 'range', label: '拉扯', min: 0, max: 0.3, step: 0.01 },
  blur: { type: 'range', label: '模糊', min: 0, max: 6, step: 0.1 },
  color: { type: 'color', label: '正文色' },
  keywordColor: { type: 'color', label: '关键词色' },
}
