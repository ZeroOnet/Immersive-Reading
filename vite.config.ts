import { defineConfig, type Plugin } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

// dev-only 插件：Lab 的「Export to Gallery」POST 到这里，把参数写成
// src/gallery/presets/<effectId>/<name>.json。production 不挂载（apply:'serve'）。
function labSavePreset(): Plugin {
  return {
    name: 'lab-save-preset',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__lab/save-preset', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('POST only')
          return
        }
        let body = ''
        req.on('data', (c) => (body += c))
        req.on('end', () => {
          try {
            const { effectId, name, params } = JSON.parse(body || '{}')
            const id = String(effectId || '').replace(/[^a-zA-Z0-9_]/g, '')
            const safe = String(name || '').trim().replace(/[^\w一-龥-]/g, '_') || 'preset'
            if (!id) throw new Error('missing effectId')
            const rel = `src/gallery/presets/${id}/${safe}.json`
            mkdirSync(resolve(process.cwd(), 'src/gallery/presets', id), { recursive: true })
            writeFileSync(
              resolve(process.cwd(), rel),
              JSON.stringify(
                { effectId: id, name: String(name || safe), params, savedAt: new Date().toISOString() },
                null,
                2,
              ),
            )
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ ok: true, file: rel }))
          } catch (e) {
            res.statusCode = 400
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: String((e as Error).message || e) }))
          }
        })
      })
    },
  }
}

export default defineConfig(() => ({
  base: './',
  plugins: [labSavePreset()],
  server: { host: true, port: 5180 },
  build: {
    target: 'es2018',
    outDir: 'dist',
    // production build 的 input 只列 index.html（成品 Gallery）；lab.html 不进生产包。
    rollupOptions: { input: { main: fileURLToPath(new URL('./index.html', import.meta.url)) } },
  },
}))
