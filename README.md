# :cherry_blossom: 永恒花海 · 花海记忆 :cherry_blossom:

<h3 align="center">ETERNAL BLOSSOMS -- HUA HAI JI YI</h3>

<p align="center">
  <em>一个基于 Three.js 的沉浸式 3D 照片卡片画廊。<br>用粒子和光为你编织永恒的花海记忆。</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT">
  <img src="https://img.shields.io/badge/Node.js-%3E%3D16.0-green.svg" alt="Node.js >= 16">
  <img src="https://img.shields.io/badge/Three.js-r158-black?logo=threedotjs&logoColor=white" alt="Three.js r158">
  <img src="https://img.shields.io/badge/Express-4.18-red?logo=express&logoColor=white" alt="Express 4.18">
  <img src="https://img.shields.io/badge/WebGL-Required-orange" alt="WebGL Required">
  <img src="https://img.shields.io/badge/PWA-Enabled-purple" alt="PWA Enabled">
</p>

---

## :sparkles: 功能特性

### :camera: 3D 布局与场景

| 特性 | 描述 |
|------|------|
| :cyclone: **7 种 3D 布局模式** | ARRIVAL (晨曦初临), FAN (卷帘展开), GATHER (同心汇聚), WAVE (正弦波动), GRID (网格呼吸), SPIRAL (螺旋花涡), DEPART (永恒归宿) -- 通过滚动平滑切换 |
| :art: **5 种场景模式** | 花海漫游 (bloom), 记忆照片墙 (memory), 星光告白 (starlight), 时间长廊 (timeline), 永恒花园 (garden) -- 各有独立配色和氛围 |
| :sparkling_heart: **Canvas 2D 粒子系统** | 90 个粉色爱心粒子 + 60 个金色光斑粒子，持续飘落、摇摆、旋转、渐隐动画，支持 Constant Glow 模式 |
| :frame_photo: **CanvasTexture 卡片** | 将卡片信息渲染为 Three.js 纹理 -- 圆角边框、emoji、中英文标题、描述文字 |

### :video_game: 交互与控制

| 交互方式 | 说明 |
|----------|------|
| :mouse: 滚轮 | 控制场景进度切换（带智能吸附） |
| :point_up_2: 鼠标拖拽 | 3D 视角旋转 |
| :mag: 双指缩放 | 触摸屏双指缩放镜头 |
| :point_down: 双击卡片 | 弹出卡片详情弹窗 |
| :keyboard: 键盘快捷键 | 方向键/空格/数字键/全屏等 (见下表) |
| :point_up: 触摸屏 | 滑动切换 + 双指缩放 |
| :mag_right: 搜索与筛选 | 按关键词、分类、标签搜索筛选卡片 |
| :closed_book: 卡片排序 | 按 sortWeight 或字母排序 |

### :gem: 高级功能

| 功能 | 技术 |
|------|------|
| :performing_arts: **主题系统** | 6 种主题 (花海/记忆/星光/时间/花园 + 默认) -- 粒子配色随场景切换 |
| :globe_with_meridians: **国际化 (i18n)** | 中文 / English 双语支持 |
| :iphone: **PWA 支持** | Service Worker 离线缓存，可安装到桌面 |
| :sound: **Web Audio 音效** | 环境音生成 + UI 交互音效 + 音乐可视化 (AnalyserNode) |
| :chart_with_upwards_trend: **性能监控** | 帧率/内存/加载时间追踪，SimpleAnalytics 轻量分析 |
| :lock: **安全头** | X-Content-Type-Options, X-Frame-Options, XSS Protection, CSP |
| :electric_plug: **ETag 缓存** | API 响应支持 304 Not Modified |

---

## :camera_flash: 屏幕截图

> 截图占位 -- 请替换为实际截图

| 花海漫游 | 记忆照片墙 | 星光告白 |
|:---:|:---:|:---:|
| ![bloom](screenshots/bloom.png) | ![memory](screenshots/memory.png) | ![starlight](screenshots/starlight.png) |

| 时间长廊 | 永恒花园 | 卡片详情 |
|:---:|:---:|:---:|
| ![timeline](screenshots/timeline.png) | ![garden](screenshots/garden.png) | ![modal](screenshots/modal.png) |

---

## :rocket: 快速启动

### 前置要求

- **Node.js** >= 16.0
- **npm** >= 8.0
- 支持 **WebGL** 的现代浏览器 (Chrome 90+ / Firefox 88+ / Safari 14+ / Edge 90+)

### 安装与运行

```bash
# 1. 克隆仓库
git clone https://github.com/WuSuBuDuoMing/eternal-blossoms.git
cd eternal-blossoms

# 2. 安装依赖
npm install

# 3. 启动服务
npm start

# 4. 打开浏览器访问
open http://localhost:3002
```

### 开发模式

```bash
npm run dev
```

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3002` | 服务器监听端口 |
| `CORS_ORIGIN` | `*` | 允许的跨域来源 |
| `NODE_ENV` | `development` | 运行环境 (`production` / `development`) |

---

## :building_construction: 项目架构

```
02-Eternal-Blossoms/
|
|-- package.json              # 项目配置与依赖声明
|-- server.js                 # Express 服务端入口 (安全头 + 日志 + CORS + 错误处理)
|-- README.md                 # 本文件
|-- CHANGELOG.md              # 版本变更日志
|-- CONTRIBUTING.md           # 贡献指南
|
|-- data/
|   +-- cards.json            # 24 张预置卡片数据 (id/title/desc/emoji/gradient/tags)
|
|-- routes/
|   +-- api.js                # RESTful API 路由 (/api/cards, /api/cards/:id, /api/health)
|
+-- public/
    |-- index.html            # 主页面 (加载画面 + Canvas 层 + UI 覆盖层 + 弹窗)
    |-- sw.js                 # Service Worker (离线缓存)
    |-- manifest.json         # PWA 清单文件
    |
    |-- css/
    |   +-- style.css         # 全局样式 (布局/动画/响应式/暗色主题)
    |
    +-- js/
        |-- app.js            # 主入口 (数据加载 + 子系统初始化 + 渲染循环 + 状态管理)
        |-- scene.js          # SceneManager -- Three.js 3D 场景 (相机/光照/卡片纹理/射线检测)
        |-- particles.js      # ParticleSystem -- Canvas 2D 粒子 (爱心/光斑/爆发效果)
        |-- layouts.js        # Layouts -- 7 种布局模式数学算法 (ARRIVAL~DEPART)
        |-- ui.js             # UIController -- 交互控制 (滚轮/键盘/触摸/弹窗/进度/诗句/主题)
        |-- audio.js          # AudioManager -- Web Audio API (环境音/音效/可视化)
        |-- analytics.js      # SimpleAnalytics -- 轻量分析 (事件/会话/性能/卡片浏览)
        |-- register-sw.js    # Service Worker 注册与更新检测
        |
        +-- vendor/
            +-- three.min.js  # Three.js r158 (本地 CDN 备份)
```

### 模块依赖关系

```
                  +-----------------+
                  |    app.js       |
                  | (主入口/协调器)   |
                  +--------+--------+
                           |
            +--------------+--------------+
            |              |              |
            v              v              v
     +------+------+ +-----+------+ +----+-----+
     | scene.js    | | particles  | | ui.js    |
     | SceneManager| | .js        | | UIControl|
     | (Three.js)  | | (Canvas2D) | | ler      |
     +------+------+ +------+-----+ +----+-----+
            |              |              |
            |         +----+-----+        |
            +-------->|layouts.js|<-------+
                      | Layouts  |
                      +----------+

     +----------+     +-----------+     +------------+
     | audio.js |     |analytics  |     |register-sw |
     | Audio    |     |.js        |     |.js         |
     | Manager  |     |Analytics  |     |SW Register |
     +----------+     +-----------+     +------------+
```

---

## :globe_with_meridians: API 参考

所有 API 端点位于 `/api` 路径下，支持 CORS 和 ETag 缓存。

### `GET /api/health`

健康检查端点。

**响应:**

```json
{
  "status": "ok",
  "uptime": 12345.678,
  "timestamp": "2026-06-08T12:00:00.000Z"
}
```

### `GET /api/cards`

获取所有卡片数据。

- **缓存:** `Cache-Control: public, max-age=300` (5 分钟)
- **ETag:** 支持 `If-None-Match` 请求头，命中返回 `304 Not Modified`

**响应:**

```json
{
  "success": true,
  "count": 24,
  "data": [
    {
      "id": 1,
      "title": "安静浅笑",
      "titleEn": "QUIET SMILE",
      "desc": "你在餐桌前安静浅笑的那一刻，时间仿佛静止成了永恒。",
      "emoji": "😊",
      "gradient": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "color": "#667eea",
      "category": "日常",
      "tags": ["微笑", "餐桌", "温暖"],
      "sortWeight": 85
    }
  ]
}
```

### `GET /api/cards/:id`

获取单张卡片详情。

- **参数:** `id` (正整数)
- **缓存:** `Cache-Control: public, max-age=600` (10 分钟)

**成功响应:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "安静浅笑",
    "titleEn": "QUIET SMILE",
    "desc": "你在餐桌前安静浅笑的那一刻，时间仿佛静止成了永恒。",
    "emoji": "😊",
    "gradient": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "color": "#667eea",
    "category": "日常",
    "tags": ["微笑", "餐桌", "温暖"],
    "sortWeight": 85
  }
}
```

**错误响应:**

| 状态码 | 说明 |
|--------|------|
| `400` | 无效的卡片 ID |
| `404` | 卡片不存在 |

---

## :keyboard: 键盘快捷键

| 按键 | 功能 |
|------|------|
| `Arrow Right` / `Arrow Down` / `Space` | 前进 2% |
| `Arrow Left` / `Arrow Up` | 后退 2% |
| `Home` | 跳转到起始 (0%) |
| `End` | 跳转到终点 (100%) |
| `1` - `5` | 切换场景模式 (花海/记忆/星光/时间/花园) |
| `F` | 切换全屏 |
| `Escape` | 关闭弹窗 |
| `?` | 显示快捷键帮助 |

---

## :wrench: 自定义配置

### 卡片数据

修改 `data/cards.json` 自定义卡片内容。每张卡片需要以下字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `number` | 唯一标识 |
| `title` | `string` | 中文标题 |
| `titleEn` | `string` | 英文标题 |
| `desc` | `string` | 诗意描述 |
| `emoji` | `string` | 表情图标 |
| `gradient` | `string` | CSS 渐变值 |
| `color` | `string` | 主色调 (十六进制) |
| `category` | `string` | 分类标签 |
| `tags` | `string[]` | 搜索标签数组 |
| `sortWeight` | `number` | 排序权重 (越大越靠前) |

### 添加新卡片

1. 在 `data/cards.json` 数组中添加新对象
2. 确保 `id` 唯一
3. 重启服务器 (`npm start`)
4. 刷新页面即可看到新卡片

---

## :test_tube: 浏览器兼容性

| 浏览器 | 最低版本 | 状态 |
|--------|---------|------|
| Google Chrome | 90+ | :white_check_mark: 完全支持 |
| Mozilla Firefox | 88+ | :white_check_mark: 完全支持 |
| Apple Safari | 14+ | :white_check_mark: 完全支持 |
| Microsoft Edge | 90+ | :white_check_mark: 完全支持 |
| 移动端浏览器 | 最新版本 | :white_check_mark: 支持 (触摸交互) |

> :warning: **前提条件:** 浏览器必须支持 WebGL。可在 [get.webgl.org](https://get.webgl.org/) 检测。

---

## :hammer_and_wrench: 技术栈

<p align="center">
  <img src="https://img.shields.io/badge/Three.js-3D_Engine-black?logo=threedotjs" alt="Three.js">
  <img src="https://img.shields.io/badge/Express-Server-red?logo=express" alt="Express">
  <img src="https://img.shields.io/badge/Canvas_2D-Particles-orange" alt="Canvas 2D">
  <img src="https://img.shields.io/badge/Web_Audio-SFX-yellow" alt="Web Audio API">
  <img src="https://img.shields.io/badge/WebGL-Rendering-blue" alt="WebGL">
  <img src="https://img.shields.io/badge/PWA-Offline-green" alt="PWA">
</p>

| 层级 | 技术 | 用途 |
|------|------|------|
| 后端 | Node.js + Express | 静态文件服务 + REST API |
| 3D 引擎 | Three.js (r158) + WebGL | 场景渲染、卡片纹理、光照、射线检测 |
| 粒子效果 | Canvas 2D | 爱心粒子 + 光斑粒子 + 爆发效果 |
| 音频 | Web Audio API | 环境音生成 + UI 音效 + 音频可视化 |
| 数据存储 | JSON 文件 | 卡片数据 + REST API |
| 离线支持 | Service Worker + PWA | 离线缓存 + 可安装 |
| 安全 | Express 中间件 | 安全头 + CORS + 错误处理 |

---

## :handshake: 贡献

欢迎贡献! 请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解:

- 开发环境搭建
- 代码风格规范
- Pull Request 流程
- Issue 模板

---

## :scroll: 更新日志

详细的版本变更记录请查看 [CHANGELOG.md](CHANGELOG.md)。

**最新版本: v1.1.0** -- 经过 100 轮优化周期，包含性能提升、安全加固、PWA 支持、音效系统、分析追踪等全面增强。

---

## :page_facing_up: License

本项目基于 [MIT License](LICENSE) 开源。

```
MIT License

Copyright (c) 2026 Eternal Blossoms

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<p align="center">
  <em>:cherry_blossom: 花开花落间，永恒在呼吸 :cherry_blossom:</em>
</p>
