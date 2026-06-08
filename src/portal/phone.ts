// 全局手机：整页只此一台，scroll-snap 切屏时换里面的 effect。
// 单台 = 任一时刻只挂 1 个 effect = 只有 1 个声音（满足「只视口中心出声」）。
import { effects } from '../effects/registry'
import type { EffectHandle, EffectModule } from '../effects/types'

const byId = new Map(effects.map((e) => [e.id, e]))

export interface GlobalPhone {
  el: HTMLElement
  show(effectId: string | null): void
  resize(): void
}

export function createGlobalPhone(): GlobalPhone {
  const frame = document.createElement('div')
  frame.className = 'portal-phone'
  // 设备边框 + 动态岛
  const island = document.createElement('div')
  island.className = 'portal-phone-island'
  const stage = document.createElement('div')
  stage.className = 'portal-phone-stage'
  frame.append(stage, island)

  let curId: string | null = null
  let handle: EffectHandle<unknown> | null = null
  let swapTimer = 0

  function destroyEffect() {
    handle?.destroy()
    handle = null
    stage.innerHTML = ''
  }
  function mountEffect(id: string) {
    const mod = byId.get(id) as EffectModule<unknown> | undefined
    if (!mod) return
    handle = mod.mount(stage, structuredClone(mod.defaultParams))
  }

  function show(effectId: string | null) {
    if (effectId === curId) return
    curId = effectId
    frame.classList.add('phone-fade') // 先淡出当前内容
    window.clearTimeout(swapTimer)
    swapTimer = window.setTimeout(() => {
      destroyEffect()
      if (effectId) mountEffect(effectId)
      frame.classList.toggle('present', !!effectId) // 有 effect 才显形
      frame.classList.remove('phone-fade') // 淡入新内容
    }, 200)
  }

  return {
    el: frame,
    show,
    resize: () => handle?.resize(),
  }
}
