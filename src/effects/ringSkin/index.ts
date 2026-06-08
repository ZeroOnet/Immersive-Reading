import type { EffectModule } from '../types'
import { type RingSkinParams, defaultParams, presets, schema } from './params'
import { mountRingSkin } from './RingSkin'

export const ringSkin: EffectModule<RingSkinParams> = {
  id: 'ringSkin',
  title: 'Reading Skin · 指环王',
  defaultParams,
  presets,
  schema,
  mount: mountRingSkin,
}

export type { RingSkinParams }
