import type { EffectModule } from '../types'
import { type AliceSkinParams, defaultParams, presets, schema } from './params'
import { mountAliceSkin } from './AliceSkin'

export const aliceSkin: EffectModule<AliceSkinParams> = {
  id: 'aliceSkin',
  title: 'Reading Skin · 爱丽丝梦游仙境',
  defaultParams,
  presets,
  schema,
  mount: mountAliceSkin,
}

export type { AliceSkinParams }
