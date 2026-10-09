import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import matter from 'gray-matter'
import { marked } from 'marked'
import { site } from './config.mjs'

const OUT = 'dist'
const YEAR = new Date().getFullYear()

marked.setOptions({ gfm: true })

const esc = (s = '') =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const headingId = (text) =>
  text
    .replace(/<[^>]+>/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-') || 'section'

const plainText = (html) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z#0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

// 中日韩按字计，拉丁按词计，约 300 字/分钟
const readingTime = (text) => {
  const cjk = (text.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length
  const words = (text.replace(/[\u3400-\u9fff\uf900-\ufaff]/g, ' ').match(/[A-Za-z0-9'’-]+/g) || []).length
  return Math.max(1, Math.round((cjk + words) / 300))
}

// gray-matter 按 UTC 解析时间戳，统一用 UTC 取值避免日期串天
const fmtDate = (d) => {
  const date = d instanceof Date ? d : new Date(d)
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

const posts = readdirSync('content/posts')
  .filter((f) => f.endsWith('.md'))
  .map((file) => {
    const { data, content } = matter(readFileSync(join('content/posts', file), 'utf8'))
    const slug = file.replace(/\.md$/, '')
    const date = data.date ? new Date(data.date) : new Date(0)
    const html = marked
      .parse(content)
      .replace(/<h([2-4])>([\s\S]*?)<\/h\1>/g, (_, level, inner) => {
        const id = headingId(inner)
        return `<h${level} id="${id}">${inner}<a class="heading-anchor" href="#${id}" aria-label="本节链接">#</a></h${level}>`
      })
    const body = html.replace(/<a class="heading-anchor"[\s\S]*?<\/a>/g, '')
    const text = plainText(body)
    const toc = [...body.matchAll(/<h([2-4]) id="([^"]+)">([\s\S]*?)<\/h\1>/g)].map((m) => ({
      level: Number(m[1]),
      id: m[2],
      text: plainText(m[3]),
    }))
    return {
      slug,
      url: `/posts/${slug}/`,
      title: data.title || slug,
      date,
      tags: data.tags || [],
      summary: data.summary || text.slice(0, 110),
      minutes: readingTime(text),
      html,
      toc,
    }
  })
  .sort((a, b) => b.date - a.date)

function layout({ body, title, description, active, toc }) {
  const page = title ? `${title} · ${site.title}` : site.title
  const nav = site.nav
    .map(
      (item) =>
        `<a href="${item.href}"${item.href === active ? ' aria-current="page"' : ''}>${esc(item.label)}</a>`,
    )
    .join('\n        ')
  const toggle = `<button class="theme-toggle" type="button">
      <svg class="icon-moon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>
      <svg class="icon-sun" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"/></svg>
    </button>`
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page)}</title>
<meta name="description" content="${esc(description || site.description)}">
<meta name="color-scheme" content="light dark">
<link rel="canonical" href="${site.url}${active || '/'}">
<meta property="og:title" content="${esc(page)}">
<meta property="og:description" content="${esc(description || site.description)}">
<meta property="og:type" content="website">
<script>try{document.documentElement.dataset.theme=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}</script>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%232d6a5f'/><text x='50' y='70' font-size='60' font-family='system-ui' font-weight='600' text-anchor='middle' fill='white'>S</text></svg>">
<link rel="stylesheet" href="/assets/styles.css">
</head>
<body>
<a class="skip-link" href="#main">跳到正文</a>
<header class="site-header">
  <div class="shell">
    <a class="brand" href="/">${site.avatar ? `<img src="${site.avatar}" alt="">` : ''}${esc(site.title)}</a>
    <nav class="site-nav">
        ${nav}
        ${toggle}
    </nav>
  </div>
</header>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="shell">
    <span>&copy; ${YEAR} ${esc(site.author)}</span>
    <span>${site.social.map((s) => `<a href="${s.href}">${esc(s.label)}</a>`).join(' · ')}</span>
  </div>
</footer>
<script src="/assets/site.js" defer></script>
</body>
</html>
`
}

const metaLine = (post, { date = true } = {}) =>
  `<p class="post-meta">${
    date ? `<time datetime="${post.date.toISOString()}">${fmtDate(post.date)}</time> · ` : ''
  }${post.minutes} 分钟阅读${
    post.tags.length
      ? ` · <span class="tags">${post.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</span>`
      : ''
  }</p>`

const write = (dir, html) => {
  mkdirSync(join(OUT, dir), { recursive: true })
  writeFileSync(join(OUT, dir, 'index.html'), html)
}

// 首页
write(
  '',
  layout({
    active: '/',
    body: `<section class="hero"><div class="shell"><h1>${esc(site.title)}</h1><p>${esc(site.tagline)}</p></div></section>
<div class="shell"><ul class="post-list">
${
  posts
    .map(
      (p) => `<li><a href="${p.url}"><span class="post-date">${fmtDate(p.date)}</span><div><h2 class="post-title">${esc(p.title)}</h2><p class="post-excerpt">${esc(p.summary)}…</p>${metaLine(p, { date: false })}</div></a></li>`,
    )
    .join('\n')
}
</ul></div>`,
  }),
)

// 文章页
for (const [i, post] of posts.entries()) {
  const older = posts[i + 1]
  const newer = posts[i - 1]
  const nav = `<nav class="post-nav">
${newer ? `<a class="prev" href="${newer.url}"><span>上一篇</span><strong>${esc(newer.title)}</strong></a>` : '<span></span>'}
${older ? `<a class="next" href="${older.url}"><span>下一篇</span><strong>${esc(older.title)}</strong></a>` : ''}
</nav>`
  const tocHtml = post.toc.length
    ? `<aside class="toc"><p>目录</p><ul>${post.toc
        .map((t) => `<li class="toc-h${t.level}"><a href="#${t.id}">${esc(t.text)}</a></li>`)
        .join('')}</ul></aside>`
    : ''
  write(
    `posts/${post.slug}`,
    layout({
      active: post.url,
      title: post.title,
      description: post.summary,
      body: `<div class="shell"><div class="article-layout">
  <article class="article">
    <header class="article-head"><h1>${esc(post.title)}</h1>${metaLine(post)}</header>
    <hr class="divider">
    <div class="prose">${post.html}</div>
    ${nav}
  </article>
  ${tocHtml}
</div></div>`,
    }),
  )
}

// 归档
const byYear = posts.reduce((acc, p) => {
  const y = p.date.getUTCFullYear()
  ;(acc[y] ||= []).push(p)
  return acc
}, {})
write(
  'archive',
  layout({
    active: '/archive/',
    title: '归档',
    body: `<div class="shell"><h1 class="page-title">归档</h1>
${
  Object.entries(byYear)
    .map(
      ([year, list]) => `<h2 class="archive-year">${year}</h2><ul class="archive-list">${list
        .map(
          (p) =>
            `<li><a href="${p.url}"><time>${fmtDate(p.date)}</time>${esc(p.title)}</a></li>`,
        )
        .join('')}</ul>`,
    )
    .join('\n')
}
${posts.length ? '' : '<p class="empty">还没有文章。</p>'}</div>`,
  }),
)

// 关于
const about = matter(readFileSync('content/about.md', 'utf8'))
write(
  'about',
  layout({
    active: '/about/',
    title: about.data.title || '关于',
    body: `<div class="shell"><div class="article-layout"><article class="article"><header class="article-head"><h1>${esc(about.data.title || '关于')}</h1></header><hr class="divider"><div class="prose">${marked.parse(about.content)}</div></article></div></div>`,
  }),
)

// 资源与站点地图
mkdirSync(`${OUT}/assets`, { recursive: true })
cpSync('assets/styles.css', `${OUT}/assets/styles.css`)
cpSync('assets/site.js', `${OUT}/assets/site.js`)
writeFileSync(
  `${OUT}/sitemap.xml`,
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...posts.map((p) => p.url), '/archive/', '/about/']
    .map((u) => `  <url><loc>${site.url}${u}</loc></url>`)
    .join('\n')}
</urlset>
`,
)
writeFileSync(`${OUT}/robots.txt`, `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`)

rmSync(`${OUT}/.gitkeep`, { force: true })
console.log(`生成 ${posts.length} 篇文章 -> ${OUT}/`)
