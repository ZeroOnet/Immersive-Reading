import type { EffectModule } from '../types'
import { type PageBurnParams, defaultParams, presets, schema } from './params'
import { mountPageBurn } from './PageBurn'

export const pageBurn: EffectModule<PageBurnParams> = {
  id: 'pageBurn',
  title: 'Page Burn (战火烧页焦字)',
  defaultParams,
  presets,
  schema,
  mount: mountPageBurn,
}

export type { PageBurnParams }
