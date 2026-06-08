/**
 * PerfMonitor - Performance monitoring utility for Eternal Blossoms
 * Rounds 66-70 of optimization cycle
 *
 * Provides FPS tracking, memory monitoring, render budget enforcement,
 * a debug overlay, and report generation.
 */
class PerfMonitor {
  constructor() {
    // --- R66: FPS Counter / Frame Time ---
    /** @type {number[]} Circular buffer of frame times (ms) */
    this._frameTimes = new Array(120).fill(0);
    this._frameIndex = 0;
    this._frameCount = 0;
    this._lastFrameStart = 0;
    this._lastFrameEnd = 0;

    // --- R67: Memory Tracking ---
    /** @type {{ used: number, total: number, limit: number }[]} */
    this._memoryHistory = [];
    this._memoryInterval = null;

    // --- R68: Render Budget ---
    this._renderStart = 0;
    /** @type {number[]} Extended buffer for budget stats (last 300 frames) */
    this._budgetFrameTimes = new Array(300).fill(0);
    this._budgetIndex = 0;
    this._budgetCount = 0;
    this._droppedFrameCount = 0;
    this._currentBudgetMs = 16.67;

    // --- R69: Overlay ---
    this._overlayEl = null;
    this._overlayVisible = false;
    this._overlayInterval = null;

    // --- R70: Report ---
    this._startTime = Date.now();
  }

  // =========================================================================
  // R66 - FPS Counter
  // =========================================================================

  /**
   * Mark the beginning of a frame. Call before your per-frame work.
   */
  startFrame() {
    this._lastFrameStart = performance.now();
  }

  /**
   * Mark the end of a frame. Call after all per-frame work is done.
   * Stores the measured frame time into the circular buffer.
   */
  endFrame() {
    this._lastFrameEnd = performance.now();
    const frameTime = this._lastFrameEnd - this._lastFrameStart;

    this._frameTimes[this._frameIndex] = frameTime;
    this._frameIndex = (this._frameIndex + 1) % this._frameTimes.length;
    this._frameCount++;

    // Also feed into the budget tracking buffer
    this._budgetFrameTimes[this._budgetIndex] = frameTime;
    this._budgetIndex = (this._budgetIndex + 1) % this._budgetFrameTimes.length;
    this._budgetCount++;

    if (frameTime > this._currentBudgetMs) {
      this._droppedFrameCount++;
    }
  }

  /**
   * Return the current FPS as a rolling average over the last 60 frames.
   * @returns {number}
   */
  getFps() {
    const count = Math.min(this._frameCount, 60);
    if (count === 0) return 0;

    let total = 0;
    for (let i = 0; i < count; i++) {
      const idx = (this._frameIndex - 1 - i + this._frameTimes.length * 2) % this._frameTimes.length;
      total += this._frameTimes[idx];
    }
    const avgMs = total / count;
    return avgMs > 0 ? 1000 / avgMs : 0;
  }

  /**
   * Return the average frame time in ms over the last 60 frames.
   * @returns {number}
   */
  getFrameTime() {
    const count = Math.min(this._frameCount, 60);
    if (count === 0) return 0;

    let total = 0;
    for (let i = 0; i < count; i++) {
      const idx = (this._frameIndex - 1 - i + this._frameTimes.length * 2) % this._frameTimes.length;
      total += this._frameTimes[idx];
    }
    return total / count;
  }

  // =========================================================================
  // R67 - Memory Tracking
  // =========================================================================

  /**
   * Return current memory usage if available (Chrome only).
   * @returns {{ used: number, total: number, limit: number } | null}
   */
  getMemoryUsage() {
    if (performance.memory) {
      const mem = performance.memory;
      return {
        used: mem.usedJSHeapSize,
        total: mem.totalJSHeapSize,
        limit: mem.jsHeapSizeLimit,
      };
    }
    return null;
  }

  /**
   * Start sampling memory every 5 seconds.
   * Call once; subsequent calls are no-ops unless stopMemoryTracking was called.
   */
  trackMemoryOverTime() {
    if (this._memoryInterval !== null) return;

    // Take an immediate sample
    const sample = this.getMemoryUsage();
    if (sample) {
      this._memoryHistory.push({ ...sample, timestamp: Date.now() });
    }

    this._memoryInterval = setInterval(() => {
      const usage = this.getMemoryUsage();
      if (usage) {
        this._memoryHistory.push({ ...usage, timestamp: Date.now() });
      }
    }, 5000);
  }

  /**
   * Stop the periodic memory sampling.
   */
  stopMemoryTracking() {
    if (this._memoryInterval !== null) {
      clearInterval(this._memoryInterval);
      this._memoryInterval = null;
    }
  }

  /**
   * Return the full memory usage history.
   * @returns {{ used: number, total: number, limit: number, timestamp: number }[]}
   */
  getMemoryHistory() {
    return this._memoryHistory;
  }

  /**
   * Return true if current used memory exceeds 80% of the limit.
   * @returns {boolean}
   */
  isMemoryPressure() {
    const usage = this.getMemoryUsage();
    if (!usage || usage.limit === 0) return false;
    return usage.used / usage.limit > 0.8;
  }

  // =========================================================================
  // R68 - Render Budget
  // =========================================================================

  /**
   * Record the start time of the current frame for render budget tracking.
   * This is equivalent to startFrame() but semantically for budget tracking.
   * You can use either startFrame() or startRenderBudget(); both feed the same
   * frame-time buffer used by endFrame().
   */
  startRenderBudget() {
    this._renderStart = performance.now();
  }

  /**
   * Check if the current frame exceeded the render budget.
   * @param {number} [budgetMs=16.67] - Budget in milliseconds (default ~60 fps)
   * @returns {boolean} true if the frame over budget
   */
  checkRenderBudget(budgetMs = 16.67) {
    this._currentBudgetMs = budgetMs;
    const elapsed = performance.now() - this._renderStart;
    return elapsed > budgetMs;
  }

  /**
   * Return aggregate frame-time statistics over the last 300 frames.
   * @returns {{ avg: number, min: number, max: number, p95: number, p99: number }}
   */
  getFrameStats() {
    const count = Math.min(this._budgetCount, 300);
    if (count === 0) {
      return { avg: 0, min: 0, max: 0, p95: 0, p99: 0 };
    }

    const samples = [];
    let total = 0;
    let min = Infinity;
    let max = -Infinity;

    for (let i = 0; i < count; i++) {
      const idx = (this._budgetIndex - 1 - i + this._budgetFrameTimes.length * 2) % this._budgetFrameTimes.length;
      const val = this._budgetFrameTimes[idx];
      samples.push(val);
      total += val;
      if (val < min) min = val;
      if (val > max) max = val;
    }

    samples.sort((a, b) => a - b);
    const p95Idx = Math.floor(count * 0.95);
    const p99Idx = Math.floor(count * 0.99);

    return {
      avg: total / count,
      min,
      max,
      p95: samples[Math.min(p95Idx, count - 1)],
      p99: samples[Math.min(p99Idx, count - 1)],
    };
  }

  /**
   * Return the total number of frames that exceeded the render budget.
   * @returns {number}
   */
  getDroppedFrames() {
    return this._droppedFrameCount;
  }

  // =========================================================================
  // R69 - Overlay Display
  // =========================================================================

  /**
   * Create the debug overlay DOM element and wire up the keyboard shortcut.
   */
  createOverlay() {
    if (this._overlayEl) return;

    const el = document.createElement('div');
    el.id = 'perf-monitor-overlay';
    el.style.cssText = [
      'position: fixed',
      'top: 8px',
      'right: 8px',
      'z-index: 99999',
      'background: rgba(0, 0, 0, 0.75)',
      'color: #0f0',
      'font-family: "Courier New", monospace',
      'font-size: 12px',
      'padding: 8px 12px',
      'border-radius: 4px',
      'pointer-events: none',
      'line-height: 1.5',
      'white-space: pre',
      'display: none',
    ].join('; ');

    el.textContent = 'PerfMonitor: waiting for data...';
    document.body.appendChild(el);
    this._overlayEl = el;

    // Keyboard shortcut: Ctrl+Shift+F
    this._keyHandler = (e) => {
      if (e.ctrlKey && e.shiftKey && e.code === 'KeyF') {
        e.preventDefault();
        if (this._overlayVisible) {
          this.hideOverlay();
        } else {
          this.showOverlay();
        }
      }
    };
    document.addEventListener('keydown', this._keyHandler);
  }

  /**
   * Show the overlay and start the 2 Hz update timer.
   */
  showOverlay() {
    this.createOverlay(); // ensure it exists
    this._overlayVisible = true;
    this._overlayEl.style.display = 'block';

    if (this._overlayInterval) return;

    this._overlayInterval = setInterval(() => {
      this._updateOverlayContent();
    }, 500);
  }

  /**
   * Hide the overlay and stop the update timer.
   */
  hideOverlay() {
    this._overlayVisible = false;
    if (this._overlayEl) {
      this._overlayEl.style.display = 'none';
    }
    if (this._overlayInterval) {
      clearInterval(this._overlayInterval);
      this._overlayInterval = null;
    }
  }

  /**
   * Refresh the text content of the overlay.
   * @private
   */
  _updateOverlayContent() {
    if (!this._overlayEl) return;

    const fps = this.getFps();
    const frameTime = this.getFrameTime();
    const stats = this.getFrameStats();
    const mem = this.getMemoryUsage();
    const pressure = this.isMemoryPressure();
    const dropped = this.getDroppedFrames();
    const elapsed = ((Date.now() - this._startTime) / 1000).toFixed(0);

    let text = '';
    text += `FPS:     ${fps.toFixed(1)}\n`;
    text += `Frame:   ${frameTime.toFixed(2)} ms\n`;
    text += `Avg/Min/Max: ${stats.avg.toFixed(2)} / ${stats.min.toFixed(2)} / ${stats.max.toFixed(2)} ms\n`;
    text += `P95/P99: ${stats.p95.toFixed(2)} / ${stats.p99.toFixed(2)} ms\n`;
    text += `Dropped: ${dropped}\n`;

    if (mem) {
      const usedMB = (mem.used / (1024 * 1024)).toFixed(1);
      const totalMB = (mem.total / (1024 * 1024)).toFixed(1);
      const limitMB = (mem.limit / (1024 * 1024)).toFixed(0);
      const pct = ((mem.used / mem.limit) * 100).toFixed(1);
      text += `Memory:  ${usedMB} / ${limitMB} MB (${pct}%)\n`;
      if (pressure) text += `>>> MEMORY PRESSURE <<<\n`;
    } else {
      text += `Memory:  N/A\n`;
    }

    text += `Uptime:  ${elapsed}s`;

    this._overlayEl.textContent = text;
  }

  // =========================================================================
  // R70 - Report Generation
  // =========================================================================

  /**
   * Build a JSON-serializable report with all collected performance data.
   * @returns {object}
   */
  generateReport() {
    const stats = this.getFrameStats();
    const mem = this.getMemoryUsage();
    const uptimeMs = Date.now() - this._startTime;

    return {
      timestamp: new Date().toISOString(),
      uptimeMs,
      fps: {
        current: +this.getFps().toFixed(1),
        avgFrameTimeMs: +this.getFrameTime().toFixed(3),
      },
      frameStats: {
        avg: +stats.avg.toFixed(3),
        min: +stats.min.toFixed(3),
        max: +stats.max.toFixed(3),
        p95: +stats.p95.toFixed(3),
        p99: +stats.p99.toFixed(3),
        droppedFrames: this._droppedFrameCount,
        totalFramesTracked: Math.min(this._budgetCount, 300),
      },
      memory: mem
        ? {
            usedMB: +(mem.used / (1024 * 1024)).toFixed(2),
            totalMB: +(mem.total / (1024 * 1024)).toFixed(2),
            limitMB: +(mem.limit / (1024 * 1024)).toFixed(2),
            pressure: this.isMemoryPressure(),
          }
        : null,
      memoryHistory: this._memoryHistory.map((entry) => ({
        usedMB: +(entry.used / (1024 * 1024)).toFixed(2),
        timestamp: entry.timestamp,
      })),
    };
  }

  /**
   * Trigger a download of the performance report as a JSON file.
   */
  exportReport() {
    const report = this.generateReport();
    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `perf-report-${Date.now()}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // Cleanup after a short delay to allow the download to start
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
  }

  /**
   * Print a formatted performance summary to the console.
   */
  logReport() {
    const report = this.generateReport();

    console.group('%c PerfMonitor Report', 'color: #0f0; font-weight: bold;');
    console.log(`Timestamp : ${report.timestamp}`);
    console.log(`Uptime    : ${(report.uptimeMs / 1000).toFixed(1)}s`);
    console.log(`FPS       : ${report.fps.current}`);
    console.log(`Frame Time: ${report.fps.avgFrameTimeMs} ms (avg)`);
    console.log('--- Frame Stats ---');
    console.log(`  Avg : ${report.frameStats.avg} ms`);
    console.log(`  Min : ${report.frameStats.min} ms`);
    console.log(`  Max : ${report.frameStats.max} ms`);
    console.log(`  P95 : ${report.frameStats.p95} ms`);
    console.log(`  P99 : ${report.frameStats.p99} ms`);
    console.log(`  Dropped : ${report.frameStats.droppedFrames}`);
    if (report.memory) {
      console.log('--- Memory ---');
      console.log(`  Used : ${report.memory.usedMB} MB`);
      console.log(`  Limit: ${report.memory.limitMB} MB`);
      console.log(`  Pressure: ${report.memory.pressure ? 'YES' : 'No'}`);
    }
    console.groupEnd();
  }
}

window.PerfMonitor = PerfMonitor;
