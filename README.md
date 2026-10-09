# sukysayory 博客

一个零框架的静态博客：Markdown 写文章，`node build.mjs` 生成纯静态页面，直接把 `dist/` 传到 GitHub Pages 即可。

## 常用命令

```bash
npm install     # 装一次依赖
npm run dev     # 构建并在 http://localhost:4321 预览
npm run build   # 只构建，产物在 dist/
```

## 写一篇新文章

在 `content/posts/` 下新建 `my-note.md`（文件名即网址 `/posts/my-note/`）：

```markdown
---
title: 我的标题
date: 2026-10-09 20:00:00
tags: [随笔]
summary: 可选。不填则自动取正文开头。
---

正文用 Markdown 写。
```

然后 `npm run build`。首页列表、归档、目录、上下篇都会自动更新。

## 改站点信息

全部在 `config.mjs`：站名、简介、署名、域名、导航、社交链接。标了 `TODO` 的是当前占位内容。

## 部署到 GitHub Pages

`dist/` 里已是最终产物。仓库 `sukysayory.github.io` 的 `master` 分支就是 Pages 分支，所以：

```bash
npm run build
# 用 dist/ 的内容覆盖仓库工作区后提交推送
```

注意：站点里用的是 `/posts/xxx/` 这样的根绝对路径，仅在项目名为 `sukysayory.github.io`（即部署在根域名）时无需改动。若换到子路径，需要给 `build.mjs` 里的链接加前缀。

## 目录

```
config.mjs          站点信息
content/posts/*.md  文章
content/about.md    关于页
assets/styles.css   全部样式（含明暗主题变量）
assets/site.js      主题切换 + 目录高亮
build.mjs           生成器
serve.mjs           本地预览服务器
dist/               构建产物
```
