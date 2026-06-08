import type { ParamSchema } from '../types'

export interface LetterRainParams {
  text: string
  gravity: number // 0..2 重力强度
  gravityAngle: number // deg，90 = 朝下；桌面用滑块模拟"倾斜方向"，真机由陀螺仪覆盖
  bounce: number // 边界弹性 0..0.9
  airFriction: number // 空气阻力 0.9..1（越小越快停）
  sizeMin: number
  sizeMax: number
  color: string
  repulsion: number // 字母互斥强度 → 决定"堆积"是否散开成一堆
}

export const defaultParams: LetterRainParams = {
  text: 'we are all mad here',
  gravity: 0.28,
  gravityAngle: 90,
  bounce: 0.25,
  airFriction: 0.99,
  sizeMin: 16,
  sizeMax: 34,
  color: '#cbb8ff',
  repulsion: 0.6,
}

// 不同书 = 不同物理手感
export const presets: Record<string, LetterRainParams> = {
  // 《爱丽丝》：梦境般缓慢飘落
  alice_dream: { ...defaultParams, gravity: 0.2, airFriction: 0.985, color: '#cbb8ff', text: 'down down down' },
  // 暴风骤雨：快、弹、冷色
  storm: { ...defaultParams, gravity: 0.95, bounce: 0.45, color: '#9ad8ff', text: 'the storm of words' },
}

export const schema: ParamSchema<LetterRainParams> = {
  text: { type: 'text', label: '文字' },
  gravity: { type: 'range', label: '重力', min: 0, max: 2, step: 0.01 },
  gravityAngle: { type: 'range', label: '倾斜角(桌面模拟)', min: 0, max: 360, step: 1 },
  bounce: { type: 'range', label: '弹性', min: 0, max: 0.9, step: 0.05 },
  airFriction: { type: 'range', label: '空气阻力', min: 0.9, max: 1, step: 0.005 },
  sizeMin: { type: 'range', label: '最小字号', min: 8, max: 40, step: 1 },
  sizeMax: { type: 'range', label: '最大字号', min: 10, max: 64, step: 1 },
  color: { type: 'color', label: '颜色' },
  repulsion: { type: 'range', label: '堆积排斥', min: 0, max: 1, step: 0.05 },
}
