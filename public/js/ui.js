/**
 * UI 交互控制器
 *
 * - 加载画面管理
 * - 滚轮/触摸滚动控制场景进度
 * - 键盘方向键支持
 * - 弹窗打开/关闭
 * - UI 元素更新（阶段名、进度、进度条）
 * - 浮现诗句
 * - Constant Glow 开关
 */

class UIController {
  constructor() {
    // DOM 元素
    this.loader = document.getElementById('loader');
    this.loaderBar = document.getElementById('loader-bar');
    this.loaderStatus = document.getElementById('loader-status');

    this.uiLogo = document.getElementById('ui-logo');
    this.uiStage = document.getElementById('ui-stage');
    this.stageNameZh = document.getElementById('stage-name-zh');
    this.stageNameEn = document.getElementById('stage-name-en');
    this.stageProgress = document.getElementById('stage-progress');
    this.progressBar = document.getElementById('ui-progress-bar');

    this.uiHint = document.getElementById('ui-hint');
    this.uiGlowToggle = document.getElementById('ui-glow-toggle');
    this.glowBtn = document.getElementById('glow-btn');

    this.poemText = document.getElementById('poem-text');

    this.modalOverlay = document.getElementById('modal-overlay');
    this.modalClose = document.getElementById('modal-close');
    this.modalEmoji = document.getElementById('modal-emoji');
    this.modalTitleZh = document.getElementById('modal-title-zh');
    this.modalTitleEn = document.getElementById('modal-title-en');
    this.modalDesc = document.getElementById('modal-desc');
    this.modalGradientBar = document.getElementById('modal-gradient-bar');

    // 状态
    this.globalProgress = 0;
    this.targetProgress = 0;
    this.scrollSpeed = 0.0006;
    this.isModalOpen = false;
    this.constantGlow = false;
    this._lastPct = -1; // DOM 脏检查缓存
    this._snapBoundaries = [0, 0.20, 0.35, 0.50, 0.70, 0.92];
    this._snapThreshold = 0.05; // 5% proximity to snap
    this._snapDeltaLimit = 30; // deltaY below this triggers snap

    // 诗句列表
    this.poems = [
      '每一朵花都是一段记忆的碎片',
      '在光与影的交界处，时间变得柔软',
      '你是我所有诗意的来源',
      '花开花落间，永恒在呼吸',
      '最美的风景是与你同行的路',
      '星辰大海不及你眼中的温柔',
    ];
    this.lastStageName = '';
    this.poemTimer = null;
    this._lastPoemIdx = -1; // 上次诗句索引，防止连续重复
    this._touchHintShown = false;
    this._shortcutHelpOverlay = null;
    this._shortcutHelpTimer = null;

    // 全屏按钮（程序化创建）
    this.fullscreenBtn = document.getElementById('fullscreen-btn');
    if (!this.fullscreenBtn) {
      this.fullscreenBtn = document.createElement('button');
      this.fullscreenBtn.id = 'fullscreen-btn';
      this.fullscreenBtn.className = 'fullscreen-btn';
      this.fullscreenBtn.title = 'Toggle Fullscreen (F)';
      this.fullscreenBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
      this.fullscreenBtn.style.cssText = [
        'position:fixed',
        'bottom:24px',
        'left:24px',
        'z-index:900',
        'width:40px',
        'height:40px',
        'border-radius:50%',
        'border:1px solid rgba(255,255,255,0.15)',
        'background:rgba(0,0,0,0.4)',
        'color:rgba(255,255,255,0.5)',
        'cursor:pointer',
        'display:flex',
        'align-items:center',
        'justify-content:center',
        'transition:all 0.3s ease',
        'backdrop-filter:blur(6px)',
      ].join(';');
      document.body.appendChild(this.fullscreenBtn);
    }

    // 回调
    this.onProgressChange = null;
    this.onGlowToggle = null;
  }

  /**
   * 初始化 UI 事件
   */
  init() {
    // 滚轮事件
    window.addEventListener('wheel', (e) => {
      if (this.isModalOpen) return;
      e.preventDefault();
      const newTarget = Math.max(0, Math.min(1,
        this.targetProgress + e.deltaY * this.scrollSpeed
      ));

      // Snap to stage boundaries on slow scroll
      if (Math.abs(e.deltaY) < this._snapDeltaLimit) {
        for (const boundary of this._snapBoundaries) {
          if (Math.abs(newTarget - boundary) < this._snapThreshold) {
            this.targetProgress = boundary;
            return;
          }
        }
      }

      this.targetProgress = newTarget;
    }, { passive: false });

    // 键盘事件
    window.addEventListener('keydown', (e) => {
      if (this.isModalOpen) {
        if (e.key === 'Escape') this.closeModal();
        return;
      }

      // If shortcut help is visible, any key dismisses it
      if (this._shortcutHelpOverlay) {
        this._hideShortcutHelp();
        if (e.key === '?') return; // don't re-show immediately
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          this.targetProgress = Math.min(1, this.targetProgress + 0.02);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          this.targetProgress = Math.max(0, this.targetProgress - 0.02);
          break;
        case 'Home':
          e.preventDefault();
          this.targetProgress = 0;
          break;
        case 'End':
          e.preventDefault();
          this.targetProgress = 1;
          break;
        case '?':
          e.preventDefault();
          this._showShortcutHelp();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          this._toggleFullscreen();
          break;
      }
    });

    // 触摸滚动（垂直方向）
    let touchStartY = 0;
    window.addEventListener('touchstart', (e) => {
      if (this.isModalOpen) return;
      if (e.touches.length === 1) {
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (this.isModalOpen) return;
      if (e.touches.length === 1) {
        const dy = touchStartY - e.touches[0].clientY;
        this.targetProgress = Math.max(0, Math.min(1,
          this.targetProgress + dy * 0.001
        ));
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    // 弹窗关闭按钮
    this.modalClose.addEventListener('click', () => this.closeModal());
    this.modalOverlay.addEventListener('click', (e) => {
      if (e.target === this.modalOverlay) this.closeModal();
    });

    // Constant Glow 按钮
    this.glowBtn.addEventListener('click', () => {
      this.constantGlow = !this.constantGlow;
      this.glowBtn.classList.toggle('active', this.constantGlow);
      if (this.onGlowToggle) this.onGlowToggle(this.constantGlow);
    });

    // 全屏按钮
    this.fullscreenBtn.addEventListener('click', () => this._toggleFullscreen());

    // 全屏状态监听：更新按钮样式
    const onFsChange = () => {
      const isFs = document.fullscreenElement || document.webkitFullscreenElement;
      this.fullscreenBtn.classList.toggle('active', !!isFs);
      this.fullscreenBtn.style.borderColor = isFs ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)';
      this.fullscreenBtn.style.color = isFs ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)';
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);

    // R26 - 触摸手势提示：首次触摸时显示
    window.addEventListener('touchstart', () => {
      this._showTouchGestureHint();
    }, { passive: true });
  }

  /**
   * 更新进度并刷新 UI
   */
  update() {
    // 平滑插值
    this.globalProgress += (this.targetProgress - this.globalProgress) * 0.06;

    // 更新百分比文字（仅在值变化时更新 DOM，避免无谓的重排）
    const pct = Math.round(this.globalProgress * 100);
    if (pct !== this._lastPct) {
      this._lastPct = pct;
      this.stageProgress.textContent = pct + '%';
      this.progressBar.style.width = pct + '%';
    }

    // 获取当前阶段
    const stage = Layouts.getCurrentStage(this.globalProgress);
    this.stageNameZh.textContent = stage.zh;
    this.stageNameEn.textContent = stage.name;

    // 阶段切换时显示诗句
    if (stage.name !== this.lastStageName) {
      this.lastStageName = stage.name;
      this._showPoem();
    }

    if (this.onProgressChange) {
      this.onProgressChange(this.globalProgress);
    }
  }

  /**
   * 显示加载进度
   */
  setLoadingProgress(percent, statusText) {
    this.loaderBar.style.width = percent + '%';
    if (statusText) this.loaderStatus.textContent = statusText;
  }

  /**
   * 隐藏加载画面，显示 UI
   */
  hideLoader() {
    this.loader.classList.add('hidden');

    // 依次显示 UI 元素
    setTimeout(() => this.uiLogo.classList.add('visible'), 200);
    setTimeout(() => this.uiStage.classList.add('visible'), 400);
    setTimeout(() => this.uiHint.classList.add('visible'), 600);
    setTimeout(() => this.uiGlowToggle.classList.add('visible'), 800);
  }

  /**
   * 显示卡片详情弹窗
   */
  openModal(cardData) {
    this.isModalOpen = true;
    this.modalEmoji.textContent = cardData.emoji;
    this.modalTitleZh.textContent = cardData.title;
    this.modalTitleEn.textContent = cardData.titleEn;
    this.modalDesc.textContent = cardData.desc;
    this.modalGradientBar.style.background = cardData.gradient;
    this.modalOverlay.classList.add('open');
  }

  /**
   * 关闭弹窗
   */
  closeModal() {
    this.isModalOpen = false;
    this.modalOverlay.classList.remove('open');
  }

  /**
   * 显示快捷键帮助覆盖层
   */
  _showShortcutHelp() {
    if (this._shortcutHelpOverlay) {
      // 已存在则先移除
      this._hideShortcutHelp();
    }

    const overlay = document.createElement('div');
    overlay.id = 'shortcut-help-overlay';
    overlay.style.cssText = [
      'position:fixed',
      'top:0;left:0;right:0;bottom:0',
      'background:rgba(0,0,0,0.85)',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'z-index:10000',
      'opacity:0',
      'transition:opacity 0.3s ease',
      'font-family:system-ui,sans-serif',
    ].join(';');

    const box = document.createElement('div');
    box.style.cssText = [
      'color:#fff',
      'text-align:center',
      'max-width:420px',
      'padding:32px 40px',
      'border-radius:16px',
      'border:1px solid rgba(255,255,255,0.12)',
      'background:rgba(255,255,255,0.05)',
      'backdrop-filter:blur(10px)',
    ].join(';');

    const shortcuts = [
      ['Scroll / Drag', 'Navigate'],
      ['Arrow Keys', 'Fine step forward / back'],
      ['Space', 'Step forward'],
      ['Home / End', 'Go to start / end'],
      ['1 - 5', 'Switch scene mode'],
      ['F', 'Toggle fullscreen'],
      ['?', 'Show this help'],
      ['Esc', 'Close modal / help'],
    ];

    let html = '<h3 style="margin:0 0 20px;font-size:18px;letter-spacing:1px;">Keyboard Shortcuts</h3>';
    html += '<div style="display:grid;grid-template-columns:auto auto;gap:8px 24px;text-align:left;font-size:14px;">';
    shortcuts.forEach(([key, desc]) => {
      html += `<span style="color:#c9a0dc;font-weight:600;font-family:monospace;background:rgba(255,255,255,0.08);padding:3px 8px;border-radius:4px;">${key}</span>`;
      html += `<span style="color:rgba(255,255,255,0.7);">${desc}</span>`;
    });
    html += '</div>';
    html += '<p style="margin:20px 0 0;font-size:12px;color:rgba(255,255,255,0.35);">Auto-hides in 4 seconds or press any key</p>';
    box.innerHTML = html;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // Force reflow then fade in
    overlay.offsetHeight; // eslint-disable-line no-unused-expressions
    overlay.style.opacity = '1';

    this._shortcutHelpOverlay = overlay;

    // Auto-hide after 4 seconds
    this._shortcutHelpTimer = setTimeout(() => this._hideShortcutHelp(), 4000);
  }

  /**
   * 隐藏快捷键帮助覆盖层
   */
  _hideShortcutHelp() {
    if (this._shortcutHelpTimer) {
      clearTimeout(this._shortcutHelpTimer);
      this._shortcutHelpTimer = null;
    }
    if (this._shortcutHelpOverlay) {
      this._shortcutHelpOverlay.style.opacity = '0';
      const el = this._shortcutHelpOverlay;
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 300);
      this._shortcutHelpOverlay = null;
    }
  }

  /**
   * 切换全屏模式
   */
  _toggleFullscreen() {
    const doc = document.documentElement;
    const isFs = document.fullscreenElement || document.webkitFullscreenElement;
    if (isFs) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
      (doc.requestFullscreen || doc.webkitRequestFullscreen).call(doc);
    }
  }

  /**
   * 显示触摸手势提示
   */
  _showTouchGestureHint() {
    if (this._touchHintShown) return;
    this._touchHintShown = true;

    const overlay = document.createElement('div');
    overlay.id = 'touch-hint-overlay';
    overlay.style.cssText = [
      'position:fixed',
      'top:0;left:0;right:0;bottom:0',
      'background:rgba(0,0,0,0.7)',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'z-index:10001',
      'opacity:0',
      'transition:opacity 0.4s ease',
      'pointer-events:none',
    ].join(';');

    // Pinch gesture animation container
    const gesture = document.createElement('div');
    gesture.style.cssText = [
      'width:80px;height:80px',
      'position:relative',
      'margin-bottom:20px',
    ].join(';');

    // Two finger circles
    const finger1 = document.createElement('div');
    finger1.style.cssText = [
      'width:28px;height:28px',
      'border-radius:50%',
      'background:rgba(255,255,255,0.25)',
      'border:2px solid rgba(255,255,255,0.6)',
      'position:absolute',
      'top:50%;left:50%',
      'transform:translate(-50%,-50%)',
    ].join(';');

    const finger2 = document.createElement('div');
    finger2.style.cssText = finger1.style.cssText;

    // Keyframes for pinch animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pinch-in-out {
        0% { transform: translate(-70%,-50%); }
        50% { transform: translate(-20%,-50%); }
        100% { transform: translate(-70%,-50%); }
      }
      @keyframes pinch-in-out-reverse {
        0% { transform: translate(-30%,-50%); }
        50% { transform: translate(-80%,-50%); }
        100% { transform: translate(-30%,-50%); }
      }
      @keyframes hint-fade-in {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      #touch-hint-overlay .finger-1 {
        animation: pinch-in-out 1.2s ease-in-out infinite;
      }
      #touch-hint-overlay .finger-2 {
        animation: pinch-in-out-reverse 1.2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);

    finger1.classList.add('finger-1');
    finger2.classList.add('finger-2');
    gesture.appendChild(finger1);
    gesture.appendChild(finger2);

    const label = document.createElement('div');
    label.style.cssText = [
      'color:rgba(255,255,255,0.8)',
      'font-size:16px',
      'font-family:system-ui,sans-serif',
      'letter-spacing:1px',
      'animation:hint-fade-in 0.5s ease',
    ].join(';');
    label.textContent = 'Pinch to zoom · Two fingers to navigate';

    overlay.appendChild(gesture);
    overlay.appendChild(label);
    document.body.appendChild(overlay);

    // Fade in
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
    });

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (style.parentNode) style.parentNode.removeChild(style);
      }, 400);
    }, 3000);
  }

  /**
   * 浮现诗句
   */
  _showPoem() {
    // 清除之前的定时器
    if (this.poemTimer) clearTimeout(this.poemTimer);

    // 选择诗句，避免连续重复
    let idx;
    do {
      idx = Math.floor(Math.random() * this.poems.length);
    } while (idx === this._lastPoemIdx && this.poems.length > 1);
    this._lastPoemIdx = idx;

    const poem = this.poems[idx];
    this.poemText.textContent = poem;
    this.poemText.classList.add('visible');

    this.poemTimer = setTimeout(() => {
      this.poemText.classList.remove('visible');
    }, 3000);
  }
}

// 导出到全局
window.UIController = UIController;
