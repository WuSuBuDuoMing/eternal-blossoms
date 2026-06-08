/**
 * SimpleAnalytics - Lightweight, privacy-friendly analytics module
 * Rounds 43-46: Event Tracker, Session Tracking, Card View Tracking, Performance Metrics
 */

class SimpleAnalytics {
  constructor(storageKey = 'simpleAnalytics') {
    this.storageKey = storageKey;
    this.sessionStorageKey = storageKey + '_sessions';
    this.performanceStorageKey = storageKey + '_performance';
    this.interactionsStorageKey = storageKey + '_interactions';
    this.cardViewsStorageKey = storageKey + '_cardViews';
    this.currentSession = null;

    this._loadData();
    this._migrateReturningUser();
  }

  // ---------------------------------------------------------------------------
  // Internal persistence helpers
  // ---------------------------------------------------------------------------

  _loadData() {
    this.events = this._read(this.storageKey) || [];
    this.sessions = this._read(this.sessionStorageKey) || [];
    this.performanceMetrics = this._read(this.performanceStorageKey) || {};
    this.interactions = this._read(this.interactionsStorageKey) || [];
    this.cardViews = this._read(this.cardViewsStorageKey) || {};
  }

  _read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  _write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or unavailable - fail silently
    }
  }

  // ---------------------------------------------------------------------------
  // R44 helper: Returning vs New user detection
  // ---------------------------------------------------------------------------

  _migrateReturningUser() {
    const key = this.storageKey + '_returningUser';
    if (localStorage.getItem(key) === null) {
      // First visit ever
      localStorage.setItem(key, 'false');
      this.isReturningUser = false;
    } else {
      this.isReturningUser = localStorage.getItem(key) === 'true';
    }

    // Mark that the user has visited at least once so the next visit is "returning"
    localStorage.setItem(key, 'true');
  }

  // ---------------------------------------------------------------------------
  // R43 - Event Tracker
  // ---------------------------------------------------------------------------

  track(event, data = {}) {
    const entry = {
      id: this._generateId(),
      event: String(event),
      data,
      timestamp: Date.now(),
      date: new Date().toISOString().slice(0, 10),
    };
    this.events.push(entry);
    this._write(this.storageKey, this.events);
    return entry;
  }

  getEvents(filter = {}) {
    let result = this.events;

    if (filter.event) {
      const name = String(filter.event);
      result = result.filter((e) => e.event === name);
    }

    if (filter.startDate) {
      const start = new Date(filter.startDate).getTime();
      result = result.filter((e) => e.timestamp >= start);
    }

    if (filter.endDate) {
      const end = new Date(filter.endDate).getTime();
      result = result.filter((e) => e.timestamp <= end);
    }

    return result;
  }

  getStats() {
    const totalEvents = this.events.length;

    // Unique days active (based on event dates)
    const daysSet = new Set(this.events.map((e) => e.date));
    const uniqueDaysActive = daysSet.size;

    // Most viewed cards
    const mostViewedCards = this.getMostViewedCards(5);

    // Average session duration (ms)
    const durations = this.sessions.map((s) => s.duration).filter((d) => typeof d === 'number' && d > 0);
    const avgSessionDuration =
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    return {
      totalEvents,
      uniqueDaysActive,
      mostViewedCards,
      avgSessionDuration,
      avgSessionDurationFormatted: this._formatDuration(avgSessionDuration),
      totalSessions: this.sessions.length,
      isReturningUser: this.isReturningUser,
    };
  }

  // ---------------------------------------------------------------------------
  // R44 - Session Tracking
  // ---------------------------------------------------------------------------

  startSession() {
    const sessionId = this._generateUUID();
    this.currentSession = {
      id: sessionId,
      startTime: Date.now(),
      endTime: null,
      duration: null,
      events: 0,
    };
    this.track('session_start', { sessionId });
    return this.currentSession;
  }

  endSession() {
    if (!this.currentSession) {
      return null;
    }

    const now = Date.now();
    this.currentSession.endTime = now;
    this.currentSession.duration = now - this.currentSession.startTime;

    this.sessions.push({ ...this.currentSession });
    this._write(this.sessionStorageKey, this.sessions);

    this.track('session_end', {
      sessionId: this.currentSession.id,
      duration: this.currentSession.duration,
    });

    const ended = { ...this.currentSession };
    this.currentSession = null;
    return ended;
  }

  getCurrentSession() {
    return this.currentSession;
  }

  /**
   * Detect whether the current visitor is a returning user.
   * Relies on localStorage: first visit sets flag, subsequent reads find it.
   */
  get isReturningVisitor() {
    return this.isReturningUser;
  }

  // ---------------------------------------------------------------------------
  // R45 - Card View Tracking
  // ---------------------------------------------------------------------------

  trackCardView(cardId, cardTitle = '') {
    const id = String(cardId);
    const title = String(cardTitle);

    // Increment the count in the cardViews map
    if (!this.cardViews[id]) {
      this.cardViews[id] = {
        cardId: id,
        cardTitle: title,
        count: 0,
        category: null,
        firstViewed: Date.now(),
        lastViewed: Date.now(),
        viewHistory: [],
      };
    }

    const record = this.cardViews[id];
    record.count += 1;
    record.cardTitle = title || record.cardTitle;
    record.lastViewed = Date.now();
    record.viewHistory.push(Date.now());

    // Cap history to last 50 views to keep storage manageable
    if (record.viewHistory.length > 50) {
      record.viewHistory = record.viewHistory.slice(-50);
    }

    this._write(this.cardViewsStorageKey, this.cardViews);

    // Also track as a generic event
    this.track('card_view', { cardId: id, cardTitle: title });

    return record;
  }

  /**
   * Set the category for a card (used for aggregation).
   */
  setCardCategory(cardId, category) {
    const id = String(cardId);
    if (!this.cardViews[id]) {
      this.cardViews[id] = {
        cardId: id,
        cardTitle: '',
        count: 0,
        category: null,
        firstViewed: Date.now(),
        lastViewed: Date.now(),
        viewHistory: [],
      };
    }
    this.cardViews[id].category = String(category);
    this._write(this.cardViewsStorageKey, this.cardViews);
  }

  getMostViewedCards(limit = 10) {
    return Object.values(this.cardViews)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((c) => ({
        cardId: c.cardId,
        cardTitle: c.cardTitle,
        count: c.count,
        category: c.category,
        firstViewed: c.firstViewed,
        lastViewed: c.lastViewed,
      }));
  }

  getCardViewsByCategory() {
    const categories = {};

    for (const record of Object.values(this.cardViews)) {
      const cat = record.category || 'uncategorized';
      if (!categories[cat]) {
        categories[cat] = {
          category: cat,
          totalViews: 0,
          uniqueCards: 0,
          cards: [],
        };
      }
      categories[cat].totalViews += record.count;
      categories[cat].uniqueCards += 1;
      categories[cat].cards.push({
        cardId: record.cardId,
        cardTitle: record.cardTitle,
        count: record.count,
      });
    }

    // Sort cards within each category by count descending
    for (const cat of Object.values(categories)) {
      cat.cards.sort((a, b) => b.count - a.count);
    }

    return categories;
  }

  // ---------------------------------------------------------------------------
  // R46 - Performance Metrics
  // ---------------------------------------------------------------------------

  trackPerformance() {
    const metrics = {};

    try {
      const paintEntries = performance.getEntriesByType('paint');
      for (const entry of paintEntries) {
        if (entry.name === 'first-contentful-paint') {
          metrics.fcp = Math.round(entry.startTime);
        }
      }
    } catch {
      // Performance API not available
    }

    // LCP via PerformanceObserver (async, may not be available immediately)
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            const lastEntry = entries[entries.length - 1];
            this.performanceMetrics.lcp = Math.round(lastEntry.startTime);
            this._write(this.performanceStorageKey, this.performanceMetrics);
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {
        // Observer type not supported
      }
    }

    // DOMContentLoaded
    if (performance.timing) {
      const timing = performance.timing;
      metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
    }

    this.performanceMetrics = { ...this.performanceMetrics, ...metrics };
    this._write(this.performanceStorageKey, this.performanceMetrics);

    return this.performanceMetrics;
  }

  getPerformanceReport() {
    return {
      ...this.performanceMetrics,
      interactionsCount: this.interactions.length,
      recentInteractions: this.interactions.slice(-10),
    };
  }

  trackInteraction(metric, value) {
    const entry = {
      metric: String(metric),
      value: typeof value === 'number' ? value : parseFloat(value) || 0,
      timestamp: Date.now(),
    };
    this.interactions.push(entry);
    this._write(this.interactionsStorageKey, this.interactions);
    return entry;
  }

  // ---------------------------------------------------------------------------
  // Utility
  // ---------------------------------------------------------------------------

  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  _generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  _formatDuration(ms) {
    if (!ms || ms <= 0) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Clear all stored analytics data.
   */
  reset() {
    this.events = [];
    this.sessions = [];
    this.cardViews = {};
    this.performanceMetrics = {};
    this.interactions = [];
    this.currentSession = null;
    this._write(this.storageKey, []);
    this._write(this.sessionStorageKey, []);
    this._write(this.cardViewsStorageKey, {});
    this._write(this.performanceStorageKey, {});
    this._write(this.interactionsStorageKey, []);
  }
}

window.SimpleAnalytics = SimpleAnalytics;
