/**
 * AudioManager - Complete audio system for Eternal Blossoms
 * R35: Core Audio Manager with Web Audio API
 * R36: Ambient Sound Generator
 * R37: UI Sound Effects (pure oscillator synthesis)
 * R38: Music Visualizer Data (AnalyserNode)
 */

class AudioManager {
  constructor() {
    this.ctx = null;           // AudioContext (lazy init)
    this.masterGain = null;    // Master gain node
    this.bgmGain = null;       // BGM gain node
    this.sfxGain = null;       // SFX gain node
    this.ambientGain = null;   // Ambient gain node
    this.analyser = null;      // AnalyserNode for visualizer data

    this.bgmSource = null;     // Current BGM source
    this.bgmBuffer = null;     // Cached BGM buffer

    this.ambientNodes = [];    // Active ambient oscillator chains
    this.ambientTimer = null;  // Ambient modulation timer

    this._initialized = false;
    this._volume = 0.5;
    this._bgmVolume = 0.4;
    this._sfxVolume = 0.6;
    this._ambientVolume = 0.3;

    // Bind init to user gesture
    this._initBound = this._ensureContext.bind(this);
    ['click', 'touchstart', 'keydown'].forEach(evt => {
      document.addEventListener(evt, this._initBound, { once: false, passive: true });
    });
  }

  // ─── R35: Core Audio Manager ──────────────────────────────────────────

  /**
   * Lazily create AudioContext on first user interaction (required by browsers).
   */
  _ensureContext() {
    if (this._initialized) return;
    this.init();
  }

  /**
   * Set up audio graph:
   *   masterGain -> analyser -> destination
   *     ├── bgmGain  (sub-group)
   *     ├── sfxGain   (sub-group)
   *     └── ambientGain (sub-group)
   */
  init() {
    if (this._initialized) return;

    this.ctx = new (window.AudioContext || window.webkitAudioContext)();

    // Master gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this._volume;

    // Analyser for R38
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    // Routing: master -> analyser -> destination
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // Sub-groups
    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = this._bgmVolume;
    this.bgmGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = this._sfxVolume;
    this.sfxGain.connect(this.masterGain);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = this._ambientVolume;
    this.ambientGain.connect(this.masterGain);

    this._initialized = true;

    // Remove listeners once initialized
    ['click', 'touchstart', 'keydown'].forEach(evt => {
      document.removeEventListener(evt, this._initBound);
    });
  }

  /**
   * Load and play background music from a URL.
   * @param {string} url - Path to audio file
   * @param {number} volume - BGM volume 0-1
   */
  async playBgm(url, volume = 0.4) {
    if (!this._initialized) this.init();
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    // Stop existing BGM
    this.stopBgm();

    this._bgmVolume = volume;
    this.bgmGain.gain.value = volume;

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      this.bgmBuffer = await this.ctx.decodeAudioData(arrayBuffer);

      this.bgmSource = this.ctx.createBufferSource();
      this.bgmSource.buffer = this.bgmBuffer;
      this.bgmSource.loop = true;
      this.bgmSource.connect(this.bgmGain);
      this.bgmSource.start(0);
    } catch (err) {
      console.warn('[AudioManager] Failed to play BGM:', err);
    }
  }

  /**
   * Stop background music with a short fade.
   */
  stopBgm() {
    if (this.bgmSource) {
      try {
        const now = this.ctx.currentTime;
        this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, now);
        this.bgmGain.gain.linearRampToValueAtTime(0, now + 0.3);
        const src = this.bgmSource;
        setTimeout(() => { try { src.stop(); } catch (_) {} }, 350);
      } catch (_) {}
      this.bgmSource = null;
    }
  }

  /**
   * Set master volume.
   * @param {number} v - Volume 0-1
   */
  setVolume(v) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this._volume, this.ctx.currentTime);
    }
  }

  /**
   * Fade master volume in from 0.
   * @param {number} duration - Fade duration in seconds
   */
  fadeIn(duration = 1) {
    if (!this._initialized) this.init();
    const now = this.ctx.currentTime;
    this.masterGain.gain.setValueAtTime(0, now);
    this.masterGain.gain.linearRampToValueAtTime(this._volume, now + duration);
  }

  /**
   * Fade master volume out to 0.
   * @param {number} duration - Fade duration in seconds
   */
  fadeOut(duration = 1) {
    if (!this._initialized) this.init();
    const now = this.ctx.currentTime;
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + duration);
  }

  // ─── R36: Ambient Sound Generator ─────────────────────────────────────

  /**
   * Start an ambient soundscape generated purely with Web Audio API.
   * @param {'wind'|'rain'|'ocean'|'birds'} type
   */
  startAmbient(type = 'wind') {
    if (!this._initialized) this.init();
    // Clear any existing ambient
    this.stopAmbient();

    switch (type) {
      case 'wind':  this._createWindAmbient();  break;
      case 'rain':  this._createRainAmbient();  break;
      case 'ocean': this._createOceanAmbient(); break;
      case 'birds': this._createBirdsAmbient(); break;
      default:
        console.warn(`[AudioManager] Unknown ambient type: ${type}`);
    }
  }

  /** Wind: filtered noise via oscillators with slow modulation */
  _createWindAmbient() {
    const now = this.ctx.currentTime;

    // Base wind: low-frequency noise-like oscillators
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.value = 80 + i * 40;

      // Slow LFO modulation on frequency for swooshing
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 0.1 + i * 0.05;
      lfoGain.gain.value = 60 + i * 30;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);

      filter.type = 'bandpass';
      filter.frequency.value = 300 + i * 200;
      filter.Q.value = 0.5;

      gain.gain.value = 0;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientGain);

      // Fade in
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 2);

      osc.start(now);

      this.ambientNodes.push({ osc, gain, lfo, lfoGain, filter });
    }
  }

  /** Rain: many short high-freq oscillators with rapid modulation */
  _createRainAmbient() {
    const now = this.ctx.currentTime;

    // Base: broadband filtered noise-like signal
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 4000;
    filter.Q.value = 0.7;

    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 1.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ambientGain);
    noise.start(now);

    this.ambientNodes.push({ osc: noise, gain, filter });

    // Rain droplet pings
    const createDroplet = () => {
      if (this.ambientNodes.length === 0) return;
      const osc = this.ctx.createOscillator();
      const dGain = this.ctx.createGain();
      const t = this.ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.value = 3000 + Math.random() * 5000;
      dGain.gain.setValueAtTime(0.06, t);
      dGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(dGain);
      dGain.connect(this.ambientGain);
      osc.start(t);
      osc.stop(t + 0.06);
      this.ambientTimer = setTimeout(createDroplet, 30 + Math.random() * 120);
    };
    createDroplet();
  }

  /** Ocean: slow oscillating low-frequency waves with noise wash */
  _createOceanAmbient() {
    const now = this.ctx.currentTime;

    // Deep rumble
    for (let i = 0; i < 2; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.value = 40 + i * 25;

      // Very slow amplitude modulation for wave crests
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 0.08 + i * 0.03; // ~8-12 second waves
      lfoGain.gain.value = 0.12;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      filter.type = 'lowpass';
      filter.frequency.value = 200;
      filter.Q.value = 1;

      gain.gain.value = 0;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientGain);
      lfo.start(now);
      osc.start(now);

      this.ambientNodes.push({ osc, gain, lfo, lfoGain, filter });
    }

    // Surf wash (filtered noise)
    const bufferSize = this.ctx.sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const surfFilter = this.ctx.createBiquadFilter();
    surfFilter.type = 'bandpass';
    surfFilter.frequency.value = 800;
    surfFilter.Q.value = 0.3;

    const surfGain = this.ctx.createGain();
    surfGain.gain.value = 0;
    surfGain.gain.setValueAtTime(0, now);
    surfGain.gain.linearRampToValueAtTime(0.1, now + 3);

    // LFO to modulate surf
    const surfLfo = this.ctx.createOscillator();
    const surfLfoGain = this.ctx.createGain();
    surfLfo.type = 'sine';
    surfLfo.frequency.value = 0.06;
    surfLfoGain.gain.value = 0.08;
    surfLfo.connect(surfLfoGain);
    surfLfoGain.connect(surfGain.gain);

    noise.connect(surfFilter);
    surfFilter.connect(surfGain);
    surfGain.connect(this.ambientGain);
    noise.start(now);
    surfLfo.start(now);

    this.ambientNodes.push({ osc: noise, gain: surfGain, filter: surfFilter, lfo: surfLfo, lfoGain: surfLfoGain });
  }

  /** Birds: chirping oscillators with random timing */
  _createBirdsAmbient() {
    const now = this.ctx.currentTime;

    // Soft background tone
    const bgOsc = this.ctx.createOscillator();
    const bgGain = this.ctx.createGain();
    bgOsc.type = 'sine';
    bgOsc.frequency.value = 2000;
    bgGain.gain.value = 0;
    bgGain.gain.setValueAtTime(0, now);
    bgGain.gain.linearRampToValueAtTime(0.02, now + 2);
    bgOsc.connect(bgGain);
    bgGain.connect(this.ambientGain);
    bgOsc.start(now);
    this.ambientNodes.push({ osc: bgOsc, gain: bgGain });

    // Bird chirp scheduler
    const createChirp = () => {
      if (this.ambientNodes.length === 0) return;
      const t = this.ctx.currentTime;
      const numNotes = 2 + Math.floor(Math.random() * 4);
      const baseFreq = 2500 + Math.random() * 3000;

      for (let i = 0; i < numNotes; i++) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        const noteStart = t + i * (0.08 + Math.random() * 0.06);
        osc.frequency.setValueAtTime(baseFreq + Math.random() * 1500, noteStart);
        osc.frequency.linearRampToValueAtTime(baseFreq + Math.random() * 2000, noteStart + 0.06);
        g.gain.setValueAtTime(0, noteStart);
        g.gain.linearRampToValueAtTime(0.04, noteStart + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.08);
        osc.connect(g);
        g.connect(this.ambientGain);
        osc.start(noteStart);
        osc.stop(noteStart + 0.1);
      }

      this.ambientTimer = setTimeout(createChirp, 800 + Math.random() * 3000);
    };
    createChirp();
  }

  /**
   * Fade out and disconnect all ambient nodes.
   */
  stopAmbient() {
    if (this.ambientTimer) {
      clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
    }

    const now = this.ctx ? this.ctx.currentTime : 0;
    this.ambientNodes.forEach(node => {
      try {
        if (node.gain) {
          node.gain.gain.setValueAtTime(node.gain.gain.value, now);
          node.gain.gain.linearRampToValueAtTime(0, now + 0.8);
        }
        setTimeout(() => {
          try { node.osc.stop(); } catch (_) {}
        }, 900);
      } catch (_) {}
    });
    this.ambientNodes = [];
  }

  // ─── R37: UI Sound Effects (pure oscillator synthesis) ─────────────────

  /**
   * Play a UI sound effect.
   * @param {'click'|'hover'|'transition'|'modal-open'|'modal-close'} type
   */
  playSfx(type) {
    if (!this._initialized) this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();

    switch (type) {
      case 'click':       this._sfxClick();      break;
      case 'hover':       this._sfxHover();      break;
      case 'transition':  this._sfxTransition(); break;
      case 'modal-open':  this._sfxModalOpen();  break;
      case 'modal-close': this._sfxModalClose(); break;
      default:
        this._sfxClick(); // fallback
    }
  }

  /** Short high-frequency blip */
  _sfxClick() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.linearRampToValueAtTime(800, t + 0.04);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  /** Soft low-frequency sweep */
  _sfxHover() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(500, t + 0.08);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.11);
  }

  /** Rising tone sweep */
  _sfxTransition() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.3);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.36);
  }

  /** Ascending chime (two-note) */
  _sfxModalOpen() {
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25]; // C5, E5
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + i * 0.1;
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.26);
    });
  }

  /** Descending chime (two-note) */
  _sfxModalClose() {
    const t = this.ctx.currentTime;
    const notes = [659.25, 523.25]; // E5, C5
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = t + i * 0.1;
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.1, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(start);
      osc.stop(start + 0.21);
    });
  }

  // ─── R38: Music Visualizer Data ───────────────────────────────────────

  /**
   * Returns normalized frequency band data for audio-reactive effects.
   * @returns {{ bass: number, mid: number, high: number, volume: number }}
   *   All values normalized 0-1.
   */
  getAnalyserData() {
    if (!this._initialized || !this.analyser) {
      return { bass: 0, mid: 0, high: 0, volume: 0 };
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Split frequency bins into bands
    // fftSize=256 -> 128 bins; at 44100Hz sampleRate each bin ~172Hz
    const bassEnd = Math.floor(bufferLength * 0.1);    // ~0-430 Hz
    const midEnd = Math.floor(bufferLength * 0.4);      // ~430-2200 Hz
    // high: rest                                       // ~2200+ Hz

    let bassSum = 0, midSum = 0, highSum = 0;

    for (let i = 0; i < bassEnd; i++) bassSum += dataArray[i];
    for (let i = bassEnd; i < midEnd; i++) midSum += dataArray[i];
    for (let i = midEnd; i < bufferLength; i++) highSum += dataArray[i];

    const bass = bassEnd > 0 ? (bassSum / bassEnd) / 255 : 0;
    const mid = (midEnd - bassEnd) > 0 ? (midSum / (midEnd - bassEnd)) / 255 : 0;
    const high = (bufferLength - midEnd) > 0 ? (highSum / (bufferLength - midEnd)) / 255 : 0;

    // Overall RMS volume approximation
    let rmsSum = 0;
    for (let i = 0; i < bufferLength; i++) rmsSum += dataArray[i] * dataArray[i];
    const volume = Math.sqrt(rmsSum / bufferLength) / 255;

    return { bass, mid, high, volume };
  }
}

window.AudioManager = AudioManager;
