/**
 * Theme System — Rounds 71-75
 * 永恒花海 · ETERNAL BLOSSOMS
 *
 * R71 — ThemeManager class with 6 presets
 * R72 — Persistence (localStorage) & prefers-color-scheme detection
 * R73 — Smooth CSS variable transitions with @property
 * R74 — Floating theme selector UI with color swatches
 */

class ThemeManager {
  // ================================================================
  // R71 — Theme Presets
  // ================================================================

  constructor() {
    /** @type {string} current active theme name */
    this._current = 'midnight';

    /** @type {HTMLElement|null} selector panel reference */
    this._panel = null;

    /** @type {boolean} selector visibility state */
    this._panelVisible = false;

    /**
     * Theme preset definitions.
     * Each key maps to a CSS class (e.g. .theme-sakura) in themes.css.
     *
     * fogColor   — THREE.js hex for scene fog / background
     * particleHue — base hue for particle system
     * preview    — primary accent color for swatch preview
     */
    this.themes = {
      midnight: {
        label: 'Midnight',
        labelZh: '午夜星空',
        preview: '#ff6b9d',
        vars: {
          '--color-bg':            '#0a0a12',
          '--color-bg-secondary':  '#12121e',
          '--color-text':          '#f0e6f6',
          '--color-text-muted':    'rgba(240, 230, 246, 0.5)',
          '--color-accent':        '#ff6b9d',
          '--color-accent-secondary': '#c084fc',
          '--color-gold':          '#ffd700',
          '--color-glass':         'rgba(255, 255, 255, 0.04)',
          '--color-glass-border':  'rgba(255, 255, 255, 0.08)',
          '--shadow-glow':         '0 0 40px rgba(255, 107, 157, 0.15)',
        },
        fogColor: 0x0e0810,
        particleHue: 340,
      },

      sakura: {
        label: 'Sakura',
        labelZh: '樱花物语',
        preview: '#ff85a2',
        vars: {
          '--color-bg':            '#1a0f14',
          '--color-bg-secondary':  '#2a1520',
          '--color-text':          '#fce4ec',
          '--color-text-muted':    'rgba(252, 228, 236, 0.5)',
          '--color-accent':        '#ff85a2',
          '--color-accent-secondary': '#f48fb1',
          '--color-gold':          '#ffcdd2',
          '--color-glass':         'rgba(255, 133, 162, 0.06)',
          '--color-glass-border':  'rgba(255, 133, 162, 0.12)',
          '--shadow-glow':         '0 0 40px rgba(255, 133, 162, 0.2)',
        },
        fogColor: 0x1a0f14,
        particleHue: 350,
      },

      ocean: {
        label: 'Ocean',
        labelZh: '深海之境',
        preview: '#4fc3f7',
        vars: {
          '--color-bg':            '#060e18',
          '--color-bg-secondary':  '#0c1a2a',
          '--color-text':          '#e0f2ff',
          '--color-text-muted':    'rgba(224, 242, 255, 0.5)',
          '--color-accent':        '#4fc3f7',
          '--color-accent-secondary': '#0288d1',
          '--color-gold':          '#80deea',
          '--color-glass':         'rgba(79, 195, 247, 0.05)',
          '--color-glass-border':  'rgba(79, 195, 247, 0.1)',
          '--shadow-glow':         '0 0 40px rgba(79, 195, 247, 0.15)',
        },
        fogColor: 0x060e18,
        particleHue: 200,
      },

      forest: {
        label: 'Forest',
        labelZh: '翡翠森林',
        preview: '#66bb6a',
        vars: {
          '--color-bg':            '#071208',
          '--color-bg-secondary':  '#0e1f10',
          '--color-text':          '#e8f5e9',
          '--color-text-muted':    'rgba(232, 245, 233, 0.5)',
          '--color-accent':        '#66bb6a',
          '--color-accent-secondary': '#43a047',
          '--color-gold':          '#aed581',
          '--color-glass':         'rgba(102, 187, 106, 0.05)',
          '--color-glass-border':  'rgba(102, 187, 106, 0.1)',
          '--shadow-glow':         '0 0 40px rgba(102, 187, 106, 0.15)',
        },
        fogColor: 0x071208,
        particleHue: 130,
      },

      sunset: {
        label: 'Sunset',
        labelZh: '暮色暖阳',
        preview: '#ff8a65',
        vars: {
          '--color-bg':            '#140a06',
          '--color-bg-secondary':  '#231410',
          '--color-text':          '#fbe9e7',
          '--color-text-muted':    'rgba(251, 233, 231, 0.5)',
          '--color-accent':        '#ff8a65',
          '--color-accent-secondary': '#ff7043',
          '--color-gold':          '#ffcc80',
          '--color-glass':         'rgba(255, 138, 101, 0.06)',
          '--color-glass-border':  'rgba(255, 138, 101, 0.12)',
          '--shadow-glow':         '0 0 40px rgba(255, 138, 101, 0.2)',
        },
        fogColor: 0x140a06,
        particleHue: 20,
      },

      aurora: {
        label: 'Aurora',
        labelZh: '极光幻境',
        preview: '#ab47bc',
        vars: {
          '--color-bg':            '#0a0812',
          '--color-bg-secondary':  '#16102a',
          '--color-text':          '#ede7f6',
          '--color-text-muted':    'rgba(237, 231, 246, 0.5)',
          '--color-accent':        '#ab47bc',
          '--color-accent-secondary': '#7c4dff',
          '--color-gold':          '#ce93d8',
          '--color-glass':         'rgba(171, 71, 188, 0.05)',
          '--color-glass-border':  'rgba(171, 71, 188, 0.1)',
          '--shadow-glow':         '0 0 40px rgba(171, 71, 188, 0.2)',
        },
        fogColor: 0x0a0812,
        particleHue: 280,
      },
    };

    // R72: Load saved theme or detect system preference
    this.loadTheme();
  }

  // ================================================================
  // R71 — Core API
  // ================================================================

  /**
   * Apply a theme by name.
   * Sets CSS custom properties on :root and adds a .theme-<name> class.
   * @param {string} name
   */
  setTheme(name) {
    const theme = this.themes[name];
    if (!theme) {
      console.warn(`[ThemeManager] Unknown theme: "${name}"`);
      return;
    }

    const root = document.documentElement;

    // Remove previous theme class
    if (this._current && this.themes[this._current]) {
      root.classList.remove(`theme-${this._current}`);
    }

    // Apply CSS custom properties
    for (const [prop, value] of Object.entries(theme.vars)) {
      root.style.setProperty(prop, value);
    }

    // Add theme class (for themes.css rule-based overrides)
    root.classList.add(`theme-${name}`);

    // Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme.vars['--color-bg']);

    this._current = name;

    // Update active swatch in selector panel
    this._updateSwatchActive();

    // R72: Persist
    this.saveTheme(name);
  }

  /**
   * Return the current theme name.
   * @returns {string}
   */
  getTheme() {
    return this._current;
  }

  /**
   * Return array of available themes with display info.
   * @returns {Array<{name: string, label: string, labelZh: string, preview: string}>}
   */
  getThemeList() {
    return Object.entries(this.themes).map(([name, t]) => ({
      name,
      label: t.label,
      labelZh: t.labelZh,
      preview: t.preview,
    }));
  }

  // ================================================================
  // R72 — Persistence & System Preference
  // ================================================================

  /**
   * Save the current theme name to localStorage.
   * @param {string} name
   */
  saveTheme(name) {
    try {
      localStorage.setItem('eb-theme', name);
    } catch (e) {
      // Storage quota exceeded or private browsing — ignore
    }
  }

  /**
   * Load theme from localStorage, falling back to system preference.
   * Called automatically in the constructor.
   */
  loadTheme() {
    let saved = null;
    try {
      saved = localStorage.getItem('eb-theme');
    } catch (e) {
      // Ignore
    }

    if (saved && this.themes[saved]) {
      this.setTheme(saved);
      return;
    }

    // prefers-color-scheme detection
    if (window.matchMedia) {
      // Map system preferences to themes
      if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        // Light preference — sakura is the lightest dark theme
        this.setTheme('sakura');
        return;
      }
      // Default dark — midnight
      this.setTheme('midnight');
    }
  }

  // ================================================================
  // R73 — Smooth Theme Transitions
  // ================================================================

  /**
   * Transition to a new theme over `duration` milliseconds.
   * Uses CSS @property registrations (themes.css) so custom properties
   * animate natively via CSS transitions.
   *
   * A brief flash overlay is shown during the transition for visual feedback.
   *
   * @param {string} name     target theme name
   * @param {number} duration transition time in ms (default 500)
   */
  transitionTheme(name, duration = 500) {
    if (name === this._current) return;

    const root = document.documentElement;

    // Set transition duration on :root (matches themes.css @property rules)
    root.style.setProperty('transition-duration', `${duration}ms`);

    // Brief flash overlay
    const flash = document.createElement('div');
    flash.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:99999',
      'pointer-events:none',
      'background:rgba(255,255,255,0.04)',
      'opacity:0',
      'transition:opacity ' + (duration / 2) + 'ms ease',
    ].join(';');
    document.body.appendChild(flash);

    // Trigger flash
    requestAnimationFrame(() => {
      flash.style.opacity = '1';

      // Apply theme (CSS vars animate via @property transitions)
      this.setTheme(name);

      // Fade out flash
      setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => {
          if (flash.parentNode) flash.parentNode.removeChild(flash);
          // Reset transition duration to default
          root.style.removeProperty('transition-duration');
        }, duration / 2);
      }, duration / 2);
    });
  }

  // ================================================================
  // R74 — Theme Selector UI
  // ================================================================

  /**
   * Create the floating theme selector panel (once).
   * Called lazily by showThemeSelector().
   * @returns {HTMLElement}
   */
  createThemeSelector() {
    if (this._panel) return this._panel;

    const panel = document.createElement('div');
    panel.id = 'theme-selector';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Theme Selector');

    // Panel styling
    Object.assign(panel.style, {
      position: 'fixed',
      bottom: '80px',
      right: '32px',
      zIndex: '500',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '16px 20px',
      background: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      opacity: '0',
      visibility: 'hidden',
      transform: 'translateY(12px) scale(0.95)',
      transition: 'opacity 0.35s cubic-bezier(0.16,1,0.3,1), transform 0.35s cubic-bezier(0.16,1,0.3,1), visibility 0.35s',
      willChange: 'transform, opacity',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif",
    });

    // Title
    const title = document.createElement('div');
    title.textContent = 'THEMES';
    Object.assign(title.style, {
      fontSize: '10px',
      fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
      color: 'rgba(255, 255, 255, 0.35)',
      letterSpacing: '3px',
      textTransform: 'uppercase',
      marginBottom: '4px',
    });
    panel.appendChild(title);

    // Swatch list
    const list = document.createElement('div');
    Object.assign(list.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    });

    const themeList = this.getThemeList();
    themeList.forEach((t) => {
      const item = document.createElement('button');
      item.dataset.theme = t.name;
      item.title = `${t.labelZh} (${t.label})`;
      item.setAttribute('aria-label', `Apply ${t.label} theme`);
      Object.assign(item.style, {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
        color: 'rgba(255, 255, 255, 0.65)',
        fontSize: '12px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      });

      // Color swatch circle
      const swatch = document.createElement('span');
      Object.assign(swatch.style, {
        display: 'inline-block',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${t.preview}, ${this._darkenForPreview(t.preview)})`,
        border: '2px solid rgba(255, 255, 255, 0.15)',
        flexShrink: '0',
        boxShadow: `0 0 8px ${t.preview}44`,
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
      });
      swatch.className = 'theme-swatch-circle';
      item.appendChild(swatch);

      // Label
      const label = document.createElement('span');
      label.textContent = t.labelZh;
      Object.assign(label.style, {
        letterSpacing: '1px',
        fontWeight: '500',
      });
      item.appendChild(label);

      // English sub-label
      const sublabel = document.createElement('span');
      sublabel.textContent = t.label;
      Object.assign(sublabel.style, {
        fontSize: '9px',
        color: 'rgba(255, 255, 255, 0.3)',
        fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
        letterSpacing: '1px',
        marginLeft: 'auto',
      });
      item.appendChild(sublabel);

      // Hover effect
      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(255, 255, 255, 0.08)';
        item.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        swatch.style.borderColor = t.preview;
        swatch.style.boxShadow = `0 0 12px ${t.preview}66`;
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'rgba(255, 255, 255, 0.04)';
        item.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        swatch.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        swatch.style.boxShadow = `0 0 8px ${t.preview}44`;
      });

      // Click to apply theme
      item.addEventListener('click', () => {
        this.transitionTheme(t.name, 500);
      });

      list.appendChild(item);
    });

    panel.appendChild(list);
    document.body.appendChild(panel);

    this._panel = panel;
    this._updateSwatchActive();

    return panel;
  }

  /**
   * Show the theme selector panel with animation.
   */
  showThemeSelector() {
    const panel = this.createThemeSelector();
    this._panelVisible = true;

    // Force reflow before applying visible state
    panel.offsetHeight; // eslint-disable-line no-unused-expressions
    panel.style.opacity = '1';
    panel.style.visibility = 'visible';
    panel.style.transform = 'translateY(0) scale(1)';
  }

  /**
   * Hide the theme selector panel with animation.
   */
  hideThemeSelector() {
    if (!this._panel) return;
    this._panelVisible = false;

    this._panel.style.opacity = '0';
    this._panel.style.transform = 'translateY(12px) scale(0.95)';
    this._panel.style.visibility = 'hidden';
  }

  // ================================================================
  // Internal helpers
  // ================================================================

  /**
   * Highlight the active theme swatch in the selector panel.
   */
  _updateSwatchActive() {
    if (!this._panel) return;
    const buttons = this._panel.querySelectorAll('button[data-theme]');
    buttons.forEach((btn) => {
      const isActive = btn.dataset.theme === this._current;
      if (isActive) {
        btn.style.background = 'rgba(255, 255, 255, 0.1)';
        btn.style.borderColor = this.themes[this._current].preview + '55';
      } else {
        btn.style.background = 'rgba(255, 255, 255, 0.04)';
        btn.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      }
    });
  }

  /**
   * Darken a hex color for swatch gradient effect.
   * @param {string} hex
   * @returns {string}
   */
  _darkenForPreview(hex) {
    if (typeof hex !== 'string' || hex.length < 7) return hex;
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 60);
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 60);
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 60);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

// Export to global
window.ThemeManager = ThemeManager;
