import type { EffectModule } from '../types'
import { type AliceFallSkinParams, defaultParams, presets, schema } from './params'
import { mountAliceFallSkin } from './AliceFallSkin'

export const aliceFallSkin: EffectModule<AliceFallSkinParams> = {
  id: 'aliceFallSkin',
  title: 'Reading Skin · 爱丽丝(晃动掉落)',
  defaultParams,
  presets,
  schema,
  mount: mountAliceFallSkin,
}

export type { AliceFallSkinParams }
