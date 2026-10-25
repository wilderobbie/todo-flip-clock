// 将应用 Logo 转为 data URI 内嵌 index.html
// 规避 file:// 页面下 CSP img-src 'self' 对 file:// 子资源匹配不可靠导致的裂图问题
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const PNG = path.join(ROOT, 'assets', 'icons', 'icon_48.png')
const INDEX = path.join(ROOT, 'index.html')

const b64 = fs.readFileSync(PNG).toString('base64')
const uri = `data:image/png;base64,${b64}`

let html = fs.readFileSync(INDEX, 'utf8')
const before = html
html = html.replaceAll('src="assets/icons/icon_48.png"', `src="${uri}"`)
if (html !== before) {
  fs.writeFileSync(INDEX, html)
  console.log('logo embedded as data URI')
} else {
  console.log('no logo src to replace (already embedded?)')
}
