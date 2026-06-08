import type { EffectModule } from '../types'
import { type LetterRainParams, defaultParams, presets, schema } from './params'
import { mountLetterRain } from './LetterRain'

export const letterRain: EffectModule<LetterRainParams> = {
  id: 'letterRain',
  title: 'Letter Rain (体感物理)',
  defaultParams,
  presets,
  schema,
  mount: mountLetterRain,
}

export type { LetterRainParams }
