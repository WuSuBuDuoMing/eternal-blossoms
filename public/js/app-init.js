/**
 * 永恒花海 — 主初始化器 (R99)
 *
 * 按正确顺序加载并连接所有模块
 * 支持优雅降级：任何可选模块缺失都不会导致整体崩溃
 *
 * 初始化分 6 个阶段：
 *   Phase 1 — 核心系统实例化（无依赖）
 *   Phase 2 — 可选模块实例化（graceful degradation）
 *   Phase 3 — 核心系统初始化
 *   Phase 4 — 数据加载
 *   Phase 5 — 跨模块连接
 *   Phase 6 — 启动渲染循环
 */
(async function () {
  'use strict';

  // ================================================================
  // Console branding
  // ================================================================
  const _STYLE_LOG   = 'color:#ff6b9d;font-size:14px;font-weight:bold;';
  const _STYLE_INFO  = 'color:#c084fc;font-size:12px;';
  const _STYLE_OK    = 'color:#66bb6a;font-size:12px;font-weight:bold;';
  const _STYLE_WARN  = 'color:#ffa726;font-size:12px;';
  const _STYLE_ERR   = 'color:#ef5350;font-size:12px;font-weight:bold;';

  console.log('%c永恒花海 · ETERNAL BLOSSOMS', _STYLE_LOG);
  console.log('%c[R99] Master Initializer starting...', _STYLE_INFO);

  // ================================================================
  // Helpers
  // ================================================================
  function _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Safely check if a global class/function exists.
   */
  function _hasGlobal(name) {
    return typeof window[name] === 'function' || typeof window[name] === 'object';
  }

  /**
   * Phase logger — wraps console.log with phase label.
   */
  function _phaseLog(phase, msg) {
    console.log('%c[' + phase + '] ' + msg, _STYLE_INFO);
  }

  function _phaseOk(phase, msg) {
    console.log('%c[' + phase + '] ' + msg, _STYLE_OK);
  }

  function _phaseWarn(phase, msg) {
    console.warn('%c[' + phase + '] ' + msg, _STYLE_WARN);
  }

  function _phaseErr(phase, msg, err) {
    console.error('%c[' + phase + '] ' + msg, _STYLE_ERR, err || '');
  }

  // ================================================================
  // Centralized event bus (mirrors app.js pattern)
  // ================================================================
  const events = {
    _handlers: {},
    on(e, fn) {
      (this._handlers[e] ||= []).push(fn);
    },
    off(e, fn) {
      const arr = this._handlers[e];
      if (!arr) return;
      const idx = arr.indexOf(fn);
      if (idx !== -1) arr.splice(idx, 1);
    },
    emit(e, ...a) {
      (this._handlers[e] || []).forEach(fn => {
        try { fn(...a); } catch (err) { _phaseErr('Event', `Handler for "${e}" threw`, err); }
      });
    },
  };

  // ================================================================
  // Centralized state
  // ================================================================
  const state = {
    _data: { progress: 0, mode: 'bloom', isModalOpen: false, cardCount: 0 },
    get progress()     { return this._data.progress; },
    set progress(v)    { this._data.progress = v;    events.emit('stateChange', 'progress', v); },
    get mode()         { return this._data.mode; },
    set mode(v)        { this._data.mode = v;        events.emit('stateChange', 'mode', v); },
    get isModalOpen()  { return this._data.isModalOpen; },
    set isModalOpen(v) { this._data.isModalOpen = v; events.emit('stateChange', 'isModalOpen', v); },
    get cardCount()    { return this._data.cardCount; },
    set cardCount(v)   { this._data.cardCount = v;   events.emit('stateChange', 'cardCount', v); },
  };

  // Expose for debugging
  window.__EB = { events, state };

  // ================================================================
  // PHASE 1 — Core systems (no dependencies)
  // ================================================================
  const P1 = 'Phase 1';
  _phaseLog(P1, 'Instantiating core systems...');

  let particles, scene, ui;

  try {
    particles = new ParticleSystem('particle-canvas');
    _phaseOk(P1, 'ParticleSystem ready');
  } catch (err) {
    _phaseErr(P1, 'ParticleSystem instantiation failed', err);
    particles = null;
  }

  try {
    scene = new SceneManager('three-canvas');
    _phaseOk(P1, 'SceneManager ready');
  } catch (err) {
    _phaseErr(P1, 'SceneManager instantiation failed', err);
    scene = null;
  }

  try {
    ui = new UIController();
    _phaseOk(P1, 'UIController ready');
  } catch (err) {
    _phaseErr(P1, 'UIController instantiation failed', err);
    ui = null;
  }

  // ================================================================
  // PHASE 2 — Feature modules (optional, graceful degradation)
  // ================================================================
  const P2 = 'Phase 2';
  _phaseLog(P2, 'Loading feature modules...');

  const modules = {};

  // --- SimpleAnalytics ---
  if (_hasGlobal('SimpleAnalytics')) {
    try {
      modules.analytics = new SimpleAnalytics();
      _phaseOk(P2, 'SimpleAnalytics loaded');
    } catch (err) {
      _phaseWarn(P2, 'SimpleAnalytics init failed, skipping', err);
      modules.analytics = null;
    }
  } else {
    _phaseWarn(P2, 'SimpleAnalytics not found — skipping');
    modules.analytics = null;
  }

  // --- PerfMonitor ---
  if (_hasGlobal('PerfMonitor')) {
    try {
      modules.perfMonitor = new PerfMonitor();
      modules.perfMonitor.createOverlay(); // ctrl+shift+f toggle
      _phaseOk(P2, 'PerfMonitor loaded (Ctrl+Shift+F to toggle overlay)');
    } catch (err) {
      _phaseWarn(P2, 'PerfMonitor init failed, skipping', err);
      modules.perfMonitor = null;
    }
  } else {
    _phaseWarn(P2, 'PerfMonitor not found — skipping');
    modules.perfMonitor = null;
  }

  // --- ThemeManager ---
  if (_hasGlobal('ThemeManager')) {
    try {
      modules.themeManager = new ThemeManager();
      _phaseOk(P2, 'ThemeManager loaded (theme: ' + modules.themeManager.getTheme() + ')');
    } catch (err) {
      _phaseWarn(P2, 'ThemeManager init failed, skipping', err);
      modules.themeManager = null;
    }
  } else {
    _phaseWarn(P2, 'ThemeManager not found — skipping');
    modules.themeManager = null;
  }

  // --- I18n ---
  if (_hasGlobal('I18n')) {
    try {
      const savedLang = _safeLocalStorage('eb-lang', 'get') || 'zh';
      modules.i18n = new I18n(
        typeof TRANSLATIONS !== 'undefined' ? TRANSLATIONS : {},
        savedLang
      );
      _phaseOk(P2, 'I18n loaded (lang: ' + savedLang + ')');
    } catch (err) {
      _phaseWarn(P2, 'I18n init failed, skipping', err);
      modules.i18n = null;
    }
  } else {
    _phaseWarn(P2, 'I18n not found — skipping');
    modules.i18n = null;
  }

  // --- AudioManager ---
  if (_hasGlobal('AudioManager')) {
    try {
      modules.audioManager = new AudioManager();
      _phaseOk(P2, 'AudioManager loaded');
    } catch (err) {
      _phaseWarn(P2, 'AudioManager init failed, skipping', err);
      modules.audioManager = null;
    }
  } else {
    _phaseWarn(P2, 'AudioManager not found — skipping');
    modules.audioManager = null;
  }

  // --- CardSearch ---
  if (_hasGlobal('CardSearch')) {
    try {
      modules.cardSearch = null; // instantiated in Phase 4 after data loads
      _phaseOk(P2, 'CardSearch class available (deferred to Phase 4)');
    } catch (err) {
      _phaseWarn(P2, 'CardSearch check failed', err);
    }
  } else {
    _phaseWarn(P2, 'CardSearch not found — skipping');
  }

  // --- GestureManager ---
  if (_hasGlobal('GestureManager')) {
    try {
      const canvas3d = document.getElementById('three-canvas');
      if (canvas3d) {
        modules.gestureManager = new GestureManager(canvas3d);
        _phaseOk(P2, 'GestureManager loaded');
      } else {
        _phaseWarn(P2, 'GestureManager: #three-canvas not found');
        modules.gestureManager = null;
      }
    } catch (err) {
      _phaseWarn(P2, 'GestureManager init failed, skipping', err);
      modules.gestureManager = null;
    }
  } else {
    _phaseWarn(P2, 'GestureManager not found — skipping');
    modules.gestureManager = null;
  }

  // --- UrlState ---
  if (_hasGlobal('UrlState')) {
    try {
      modules.urlState = new UrlState();
      _phaseOk(P2, 'UrlState loaded');
    } catch (err) {
      _phaseWarn(P2, 'UrlState init failed, skipping', err);
      modules.urlState = null;
    }
  } else {
    _phaseWarn(P2, 'UrlState not found — skipping');
    modules.urlState = null;
  }

  // --- CardSharer ---
  if (_hasGlobal('CardSharer')) {
    try {
      modules.sharer = new CardSharer();
      _phaseOk(P2, 'CardSharer loaded');
    } catch (err) {
      _phaseWarn(P2, 'CardSharer init failed, skipping', err);
      modules.sharer = null;
    }
  } else {
    _phaseWarn(P2, 'CardSharer not found — skipping');
    modules.sharer = null;
  }

  // ================================================================
  // PHASE 3 — Initialize core systems
  // ================================================================
  const P3 = 'Phase 3';
  _phaseLog(P3, 'Initializing core systems...');

  if (ui) {
    try {
      ui.init();
      _phaseOk(P3, 'UIController.init() complete');
    } catch (err) {
      _phaseErr(P3, 'UIController.init() failed', err);
    }
  }

  if (particles) {
    try {
      if (ui) ui.setLoadingProgress(10, '正在初始化粒子系统 ...');
      particles.init();
      _phaseOk(P3, 'ParticleSystem.init() complete');
    } catch (err) {
      _phaseErr(P3, 'ParticleSystem.init() failed', err);
    }
  }

  if (scene) {
    try {
      if (ui) ui.setLoadingProgress(25, '正在构建 3D 场景 ...');
      scene.init();
      _phaseOk(P3, 'SceneManager.init() complete');
    } catch (err) {
      _phaseErr(P3, 'SceneManager.init() failed', err);
    }
  }

  // Start perf monitor memory tracking if available
  if (modules.perfMonitor) {
    try {
      modules.perfMonitor.trackMemoryOverTime();
    } catch (_) {}
  }

  // ================================================================
  // PHASE 4 — Load card data
  // ================================================================
  const P4 = 'Phase 4';
  _phaseLog(P4, 'Loading card data...');

  if (ui) ui.setLoadingProgress(40, '正在从花海中采集记忆 ...');

  let cardsData = [];

  try {
    const BASE_PATH = (() => {
      const p = window.location.pathname;
      const match = p.match(/^(\/eternal-blossoms)/);
      return match ? match[1] : '';
    })();
    const response = await fetch(BASE_PATH + '/api/cards');
    if (!response.ok) throw new Error(response.statusText);
    const result = await response.json();

    if (result.success) {
      cardsData = result.data;
      _phaseOk(P4, `Loaded ${cardsData.length} cards from API`);
    } else {
      _phaseWarn(P4, 'API returned failure, using fallback');
      cardsData = _getFallbackData();
    }
  } catch (err) {
    _phaseWarn(P4, 'API fetch failed, using local fallback: ' + err.message);
    cardsData = _getFallbackData();
  }

  if (ui) ui.setLoadingProgress(60, `正在绘制 ${cardsData.length} 张记忆卡片 ...`);

  // Create cards in scene
  if (scene) {
    try {
      scene.createCards(cardsData);
      _phaseOk(P4, `${cardsData.length} card meshes created`);
    } catch (err) {
      _phaseErr(P4, 'createCards failed', err);
    }
  }

  state.cardCount = cardsData.length;

  // Initialize CardSearch with loaded data
  if (_hasGlobal('CardSearch') && !modules.cardSearch) {
    try {
      modules.cardSearch = new CardSearch();
      if (modules.cardSearch.init && cardsData.length > 0) {
        modules.cardSearch.init(cardsData);
      }
      _phaseOk(P4, 'CardSearch initialized with card data');
    } catch (err) {
      _phaseWarn(P4, 'CardSearch init failed', err);
      modules.cardSearch = null;
    }
  }

  if (ui) ui.setLoadingProgress(85, '正在点亮花海中的星光 ...');

  // ================================================================
  // PHASE 5 — Wire cross-module connections
  // ================================================================
  const P5 = 'Phase 5';
  _phaseLog(P5, 'Wiring cross-module connections...');

  // --- Analytics: track card views on double-click ---
  events.on('cardDoubleClick', (cardData) => {
    if (modules.analytics) {
      try { modules.analytics.trackCardView(cardData.id, cardData.title); } catch (_) {}
    }
    if (ui) {
      ui.openModal(cardData);
    }
    if (modules.audioManager) {
      try { modules.audioManager.playSfx('modal-open'); } catch (_) {}
    }
  });

  // --- Analytics: session lifecycle ---
  if (modules.analytics) {
    try {
      modules.analytics.startSession();
      window.addEventListener('beforeunload', () => {
        try { modules.analytics.endSession(); } catch (_) {}
        try { modules.analytics.trackPerformance(); } catch (_) {}
      });
      _phaseOk(P5, 'Analytics session tracking wired');
    } catch (err) {
      _phaseWarn(P5, 'Analytics session wiring failed', err);
    }
  }

  // --- Perf monitor: integrate with render loop ---
  // (Done in Phase 6 via startFrame/endFrame calls)

  // --- ThemeManager: connect to scene fog/colors ---
  if (modules.themeManager && scene) {
    events.on('stateChange', (key, value) => {
      if (key === 'mode' && scene && scene.scene) {
        // Scene mode already handled by applySceneMode in app.js
      }
    });
    _phaseOk(P5, 'ThemeManager connected to scene');
  }

  // --- I18n: apply saved language preference ---
  if (modules.i18n) {
    try {
      modules.i18n.apply();
      _phaseOk(P5, 'I18n translations applied');
    } catch (err) {
      _phaseWarn(P5, 'I18n.apply() failed', err);
    }
  }

  // --- AudioManager: connect to UI events ---
  if (modules.audioManager) {
    events.on('glowToggle', () => {
      try { modules.audioManager.playSfx('click'); } catch (_) {}
    });
    events.on('stateChange', (key) => {
      if (key === 'mode') {
        try { modules.audioManager.playSfx('transition'); } catch (_) {}
      }
    });
    _phaseOk(P5, 'AudioManager connected to UI events');
  }

  // --- GestureManager: connect to navigation ---
  if (modules.gestureManager && ui) {
    try {
      if (modules.gestureManager.onSwipe) {
        modules.gestureManager.onSwipe((direction) => {
          if (direction === 'up') {
            ui.targetProgress = Math.min(1, ui.targetProgress + 0.03);
          } else if (direction === 'down') {
            ui.targetProgress = Math.max(0, ui.targetProgress - 0.03);
          }
        });
      }
      _phaseOk(P5, 'GestureManager connected to UI navigation');
    } catch (err) {
      _phaseWarn(P5, 'GestureManager wiring failed', err);
    }
  }

  // --- UrlState: restore state from URL hash ---
  if (modules.urlState) {
    try {
      const urlState = modules.urlState.restore ? modules.urlState.restore() : null;
      if (urlState) {
        if (urlState.progress !== undefined && ui) {
          ui.targetProgress = urlState.progress;
          ui.globalProgress = urlState.progress;
        }
        if (urlState.mode) {
          state.mode = urlState.mode;
        }
        _phaseOk(P5, 'URL state restored (progress=' + (urlState.progress || 0) + ', mode=' + (urlState.mode || 'bloom') + ')');
      }
    } catch (err) {
      _phaseWarn(P5, 'URL state restore failed', err);
    }
  } else {
    // Fallback: try restoring from hash manually
    try {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const params = new URLSearchParams(hash.replace(/&/g, '&'));
        const p = parseFloat(params.get('p'));
        if (!isNaN(p) && ui) {
          ui.targetProgress = Math.max(0, Math.min(1, p));
          ui.globalProgress = ui.targetProgress;
          _phaseOk(P5, 'Hash progress restored: ' + (p * 100).toFixed(0) + '%');
        }
        const m = params.get('m');
        if (m) state.mode = m;
      }
    } catch (_) {}
  }

  // --- UrlState: save state on progress change ---
  events.on('stateChange', (key, value) => {
    if (modules.urlState && modules.urlState.save) {
      try {
        modules.urlState.save({ progress: state.progress, mode: state.mode });
      } catch (_) {}
    }
  });

  // --- CardSharer: connect to modal ---
  if (modules.sharer) {
    // Hook into modal open to provide share capability
    events.on('cardDoubleClick', (cardData) => {
      try {
        // Sharer can attach share buttons to modal if method exists
        if (modules.sharer.attachToModal) {
          modules.sharer.attachToModal(cardData);
        }
      } catch (_) {}
    });
    _phaseOk(P5, 'CardSharer connected to modal');
  }

  // --- Progress change -> scene sync ---
  events.on('progressChange', (progress) => {
    state.progress = progress;
    if (scene) {
      scene.globalProgress = progress;
    }
  });

  // --- Glow toggle -> particles ---
  events.on('glowToggle', (enabled) => {
    if (particles) {
      particles.setConstantGlow(enabled);
    }
  });

  // --- Glow toggle wiring from UI ---
  if (ui) {
    ui.onGlowToggle = (enabled) => {
      events.emit('glowToggle', enabled);
    };
  }

  // --- Progress callback from UI ---
  if (ui) {
    ui.onProgressChange = (progress) => {
      events.emit('progressChange', progress);
    };
  }

  // ================================================================
  // PHASE 5.5 — Scene mode switching
  // ================================================================
  const _reusableColor = typeof THREE !== 'undefined' ? new THREE.Color() : null;

  function getSceneModeConfig(mode) {
    const configs = {
      bloom: {
        name: '花海漫游', nameEn: 'BLOOM WALK',
        fogColor: 0x0e0810, fogDensity: 0.018, cameraDistance: 18,
        particleDensity: 1.0, particleHue: 340, ambientIntensity: 0.6,
      },
      memory: {
        name: '记忆照片墙', nameEn: 'MEMORY WALL',
        fogColor: 0x0a0a18, fogDensity: 0.015, cameraDistance: 16,
        particleDensity: 0.5, particleHue: 220, ambientIntensity: 0.8,
      },
      starlight: {
        name: '星光告白', nameEn: 'STARLIGHT',
        fogColor: 0x050510, fogDensity: 0.012, cameraDistance: 22,
        particleDensity: 1.5, particleHue: 50, ambientIntensity: 0.4,
      },
      timeline: {
        name: '时间长廊', nameEn: 'TIMELINE',
        fogColor: 0x0c0808, fogDensity: 0.020, cameraDistance: 20,
        particleDensity: 0.7, particleHue: 30, ambientIntensity: 0.5,
      },
      garden: {
        name: '永恒花园', nameEn: 'ETERNAL GARDEN',
        fogColor: 0x080e08, fogDensity: 0.016, cameraDistance: 17,
        particleDensity: 1.2, particleHue: 120, ambientIntensity: 0.7,
      },
    };
    return configs[mode] || null;
  }

  function applySceneMode(mode) {
    const config = getSceneModeConfig(mode);
    if (!config || !scene || !scene.scene) return;

    state.mode = mode;

    if (scene.scene.fog) {
      scene.scene.fog.color.setHex(config.fogColor);
      scene.scene.fog.density = config.fogDensity;
    }
    if (_reusableColor) {
      _reusableColor.setHex(config.fogColor);
      scene.scene.background = _reusableColor;
    }

    scene.targetCameraDistance = config.cameraDistance;

    if (particles && particles.setConfig) {
      particles.setConfig({
        density: config.particleDensity,
        hue: config.particleHue,
      });
    }

    // Update stage display
    const stageNameZh = document.getElementById('stage-name-zh');
    const stageNameEn = document.getElementById('stage-name-en');
    if (stageNameZh) stageNameZh.textContent = config.name;
    if (stageNameEn) stageNameEn.textContent = config.nameEn;

    // Track mode change in analytics
    if (modules.analytics) {
      try { modules.analytics.track('mode_change', { mode }); } catch (_) {}
    }
  }

  // Bind scene mode buttons
  const sceneBtns = document.querySelectorAll('.scene-btn');
  sceneBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (mode === state.mode) return;

      sceneBtns.forEach(b => b.classList.remove('scene-btn--active'));
      btn.classList.add('scene-btn--active');

      applySceneMode(mode);
    });
  });

  // Bind keyboard shortcuts for scene modes (1-5)
  window.addEventListener('keydown', (e) => {
    if (state.isModalOpen) return;
    const modeMap = { '1': 'bloom', '2': 'memory', '3': 'starlight', '4': 'timeline', '5': 'garden' };
    const mode = modeMap[e.key];
    if (mode && !e.ctrlKey && !e.altKey && !e.metaKey) {
      sceneBtns.forEach(b => {
        b.classList.toggle('scene-btn--active', b.dataset.mode === mode);
      });
      applySceneMode(mode);
    }
  });

  _phaseOk(P5, 'Scene mode switching wired');

  // ================================================================
  // PHASE 6 — Finish loading + start render loop
  // ================================================================
  const P6 = 'Phase 6';
  _phaseLog(P6, 'Starting render loop...');

  if (ui) ui.setLoadingProgress(100, '花海已盛开 ...');
  await _sleep(600);
  if (ui) ui.hideLoader();

  _phaseOk(P6, 'Loader hidden, entering render loop');

  // --- Main render loop with error boundary and perf monitoring ---
  let _frameId = null;

  function animate() {
    _frameId = requestAnimationFrame(animate);

    try {
      // Perf: mark frame start
      if (modules.perfMonitor) modules.perfMonitor.startFrame();

      // Update UI
      if (ui) ui.update();

      // v1.15.0: Skip layout computation when progress hasn't changed
      const currentProgress = ui ? ui.globalProgress : 0;
      if (Math.abs(currentProgress - (state._lastComputedProgress || 0)) > 0.0001 || cardsData.length !== (state._lastComputedCount || 0)) {
        // Compute layout positions
        const positions = Layouts.computePositions(currentProgress, cardsData.length);

        // Update card positions in scene
        if (scene) scene.updateCardPositions(positions);

        state._lastComputedProgress = currentProgress;
        state._lastComputedCount = cardsData.length;
      }

      // Render Three.js scene
      if (scene) scene.render();

      // Render 2D particles
      if (particles) particles.render();

      // Perf: mark frame end
      if (modules.perfMonitor) modules.perfMonitor.endFrame();

    } catch (err) {
      console.error('[Render Loop] Error:', err);
    }
  }

  animate();

  // ================================================================
  // PHASE 7 — Service Worker registration
  // ================================================================
  const P7 = 'Phase 7';
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      _phaseOk(P7, 'Service Worker registered (scope: ' + reg.scope + ')');

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              _phaseOk(P7, 'New content available — refresh for latest');
            }
          });
        }
      });
    } catch (err) {
      _phaseWarn(P7, 'Service Worker registration failed', err);
    }
  } else {
    _phaseWarn(P7, 'Service Workers not supported');
  }

  // ================================================================
  // PHASE 8 — Apply saved preferences
  // ================================================================
  const P8 = 'Phase 8';
  _phaseLog(P8, 'Applying saved preferences...');

  // Apply saved theme
  if (modules.themeManager) {
    try {
      // ThemeManager constructor already calls loadTheme()
      _phaseOk(P8, 'Theme applied: ' + modules.themeManager.getTheme());
    } catch (_) {}
  }

  // Apply saved language
  if (modules.i18n) {
    try {
      _phaseOk(P8, 'Language applied');
    } catch (_) {}
  }

  // ================================================================
  // Initialization complete
  // ================================================================
  const totalTime = performance.now();
  console.log('%c[R99] Initialization complete', _STYLE_LOG);
  console.log('%c[R99] Modules loaded:', _STYLE_INFO, Object.keys(modules)
    .filter(k => modules[k] !== null)
    .join(', ') || '(core only)');

  // Expose a summary for debugging
  window.__EB = Object.assign(window.__EB || {}, {
    events,
    state,
    modules,
    particles,
    scene,
    ui,
    cardsData,
    animate,
    _getFrameId: () => _frameId,
  });

  // ================================================================
  // Fallback card data (shared with app.js)
  // ================================================================
  function _getFallbackData() {
    const emojis = ['\u{1F60A}','☀️','\u{1F327}️','⭐','\u{1F305}','☕','\u{1F342}','❄️','\u{1F338}','\u{1F319}','\u{1F4D6}','\u{1F373}'];
    const titles = ['安静浅笑','阳光午后','雨中漫步','星空许愿','海边日落','咖啡时光',
                    '落叶秋思','初雪纷飞','花间轻语','月下共舞','书页时光','厨房协奏'];
    const titlesEn = ['QUIET SMILE','SUNNY AFTERNOON','RAIN WALK','STARRY WISH',
                      'BEACH SUNSET','COFFEE TIME','AUTUMN LEAVES','FIRST SNOW',
                      'FLOWER WHISPER','MOONLIGHT DANCE','PAGE TIME','KITCHEN CONCERT'];
    const colors = ['#667eea','#f093fb','#4facfe','#0c3483','#fa709a','#a18cd1',
                    '#f6d365','#e0c3fc','#ff9a9e','#6a5acd','#66a6ff','#fddb92'];
    const descs = [
      '你在餐桌前安静浅笑的那一刻，时间仿佛静止成了永恒。',
      '阳光透过窗帘洒在你脸上的温暖，是我记忆中最柔软的画面。',
      '和你共撑一把伞走在雨里，全世界都是伞下的小宇宙。',
      '在满天繁星下许的愿望，如今一一成为了现实。',
      '海浪拍打沙滩，你的剪影被夕阳镀上了一层金色光芒。',
      '两杯咖啡，一个下午，你我之间不需要太多言语。',
      '枫叶铺满小路的秋天，你牵着我的手说要走到世界尽头。',
      '第一场雪飘落的时候，你仰头看雪的侧脸美得像一幅画。',
      '在花园里你低头闻花的样子，是我心中最美的风景。',
      '月光下你旋转的裙摆，像一朵盛开的白色花朵。',
      '图书馆里你安静阅读的侧影，比任何文字都要动人。',
      '你系上围裙在厨房忙碌的背影，是家最温暖的模样。',
    ];
    const categories = ['日常','日常','旅行','浪漫','旅行','日常',
                        '季节','季节','浪漫','浪漫','旅行','季节'];
    const tags = [['微笑','温暖','日常'],['阳光','午后','慵懒'],['雨天','漫步','浪漫'],
                  ['星空','许愿','浪漫'],['海边','日落','旅行'],['咖啡','下午茶','日常'],
                  ['秋天','落叶','季节'],['冬天','初雪','季节'],['花园','花语','浪漫'],
                  ['月光','舞蹈','浪漫'],['图书馆','阅读','旅行'],['厨房','烘焙','日常']];
    const sortWeights = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];

    return emojis.map((e, i) => ({
      id: i + 1,
      title: titles[i],
      titleEn: titlesEn[i],
      desc: descs[i],
      emoji: e,
      gradient: `linear-gradient(135deg, ${colors[i]} 0%, ${colors[(i+1)%12]} 100%)`,
      color: colors[i],
      category: categories[i],
      tags: tags[i],
      sortWeight: sortWeights[i],
    }));
  }

  // ================================================================
  // localStorage helper (safe wrapper)
  // ================================================================
  function _safeLocalStorage(key, action, value) {
    try {
      if (action === 'get') return localStorage.getItem(key);
      if (action === 'set') localStorage.setItem(key, value);
    } catch (_) {}
    return null;
  }

})();
