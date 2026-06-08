/**
 * 分享与 URL 状态模块 (R51-R55)
 *
 * R51 - URL State Sync
 * R52 - Share Card
 * R53 - Screenshot
 * R54 - Open Graph Image Generation
 * R55 - Social Meta Tags Updater
 */

// ============================================================
// R51 - URL 状态同步
// ============================================================
class UrlState {
  constructor() {
    this._syncTimer = null;
    this._syncInterval = 500; // 节流 500ms
  }

  /**
   * 将当前状态同步到 URL hash
   * 格式: #mode=bloom&p=0.35&card=5
   */
  sync(state) {
    if (this._syncTimer) return;
    this._syncTimer = setTimeout(() => {
      this._syncTimer = null;
      const params = new URLSearchParams();
      if (state.mode) params.set('mode', state.mode);
      if (state.progress !== undefined) params.set('p', state.progress.toFixed(3));
      if (state.card) params.set('card', String(state.card));
      const hash = params.toString();
      if (hash) {
        history.replaceState(null, '', '#' + hash);
      }
    }, this._syncInterval);
  }

  /**
   * 从 URL hash 解析状态
   */
  read() {
    const hash = location.hash.slice(1);
    if (!hash) return {};
    const params = new URLSearchParams(hash);
    const state = {};
    if (params.has('mode')) state.mode = params.get('mode');
    if (params.has('p')) state.progress = parseFloat(params.get('p'));
    if (params.has('card')) state.card = parseInt(params.get('card'), 10);
    return state;
  }
}

// ============================================================
// R52 - 卡片分享
// ============================================================
class CardSharer {
  /**
   * 使用 Web Share API 分享卡片
   */
  async shareCard(cardData) {
    const shareData = {
      title: `${cardData.emoji} ${cardData.title} — 永恒花海`,
      text: cardData.desc,
      url: this._getCardUrl(cardData.id),
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return { success: true, method: 'web-share' };
      } catch (err) {
        if (err.name === 'AbortError') return { success: false, method: 'cancelled' };
        // Fall through to clipboard
      }
    }

    return this.copyLink(cardData.id);
  }

  /**
   * 复制链接到剪贴板
   */
  async copyLink(cardId) {
    const url = this._getCardUrl(cardId);
    try {
      await navigator.clipboard.writeText(url);
      return { success: true, method: 'clipboard' };
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      return { success: true, method: 'execCommand' };
    }
  }

  /**
   * 微信分享（生成可复制的链接）
   */
  shareToWechat(cardData) {
    const url = this._getCardUrl(cardData.id);
    return this.copyLink(cardData.id);
  }

  _getCardUrl(cardId) {
    const base = location.origin + location.pathname;
    return `${base}#card=${cardId}`;
  }
}

// ============================================================
// R53 - 截图功能
// ============================================================
class CardScreenshot {
  /**
   * 将卡片模态框内容绘制到 Canvas 并返回 dataURL
   */
  static captureCard(cardData) {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    // 背景渐变
    const grad = ctx.createLinearGradient(0, 0, 800, 600);
    grad.addColorStop(0, '#0a0a12');
    grad.addColorStop(1, '#12121e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 600);

    // 卡片区域
    const cardW = 380;
    const cardH = 480;
    const cx = (800 - cardW) / 2;
    const cy = (600 - cardH) / 2;

    // 圆角矩形
    ctx.save();
    ctx.beginPath();
    const r = 24;
    ctx.moveTo(cx + r, cy);
    ctx.lineTo(cx + cardW - r, cy);
    ctx.arcTo(cx + cardW, cy, cx + cardW, cy + r, r);
    ctx.lineTo(cx + cardW, cy + cardH - r);
    ctx.arcTo(cx + cardW, cy + cardH, cx + cardW - r, cy + cardH, r);
    ctx.lineTo(cx + r, cy + cardH);
    ctx.arcTo(cx, cy + cardH, cx, cy + cardH - r, r);
    ctx.lineTo(cx, cy + r);
    ctx.arcTo(cx, cy, cx + r, cy, r);
    ctx.closePath();

    // 渐变填充
    const cardGrad = ctx.createLinearGradient(cx, cy, cx, cy + cardH);
    cardGrad.addColorStop(0, cardData.color || '#667eea');
    cardGrad.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = cardGrad;
    ctx.fill();
    ctx.restore();

    // Emoji
    ctx.font = '80px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cardData.emoji, 400, cy + 120);

    // 标题
    ctx.font = 'bold 36px Georgia, serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(cardData.title, 400, cy + 220);

    // 英文标题
    ctx.font = '600 14px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(cardData.titleEn, 400, cy + 260);

    // 描述
    ctx.font = '18px Georgia, serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    const desc = cardData.desc;
    const maxW = cardW - 60;
    if (ctx.measureText(desc).width <= maxW) {
      ctx.fillText(desc, 400, cy + 330);
    } else {
      const mid = Math.floor(desc.length / 2);
      ctx.fillText(desc.slice(0, mid), 400, cy + 320);
      ctx.fillText(desc.slice(mid), 400, cy + 350);
    }

    // 水印
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillText('🌸 永恒花海 · ETERNAL BLOSSOMS', 400, cy + cardH - 20);

    return canvas.toDataURL('image/png');
  }

  /**
   * 触发下载
   */
  static download(canvas, filename = 'eternal-blossoms-card.png') {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }
}

// ============================================================
// R54 - Open Graph 图片生成
// ============================================================
class OgImageGenerator {
  /**
   * 生成 1200x630 的 OG 图片
   */
  static generate(cardData) {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');

    // 渐变背景
    const bg = ctx.createLinearGradient(0, 0, 1200, 630);
    bg.addColorStop(0, '#0a0a12');
    bg.addColorStop(0.5, '#12121e');
    bg.addColorStop(1, '#0a0a12');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1200, 630);

    // 彩色光晕
    const glowGrad = ctx.createRadialGradient(600, 315, 0, 600, 315, 400);
    const c = cardData.color || '#ff6b9d';
    glowGrad.addColorStop(0, c + '40');
    glowGrad.addColorStop(0.5, c + '15');
    glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, 1200, 630);

    // Emoji（超大）
    ctx.font = '140px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cardData.emoji, 600, 220);

    // 中文标题
    ctx.font = 'bold 56px Georgia, serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 20;
    ctx.fillText(cardData.title, 600, 360);
    ctx.shadowBlur = 0;

    // 英文标题
    ctx.font = '600 20px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(cardData.titleEn, 600, 410);

    // 底部品牌
    ctx.font = '16px monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText('🌸 永恒花海 · ETERNAL BLOSSOMS — HUA HAI JI YI', 600, 580);

    return canvas.toDataURL('image/png');
  }
}

// ============================================================
// R55 - 社交 Meta 标签动态更新
// ============================================================
class SocialMetaUpdater {
  /**
   * 动态更新页面 meta 标签（用于分享预览）
   */
  static updateMetaTags(cardData) {
    // 更新标题
    document.title = `${cardData.emoji} ${cardData.title} — 永恒花海`;

    // 更新 Open Graph
    this._setMeta('og:title', `${cardData.emoji} ${cardData.title} — 永恒花海`);
    this._setMeta('og:description', cardData.desc);

    // 更新 Twitter Card
    this._setMeta('twitter:title', `${cardData.emoji} ${cardData.title} — 永恒花海`);
    this._setMeta('twitter:description', cardData.desc);

    // 生成 OG 图片并设置
    const ogImageData = OgImageGenerator.generate(cardData);
    this._setMeta('og:image', ogImageData);
  }

  /**
   * 重置为默认 meta 标签
   */
  static resetMetaTags() {
    document.title = '永恒花海 · 花海记忆 | ETERNAL BLOSSOMS';
    this._setMeta('og:title', '永恒花海 · 花海记忆 | ETERNAL BLOSSOMS');
    this._setMeta('og:description', 'ETERNAL BLOSSOMS — 一个沉浸式 3D 照片卡片画廊');
    this._setMeta('twitter:title', '永恒花海 · 花海记忆 | ETERNAL BLOSSOMS');
    this._setMeta('twitter:description', 'ETERNAL BLOSSOMS — 一个沉浸式 3D 照片卡片画廊');
  }

  static _setMeta(property, content) {
    let el = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
    if (el) {
      el.setAttribute('content', content);
    } else {
      el = document.createElement('meta');
      if (property.startsWith('og:')) {
        el.setAttribute('property', property);
      } else {
        el.setAttribute('name', property);
      }
      el.setAttribute('content', content);
      document.head.appendChild(el);
    }
  }
}

// ============================================================
// 导出
// ============================================================
window.UrlState = UrlState;
window.CardSharer = CardSharer;
window.CardScreenshot = CardScreenshot;
window.OgImageGenerator = OgImageGenerator;
window.SocialMetaUpdater = SocialMetaUpdater;
