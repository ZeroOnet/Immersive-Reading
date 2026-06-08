import type { EffectModule } from '../types'
import { type WutheringSkinParams, defaultParams, presets, schema } from './params'
import { mountWutheringSkin } from './WutheringSkin'

export const wutheringSkin: EffectModule<WutheringSkinParams> = {
  id: 'wutheringSkin',
  title: 'Reading Skin · 呼啸山庄',
  defaultParams,
  presets,
  schema,
  mount: mountWutheringSkin,
}

export type { WutheringSkinParams }
