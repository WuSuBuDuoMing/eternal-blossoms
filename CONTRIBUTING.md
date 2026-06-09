# Contributing to Eternal Blossoms / 贡献指南

:cherry_blossom: Thank you for your interest in contributing to **永恒花海 (Eternal Blossoms)**!

:cherry_blossom: 感谢你对 **永恒花海 (Eternal Blossoms)** 项目的关注与贡献！

This document provides guidelines and instructions for contributing to this project.
本文档提供了贡献本项目的指南和说明。

---

## Table of Contents / 目录

- [Code of Conduct / 行为准则](#code-of-conduct--行为准则)
- [Getting Started / 快速开始](#getting-started--快速开始)
- [Development Setup / 开发环境配置](#development-setup--开发环境配置)
- [Project Structure / 项目结构](#project-structure--项目结构)
- [Code Style Guidelines / 代码风格指南](#code-style-guidelines--代码风格指南)
- [Making Changes / 提交更改](#making-changes--提交更改)
- [Pull Request Process / PR 流程](#pull-request-process--pr-流程)
- [Issue Templates / Issue 模板](#issue-templates--issue-模板)
- [Coding Conventions / 编码规范](#coding-conventions--编码规范)

---

## Code of Conduct / 行为准则

Please be respectful and constructive in all interactions. We are committed to providing a welcoming and inclusive experience for everyone.
请在所有互动中保持尊重和建设性。我们致力于为每个人提供友好和包容的体验。

---

## Getting Started / 快速开始

### Prerequisites / 前置要求

- **Node.js** >= 16.0
- **npm** >= 8.0
- **Git**
- A modern browser with **WebGL** support (Chrome 90+ / Firefox 88+ / Safari 14+ / Edge 90+)
- 支持 **WebGL** 的现代浏览器（Chrome 90+ / Firefox 88+ / Safari 14+ / Edge 90+）

### Quick Setup / 快速设置

```bash
# 1. Fork the repository on GitHub / 在 GitHub 上 Fork 仓库

# 2. Clone your fork / 克隆你的 Fork
git clone https://github.com/<your-username>/eternal-blossoms.git
cd eternal-blossoms

# 3. Add the upstream remote / 添加上游远程仓库
git remote add upstream https://github.com/WuSuBuDuoMing/eternal-blossoms.git

# 4. Install dependencies / 安装依赖
npm install

# 5. Start the development server / 启动开发服务器
npm start

# 6. Open in browser / 在浏览器中打开
# http://localhost:3002
```

---

## Development Setup / 开发环境配置

### Environment Variables / 环境变量

| Variable / 变量 | Default / 默认值 | Description / 描述 |
| --- | --- | --- |
| `PORT` | `3002` | Server listening port / 服务器监听端口 |
| `CORS_ORIGIN` | `*` | Allowed CORS origin / 允许的 CORS 来源 |
| `NODE_ENV` | `development` | Runtime environment / 运行环境 |

### Available Scripts / 可用脚本

```bash
npm start        # Start production server / 启动生产服务器
npm run dev      # Start development server (alias for npm start) / 启动开发服务器
```

### Verifying Your Setup / 验证配置

1. Open `http://localhost:3002` in your browser / 在浏览器中打开 `http://localhost:3002`
2. You should see the loading screen with the :cherry_blossom: animation / 你应该看到带有 :cherry_blossom: 动画的加载界面
3. After loading, the 3D gallery should render with 24 cards / 加载完成后，3D 画廊应渲染 24 张卡片
4. Open browser DevTools and check for errors in the Console / 打开浏览器开发者工具，检查控制台中是否有错误

---

## Project Structure / 项目结构

```text
02-Eternal-Blossoms/
|-- server.js              # Express server entry point / Express 服务器入口
|-- data/cards.json        # Card data (edit to add/modify cards) / 卡片数据
|-- routes/api.js          # REST API routes / REST API 路由
+-- public/
    |-- index.html          # Main HTML page / 主 HTML 页面
    |-- sw.js               # Service Worker
    |-- manifest.json       # PWA manifest
    |-- css/style.css       # Global styles / 全局样式
    +-- js/
        |-- app.js          # Main entry (initialization + render loop) / 主入口
        |-- scene.js        # SceneManager (Three.js 3D) / 场景管理
        |-- particles.js    # ParticleSystem (Canvas 2D) / 粒子系统
        |-- layouts.js      # Layouts (7 layout mode algorithms) / 布局算法
        |-- ui.js           # UIController (interactions + UI) / UI 控制
        |-- audio.js        # AudioManager (Web Audio) / 音频管理
        |-- analytics.js    # SimpleAnalytics (event tracking) / 事件追踪
        |-- register-sw.js  # Service Worker registration / SW 注册
        +-- vendor/
            +-- three.min.js # Three.js (local copy) / Three.js 本地副本
```

---

## Code Style Guidelines / 代码风格指南

### General Principles / 基本原则

- **Clarity over cleverness** -- Write code that is easy to read and understand
- **清晰优先于聪明** -- 编写易于阅读和理解的代码
- **Single responsibility** -- Each module/class should have one clear purpose
- **单一职责** -- 每个模块/类应有一个明确的目的
- **Comment intent, not implementation** -- Explain *why*, not *what*
- **注释意图，而非实现** -- 解释 *为什么*，而不是 *是什么*
- **Use `'use strict'`** in all JavaScript files / 在所有 JavaScript 文件中使用 `'use strict'`

### JavaScript Style / JavaScript 风格

```javascript
// Good: clear, well-commented function / 好的：清晰且有良好注释的函数
/**
 * Calculate the Fibonacci sphere position for a given index.
 * Used by the GATHER layout mode.
 * 计算给定索引的 Fibonacci 球面位置。
 * 用于 GATHER 布局模式。
 * @param {number} index - Card index / 卡片索引
 * @param {number} total - Total card count / 卡片总数
 * @returns {{x: number, y: number, z: number}} 3D position / 3D 位置
 */
static gather(index, total) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (index / (total - 1)) * 2;
  const radius = Math.sqrt(1 - y * y);
  const theta = goldenAngle * index;
  return {
    x: Math.cos(theta) * radius * 8,
    y: y * 8,
    z: Math.sin(theta) * radius * 8,
  };
}
```

### Formatting / 格式化

- **Indentation / 缩进:** 2 spaces (no tabs) / 2 个空格（不用 Tab）
- **Quotes / 引号:** Single quotes for strings (`'hello'`) / 字符串使用单引号
- **Semicolons / 分号:** Always use semicolons / 始终使用分号
- **Line length / 行长度:** Aim for 100 characters max; break long lines logically / 最多 100 个字符
- **Trailing commas / 尾随逗号:** Use trailing commas in multi-line arrays and objects / 多行数组和对象中使用尾随逗号
- **Naming / 命名:**
  - Classes / 类: `PascalCase` (e.g., `SceneManager`, `ParticleSystem`)
  - Functions/methods / 函数/方法: `camelCase` (e.g., `setLoadingProgress`)
  - Constants / 常量: `UPPER_SNAKE_CASE` (e.g., `HEART_COUNT`)
  - Private methods / 私有方法: prefix with underscore `_` (e.g., `_resize`)

### CSS Style / CSS 风格

```css
/* Good: BEM-like naming, clear structure / 好的：BEM 命名，清晰结构 */
.loader-bar {
  height: 3px;
  background: linear-gradient(90deg, #ff6b9d, #c77dff, #4facfe);
  border-radius: 2px;
  transition: width 0.3s ease;
  will-change: width;
}
```

- Use kebab-case for class names / 类名使用 kebab-case
- Group related properties together (layout, box model, typography, visual, animation) / 将相关属性分组
- Use CSS custom properties for theme values / 使用 CSS 自定义属性作为主题值
- Prefer `transform` and `opacity` for animations (GPU-accelerated) / 动画优先使用 `transform` 和 `opacity`

### Comments / 注释

- Use JSDoc-style comments for all public methods and classes / 所有公共方法和类使用 JSDoc 风格注释
- Use section headers for logical groupings / 使用分节标题进行逻辑分组:

```javascript
// ================================================================
// Section Name / 分节名称
// ================================================================
```

- Use round markers for milestone references / 使用里程碑标记:

```javascript
// R20: Burst particles implementation
```

---

## Making Changes / 提交更改

### Branching Strategy / 分支策略

```bash
# Always branch from the latest main / 始终从最新的 main 分支创建新分支
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name
```

Branch naming conventions / 分支命名规范:

| Prefix / 前缀 | Use Case / 用途 |
| --- | --- |
| `feature/` | New features / 新功能 |
| `fix/` | Bug fixes / Bug 修复 |
| `refactor/` | Code refactoring / 代码重构 |
| `docs/` | Documentation changes / 文档更改 |
| `perf/` | Performance improvements / 性能优化 |
| `style/` | Code style / formatting / 代码风格 / 格式化 |

### Commit Messages / 提交信息

Write clear, descriptive commit messages / 编写清晰、描述性的提交信息:

```text
feat: add search filter for card categories

- Implement category-based filtering in UIController
- Add dropdown selector for card categories
- Update particle hue based on active filter

Closes #42
```

Format / 格式:

```text
<type>: <short summary>

<optional body with details>

<optional footer with issue references>
```

Types / 类型: `feat`, `fix`, `refactor`, `docs`, `style`, `perf`, `test`, `chore`

### Adding a New Card / 添加新卡片

1. Edit `data/cards.json` / 编辑 `data/cards.json`
2. Add a new object following the existing schema / 按照现有 schema 添加新对象:

```json
{
  "id": 25,
  "title": "新卡片标题",
  "titleEn": "NEW CARD TITLE",
  "desc": "一段诗意的描述文字。",
  "emoji": "🌟",
  "gradient": "linear-gradient(135deg, #ff6b9d 0%, #c77dff 100%)",
  "color": "#ff6b9d",
  "category": "分类",
  "tags": ["标签1", "标签2"],
  "sortWeight": 50
}
```

3\. Ensure `id` is unique / 确保 `id` 唯一
4\. Restart the server and verify the card appears / 重启服务器并验证卡片显示

### Adding a New Layout Mode / 添加新布局模式

1. Add a new static method in `public/js/layouts.js` / 在 `public/js/layouts.js` 中添加新静态方法
2. Follow the existing function signature: `(index, total, progress) => { x, y, z, rx, ry, rz, scale }` / 遵循现有函数签名
3. Register it in the layout switch logic / 在布局切换逻辑中注册
4. Add corresponding stage name in `ui.js` / 在 `ui.js` 中添加对应的阶段名称

---

## Pull Request Process / PR 流程

### Before Submitting / 提交前

1. **Test your changes** -- Verify the application loads and functions correctly in at least one browser
   **测试你的更改** -- 至少在一个浏览器中验证应用能正常加载和运行
2. **Check for errors** -- Open DevTools Console and ensure there are no JavaScript errors
   **检查错误** -- 打开开发者工具控制台，确保没有 JavaScript 错误
3. **Test responsiveness** -- Check on both desktop and mobile viewport sizes
   **测试响应式** -- 在桌面和移动端视口尺寸下检查
4. **Update documentation** -- If you added features, update README.md
   **更新文档** -- 如果添加了新功能，请更新 README.md
5. **Update CHANGELOG.md** -- Add your changes under the `[Unreleased]` section
   **更新 CHANGELOG.md** -- 在 `[Unreleased]` 部分添加你的更改

### Submitting a PR / 提交 PR

1. Push your branch to your fork / 推送分支到你的 Fork:

```bash
git push origin feature/your-feature-name
```

2\. Open a Pull Request on GitHub against the `main` branch / 在 GitHub 上针对 `main` 分支发起 Pull Request
3\. Fill in the PR template with / 填写 PR 模板:

- **What** does this PR do? / 此 PR **做了什么**？
- **Why** is this change needed? / **为什么**需要这个更改？
- **How** was this tested? / **如何**测试的？
- Screenshots/videos if applicable / 截图/视频（如适用）

### PR Review Checklist / PR 审核清单

Reviewers will check / 审核者将检查:

- [ ] Code follows the style guidelines / 代码遵循风格指南
- [ ] Changes are well-documented with comments / 更改有良好的注释文档
- [ ] No console errors in browser DevTools / 浏览器开发者工具中无控制台错误
- [ ] Application loads and functions correctly / 应用能正常加载和运行
- [ ] Mobile responsiveness is maintained / 移动端响应式布局正常
- [ ] README and CHANGELOG are updated (if applicable) / README 和 CHANGELOG 已更新（如适用）
- [ ] No sensitive data is committed (API keys, passwords, etc.) / 未提交敏感数据

### After Merge / 合并后

- Delete your feature branch / 删除你的功能分支
- Pull the latest upstream main / 拉取最新的上游 main 分支

---

## Issue Templates / Issue 模板

### Bug Report / Bug 报告

When reporting a bug, please include / 报告 bug 时，请包含:

```markdown
**Describe the bug / 描述 bug:**
A clear description of what the bug is.
请清晰描述 bug 内容。

**Steps to reproduce / 复现步骤:**
1. Go to '...' / 打开 '...'
2. Scroll to '...' / 滚动到 '...'
3. Click on '...' / 点击 '...'
4. See error / 出现错误

**Expected behavior / 期望行为:**
What you expected to happen.
你期望发生的行为。

**Actual behavior / 实际行为:**
What actually happened.
实际发生的行为。

**Screenshots / 截图:**
If applicable, add screenshots or screen recordings.
如果可以，请添加截图或录屏。

**Environment / 环境:**
- Browser / 浏览器: [e.g., Chrome 120, Firefox 121, Safari 17]
- OS / 操作系统: [e.g., Windows 11, macOS Sonoma, Ubuntu 22.04]
- Screen size / 屏幕尺寸: [e.g., 1920x1080, mobile]
- Node.js version / Node.js 版本: [e.g., 18.17.0]

**Console errors / 控制台错误:**
Paste any errors from the browser DevTools Console.
请粘贴浏览器开发者工具控制台中的错误信息。
```

### Feature Request / 功能请求

When requesting a feature, please include / 请求功能时，请包含:

```markdown
**Is your feature request related to a problem? / 你的功能请求是否与某个问题相关？**
A clear description of the problem (e.g., "I find it hard to...").
请清晰描述问题。

**Describe the solution you'd like / 描述你想要的解决方案:**
A clear description of what you want to happen.
请清晰描述你希望的功能。

**Describe alternatives you've considered / 描述你考虑过的替代方案:**
Any alternative solutions or features you've considered.
你考虑过的任何替代解决方案或功能。

**Additional context / 补充信息:**
Mockups, screenshots, or references to similar features in other projects.
模型、截图或其他项目中类似功能的参考。
```

### Question / Discussion / 问题 / 讨论

For general questions / 一般问题:

```markdown
**Topic / 主题:**
Brief description of your question.
请简要描述你的问题。

**Context / 上下文:**
What are you trying to achieve? What have you already tried?
你想要实现什么？你已经尝试了什么？

**Code samples / 代码示例:**
If applicable, include relevant code snippets.
如果可以，请包含相关代码片段。
```

---

## Coding Conventions / 编码规范

### Module Pattern / 模块模式

Each JavaScript module follows this structure / 每个 JavaScript 模块遵循以下结构:

1. File-level JSDoc comment describing the module purpose / 文件级 JSDoc 注释描述模块用途
2. Class declaration with constructor / 类声明及构造函数
3. Section headers using `=====` dividers / 使用 `=====` 分隔符的分节标题
4. Public methods first, private methods (prefixed with `_`) last / 公共方法在前，私有方法（`_` 前缀）在后
5. Self-contained -- avoid cross-module globals; communicate via callbacks / 自包含 -- 避免跨模块全局变量；通过回调通信

### Error Handling / 错误处理

```javascript
// Good: graceful error handling with user feedback
// 好的：优雅的错误处理和用户反馈
try {
  const response = await fetch(url);
  if (!response.ok) throw new Error(response.statusText);
  const data = await response.json();
  // process data...
} catch (err) {
  console.error('Failed to load data:', err);
  this.showError('Unable to load cards. Please refresh.');
}
```

### Performance / 性能

- Use `requestAnimationFrame` for render loops / 渲染循环使用 `requestAnimationFrame`
- Use `will-change` CSS property for animated elements / 动画元素使用 `will-change` CSS 属性
- Minimize DOM reads in animation loops (cache references) / 动画循环中最小化 DOM 读取（缓存引用）
- Use `CanvasTexture` for Three.js textures (avoids image loading) / 使用 `CanvasTexture` 作为 Three.js 纹理

### Browser Compatibility / 浏览器兼容性

- Target modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+) / 目标现代浏览器
- Use feature detection, not user-agent detection / 使用特性检测，而非 UA 检测
- Provide graceful fallbacks for unsupported features (e.g., WebGL) / 为不支持的功能提供优雅降级

---

## Questions? / 有问题？

If you have questions about contributing, feel free to / 如果你有关于贡献的问题，欢迎:

- Open a [Discussion](https://github.com/WuSuBuDuoMing/eternal-blossoms/discussions) on GitHub / 在 GitHub 上发起 [讨论](https://github.com/WuSuBuDuoMing/eternal-blossoms/discussions)
- Open an [Issue](https://github.com/WuSuBuDuoMing/eternal-blossoms/issues) with the `question` label / 使用 `question` 标签发起 [Issue](https://github.com/WuSuBuDuoMing/eternal-blossoms/issues)

---

:cherry_blossom: Every contribution, no matter how small, helps the garden grow. Thank you for being part of Eternal Blossoms!

:cherry_blossom: 每一个贡献，无论多小，都让花园更加繁茂。感谢你成为永恒花海的一部分！
