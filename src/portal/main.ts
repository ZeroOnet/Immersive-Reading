import './portal.css'

// 门户固定 1470 宽设计。整页按 min(视口宽/1470, 视口高/首屏高) 等比缩放，
// 保证首屏(1470×956)在当前窗口内宽高都完整显示（不被裁切），并水平居中。
// transform:scale 不改变布局高度，需用 JS 把外层 root 高度设为 缩放后总高度，
// 页面纵向滚动才正确（首屏 → 尾屏 → 横排屏）。
const STAGE_W = 1470
const HERO_H = 956
const root = document.getElementById('portal-root')!
const scale = document.getElementById('portal-scale')!

function fit() {
  const s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / HERO_H)
  scale.style.transform = `scale(${s})`
  scale.style.left = `${(window.innerWidth - STAGE_W * s) / 2}px` // 水平居中
  root.style.height = `${scale.offsetHeight * s}px`
}

fit()
window.addEventListener('resize', fit)

// 字体/卡片图加载完成后内容高度变化 → 重新测量
if (document.fonts?.ready) void document.fonts.ready.then(fit)
new ResizeObserver(fit).observe(scale)
