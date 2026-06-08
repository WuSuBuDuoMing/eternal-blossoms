/**
 * GestureManager — R81-R85 手势识别与键盘导航增强
 *
 * R81: 手势识别器 (tap, double-tap, long-press, swipe, pinch-zoom, rotate)
 * R82: 滑动导航 (card navigation via swipe, velocity-based detection)
 * R83: 长按检测 (long-press with visual indicator & quick-action menu)
 * R84: 惯性滚动 (momentum scrolling with exponential decay)
 * R85: 键盘导航增强 (arrow keys, Enter/Space, Tab, Escape)
 */

class GestureManager {
  constructor(element) {
    this.element = element || document.body;

    // ----------------------------------------------------------------
    // R81: Handler registry
    // ----------------------------------------------------------------
    this._handlers = {};

    // ----------------------------------------------------------------
    // R81: Internal state — touch tracking
    // ----------------------------------------------------------------
    this.touchStartPositions = new Map();   // identifier -> { x, y, time }
    this.touchCurrentPositions = new Map();
    this.gestureStartTime = 0;
    this.lastTapTime = 0;
    this._tapCount = 0;
    this._tapTimer = null;

    // ----------------------------------------------------------------
    // R81: Pinch / rotate state
    // ----------------------------------------------------------------
    this._initialPinchDistance = 0;
    this._initialPinchAngle = 0;
    this._lastPinchScale = 1;
    this._lastRotateAngle = 0;

    // ----------------------------------------------------------------
    // R82: Swipe state
    // ----------------------------------------------------------------
    this._swipeThreshold = 30;       // minimum distance in px
    this._swipeVelocityThreshold = 0.3; // px/ms — fast swipe
    this._isSwiping = false;
    this._swipeDirection = null;
    this._swipeConfirmed = false;
    this._gestureDecided = false;

    // ----------------------------------------------------------------
    // R82: Velocity tracking
    // ----------------------------------------------------------------
    this._velocityTracker = [];      // { x, y, time }
    this._velocityWindowSize = 5;    // track last N points

    // ----------------------------------------------------------------
    // R83: Long-press state
    // ----------------------------------------------------------------
    this._longPressDelay = 500;      // ms
    this._longPressTimer = null;
    this._longPressActive = false;
    this._longPressPosition = { x: 0, y: 0 };
    this._longPressIndicator = null;
    this._longPressMoveThreshold = 10; // px — cancel if finger moves more

    // ----------------------------------------------------------------
    // R84: Momentum scrolling state
    // ----------------------------------------------------------------
    this._momentumActive = false;
    this._momentumVelocity = 0;      // px/ms along dominant axis
    this._momentumAxis = null;       // 'x' | 'y'
    this._momentumRAF = null;
    this._momentumDecay = 0.95;      // exponential decay per frame
    this._momentumMinVelocity = 0.001;
    this._momentumCallback = null;   // function(deltaX, deltaY) per frame

    // ----------------------------------------------------------------
    // R85: Keyboard navigation state
    // ----------------------------------------------------------------
    this._keyboardHighlightIndex = -1;
    this._focusIndicator = null;
    this._interactiveElements = [];
    this._tabFocusIndex = -1;
    this._onCardNavigate = null;     // callback(index)
    this._onCardOpen = null;         // callback(index)
    this._onEscape = null;           // callback()

    // ----------------------------------------------------------------
    // Bind event handlers (so we can remove them later)
    // ----------------------------------------------------------------
    this._onTouchStart = this._handleTouchStart.bind(this);
    this._onTouchMove = this._handleTouchMove.bind(this);
    this._onTouchEnd = this._handleTouchEnd.bind(this);
    this._onTouchCancel = this._handleTouchCancel.bind(this);
    this._onMouseDown = this._handleMouseDown.bind(this);
    this._onMouseMove = this._handleMouseMove.bind(this);
    this._onMouseUp = this._handleMouseUp.bind(this);
    this._onKeyDown = this._handleKeyDown.bind(this);

    this._attachListeners();
  }

  // =====================================================================
  // Lifecycle
  // =====================================================================

  /**
   * Attach all event listeners to the target element
   */
  _attachListeners() {
    // Touch events
    this.element.addEventListener('touchstart', this._onTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this._onTouchMove, { passive: false });
    this.element.addEventListener('touchend', this._onTouchEnd, { passive: true });
    this.element.addEventListener('touchcancel', this._onTouchCancel, { passive: true });

    // Mouse events (for desktop)
    this.element.addEventListener('mousedown', this._onMouseDown);
    this.element.addEventListener('mousemove', this._onMouseMove);
    this.element.addEventListener('mouseup', this._onMouseUp);
    this.element.addEventListener('mouseleave', this._onMouseUp);

    // Keyboard events (global)
    window.addEventListener('keydown', this._onKeyDown);
  }

  /**
   * Remove all event listeners
   */
  destroy() {
    this.element.removeEventListener('touchstart', this._onTouchStart);
    this.element.removeEventListener('touchmove', this._onTouchMove);
    this.element.removeEventListener('touchend', this._onTouchEnd);
    this.element.removeEventListener('touchcancel', this._onTouchCancel);
    this.element.removeEventListener('mousedown', this._onMouseDown);
    this.element.removeEventListener('mousemove', this._onMouseMove);
    this.element.removeEventListener('mouseup', this._onMouseUp);
    this.element.removeEventListener('mouseleave', this._onMouseUp);
    window.removeEventListener('keydown', this._onKeyDown);

    this._cancelLongPress();
    this._stopMomentum();
    this._removeLongPressIndicator();
    this._removeFocusIndicator();
  }

  // =====================================================================
  // R81: Gesture handler registration
  // =====================================================================

  /**
   * Register a handler for a named gesture.
   * Supported gestures: tap, double-tap, longpress, swipe, pinch, rotate,
   *                     momentum-scroll
   * Callback receives an event object with gesture-specific data.
   */
  on(gesture, callback) {
    if (typeof callback === 'function') {
      this._handlers[gesture] = callback;
    }
    return this;
  }

  /**
   * Remove a gesture handler.
   */
  off(gesture) {
    delete this._handlers[gesture];
    return this;
  }

  /**
   * Emit a gesture event to registered handler
   */
  _emit(gesture, data) {
    const handler = this._handlers[gesture];
    if (handler) {
      handler({ gesture, ...data });
    }
  }

  // =====================================================================
  // R81 + R82 + R83: Touch event handlers
  // =====================================================================

  _handleTouchStart(e) {
    // Track each new touch
    for (const touch of e.changedTouches) {
      this.touchStartPositions.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      });
      this.touchCurrentPositions.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
      });
    }

    this._velocityTracker = [];
    this._gestureDecided = false;
    this._swipeConfirmed = false;
    this._isSwiping = false;

    const now = Date.now();
    this.gestureStartTime = now;

    if (e.touches.length === 1) {
      const t = e.touches[0];
      this._velocityTracker.push({ x: t.clientX, y: t.clientY, time: now });

      // R83: Start long-press timer
      this._startLongPress(t.clientX, t.clientY, e);

      // Track pinch initial state
    } else if (e.touches.length === 2) {
      this._cancelLongPress(); // multi-touch cancels long-press
      this._computePinchInitial(e.touches[0], e.touches[1]);
    }
  }

  _handleTouchMove(e) {
    e.preventDefault(); // prevent scrolling during gesture recognition

    for (const touch of e.changedTouches) {
      this.touchCurrentPositions.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
      });
    }

    const now = Date.now();

    if (e.touches.length === 1) {
      const t = e.touches[0];
      const start = this.touchStartPositions.get(t.identifier);

      // R83: Cancel long-press if finger moves beyond threshold
      if (start) {
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > this._longPressMoveThreshold) {
          this._cancelLongPress();
        }
      }

      // R81/R82: Track velocity
      this._velocityTracker.push({ x: t.clientX, y: t.clientY, time: now });
      if (this._velocityTracker.length > this._velocityWindowSize) {
        this._velocityTracker.shift();
      }

      // R82: Preliminary swipe direction (don't prevent default yet)
      if (start && !this._gestureDecided) {
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (absDx > 10 || absDy > 10) {
          this._gestureDecided = true;
          if (absDx > absDy) {
            this._swipeDirection = dx > 0 ? 'right' : 'left';
          } else {
            this._swipeDirection = dy > 0 ? 'down' : 'up';
          }
        }
      }
    } else if (e.touches.length === 2) {
      this._cancelLongPress();
      // R81: Pinch & rotate
      const [t1, t2] = [e.touches[0], e.touches[1]];
      const currentDistance = this._touchDistance(t1, t2);
      const currentAngle = this._touchAngle(t1, t2);

      if (this._initialPinchDistance > 0) {
        const scale = currentDistance / this._initialPinchDistance;
        const rotation = currentAngle - this._initialPinchAngle;

        this._lastPinchScale = scale;
        this._lastRotateAngle = rotation;

        this._emit('pinch', {
          scale,
          center: this._touchCenter(t1, t2),
          startDistance: this._initialPinchDistance,
          currentDistance,
        });

        this._emit('rotate', {
          angle: rotation,
          center: this._touchCenter(t1, t2),
        });
      }
    }
  }

  _handleTouchEnd(e) {
    const now = Date.now();

    for (const touch of e.changedTouches) {
      const start = this.touchStartPositions.get(touch.identifier);
      const current = this.touchCurrentPositions.get(touch.identifier);

      if (start && current) {
        const dx = current.x - start.x;
        const dy = current.y - start.y;
        const dt = now - start.time;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (e.touches.length === 0) {
          // R83: Cancel long-press (touch ended normally)
          this._cancelLongPress();

          // R82: Check for swipe
          if (distance > this._swipeThreshold && dt > 0) {
            const velocity = distance / dt; // px/ms
            const fastSwipe = velocity > this._swipeVelocityThreshold;

            this._emit('swipe', {
              direction: this._swipeDirection,
              distance,
              velocity,
              fastSwipe,
              dx,
              dy,
              duration: dt,
              startX: start.x,
              startY: start.y,
              endX: current.x,
              endY: current.y,
            });

            // R84: If fast swipe, start momentum scrolling
            if (fastSwipe) {
              this._startMomentum(dx, dy, dt);
            }
          } else if (distance < 10 && dt < 300) {
            // R81: Tap detection
            this._handleTap(now, current);
          }
        }
      }

      this.touchStartPositions.delete(touch.identifier);
      this.touchCurrentPositions.delete(touch.identifier);
    }

    // Reset pinch state when all touches lift
    if (e.touches.length === 0) {
      this._initialPinchDistance = 0;
      this._initialPinchAngle = 0;
      this._swipeDirection = null;
      this._gestureDecided = false;
    }
  }

  _handleTouchCancel(e) {
    this._cancelLongPress();
    for (const touch of e.changedTouches) {
      this.touchStartPositions.delete(touch.identifier);
      this.touchCurrentPositions.delete(touch.identifier);
    }
    if (e.touches.length === 0) {
      this._initialPinchDistance = 0;
      this._swipeDirection = null;
      this._gestureDecided = false;
    }
  }

  // =====================================================================
  // R81: Mouse event handlers (desktop fallback)
  // =====================================================================

  _mouseState = {
    isDown: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    currentX: 0,
    currentY: 0,
  };

  _handleMouseDown(e) {
    // Only track left mouse button
    if (e.button !== 0) return;

    const now = Date.now();
    this._mouseState = {
      isDown: true,
      startX: e.clientX,
      startY: e.clientY,
      startTime: now,
      currentX: e.clientX,
      currentY: e.clientY,
    };
    this.gestureStartTime = now;
    this._velocityTracker = [{ x: e.clientX, y: e.clientY, time: now }];
    this._gestureDecided = false;

    // R83: Start long-press timer for mouse as well
    this._startLongPress(e.clientX, e.clientY, e);
  }

  _handleMouseMove(e) {
    if (!this._mouseState.isDown) return;

    this._mouseState.currentX = e.clientX;
    this._mouseState.currentY = e.clientY;

    const now = Date.now();
    const dx = e.clientX - this._mouseState.startX;
    const dy = e.clientY - this._mouseState.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // R83: Cancel long-press if mouse moves beyond threshold
    if (dist > this._longPressMoveThreshold) {
      this._cancelLongPress();
    }

    // R81/R84: Track velocity
    this._velocityTracker.push({ x: e.clientX, y: e.clientY, time: now });
    if (this._velocityTracker.length > this._velocityWindowSize) {
      this._velocityTracker.shift();
    }

    // R82: Preliminary direction
    if (dist > 10 && !this._gestureDecided) {
      this._gestureDecided = true;
      if (Math.abs(dx) > Math.abs(dy)) {
        this._swipeDirection = dx > 0 ? 'right' : 'left';
      } else {
        this._swipeDirection = dy > 0 ? 'down' : 'up';
      }
    }
  }

  _handleMouseUp(e) {
    if (!this._mouseState.isDown) return;
    this._mouseState.isDown = false;

    const now = Date.now();
    this._cancelLongPress();

    const { startX, startY, startTime } = this._mouseState;
    const dx = this._mouseState.currentX - startX;
    const dy = this._mouseState.currentY - startY;
    const dt = now - startTime;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // R82: Check for swipe
    if (distance > this._swipeThreshold && dt > 0) {
      const velocity = distance / dt;
      const fastSwipe = velocity > this._swipeVelocityThreshold;

      this._emit('swipe', {
        direction: this._swipeDirection,
        distance,
        velocity,
        fastSwipe,
        dx,
        dy,
        duration: dt,
        startX,
        startY,
        endX: this._mouseState.currentX,
        endY: this._mouseState.currentY,
      });

      // R84: Start momentum for fast swipes
      if (fastSwipe) {
        this._startMomentum(dx, dy, dt);
      }
    } else if (distance < 10 && dt < 300) {
      // R81: Tap
      this._handleTap(now, { x: this._mouseState.currentX, y: this._mouseState.currentY });
    }

    this._swipeDirection = null;
    this._gestureDecided = false;
  }

  // =====================================================================
  // R81: Tap & double-tap detection
  // =====================================================================

  _handleTap(now, position) {
    const DOUBLE_TAP_DELAY = 300; // ms between taps

    this._tapCount++;

    if (this._tapCount === 1) {
      // First tap — wait to see if there's a second
      this._tapTimer = setTimeout(() => {
        this._tapCount = 0;
        this._emit('tap', {
          x: position.x,
          y: position.y,
          timestamp: now,
        });
      }, DOUBLE_TAP_DELAY);
    } else if (this._tapCount >= 2) {
      // Double-tap detected
      clearTimeout(this._tapTimer);
      this._tapTimer = null;
      this._tapCount = 0;

      this._emit('double-tap', {
        x: position.x,
        y: position.y,
        timestamp: now,
      });
    }

    this.lastTapTime = now;
  }

  // =====================================================================
  // R83: Long-press detection
  // =====================================================================

  _startLongPress(x, y, event) {
    this._cancelLongPress();
    this._longPressPosition = { x, y };

    this._longPressTimer = setTimeout(() => {
      this._longPressActive = true;
      this._showLongPressIndicator(x, y);

      this._emit('longpress', {
        x,
        y,
        target: event.target,
        timestamp: Date.now(),
      });
    }, this._longPressDelay);
  }

  _cancelLongPress() {
    if (this._longPressTimer) {
      clearTimeout(this._longPressTimer);
      this._longPressTimer = null;
    }
    if (this._longPressActive) {
      this._longPressActive = false;
      this._removeLongPressIndicator();
    }
  }

  /**
   * Show expanding circle indicator during long-press
   */
  _showLongPressIndicator(x, y) {
    this._removeLongPressIndicator();

    const el = document.createElement('div');
    el.className = 'gesture-longpress-indicator';
    el.style.cssText = [
      'position:fixed',
      'left:' + x + 'px',
      'top:' + y + 'px',
      'width:0',
      'height:0',
      'border-radius:50%',
      'background:rgba(201,160,220,0.25)',
      'border:2px solid rgba(201,160,220,0.6)',
      'transform:translate(-50%,-50%)',
      'pointer-events:none',
      'z-index:10000',
      'transition:width 0.3s ease, height 0.3s ease, opacity 0.3s ease',
      'opacity:0',
    ].join(';');

    document.body.appendChild(el);

    // Force reflow, then expand
    el.offsetHeight;
    el.style.width = '80px';
    el.style.height = '80px';
    el.style.opacity = '1';

    this._longPressIndicator = el;
  }

  _removeLongPressIndicator() {
    if (this._longPressIndicator && this._longPressIndicator.parentNode) {
      this._longPressIndicator.style.opacity = '0';
      this._longPressIndicator.style.width = '0';
      this._longPressIndicator.style.height = '0';
      const el = this._longPressIndicator;
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 300);
      this._longPressIndicator = null;
    }
  }

  /**
   * Show a quick-action menu for a long-pressed card.
   * The caller can set this to hook into their own card system.
   */
  showQuickActionMenu(x, y, cardData) {
    this.hideQuickActionMenu();

    const menu = document.createElement('div');
    menu.className = 'gesture-quick-menu';
    menu.style.cssText = [
      'position:fixed',
      'left:' + x + 'px',
      'top:' + y + 'px',
      'transform:translate(-50%,-50%)',
      'background:rgba(20,12,28,0.92)',
      'backdrop-filter:blur(16px)',
      'border:1px solid rgba(201,160,220,0.25)',
      'border-radius:16px',
      'padding:8px 0',
      'z-index:10001',
      'display:flex',
      'flex-direction:column',
      'min-width:160px',
      'opacity:0',
      'transition:opacity 0.2s ease, transform 0.2s ease',
      'transform:translate(-50%,-50%) scale(0.85)',
      'box-shadow:0 8px 32px rgba(0,0,0,0.5)',
    ].join(';');

    const actions = [
      { icon: '❤', label: 'Favorite', action: 'favorite' },
      { icon: '↪', label: 'Share', action: 'share' },
      { icon: 'ℹ', label: 'Details', action: 'details' },
    ];

    actions.forEach(({ icon, label, action }) => {
      const btn = document.createElement('button');
      btn.className = 'gesture-quick-menu-item';
      btn.style.cssText = [
        'display:flex',
        'align-items:center',
        'gap:10px',
        'padding:10px 20px',
        'background:none',
        'border:none',
        'color:rgba(255,255,255,0.85)',
        'font-size:14px',
        'cursor:pointer',
        'transition:background 0.15s',
        'text-align:left',
      ].join(';');
      btn.innerHTML = '<span style="font-size:16px;">' + icon + '</span><span>' + label + '</span>';

      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(201,160,220,0.15)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'none';
      });
      btn.addEventListener('click', () => {
        this._emit('quick-action', { action, cardData });
        this.hideQuickActionMenu();
      });

      menu.appendChild(btn);
    });

    document.body.appendChild(menu);
    this._quickMenu = menu;

    // Animate in
    requestAnimationFrame(() => {
      menu.style.opacity = '1';
      menu.style.transform = 'translate(-50%,-50%) scale(1)';
    });

    // Auto-close after 5 seconds
    this._quickMenuTimer = setTimeout(() => this.hideQuickActionMenu(), 5000);

    return menu;
  }

  hideQuickActionMenu() {
    if (this._quickMenuTimer) {
      clearTimeout(this._quickMenuTimer);
      this._quickMenuTimer = null;
    }
    if (this._quickMenu && this._quickMenu.parentNode) {
      this._quickMenu.parentNode.removeChild(this._quickMenu);
    }
    this._quickMenu = null;
  }

  // =====================================================================
  // R81: Pinch/rotate helpers
  // =====================================================================

  _computePinchInitial(t1, t2) {
    this._initialPinchDistance = this._touchDistance(t1, t2);
    this._initialPinchAngle = this._touchAngle(t1, t2);
    this._lastPinchScale = 1;
    this._lastRotateAngle = 0;
  }

  _touchDistance(t1, t2) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  _touchAngle(t1, t2) {
    return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI);
  }

  _touchCenter(t1, t2) {
    return {
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    };
  }

  // =====================================================================
  // R84: Momentum scrolling
  // =====================================================================

  /**
   * Calculate velocity from the last few touchmove events.
   * Returns { vx, vy } in px/ms.
   */
  getVelocity() {
    const tracker = this._velocityTracker;
    if (tracker.length < 2) return { vx: 0, vy: 0 };

    // Use the last N points for average velocity
    const recent = tracker.slice(-this._velocityWindowSize);
    const first = recent[0];
    const last = recent[recent.length - 1];
    const dt = last.time - first.time;

    if (dt <= 0) return { vx: 0, vy: 0 };

    return {
      vx: (last.x - first.x) / dt,
      vy: (last.y - first.y) / dt,
    };
  }

  /**
   * Start momentum scrolling after a fast swipe/fling.
   * @param {number} dx - total displacement of the swipe
   * @param {number} dy - total displacement of the swipe
   * @param {number} dt - time duration of the swipe in ms
   */
  _startMomentum(dx, dy, dt) {
    if (dt <= 0) return;

    this._stopMomentum();

    const { vx, vy } = this.getVelocity();

    // Determine dominant axis
    const absVx = Math.abs(vx);
    const absVy = Math.abs(vy);

    if (absVx < 0.01 && absVy < 0.01) return;

    this._momentumActive = true;
    this._momentumVelocity = absVy > absVx ? vy : vx;
    this._momentumAxis = absVy > absVx ? 'y' : 'x';

    this._momentumLastTime = performance.now();

    const animateMomentum = (timestamp) => {
      if (!this._momentumActive) return;

      const elapsed = timestamp - this._momentumLastTime;
      this._momentumLastTime = timestamp;

      // Calculate delta for this frame based on velocity
      const delta = this._momentumVelocity * elapsed;

      const deltaX = this._momentumAxis === 'x' ? delta : 0;
      const deltaY = this._momentumAxis === 'y' ? delta : 0;

      // Emit momentum scroll event
      this._emit('momentum-scroll', {
        deltaX,
        deltaY,
        velocity: this._momentumVelocity,
        axis: this._momentumAxis,
      });

      // Execute callback if registered
      if (this._momentumCallback) {
        this._momentumCallback(deltaX, deltaY);
      }

      // Exponential decay
      this._momentumVelocity *= this._momentumDecay;

      // Stop when velocity drops below threshold
      if (Math.abs(this._momentumVelocity) < this._momentumMinVelocity) {
        this._stopMomentum();
        this._emit('momentum-end', {});
        return;
      }

      this._momentumRAF = requestAnimationFrame(animateMomentum);
    };

    this._momentumRAF = requestAnimationFrame(animateMomentum);
  }

  _stopMomentum() {
    this._momentumActive = false;
    this._momentumVelocity = 0;
    if (this._momentumRAF) {
      cancelAnimationFrame(this._momentumRAF);
      this._momentumRAF = null;
    }
  }

  /**
   * Register a callback for momentum scrolling.
   * The callback receives (deltaX, deltaY) each frame.
   */
  onMomentumScroll(callback) {
    this._momentumCallback = callback;
  }

  /**
   * Stop any active momentum (e.g., when user touches again).
   */
  stopMomentum() {
    this._stopMomentum();
  }

  // =====================================================================
  // R85: Keyboard navigation
  // =====================================================================

  /**
   * Set up keyboard navigation with card data.
   * @param {Object} options
   * @param {number} options.totalCards - total number of cards
   * @param {Function} options.onNavigate - callback(index) when card is highlighted
   * @param {Function} options.onOpen - callback(index) when card is opened
   * @param {Function} options.onEscape - callback() when Escape is pressed
   */
  setupKeyboardNav(options) {
    this._totalCards = options.totalCards || 0;
    this._onCardNavigate = options.onNavigate || null;
    this._onCardOpen = options.onOpen || null;
    this._onEscape = options.onEscape || null;
    this._keyboardHighlightIndex = -1;
    this._createFocusIndicator();
  }

  /**
   * Update the total number of cards (e.g., after data loads)
   */
  setTotalCards(count) {
    this._totalCards = count;
  }

  _createFocusIndicator() {
    if (this._focusIndicator) return;

    const el = document.createElement('div');
    el.className = 'gesture-focus-indicator';
    el.style.cssText = [
      'position:fixed',
      'pointer-events:none',
      'z-index:9999',
      'border:2px solid rgba(201,160,220,0.8)',
      'border-radius:12px',
      'box-shadow:0 0 20px rgba(201,160,220,0.3), inset 0 0 20px rgba(201,160,220,0.05)',
      'transition:all 0.25s ease',
      'opacity:0',
      'display:none',
    ].join(';');

    document.body.appendChild(el);
    this._focusIndicator = el;
  }

  _removeFocusIndicator() {
    if (this._focusIndicator && this._focusIndicator.parentNode) {
      this._focusIndicator.parentNode.removeChild(this._focusIndicator);
    }
    this._focusIndicator = null;
  }

  /**
   * Update the focus indicator position/visibility.
   * If targetEl is provided, the indicator surrounds it.
   * If targetEl is null, the indicator is hidden.
   */
  _updateFocusIndicator(targetEl) {
    if (!this._focusIndicator) return;

    if (!targetEl) {
      this._focusIndicator.style.display = 'none';
      this._focusIndicator.style.opacity = '0';
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    const padding = 8;

    this._focusIndicator.style.display = 'block';
    this._focusIndicator.style.left = (rect.left - padding) + 'px';
    this._focusIndicator.style.top = (rect.top - padding) + 'px';
    this._focusIndicator.style.width = (rect.width + padding * 2) + 'px';
    this._focusIndicator.style.height = (rect.height + padding * 2) + 'px';
    this._focusIndicator.style.opacity = '1';
  }

  /**
   * Get interactive elements in the page for Tab cycling
   */
  _getInteractiveElements() {
    return Array.from(document.querySelectorAll(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
  }

  _handleKeyDown(e) {
    const total = this._totalCards || 0;

    // ----------------------------------------------------------------
    // R85: Escape — close any open overlay
    // ----------------------------------------------------------------
    if (e.key === 'Escape') {
      // First try the quick action menu
      if (this._quickMenu) {
        this.hideQuickActionMenu();
        e.preventDefault();
        return;
      }

      if (this._onEscape) {
        this._onEscape();
        e.preventDefault();
        return;
      }

      return;
    }

    // If a modal or overlay is open, don't process arrow keys for card nav
    // (the caller's Escape handler should close it)
    const isModalOpen = document.querySelector(
      '.modal-overlay.open, .gesture-quick-menu, [class*="overlay"][class*="open"]'
    );
    if (isModalOpen) return;

    // ----------------------------------------------------------------
    // R85: Arrow keys — navigate between cards
    // ----------------------------------------------------------------
    if (total > 0) {
      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          this._keyboardHighlightIndex = Math.max(0, this._keyboardHighlightIndex - 1);
          this._emitKeyboardNavigate();
          break;

        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          this._keyboardHighlightIndex = Math.min(total - 1, this._keyboardHighlightIndex + 1);
          this._emitKeyboardNavigate();
          break;

        case 'Home':
          if (!e.ctrlKey) {
            e.preventDefault();
            this._keyboardHighlightIndex = 0;
            this._emitKeyboardNavigate();
          }
          break;

        case 'End':
          if (!e.ctrlKey) {
            e.preventDefault();
            this._keyboardHighlightIndex = total - 1;
            this._emitKeyboardNavigate();
          }
          break;

        // ----------------------------------------------------------------
        // R85: Enter / Space — open highlighted card
        // ----------------------------------------------------------------
        case 'Enter':
        case ' ':
          if (this._keyboardHighlightIndex >= 0 && this._keyboardHighlightIndex < total) {
            e.preventDefault();
            if (this._onCardOpen) {
              this._onCardOpen(this._keyboardHighlightIndex);
            }
            this._emit('card-open', { index: this._keyboardHighlightIndex });
          }
          break;
      }
    }

    // ----------------------------------------------------------------
    // R85: Tab — cycle through interactive elements
    // ----------------------------------------------------------------
    if (e.key === 'Tab') {
      this._interactiveElements = this._getInteractiveElements();
      if (this._interactiveElements.length > 0) {
        // Let the browser handle native Tab unless we need custom behavior
        // We just track the focused element for visual indicator purposes
        // Use setTimeout to read the newly focused element after browser processes
        setTimeout(() => {
          const active = document.activeElement;
          if (active && active !== document.body) {
            this._tabFocusIndex = this._interactiveElements.indexOf(active);
            this._updateFocusIndicator(active);
          }
        }, 0);
      }
    }
  }

  /**
   * Emit keyboard navigation event and update focus indicator
   */
  _emitKeyboardNavigate() {
    const index = this._keyboardHighlightIndex;

    this._emit('keyboard-navigate', { index });

    if (this._onCardNavigate) {
      this._onCardNavigate(index);
    }

    // Try to find and highlight the card element in the DOM
    // Look for elements with data-card-index or similar attributes
    this._highlightCardByIndex(index);
  }

  /**
   * Attempt to find and visually highlight a card by its index.
   * Supports common patterns: data-card-index, .card:nth-child, etc.
   */
  _highlightCardByIndex(index) {
    // Try multiple selectors to find the card
    let cardEl = document.querySelector('[data-card-index="' + index + '"]');
    if (!cardEl) {
      cardEl = document.querySelector('.card[data-index="' + index + '"]');
    }
    if (!cardEl) {
      // Try Three.js canvas overlay patterns — look for any positioned card elements
      const cards = document.querySelectorAll('.card, .memory-card, .blossom-card');
      if (cards[index]) {
        cardEl = cards[index];
      }
    }

    if (cardEl) {
      this._updateFocusIndicator(cardEl);
    } else {
      // If we can't find a DOM element, hide the indicator
      // (the callback handles the visual feedback)
      this._updateFocusIndicator(null);
    }
  }

  /**
   * Programmatically set the highlighted card index
   */
  setHighlightIndex(index) {
    this._keyboardHighlightIndex = index;
    this._highlightCardByIndex(index);
  }

  /**
   * Clear the keyboard highlight
   */
  clearHighlight() {
    this._keyboardHighlightIndex = -1;
    this._updateFocusIndicator(null);
  }
}

// Export to global scope
window.GestureManager = GestureManager;
