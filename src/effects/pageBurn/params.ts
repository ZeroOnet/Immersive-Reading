import type { ParamSchema } from '../types'

export interface PageBurnParams {
  text: string
  burn: number // 0..1 燃烧推进（扫过燃烧次序场）
  edgeReach: number // 从边缘向内的可燃范围（占短边比例）
  ragged: number // 噪声不规则度（前沿越碎越像纸）
  ember: number // 余烬鳞带半宽（次序场 D 空间）
  scorch: number // 纸张焦黄过渡带宽（D 空间）
  sparks: number // 火星数
  paperColor: string // 纸张色
  textColor: string // 墨水色
  charColor: string // 焦黑色
  emberColor: string // 余烬色
  voidColor: string // 烧穿后露出的暗底
}

export const defaultParams: PageBurnParams = {
  text: 'the city was burning and the words burned with it',
  burn: 0.42,
  edgeReach: 0.38,
  ragged: 0.85,
  ember: 0.045,
  scorch: 0.08,
  sparks: 50,
  paperColor: '#d8c6a0',
  textColor: '#3b2c1c',
  charColor: '#241712',
  emberColor: '#ff6a1a',
  voidColor: '#0a0805',
}

export const presets: Record<string, PageBurnParams> = {
  // 《飘》战争阶段：大面积烧穿、火星纷飞
  scarlett: { ...defaultParams, burn: 0.48 },
  // 刚开始烧：边角焦痕
  edge_calm: { ...defaultParams, burn: 0.18, sparks: 22 },
}

export const schema: ParamSchema<PageBurnParams> = {
  text: { type: 'text', label: '正文' },
  burn: { type: 'range', label: '燃烧进度', min: 0, max: 1, step: 0.01 },
  edgeReach: { type: 'range', label: '可燃范围', min: 0.1, max: 0.6, step: 0.01 },
  ragged: { type: 'range', label: '前沿碎裂', min: 0, max: 1, step: 0.05 },
  ember: { type: 'range', label: '余烬带宽', min: 0.01, max: 0.15, step: 0.005 },
  scorch: { type: 'range', label: '焦黄带宽', min: 0, max: 0.3, step: 0.01 },
  sparks: { type: 'range', label: '火星数', min: 0, max: 120, step: 1 },
  paperColor: { type: 'color', label: '纸张色' },
  textColor: { type: 'color', label: '墨水色' },
  charColor: { type: 'color', label: '焦黑色' },
  emberColor: { type: 'color', label: '余烬色' },
  voidColor: { type: 'color', label: '烧穿暗底' },
}
