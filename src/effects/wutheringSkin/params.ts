import type { ParamSchema } from '../types'

export interface WutheringSkinParams {
  // —— 文字 ——
  title: string
  subtitle: string
  body: string // 段落用空行分隔
  titleColor: string
  subtitleColor: string
  bodyColor: string
  scrim: number
  // —— Storm Text（荒原风）——
  windIntensity: number // 基础风强 0..1
  gustReactivity: number // 滚动→阵风灵敏度
  shake: number // 最大位移 px
  skew: number // 最大倾斜 deg
  stretch: number // 最大横向拉扯
  blur: number // 阵风时最大模糊 px
  keyword: string // 可点击、点了风停的关键词
  hiddenSentence: string // 风停后显影的隐藏句
}

// 设计稿内的介绍文案（5:550）
const BODY = `Have you ever felt what happens when love and resentment become impossible to untangle, and the desolate moorland wind seems to carry both tenderness and fury at once? Then, step into a novel first published in 1847, where Gothic darkness, emotional violence, and haunting devotion have made this story endure through every storm.

Written by Emily Brontë under the pen name Ellis Bell, this fierce and unsettling masterpiece leads readers into a remote house on the Yorkshire moors.`

export const defaultParams: WutheringSkinParams = {
  title: 'Wuthering Heights',
  subtitle: '呼啸山庄',
  body: BODY,
  titleColor: '#d4cfc9',
  subtitleColor: '#afafaf',
  bodyColor: '#e5e2df',
  scrim: 0.28,
  windIntensity: 0.3,
  gustReactivity: 1,
  shake: 5,
  skew: 4,
  stretch: 0.05,
  blur: 1.6,
  keyword: 'wind',
  hiddenSentence: 'The house remembers every word.',
}

export const presets: Record<string, WutheringSkinParams> = {
  wuthering: { ...defaultParams },
  gale: { ...defaultParams, windIntensity: 0.6, shake: 8, skew: 7, blur: 2.6 },
  still: { ...defaultParams, windIntensity: 0.08, shake: 3, skew: 2, blur: 1 },
}

export const schema: ParamSchema<WutheringSkinParams> = {
  title: { type: 'text', label: '标题' },
  subtitle: { type: 'text', label: '副标题' },
  body: { type: 'text', label: '正文' },
  titleColor: { type: 'color', label: '标题色' },
  subtitleColor: { type: 'color', label: '副标题色' },
  bodyColor: { type: 'color', label: '正文色' },
  scrim: { type: 'range', label: '压暗', min: 0, max: 1, step: 0.05 },
  windIntensity: { type: 'range', label: '风强(基础)', min: 0, max: 1, step: 0.01 },
  gustReactivity: { type: 'range', label: '阵风灵敏度', min: 0, max: 3, step: 0.1 },
  shake: { type: 'range', label: '位移', min: 0, max: 16, step: 0.5 },
  skew: { type: 'range', label: '倾斜', min: 0, max: 16, step: 0.5 },
  stretch: { type: 'range', label: '拉扯', min: 0, max: 0.3, step: 0.01 },
  blur: { type: 'range', label: '模糊', min: 0, max: 6, step: 0.1 },
  keyword: { type: 'text', label: '关键词(可点)' },
  hiddenSentence: { type: 'text', label: '隐藏句' },
}
