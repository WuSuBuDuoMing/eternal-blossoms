# Changelog

All notable changes to the **Eternal Blossoms (永恒花海)** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.11.0] - 2026-06-18

### Added
- Enhanced SECURITY.md with supported versions table, severity-based response timeline, security measures documentation, and disclosure policy
- Expanded CODE_OF_CONDUCT.md to full Contributor Covenant v2.1 with enforcement guidelines (Correction, Warning, Temporary Ban, Permanent Ban)
- Vitest test runner integrated into CI pipeline (`npm test` step)

### Changed
- package.json version bumped to 1.11.0
- README.md version badge and latest version reference updated to v1.11.0
- CI workflow test step switched from legacy `tests/test.js` to `vitest run`

---

## [1.10.0] - 2026-06-18

### Added
- Comprehensive JSDoc audit across all server-side route modules (api.js, cards-extra.js, upload.js)
- JSDoc annotations on all public and private methods in scene.js, particles.js, layouts.js, ui.js, audio.js, analytics.js
- File-level JSDoc comments on all JavaScript modules describing purpose and module responsibility

### Changed
- README architecture diagram updated to reflect actual file structure (app-init.js, gestures.js, i18n.js, search.js, share.js, themes.js, perf-monitor.js)

---

## [1.9.0] - 2026-06-18

### Added
- Community documentation suite: CONTRIBUTING.md (bilingual), CODE_OF_CONDUCT.md, SECURITY.md
- GitHub Issue templates (Bug Report, Feature Request) and PR template
- GitHub Sponsors funding configuration (FUNDING.yml)
- CODEOWNERS file for automated code review assignments

### Changed
- README.md overhauled with complete Features, Installation, Usage, Architecture, API Reference, Keyboard Shortcuts, Customization, and Browser Compatibility sections
- MIT LICENSE file verified and confirmed

---

## [1.8.0] - 2026-06-16

### Added
- Code of Conduct (CODE_OF_CONDUCT.md) based on Contributor Covenant v2.1
- GitHub Sponsors funding configuration (FUNDING.yml)
- CODEOWNERS file for code review assignments
- Enhanced Issue and PR templates

## [1.6.0] - 2026-06-14

### Added
- Security policy (SECURITY.md)
- Documentation enhancements
- Open-source best practices

---

## [1.4.0] - 2026-06-14

### Changed
- Local optimization and performance improvements
- CHANGELOG sync across repositories
- npm package published
- Open-source infrastructure improvements

---

## [1.3.0] - 2026-06-11

### Added
- Vitest test framework (`vitest.config.js`, `tests/cards.test.js`, `tests/layouts.test.js`, `tests/api.test.js`)
- `npm test` and `npm run test:watch` scripts
- JSDoc documentation on all main functions across 7 layout modes and 5 scene modes
- Comprehensive scene mode documentation (bloom, memory, starlight, timeline, garden)
- Layout algorithm documentation (ARRIVAL, FAN, GATHER, WAVE, GRID, SPIRAL, DEPART)

### Changed
- `server.js` now exports `app` for testability (`require.main === module` guard)
- Service Worker cache version bumped to 1.3.0
- README badges updated to v1.3.0
- `package.json` version synchronized to 1.3.0

### Removed
- Duplicated scene mode logic from `app.js` (consolidated in `app-init.js`)
- Corrupted test upload cards (IDs 37-39) from `cards.json` — had encoding errors, empty tags, empty descriptions
- Dead `app.js` orchestrator code (~300 lines) — all logic lives in `app-init.js`

### Fixed
- Card data integrity: all 36 cards now have valid tags, descriptions, and proper encoding
- Test suite: 77/77 tests passing (was 76/77 due to empty-tags card)

---

## [1.2.0] - 2026-06-10

### Added
- English README with comprehensive documentation and architecture diagrams
- Chinese README (README.zh-CN.md)
- GitHub Actions CI workflow (validate + multi-version build)
- Issue templates (Bug Report, Feature Request)
- Pull Request template
- MIT LICENSE file
- CONTRIBUTING.md (bilingual English/Chinese)
- CHANGELOG.md (this file)
- npm package (`eternal-blossoms`) published to npm registry
- npm publish workflow (publish.yml)
- Website and Topics added to GitHub repository
- Multi-platform installation guide (macOS, Linux, Windows, Docker, PWA)

### Changed
- Repository made public for open-source community
- All commit authors unified to WuSuBuDuoMing

---

## [1.1.0] - 2026-06-08

### :star: Major -- 100 Round Optimization Cycle

A comprehensive 100-round optimization cycle transforming the project from a basic 3D gallery into a production-ready, feature-rich web application.

#### :sparkles: New Features

- **7 Layout Modes** (upgraded from 6): Added WAVE (正弦波动) layout alongside ARRIVAL, FAN, GATHER, GRID, SPIRAL, DEPART
- **5 Scene Modes**: bloom (花海漫游), memory (记忆照片墙), starlight (星光告白), timeline (时间长廊), garden (永恒花园) -- each with unique color palettes and particle hues
- **Canvas 2D Particle System**: 90 heart particles + 60 glow particles with continuous falling, swaying, rotating, and fading animations
- **Burst Particles (R20)**: Particle burst effect on card interactions
- **Constant Glow Mode**: Toggle button for enhanced particle glow effects
- **Web Audio System (R35-R38)**:
  - Core AudioManager with AudioContext lazy initialization
  - Ambient sound generator with oscillator modulation
  - UI sound effects (pure oscillator synthesis)
  - Music visualizer data via AnalyserNode
- **PWA Support (R39-R42)**:
  - Service Worker with offline caching
  - manifest.json for installable web app
  - Service Worker registration and update detection
- **Search & Filter**: Keyword search across card titles, descriptions, tags, and categories
- **Card Sorting**: Sort by weight (sortWeight) or alphabetical order
- **Theme System (R22)**: 6 color themes synchronized with scene modes
- **Internationalization (i18n)**: Chinese / English bilingual UI
- **Fullscreen Mode**: Toggle fullscreen via button or `F` key
- **Smart Scroll Snapping**: Auto-snap to stage boundaries on slow scrolling
- **Keyboard Shortcuts Help Overlay**: Press `?` to show all available shortcuts
- **Touch Gesture Support**: Swipe to switch scenes, pinch to zoom on mobile
- **SimpleAnalytics (R43-R46)**: Lightweight privacy-friendly analytics module
  - Event tracking
  - Session tracking
  - Card view tracking
  - Performance metrics collection

#### :art: UI/UX Improvements

- **Loading Screen**: Animated loader with progress bar and status text
- **Progress Bar**: Gradient-colored scroll progress indicator at top
- **Floating Poems**: Romantic poetry lines appear on scene transitions
- **Stage Names**: Bilingual stage names with percentage display
- **Card Modal**: Detailed card popup with emoji, titles, description, and gradient bar
- **Responsive Design**: Full mobile/tablet/desktop support
- **Smooth Transitions**: Eased animation between all layout modes

#### :lock: Security Enhancements

- **Security Headers Middleware (R1)**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy
- **CORS Configuration**: Configurable via `CORS_ORIGIN` environment variable
- **Request Size Limit**: JSON body parser limited to 1MB
- **Input Validation**: Card ID validation (integer, positive)

#### :zap: Performance Optimizations

- **Request Logging Middleware (R2)**: Per-request timing with console output
- **ETag Caching**: API responses support `If-None-Match` / `304 Not Modified`
- **Cache-Control Headers**: `/api/cards` (5 min), `/api/cards/:id` (10 min)
- **DPR-Aware Canvas**: Particle canvas adapts to device pixel ratio
- **Glow Sprite Pre-rendering (R19)**: Pre-rendered glow sprite for particle system
- **DOM Dirty Checking**: UI updates skip redundant DOM writes
- **Global Error Handler (R3)**: Catches and logs unhandled server errors

#### :building_construction: Architecture

- **EventBus Pattern**: Lightweight pub/sub event system for module communication
- **Centralized State Management**: Single source of truth with reactive state changes
- **Modular Architecture**: Clean separation -- scene, particles, layouts, UI, audio, analytics
- **Layout Algorithm Library**: 7 mathematical layout functions with smooth interpolation and easing

#### :memo: Documentation

- Comprehensive README with architecture diagrams, API reference, and screenshots
- CHANGELOG.md with full version history
- CONTRIBUTING.md with development guidelines

---

## [1.0.0] - 2026-05-01

### :tada: Initial Release

The first stable release of Eternal Blossoms -- a Three.js-powered immersive 3D photo card gallery.

#### Features

- **6 3D Layout Modes**: ARRIVAL (晨曦初临), FAN (卷帘展开), GATHER (同心汇聚), GRID (网格呼吸), SPIRAL (螺旋花涡), DEPART (永恒归宿)
- **Three.js Scene**: 3D card gallery with camera, lighting, fog, and CanvasTexture rendering
- **Canvas 2D Particles**: 70 heart particles + 50 glow particles with falling animation
- **24 Preset Cards**: Each with emoji, bilingual titles, poetic descriptions, and gradient colors
- **Scroll Navigation**: Mouse wheel controls scene progress from 0% to 100%
- **Keyboard Navigation**: Arrow keys and Space for forward/backward
- **Mouse Drag**: Click and drag to rotate the 3D camera
- **Double-click Cards**: Raycasting-based card detection with detail modal
- **Touch Support**: Swipe gestures and pinch-to-zoom for mobile devices
- **Loading Screen**: Animated loader with progress bar
- **Poetry Display**: Romantic lines fade in on scene transitions
- **Constant Glow Toggle**: Enhanced particle glow effect
- **Express Backend**: Static file serving + REST API for card data
- **API Endpoints**: `GET /api/cards` and `GET /api/cards/:id`

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 1.11.0 | 2026-06-18 | Community docs enhancements, JSDoc audit, CI branch fix, version bump |
| 1.10.0 | 2026-06-18 | Comprehensive JSDoc audit, README architecture sync |
| 1.9.0 | 2026-06-18 | Community docs suite, README overhaul, GitHub templates |
| 1.8.0 | 2026-06-16 | Code of Conduct, Sponsors funding, CODEOWNERS, enhanced templates |
| 1.6.0 | 2026-06-14 | Security policy, documentation enhancements, open-source best practices |
| 1.4.0 | 2026-06-14 | Local optimization, CHANGELOG sync, npm package, open-source infrastructure |
| 1.3.0 | 2026-06-11 | Quality optimization: vitest, code dedup, JSDoc, dead code cleanup |
| 1.2.0 | 2026-06-10 | Open-source release: English docs, CI, templates, LICENSE, npm publish |
| 1.1.0 | 2026-06-08 | 100-round optimization: PWA, audio, analytics, security, i18n, themes, search, 7 layouts |
| 1.0.0 | 2026-05-01 | Initial release: 3D gallery with 6 layouts, particles, 24 cards, Express API |
