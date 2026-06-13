// Собирает весь сайт в один автономный HTML-файл (JS и CSS встроены).
// Такой файл открывается двойным кликом в любом браузере — без сервера и интернета.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const dist = 'dist'
const assets = join(dist, 'assets')
let html = readFileSync(join(dist, 'index.html'), 'utf8')

const files = readdirSync(assets)
const jsFile = files.find((f) => f.endsWith('.js'))
const cssFile = files.find((f) => f.endsWith('.css'))

let js = readFileSync(join(assets, jsFile), 'utf8')
let css = cssFile ? readFileSync(join(assets, cssFile), 'utf8') : ''

// Защита от случайного закрытия тега внутри строковых литералов
js = js.replaceAll('</script>', '<\\/script>')

// Важно: используем функции-заменители, иначе спецпоследовательности $&, $', $1
// внутри минифицированного JS/CSS будут интерпретированы String.replace и сломают файл.
// Встраиваем CSS вместо <link ... .css>
html = html.replace(/<link[^>]*rel="stylesheet"[^>]*>/i, () => `<style>${css}</style>`)
// Встраиваем JS вместо <script ... src=....js>
html = html.replace(/<script[^>]*src="[^"]*\.js"[^>]*><\/script>/i, () => `<script type="module">${js}</script>`)

const out = 'dist/modul-trener.html'
writeFileSync(out, html)
console.log(`Готово: ${out} (${(html.length / 1024 / 1024).toFixed(2)} МБ)`)
