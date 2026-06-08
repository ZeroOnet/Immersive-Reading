import type { EffectModule } from './types'
import { textParticles } from './textParticles'
import { letterRain } from './letterRain'
import { stormText } from './stormText'
import { oceanStorm } from './oceanStorm'
import { pageBurn } from './pageBurn'
import { drinkMe } from './drinkMe'
import { ringInscription } from './ringInscription'
import { precipitation } from './precipitation'
import { oldManSkin } from './oldManSkin'
import { wutheringSkin } from './wutheringSkin'
import { goneSkin } from './goneSkin'
import { aliceSkin } from './aliceSkin'
import { aliceFallSkin } from './aliceFallSkin'
import { ringSkin } from './ringSkin'
import { prideSkin } from './prideSkin'
import { veilSkin } from './veilSkin'
import { veilSmokeSkin } from './veilSmokeSkin'
import { sherlockSkin } from './sherlockSkin'

// 所有可调试的效果在此登记，Lab 据此生成下拉列表。
// 新增效果只需：在 effects/<id>/ 实现 EffectModule，然后 push 到这里。
export const effects: EffectModule<any>[] = [
  textParticles,
  letterRain,
  stormText,
  oceanStorm,
  pageBurn,
  drinkMe,
  ringInscription,
  precipitation,
  oldManSkin,
  wutheringSkin,
  goneSkin,
  aliceSkin,
  aliceFallSkin,
  ringSkin,
  prideSkin,
  veilSkin,
  veilSmokeSkin,
  sherlockSkin,
]
