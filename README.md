# Portfolio 个人作品集网站



![Portfolio Screenshot](https://github.com/user-attachments/assets/e284a42b-15c5-495c-99c7-ad5c1eb3bbe7)
![Deploy Status](https://img.shields.io/badge/Deploy-Vercel-black?style=flat&logo=vercel)

---

[在线演示 Demo](https://oscarhernandez.vercel.app/)

## 项目介绍 | Introduction

这是一个使用Astro构建的现代化个人作品集网站，结合了高性能和优秀的用户体验。该项目展示了我的技能、项目和博客文章，同时保持了极快的加载速度和极低的JavaScript负载。

This is a modern portfolio website built with Astro, combining high performance and excellent user experience. This project showcases my skills, projects, and blog posts while maintaining extremely fast loading times and minimal JavaScript payload.

## 技术栈 | Stack  

### 前端 | Frontend  
![Astro](https://img.shields.io/badge/Astro-FF5D01?logo=astro&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)

### 内容管理 | Content Management
- Astro Content Collections
- Markdown/MDX

### 工具 | Tools  
![Figma](https://img.shields.io/badge/Figma-F24E1E?logo=figma&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-F7B93E?logo=prettier&logoColor=black)
![Canva](https://img.shields.io/badge/Canva-c900c3?logo=canva&logoColor=white)

## 功能特点 | Features

- 🚀 **高性能** - 使用Astro的零JavaScript默认设置，确保超快加载速度
- 📱 **响应式设计** - 完美适配所有设备尺寸
- 📝 **博客功能** - 使用Markdown内容集合轻松管理和展示博客文章
- 🎨 **现代UI** - 使用Tailwind CSS实现时尚美观的设计
- 🔍 **SEO友好** - 针对搜索引擎优化的元数据和结构
- 🌓 **暗色模式** - 支持暗色/亮色模式切换
- 🧩 **React组件** - 使用React实现交互式UI元素
- 🔄 **CI/CD** - 通过GitHub Actions实现自动部署

## 项目结构 | Project Structure

```
public/
└── svg/              # SVG图标和静态资源
src/
├── components/       # Astro组件 (页眉、页脚等)
│   ├── nav.astro     # 导航组件
│   ├── footer.astro  # 页脚组件
│   ├── home.astro    # 主页组件
│   ├── blogs.astro   # 博客列表组件
│   ├── contact.astro # 联系表单组件
│   └── logoWall.astro# Logo墙组件
├── layouts/          # 页面布局模板
│   ├── Layout.astro  # 主布局
│   └── BlogPost.astro# 博客文章布局
├── pages/            # 页面路由
│   ├── index.astro   # 主页
│   └── blog/         # 博客相关页面
│       ├── index.astro # 博客列表页
│       └── [slug].astro # 动态博客文章页
├── content/          # 内容集合
│   ├── config.ts     # 内容配置
│   └── blog/         # 博客Markdown文件
├── React/            # React组件
│   ├── SkillsList.tsx # 技能列表组件
│   ├── LikeButton.tsx # 点赞按钮组件
│   └── LetterGlitch.tsx # 文字特效组件
└── firebase.ts       # Firebase集成
```

## 组件展示 | Components Showcase

本项目集成了来自[ReactBits.dev](https://www.reactbits.dev/showcase)的`<LetterGlitch \>`组件，为网站增添动态效果。

This project integrates the `<LetterGlitch \>` component from [ReactBits.dev](https://www.reactbits.dev/showcase) to add dynamic effects to the website.

## 自定义Spotify展示 | Custom Spotify Album  

网站集成了Spotify嵌入功能，展示您喜爱的专辑：

The website integrates Spotify embeds to showcase your favorite albums:

### 如何设置 | How to setup

1. 选择Spotify专辑 | Choose your Spotify album
2. 访问分享选项 | Access the share options
3. 选择"复制嵌入代码" | Select 'copy embed code'
4. 插入代码至footer.astro | Insert the code in footer.astro

```html
<iframe 
  src="https://open.spotify.com/embed/album/ALBUM_ID" 
  style="border-radius:12px border:0;" 
  class="w-full h-40" 
  frameborder="0" 
  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture">
</iframe>
```

## 本地开发 | Local Development

```bash
# 安装依赖 | Install dependencies
npm install

# 启动开发服务器 | Start dev server
npm run dev

# 构建生产版本 | Build for production
npm run build

# 预览生产构建 | Preview production build
npm run preview
```

## 部署 | Deployment

该项目配置为使用Vercel自动部署。每次推送到主分支时，都会触发新的部署。

This project is configured for automatic deployment using Vercel. Each push to the main branch triggers a new deployment.

## 贡献 | Contributing

欢迎提交问题和拉取请求。对于重大更改，请先开启一个issue讨论您想要改变的内容。

Issues and pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 许可证 | License

[MIT](LICENSE)
