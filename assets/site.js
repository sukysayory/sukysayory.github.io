const root = document.documentElement
const KEY = 'theme'
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)')

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

// 从按钮位置圆形展开新主题；不支持 View Transitions 时直接切换
function setTheme(next, button) {
  localStorage.setItem(KEY, next)

  if (!document.startViewTransition || reduceMotion.matches) {
    apply(next)
    return
  }

  const { left, top, width, height } = button.getBoundingClientRect()
  const x = left + width / 2
  const y = top + height / 2
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

  document.startViewTransition(() => apply(next)).ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)', pseudoElement: '::view-transition-new(root)' },
    )
  })
}

document.querySelectorAll('.theme-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', button)
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
