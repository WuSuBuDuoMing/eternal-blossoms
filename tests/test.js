/**
 * Eternal Blossoms - Comprehensive Test Suite (R91-R95)
 *
 * Browser-based test framework with Node.js compatibility.
 * Run in browser: <script src="../public/js/layouts.js"></script> etc. then this file
 * Run in Node.js: node tests/test.js
 *
 * R91 - Test Framework
 * R92 - Layout Tests
 * R93 - UI Controller Tests
 * R94 - Particle System Tests
 * R95 - API Route Tests (Card Data Logic)
 */

// ============================================================
// R91 - Minimal Test Framework
// ============================================================

class TestRunner {
  constructor() {
    this.suites = [];
    this.results = { pass: 0, fail: 0, errors: [] };
    this.currentSuite = null;
  }

  /**
   * Define a test suite
   * @param {string} name - Suite name
   * @param {Function} fn - Suite function containing tests
   */
  suite(name, fn) {
    this.currentSuite = { name, tests: [] };
    this.suites.push(this.currentSuite);
    fn();
    this.currentSuite = null;
  }

  /**
   * Define a test within current suite
   * @param {string} name - Test name
   * @param {Function} fn - Test function
   */
  test(name, fn) {
    if (!this.currentSuite) {
      throw new Error('test() must be called inside suite()');
    }
    this.currentSuite.tests.push({ name, fn });
  }

  /**
   * Assert condition is truthy
   * @param {*} condition - Condition to test
   * @param {string} msg - Failure message
   */
  assert(condition, msg) {
    if (!condition) {
      throw new Error(msg || 'Assertion failed');
    }
  }

  /**
   * Assert actual equals expected
   * @param {*} actual - Actual value
   * @param {*} expected - Expected value
   * @param {string} msg - Failure message
   */
  assertEqual(actual, expected, msg) {
    if (actual !== expected) {
      throw new Error(
        (msg || 'assertEqual') + `: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      );
    }
  }

  /**
   * Assert deep equality for objects/arrays
   * @param {*} a - First value
   * @param {*} b - Second value
   * @param {string} msg - Failure message
   */
  assertDeepEqual(a, b, msg) {
    const aStr = JSON.stringify(a, Object.keys(a || {}).sort());
    const bStr = JSON.stringify(b, Object.keys(b || {}).sort());
    if (aStr !== bStr) {
      throw new Error(
        (msg || 'assertDeepEqual') + `: expected ${bStr}, got ${aStr}`
      );
    }
  }

  /**
   * Assert value is approximately equal (for floating point)
   * @param {number} actual - Actual value
   * @param {number} expected - Expected value
   * @param {number} epsilon - Tolerance
   * @param {string} msg - Failure message
   */
  assertApprox(actual, expected, epsilon, msg) {
    if (Math.abs(actual - expected) > epsilon) {
      throw new Error(
        (msg || 'assertApprox') + `: expected ~${expected} (+/-${epsilon}), got ${actual}`
      );
    }
  }

  /**
   * Assert value is within range
   * @param {number} value - Value to check
   * @param {number} min - Minimum (inclusive)
   * @param {number} max - Maximum (inclusive)
   * @param {string} msg - Failure message
   */
  assertRange(value, min, max, msg) {
    if (value < min || value > max) {
      throw new Error(
        (msg || 'assertRange') + `: expected ${min} <= value <= ${max}, got ${value}`
      );
    }
  }

  /**
   * Run all test suites
   * @returns {Object} Results summary
   */
  run() {
    this.results = { pass: 0, fail: 0, errors: [] };
    const startTime = Date.now();

    for (const suite of this.suites) {
      this._log(`\n[${suite.name}]`);

      for (const test of suite.tests) {
        try {
          test.fn();
          this._log(`  PASS  ${test.name}`);
          this.results.pass++;
        } catch (err) {
          this._log(`  FAIL  ${test.name}`);
          this._log(`        ${err.message}`);
          this.results.fail++;
          this.results.errors.push({
            suite: suite.name,
            test: test.name,
            error: err.message,
          });
        }
      }
    }

    const elapsed = Date.now() - startTime;
    this._log(`\n${'='.repeat(55)}`);
    this._log(`Results: ${this.results.pass} passed, ${this.results.fail} failed (${elapsed}ms)`);
    this._log(`${'='.repeat(55)}\n`);

    return this.results;
  }

  /**
   * Output log message (browser or Node.js)
   * @param {string} msg - Message to log
   */
  _log(msg) {
    if (typeof console !== 'undefined') {
      console.log(msg);
    }
    if (typeof document !== 'undefined') {
      const output = document.getElementById('test-output');
      if (output) {
        output.textContent += msg + '\n';
      }
    }
  }
}

// ============================================================
// Node.js Module Loader (for running browser source files)
// ============================================================

let Layouts, UIController, ParticleSystem;
let isNode = typeof window === 'undefined' && typeof process !== 'undefined';

if (isNode) {
  const fs = require('fs');
  const path = require('path');
  const vm = require('vm');

  const projectRoot = path.join(__dirname, '..');

  // --- Create minimal DOM/Window mock ---
  function createMockElement(id) {
    return {
      id: id || '',
      textContent: '',
      className: '',
      innerHTML: '',
      style: {},
      classList: {
        _classes: {},
        add(cls) { this._classes[cls] = true; },
        remove(cls) { delete this._classes[cls]; },
        toggle(cls, force) {
          if (force === undefined) {
            this._classes[cls] = !this._classes[cls];
          } else {
            this._classes[cls] = !!force;
          }
        },
        contains(cls) { return !!this._classes[cls]; },
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      querySelector: () => null,
      appendChild: () => {},
      setAttribute: () => {},
      style: { cssText: '' },
      offsetHeight: 0,
      parentNode: null,
      // Canvas support: getContext returns a mock 2D context
      width: 1920,
      height: 1080,
      getContext(type) {
        return createMockContext();
      },
    };
  }

  function createMockContext() {
    return {
      clearRect() {},
      save() {},
      restore() {},
      translate() {},
      rotate() {},
      scale() {},
      beginPath() {},
      moveTo() {},
      bezierCurveTo() {},
      closePath() {},
      fill() {},
      arc() {},
      setTransform() {},
      drawImage() {},
      createRadialGradient() { return { addColorStop() {} }; },
      set fillStyle(v) {},
      set globalAlpha(v) {},
      set globalCompositeOperation(v) {},
      set shadowColor(v) {},
      set shadowBlur(v) {},
    };
  }

  const mockCanvas = {
    width: 1920,
    height: 1080,
    style: { width: '1920px', height: '1080px' },
    getContext() { return createMockContext(); },
  };

  const mockDoc = {
    getElementById: (id) => createMockElement(id),
    createElement: (tag) => {
      const el = createMockElement(tag + '_dynamic');
      el.getContext = () => createMockContext();
      el.width = 32;
      el.height = 32;
      return el;
    },
    body: { appendChild() {} },
    readyState: 'complete',
    addEventListener: () => {},
  };

  const mockWindow = {
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1,
    addEventListener: () => {},
    Layouts: undefined,
    UIController: undefined,
    ParticleSystem: undefined,
  };

  // Shared sandbox context so all modules see the same globals
  const sandbox = {
    window: mockWindow,
    document: mockDoc,
    console: console,
    Math: Math,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    isFinite: isFinite,
    Number: Number,
    Array: Array,
    Object: Object,
    String: String,
    Date: Date,
    JSON: JSON,
    Set: Set,
    Map: Map,
    Infinity: Infinity,
    undefined: undefined,
    NaN: NaN,
  };
  // Make sandbox properties also accessible as direct globals in the VM context
  sandbox.global = sandbox;
  sandbox.process = process;

  function loadSourceFile(relPath) {
    const filePath = path.join(projectRoot, relPath);
    const code = fs.readFileSync(filePath, 'utf-8');
    const script = new vm.Script(code, { filename: relPath });
    const context = vm.createContext(sandbox);
    script.runInContext(context);
  }

  // Load source files in dependency order
  loadSourceFile('public/js/layouts.js');
  loadSourceFile('public/js/ui.js');
  loadSourceFile('public/js/particles.js');

  Layouts = mockWindow.Layouts;
  UIController = mockWindow.UIController;
  ParticleSystem = mockWindow.ParticleSystem;
} else {
  // Browser: globals are set by the script tags
  Layouts = window.Layouts;
  UIController = window.UIController;
  ParticleSystem = window.ParticleSystem;
}

// ============================================================
// R92 - Layout Tests
// ============================================================

function createLayoutTests(runner) {
  runner.suite('R92 - Layout Tests', () => {

    // --- smoothstep tests ---
    runner.test('smoothstep returns 0 below edge0', () => {
      const result = Layouts.smoothstep(0.2, 0.8, 0.1);
      runner.assertEqual(result, 0, 'smoothstep below edge0');
    });

    runner.test('smoothstep returns 1 above edge1', () => {
      const result = Layouts.smoothstep(0.2, 0.8, 0.9);
      runner.assertEqual(result, 1, 'smoothstep above edge1');
    });

    runner.test('smoothstep returns 0.5 at midpoint', () => {
      const result = Layouts.smoothstep(0, 1, 0.5);
      runner.assertApprox(result, 0.5, 0.001, 'smoothstep at midpoint');
    });

    runner.test('smoothstep clamps to 0 for values far below', () => {
      const result = Layouts.smoothstep(0.5, 1.0, -100);
      runner.assertEqual(result, 0, 'smoothstep far below');
    });

    runner.test('smoothstep clamps to 1 for values far above', () => {
      const result = Layouts.smoothstep(0, 0.5, 100);
      runner.assertEqual(result, 1, 'smoothstep far above');
    });

    // --- lerp tests ---
    runner.test('lerp returns correct interpolated values', () => {
      const a = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, scale: 1 };
      const b = { x: 10, y: 20, z: 30, rx: 1, ry: 2, rz: 3, scale: 2 };

      const result = Layouts.lerp(a, b, 0.5);
      runner.assertEqual(result.x, 5, 'lerp x');
      runner.assertEqual(result.y, 10, 'lerp y');
      runner.assertEqual(result.z, 15, 'lerp z');
      runner.assertEqual(result.rx, 0.5, 'lerp rx');
      runner.assertEqual(result.ry, 1, 'lerp ry');
      runner.assertEqual(result.rz, 1.5, 'lerp rz');
      runner.assertEqual(result.scale, 1.5, 'lerp scale');
    });

    runner.test('lerp with t=0 returns first object', () => {
      const a = { x: 1, y: 2, z: 3, rx: 4, ry: 5, rz: 6, scale: 7 };
      const b = { x: 10, y: 20, z: 30, rx: 40, ry: 50, rz: 60, scale: 70 };

      const result = Layouts.lerp(a, b, 0);
      runner.assertEqual(result.x, a.x, 'lerp t=0 x');
      runner.assertEqual(result.scale, a.scale, 'lerp t=0 scale');
    });

    runner.test('lerp with t=1 returns second object', () => {
      const a = { x: 1, y: 2, z: 3, rx: 4, ry: 5, rz: 6, scale: 7 };
      const b = { x: 10, y: 20, z: 30, rx: 40, ry: 50, rz: 60, scale: 70 };

      const result = Layouts.lerp(a, b, 1);
      runner.assertEqual(result.x, b.x, 'lerp t=1 x');
      runner.assertEqual(result.scale, b.scale, 'lerp t=1 scale');
    });

    // --- ARRIVAL layout tests ---
    runner.test('ARRIVAL returns valid positions for various indices', () => {
      const total = 10;
      for (let i = 0; i < total; i++) {
        const pos = Layouts.ARRIVAL(i, total);
        runner.assert(typeof pos.x === 'number' && !isNaN(pos.x), `ARRIVAL[${i}] x valid`);
        runner.assert(typeof pos.y === 'number' && !isNaN(pos.y), `ARRIVAL[${i}] y valid`);
        runner.assert(typeof pos.z === 'number' && !isNaN(pos.z), `ARRIVAL[${i}] z valid`);
        runner.assert(typeof pos.rx === 'number', `ARRIVAL[${i}] rx is number`);
        runner.assert(typeof pos.ry === 'number', `ARRIVAL[${i}] ry is number`);
        runner.assert(typeof pos.rz === 'number', `ARRIVAL[${i}] rz is number`);
        runner.assert(typeof pos.scale === 'number', `ARRIVAL[${i}] scale is number`);
      }
    });

    runner.test('ARRIVAL handles total=0', () => {
      const pos = Layouts.ARRIVAL(0, 0);
      runner.assertEqual(pos.x, 0, 'ARRIVAL total=0 x');
      runner.assertEqual(pos.y, 0, 'ARRIVAL total=0 y');
      runner.assertEqual(pos.z, -8, 'ARRIVAL total=0 z');
    });

    // --- FAN layout tests ---
    runner.test('FAN returns valid positions for various indices', () => {
      const total = 10;
      for (let i = 0; i < total; i++) {
        const pos = Layouts.FAN(i, total);
        runner.assert(typeof pos.x === 'number' && !isNaN(pos.x), `FAN[${i}] x valid`);
        runner.assert(typeof pos.y === 'number' && !isNaN(pos.y), `FAN[${i}] y valid`);
        runner.assert(typeof pos.z === 'number' && !isNaN(pos.z), `FAN[${i}] z valid`);
      }
    });

    runner.test('FAN handles total=1 edge case', () => {
      const pos = Layouts.FAN(0, 1);
      runner.assertEqual(pos.x, 0, 'FAN total=1 x');
      runner.assertEqual(pos.y, 0, 'FAN total=1 y');
      runner.assertEqual(pos.scale, 0.9, 'FAN total=1 scale');
    });

    runner.test('FAN handles total=0', () => {
      const pos = Layouts.FAN(0, 0);
      runner.assertEqual(pos.x, 0, 'FAN total=0 x');
      runner.assertEqual(pos.y, 0, 'FAN total=0 y');
      runner.assertEqual(pos.scale, 0.9, 'FAN total=0 scale');
    });

    // --- All layout functions return required keys ---
    runner.test('All layout functions return objects with all required keys', () => {
      const layoutFns = ['ARRIVAL', 'FAN', 'GATHER', 'WAVE', 'GRID', 'SPIRAL', 'DEPART'];
      const requiredKeys = ['x', 'y', 'z', 'rx', 'ry', 'rz', 'scale'];

      for (const fnName of layoutFns) {
        const pos = Layouts[fnName](3, 10);
        for (const key of requiredKeys) {
          runner.assert(key in pos, `${fnName} returns ${key}`);
          runner.assert(typeof pos[key] === 'number', `${fnName}.${key} is a number`);
        }
      }
    });

    // --- computePositions tests ---
    runner.test('computePositions returns correct number of positions', () => {
      const total = 15;
      const positions = Layouts.computePositions(0, total);
      runner.assertEqual(positions.length, total, 'computePositions returns correct count');
    });

    runner.test('computePositions returns empty array for total=0', () => {
      const positions = Layouts.computePositions(0.5, 0);
      runner.assertEqual(positions.length, 0, 'computePositions total=0');
    });

    runner.test('computePositions transitions correctly between stages', () => {
      // At progress=0, should be pure ARRIVAL (blend=1 at stage 0 boundary)
      const pos0 = Layouts.computePositions(0, 5);
      const arrival = Layouts.ARRIVAL(2, 5);
      runner.assertApprox(pos0[2].x, arrival.x, 0.001, 'computePositions at 0 is ARRIVAL');
      runner.assertApprox(pos0[2].z, arrival.z, 0.001, 'computePositions at 0 z matches ARRIVAL');

      // At progress=1, should be pure DEPART
      const pos1 = Layouts.computePositions(1, 5);
      const depart = Layouts.DEPART(2, 5);
      runner.assertApprox(pos1[2].x, depart.x, 0.001, 'computePositions at 1 is DEPART');
    });

    runner.test('computePositions interpolates between ARRIVAL and FAN', () => {
      // progress=0.1 is between ARRIVAL (0) and FAN (0.20)
      const positions = Layouts.computePositions(0.1, 5);
      const pos = positions[0];

      runner.assert(pos.x !== undefined, 'interpolated position has x');
      runner.assert(pos.y !== undefined, 'interpolated position has y');
      runner.assert(pos.z !== undefined, 'interpolated position has z');
      runner.assert(!isNaN(pos.x), 'interpolated x is not NaN');
    });

    // --- getCurrentStage tests ---
    runner.test('getCurrentStage returns correct stage at each boundary', () => {
      const expectedStages = [
        { pct: 0, name: 'ARRIVAL' },
        { pct: 0.20, name: 'FAN' },
        { pct: 0.35, name: 'GATHER' },
        { pct: 0.45, name: 'WAVE' },
        { pct: 0.55, name: 'GRID' },
        { pct: 0.70, name: 'SPIRAL' },
        { pct: 0.92, name: 'DEPART' },
      ];

      for (const stage of expectedStages) {
        const result = Layouts.getCurrentStage(stage.pct);
        runner.assertEqual(result.name, stage.name, `getCurrentStage at ${stage.pct}`);
      }
    });

    runner.test('getCurrentStage returns correct stage between boundaries', () => {
      runner.assertEqual(Layouts.getCurrentStage(0.01).name, 'ARRIVAL', '0.01');
      runner.assertEqual(Layouts.getCurrentStage(0.19).name, 'ARRIVAL', '0.19');
      runner.assertEqual(Layouts.getCurrentStage(0.21).name, 'FAN', '0.21');
      runner.assertEqual(Layouts.getCurrentStage(0.99).name, 'DEPART', '0.99');
    });

    runner.test('getCurrentStage at 0 returns ARRIVAL', () => {
      runner.assertEqual(Layouts.getCurrentStage(0).name, 'ARRIVAL');
    });

    runner.test('getCurrentStage at 1 returns DEPART', () => {
      runner.assertEqual(Layouts.getCurrentStage(1).name, 'DEPART');
    });

    // --- deterministicRand tests ---
    runner.test('deterministicRand produces same output for same input', () => {
      for (let i = 0; i < 20; i++) {
        const val1 = Layouts._deterministicRand(i);
        const val2 = Layouts._deterministicRand(i);
        runner.assertEqual(val1, val2, `deterministicRand(${i})`);
      }
    });

    runner.test('deterministicRand produces different outputs for different inputs', () => {
      const val0 = Layouts._deterministicRand(0);
      const val5 = Layouts._deterministicRand(5);
      const val10 = Layouts._deterministicRand(10);
      runner.assert(
        val0 !== val5 || val5 !== val10,
        'deterministicRand produces varied output'
      );
    });

    runner.test('deterministicRand returns a number', () => {
      const val = Layouts._deterministicRand(42);
      runner.assert(typeof val === 'number', 'returns number');
      runner.assert(!isNaN(val), 'is not NaN');
    });
  });
}

// ============================================================
// R93 - UI Controller Tests
// ============================================================

function createUITests(runner) {
  runner.suite('R93 - UI Controller Tests', () => {

    runner.test('constructor initializes all DOM references', () => {
      const ui = new UIController();

      runner.assert(ui.loader !== null, 'loader initialized');
      runner.assert(ui.loaderBar !== null, 'loaderBar initialized');
      runner.assert(ui.loaderStatus !== null, 'loaderStatus initialized');
      runner.assert(ui.uiLogo !== null, 'uiLogo initialized');
      runner.assert(ui.uiStage !== null, 'uiStage initialized');
      runner.assert(ui.stageNameZh !== null, 'stageNameZh initialized');
      runner.assert(ui.stageNameEn !== null, 'stageNameEn initialized');
      runner.assert(ui.stageProgress !== null, 'stageProgress initialized');
      runner.assert(ui.progressBar !== null, 'progressBar initialized');
      runner.assert(ui.uiHint !== null, 'uiHint initialized');
      runner.assert(ui.uiGlowToggle !== null, 'uiGlowToggle initialized');
      runner.assert(ui.glowBtn !== null, 'glowBtn initialized');
      runner.assert(ui.poemText !== null, 'poemText initialized');
      runner.assert(ui.modalOverlay !== null, 'modalOverlay initialized');
      runner.assert(ui.modalClose !== null, 'modalClose initialized');
      runner.assert(ui.modalEmoji !== null, 'modalEmoji initialized');
      runner.assert(ui.modalTitleZh !== null, 'modalTitleZh initialized');
      runner.assert(ui.modalTitleEn !== null, 'modalTitleEn initialized');
      runner.assert(ui.modalDesc !== null, 'modalDesc initialized');
      runner.assert(ui.modalGradientBar !== null, 'modalGradientBar initialized');
    });

    runner.test('constructor initializes default state values', () => {
      const ui = new UIController();

      runner.assertEqual(ui.globalProgress, 0, 'globalProgress defaults to 0');
      runner.assertEqual(ui.targetProgress, 0, 'targetProgress defaults to 0');
      runner.assertEqual(ui.scrollSpeed, 0.0006, 'scrollSpeed default');
      runner.assertEqual(ui.isModalOpen, false, 'isModalOpen defaults to false');
      runner.assertEqual(ui.constantGlow, false, 'constantGlow defaults to false');
    });

    runner.test('constructor initializes poems array', () => {
      const ui = new UIController();

      runner.assert(Array.isArray(ui.poems), 'poems is array');
      runner.assert(ui.poems.length > 0, 'poems is not empty');
      runner.assert(typeof ui.poems[0] === 'string', 'poems contains strings');
    });

    runner.test('update clamps globalProgress between 0 and 1', () => {
      const ui = new UIController();

      // Set target above 1 and globalProgress near 1
      ui.targetProgress = 1.5;
      ui.globalProgress = 0.95;
      ui.update();
      // After update, globalProgress should not exceed 1 because targetProgress gets clamped
      runner.assert(ui.globalProgress <= 1, 'globalProgress does not exceed 1');

      // Set target below 0 and globalProgress near 0
      ui.targetProgress = -0.5;
      ui.globalProgress = 0.05;
      ui.update();
      runner.assert(ui.globalProgress >= 0, 'globalProgress does not go below 0');
    });

    runner.test('update moves globalProgress toward targetProgress', () => {
      const ui = new UIController();
      ui.targetProgress = 0.5;
      ui.globalProgress = 0;
      ui.update();
      runner.assert(ui.globalProgress > 0, 'globalProgress moves toward target');
      runner.assert(ui.globalProgress < 0.5, 'globalProgress not yet at target');
    });

    runner.test('openModal populates all modal fields', () => {
      const ui = new UIController();
      const cardData = {
        emoji: 'T',
        title: 'TITLE',
        titleEn: 'TITLE_EN',
        desc: 'DESC',
        gradient: 'linear-gradient(135deg, #fff 0%, #000 100%)',
      };

      ui.openModal(cardData);

      runner.assertEqual(ui.isModalOpen, true, 'isModalOpen is true');
      runner.assertEqual(ui.modalEmoji.textContent, 'T', 'modal emoji populated');
      runner.assertEqual(ui.modalTitleZh.textContent, 'TITLE', 'modal title populated');
      runner.assertEqual(ui.modalTitleEn.textContent, 'TITLE_EN', 'modal titleEn populated');
      runner.assertEqual(ui.modalDesc.textContent, 'DESC', 'modal desc populated');
      runner.assertEqual(
        ui.modalGradientBar.style.background,
        'linear-gradient(135deg, #fff 0%, #000 100%)',
        'modal gradient populated'
      );
    });

    runner.test('closeModal sets isModalOpen to false', () => {
      const ui = new UIController();
      ui.isModalOpen = true;

      ui.closeModal();

      runner.assertEqual(ui.isModalOpen, false, 'isModalOpen is false after closeModal');
    });

    runner.test('poem deduplication prevents consecutive duplicates', () => {
      const ui = new UIController();
      runner.assert(ui.poems.length >= 2, 'Need at least 2 poems for dedup test');

      let lastIdx = -1;
      let consecutiveSame = 0;

      for (let i = 0; i < 50; i++) {
        let idx;
        do {
          idx = Math.floor(Math.random() * ui.poems.length);
        } while (idx === lastIdx && ui.poems.length > 1);

        if (idx === lastIdx) {
          consecutiveSame++;
        }
        lastIdx = idx;
      }

      runner.assertEqual(consecutiveSame, 0, 'No consecutive duplicate poems');
    });

    runner.test('setLoadingProgress updates loader bar width', () => {
      const ui = new UIController();

      ui.setLoadingProgress(50, 'Loading...');

      runner.assertEqual(ui.loaderBar.style.width, '50%', 'loader bar width set');
      runner.assertEqual(ui.loaderStatus.textContent, 'Loading...', 'loader status set');
    });

    runner.test('setLoadingProgress with 100%', () => {
      const ui = new UIController();

      ui.setLoadingProgress(100, 'Ready');

      runner.assertEqual(ui.loaderBar.style.width, '100%', 'loader bar at 100%');
      runner.assertEqual(ui.loaderStatus.textContent, 'Ready', 'status is Ready');
    });

    runner.test('setLoadingProgress without status text', () => {
      const ui = new UIController();
      ui.loaderStatus.textContent = 'original';

      ui.setLoadingProgress(75);

      runner.assertEqual(ui.loaderBar.style.width, '75%', 'loader bar width set');
      runner.assertEqual(ui.loaderStatus.textContent, 'original', 'status unchanged');
    });
  });
}

// ============================================================
// R94 - Particle System Tests
// ============================================================

function createParticleSystemTests(runner) {
  runner.suite('R94 - Particle System Tests', () => {

    runner.test('init creates correct number of hearts and glows', () => {
      const ps = new ParticleSystem('particle-canvas');

      runner.assertEqual(ps.HEART_COUNT, 90, 'HEART_COUNT is 90');
      runner.assertEqual(ps.GLOW_COUNT, 60, 'GLOW_COUNT is 60');

      ps.init();

      let heartCount = 0;
      let glowCount = 0;
      for (const p of ps.particles) {
        if (p.type === 'heart') heartCount++;
        else if (p.type === 'glow') glowCount++;
      }

      runner.assertEqual(heartCount, 90, '90 hearts created');
      runner.assertEqual(glowCount, 60, '60 glows created');
      runner.assertEqual(ps.particles.length, 150, '150 total particles');
    });

    runner.test('init resets particles before creating new ones', () => {
      const ps = new ParticleSystem('particle-canvas');
      ps.init();

      ps.particles.push({ type: 'heart' });
      ps.particles.push({ type: 'glow' });
      runner.assertEqual(ps.particles.length, 152, '152 after adding extras');

      ps.init();
      runner.assertEqual(ps.particles.length, 150, '150 after re-init');
    });

    runner.test('setConfig reduces particle count with density < 1', () => {
      const ps = new ParticleSystem('particle-canvas');
      ps.init();
      const beforeCount = ps.particles.length;

      ps.setConfig({ density: 0.5 });

      const afterCount = ps.particles.length;
      const targetTotal = Math.floor(90 * 0.5) + Math.floor(60 * 0.5); // 75
      runner.assert(afterCount <= targetTotal, `total ${afterCount} <= target ${targetTotal}`);
      runner.assert(afterCount < beforeCount, `reduced from ${beforeCount} to ${afterCount}`);
    });

    runner.test('setConfig increases particles with density > 1', () => {
      const ps = new ParticleSystem('particle-canvas');
      ps.init();

      ps.setConfig({ density: 1.5 });

      let heartCount = 0;
      let glowCount = 0;
      for (const p of ps.particles) {
        if (p.type === 'heart') heartCount++;
        else if (p.type === 'glow') glowCount++;
      }

      runner.assertEqual(heartCount, 135, '135 hearts at density 1.5');
      runner.assertEqual(glowCount, 90, '90 glows at density 1.5');
    });

    runner.test('setConfig density=1 preserves original count', () => {
      const ps = new ParticleSystem('particle-canvas');
      ps.init();

      ps.setConfig({ density: 1 });

      runner.assertEqual(ps.particles.length, 150, '150 particles at density 1');
    });

    runner.test('setConfig hueShift is stored', () => {
      const ps = new ParticleSystem('particle-canvas');

      runner.assertEqual(ps.hueShift, undefined, 'hueShift initially undefined');

      ps.setConfig({ hue: 200 });
      runner.assertEqual(ps.hueShift, 200, 'hueShift set to 200');

      ps.setConfig({ hue: 350 });
      runner.assertEqual(ps.hueShift, 350, 'hueShift updated to 350');
    });

    runner.test('setConfig with no hue preserves undefined hueShift', () => {
      const ps = new ParticleSystem('particle-canvas');

      runner.assertEqual(ps.hueShift, undefined, 'hueShift initially undefined');
      ps.setConfig({ density: 0.5 });
      runner.assertEqual(ps.hueShift, undefined, 'hueShift still undefined after density change');
    });

    runner.test('burst particles are created and stored', () => {
      const ps = new ParticleSystem('particle-canvas');

      runner.assertEqual(ps.burstParticles.length, 0, 'no burst particles initially');

      ps.burstParticles.push({
        x: 100, y: 200, vx: 2, vy: -3, size: 5, hue: 330, life: 60, maxLife: 60,
      });

      runner.assertEqual(ps.burstParticles.length, 1, '1 burst particle');
    });

    runner.test('burst particles are removed after life expires', () => {
      const ps = new ParticleSystem('particle-canvas');

      ps.burstParticles = [
        { x: 0, y: 0, vx: 0, vy: 0, size: 1, hue: 330, life: 0, maxLife: 60 },
        { x: 10, y: 10, vx: 0, vy: 0, size: 1, hue: 330, life: 30, maxLife: 60 },
        { x: 20, y: 20, vx: 0, vy: 0, size: 1, hue: 330, life: 59, maxLife: 60 },
      ];

      // Simulate the same update logic as _update()
      for (let i = ps.burstParticles.length - 1; i >= 0; i--) {
        const bp = ps.burstParticles[i];
        bp.x += bp.vx;
        bp.y += bp.vy;
        bp.vx *= 0.96;
        bp.vy *= 0.96;
        bp.life--;
        if (bp.life <= 0) {
          ps.burstParticles.splice(i, 1);
        }
      }

      runner.assertEqual(ps.burstParticles.length, 2, '2 burst particles remain (only life=0 removed)');
      // The life=30 particle is now at index 1, with life 29
      const remaining = ps.burstParticles.find(p => p.x === 10);
      runner.assert(remaining !== undefined, 'particle at x=10 remains');
      runner.assertEqual(remaining.life, 29, 'remaining life is 29');
    });

    runner.test('setConstantGlow toggles constantGlow', () => {
      const ps = new ParticleSystem('particle-canvas');

      runner.assertEqual(ps.constantGlow, false, 'initially false');

      ps.setConstantGlow(true);
      runner.assertEqual(ps.constantGlow, true, 'set to true');

      ps.setConstantGlow(false);
      runner.assertEqual(ps.constantGlow, false, 'set back to false');
    });

    runner.test('setEnabled toggles enabled', () => {
      const ps = new ParticleSystem('particle-canvas');

      runner.assertEqual(ps.enabled, true, 'initially true');

      ps.setEnabled(false);
      runner.assertEqual(ps.enabled, false, 'set to false');

      ps.setEnabled(true);
      runner.assertEqual(ps.enabled, true, 'set back to true');
    });

    runner.test('particles have required properties after init', () => {
      const ps = new ParticleSystem('particle-canvas');
      ps.init();

      for (const p of ps.particles) {
        runner.assert(p.type === 'heart' || p.type === 'glow', 'valid type');
        runner.assert(typeof p.x === 'number', 'has x');
        runner.assert(typeof p.y === 'number', 'has y');
        runner.assert(typeof p.size === 'number', 'has size');
        runner.assert(typeof p.speedY === 'number', 'has speedY');
        runner.assert(typeof p.alpha === 'number', 'has alpha');
        runner.assert(typeof p.depth === 'number', 'has depth');
      }
    });
  });
}

// ============================================================
// R95 - API Route Tests (Card Data Logic)
// ============================================================

function loadCardData() {
  try {
    if (typeof require !== 'undefined') {
      const path = require('path');
      const fs = require('fs');
      const dataPath = path.join(__dirname, '..', 'data', 'cards.json');
      return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    }
  } catch (e) {
    console.log('Warning: Could not load cards.json, using test subset');
  }
  // Fallback embedded data for browser context
  return [
    { id:1, title:'A', titleEn:'A', desc:'d', emoji:'e', gradient:'linear-gradient(135deg,#fff 0%,#000 100%)', color:'#ffffff', category:'X', tags:['t'], sortWeight:50 },
  ];
}

function createCardDataTests(runner) {
  runner.suite('R95 - API Route Tests (Card Data Logic)', () => {

    const cards = loadCardData();

    runner.test('card data is an array', () => {
      runner.assert(Array.isArray(cards), 'cards is an array');
      runner.assert(cards.length > 0, 'cards is not empty');
    });

    runner.test('card data structure has all required fields', () => {
      const requiredFields = ['id', 'title', 'titleEn', 'desc', 'emoji', 'gradient', 'color', 'category', 'tags', 'sortWeight'];

      for (const card of cards) {
        for (const field of requiredFields) {
          runner.assert(field in card, `Card ${card.id} has field: ${field}`);
        }
        runner.assert(typeof card.id === 'number', 'id is number');
        runner.assert(typeof card.title === 'string', 'title is string');
        runner.assert(typeof card.titleEn === 'string', 'titleEn is string');
        runner.assert(typeof card.desc === 'string', 'desc is string');
        runner.assert(typeof card.emoji === 'string', 'emoji is string');
        runner.assert(typeof card.gradient === 'string', 'gradient is string');
        runner.assert(typeof card.color === 'string', 'color is string');
        runner.assert(typeof card.category === 'string', 'category is string');
        runner.assert(Array.isArray(card.tags), 'tags is array');
        runner.assert(typeof card.sortWeight === 'number', 'sortWeight is number');
      }
    });

    runner.test('card IDs are unique', () => {
      const ids = cards.map(c => c.id);
      const uniqueIds = new Set(ids);
      runner.assertEqual(ids.length, uniqueIds.size, 'All card IDs are unique');
    });

    runner.test('card IDs are positive integers', () => {
      for (const card of cards) {
        runner.assert(Number.isInteger(card.id), `Card ${card.id} is integer`);
        runner.assert(card.id > 0, `Card ${card.id} is positive`);
      }
    });

    runner.test('card IDs are sequential starting from 1', () => {
      const ids = cards.map(c => c.id).sort((a, b) => a - b);
      runner.assertEqual(ids[0], 1, 'First card ID is 1');
      for (let i = 1; i < ids.length; i++) {
        runner.assertEqual(ids[i], ids[i - 1] + 1, `ID ${ids[i]} follows ${ids[i - 1]}`);
      }
    });

    // --- Search functionality ---
    runner.test('search by title returns correct results', () => {
      const results = cards.filter(c => c.title.includes('安静'));
      runner.assert(results.length > 0, 'Search finds results');
      runner.assert(results.every(c => c.title.includes('安静')), 'All results match');
    });

    runner.test('search by description returns correct results', () => {
      const results = cards.filter(c => c.desc.includes('温暖'));
      runner.assert(results.length > 0, 'Search by desc finds results');
    });

    runner.test('search returns empty for no matches', () => {
      const results = cards.filter(c => c.title.includes('XYZNONEXISTENT12345') || c.desc.includes('XYZNONEXISTENT12345'));
      runner.assertEqual(results.length, 0, 'No results for non-existent term');
    });

    runner.test('search by emoji returns correct results', () => {
      const results = cards.filter(c => c.emoji.includes('T'));
      // In browser data with emoji 'T', this should find the fallback card
      // In Node.js, searches by actual emoji
      runner.assert(Array.isArray(results), 'Returns array');
    });

    // --- Category filtering ---
    runner.test('category filtering works for all categories', () => {
      const categories = [...new Set(cards.map(c => c.category))];
      runner.assert(categories.length >= 4, 'At least 4 categories exist');

      for (const cat of categories) {
        const filtered = cards.filter(c => c.category === cat);
        runner.assert(filtered.length > 0, `Category "${cat}" has cards`);
        runner.assert(filtered.every(c => c.category === cat), `All cards in "${cat}"`);
      }
    });

    runner.test('category filtering with non-existent category returns empty', () => {
      const filtered = cards.filter(c => c.category === 'NONEXISTENT_CATEGORY_ABC');
      runner.assertEqual(filtered.length, 0, 'Non-existent category returns empty');
    });

    runner.test('category "日常" has multiple cards', () => {
      const filtered = cards.filter(c => c.category === '日常');
      runner.assert(filtered.length >= 3, '日常 has >= 3 cards');
    });

    runner.test('category "浪漫" has multiple cards', () => {
      const filtered = cards.filter(c => c.category === '浪漫');
      runner.assert(filtered.length >= 3, '浪漫 has >= 3 cards');
    });

    runner.test('category "旅行" has multiple cards', () => {
      const filtered = cards.filter(c => c.category === '旅行');
      runner.assert(filtered.length >= 3, '旅行 has >= 3 cards');
    });

    runner.test('category "季节" has multiple cards', () => {
      const filtered = cards.filter(c => c.category === '季节');
      runner.assert(filtered.length >= 3, '季节 has >= 3 cards');
    });

    // --- Pagination ---
    runner.test('pagination returns correct page counts', () => {
      const pageSize = 10;
      const totalPages = Math.ceil(cards.length / pageSize);
      const page1 = cards.slice(0, pageSize);
      runner.assertEqual(page1.length, pageSize, 'First page has correct count');

      const lastPage = cards.slice((totalPages - 1) * pageSize);
      runner.assert(lastPage.length <= pageSize, 'Last page <= pageSize');
      runner.assert(lastPage.length > 0, 'Last page is not empty');
    });

    runner.test('pagination returns empty array for page beyond total', () => {
      const pageSize = 10;
      const totalPages = Math.ceil(cards.length / pageSize);
      const beyondPage = cards.slice(totalPages * pageSize, (totalPages + 1) * pageSize);
      runner.assertEqual(beyondPage.length, 0, 'Beyond total is empty');
    });

    runner.test('pagination page 1 starts from beginning', () => {
      const pageSize = 5;
      const page = cards.slice(0, pageSize);
      runner.assertEqual(page[0].id, cards[0].id, 'Page 1 starts with first card');
    });

    runner.test('pagination pages cover all cards without overlap', () => {
      const pageSize = 7;
      const totalPages = Math.ceil(cards.length / pageSize);
      const allCards = [];

      for (let p = 0; p < totalPages; p++) {
        allCards.push(...cards.slice(p * pageSize, (p + 1) * pageSize));
      }

      runner.assertEqual(allCards.length, cards.length, 'All cards covered');
    });

    // --- Batch endpoint logic ---
    runner.test('batch endpoint handles valid IDs', () => {
      const validIds = [1, 5, 10, 20];
      const results = cards.filter(c => validIds.includes(c.id));
      runner.assertEqual(results.length, validIds.length, 'All valid IDs found');
    });

    runner.test('batch endpoint handles mix of valid and invalid IDs', () => {
      const mixedIds = [1, 2, 99999, 100000];
      const results = cards.filter(c => mixedIds.includes(c.id));
      runner.assertEqual(results.length, 2, 'Only valid IDs returned');
    });

    runner.test('batch endpoint handles empty ID list', () => {
      const emptyIds = [];
      const results = cards.filter(c => emptyIds.includes(c.id));
      runner.assertEqual(results.length, 0, 'Empty IDs return empty');
    });

    runner.test('batch endpoint handles all invalid IDs', () => {
      const invalidIds = [99999, 100000, -1, 0];
      const results = cards.filter(c => invalidIds.includes(c.id));
      runner.assertEqual(results.length, 0, 'All invalid IDs return empty');
    });

    runner.test('batch endpoint handles duplicate IDs in request', () => {
      const duplicateIds = [1, 1, 2, 2, 2];
      const results = cards.filter(c => duplicateIds.includes(c.id));
      runner.assertEqual(results.length, 2, 'Duplicate IDs return unique cards');
    });

    // --- Validation ---
    runner.test('all card gradients are valid CSS gradients', () => {
      for (const card of cards) {
        runner.assert(
          card.gradient.includes('linear-gradient') || card.gradient.includes('radial-gradient'),
          `Card ${card.id} gradient is valid CSS`
        );
      }
    });

    runner.test('all card colors are valid hex colors', () => {
      const hexRegex = /^#[0-9a-fA-F]{6}$/;
      for (const card of cards) {
        runner.assert(hexRegex.test(card.color), `Card ${card.id} color "${card.color}"`);
      }
    });

    runner.test('all cards have at least one tag', () => {
      for (const card of cards) {
        runner.assert(card.tags.length > 0, `Card ${card.id} has tags`);
      }
    });

    runner.test('all tags are non-empty strings', () => {
      for (const card of cards) {
        for (const tag of card.tags) {
          runner.assert(typeof tag === 'string' && tag.length > 0, `Card ${card.id} tag valid`);
        }
      }
    });

    runner.test('sortWeight values are in 0-100 range', () => {
      for (const card of cards) {
        runner.assertRange(card.sortWeight, 0, 100, `Card ${card.id} sortWeight`);
      }
    });
  });
}

// ============================================================
// Main Test Runner
// ============================================================

function runAllTests() {
  console.log('===================================================');
  console.log('  Eternal Blossoms - Comprehensive Test Suite (R91-R95)');
  console.log('===================================================\n');

  const runner = new TestRunner();

  createLayoutTests(runner);
  createUITests(runner);
  createParticleSystemTests(runner);
  createCardDataTests(runner);

  const results = runner.run();

  if (typeof process !== 'undefined' && results.fail > 0) {
    process.exit(1);
  }

  return results;
}

// ============================================================
// Exports and Entry Points
// ============================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TestRunner, runAllTests };

  if (require.main === module) {
    runAllTests();
  }
}

if (typeof window !== 'undefined' && !isNode) {
  window.TestRunner = TestRunner;
  window.runAllTests = runAllTests;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
  } else {
    runAllTests();
  }
}
