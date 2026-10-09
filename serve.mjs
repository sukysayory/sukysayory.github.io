import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'

const ROOT = resolve('dist')
const PORT = Number(process.env.PORT) || 4321
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  let file = resolve(ROOT, `.${decodeURIComponent(url.pathname)}`)
  try {
    if (!file.startsWith(ROOT)) throw new Error('out of root')
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    try {
      const html = await readFile(join(file, 'index.html'))
      res.writeHead(200, { 'content-type': TYPES['.html'] })
      res.end(html)
    } catch {
      res.writeHead(404, { 'content-type': TYPES['.html'] })
      res.end('<h1>404</h1>')
    }
  }
}).listen(PORT, () => console.log(`http://localhost:${PORT}`))
