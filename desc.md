# ReadMode - 现代化的 Chrome 阅读模式扩展

## 项目概述
ReadMode 是一个专注于提供优质阅读体验的 Chrome 扩展程序，它能够智能识别网页内容，并提供沉浸式的阅读环境。本扩展采用现代化的技术栈和架构设计，致力于提供最佳的用户体验。

## 核心功能

### 1. 内容识别与提取
- 智能识别文章页面和内容主体
- 精准提取文章元数据（标题、作者、发布时间等）
- 保留原文格式（包括粗体、斜体、列表等样式）
- 使用 Mozilla Readability 算法保证解析质量

### 2. 阅读体验优化
- Safari 风格的简洁阅读界面
- 流畅的过渡动画效果
- iframe 独立环境确保阅读体验
- 自定义阅读选项：
  - 文章宽度调节
  - 字体选择与大小设置
  - 背景主题切换
  - 文本对齐方式调整

### 3. 性能与体验
- 智能预加载与延迟加载策略
- 平滑的动画过渡效果
- 高效的内存管理
- 完善的缓存机制

### 4. 用户配置
- 个性化阅读偏好设置
- 跨设备配置同步
- 快捷键支持
- 自定义主题设置

## 技术架构

### 1. 前端技术栈
- **核心框架**：React 18 + TypeScript
- **状态管理**：
  - Zustand：轻量级状态管理
  - React Query：异步数据处理
- **样式解决方案**：
  - TailwindCSS：原子化 CSS
  - CSS Modules：模块化样式隔离
- **构建工具**：
  - Plasmo：Chrome 扩展开发框架

### 2. 存储方案
- **本地存储**：
  - Chrome Storage API：用户配置
  - IndexedDB：大容量数据存储
- **云端同步**：
  - Chrome Sync Storage：跨设备同步

### 3. 扩展架构
- **Background Service Worker**：
  - 中心化配置管理
  - 后台任务处理
- **Content Scripts**：
  - 页面内容处理
  - UI 渲染
- **Iframe 沙箱**：
  - 独立的阅读环境
  - 样式隔离

src/                      # 源代码根目录
├── core/                 # 核心功能模块，提供基础服务和功能
│   └── services/         # 核心服务，包括消息通信、存储管理等底层服务
├── modules/              # 业务功能模块，每个子目录代表一个独立的功能模块
│   ├── reader/           # 阅读模式核心功能模块
│   │   ├── api/         # 阅读模式相关的 API 调用接口
│   │   ├── components/  # 阅读模式专用的 UI 组件
│   │   ├── hooks/       # 阅读模式相关的自定义 hooks
│   │   ├── services/    # 阅读模式业务服务，如内容解析、渲染等
│   │   └── types.ts     # 阅读模式相关的类型定义
│   ├── toolbar/
│   │   ├── components/
│   │   │   ├── Toolbar.tsx          # 工具栏容器组件
│   │   │   ├── ToolbarButton.tsx    # 通用按钮组件
│   │   │   └── SettingsButton.tsx   # 设置按钮组件
│   │   ├── hooks/
│   │   │   ├── use-toolbar-position.ts  # 处理工具栏定位逻辑
│   │   │   └── use-toolbar-theme.ts     # 处理主题相关逻辑
│   │   ├── styles/
│   │   │   └── toolbar.css          # 工具栏样式（CSS Module）
│   │   └── types.ts                 # 类型定义
│   └── llm/             # AI 模型集成模块
│       ├── api/         # LLM API 接口封装
│       ├── components/  # AI 相关组件
│       ├── services/    # LLM 服务封装
│       └── types.ts     # LLM 相关类型定义
├── shared/              # 共享资源目录，存放可复用的代码和资源
│   ├── components/      # 共享 UI 组件，可被多个模块使用
│   ├── constants/       # 全局常量定义，如配置项、枚举值等
│   ├── hooks/           # 共享的自定义 hooks，提供通用的状态和行为逻辑
│   ├── types/           # 全局通用的类型定义
│   └── utils/           # 工具函数和辅助方法
│       └── error-handling.ts  # 错误处理工具
├── store/               # 全局状态管理，使用 Zustand 实现
├── background/          # Chrome 扩展的背景脚本，处理后台任务
└── content/             # Chrome 扩展的内容脚本，处理页面交互


### 关键目录说明
1. background/
    - 处理扩展程序的后台任务
    - 管理数据同步和存储
2. content/
    - 包含主要的阅读模式实现
    - 组件采用模块化设计
    - 分离业务逻辑（hooks）和展示逻辑（components）
3. store/
    - 使用 Zustand 管理全局状态
    - 分离阅读状态和设置状态
4. public/iframe/
    - 存放阅读模式的 iframe 相关资源
    - 提供独立的阅读环境
5. modules/llm/
    - 提供 AI 模型集成功能
    - 处理文章摘要和内容分析
    - 管理 LLM 配置和 API 调用
    - 实现智能化功能扩展