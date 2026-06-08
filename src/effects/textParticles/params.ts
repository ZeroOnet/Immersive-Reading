import type { ParamSchema } from '../types'

export interface TextParticlesParams {
  text: string
  mode: 'interactive' | 'assemble' | 'wind' | 'collapse' | 'gravity'
  density: number // 采样步长，越小越密
  particleSize: number
  color: string // hex
  windAmplitude: number
  gravityStrength: number
  ease: number
  // —— interactive 模式（仿 Codrops Interactive Particles）——
  pointerRadius: number // 指针排斥半径 px
  pointerForce: number // 排斥强度
  spring: number // 回家弹力
  damping: number // 速度阻尼
  glow: number // 柔光强度
  idle: number // 静止时的微漂移
}

export const defaultParams: TextParticlesParams = {
  text: 'MAGIC',
  mode: 'interactive',
  density: 5,
  particleSize: 2.4,
  color: '#b9a6ff',
  windAmplitude: 14,
  gravityStrength: 1,
  ease: 0.12,
  pointerRadius: 90,
  pointerForce: 4,
  spring: 0.05,
  damping: 0.86,
  glow: 0.9,
  idle: 2,
}

// 命名预设：Gallery 直接消费冻结值；Lab 可一键载入再微调。
export const presets: Record<string, TextParticlesParams> = {
  interactive: { ...defaultParams, text: 'TOUCH ME', mode: 'interactive', color: '#9ad8ff' },
  fantasy: { ...defaultParams, text: 'SPELL', mode: 'assemble', color: '#b9a6ff' },
  detective: { ...defaultParams, text: 'CLUE', mode: 'collapse', color: '#e0b483' },
  scifi: { ...defaultParams, text: 'GRAVITY', mode: 'gravity', color: '#7bffce', gravityStrength: 1.4 },
}

export const schema: ParamSchema<TextParticlesParams> = {
  text: { type: 'text', label: '文字' },
  mode: { type: 'select', label: '模式', options: ['interactive', 'assemble', 'wind', 'collapse', 'gravity'] },
  density: { type: 'range', label: '密度(步长)', min: 2, max: 14, step: 1 },
  particleSize: { type: 'range', label: '粒子大小', min: 1, max: 6, step: 0.2 },
  color: { type: 'color', label: '颜色' },
  pointerRadius: { type: 'range', label: '指针半径', min: 20, max: 200, step: 5 },
  pointerForce: { type: 'range', label: '排斥力', min: 0, max: 12, step: 0.5 },
  spring: { type: 'range', label: '回弹', min: 0.01, max: 0.2, step: 0.01 },
  damping: { type: 'range', label: '阻尼', min: 0.7, max: 0.97, step: 0.01 },
  glow: { type: 'range', label: '柔光', min: 0, max: 1.5, step: 0.05 },
  idle: { type: 'range', label: '微漂移', min: 0, max: 8, step: 0.5 },
  windAmplitude: { type: 'range', label: '风幅', min: 0, max: 40, step: 1 },
  gravityStrength: { type: 'range', label: '引力', min: 0, max: 3, step: 0.1 },
  ease: { type: 'range', label: '缓动', min: 0.02, max: 0.4, step: 0.01 },
}
