import type { EffectModule } from '../types'
import { type StormTextParams, defaultParams, presets, schema } from './params'
import { mountStormText } from './StormText'

export const stormText: EffectModule<StormTextParams> = {
  id: 'stormText',
  title: 'Storm Text (荒原风暴正文)',
  defaultParams,
  presets,
  schema,
  mount: mountStormText,
}

export type { StormTextParams }
