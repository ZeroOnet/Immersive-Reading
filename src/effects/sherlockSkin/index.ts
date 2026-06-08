import type { EffectModule } from '../types'
import { type SherlockSkinParams, defaultParams, presets, schema } from './params'
import { mountSherlockSkin } from './SherlockSkin'

export const sherlockSkin: EffectModule<SherlockSkinParams> = {
  id: 'sherlockSkin',
  title: 'Reading Skin · 血字的研究',
  defaultParams,
  presets,
  schema,
  mount: mountSherlockSkin,
}

export type { SherlockSkinParams }
