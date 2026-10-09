const root = document.documentElement
const KEY = 'theme'

function apply(theme) {
  root.dataset.theme = theme
  const label = theme === 'dark' ? '切换到浅色' : '切换到深色'
  document.querySelectorAll('.theme-toggle').forEach((b) => {
    b.setAttribute('aria-label', label)
    b.setAttribute('title', label)
  })
}

const stored = localStorage.getItem(KEY)
apply(stored || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))

document.querySelectorAll('.theme-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(KEY, next)
    apply(next)
  })
})

const tocLinks = [...document.querySelectorAll('.toc a[href^="#"]')]
if (tocLinks.length) {
  const targets = tocLinks
    .map((a) => document.getElementById(a.getAttribute('href').slice(1)))
    .filter(Boolean)

  const mark = (id) =>
    tocLinks.forEach((a) =>
      a.classList.toggle('active', a.getAttribute('href') === `#${id}`),
    )

  const visible = new Set()
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target)
        else visible.delete(entry.target)
      }
      const top = targets.find((t) => visible.has(t))
      if (top) mark(top.id)
    },
    { rootMargin: '-5.5rem 0px -60% 0px', threshold: 0 },
  )

  targets.forEach((t) => observer.observe(t))
  mark(targets[0]?.id)
}
