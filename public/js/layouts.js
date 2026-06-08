/**
 * 七种 3D 布局模式算法
 *
 * ARRIVAL  — 晨曦初临  (0%)
 * FAN      — 卷帘展开  (20%)
 * GATHER   — 同心汇聚  (35%)
 * WAVE     — 正弦波动  (45%)
 * GRID     — 网格呼吸  (55%)
 * SPIRAL   — 螺旋花涡  (70%)
 * DEPART   — 永恒归宿  (92%)
 *
 * 所有布局函数接收 (index, total, progress) 返回 { x, y, z, rx, ry, rz, scale }
 * progress 为 0~1，表示该布局在整个滚动中的位置权重
 */

class Layouts {

  // ================================================================
  // 工具方法
  // ================================================================

  // ================================================================
  // 缓动函数集合
  // ================================================================
  static easingFunctions = {
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeOutBack: t => {
      const c = 1.70158;
      return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
    },
  };

  /**
   * smoothstep 缓动
   */
  static smoothstep(edge0, edge1, x) {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  /**
   * 在两个布局之间做插值
   */
  static lerp(a, b, t) {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: a.z + (b.z - a.z) * t,
      rx: a.rx + (b.rx - a.rx) * t,
      ry: a.ry + (b.ry - a.ry) * t,
      rz: a.rz + (b.rz - a.rz) * t,
      scale: a.scale + (b.scale - a.scale) * t,
    };
  }

  /**
   * 黄金比例
   */
  static PHI = (1 + Math.sqrt(5)) / 2;

  /**
   * 确定性伪随机：基于 index 生成 -1~1 之间的值，每帧结果一致
   */
  static _deterministicRand(index) {
    return Math.sin(index * 127.1 + 311.7) * 43758.5453 % 1;
  }

  // ================================================================
  // 布局 1: ARRIVAL — 晨曦初临
  // 卡片从远处飞入，在空间中散开
  // ================================================================
  static ARRIVAL(index, total) {
    if (total <= 0) return { x: 0, y: 0, z: -8, rx: 0, ry: 0, rz: 0, scale: 1 };
    const angle = (index / total) * Math.PI * 2;
    const radius = 4 + (index / total) * 6;

    // 从远处飞入的效果（使用确定性伪随机，避免每帧抖动）
    const spread = 1.0;
    const x = Math.cos(angle) * radius * spread;
    const y = Layouts._deterministicRand(index) * 2 + Math.sin(index * 0.5) * 1.5;
    const z = Math.sin(angle) * radius * spread;

    return {
      x: x,
      y: y,
      z: z - 8, // 稍微靠后
      rx: 0,
      ry: -angle + Math.PI,
      rz: 0,
      scale: 1.0,
    };
  }

  // ================================================================
  // 布局 2: FAN — 卷帘展开（手风琴扇形折叠）
  // ================================================================
  static FAN(index, total) {
    if (total <= 1) return { x: 0, y: 0, z: -8, rx: 0, ry: 0, rz: 0, scale: 0.9 };
    const t = index / (total - 1); // 0 ~ 1
    const spreadAngle = Math.PI * 0.8; // 总展开角度
    const startAngle = -spreadAngle / 2;
    const angle = startAngle + t * spreadAngle;

    const radius = 8;
    const x = Math.sin(angle) * radius;
    const y = 0;
    const z = Math.cos(angle) * radius - 8;

    // 旋转：让卡片朝外
    const ry = -angle;
    // 手风琴折叠效果：交错翻转
    const fold = Math.sin(t * Math.PI * 5) * 0.15;

    return {
      x: x,
      y: y + fold,
      z: z,
      rx: fold,
      ry: ry,
      rz: 0,
      scale: 0.9,
    };
  }

  // ================================================================
  // 布局 3: GATHER — 同心汇聚（Fibonacci 球面分布）
  // ================================================================
  static GATHER(index, total) {
    // Fibonacci 球面分布
    const phi = Math.acos(1 - 2 * (index + 0.5) / total);
    const theta = Math.PI * (1 + Math.sqrt(5)) * index;

    const radius = 6;
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta) - 8;

    return {
      x: x,
      y: y,
      z: z,
      rx: 0,
      ry: -theta,
      rz: 0,
      scale: 0.85,
    };
  }

  // ================================================================
  // 布局 4: GRID — 网格呼吸（Bernoulli 双纽线 ∞ 形）
  // ================================================================
  static GRID(index, total) {
    // Bernoulli 双纽线: r^2 = a^2 * cos(2*theta)
    const a = 5;
    const t = index / total;
    const theta = t * Math.PI * 2;

    // 双纽线方程
    const r2 = a * a * Math.cos(2 * theta);
    if (r2 < 0) {
      // 如果在不可达区域，使用投影
      const projAngle = Math.floor(t * 2) * Math.PI + (t % 0.5) * 2 * Math.PI;
      return {
        x: Math.cos(theta) * a * 0.8,
        y: Math.sin(theta) * a * 0.4,
        z: -8,
        rx: 0,
        ry: -theta,
        rz: 0,
        scale: 0.8,
      };
    }

    const r = Math.sqrt(r2);
    const x = r * Math.cos(theta);
    const y = r * Math.sin(theta) * 0.4; // 扁平化
    const z = -8;

    return {
      x: x,
      y: y,
      z: z,
      rx: 0,
      ry: -theta,
      rz: Math.sin(theta) * 0.1, // 微倾斜
      scale: 0.8,
    };
  }

  // ================================================================
  // 布局 5: SPIRAL — 螺旋花涡（三圈螺旋涡流）
  // ================================================================
  static SPIRAL(index, total) {
    const t = index / total;
    const spiralTurns = 3; // 三圈
    const angle = t * Math.PI * 2 * spiralTurns;

    // 螺旋半径随高度收缩
    const maxR = 7;
    const r = maxR * (1 - t * 0.5);

    const x = Math.cos(angle) * r;
    const y = (t - 0.5) * 8; // 垂直展开
    const z = Math.sin(angle) * r - 8;

    // 螺旋旋转
    const ry = -angle;

    return {
      x: x,
      y: y,
      z: z,
      rx: 0,
      ry: ry,
      rz: 0,
      scale: 0.8 + t * 0.2,
    };
  }

  // ================================================================
  // 布局 5b: WAVE — 正弦波动（沿X轴的正弦波排列）
  // ================================================================
  static WAVE(index, total) {
    const t = index / total;
    const x = (t - 0.5) * 20;
    const y = Math.sin(index * 0.8) * 3;
    const z = -8 + Math.cos(index * 0.5) * 2;

    return {
      x: x,
      y: y,
      z: z,
      rx: 0,
      ry: 0,
      rz: Math.cos(index * 0.8) * 0.15,
      scale: 0.85,
    };
  }

  // ================================================================
  // 布局 6: DEPART — 永恒归宿（心形参数曲线环绕）
  // ================================================================
  static DEPART(index, total) {
    // 变量密度映射：在心形顶部（cusp）分配更多点，使曲线更平滑
    // 先用均匀 t，再通过密度重映射让 cusp 附近（t=0 和 t=PI 区域）点更密集
    const u = index / total; // 0~1 均匀
    // 使用 sin^2 映射让 t=0.5 (心形底部) 稀疏，t=0/1 (心形顶部 cusp) 密集
    const densityFactor = 1 - 0.4 * Math.sin(u * Math.PI); // 0.6 ~ 1.0
    // 重新映射：累积分布反函数的近似
    const t = (u - 0.5 * (Math.sin(u * Math.PI * 2) / (2 * Math.PI))) * Math.PI * 2;

    // 心形参数方程
    const scale_param = 2.5;
    const sinT = Math.sin(t);
    const x = scale_param * 16 * Math.pow(sinT, 3) / 10;
    const y = scale_param * (
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t)
    ) / 10;

    // z 深度变化基于曲线导数（dx/dt），导数大的地方 z 偏移更大
    const dx_dt = scale_param * 16 * 3 * Math.pow(sinT, 2) * Math.cos(t) / 10;
    const dy_dt = scale_param * (
      -13 * Math.sin(t) +
      10 * Math.sin(2 * t) +
      6 * Math.sin(3 * t) +
      4 * Math.sin(4 * t)
    ) / 10;
    const derivativeMag = Math.sqrt(dx_dt * dx_dt + dy_dt * dy_dt);
    const z = -8 + Math.sin(t * 2) * 1.5 + derivativeMag * 0.15;

    return {
      x: x,
      y: y,
      z: z,
      rx: 0,
      ry: -t + Math.PI / 2,
      rz: 0,
      scale: 0.85,
    };
  }

  // ================================================================
  // 布局阶段定义
  // ================================================================
  static STAGES = [
    { name: 'ARRIVAL',  zh: '晨曦初临', pct: 0,  fn: 'ARRIVAL'  },
    { name: 'FAN',      zh: '卷帘展开', pct: 0.20, fn: 'FAN'      },
    { name: 'GATHER',   zh: '同心汇聚', pct: 0.35, fn: 'GATHER'   },
    { name: 'WAVE',     zh: '正弦波动', pct: 0.45, fn: 'WAVE'     },
    { name: 'GRID',     zh: '网格呼吸', pct: 0.55, fn: 'GRID'     },
    { name: 'SPIRAL',   zh: '螺旋花涡', pct: 0.70, fn: 'SPIRAL'   },
    { name: 'DEPART',   zh: '永恒归宿', pct: 0.92, fn: 'DEPART'   },
  ];

  /**
   * 根据全局滚动进度，计算每张卡片的最终位置
   * @param {number} globalProgress — 0~1 全局滚动进度
   * @param {number} total — 卡片总数
   * @returns {Array} 每张卡片的 {x, y, z, rx, ry, rz, scale}
   */
  static computePositions(globalProgress, total) {
    const stages = Layouts.STAGES;
    if (total <= 0) return [];
    const positions = [];

    // 找到当前处于哪两个阶段之间
    let fromIdx = 0;
    let toIdx = 1;
    for (let i = 0; i < stages.length - 1; i++) {
      if (globalProgress >= stages[i].pct && globalProgress < stages[i + 1].pct) {
        fromIdx = i;
        toIdx = i + 1;
        break;
      }
    }

    // 如果已经超过最后一个阶段
    if (globalProgress >= stages[stages.length - 1].pct) {
      fromIdx = stages.length - 1;
      toIdx = stages.length - 1;
    }

    const fromStage = stages[fromIdx];
    const toStage = stages[toIdx];

    // 计算两个阶段之间的插值权重
    let blend = 0;
    if (fromIdx === toIdx) {
      blend = 1;
    } else {
      blend = Layouts.easingFunctions.easeInOutCubic(
        (globalProgress - fromStage.pct) / (toStage.pct - fromStage.pct)
      );
    }

    // 获取布局函数
    const fromFn = Layouts[fromStage.fn];
    const toFn = Layouts[toStage.fn];

    for (let i = 0; i < total; i++) {
      const fromPos = fromFn(i, total);
      const toPos = toFn(i, total);
      positions.push(Layouts.lerp(fromPos, toPos, blend));
    }

    return positions;
  }

  /**
   * 获取当前阶段信息
   */
  static getCurrentStage(globalProgress) {
    const stages = Layouts.STAGES;
    let current = stages[0];

    for (let i = stages.length - 1; i >= 0; i--) {
      if (globalProgress >= stages[i].pct) {
        current = stages[i];
        break;
      }
    }

    return current;
  }

  /**
   * 获取指定布局函数的预览位置（缩放到 100x100 视口）
   * @param {string} fnName — 布局函数名称，如 'ARRIVAL', 'WAVE' 等
   * @param {number} total — 预览的卡片数量
   * @returns {Array} 缩放后的位置数组 [{x, y, z, rx, ry, rz, scale}]
   */
  static getLayoutPreview(fnName, total) {
    const fn = Layouts[fnName];
    if (!fn || typeof fn !== 'function') return [];

    const raw = [];
    for (let i = 0; i < total; i++) {
      raw.push(fn(i, total));
    }

    // 计算原始边界
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    for (const p of raw) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const scaleF = Math.min(100 / rangeX, 100 / rangeY) * 0.9; // 90% 留白

    return raw.map(p => ({
      x: (p.x - (minX + maxX) / 2) * scaleF + 50,
      y: (p.y - (minY + maxY) / 2) * scaleF + 50,
      z: p.z,
      rx: p.rx,
      ry: p.ry,
      rz: p.rz,
      scale: p.scale,
    }));
  }
}

// 导出到全局
window.Layouts = Layouts;
