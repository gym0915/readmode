一个操作简单但功能强大的 Chrome 阅读模式扩展程序

## 功能特点：
- 核心功能：
    - 智能地识别文章页面。
    - 精准提取文章标题、作者、发布时间等元数据。
    - 完好保留文章原有的格式，诸如粗体、斜体等样式。
- 用户界面：
    - 采用类 Safari 阅读模式的界面设计。
    - 具备平滑的动画过渡效果。
    - 可自由设置文章宽度、字体、字号、背景色以及对齐方式等方面，带来沉浸式阅读体验。
- 配置页签：
    - 在 manifest.json 中配置 options_page。
-  实现方式：
    - 尽可能运用现代 WEB API 来达成：
    - 必要情况下提供降级方案。
    - 仅加载必需的 polyfills。
- 阅读模式切换：
    - 采用 iframe 方案实现阅读模式，具有如下优势：
    - 提供完全隔离的环境。
    - 实现更优的性能与内存管理。
    - 因 Chrome 插件特权无需处理跨域问题。
    - 带来平滑的滚动体验。
- 动画效果：
    - 提供多种动画实现方案，包括：
    - CSS Transitions/Animations。
    - Web Animations API。
    - 组合动画系统。
- 性能优化：
    - 运用 will-change 提示浏览器优化渲染。
    - 对动画性能加以优化。
    - 合理运用缓存。
    - 延迟加载非关键资源。
- 兼容性：
    - 支持 Chrome 88 及以上版本。
    - 提供动画降级方案以应对特殊情况。
    - 妥善处理特殊网站兼容性问题。


## 技术栈选型方案
- 前端技术栈
    -  1. 核心框架
        -  React 18 + TypeScript
    -  2. 状态管理，Zustand
        -  React Query：处理 AI 接口的异步状态管理和缓存
    -  3. UI 方案
        - TailwindCSS + CSS Modules
    - 4. 构建工具
        -  Plasmo
    - 5. 借助 Mozilla 的 Readability 库对文章内容予以解析
- 后端技术栈
    - 1. 服务架构
        - Serverless + Edge Functions
    - 2. 数据存储
        - 本地存储：
            - Chrome Storage API：用户配置同步
            - IndexedDB：大量结构化数据存储

src/
├── manifest.json
├── background/
│   └── index.ts                 # 后台服务
├── content/
│   ├── index.tsx                # content script 入口
│   ├── components/
│   │   ├── Reader/             # 阅读模式核心组件
│   │   │   ├── index.tsx
│   │   │   ├── Toolbar.tsx
│   │   │   └── Content.tsx
│   │   └── Settings/           # 设置面板组件
│   │       ├── index.tsx
│   │       ├── FontSettings.tsx
│   │       └── ThemeSettings.tsx
│   ├── hooks/
│   │   ├── useReader.ts        # 阅读模式相关逻辑
│   │   ├── useAnimation.ts     # 动画效果
│   │   └── useStorage.ts       # 存储相关
│   └── utils/
│       ├── parser.ts           # 文章解析
│       ├── storage.ts          # 存储工具
│       └── animation.ts        # 动画工具
├── options/
│   ├── index.tsx               # 配置页面
│   └── components/
├── store/
│   ├── reader.ts               # 阅读状态管理
│   └── settings.ts             # 设置状态管理
└── types/
│    └── index.ts                # 类型定义
├── public/
│   ├── assets/
│   ├── icons/
│   └── styles/
└── iframe/
    └── reader.html            # 阅读模式 iframe 页面


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