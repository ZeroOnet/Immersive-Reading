import type { EffectModule } from '../types'
import { type VeilSmokeSkinParams, defaultParams, presets, schema } from './params'
import { mountVeilSmokeSkin } from './VeilSmokeSkin'

export const veilSmokeSkin: EffectModule<VeilSmokeSkinParams> = {
  id: 'veilSmokeSkin',
  title: 'Reading Skin · 面纱·烟雾',
  defaultParams,
  presets,
  schema,
  mount: mountVeilSmokeSkin,
}

export type { VeilSmokeSkinParams }
