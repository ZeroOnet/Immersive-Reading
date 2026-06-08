import { defineConfig, type Plugin } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import { writeFileSync, mkdirSync, rmSync, cpSync, readdirSync, existsSync } from 'node:fs'
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

// dev-only 插件：Lab 的「Production（定稿）」POST 到这里，把当前 effect 的整套资源
// （src/effects/<id>/ 全部文件：代码 + 图片/视频）+ 当前参数快照到 production/<id>/。
// 同一 effect 只留最新一份（先 rm 旧目录）。供门户页用作冻结成品。production 不挂载于 build。
function labSaveProduction(): Plugin {
  return {
    name: 'lab-save-production',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__lab/save-production', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('POST only')
          return
        }
        let body = ''
        req.on('data', (c) => (body += c))
        req.on('end', () => {
          try {
            const { effectId, params } = JSON.parse(body || '{}')
            const id = String(effectId || '').replace(/[^a-zA-Z0-9_]/g, '')
            if (!id) throw new Error('missing effectId')
            const srcDir = resolve(process.cwd(), 'src/effects', id)
            if (!existsSync(srcDir)) throw new Error(`effect 源目录不存在: src/effects/${id}`)
            const destDir = resolve(process.cwd(), 'production', id)
            rmSync(destDir, { recursive: true, force: true }) // 只留最新：先清旧
            mkdirSync(destDir, { recursive: true })
            cpSync(srcDir, destDir, { recursive: true }) // 整套资源（代码 + 素材）
            // 定稿参数快照（门户用此冻结参数，而非 defaultParams）
            writeFileSync(
              resolve(destDir, '__production.json'),
              JSON.stringify({ effectId: id, params, savedAt: new Date().toISOString() }, null, 2),
            )
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ ok: true, dir: `production/${id}`, files: readdirSync(destDir).length }))
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
  plugins: [labSavePreset(), labSaveProduction()],
  server: { host: true, port: 5180 },
  build: {
    target: 'es2018',
    outDir: 'dist',
    // production build 的 input：成品 Gallery + 路演门户 Portal；lab.html 不进生产包。
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        portal: fileURLToPath(new URL('./portal.html', import.meta.url)),
      },
    },
  },
}))
