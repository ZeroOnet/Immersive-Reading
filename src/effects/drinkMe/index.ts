import type { EffectModule } from '../types'
import { type DrinkMeParams, defaultParams, presets, schema } from './params'
import { mountDrinkMe } from './DrinkMe'

export const drinkMe: EffectModule<DrinkMeParams> = {
  id: 'drinkMe',
  title: 'Drink Me (爱丽丝忽大忽小)',
  defaultParams,
  presets,
  schema,
  mount: mountDrinkMe,
}

export type { DrinkMeParams }
