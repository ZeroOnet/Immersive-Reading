import type { EffectModule } from '../types'
import { type OceanStormParams, defaultParams, presets, schema } from './params'
import { mountOceanStorm } from './OceanStorm'

export const oceanStorm: EffectModule<OceanStormParams> = {
  id: 'oceanStorm',
  title: 'Ocean Storm (海浪雷暴裂字)',
  defaultParams,
  presets,
  schema,
  mount: mountOceanStorm,
}

export type { OceanStormParams }
