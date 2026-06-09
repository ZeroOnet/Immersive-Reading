import './lab.css'
import GUI from 'lil-gui'
import Stats from 'stats.js'
import { effects } from '../effects/registry'
import type { EffectModule, EffectHandle, ParamField } from '../effects/types'

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T

const stage = $('stage')
const guiHost = $('gui')
const toast = $('toast')

// ── 帧率 ──
const stats = new Stats()
stats.showPanel(0)
stats.dom.style.position = 'static'
$('stats').appendChild(stats.dom)
function statsLoop() {
  requestAnimationFrame(statsLoop)
  stats.begin()
  stats.end()
}
statsLoop()

// ── 状态 ──
let current: { mod: EffectModule<any>; handle: EffectHandle<any>; params: any } | null = null
let gui: GUI | null = null
let paused = false
let slow = 1

// 已生成 production 的 effect（production/<id>/__production.json 存在）→ Lab 标题加 ✅
// import.meta.glob 静态探测；dev 下点 Production 写入新文件会触发 HMR，✅ 自动出现
const PRODUCED_IDS = new Set(
  Object.keys(import.meta.glob('/production/*/__production.json'))
    .map((p) => /\/production\/([^/]+)\//.exec(p)?.[1] ?? '')
    .filter(Boolean),
)
const withMark = (id: string, title: string) => (PRODUCED_IDS.has(id) ? `${title} ✅` : title)

function showToast(msg: string) {
  toast.textContent = msg
  toast.classList.add('show')
  window.setTimeout(() => toast.classList.remove('show'), 1400)
}

function applyTime() {
  current?.handle.setTimeScale?.(paused ? 0 : slow)
}

// schema 自动生成 lil-gui 面板
function buildGUI() {
  gui?.destroy()
  if (!current) return
  const { mod, handle, params } = current
  gui = new GUI({ container: guiHost, title: withMark(mod.id, mod.title) })

  if (mod.presets) {
    const names = ['(default)', ...Object.keys(mod.presets)]
    const sel = { preset: '(default)' }
    gui
      .add(sel, 'preset', names)
      .name('预设')
      .onChange((name: string) => {
        const src = name === '(default)' ? mod.defaultParams : mod.presets![name]
        Object.assign(params, structuredClone(src))
        handle.update(params)
        gui!.controllersRecursive().forEach((c) => c.updateDisplay())
      })
  }

  for (const key of Object.keys(mod.schema)) {
    const f = mod.schema[key] as ParamField
    let c
    switch (f.type) {
      case 'range':
        c = gui.add(params, key, f.min, f.max, f.step)
        break
      case 'select':
        c = gui.add(params, key, f.options)
        break
      case 'color':
        c = gui.addColor(params, key)
        break
      default:
        c = gui.add(params, key) // number / boolean / text
    }
    if (f.label) c.name(f.label)
    c.onChange((v: unknown) => handle.update({ [key]: v }))
  }
}

function load(mod: EffectModule<any>) {
  current?.handle.destroy()
  const params = structuredClone(mod.defaultParams)
  const handle = mod.mount(stage, params)
  current = { mod, handle, params }
  buildGUI()
  applyTime()
}

// ── 效果选择 ──
const select = $<HTMLSelectElement>('effect-select')
effects.forEach((e) => {
  const o = document.createElement('option')
  o.value = e.id
  o.textContent = withMark(e.id, e.title)
  select.appendChild(o)
})
select.onchange = () => {
  const mod = effects.find((e) => e.id === select.value)
  if (mod) load(mod)
}

// ── 时间 / 调试控制 ──
const pauseBtn = $('btn-pause')
pauseBtn.onclick = () => {
  paused = !paused
  pauseBtn.textContent = paused ? '▶ Play' : '⏸ Pause'
  applyTime()
}
$('btn-step').onclick = () => current?.handle.step?.()
$('btn-reset').onclick = () => current?.handle.reset()

const slowInput = $<HTMLInputElement>('slow')
slowInput.oninput = () => {
  slow = parseFloat(slowInput.value)
  $('slow-val').textContent = slow.toFixed(1) + 'x'
  applyTime()
}
$<HTMLInputElement>('debug').onchange = (e) =>
  current?.handle.setDebug?.((e.target as HTMLInputElement).checked)

// ── 视口模拟（成品是移动端优先；默认 Phone 375×794 = 设计稿尺寸，还原最准）──
const vp = $<HTMLSelectElement>('viewport')
function applyViewport() {
  if (vp.value === 'full') {
    stage.style.width = ''
    stage.style.height = ''
    stage.classList.remove('framed')
  } else {
    const [w, h] = vp.value.split('x')
    stage.style.width = w + 'px'
    stage.style.height = h + 'px'
    stage.classList.add('framed')
  }
  current?.handle.resize()
}
vp.onchange = applyViewport

// ── 导出 ──
$('btn-copy').onclick = async () => {
  if (!current) return
  const json = JSON.stringify(current.handle.getParams(), null, 2)
  try {
    await navigator.clipboard.writeText(json)
    showToast('已复制参数 JSON → 粘进 Gallery 的 preset')
  } catch {
    showToast('复制失败，已打到控制台')
    console.log(json)
  }
}
$('btn-shot').onclick = () => {
  const url = current?.handle.snapshot?.()
  if (!url) return
  const a = document.createElement('a')
  a.href = url
  a.download = current!.mod.id + '.png'
  a.click()
}

// Export to Gallery：把当前参数写进 src/gallery/presets/<effectId>/<name>.json
const nameInput = $<HTMLInputElement>('preset-name')
$('btn-export').onclick = async () => {
  if (!current) return
  const name = nameInput.value.trim() || `${current.mod.id}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}`
  try {
    const res = await fetch('/__lab/save-preset', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ effectId: current.mod.id, name, params: current.handle.getParams() }),
    })
    const j = await res.json()
    if (j.ok) {
      showToast(`✅ 已保存 → ${j.file}`)
      nameInput.value = ''
    } else {
      showToast(`保存失败：${j.error}`)
    }
  } catch (err) {
    showToast(`保存失败：${String(err)}`)
  }
}

// Production：把当前 effect 整套资源 + 调好的参数定稿到 production/<effectId>/（每 effect 只留最新）
$('btn-production').onclick = async () => {
  if (!current) return
  try {
    const res = await fetch('/__lab/save-production', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ effectId: current.mod.id, params: current.handle.getParams() }),
    })
    const j = await res.json()
    if (j.ok) showToast(`🏁 已定稿 → ${j.dir}（${j.files} 个文件）`)
    else showToast(`定稿失败：${j.error}`)
  } catch (err) {
    showToast(`定稿失败：${String(err)}`)
  }
}

// boot
load(effects[0])
applyViewport() // 启动即套用默认视口（Phone 375×794）
