// ── EffectModule 契约 ──────────────────────────────────────────────
// 唯一真源。Lab 和 Gallery 都只通过这套接口消费效果，绝不各写一份。

/** 单个参数的描述。Lab 据此自动生成 lil-gui 控件；也可用来校验 / 约束 AI 输出。 */
export type ParamField =
  | { type: 'range'; label?: string; min: number; max: number; step?: number }
  | { type: 'number'; label?: string }
  | { type: 'boolean'; label?: string }
  | { type: 'text'; label?: string }
  | { type: 'color'; label?: string } // hex 字符串，如 '#b9a6ff'
  | { type: 'select'; label?: string; options: string[] }

export type ParamSchema<P> = { [K in keyof P]?: ParamField }

/** mount 后返回的句柄。Lab 用全部能力；Gallery 只用 resize/destroy。 */
export interface EffectHandle<P> {
  update(params: Partial<P>): void
  resize(): void
  reset(): void
  getParams(): P
  destroy(): void
  // —— 以下是「调试专属」可选能力，Gallery 永不调用 ——
  setTimeScale?(scale: number): void // 0 = 暂停，1 = 正常，可做慢放
  step?(): void // 暂停状态下前进一帧
  setDebug?(on: boolean): void // 显示采样点 / bounds 等辅助层
  snapshot?(): string | null // 导出当前帧 dataURL(PNG)
  demoStep?(step: number): void // 演示门户：外部按钮分步触发内部状态（如 sherlock 三步反转）
}

export interface EffectModule<P = Record<string, unknown>> {
  id: string
  title: string
  defaultParams: P
  /** 命名预设（例如按 genre：detective / fantasy / scifi）。Gallery 消费这些冻结值。 */
  presets?: Record<string, P>
  /** 驱动 Lab 控件 / 参数校验 / AI 输出约束，一份三用。 */
  schema: ParamSchema<P>
  mount(container: HTMLElement, params: P): EffectHandle<P>
}
