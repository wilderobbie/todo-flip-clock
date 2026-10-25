// 将 assets/icons/ui/*.svg 打包为同文档 SVG Sprite 并注入 index.html 的 <!-- ICON_SPRITE --> 标记处
// 解决 file:// 协议下 fetch 本地 SVG 被安全策略拦截导致图标全部不显示的问题
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const DIR = path.join(ROOT, 'assets', 'icons', 'ui')
const INDEX = path.join(ROOT, 'index.html')

const names = fs.readdirSync(DIR).filter(f => f.endsWith('.svg')).map(f => f.replace('.svg', ''))
let symbols = ''
for (const n of names) {
  const svg = fs.readFileSync(path.join(DIR, n + '.svg'), 'utf8')
  const vb = (svg.match(/viewBox="([^"]+)"/) || [])[1] || '0 0 24 24'
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '').trim()
  symbols += `  <symbol id="i-${n}" viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</symbol>\n`
}

const sprite = `<!-- 图标 Sprite：由 tools/build_sprite.mjs 生成，请勿手改 -->\n<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">\n${symbols}</svg>`

let html = fs.readFileSync(INDEX, 'utf8')
// 移除旧 Sprite（可重复执行），再插入新块
html = html.replace(/<!-- 图标 Sprite[\s\S]*?<\/svg>\n?/g, '')
if (!html.includes('<!-- ICON_SPRITE -->')) {
  html = html.replace('<body data-theme="light">', '<body data-theme="light">\n  <!-- ICON_SPRITE -->')
}
html = html.replace('<!-- ICON_SPRITE -->', () => sprite)
fs.writeFileSync(INDEX, html)
console.log('sprite injected:', names.length, 'icons')
