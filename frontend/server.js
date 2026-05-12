import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3333
const DIST = path.join(__dirname, 'dist')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
}

const CACHE_MAX_AGE = {
  '.html': 0,
  '.css': 604800,
  '.js': 604800,
  '.woff': 2592000,
  '.woff2': 2592000,
  '.ttf': 2592000,
  '.png': 86400,
  '.jpg': 86400,
  '.svg': 86400,
  '.ico': 86400,
}

const COMMON_HEADERS = {
  'ngrok-skip-browser-warning': 'true',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
}

process.on('uncaughtException', (err) => {
  console.error('[Server] 未捕获异常:', err.message)
})

http.createServer((req, res) => {
  try {
    const urlObj = new URL(req.url, 'http://localhost')
    let urlPath = urlObj.pathname

    if (urlPath === '/') urlPath = '/index.html'

    const filePath = path.join(DIST, urlPath)
    const safePath = path.normalize(filePath)
    if (!safePath.startsWith(DIST)) {
      res.writeHead(403, COMMON_HEADERS)
      res.end('Forbidden')
      return
    }

    const ext = path.extname(safePath)

    if (MIME[ext]) {
      try {
        const content = fs.readFileSync(safePath)
        const maxAge = CACHE_MAX_AGE[ext] || 0
        const headers = {
          ...COMMON_HEADERS,
          'Content-Type': MIME[ext],
          'Cache-Control': maxAge > 0
            ? `public, max-age=${maxAge}`
            : 'no-cache, no-store, must-revalidate',
        }
        res.writeHead(200, headers)
        res.end(content)
        return
      } catch {}
    }

    const html = fs.readFileSync(path.join(DIST, 'index.html'))
    res.writeHead(200, {
      ...COMMON_HEADERS,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    })
    res.end(html)
  } catch {
    try {
      res.writeHead(500, { ...COMMON_HEADERS, 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('Internal Server Error')
    } catch {}
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log('========================================')
  console.log('  新生宿舍舍友自主选择系统 v1.0')
  console.log(`  静态服务已启动: http://0.0.0.0:${PORT}/`)
  console.log(`  本地访问:       http://127.0.0.1:${PORT}/`)
  console.log('  按 Ctrl+C 停止服务')
  console.log('========================================')
})
