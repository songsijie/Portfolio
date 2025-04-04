---
title: "使用 Astro 创建个人作品集网站"
description: "本文分享了我使用 Astro 框架构建个人作品集网站的经验和技巧。"
publishDate: 2023-11-20
tags: ["Astro", "前端开发", "作品集", "Web开发"]
---

# 使用 Astro 创建个人作品集网站

在这篇文章中，我将分享我如何使用 Astro 框架构建我的个人作品集网站，以及这个过程中的经验和技巧。

## 为什么选择 Astro？

Astro 是一个现代的网站构建框架，它有几个令我着迷的特点：

- **零 JavaScript 默认设置** - 只在需要时发送 JavaScript
- **强大的内容工具** - 通过集合和内容 API 管理内容
- **UI 框架灵活性** - 可以使用 React、Vue、Svelte 等
- **优秀的性能** - 生成高性能的静态网站

## 站点结构

我的作品集网站主要包含以下几个部分：

1. 主页/简介
2. 项目展示
3. 技能与经验
4. 博客部分
5. 联系方式

## 使用内容集合管理博客

Astro 的内容集合功能非常强大，让我可以轻松管理博客文章：

```typescript
// 配置内容集合
const blogCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.date(),
    // 更多字段...
  })
});
```

## 后续计划

我计划继续完善这个网站，添加更多功能：

- 黑暗模式切换
- 多语言支持
- 更多交互性元素

敬请关注更多更新！
