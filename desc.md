# ReadFun - 现代化的 Chrome 阅读模式扩展

## 项目概述
ReadFun 是一个专注于提供优质阅读体验的 Chrome 扩展程序。它能够智能识别网页内容,提供沉浸式的阅读环境,并集成了 AI 辅助功能。本扩展采用现代化的技术栈和架构设计,致力于提供最佳的用户体验。

## 核心功能

### 1. 内容识别与提取
- 使用 Mozilla Readability 算法智能识别文章内容
- 精准提取文章元数据(标题、作者、发布时间等)
- 保留原文格式(包括粗体、斜体、列表等样式)
- 支持多语言内容解析

### 2. 阅读体验优化
- Safari 风格的简洁阅读界面
- 流畅的过渡动画效果
- iframe 独立环境确保阅读体验
- 自定义阅读选项：

  - 自动总结开关

### 3. AI 智能辅助
- 基于 LLM 的文章智能总结
- 多语言总结支持(中英文)
- 可配置不同 AI 服务商
- 支持自定义 API 接口

### 4. 主题与国际化
- 完整的中英文国际化支持

### 5. 性能与体验
- 智能预加载与延迟加载
- 平滑的动画过渡效果
- IndexedDB 数据持久化
- 完善的错误处理机制
- 详细的日志记录系统

## 技术架构

### 1. 前端技术栈
- **核心框架**：React 18 + TypeScript
- **状态管理**：
  - Zustand：轻量级状态管理
  - React Query：异步数据处理
- **样式解决方案**：
  - TailwindCSS：原子化 CSS
  - CSS Modules：模块化样式隔离
- **工具链**：
  - Plasmo：Chrome 扩展开发框架
  - i18next：国际化解决方案
  - Sharp：图标生成工具

### 2. 存储方案
- **本地存储**：
  - IndexedDB：大容量数据存储
  - Chrome Storage API：用户配置
- **云端同步**：
  - Chrome Sync Storage：跨设备同步

### 3. 扩展架构
- **Background Service Worker**：
  - 中心化配置管理
  - LLM 服务集成
  - 消息通信处理
- **Content Scripts**：
  - 页面内容解析
  - UI 渲染管理
- **Iframe 沙箱**：
  - 独立的阅读环境
  - 样式隔离


## 目录结构
src/ # 源代码根目录
├── core/ # 核心功能模块
│ └── services/ # 核心服务层
│ ├── config.ts # 配置管理服务
│ ├── llm-config.ts # LLM配置服务
│ └── message.ts # 消息通信服务
│
├── modules/ # 功能模块目录
│ ├── reader/ # 阅读模式核心模块
│ │ ├── api/ # API 接口封装
│ │ ├── background/ # 后台脚本
│ │ ├── components/ # UI 组件
│ │ │ ├── ArticleCard.tsx # 文章展示卡片
│ │ │ ├── ReaderApp.tsx # 阅读器主应用
│ │ │ └── SummarySidebar.tsx # 总结侧边栏
│ │ ├── content/ # 内容脚本
│ │ ├── iframe/ # iframe 相关
│ │ ├── services/ # 业务服务
│ │ │ ├── article-parser.ts # 文章解析
│ │ │ ├── reader-content.ts # 内容管理
│ │ │ └── reader-frame.ts # iframe管理
│ │ └── store/ # 状态管理
│ │
│ ├── toolbar/ # 工具栏模块
│ │ ├── components/ # 工具栏组件
│ │ │ ├── Toolbar.tsx # 工具栏容器
│ │ │ └── SummaryButton.tsx # 总结按钮
│ │ ├── styles/ # 样式文件
│ │ └── types.ts # 类型定义
│ │
│ └── llm/ # AI模型集成模块
│ ├── constants/ # 常量定义
│ ├── services/ # LLM服务
│ └── types/ # 类型定义
│
├── shared/ # 共享资源目录
│ ├── components/ # 通用组件
│ ├── constants/ # 全局常量
│ ├── hooks/ # 通用Hooks
│ │ └── useTheme.ts # 主题Hook
│ ├── styles/ # 全局样式
│ │ ├── theme.css # 主题样式
│ │ └── toast.css # 提示样式
│ ├── types/ # 全局类型
│ │ ├── theme.ts # 主题类型
│ │ └── message.ts # 消息类型
│ └── utils/ # 工具函数
│ ├── logger.ts # 日志工具
│ ├── crypto.ts # 加密工具
│ ├── message.ts # 消息处理
│ └── indexed-db.ts # 数据库工具
│
├── i18n/ # 国际化资源
│ ├── config.ts # i18n配置
│ └── locales/ # 语言文件
│ ├── en/ # 英文
│ └── zh/ # 中文
│
├── pages/ # 页面组件
│ └── options/ # 设置页面
│ ├── components/ # 设置组件
│ └── Options.tsx # 设置页面
│
├── background/ # 扩展后台
│ └── index.ts # 后台入口
│
├── content/ # 内容脚本
│ └── index.ts # 内容入口
│
└── style.css # 全局样式



### 目录说明

1. **core/** - 核心服务层
   - 提供配置管理、消息通信等基础服务
   - 处理 LLM 配置和状态管理

2. **modules/** - 功能模块
   - reader/: 阅读模式核心实现，包含解析、渲染等功能
   - toolbar/: 工具栏功能，提供用户交互界面
   - llm/: AI 模型集成，处理智能总结功能

3. **shared/** - 共享资源
   - 提供全局通用的组件、工具和类型定义
   - 包含主题管理、国际化等基础功能

4. **i18n/** - 国际化资源
   - 管理多语言翻译文件
   - 提供语言切换功能

5. **pages/** - 页面组件
   - 包含扩展的设置页面
   - 管理用户配置界面

6. **background/** & **content/**
   - 处理扩展的后台任务和内容脚本
   - 管理生命周期和消息通信

每个模块都遵循清晰的职责划分：
- components/: UI 组件
- services/: 业务逻辑
- types/: 类型定义
- styles/: 样式文件

这种模块化结构确保了：
- 代码组织清晰，易于维护
- 功能模块独立，降低耦合
- 复用性强，提高开发效率
