import type { EffectModule } from '../types'
import { type GoneSkinParams, defaultParams, presets, schema } from './params'
import { mountGoneSkin } from './GoneSkin'

export const goneSkin: EffectModule<GoneSkinParams> = {
  id: 'goneSkin',
  title: 'Reading Skin · 飘',
  defaultParams,
  presets,
  schema,
  mount: mountGoneSkin,
}

export type { GoneSkinParams }
