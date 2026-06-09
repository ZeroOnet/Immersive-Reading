import type { ParamSchema } from '../types'

export interface AliceFallSkinParams {
  title: string
  subtitle: string
  body: string
  titleColor: string
  subtitleColor: string
  bodyColor: string
  // —— Letter Rain（旋转→掉落）——
  gravity: number // 掉落加速度
  bounce: number // 触边弹性
  spring: number // 回正复位弹力
  spin: number // 翻滚强度
}

// Alice's Adventures in Wonderland（1865, Lewis Carroll）— 公有领域原文，开篇段落
const BODY =
  'The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down what seemed to be a very deep well. Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her and to wonder what was going to happen next.'

export const defaultParams: AliceFallSkinParams = {
  title: 'Down the Rabbit-Hole',
  subtitle: '掉进兔子洞',
  body: BODY,
  titleColor: '#140d05',
  subtitleColor: '#9b9b9b',
  bodyColor: '#1a140c',
  gravity: 0.6,
  bounce: 0.25,
  spring: 0.08,
  spin: 1,
}

export const presets: Record<string, AliceFallSkinParams> = {
  wonderland: { ...defaultParams },
  heavy: { ...defaultParams, gravity: 1.1, spin: 1.6, bounce: 0.35 },
}

export const schema: ParamSchema<AliceFallSkinParams> = {
  title: { type: 'text', label: '标题' },
  subtitle: { type: 'text', label: '副标题' },
  body: { type: 'text', label: '正文' },
  titleColor: { type: 'color', label: '标题色' },
  subtitleColor: { type: 'color', label: '副标题色' },
  bodyColor: { type: 'color', label: '正文色' },
  gravity: { type: 'range', label: '重力', min: 0.1, max: 2, step: 0.05 },
  bounce: { type: 'range', label: '弹性', min: 0, max: 0.7, step: 0.05 },
  spring: { type: 'range', label: '复位弹力', min: 0.02, max: 0.2, step: 0.01 },
  spin: { type: 'range', label: '翻滚', min: 0, max: 2, step: 0.1 },
}
