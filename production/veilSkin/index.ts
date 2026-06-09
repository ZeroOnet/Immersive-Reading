import type { EffectModule } from '../types'
import { type VeilSkinParams, defaultParams, presets, schema } from './params'
import { mountVeilSkin } from './VeilSkin'

export const veilSkin: EffectModule<VeilSkinParams> = {
  id: 'veilSkin',
  title: 'Reading Skin · 面纱',
  defaultParams,
  presets,
  schema,
  mount: mountVeilSkin,
}

export type { VeilSkinParams }
