import type { EffectModule } from '../types'
import { type RingInscriptionParams, defaultParams, presets, schema } from './params'
import { mountRingInscription } from './RingInscription'

export const ringInscription: EffectModule<RingInscriptionParams> = {
  id: 'ringInscription',
  title: 'Ring Inscription (召唤显现金铭)',
  defaultParams,
  presets,
  schema,
  mount: mountRingInscription,
}

export type { RingInscriptionParams }
