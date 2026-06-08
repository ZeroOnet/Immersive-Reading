import type { ParamSchema } from '../types'

export interface RingSkinParams {
  // —— 文字 ——
  title: string
  body: string
  quote: string // 咒语（直排，未激发时为镂空描边）
  titleColor: string
  bodyColor: string
  quoteColor: string // 咒语金色（描边 + 填充同色）
  timeColor: string
  scrim: number // 背景压暗（提升文字可读性）
  // —— 咒语效果（长按念咒：先浮出字体，再填充到镂空咒语）——
  hollowAlpha: number // 未激发咒语可见度（设计 ≈ 0.12）
  fill: number // 0..1 填充进度（可拖动预览；念咒累加）
  fillRate: number // 念咒填充速度
  // —— 底部指环（暂为图片，后续替换为跟随咒语进度的视频）——
  ringScale: number // 指环图缩放
  ringGap: number // 指环距咒语底部的间距（px）；指环位置由咒语底端 + 此值决定
}

// 设计稿原文（31:377 / 31:452），原样保留
const BODY =
  'At its heart is Scarlett O’Hara— beautiful, headstrong, and unapologetically determined.  As war tears her world apart and everything she knew turns to ashes, she makes a'

export const defaultParams: RingSkinParams = {
  title: '指环王',
  body: BODY,
  quote: 'One Ring to rule them all,\nand in the darkness\nbind them.',
  titleColor: '#f3b377',
  bodyColor: '#d7c1a9',
  quoteColor: '#f3b377',
  timeColor: '#c79757',
  scrim: 0.35,
  hollowAlpha: 0.12,
  fill: 0, // 念咒前未激发，念咒累加
  fillRate: 0.5,
  ringScale: 1,
  ringGap: 42,
}

export const presets: Record<string, RingSkinParams> = {
  dormant: { ...defaultParams }, // 镂空未激发
  revealed: { ...defaultParams, fill: 1 }, // 咒语已点亮
}

export const schema: ParamSchema<RingSkinParams> = {
  title: { type: 'text', label: '标题' },
  body: { type: 'text', label: '正文' },
  quote: { type: 'text', label: '咒语' },
  titleColor: { type: 'color', label: '标题色' },
  bodyColor: { type: 'color', label: '正文色' },
  quoteColor: { type: 'color', label: '咒语金色' },
  timeColor: { type: 'color', label: '状态栏色' },
  scrim: { type: 'range', label: '压暗', min: 0, max: 1, step: 0.05 },
  hollowAlpha: { type: 'range', label: '未激发可见度', min: 0, max: 1, step: 0.01 },
  fill: { type: 'range', label: '填充进度', min: 0, max: 1, step: 0.01 },
  fillRate: { type: 'range', label: '念咒速度', min: 0.1, max: 1.5, step: 0.05 },
  ringScale: { type: 'range', label: '指环缩放', min: 0.5, max: 1.4, step: 0.02 },
  ringGap: { type: 'range', label: '指环距咒语', min: 0, max: 160, step: 1 },
}
