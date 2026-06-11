import { describe, it, expect } from 'vitest';

const LAYOUT_NAMES = ['ARRIVAL', 'FAN', 'GATHER', 'WAVE', 'GRID', 'SPIRAL', 'DEPART'];

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
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

const STAGES = [
  { name: 'ARRIVAL', zh: '晨曦初临', pct: 0 },
  { name: 'FAN', zh: '卷帘展开', pct: 0.20 },
  { name: 'GATHER', zh: '同心汇聚', pct: 0.35 },
  { name: 'WAVE', zh: '正弦波动', pct: 0.45 },
  { name: 'GRID', zh: '网格呼吸', pct: 0.55 },
  { name: 'SPIRAL', zh: '螺旋花涡', pct: 0.70 },
  { name: 'DEPART', zh: '永恒归宿', pct: 0.92 },
];

function getCurrentStage(progress) {
  let current = STAGES[0];
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (progress >= STAGES[i].pct) {
      current = STAGES[i];
      break;
    }
  }
  return current;
}

describe('Layout Stage Definitions', () => {
  it('has 7 stages', () => {
    expect(STAGES.length).toBe(7);
  });

  it('stages have required properties', () => {
    for (const stage of STAGES) {
      expect(stage).toHaveProperty('name');
      expect(stage).toHaveProperty('zh');
      expect(stage).toHaveProperty('pct');
      expect(typeof stage.pct).toBe('number');
    }
  });

  it('stage percentages are in ascending order', () => {
    for (let i = 1; i < STAGES.length; i++) {
      expect(STAGES[i].pct).toBeGreaterThan(STAGES[i - 1].pct);
    }
  });

  it('stage percentages are in 0-1 range', () => {
    for (const stage of STAGES) {
      expect(stage.pct).toBeGreaterThanOrEqual(0);
      expect(stage.pct).toBeLessThanOrEqual(1);
    }
  });

  it('all 7 layout names are present', () => {
    const names = STAGES.map(s => s.name);
    for (const name of LAYOUT_NAMES) {
      expect(names).toContain(name);
    }
  });
});

describe('getCurrentStage', () => {
  it('returns ARRIVAL at 0%', () => {
    expect(getCurrentStage(0).name).toBe('ARRIVAL');
  });

  it('returns FAN at 20%', () => {
    expect(getCurrentStage(0.20).name).toBe('FAN');
  });

  it('returns DEPART at 92%', () => {
    expect(getCurrentStage(0.92).name).toBe('DEPART');
  });

  it('returns DEPART at 100%', () => {
    expect(getCurrentStage(1).name).toBe('DEPART');
  });

  it('returns ARRIVAL for values between 0 and 0.20', () => {
    expect(getCurrentStage(0.01).name).toBe('ARRIVAL');
    expect(getCurrentStage(0.19).name).toBe('ARRIVAL');
  });
});

describe('smoothstep', () => {
  it('returns 0 below edge0', () => {
    expect(smoothstep(0.2, 0.8, 0.1)).toBe(0);
  });

  it('returns 1 above edge1', () => {
    expect(smoothstep(0.2, 0.8, 0.9)).toBe(1);
  });

  it('returns 0.5 at midpoint', () => {
    const result = smoothstep(0, 1, 0.5);
    expect(result).toBeCloseTo(0.5, 2);
  });

  it('clamps for extreme values', () => {
    expect(smoothstep(0, 1, -100)).toBe(0);
    expect(smoothstep(0, 1, 100)).toBe(1);
  });
});

describe('lerp', () => {
  it('interpolates correctly at t=0.5', () => {
    const a = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, scale: 1 };
    const b = { x: 10, y: 20, z: 30, rx: 1, ry: 2, rz: 3, scale: 2 };
    const result = lerp(a, b, 0.5);
    expect(result.x).toBe(5);
    expect(result.y).toBe(10);
    expect(result.scale).toBe(1.5);
  });

  it('returns first object at t=0', () => {
    const a = { x: 1, y: 2, z: 3, rx: 0, ry: 0, rz: 0, scale: 1 };
    const b = { x: 10, y: 20, z: 30, rx: 0, ry: 0, rz: 0, scale: 2 };
    const result = lerp(a, b, 0);
    expect(result.x).toBe(1);
    expect(result.scale).toBe(1);
  });

  it('returns second object at t=1', () => {
    const a = { x: 1, y: 2, z: 3, rx: 0, ry: 0, rz: 0, scale: 1 };
    const b = { x: 10, y: 20, z: 30, rx: 0, ry: 0, rz: 0, scale: 2 };
    const result = lerp(a, b, 1);
    expect(result.x).toBe(10);
    expect(result.scale).toBe(2);
  });
});
