# 我的网站（Wodewangzhan）

一个基于 Vite + React + TypeScript 构建的轻量级个人网站，集热榜聚合、文章、音乐、时间轴、关于页、友链、工具箱与后台管理于一体。

> 本项目为个人学习与展示用途，前后端分离但可同构部署。

## 技术栈

- **前端**：Vite 6 + React 18 + TypeScript + Tailwind CSS + Zustand
- **后端**：Node.js 原生 HTTP + 自定义 `/api/` 路由中间件
- **图表/文档**：Recharts + react-markdown + remark-gfm
- **测试**：Vitest + jsdom
- **热榜数据源**：自部署 DailyHotApi（端口 6688）

## 功能一览

| 模块 | 说明 |
|------|------|
| 🏠 首页 | 简介、快捷入口、友链申请 |
| 🔥 全平台热榜 | 8 大平台热门内容聚合（B站、快手、百度、头条等） |
| 📝 文章 | Markdown 文章列表与详情 |
| 🎵 音乐 | 音乐收藏与播放展示 |
| ⏳ 时间轴 | 个人真实经历时间线 |
| 🙋 关于 | 个人简介与兴趣爱好 |
| 🔗 友链 | 友链展示与提交审核 |
| 🛠️ 工具箱 | 实用小工具集合 |
| ⚙️ 管理后台 | 登录认证、文章/音乐/时间轴/友链/设置管理 |

## 快速开始

### 环境要求

- Node.js ≥ 18
- npm 或 pnpm

### 安装依赖

```bash
npm install
```

### 开发模式

同时启动前端（端口 5174）与后端 API（端口 3002）：

```bash
npm run dev:all
```

也可以分别启动：

```bash
# 终端 1：前端
npm run dev

# 终端 2：后端
npm run dev:server
```

### 热榜数据（可选）

若要使用"全平台热榜"，需先启动本地 DailyHotApi：

```bash
cd D:/tmp/dailyhot-api
NODE_OPTIONS="" NODE_ENV=development npx tsx src/index.ts
```

服务启动后占用 `6688` 端口，本项目 `/api/hot/*` 会代理到该服务。

### 构建

```bash
npm run build
```

构建产物位于 `dist/` 目录，可通过 `npm run preview` 预览生产效果。

## 项目结构

```
.
├── src/                    # 前端源码
│   ├── components/         # 公共组件与布局
│   ├── pages/              # 页面（含后台管理页）
│   ├── services/           # API 请求封装
│   ├── store/              # Zustand 全局状态
│   ├── types/              # TypeScript 类型
│   └── lib/                # 工具函数
├── server/                 # 后端服务
│   ├── index.js            # 生产服务器入口
│   ├── apiMiddleware.js    # /api/ 路由分发
│   ├── data/               # JSON 数据文件
│   └── *.Service.js        # 各模块业务逻辑
├── scripts/                # 辅助脚本
├── dist/                   # 构建产物
├── vite.config.ts          # Vite 配置
├── tailwind.config.js      # Tailwind 配置
└── package.json
```

## 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动前端开发服务器（5174） |
| `npm run dev:server` | 启动后端 API 服务（3002） |
| `npm run dev:all` | 同时启动前后端 |
| `npm run build` | TypeScript 检查并构建生产包 |
| `npm run preview` | 预览生产构建 |
| `npm run test` | 运行 Vitest 测试 |
| `npm run check` | 仅运行 TypeScript 类型检查 |

## 端口说明

| 服务 | 端口 | 用途 |
|------|------|------|
| Vite 前端 | 5174 | 开发环境页面访问 |
| Node API | 3002 | 后端接口与数据服务 |
| DailyHotApi | 6688 | 热榜数据源代理服务 |

## 部署

1. 执行 `npm run build` 生成 `dist/`。
2. 启动 `node server/index.js` 提供静态文件服务并代理 `/api/`。
3. 如需热榜功能，确保 DailyHotApi（6688）已启动。

## 管理员登录

后台地址：`/admin/login`

默认管理员账号与密码存储于 `server/data/auth.json`，首次使用请在本地配置。

## 许可证

本项目仅用于个人学习与交流，转载请注明出处。
