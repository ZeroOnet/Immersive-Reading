import type { ParamSchema } from '../types'

export interface PrideSkinParams {
  // 标题
  titleEn: string
  titleZh: string
  // 正文
  body: string
  bodyColor: string
  // 贴纸文案：lie = 表面甜言、truth = 真实扎心
  lieEn: string
  lieZh: string
  truthEn: string
  truthZh: string
  // 揭开进度（0..1，Lab 可直接拖动预览；运行时由指针/物理驱动）
  peel: number
  // 物理：弹簧回弹（自然垂落）
  stiffness: number // 回正力度（pendulum-like restoring）
  damping: number // 阻尼（越小越"晃"）
  releaseThreshold: number // ≥ 此值松手才视为揭开完成；否则垂落
  // 视觉
  scrim: number // 顶部压暗（提升标题对比度）
  timeColor: string
}

// 设计稿原文：Darcy 第一次求婚时口是心非的版本（body）+ 心里的实话（truth 贴纸）
const BODY =
  'After a silence of several minutes, he came towards her in an agitated manner, and thus began:\n\n' +
  '“In vain have I struggled. It will not do. My feelings will not be repressed. You must allow me to tell you how ardently I admire and love you.”\n\n' +
  'Elizabeth’s astonishment was beyond expression. She stared, coloured, doubted, and was silent.'

export const defaultParams: PrideSkinParams = {
  titleEn: 'Pride and Prejudice',
  titleZh: '傲慢与偏见',
  body: BODY,
  bodyColor: '#585054',
  lieEn: 'Ardently I admire and love you.',
  lieZh: '（我由衷地敬佩你、爱你）',
  truthEn: 'I think you are beneath me.',
  truthZh: '（我觉得你配不上我）',
  peel: 0,
  stiffness: 32,
  damping: 7.5,
  releaseThreshold: 0.55,
  scrim: 0.2,
  timeColor: '#524e41',
}

export const presets: Record<string, PrideSkinParams> = {
  covered: { ...defaultParams }, // 贴纸覆盖（甜言）
  revealed: { ...defaultParams, peel: 1 }, // 贴纸揭开（实话）
}

export const schema: ParamSchema<PrideSkinParams> = {
  titleEn: { type: 'text', label: '英文标题' },
  titleZh: { type: 'text', label: '中文标题' },
  body: { type: 'text', label: '正文' },
  bodyColor: { type: 'color', label: '正文色' },
  lieEn: { type: 'text', label: '贴纸·甜言 EN' },
  lieZh: { type: 'text', label: '贴纸·甜言 ZH' },
  truthEn: { type: 'text', label: '真话 EN' },
  truthZh: { type: 'text', label: '真话 ZH' },
  peel: { type: 'range', label: '揭开进度', min: 0, max: 1, step: 0.01 },
  stiffness: { type: 'range', label: '回弹刚度', min: 10, max: 60, step: 1 },
  damping: { type: 'range', label: '阻尼', min: 2, max: 18, step: 0.5 },
  releaseThreshold: { type: 'range', label: '揭开阈值', min: 0.3, max: 0.95, step: 0.01 },
  scrim: { type: 'range', label: '压暗', min: 0, max: 0.6, step: 0.02 },
  timeColor: { type: 'color', label: '状态栏色' },
}
