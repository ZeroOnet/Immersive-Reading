import type { EffectModule } from '../types'
import { type OldManSkinParams, defaultParams, presets, schema } from './params'
import { mountOldManSkin } from './OldManSkin'

export const oldManSkin: EffectModule<OldManSkinParams> = {
  id: 'oldManSkin',
  title: 'Reading Skin · 老人与海',
  defaultParams,
  presets,
  schema,
  mount: mountOldManSkin,
}

export type { OldManSkinParams }
