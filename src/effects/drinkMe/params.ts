import type { ParamSchema } from '../types'

export interface DrinkMeParams {
  text: string
  baseFontSize: number // 正常字号 px
  maxScale: number // DRINK ME 放大到几倍
  minScale: number // EAT ME 缩小到几倍
  lineHeightExpand: number // 放大时行距额外拉开的强度
  furnitureMinLen: number // 词长 ≥ 此值的词会"像家具一样"额外膨胀
  furnitureExtra: number // 额外膨胀强度
  ease: number // 缩放缓动
  aliceSpeed: number // Alice 横穿速度（次/秒）
  aliceSize: number // Alice 基础大小 px（随文字变大而变小）
  color: string
  accent: string
}

export const defaultParams: DrinkMeParams = {
  text:
    'She drank from the little bottle, and the room began to grow — or was she the one shrinking? The words swelled like furniture all around her.',
  baseFontSize: 22,
  maxScale: 2.6,
  minScale: 0.5,
  lineHeightExpand: 1.4,
  furnitureMinLen: 6,
  furnitureExtra: 0.55,
  ease: 0.06,
  aliceSpeed: 0.08,
  aliceSize: 26,
  color: '#efe7ff',
  accent: '#c9a7ff',
}

export const presets: Record<string, DrinkMeParams> = {
  wonderland: { ...defaultParams },
  // 极端缩小：掉进兔子洞
  tiny: { ...defaultParams, minScale: 0.32, maxScale: 3.2, aliceSize: 34 },
}

export const schema: ParamSchema<DrinkMeParams> = {
  text: { type: 'text', label: '正文' },
  baseFontSize: { type: 'range', label: '基础字号', min: 12, max: 40, step: 1 },
  maxScale: { type: 'range', label: '放大倍数', min: 1.2, max: 4, step: 0.1 },
  minScale: { type: 'range', label: '缩小倍数', min: 0.2, max: 1, step: 0.05 },
  lineHeightExpand: { type: 'range', label: '行距拉开', min: 0, max: 3, step: 0.1 },
  furnitureMinLen: { type: 'range', label: '家具词长阈值', min: 3, max: 10, step: 1 },
  furnitureExtra: { type: 'range', label: '家具膨胀', min: 0, max: 1.5, step: 0.05 },
  ease: { type: 'range', label: '缩放缓动', min: 0.02, max: 0.2, step: 0.01 },
  aliceSpeed: { type: 'range', label: 'Alice 速度', min: 0.02, max: 0.3, step: 0.01 },
  aliceSize: { type: 'range', label: 'Alice 大小', min: 14, max: 48, step: 1 },
  color: { type: 'color', label: '文字色' },
  accent: { type: 'color', label: '强调色' },
}
