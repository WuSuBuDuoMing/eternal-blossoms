/**
 * 永恒花海 · 花海记忆 — 国际化 (i18n) 模块
 * ETERNAL BLOSSOMS — HUA HAI JI YI
 *
 * R76: I18n 翻译引擎 — 构造函数、t()、setLocale()、getLocale()、getSupportedLocales()
 * R77: 中英文翻译字典 — 50+ 键值，覆盖全部 UI 文本
 * R78: DOM 翻译 — translateDOM()，data-i18n / data-i18n-title
 * R79: 自动检测 — detectLanguage()、init()、createLanguageToggle()
 * R80: 语言切换 UI — createLangToggle()，药丸按钮，动画切换
 */

// ================================================================
// R77 — 翻译字典
// ================================================================
const TRANSLATIONS = {

  // ---- 加载画面 ----
  'loader.title':           { zh: '永恒花海', en: 'ETERNAL BLOSSOMS' },
  'loader.subtitle':        { zh: '花海记忆', en: 'HUA HAI JI YI' },
  'loader.weaving':         { zh: '正在编织花海 ...', en: 'Weaving the sea of blossoms ...' },
  'loader.init':            { zh: '正在初始化粒子系统 ...', en: 'Initializing particles ...' },
  'loader.scene':           { zh: '正在构建 3D 场景 ...', en: 'Building 3D scene ...' },
  'loader.collecting':      { zh: '正在从花海中采集记忆 ...', en: 'Collecting memories from the blossoms ...' },
  'loader.drawing':         { zh: '正在绘制 {n} 张记忆卡片 ...', en: 'Drawing {n} memory cards ...' },
  'loader.starlight':       { zh: '正在点亮花海中的星光 ...', en: 'Lighting up starlight in the blossoms ...' },
  'loader.bloomed':         { zh: '花海已盛开 ...', en: 'Blossoms are in full bloom ...' },

  // ---- Logo / 标题 ----
  'logo.prefix':            { zh: 'WXY', en: 'WXY' },
  'logo.main':              { zh: 'ETERNAL BLOSSOMS', en: 'ETERNAL BLOSSOMS' },
  'logo.sub':               { zh: 'HUA HAI JI YI', en: 'HUA HAI JI YI' },
  'logo.home':              { zh: '← 首页', en: '← Home' },

  // ---- 阶段名称 ----
  'stage.arrival':          { zh: '晨曦初临', en: 'ARRIVAL' },
  'stage.fan':              { zh: '卷帘展开', en: 'FAN' },
  'stage.gather':           { zh: '同心汇聚', en: 'GATHER' },
  'stage.wave':             { zh: '正弦波动', en: 'WAVE' },
  'stage.grid':             { zh: '网格呼吸', en: 'GRID' },
  'stage.spiral':           { zh: '螺旋花涡', en: 'SPIRAL' },
  'stage.depart':           { zh: '永恒归宿', en: 'DEPART' },

  // ---- 场景模式 ----
  'scene.label':            { zh: '场景模式', en: 'SCENE MODE' },
  'scene.bloom':            { zh: '花海漫游', en: 'BLOOM WALK' },
  'scene.memory':           { zh: '记忆照片墙', en: 'MEMORY WALL' },
  'scene.starlight':        { zh: '星光告白', en: 'STARLIGHT' },
  'scene.timeline':         { zh: '时间长廊', en: 'TIMELINE' },
  'scene.garden':           { zh: '永恒花园', en: 'ETERNAL GARDEN' },

  // ---- 操作提示 ----
  'hint.scroll':            { zh: '滚动探索花海', en: 'Scroll to explore' },
  'hint.drag':              { zh: '拖拽旋转视角', en: 'Drag to rotate' },
  'hint.doubleclick':       { zh: '双击查看记忆', en: 'Double-click to view' },

  // ---- Constant Glow ----
  'glow.label':             { zh: '恒定光辉', en: 'CONSTANT GLOW' },

  // ---- 诗句 ----
  'poem.1':                 { zh: '每一朵花都是一段记忆的碎片', en: 'Every blossom is a fragment of memory' },
  'poem.2':                 { zh: '在光与影的交界处，时间变得柔软', en: 'At the border of light and shadow, time grows soft' },
  'poem.3':                 { zh: '你是我所有诗意的来源', en: 'You are the source of all my poetry' },
  'poem.4':                 { zh: '花开花落间，永恒在呼吸', en: 'Between bloom and fall, eternity breathes' },
  'poem.5':                 { zh: '最美的风景是与你同行的路', en: 'The finest view is the road walked with you' },
  'poem.6':                 { zh: '星辰大海不及你眼中的温柔', en: 'Stars and seas cannot match the tenderness in your eyes' },

  // ---- 弹窗 ----
  'modal.close':            { zh: '关闭', en: 'Close' },
  'modal.aria':             { zh: '卡片详情', en: 'Card details' },

  // ---- 全屏 ----
  'fullscreen.title':       { zh: '切换全屏 (F)', en: 'Toggle Fullscreen (F)' },

  // ---- 快捷键帮助 ----
  'shortcut.title':         { zh: '键盘快捷键', en: 'Keyboard Shortcuts' },
  'shortcut.scroll':        { zh: '滚动 / 拖拽', en: 'Scroll / Drag' },
  'shortcut.scroll.desc':   { zh: '导航', en: 'Navigate' },
  'shortcut.arrows':        { zh: '方向键', en: 'Arrow Keys' },
  'shortcut.arrows.desc':   { zh: '前后微调', en: 'Fine step forward / back' },
  'shortcut.space':         { zh: '空格', en: 'Space' },
  'shortcut.space.desc':    { zh: '前进一步', en: 'Step forward' },
  'shortcut.homeend':       { zh: 'Home / End', en: 'Home / End' },
  'shortcut.homeend.desc':  { zh: '跳转首尾', en: 'Go to start / end' },
  'shortcut.modes':         { zh: '1 - 5', en: '1 - 5' },
  'shortcut.modes.desc':    { zh: '切换场景模式', en: 'Switch scene mode' },
  'shortcut.fullscreen':    { zh: 'F', en: 'F' },
  'shortcut.fullscreen.desc': { zh: '切换全屏', en: 'Toggle fullscreen' },
  'shortcut.helpkey':       { zh: '?', en: '?' },
  'shortcut.helpkey.desc':  { zh: '显示此帮助', en: 'Show this help' },
  'shortcut.esc':           { zh: 'Esc', en: 'Esc' },
  'shortcut.esc.desc':      { zh: '关闭弹窗 / 帮助', en: 'Close modal / help' },
  'shortcut.autohide':      { zh: '4 秒后自动隐藏，或按任意键关闭', en: 'Auto-hides in 4 seconds or press any key' },

  // ---- 触摸提示 ----
  'touch.pinch':            { zh: '双指缩放 · 双指滑动导航', en: 'Pinch to zoom · Two fingers to navigate' },

  // ---- 搜索 / 通用 ----
  'search.placeholder':     { zh: '搜索记忆 ...', en: 'Search memories ...' },
  'card.count':             { zh: '{n} 张记忆卡片', en: '{n} memory cards' },
  'error.load_failed':      { zh: '加载失败，请稍后重试', en: 'Loading failed, please try again later' },
  'error.api_failed':       { zh: '获取卡片数据失败，使用本地回退数据', en: 'Failed to fetch card data, using fallback' },

  // ---- 语言切换 ----
  'lang.toggle':            { zh: '中 / EN', en: 'EN / 中' },

  // ---- 元信息 ----
  'meta.title':             { zh: '永恒花海 · 花海记忆 | ETERNAL BLOSSOMS', en: 'ETERNAL BLOSSOMS | HUA HAI JI YI' },
  'meta.description':       {
    zh: '一个沉浸式 3D 照片卡片画廊，用粒子和光为你编织永恒的花海记忆。',
    en: 'An immersive 3D photo card gallery, weaving eternal blossom memories with particles and light.',
  },
};

// ================================================================
// R76 — I18n 翻译引擎
// ================================================================
class I18n {

  /**
   * @param {Object} translations — 键值翻译字典
   * @param {string} defaultLang  — 默认语言 ('zh' | 'en')
   */
  constructor(translations = TRANSLATIONS, defaultLang = 'zh') {
    this._translations = translations;
    this._lang = defaultLang;
    this._listeners = [];
  }

  // ---------------------------------------------------------------
  // R76 — 核心翻译方法
  // ---------------------------------------------------------------

  /**
   * 翻译一个 key，支持 {param} 插值
   * @param {string} key
   * @param {Object} [params] — { n: 24 } → {n} 被替换为 24
   * @returns {string}
   */
  t(key, params) {
    const entry = this._translations[key];
    if (!entry) return key; // 缺失则回退到 key 本身

    let text = entry[this._lang] ?? entry.zh ?? key;

    if (params) {
      Object.keys(params).forEach(k => {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
      });
    }

    return text;
  }

  /**
   * 切换语言并更新所有 DOM 元素
   * @param {string} lang — 'zh' | 'en'
   */
  setLocale(lang) {
    if (!this._translations) return;
    this._lang = lang;

    // 持久化
    try { localStorage.setItem('eb-lang', lang); } catch (_) { /* ignore */ }

    // 更新 <html lang>
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';

    // 更新 DOM
    this.translateDOM();

    // 通知监听器
    this._listeners.forEach(fn => fn(lang));
  }

  /**
   * 获取当前语言
   * @returns {string}
   */
  getLocale() {
    return this._lang;
  }

  /**
   * 获取所有可用语言
   * @returns {string[]}
   */
  getSupportedLocales() {
    const locales = new Set();
    Object.values(this._translations).forEach(entry => {
      Object.keys(entry).forEach(lang => locales.add(lang));
    });
    return Array.from(locales);
  }

  // ---------------------------------------------------------------
  // R78 — DOM 翻译
  // ---------------------------------------------------------------

  /**
   * 递归扫描 DOM，用 data-i18n / data-i18n-title 进行翻译
   * @param {HTMLElement} [root=document.body]
   */
  translateDOM(root) {
    const container = root || document.body;

    // data-i18n → textContent
    container.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = this.t(key);
      }
    });

    // data-i18n-title → title 属性
    container.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        el.title = this.t(key);
      }
    });

    // data-i18n-placeholder → placeholder 属性
    container.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.placeholder = this.t(key);
      }
    });
  }

  // ---------------------------------------------------------------
  // R79 — 自动检测 & 初始化
  // ---------------------------------------------------------------

  /**
   * 检测首选语言，优先级: URL ?lang= > localStorage > navigator.language
   * @returns {string} 'zh' | 'en'
   */
  detectLanguage() {
    // 1. URL 参数
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang && this._isSupported(urlLang)) return urlLang;

    // 2. localStorage
    try {
      const saved = localStorage.getItem('eb-lang');
      if (saved && this._isSupported(saved)) return saved;
    } catch (_) { /* ignore */ }

    // 3. navigator.language
    const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    if (nav.startsWith('zh')) return 'zh';
    return 'en'; // 默认英文
  }

  /**
   * 启动时自动检测语言并应用
   */
  init() {
    const lang = this.detectLanguage();
    this.setLocale(lang);
    this.createLangToggle();
  }

  /**
   * 监听语言切换事件
   * @param {Function} fn — (lang) => void
   */
  onChange(fn) {
    this._listeners.push(fn);
  }

  // ---------------------------------------------------------------
  // R80 — 语言切换 UI
  // ---------------------------------------------------------------

  /**
   * 创建药丸形语言切换按钮，定位在左上角 Logo 附近
   */
  createLangToggle() {
    // 避免重复创建
    if (document.getElementById('lang-toggle')) return;

    const btn = document.createElement('button');
    btn.id = 'lang-toggle';
    btn.className = 'lang-toggle';
    btn.setAttribute('aria-label', 'Switch language');
    btn.title = 'Switch language';

    // 药丸内部结构
    const label = document.createElement('span');
    label.className = 'lang-toggle__label';
    label.textContent = this._lang === 'zh' ? '中' : 'EN';
    btn.appendChild(label);

    // 样式 — 药丸形，位于左上角 Logo 下方或旁边
    Object.assign(btn.style, {
      position: 'fixed',
      top: '52px',
      left: '20px',
      zIndex: '900',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '44px',
      height: '28px',
      padding: '0 12px',
      borderRadius: '14px',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      background: 'rgba(0, 0, 0, 0.35)',
      color: 'rgba(255, 255, 255, 0.6)',
      fontSize: '12px',
      fontFamily: 'var(--font-mono, monospace)',
      letterSpacing: '1px',
      cursor: 'pointer',
      userSelect: 'none',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      overflow: 'hidden',
    });

    // 注入动画样式（仅一次）
    if (!document.getElementById('lang-toggle-style')) {
      const style = document.createElement('style');
      style.id = 'lang-toggle-style';
      style.textContent = `
        .lang-toggle:hover {
          border-color: rgba(255, 255, 255, 0.3);
          background: rgba(0, 0, 0, 0.5);
          color: rgba(255, 255, 255, 0.9);
        }
        .lang-toggle:active {
          transform: scale(0.92);
        }
        .lang-toggle__label {
          display: inline-block;
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                      opacity 0.25s ease;
        }
        .lang-toggle__label--switching {
          transform: rotateX(90deg);
          opacity: 0;
        }
      `;
      document.head.appendChild(style);
    }

    // 点击事件 — 带旋转动画
    btn.addEventListener('click', () => {
      const newLang = this._lang === 'zh' ? 'en' : 'zh';
      const labelEl = btn.querySelector('.lang-toggle__label');

      // 旋转淡出
      labelEl.classList.add('lang-toggle__label--switching');

      setTimeout(() => {
        labelEl.textContent = newLang === 'zh' ? '中' : 'EN';
        this.setLocale(newLang);

        // 旋转淡入
        labelEl.classList.remove('lang-toggle__label--switching');
      }, 200);
    });

    // 悬浮态颜色
    btn.addEventListener('mouseenter', () => {
      btn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      btn.style.color = 'rgba(255, 255, 255, 0.9)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.borderColor = 'rgba(255, 255, 255, 0.15)';
      btn.style.color = 'rgba(255, 255, 255, 0.6)';
    });

    document.body.appendChild(btn);

    // 监听语言变更 → 更新按钮文字
    this.onChange(() => {
      const lbl = btn.querySelector('.lang-toggle__label');
      if (lbl) {
        lbl.textContent = this._lang === 'zh' ? '中' : 'EN';
      }
    });
  }

  // ---------------------------------------------------------------
  // 内部工具
  // ---------------------------------------------------------------

  /**
   * 检查语言代码是否在翻译字典中
   * @param {string} lang
   * @returns {boolean}
   */
  _isSupported(lang) {
    const lc = lang.toLowerCase();
    return this.getSupportedLocales().some(l => l === lc || lc.startsWith(l));
  }
}

// ================================================================
// 导出到全局
// ================================================================
window.I18n = I18n;
window.TRANSLATIONS = TRANSLATIONS;
