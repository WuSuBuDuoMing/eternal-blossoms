# Contributing to Eternal Blossoms

:cherry_blossom: Thank you for your interest in contributing to **永恒花海 (Eternal Blossoms)**!

This document provides guidelines and instructions for contributing to this project.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Code Style Guidelines](#code-style-guidelines)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Issue Templates](#issue-templates)
- [Coding Conventions](#coding-conventions)

---

## Code of Conduct

Please be respectful and constructive in all interactions. We are committed to providing a welcoming and inclusive experience for everyone.

---

## Getting Started

### Prerequisites

- **Node.js** >= 16.0
- **npm** >= 8.0
- **Git**
- A modern browser with **WebGL** support (Chrome 90+ / Firefox 88+ / Safari 14+ / Edge 90+)

### Quick Setup

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/<your-username>/eternal-blossoms.git
cd eternal-blossoms

# 3. Add the upstream remote
git remote add upstream https://github.com/WuSuBuDuoMing/eternal-blossoms.git

# 4. Install dependencies
npm install

# 5. Start the development server
npm start

# 6. Open in browser
# http://localhost:3002
```

---

## Development Setup

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3002` | Server listening port |
| `CORS_ORIGIN` | `*` | Allowed CORS origin |
| `NODE_ENV` | `development` | Runtime environment |

### Available Scripts

```bash
npm start        # Start production server
npm run dev      # Start development server (alias for npm start)
```

### Verifying Your Setup

1. Open `http://localhost:3002` in your browser
2. You should see the loading screen with the :cherry_blossom: animation
3. After loading, the 3D gallery should render with 24 cards
4. Open browser DevTools and check for errors in the Console

---

## Project Structure

```
02-Eternal-Blossoms/
|-- server.js              # Express server entry point
|-- data/cards.json        # Card data (edit to add/modify cards)
|-- routes/api.js          # REST API routes
+-- public/
    |-- index.html          # Main HTML page
    |-- sw.js               # Service Worker
    |-- manifest.json       # PWA manifest
    |-- css/style.css       # Global styles
    +-- js/
        |-- app.js          # Main entry (initialization + render loop)
        |-- scene.js        # SceneManager (Three.js 3D)
        |-- particles.js    # ParticleSystem (Canvas 2D)
        |-- layouts.js      # Layouts (7 layout mode algorithms)
        |-- ui.js           # UIController (interactions + UI)
        |-- audio.js        # AudioManager (Web Audio)
        |-- analytics.js    # SimpleAnalytics (event tracking)
        |-- register-sw.js  # Service Worker registration
        +-- vendor/
            +-- three.min.js # Three.js (local copy)
```

---

## Code Style Guidelines

### General Principles

- **Clarity over cleverness** -- Write code that is easy to read and understand
- **Single responsibility** -- Each module/class should have one clear purpose
- **Comment intent, not implementation** -- Explain *why*, not *what*
- **Use `'use strict'`** in all JavaScript files

### JavaScript Style

```javascript
// Good: clear, well-commented function
/**
 * Calculate the Fibonacci sphere position for a given index.
 * Used by the GATHER layout mode.
 * @param {number} index - Card index
 * @param {number} total - Total card count
 * @returns {{x: number, y: number, z: number}} 3D position
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

### Formatting

- **Indentation:** 2 spaces (no tabs)
- **Quotes:** Single quotes for strings (`'hello'`)
- **Semicolons:** Always use semicolons
- **Line length:** Aim for 100 characters max; break long lines logically
- **Trailing commas:** Use trailing commas in multi-line arrays and objects
- **Naming:**
  - Classes: `PascalCase` (e.g., `SceneManager`, `ParticleSystem`)
  - Functions/methods: `camelCase` (e.g., `setLoadingProgress`)
  - Constants: `UPPER_SNAKE_CASE` (e.g., `HEART_COUNT`)
  - Private methods: prefix with underscore `_` (e.g., `_resize`)

### CSS Style

```css
/* Good: BEM-like naming, clear structure */
.loader-bar {
  height: 3px;
  background: linear-gradient(90deg, #ff6b9d, #c77dff, #4facfe);
  border-radius: 2px;
  transition: width 0.3s ease;
  will-change: width;
}
```

- Use kebab-case for class names
- Group related properties together (layout, box model, typography, visual, animation)
- Use CSS custom properties for theme values
- Prefer `transform` and `opacity` for animations (GPU-accelerated)

### Comments

- Use JSDoc-style comments for all public methods and classes
- Use section headers for logical groupings:

```javascript
// ================================================================
// Section Name
// ================================================================
```

- Use round markers for milestone references:

```javascript
// R20: Burst particles implementation
```

---

## Making Changes

### Branching Strategy

```bash
# Always branch from the latest main
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name
```

Branch naming conventions:

| Prefix | Use Case |
|--------|----------|
| `feature/` | New features |
| `fix/` | Bug fixes |
| `refactor/` | Code refactoring |
| `docs/` | Documentation changes |
| `perf/` | Performance improvements |
| `style/` | Code style / formatting |

### Commit Messages

Write clear, descriptive commit messages:

```
feat: add search filter for card categories

- Implement category-based filtering in UIController
- Add dropdown selector for card categories
- Update particle hue based on active filter

Closes #42
```

Format:
```
<type>: <short summary>

<optional body with details>

<optional footer with issue references>
```

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `perf`, `test`, `chore`

### Adding a New Card

1. Edit `data/cards.json`
2. Add a new object following the existing schema:

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

3. Ensure `id` is unique
4. Restart the server and verify the card appears

### Adding a New Layout Mode

1. Add a new static method in `public/js/layouts.js`
2. Follow the existing function signature: `(index, total, progress) => { x, y, z, rx, ry, rz, scale }`
3. Register it in the layout switch logic
4. Add corresponding stage name in `ui.js`

---

## Pull Request Process

### Before Submitting

1. **Test your changes** -- Verify the application loads and functions correctly in at least one browser
2. **Check for errors** -- Open DevTools Console and ensure there are no JavaScript errors
3. **Test responsiveness** -- Check on both desktop and mobile viewport sizes
4. **Update documentation** -- If you added features, update README.md
5. **Update CHANGELOG.md** -- Add your changes under the `[Unreleased]` section

### Submitting a PR

1. Push your branch to your fork:

```bash
git push origin feature/your-feature-name
```

2. Open a Pull Request on GitHub against the `main` branch
3. Fill in the PR template with:
   - **What** does this PR do?
   - **Why** is this change needed?
   - **How** was this tested?
   - Screenshots/videos if applicable

### PR Review Checklist

Reviewers will check:

- [ ] Code follows the style guidelines
- [ ] Changes are well-documented with comments
- [ ] No console errors in browser DevTools
- [ ] Application loads and functions correctly
- [ ] Mobile responsiveness is maintained
- [ ] README and CHANGELOG are updated (if applicable)
- [ ] No sensitive data is committed (API keys, passwords, etc.)

### After Merge

- Delete your feature branch
- Pull the latest upstream main

---

## Issue Templates

### Bug Report

When reporting a bug, please include:

```markdown
**Describe the bug:**
A clear description of what the bug is.

**Steps to reproduce:**
1. Go to '...'
2. Scroll to '...'
3. Click on '...'
4. See error

**Expected behavior:**
What you expected to happen.

**Actual behavior:**
What actually happened.

**Screenshots:**
If applicable, add screenshots or screen recordings.

**Environment:**
- Browser: [e.g., Chrome 120, Firefox 121, Safari 17]
- OS: [e.g., Windows 11, macOS Sonoma, Ubuntu 22.04]
- Screen size: [e.g., 1920x1080, mobile]
- Node.js version: [e.g., 18.17.0]

**Console errors:**
Paste any errors from the browser DevTools Console.
```

### Feature Request

When requesting a feature, please include:

```markdown
**Is your feature request related to a problem?**
A clear description of the problem (e.g., "I find it hard to...").

**Describe the solution you'd like:**
A clear description of what you want to happen.

**Describe alternatives you've considered:**
Any alternative solutions or features you've considered.

**Additional context:**
Mockups, screenshots, or references to similar features in other projects.
```

### Question / Discussion

For general questions:

```markdown
**Topic:**
Brief description of your question.

**Context:**
What are you trying to achieve? What have you already tried?

**Code samples:**
If applicable, include relevant code snippets.
```

---

## Coding Conventions

### Module Pattern

Each JavaScript module follows this structure:

1. File-level JSDoc comment describing the module purpose
2. Class declaration with constructor
3. Section headers using `=====` dividers
4. Public methods first, private methods (prefixed with `_`) last
5. Self-contained -- avoid cross-module globals; communicate via callbacks

### Error Handling

```javascript
// Good: graceful error handling with user feedback
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

### Performance

- Use `requestAnimationFrame` for render loops
- Use `will-change` CSS property for animated elements
- Minimize DOM reads in animation loops (cache references)
- Use `CanvasTexture` for Three.js textures (avoids image loading)

### Browser Compatibility

- Target modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Use feature detection, not user-agent detection
- Provide graceful fallbacks for unsupported features (e.g., WebGL)

---

## Questions?

If you have questions about contributing, feel free to:

- Open a [Discussion](https://github.com/WuSuBuDuoMing/eternal-blossoms/discussions) on GitHub
- Open an [Issue](https://github.com/WuSuBuDuoMing/eternal-blossoms/issues) with the `question` label

---

:cherry_blossom: Every contribution, no matter how small, helps the garden grow. Thank you for being part of Eternal Blossoms!
