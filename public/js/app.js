/**
 * 永恒花海 · 花海记忆 — 主入口
 *
 * 职责：
 * 1. 加载卡片数据（从后端 API）
 * 2. 初始化所有子系统（粒子、场景、UI）
 * 3. 启动主渲染循环
 * 4. 协调各模块之间的数据流
 */

(async function () {
  'use strict';

  // ================================================================
  // 创建子系统实例
  // ================================================================
  const particles = new ParticleSystem('particle-canvas');
  const scene = new SceneManager('three-canvas');
  const ui = new UIController();

  // ================================================================
  // 初始化
  // ================================================================
  ui.init();
  ui.setLoadingProgress(10, '正在初始化粒子系统 ...');
  particles.init();

  ui.setLoadingProgress(25, '正在构建 3D 场景 ...');
  scene.init();

  ui.setLoadingProgress(40, '正在从花海中采集记忆 ...');

  // ================================================================
  // 从 API 获取卡片数据
  // ================================================================
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
    } else {
      console.error('API 返回失败:', result);
    }
  } catch (err) {
    console.error('获取卡片数据失败，使用本地回退数据:', err);
    // 回退数据（防止 API 不可用时程序崩溃）
    cardsData = _getFallbackData();
  }

  ui.setLoadingProgress(60, `正在绘制 ${cardsData.length} 张记忆卡片 ...`);

  // ================================================================
  // 创建卡片
  // ================================================================
  scene.createCards(cardsData);

  ui.setLoadingProgress(85, '正在点亮花海中的星光 ...');

  // ================================================================
  // 绑定卡片双击事件
  // ================================================================
  scene.onCardDoubleClick = (cardData) => {
    ui.openModal(cardData);
  };

  // ================================================================
  // 绑定进度回调（同步到场景）
  // ================================================================
  ui.onProgressChange = (progress) => {
    scene.globalProgress = progress;
  };

  // ================================================================
  // Constant Glow 开关
  // ================================================================
  ui.onGlowToggle = (enabled) => {
    particles.setConstantGlow(enabled);
  };

  // ================================================================
  // 模拟加载完成
  // ================================================================
  ui.setLoadingProgress(100, '花海已盛开 ...');
  await _sleep(600);
  ui.hideLoader();

  // ================================================================
  // 主渲染循环
  // ================================================================
  function animate() {
    requestAnimationFrame(animate);

    // 更新 UI
    ui.update();

    // 计算布局位置
    const positions = Layouts.computePositions(ui.globalProgress, cardsData.length);
    scene.updateCardPositions(positions);

    // 渲染 Three.js
    scene.render();

    // 渲染粒子
    particles.render();
  }

  animate();

  // ================================================================
  // 场景模式切换
  // ================================================================
  const SCENE_MODES = {
    bloom: {
      name: '花海漫游',
      nameEn: 'BLOOM WALK',
      fogColor: 0x0e0810,
      fogDensity: 0.018,
      cameraDistance: 18,
      particleDensity: 1.0,
      particleHue: 340,
      ambientIntensity: 0.6,
    },
    memory: {
      name: '记忆照片墙',
      nameEn: 'MEMORY WALL',
      fogColor: 0x0a0a18,
      fogDensity: 0.015,
      cameraDistance: 16,
      particleDensity: 0.5,
      particleHue: 220,
      ambientIntensity: 0.8,
    },
    starlight: {
      name: '星光告白',
      nameEn: 'STARLIGHT',
      fogColor: 0x050510,
      fogDensity: 0.012,
      cameraDistance: 22,
      particleDensity: 1.5,
      particleHue: 50,
      ambientIntensity: 0.4,
    },
    timeline: {
      name: '时间长廊',
      nameEn: 'TIMELINE',
      fogColor: 0x0c0808,
      fogDensity: 0.020,
      cameraDistance: 20,
      particleDensity: 0.7,
      particleHue: 30,
      ambientIntensity: 0.5,
    },
    garden: {
      name: '永恒花园',
      nameEn: 'ETERNAL GARDEN',
      fogColor: 0x080e08,
      fogDensity: 0.016,
      cameraDistance: 17,
      particleDensity: 1.2,
      particleHue: 120,
      ambientIntensity: 0.7,
    },
  };

  let currentMode = 'bloom';
  const _reusableColor = new THREE.Color(); // 复用对象，避免 GC 压力

  function applySceneMode(mode) {
    const config = SCENE_MODES[mode];
    if (!config || !scene || !scene.scene) return;

    currentMode = mode;

    // 渐变切换雾效
    if (scene.scene.fog) {
      scene.scene.fog.color.setHex(config.fogColor);
      scene.scene.fog.density = config.fogDensity;
    }
    _reusableColor.setHex(config.fogColor);
    scene.scene.background = _reusableColor;

    // 相机距离
    scene.targetCameraDistance = config.cameraDistance;

    // 粒子设置
    if (particles && particles.setConfig) {
      particles.setConfig({
        density: config.particleDensity,
        hue: config.particleHue,
      });
    }

    // 更新阶段显示
    const stageNameZh = document.getElementById('stage-name-zh');
    const stageNameEn = document.getElementById('stage-name-en');
    if (stageNameZh) stageNameZh.textContent = config.name;
    if (stageNameEn) stageNameEn.textContent = config.nameEn;
  }

  // 绑定场景切换按钮
  const sceneBtns = document.querySelectorAll('.scene-btn');
  sceneBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;
      if (mode === currentMode) return;

      // 更新按钮状态
      sceneBtns.forEach(b => b.classList.remove('scene-btn--active'));
      btn.classList.add('scene-btn--active');

      // 应用场景
      applySceneMode(mode);
    });
  });

  // ================================================================
  // 辅助函数
  // ================================================================

  function _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function _getFallbackData() {
    const emojis = ['😊','☀️','🌧️','⭐','🌅','☕','🍂','❄️','🌸','🌙','📖','🍳'];
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

    return emojis.map((e, i) => ({
      id: i + 1,
      title: titles[i],
      titleEn: titlesEn[i],
      desc: descs[i],
      emoji: e,
      gradient: `linear-gradient(135deg, ${colors[i]} 0%, ${colors[(i+1)%12]} 100%)`,
      color: colors[i],
    }));
  }
})();
