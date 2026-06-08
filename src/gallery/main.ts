import './gallery.css'
import { effects } from '../effects/registry'
import type { EffectModule } from '../effects/types'

// 自动收录 Lab 导出的参数文件（src/gallery/presets/<effectId>/<name>.json）。
// 注意：没有 import lil-gui / stats —— 调试工具只活在 lab/，不进成品包。
type SavedPreset = { effectId: string; name: string; params: Record<string, unknown>; savedAt?: string }
const saved = import.meta.glob<{ default: SavedPreset }>('./presets/**/*.json', { eager: true })

const byId = new Map(effects.map((e) => [e.id, e]))

interface Section {
  title: string
  meta: string // 来源效果名 · 导出时间，路演时区分多个版本
  mod: EffectModule<any>
  params: any
}

function fmtTime(iso?: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

const sections: Section[] = []
for (const path in saved) {
  const d = saved[path].default
  const mod = byId.get(d.effectId)
  if (mod) {
    const when = fmtTime(d.savedAt)
    sections.push({ title: d.name, meta: when ? `${mod.title} · ${when}` : mod.title, mod, params: d.params })
  }
}

// 还没有任何导出时，放两个占位 demo，避免空白页
if (sections.length === 0) {
  const tp = byId.get('textParticles')!
  sections.push({ title: 'Sentence as Spell', meta: `${tp.title} · 示例`, mod: tp, params: tp.presets!.fantasy })
  sections.push({ title: 'Text as Gravity', meta: `${tp.title} · 示例`, mod: tp, params: tp.presets!.scifi })
}

const app = document.getElementById('app')!
for (const s of sections) {
  const section = document.createElement('section')
  section.className = 'scene'

  const copy = document.createElement('div')
  copy.className = 'copy'
  const h2 = document.createElement('h2')
  h2.textContent = s.title // textContent，避免名称里的字符被当 HTML
  const meta = document.createElement('p')
  meta.className = 'meta'
  meta.textContent = s.meta
  copy.append(h2, meta)

  const stageEl = document.createElement('div')
  stageEl.className = 'stage'

  section.append(copy, stageEl)
  app.appendChild(section)

  s.mod.mount(stageEl, structuredClone(s.params)) // 冻结参数，无 GUI、无 stats
}
