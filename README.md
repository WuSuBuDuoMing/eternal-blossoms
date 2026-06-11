# :cherry_blossom: Eternal Blossoms :cherry_blossom:

<h3 align="center">ETERNAL BLOSSOMS &mdash; AN IMMERSIVE 3D PHOTO CARD GALLERY</h3>

<p align="center">
  <em>An immersive 3D photo card gallery built with Three.js.<br>Weaving eternal memories with particles and light.</em>
</p>

<p align="center">
  <a href="https://github.com/WuSuBuDuoMing/eternal-blossoms/blob/main/README.zh-CN.md">Chinese (中文)</a> &nbsp;|&nbsp; English
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT">
  <img src="https://img.shields.io/badge/Node.js-%3E%3D16.0-green.svg" alt="Node.js >= 16">
  <img src="https://img.shields.io/badge/Three.js-r158-black?logo=threedotjs&logoColor=white" alt="Three.js r158">
  <img src="https://img.shields.io/badge/Express-4.18-red?logo=express&logoColor=white" alt="Express 4.18">
  <img src="https://img.shields.io/badge/WebGL-Required-orange" alt="WebGL Required">
  <img src="https://img.shields.io/badge/PWA-Enabled-purple" alt="PWA Enabled">
  <img src="https://img.shields.io/badge/stable-v1.3.0-blue" alt="Version">
</p>

---

## :sparkles: Features

### :camera: 3D Layouts & Scenes

| Feature | Description |
|---------|-------------|
| :cyclone: **7 Layout Modes** | ARRIVAL, FAN, GATHER, WAVE, GRID, SPIRAL, DEPART &mdash; smooth transitions via scrolling |
| :art: **5 Scene Modes** | bloom (Blossom Walk), memory (Memory Wall), starlight (Starlight Confession), timeline (Time Corridor), garden (Eternal Garden) &mdash; each with unique color palettes and atmosphere |
| :sparkling_heart: **Canvas 2D Particle System** | 90 pink heart particles + 60 golden sparkle particles with continuous falling, swaying, rotation, and fade animations; supports Constant Glow mode |
| :frame_photo: **CanvasTexture Cards** | Card information rendered as Three.js textures &mdash; rounded borders, emoji, bilingual titles, and descriptions |

### :video_game: Interaction & Controls

| Input Method | Description |
|--------------|-------------|
| :mouse: Scroll Wheel | Controls scene progress transitions (with intelligent snapping) |
| :point_up_2: Mouse Drag | 3D perspective rotation |
| :mag: Pinch to Zoom | Touchscreen dual-finger camera zoom |
| :point_down: Double-tap Card | Opens card detail modal |
| :keyboard: Keyboard Shortcuts | Arrow keys / space / number keys / fullscreen (see table below) |
| :point_up: Touch Gestures | Swipe to navigate + pinch to zoom |
| :mag_right: Search & Filter | Search and filter cards by keyword, category, and tags |
| :closed_book: Card Sorting | Sort by `sortWeight` or alphabetically |

### :gem: Advanced Features

| Feature | Technology |
|---------|------------|
| :performing_arts: **Theme System** | 6 themes (bloom / memory / starlight / timeline / garden + default) &mdash; particle colors sync with scene transitions |
| :globe_with_meridians: **Internationalization (i18n)** | Chinese / English bilingual support |
| :iphone: **PWA Support** | Service Worker offline caching, installable to home screen |
| :sound: **Web Audio** | Ambient sound generation + UI interaction SFX + music visualization (AnalyserNode) |
| :chart_with_upwards_trend: **Performance Monitoring** | FPS / memory / load-time tracking, lightweight SimpleAnalytics integration |
| :lock: **Security Headers** | X-Content-Type-Options, X-Frame-Options, XSS Protection, CSP |
| :electric_plug: **ETag Caching** | API responses support `304 Not Modified` |

---

## :camera_flash: Screenshots

> Screenshots placeholder &mdash; replace with actual screenshots.

| Blossom Walk | Memory Wall | Starlight Confession |
|:---:|:---:|:---:|
| ![bloom](screenshots/bloom.png) | ![memory](screenshots/memory.png) | ![starlight](screenshots/starlight.png) |

| Time Corridor | Eternal Garden | Card Detail Modal |
|:---:|:---:|:---:|
| ![timeline](screenshots/timeline.png) | ![garden](screenshots/garden.png) | ![modal](screenshots/modal.png) |

---

## :rocket: Quick Start

### Prerequisites

- **Node.js** >= 16.0
- **npm** >= 8.0
- A modern browser with **WebGL** support (Chrome 90+ / Firefox 88+ / Safari 14+ / Edge 90+)

### Installation & Running

```bash
# 1. Clone the repository
git clone https://github.com/WuSuBuDuoMing/eternal-blossoms.git
cd eternal-blossoms

# 2. Install dependencies
npm install

# 3. Start the server
npm start

# 4. Open in your browser
open http://localhost:3002
```

### Development Mode

```bash
npm run dev
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3002` | Server listen port |
| `CORS_ORIGIN` | `*` | Allowed CORS origins |
| `NODE_ENV` | `development` | Runtime environment (`production` / `development`) |

---

## :building_construction: Project Architecture

```
02-Eternal-Blossoms/
|
|-- package.json              # Project configuration & dependency declarations
|-- server.js                 # Express server entry point (security headers + logging + CORS + error handling)
|-- README.md                 # This file (English)
|-- README.zh-CN.md           # Chinese README
|-- CHANGELOG.md              # Version changelog
|-- CONTRIBUTING.md           # Contribution guidelines
|
|-- data/
|   +-- cards.json            # 24 preset card data (id/title/desc/emoji/gradient/tags)
|
|-- routes/
|   +-- api.js                # RESTful API routes (/api/cards, /api/cards/:id, /api/health)
|
+-- public/
    |-- index.html            # Main page (loading screen + Canvas layer + UI overlay + modals)
    |-- sw.js                 # Service Worker (offline caching)
    |-- manifest.json         # PWA manifest file
    |
    |-- css/
    |   +-- style.css         # Global styles (layout/animations/responsive/dark theme)
    |
    +-- js/
        |-- app.js            # Main entry (data loading + subsystem init + render loop + state management)
        |-- scene.js          # SceneManager -- Three.js 3D scene (camera/lighting/card textures/raycasting)
        |-- particles.js      # ParticleSystem -- Canvas 2D particles (hearts/sparkles/burst effects)
        |-- layouts.js        # Layouts -- 7 layout mode math algorithms (ARRIVAL ~ DEPART)
        |-- ui.js             # UIController -- Interaction controls (scroll/keyboard/touch/modals/progress/poetry/themes)
        |-- audio.js          # AudioManager -- Web Audio API (ambient sound/SFX/visualization)
        |-- analytics.js      # SimpleAnalytics -- Lightweight analytics (events/sessions/performance/card views)
        |-- register-sw.js    # Service Worker registration & update detection
        |
        +-- vendor/
            +-- three.min.js  # Three.js r158 (local CDN fallback)
```

### Module Dependency Graph

```
                  +-----------------+
                  |    app.js       |
                  | (Main Entry /   |
                  |  Orchestrator)  |
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

## :globe_with_meridians: API Reference

All API endpoints are located under the `/api` path with CORS and ETag caching support.

### `GET /api/health`

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "uptime": 12345.678,
  "timestamp": "2026-06-08T12:00:00.000Z"
}
```

### `GET /api/cards`

Retrieve all card data.

- **Cache:** `Cache-Control: public, max-age=300` (5 minutes)
- **ETag:** Supports `If-None-Match` request header; returns `304 Not Modified` on cache hit

**Response:**

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
      "emoji": "\u{1f60a}",
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

Retrieve a single card's details.

- **Parameters:** `id` (positive integer)
- **Cache:** `Cache-Control: public, max-age=600` (10 minutes)

**Success Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "安静浅笑",
    "titleEn": "QUIET SMILE",
    "desc": "你在餐桌前安静浅笑的那一刻，时间仿佛静止成了永恒。",
    "emoji": "\u{1f60a}",
    "gradient": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "color": "#667eea",
    "category": "日常",
    "tags": ["微笑", "餐桌", "温暖"],
    "sortWeight": 85
  }
}
```

**Error Responses:**

| Status Code | Description |
|-------------|-------------|
| `400` | Invalid card ID |
| `404` | Card not found |

---

## :keyboard: Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Arrow Right` / `Arrow Down` / `Space` | Advance 2% |
| `Arrow Left` / `Arrow Up` | Go back 2% |
| `Home` | Jump to start (0%) |
| `End` | Jump to end (100%) |
| `1` - `5` | Switch scene mode (bloom / memory / starlight / timeline / garden) |
| `F` | Toggle fullscreen |
| `Escape` | Close modal |
| `?` | Show keyboard shortcuts help |

---

## :wrench: Customization

### Card Data

Edit `data/cards.json` to customize card content. Each card requires the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Unique identifier |
| `title` | `string` | Chinese title |
| `titleEn` | `string` | English title |
| `desc` | `string` | Poetic description |
| `emoji` | `string` | Emoji icon |
| `gradient` | `string` | CSS gradient value |
| `color` | `string` | Primary color (hex) |
| `category` | `string` | Category label |
| `tags` | `string[]` | Search tag array |
| `sortWeight` | `number` | Sort weight (higher = more prominent) |

### Adding New Cards

1. Add a new object to the `data/cards.json` array
2. Ensure the `id` is unique
3. Restart the server (`npm start`)
4. Refresh the page to see the new card

---

## :test_tube: Browser Compatibility

| Browser | Minimum Version | Status |
|---------|-----------------|--------|
| Google Chrome | 90+ | :white_check_mark: Fully supported |
| Mozilla Firefox | 88+ | :white_check_mark: Fully supported |
| Apple Safari | 14+ | :white_check_mark: Fully supported |
| Microsoft Edge | 90+ | :white_check_mark: Fully supported |
| Mobile Browsers | Latest version | :white_check_mark: Supported (touch interactions) |

> :warning: **Requirement:** The browser must support WebGL. Check at [get.webgl.org](https://get.webgl.org/).

---

## :hammer_and_wrench: Tech Stack

<p align="center">
  <img src="https://img.shields.io/badge/Three.js-3D_Engine-black?logo=threedotjs" alt="Three.js">
  <img src="https://img.shields.io/badge/Express-Server-red?logo=express" alt="Express">
  <img src="https://img.shields.io/badge/Canvas_2D-Particles-orange" alt="Canvas 2D">
  <img src="https://img.shields.io/badge/Web_Audio-SFX-yellow" alt="Web Audio API">
  <img src="https://img.shields.io/badge/WebGL-Rendering-blue" alt="WebGL">
  <img src="https://img.shields.io/badge/PWA-Offline-green" alt="PWA">
</p>

| Layer | Technology | Purpose |
|-------|------------|---------|
| Backend | Node.js + Express | Static file serving + REST API |
| 3D Engine | Three.js (r158) + WebGL | Scene rendering, card textures, lighting, raycasting |
| Particle Effects | Canvas 2D | Heart particles + sparkle particles + burst effects |
| Audio | Web Audio API | Ambient sound generation + UI SFX + audio visualization |
| Data Store | JSON File | Card data + REST API |
| Offline Support | Service Worker + PWA | Offline caching + installable |
| Security | Express Middleware | Security headers + CORS + error handling |

---

## :handshake: Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on:

- Setting up the development environment
- Code style guidelines
- Pull request process
- Issue templates

---

## :scroll: Changelog

For a detailed version history, see [CHANGELOG.md](CHANGELOG.md).

**Latest version: v1.3.0** &mdash; Quality optimization: vitest framework, code deduplication, comprehensive JSDoc, scene/layout documentation, dead code cleanup.

---

## :page_facing_up: License

This project is licensed under the [MIT License](LICENSE).

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
  <a href="https://github.com/WuSuBuDuoMing/eternal-blossoms">GitHub Repository</a>
</p>

<p align="center">
  <em>:cherry_blossom: Amid the falling petals, eternity breathes. :cherry_blossom:</em>
</p>
