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
      this.targetProgress = Math.max(0, Math.min(1,
        this.targetProgress + e.deltaY * this.scrollSpeed
      ));
    }, { passive: false });

    // 键盘事件
    window.addEventListener('keydown', (e) => {
      if (this.isModalOpen) {
        if (e.key === 'Escape') this.closeModal();
        return;
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
