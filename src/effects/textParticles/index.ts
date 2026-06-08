import type { EffectModule } from '../types'
import { type TextParticlesParams, defaultParams, presets, schema } from './params'
import { mountTextParticles } from './TextParticles'

export const textParticles: EffectModule<TextParticlesParams> = {
  id: 'textParticles',
  title: 'Text → Particles',
  defaultParams,
  presets,
  schema,
  mount: mountTextParticles,
}

export type { TextParticlesParams }
