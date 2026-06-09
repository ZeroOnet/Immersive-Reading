import type { EffectModule } from '../types'
import { type PrideSkinParams, defaultParams, presets, schema } from './params'
import { mountPrideSkin } from './PrideSkin'

export const prideSkin: EffectModule<PrideSkinParams> = {
  id: 'prideSkin',
  title: 'Reading Skin · 傲慢与偏见',
  defaultParams,
  presets,
  schema,
  mount: mountPrideSkin,
}

export type { PrideSkinParams }
