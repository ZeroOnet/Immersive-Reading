import type { ParamSchema } from '../types'

export interface AliceSkinParams {
  subtitle: string
  body: string
  subtitleColor: string
  bodyColor: string
  scrim: number
  // —— Drink Me（忽大忽小）——
  baseFontSize: number // 正文基础字号
  maxScale: number // DRINK ME 放大
  minScale: number // EAT ME 缩小
  lineHeightExpand: number // 放大时行距额外拉开
  furnitureMinLen: number // 长词膨胀阈值
  furnitureExtra: number // 长词膨胀强度
  ease: number
  aliceSpeed: number // Alice 横穿速度
  aliceSize: number // Alice 大小
  // —— 扑克牌人眼睛 ——
  eyeTrack: number // 瞳孔跟随强度 0..1
}

const BODY =
  'Have you ever wondered what happens when logic steps aside, and whimsical absurdity takes over? Then, welcome to a timeless tale that tumbled into our world in 1865 and has been charmingly disorienting readers ever since.'

export const defaultParams: AliceSkinParams = {
  subtitle: '爱丽丝梦游仙境',
  body: BODY,
  subtitleColor: '#fcf1b5',
  bodyColor: '#faf3d5',
  scrim: 0.18,
  baseFontSize: 19,
  maxScale: 2.4,
  minScale: 0.55,
  lineHeightExpand: 1.0,
  furnitureMinLen: 6,
  furnitureExtra: 0.5,
  ease: 0.06,
  aliceSpeed: 0.08,
  aliceSize: 48,
  eyeTrack: 1,
}

export const presets: Record<string, AliceSkinParams> = {
  wonderland: { ...defaultParams },
  tiny: { ...defaultParams, minScale: 0.32, maxScale: 3.2, aliceSize: 32 },
}

export const schema: ParamSchema<AliceSkinParams> = {
  subtitle: { type: 'text', label: '副标题' },
  body: { type: 'text', label: '正文' },
  subtitleColor: { type: 'color', label: '副标题色' },
  bodyColor: { type: 'color', label: '正文色' },
  scrim: { type: 'range', label: '压暗', min: 0, max: 1, step: 0.05 },
  baseFontSize: { type: 'range', label: '基础字号', min: 12, max: 30, step: 1 },
  maxScale: { type: 'range', label: '放大倍数', min: 1.2, max: 4, step: 0.1 },
  minScale: { type: 'range', label: '缩小倍数', min: 0.2, max: 1, step: 0.05 },
  lineHeightExpand: { type: 'range', label: '行距拉开', min: 0, max: 3, step: 0.1 },
  furnitureMinLen: { type: 'range', label: '家具词长阈值', min: 3, max: 10, step: 1 },
  furnitureExtra: { type: 'range', label: '家具膨胀', min: 0, max: 1.5, step: 0.05 },
  ease: { type: 'range', label: '缩放缓动', min: 0.02, max: 0.2, step: 0.01 },
  aliceSpeed: { type: 'range', label: 'Alice 速度', min: 0.02, max: 0.3, step: 0.01 },
  aliceSize: { type: 'range', label: 'Alice 大小', min: 20, max: 110, step: 2 },
  eyeTrack: { type: 'range', label: '眼睛跟随', min: 0, max: 1, step: 0.05 },
}
