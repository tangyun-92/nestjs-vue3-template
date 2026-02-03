# Ant Design Pro Template

## 项目简介

这是一个基于 Ant Design Pro 的企业级中后台前端/设计解决方案模板项目。该项目提供了开箱即用的 UI 解决方案，适合快速搭建企业级应用。

**版本**: 6.0.0
**Node 版本要求**: >= 20.0.0

## 技术栈

### 核心框架
- **React**: 19.1.0 - 最新版本的 React 框架
- **Ant Design**: 5.25.4 - 企业级 UI 设计语言和 React 组件库
- **UmiJS Max**: 4.3.24 - 企业级前端应用框架
- **TypeScript**: 5.6.3 - JavaScript 的超集，提供类型安全

### UI 组件库
- **@ant-design/pro-components**: 2.7.19 - ProComponents 高级组件
- **@ant-design/icons**: 5.6.1 - Ant Design 图标库
- **@ant-design/plots**: 2.6.0 - 基于 G2Plot 的 React 图表库
- **antd-style**: 3.7.0 - Ant Design 样式解决方案

### 数据可视化
- **@antv/l7**: 2.22.7 - 地理空间数据可视化引擎
- **@antv/l7-react**: 2.4.3 - L7 的 React 封装

### 工具库
- **dayjs**: 1.11.13 - 轻量级日期处理库
- **classnames**: 2.5.1 - CSS 类名动态组合工具
- **numeral**: 2.0.6 - 数字格式化库

### 开发工具
- **Biome**: 2.0.6 - 代码格式化和 Lint 工具
- **Jest**: 30.0.4 - JavaScript 测试框架
- **Husky**: 9.1.7 - Git hooks 工具
- **Commitlint**: 19.5.0 - Git commit 信息规范检查

## 项目结构

```
antd-pro-template/
├── config/                # 配置文件目录
│   ├── config.ts         # 主配置文件
│   ├── defaultSettings.ts # 默认设置
│   ├── proxy.ts          # 代理配置
│   └── routes.ts         # 路由配置
├── mock/                  # Mock 数据
├── public/                # 静态资源
├── src/                   # 源代码目录
│   ├── .umi/             # Umi 框架生成文件
│   ├── components/       # 公共组件
│   │   ├── Footer/       # 页脚组件
│   │   ├── RightContent/ # 右侧内容组件
│   │   └── HeaderDropdown/ # 头部下拉组件
│   ├── locales/          # 国际化文件
│   │   ├── zh-CN/        # 简体中文
│   │   ├── zh-TW/        # 繁体中文
│   │   ├── en-US/        # 英文
│   │   ├── ja-JP/        # 日文
│   │   ├── pt-BR/        # 葡萄牙语
│   │   ├── fa-IR/        # 波斯语
│   │   ├── bn-BD/        # 孟加拉语
│   │   └── id-ID/        # 印尼语
│   ├── pages/            # 页面组件
│   │   ├── dashboard/    # 仪表盘
│   │   ├── form/         # 表单页
│   │   ├── list/         # 列表页
│   │   ├── profile/      # 详情页
│   │   ├── result/       # 结果页
│   │   ├── exception/    # 异常页
│   │   ├── account/      # 账户页
│   │   ├── table-list/   # 表格列表
│   │   ├── user/         # 用户相关
│   │   ├── Welcome.tsx   # 欢迎页
│   │   ├── Admin.tsx     # 管理页
│   │   └── 404.tsx       # 404 页面
│   ├── services/         # API 服务
│   │   ├── ant-design-pro/ # Ant Design Pro 服务
│   │   └── swagger/      # Swagger API
│   ├── app.tsx           # 运行时配置
│   ├── access.ts         # 权限配置
│   ├── global.tsx        # 全局组件
│   ├── global.less       # 全局样式
│   ├── global.style.ts   # 全局样式（CSS-in-JS）
│   ├── loading.tsx       # 加载组件
│   ├── requestErrorConfig.ts # 请求错误配置
│   ├── service-worker.js # Service Worker
│   ├── manifest.json     # PWA 配置
│   └── typings.d.ts      # 类型声明
├── tests/                 # 测试文件
├── types/                 # 类型定义
├── dist/                  # 构建输出目录
├── .husky/               # Git hooks 配置
├── package.json          # 项目依赖配置
├── tsconfig.json         # TypeScript 配置
├── jest.config.ts        # Jest 测试配置
├── biome.json            # Biome 配置
├── .commitlintrc.js      # Commitlint 配置
├── .lintstagedrc         # Lint-staged 配置
├── .editorconfig         # 编辑器配置
├── .gitignore            # Git 忽略文件
└── .npmrc                # NPM 配置
```

## 功能特性

- ✅ **完整的企业级应用框架** - 基于 Ant Design 和 UmiJS
- ✅ **TypeScript 支持** - 完整的类型定义
- ✅ **国际化** - 支持 8+ 种语言
- ✅ **权限管理** - 内置权限控制方案
- ✅ **Mock 数据** - 便捷的本地数据模拟
- ✅ **代理配置** - 开发环境 API 代理
- ✅ **响应式布局** - 适配不同屏幕尺寸
- ✅ **主题配置** - 可自定义主题
- ✅ **数据可视化** - 集成图表和地图组件
- ✅ **PWA 支持** - 渐进式 Web 应用
- ✅ **代码规范** - Biome + Commitlint
- ✅ **单元测试** - Jest 测试框架

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发环境启动

```bash
# 启动开发服务器
npm run dev

# 或使用指定环境
npm run start:dev    # 开发环境
npm run start:test   # 测试环境
npm run start:pre    # 预发布环境
npm run start:no-mock # 不使用 mock 数据
```

### 构建生产版本

```bash
npm run build
```

### 本地预览构建结果

```bash
npm run preview
```

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览构建结果 |
| `npm run analyze` | 分析构建包大小 |
| `npm run lint` | 代码检查 |
| `npm run test` | 运行测试 |
| `npm run test:coverage` | 运行测试并生成覆盖率报告 |
| `npm run tsc` | TypeScript 类型检查 |
| `npm run openapi` | 生成 OpenAPI 类型定义 |
| `npm run i18n-remove` | 移除国际化配置 |
| `npm run deploy` | 部署到 GitHub Pages |

## 环境变量

项目支持多环境配置：

- `REACT_APP_ENV=dev` - 开发环境
- `REACT_APP_ENV=test` - 测试环境
- `REACT_APP_ENV=pre` - 预发布环境
- `MOCK=none` - 禁用 mock 数据
- `UMI_ENV=dev` - UmiJS 环境配置

## 代码规范

项目使用以下工具保证代码质量：

- **Biome** - 代码格式化和 Lint
- **TypeScript** - 类型检查
- **Commitlint** - Git 提交信息规范
- **Husky** - Git hooks 自动化
- **Lint-staged** - 暂存文件检查

提交代码前会自动执行代码检查和格式化。

## 浏览器支持

支持现代浏览器的默认配置（defaults）。

## 许可证

本项目为私有项目（private: true）。

## 相关链接

- [Ant Design Pro 官方文档](https://pro.ant.design)
- [Ant Design 文档](https://ant.design)
- [UmiJS 文档](https://umijs.org)
- [React 文档](https://react.dev)
