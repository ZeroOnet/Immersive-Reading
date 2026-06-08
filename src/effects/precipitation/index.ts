import type { EffectModule } from '../types'
import { type PrecipitationParams, defaultParams, presets, schema } from './params'
import { mountPrecipitation } from './Precipitation'

export const precipitation: EffectModule<PrecipitationParams> = {
  id: 'precipitation',
  title: 'Precipitation (雨 / 雪粒子)',
  defaultParams,
  presets,
  schema,
  mount: mountPrecipitation,
}

export type { PrecipitationParams }
