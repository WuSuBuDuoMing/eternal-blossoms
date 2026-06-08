/**
 * Three.js 3D 场景管理器
 *
 * - 场景、相机、渲染器初始化
 * - CanvasTexture 卡片纹理
 * - 光照系统
 * - 鼠标拖拽旋转
 * - 自动缓慢旋转
 * - 卡片位置更新（配合 Layouts 算法）
 * - 双击射线检测
 */

class SceneManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);

    // Three.js 核心
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.cards = [];       // Three.js Mesh 数组
    this.cardData = [];    // 原始卡片数据

    // 交互状态
    this.globalProgress = 0;
    this.targetProgress = 0;
    this.isDragging = false;
    this.prevMouse = { x: 0, y: 0 };
    this.cameraAngle = { theta: 0, phi: 0.3 };
    this.targetAngle = { theta: 0, phi: 0.3 };
    this.autoRotateSpeed = 0.0003;
    this.cameraDistance = 18;
    this.targetCameraDistance = 18; // 触摸缩放目标值

    // 射线检测
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.onCardDoubleClick = null; // 回调

    // 环境光效
    this.ambientParticles = [];
    this.glowSprites = [];
  }

  /**
   * 初始化场景
   */
  init() {
    // 场景 — 深色暖调雾效
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0e0810, 0.018);

    // 相机
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 200);
    this.camera.position.set(0, 0, this.cameraDistance);

    // 渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.sortObjects = true; // R15: better render order

    // R17: hover highlight state
    this._hoveredCard = null;
    this._sceneStartTime = Date.now();

    // 光照
    this._setupLights();

    // 环境光斑
    this._createAmbientGlow();

    // 事件绑定
    this._bindEvents();
  }

  /**
   * 光照系统 — 更温暖、更有氛围感
   */
  _setupLights() {
    // 环境光 — 偏暖
    const ambient = new THREE.AmbientLight(0xfff0e6, 0.35);
    this.scene.add(ambient);

    // 主灯 — 温暖粉橙色（模拟夕阳/烛光）
    const keyLight = new THREE.DirectionalLight(0xffb088, 0.9);
    keyLight.position.set(5, 10, 7);
    this.scene.add(keyLight);

    // 补光 — 柔和紫色
    const fillLight = new THREE.DirectionalLight(0xd4a0e0, 0.35);
    fillLight.position.set(-5, 3, -5);
    this.scene.add(fillLight);

    // 底光 — 金色暖光
    const rimLight = new THREE.PointLight(0xffaa44, 0.4, 35);
    rimLight.position.set(0, -5, 0);
    this.scene.add(rimLight);

    // 顶光 — 柔和白色（增加高光）
    const topLight = new THREE.PointLight(0xffffff, 0.15, 40);
    topLight.position.set(0, 12, 5);
    this.scene.add(topLight);
  }

  /**
   * 创建环境光斑装饰 — 更丰富的光效
   */
  _createAmbientGlow() {
    const count = 50;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 45;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 35;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 45 - 5;
      sizes[i] = 0.05 + Math.random() * 0.2;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // 使用精灵材质 — 金色暖光
    const mat = new THREE.PointsMaterial({
      color: 0xffcc66,
      size: 0.12,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const points = new THREE.Points(geo, mat);
    this.scene.add(points);
    this.ambientParticles.push({ mesh: points, geo, mat, originalPositions: new Float32Array(positions) });

    // 添加第二层 — 粉色光斑
    const geo2 = new THREE.BufferGeometry();
    const positions2 = new Float32Array(30 * 3);
    for (let i = 0; i < 30; i++) {
      positions2[i * 3] = (Math.random() - 0.5) * 50;
      positions2[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions2[i * 3 + 2] = (Math.random() - 0.5) * 50 - 3;
    }
    geo2.setAttribute('position', new THREE.BufferAttribute(positions2, 3));
    const mat2 = new THREE.PointsMaterial({
      color: 0xff88aa,
      size: 0.08,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const points2 = new THREE.Points(geo2, mat2);
    this.scene.add(points2);
    this.ambientParticles.push({ mesh: points2, geo: geo2, mat: mat2, originalPositions: new Float32Array(positions2) });
  }

  /**
   * 为卡片数据创建 CanvasTexture — 照片级艺术卡片
   * 每张卡片使用独特的多层渐变、光斑、纹理，模拟真实照片质感
   */
  createCardTexture(cardData, quality = 'high') {
    const width = quality === 'low' ? 256 : 512;
    const height = quality === 'low' ? 320 : 640;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 圆角矩形辅助
    const cornerR = quality === 'low' ? 14 : 28;
    const roundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.arcTo(x + w, y, x + w, y + r, r);
      ctx.lineTo(x + w, y + h - r);
      ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
      ctx.lineTo(x + r, y + h);
      ctx.arcTo(x, y + h, x, y + h - r, r);
      ctx.lineTo(x, y + r);
      ctx.arcTo(x, y, x + r, y, r);
      ctx.closePath();
    };

    // 裁剪为圆角
    roundRect(0, 0, width, height, cornerR);
    ctx.clip();

    const c = cardData.color || '#667eea';
    const seed = (cardData.id || 1) * 7.31; // 基于 ID 的伪随机种子

    // === 第 1 层：主渐变背景 ===
    const grad = ctx.createLinearGradient(0, 0, width * 0.3, height);
    grad.addColorStop(0, c);
    grad.addColorStop(0.5, this._lightenColor(c, 0.15));
    grad.addColorStop(1, this._darkenColor(c, 0.35));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // === 第 2 层：径向光晕（模拟光源） ===
    const lightX = width * (0.3 + (seed % 0.4));
    const lightY = height * (0.2 + ((seed * 1.7) % 0.3));
    const radialGrad = ctx.createRadialGradient(lightX, lightY, 0, lightX, lightY, width * 0.7);
    radialGrad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
    radialGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.06)');
    radialGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radialGrad;
    ctx.fillRect(0, 0, width, height);

    // === 第 3 层：散景光斑（Bokeh）— R16: skip on low quality ===
    if (quality !== 'low') {
      const bokehCount = 6 + Math.floor(seed % 5);
      for (let i = 0; i < bokehCount; i++) {
        const bx = ((seed * (i + 1) * 13.7) % width);
        const by = ((seed * (i + 1) * 23.3) % height);
        const br = 20 + ((seed * (i + 1)) % 60);
        const bAlpha = 0.04 + ((seed * (i + 1) * 7) % 8) / 100;

        const bokehGrad = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        bokehGrad.addColorStop(0, `rgba(255, 255, 255, ${bAlpha * 2})`);
        bokehGrad.addColorStop(0.5, `rgba(255, 255, 255, ${bAlpha})`);
        bokehGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = bokehGrad;
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // === 第 4 层：彩色光斑（暖色调）— R16: skip on low quality ===
    if (quality !== 'low') {
      const warmColors = ['rgba(255,180,120,0.06)', 'rgba(255,150,200,0.05)', 'rgba(200,180,255,0.05)', 'rgba(255,220,100,0.04)'];
      for (let i = 0; i < 3; i++) {
        const wx = ((seed * (i + 3) * 17.1) % width);
        const wy = ((seed * (i + 3) * 29.3) % height);
        const wr = 40 + ((seed * (i + 3)) % 80);
        const wGrad = ctx.createRadialGradient(wx, wy, 0, wx, wy, wr);
        wGrad.addColorStop(0, warmColors[i % warmColors.length]);
        wGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = wGrad;
        ctx.beginPath();
        ctx.arc(wx, wy, wr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // === 第 5 层：对角光线 ===
    ctx.save();
    ctx.globalAlpha = 0.06;
    const rayAngle = -0.4 + (seed % 0.8);
    ctx.translate(width / 2, height / 2);
    ctx.rotate(rayAngle);
    const rayGrad = ctx.createLinearGradient(-width, 0, width, 0);
    rayGrad.addColorStop(0, 'rgba(255,255,255,0)');
    rayGrad.addColorStop(0.4, 'rgba(255,255,255,1)');
    rayGrad.addColorStop(0.6, 'rgba(255,255,255,1)');
    rayGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = rayGrad;
    ctx.fillRect(-width, -8, width * 2, 16);
    ctx.restore();

    // === 第 6 层：纹理噪点（模拟胶片质感） ===
    ctx.save();
    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 200; i++) {
      const nx = ((seed * i * 3.7) % width);
      const ny = ((seed * i * 5.3) % height);
      const ns = 1 + ((seed * i) % 2);
      ctx.fillStyle = ((seed * i * 11.3) % 1) > 0.5 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
      ctx.fillRect(nx, ny, ns, ns);
    }
    ctx.restore();

    // === 第 7 层：底部暗角 ===
    const vignetteGrad = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.8);
    vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
    vignetteGrad.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, width, height);

    // === 第 8 层：卡片内容 ===
    // 半透明叠加层 — 增加质感
    const overlay = ctx.createLinearGradient(0, 0, 0, height);
    overlay.addColorStop(0, 'rgba(255,255,255,0.08)');
    overlay.addColorStop(0.4, 'rgba(255,255,255,0)');
    overlay.addColorStop(0.7, 'rgba(0,0,0,0.05)');
    overlay.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, width, height);

    // 边框 — 柔和发光
    roundRect(2, 2, width - 4, height - 4, 26);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Emoji — 带发光效果
    ctx.save();
    ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
    ctx.shadowBlur = 20;
    ctx.font = '80px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cardData.emoji, width / 2, height * 0.3);
    ctx.restore();

    // 中文标题 — 带阴影
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 2;
    ctx.font = 'bold 42px "Georgia", "SimSun", serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cardData.title, width / 2, height * 0.52);
    ctx.restore();

    // 英文标题
    ctx.font = '600 16px "SF Mono", "Consolas", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cardData.titleEn, width / 2, height * 0.61);

    // 分隔线 — 发光
    const lineY = height * 0.68;
    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,0.3)';
    ctx.shadowBlur = 6;
    const lineGrad = ctx.createLinearGradient(width * 0.25, 0, width * 0.75, 0);
    lineGrad.addColorStop(0, 'rgba(255,255,255,0)');
    lineGrad.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    lineGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.moveTo(width * 0.25, lineY);
    ctx.lineTo(width * 0.75, lineY);
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // 描述文字（自动换行，最多3行，超出加省略号）
    ctx.font = '22px "Georgia", "SimSun", serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const desc = cardData.desc;
    const maxWidth = width * 0.82;
    const lineHeight = 30;
    const maxLines = 3;
    const lines = [];

    // 逐行测量并断行
    let remaining = desc;
    for (let line = 0; line < maxLines && remaining.length > 0; line++) {
      if (line === maxLines - 1) {
        // 最后一行：如果还有剩余文字，加省略号
        let testLine = remaining;
        while (ctx.measureText(testLine + '...').width > maxWidth && testLine.length > 0) {
          testLine = testLine.slice(0, -1);
        }
        lines.push(testLine.length < remaining.length ? testLine + '...' : testLine);
        break;
      }
      // 找到当前行能放下的最大字符数
      let cutPos = remaining.length;
      while (cutPos > 0 && ctx.measureText(remaining.slice(0, cutPos)).width > maxWidth) {
        cutPos--;
      }
      lines.push(remaining.slice(0, cutPos));
      remaining = remaining.slice(cutPos);
    }

    // 居中绘制所有行
    const totalTextHeight = lines.length * lineHeight;
    const startY = height * 0.78 - totalTextHeight / 2 + lineHeight / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line, width / 2, startY + i * lineHeight);
    });

    // 底部装饰文字
    ctx.font = '10px "SF Mono", "Consolas", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.textAlign = 'center';
    ctx.fillText('ETERNAL BLOSSOMS', width / 2, height * 0.94);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    return texture;
  }

  /**
   * 颜色加深辅助
   */
  _darkenColor(hex, factor) {
    if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) return hex || '#667eea';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.floor(r * (1 - factor))}, ${Math.floor(g * (1 - factor))}, ${Math.floor(b * (1 - factor))})`;
  }

  /**
   * 颜色提亮辅助
   */
  _lightenColor(hex, factor) {
    if (typeof hex !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hex)) return hex || '#667eea';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.min(255, Math.floor(r + (255 - r) * factor))}, ${Math.min(255, Math.floor(g + (255 - g) * factor))}, ${Math.min(255, Math.floor(b + (255 - b) * factor))})`;
  }

  /**
   * 创建所有卡片 Mesh
   */
  createCards(cardsData) {
    // 清理旧卡片的 GPU 资源（防止纹理泄漏）
    this.cards.forEach(c => {
      c.material.map?.dispose();
      c.material.dispose();
    });
    this.cards = [];

    this.cardData = cardsData;

    const cardWidth = 2.8;
    const cardHeight = 3.5;
    const geometry = new THREE.PlaneGeometry(cardWidth, cardHeight);

    cardsData.forEach((card, i) => {
      const texture = this.createCardTexture(card, 'high');

      const material = new THREE.MeshStandardMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        roughness: 0.35,
        metalness: 0.05,
        emissive: new THREE.Color(card.color),
        emissiveIntensity: 0.12,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = true; // R15: enable frustum culling
      mesh.userData = {
        cardData: card,
        index: i,
        targetOpacity: 1,        // R18: fade-in target
        fadeDelay: i * 0.05,     // R18: stagger delay (seconds)
        quality: 'high',         // R16: current texture quality
        originalScale: 1,        // R17: store original scale
        originalEmissiveIntensity: 0.12, // R17: store original emissive
      };

      // 初始位置：远处
      mesh.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 30,
        -20 - Math.random() * 20
      );
      mesh.scale.setScalar(0.01);

      this.scene.add(mesh);
      this.cards.push(mesh);
    });
  }

  /**
   * 更新卡片位置（由外部调用，传入布局位置数组）
   */
  updateCardPositions(positions) {
    const elapsed = (Date.now() - this._sceneStartTime) / 1000; // seconds since init

    for (let i = 0; i < this.cards.length && i < positions.length; i++) {
      const mesh = this.cards[i];
      const pos = positions[i];

      // R18: staggered fade-in — only start fading after fadeDelay has elapsed
      if (elapsed < mesh.userData.fadeDelay) {
        mesh.userData.targetOpacity = 0;
      } else {
        mesh.userData.targetOpacity = 1;
      }

      // R16: LOD — switch to low quality texture for far-away cards
      const distFromCamera = this.camera.position.distanceTo(mesh.position);
      const newQuality = distFromCamera > 25 ? 'low' : 'high';
      if (mesh.userData.quality !== newQuality) {
        mesh.material.map?.dispose();
        mesh.material.map = this.createCardTexture(mesh.userData.cardData, newQuality);
        mesh.material.needsUpdate = true;
        mesh.userData.quality = newQuality;
      }

      // 平滑插值到目标位置
      const lerp = 0.06; // 插值速度
      mesh.position.x += (pos.x - mesh.position.x) * lerp;
      mesh.position.y += (pos.y - mesh.position.y) * lerp;
      mesh.position.z += (pos.z - mesh.position.z) * lerp;

      // 旋转插值
      mesh.rotation.x += (pos.rx - mesh.rotation.x) * lerp;
      mesh.rotation.y += (pos.ry - mesh.rotation.y) * lerp;
      mesh.rotation.z += (pos.rz - mesh.rotation.z) * lerp;

      // 缩放插值 — R17: use hover scale if hovered, otherwise layout scale
      const s = pos.scale;
      const baseScale = mesh.userData._hovered ? s * 1.05 : s;
      mesh.userData.originalScale = s; // R17: keep track of layout scale
      mesh.scale.x += (baseScale - mesh.scale.x) * lerp;
      mesh.scale.y += (baseScale - mesh.scale.y) * lerp;
      mesh.scale.z += (baseScale - mesh.scale.z) * lerp;

      // R17: emissive intensity on hover
      const targetEmissive = mesh.userData._hovered ? 0.35 : mesh.userData.originalEmissiveIntensity;
      mesh.material.emissiveIntensity += (targetEmissive - mesh.material.emissiveIntensity) * 0.1;

      // 淡入（lerp，帧率无关）
      mesh.material.opacity += (mesh.userData.targetOpacity - mesh.material.opacity) * 0.05;
    }
  }

  /**
   * 事件绑定
   */
  _bindEvents() {
    // 鼠标按下
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.prevMouse.x = e.clientX;
      this.prevMouse.y = e.clientY;
    });

    // 鼠标移动
    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const dx = e.clientX - this.prevMouse.x;
        const dy = e.clientY - this.prevMouse.y;

        this.targetAngle.theta -= dx * 0.005;
        this.targetAngle.phi = Math.max(-0.8, Math.min(0.8,
          this.targetAngle.phi - dy * 0.005
        ));

        this.prevMouse.x = e.clientX;
        this.prevMouse.y = e.clientY;
      }
    });

    // 鼠标松开
    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // 触摸支持
    let touchStart = { x: 0, y: 0 };
    let touchDist = 0;

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        touchStart.x = e.touches[0].clientX;
        touchStart.y = e.touches[0].clientY;
        this.prevMouse.x = touchStart.x;
        this.prevMouse.y = touchStart.y;
      } else if (e.touches.length === 2) {
        // 双指缩放
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchDist = Math.sqrt(dx * dx + dy * dy);
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging) {
        const dx = e.touches[0].clientX - this.prevMouse.x;
        const dy = e.touches[0].clientY - this.prevMouse.y;

        this.targetAngle.theta -= dx * 0.005;
        this.targetAngle.phi = Math.max(-0.8, Math.min(0.8,
          this.targetAngle.phi - dy * 0.005
        ));

        this.prevMouse.x = e.touches[0].clientX;
        this.prevMouse.y = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newDist = Math.sqrt(dx * dx + dy * dy);
        const delta = touchDist - newDist;
        this.targetCameraDistance = Math.max(8, Math.min(35, this.targetCameraDistance + delta * 0.03));
        touchDist = newDist;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      this.isDragging = false;
      // 重置触摸缩放状态，避免下次手势继承旧距离
      if (e.touches.length < 2) {
        touchDist = 0;
      }
    }, { passive: true });

    // R17: Hover highlight via mousemove raycasting
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isDragging) return;
      const mx = (e.clientX / window.innerWidth) * 2 - 1;
      const my = -(e.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera({ x: mx, y: my }, this.camera);
      const intersects = this.raycaster.intersectObjects(this.cards);

      // Un-hover previous card
      if (this._hoveredCard && this._hoveredCard !== (intersects.length > 0 ? intersects[0].object : null)) {
        this._hoveredCard.userData._hovered = false;
        this._hoveredCard = null;
        this.canvas.style.cursor = 'default';
      }

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        hit.userData._hovered = true;
        this._hoveredCard = hit;
        this.canvas.style.cursor = 'pointer';
      }
    });

    // 双击检测
    this.canvas.addEventListener('dblclick', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.cards);

      if (intersects.length > 0 && this.onCardDoubleClick) {
        const card = intersects[0].object;
        this.onCardDoubleClick(card.userData.cardData);
      }
    });

    // 窗口缩放（防抖）
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      }, 100);
    });
  }

  /**
   * 渲染循环（外部调用）
   */
  render() {
    // 自动缓慢旋转（非拖拽时）
    if (!this.isDragging) {
      this.targetAngle.theta += this.autoRotateSpeed;
    }

    // 平滑相机角度
    this.cameraAngle.theta += (this.targetAngle.theta - this.cameraAngle.theta) * 0.05;
    this.cameraAngle.phi += (this.targetAngle.phi - this.cameraAngle.phi) * 0.05;
    this.cameraDistance += (this.targetCameraDistance - this.cameraDistance) * 0.08;

    // 更新相机位置
    this.camera.position.x = this.cameraDistance * Math.sin(this.cameraAngle.theta) * Math.cos(this.cameraAngle.phi);
    this.camera.position.y = this.cameraDistance * Math.sin(this.cameraAngle.phi);
    this.camera.position.z = this.cameraDistance * Math.cos(this.cameraAngle.theta) * Math.cos(this.cameraAngle.phi);
    this.camera.lookAt(0, 0, -4);

    // 环境光斑动画（基于原始位置，避免累积漂移）
    const now = Date.now();
    for (const ap of this.ambientParticles) {
      const positions = ap.geo.attributes.position.array;
      const orig = ap.originalPositions;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] = orig[i + 1] + Math.sin(now * 0.001 + i) * 0.3;
      }
      ap.geo.attributes.position.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// 导出到全局
window.SceneManager = SceneManager;
