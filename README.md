# Magic Text Reading

扇贝黑客松（产品创新赛道）项目。把英文学习行为（查词 / 划线 / 生词本 / 朗读 / 敲击）
变成推进原著剧情的机关——**文字会回应用户**。

- 📄 **技术储备 / 分析**：[`docs/技术储备.md`](docs/技术储备.md)
- 📚 **参考案例库（别人已实现的真实案例）**：[`docs/参考案例库.md`](docs/参考案例库.md)
- 🧰 **调试页/成品页分离（架构约定）**：[`docs/调试与成品分离.md`](docs/调试与成品分离.md)
- 🧪 **高风险原语验证 spikes**：[`spikes/`](spikes/)（用浏览器打开 `spikes/index.html`）

## 工程骨架（effects / lab / gallery）

已搭好空骨架，正式实施时直接往 `effects/` 里填效果即可。

```bash
npm install
npm run lab     # 调试台（lil-gui 拨参数 + 帧率 + 慢放/单步 + 视口模拟 + 导出参数）→ /lab.html
npm run dev     # 成品展厅 → /
npm run build   # 只构建成品 Gallery；lab.html / lil-gui / stats 都不进生产包（已验证）
npm run typecheck
```

```
index.html / lab.html        两个入口：成品 / 调试台
src/
  effects/                   ← 唯一真源：参数化效果 + EffectModule 契约
    types.ts                 EffectModule / EffectHandle / ParamSchema
    registry.ts              效果登记表（Lab 下拉据此生成）
    textParticles/           参考效果（聚形/风吹/坍塌/引力）：index/params/TextParticles
  lab/                       ← 仅调试：schema 自动生成 lil-gui 面板 + stats + 控制
  gallery/                   ← 成品：消费同一 effect，用冻结的 preset，无调试 UI
```

**新增一个效果**：在 `effects/<id>/` 实现 `EffectModule`（含 `schema` 与 `presets`）→ push 进
`registry.ts` → Lab 自动出现它、自动生成控制面板。约定细节见
[`docs/调试与成品分离.md`](docs/调试与成品分离.md)。

### 导出参数到 Gallery（闭环）

在 Lab 调好效果 → 填**导出名称**（用于区分，如 `alice-梦境-v2`）→ 点 **💾 Export to Gallery**。
一个 dev-only Vite 中间件把当前参数写成 `src/gallery/presets/<effectId>/<名称>.json`；
Gallery 用 `import.meta.glob` **自动收录**所有导出文件，按名称各渲染一个 section（刷新即生效）。
同名覆盖、不同名并存——"命名"就是后续区分依据。

> 写盘中间件 `apply:'serve'` 仅开发期生效，`vite build` 不挂载，**不进生产包**；Gallery 只消费
> 用到的 effect 模块，仍**不含 lil-gui / stats**（已验证 dist 无 lab.html、无调试工具）。

## 跑 spikes

无需构建，直接开。要在电脑上验证麦克风/语音（需 `localhost` 安全上下文）：

```bash
cd "Magic Text Reading"
python3 -m http.server 8080      # 然后浏览器开 http://localhost:8080/spikes/
```

| spike | 验证 | 风险 |
|---|---|---|
| `spell-voice.html` | 语音识别 → 咒语逐词点亮（+TTS+兜底） | 高 |
| `knock-mic.html` | 麦克风 RMS 峰值「敲三下开门」 | 中 |
| `text-particles.html` | 文字→粒子：聚形/风吹/坍塌/引力 | 中 |

> 共享引擎层（Lenis / GSAP / Canvas / WebGL / WebAudio）可复用同目录隔壁的
> `Magical Book` 项目地基。
