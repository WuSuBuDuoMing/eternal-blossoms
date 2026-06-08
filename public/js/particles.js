/**
 * 粒子系统 (Canvas 2D)
 * 120 个粉色爱心 + 金色光斑粒子
 * 持续飘落动画：摇摆、旋转、渐隐
 */

class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.enabled = true;
    this.constantGlow = false;

    // R20: Burst particles array
    this.burstParticles = [];

    // 粒子参数
    this.HEART_COUNT = 90;      // 爱心粒子数量（增加密度）
    this.GLOW_COUNT = 60;       // 光斑粒子数量（增加密度）
    this.hueShift = undefined;  // 场景色相偏移
    this.currentMode = 'bloom'; // R22: current color mode

    // R22: Color palettes per mode
    this.colorPalettes = {
      bloom:     { hue: [330, 360], sat: [70, 100] },
      memory:    { hue: [200, 240], sat: [50, 90] },
      starlight: { hue: [40, 60],   sat: [60, 100] },
      timeline:  { hue: [20, 40],   sat: [50, 80] },
      garden:    { hue: [100, 140], sat: [40, 80] },
    };

    // R19: Pre-render glow sprite
    this._glowSprite = null;
    this._createGlowSprite();

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  /** 调整画布尺寸 */
  _resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** R19: Pre-render glow sprite to offscreen canvas */
  _createGlowSprite() {
    const size = 32;
    const offscreen = document.createElement('canvas');
    offscreen.width = size;
    offscreen.height = size;
    const octx = offscreen.getContext('2d');
    const half = size / 2;
    const grad = octx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0, 'rgba(255, 215, 0, 1)');
    grad.addColorStop(0.4, 'rgba(255, 200, 50, 0.5)');
    grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
    octx.beginPath();
    octx.arc(half, half, half, 0, Math.PI * 2);
    octx.fillStyle = grad;
    octx.fill();
    this._glowSprite = offscreen;
  }

  /** 初始化所有粒子 */
  init() {
    this.particles = [];

    // 粉色爱心粒子
    for (let i = 0; i < this.HEART_COUNT; i++) {
      this.particles.push(this._createHeart());
    }

    // 金色光斑粒子
    for (let i = 0; i < this.GLOW_COUNT; i++) {
      this.particles.push(this._createGlow());
    }
  }

  /** 创建一个爱心粒子 */
  _createHeart() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      type: 'heart',
      x: Math.random() * w,
      y: Math.random() * h - h, // 从屏幕上方开始
      size: 4 + Math.random() * 10,
      speedY: 0.3 + Math.random() * 0.6,
      speedX: 0,
      swing: Math.random() * Math.PI * 2,       // 摇摆相位
      swingSpeed: 0.005 + Math.random() * 0.015, // 摇摆速度
      swingAmp: 0.3 + Math.random() * 0.8,       // 摇摆幅度
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      alpha: 0.15 + Math.random() * 0.35,
      alphaSpeed: 0.001 + Math.random() * 0.003,
      alphaDir: 1,
      // 粉色系随机
      hue: 330 + Math.random() * 30, // 330-360 粉色范围
      sat: 70 + Math.random() * 30,
      depth: 0.3 + Math.random() * 0.7, // R21: parallax depth
    };
  }

  /** 创建一个金色光斑粒子 */
  _createGlow() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      type: 'glow',
      x: Math.random() * w,
      y: Math.random() * h - h,
      size: 2 + Math.random() * 4,
      speedY: 0.1 + Math.random() * 0.3,
      speedX: (Math.random() - 0.5) * 0.2,
      alpha: 0.1 + Math.random() * 0.25,
      alphaSpeed: 0.002 + Math.random() * 0.004,
      alphaDir: 1,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.04,
      depth: 0.3 + Math.random() * 0.7, // R21: parallax depth
    };
  }

  /** 绘制单个爱心路径（由调用方管理 transform） */
  _drawHeartPath(ctx, size) {
    const s = size / 15; // 缩放因子
    ctx.save();
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.bezierCurveTo(-8, -14, -22, -10, -14, 0);
    ctx.bezierCurveTo(-10, 8, 0, 16, 0, 22);
    ctx.bezierCurveTo(0, 16, 10, 8, 14, 0);
    ctx.bezierCurveTo(22, -10, 8, -14, 0, -4);
    ctx.closePath();
    ctx.restore();
  }

  /** 更新所有粒子位置 */
  _update() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (const p of this.particles) {
      if (p.type === 'heart') {
        p.swing += p.swingSpeed;
        p.x += Math.sin(p.swing) * p.swingAmp;
        p.y += p.speedY * p.depth; // R21: parallax depth multiplier
        p.rotation += p.rotSpeed;

        // Alpha 呼吸效果
        p.alpha += p.alphaSpeed * p.alphaDir;
        if (p.alpha > 0.5) { p.alphaDir = -1; }
        if (p.alpha < 0.1) { p.alphaDir = 1; }

        // 超出屏幕则重新从顶部生成
        if (p.y > h + 40) {
          p.y = -30;
          p.x = Math.random() * w;
        }
      } else if (p.type === 'glow') {
        p.y += p.speedY * p.depth; // R21: parallax depth multiplier
        p.x += p.speedX;
        p.pulse += p.pulseSpeed;

        // Alpha 脉冲
        p.alpha += p.alphaSpeed * p.alphaDir;
        if (p.alpha > 0.35) { p.alphaDir = -1; }
        if (p.alpha < 0.05) { p.alphaDir = 1; }

        // 超出屏幕则重新生成
        if (p.y > h + 20) {
          p.y = -10;
          p.x = Math.random() * w;
        }
        if (p.x < -20 || p.x > w + 20) {
          p.x = Math.random() * w;
        }
      }
    }

    // R20: Update burst particles
    for (let i = this.burstParticles.length - 1; i >= 0; i--) {
      const bp = this.burstParticles[i];
      bp.x += bp.vx;
      bp.y += bp.vy;
      bp.vx *= 0.96;
      bp.vy *= 0.96;
      bp.life--;
      if (bp.life <= 0) {
        this.burstParticles.splice(i, 1);
      }
    }
  }

  /** 渲染所有粒子 */
  _draw() {
    const ctx = this.ctx;
    const w = window.innerWidth;
    const h = window.innerHeight;

    // 清除画布
    ctx.clearRect(0, 0, w, h);

    if (!this.enabled && !this.constantGlow) return;

    for (const p of this.particles) {
      if (p.type === 'heart') {
        // 应用场景色相偏移
        const effectiveHue = this.hueShift !== undefined
          ? this.hueShift + (p.hue - 345)
          : p.hue;
        const glowStrength = this.constantGlow ? 1.5 : 1;
        const depthAlpha = p.alpha * (0.5 + p.depth * 0.5); // R21: depth-based alpha
        const alpha = Math.min(1, depthAlpha * glowStrength);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        // 发光层
        if (this.constantGlow) {
          ctx.shadowColor = `hsla(${effectiveHue}, ${p.sat}%, 70%, 0.6)`;
          ctx.shadowBlur = 15;
        }

        this._drawHeartPath(ctx, p.size);
        ctx.fillStyle = `hsla(${effectiveHue}, ${p.sat}%, 70%, ${alpha})`;
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'glow') {
        const pulseSize = p.size + Math.sin(p.pulse) * 1.5;
        const depthAlpha = p.alpha * (0.5 + p.depth * 0.5); // R21: depth-based alpha
        const alpha = depthAlpha * (this.constantGlow ? 1.5 : 1);
        const drawSize = pulseSize * 6; // sprite is 32px, scale to desired glow radius

        ctx.save();

        if (this.constantGlow) {
          ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
          ctx.shadowBlur = 20;
        }

        // R19: Use pre-rendered glow sprite instead of per-frame gradient
        ctx.globalAlpha = alpha;
        ctx.drawImage(this._glowSprite, p.x - drawSize / 2, p.y - drawSize / 2, drawSize, drawSize);
        ctx.globalAlpha = 1;

        ctx.restore();
      }
    }

    // R20: Draw burst particles
    for (const bp of this.burstParticles) {
      const burstAlpha = bp.life / bp.maxLife;
      ctx.save();
      ctx.globalAlpha = burstAlpha;
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, bp.size * burstAlpha, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${bp.hue}, 100%, 70%, 1)`;
      ctx.fill();
      ctx.restore();
    }
  }

  /** 动画循环（外部调用） */
  render() {
    this._update();
    this._draw();
  }

  /** 设置 enabled 状态 */
  setEnabled(val) {
    this.enabled = val;
  }

  /** 设置场景模式参数 */
  setConfig(config) {
    if (config.density !== undefined) {
      // 计算目标数量
      const targetHearts = Math.floor(90 * config.density);
      const targetGlows = Math.floor(60 * config.density);

      // 统计当前各类型数量（单次遍历）
      let heartCount = 0;
      let glowCount = 0;
      for (const p of this.particles) {
        if (p.type === 'heart') heartCount++;
        else glowCount++;
      }

      // 如果总数超标，从末尾移除多余的粒子
      const totalTarget = targetHearts + targetGlows;
      while (this.particles.length > totalTarget && this.particles.length > 0) {
        const last = this.particles[this.particles.length - 1];
        if (last.type === 'glow' && glowCount > targetGlows) {
          glowCount--;
        } else if (last.type === 'heart' && heartCount > targetHearts) {
          heartCount--;
        } else if (glowCount > targetGlows) {
          glowCount--;
        } else {
          heartCount--;
        }
        this.particles.pop();
      }

      // 补充不足的粒子（用 for 循环代替 while+filter）
      for (let i = heartCount; i < targetHearts; i++) {
        this.particles.push(this._createHeart());
      }
      for (let i = glowCount; i < targetGlows; i++) {
        this.particles.push(this._createGlow());
      }
    }
    if (config.hue !== undefined) {
      this.hueShift = config.hue;
    }
  }

  /** 设置 Constant Glow 模式 */
  setConstantGlow(val) {
    this.constantGlow = val;
  }
}

// 导出到全局
window.ParticleSystem = ParticleSystem;
