/**
 * ============================================================
 * R56 — Search Engine: CardSearch full-text search class
 * R57 — Category Filter: category/tag filtering
 * R58 — Search UI: overlay panel with glassmorphism
 * R59 — Recent Searches: localStorage-backed search history
 * R60 — Sort Options: relevance, category, title, sortWeight
 * ============================================================
 *
 * Usage:
 *   const search = new CardSearch(cardsData);
 *   const results = search.search('花');
 *   search.createSearchUI();
 */

class CardSearch {

  // ==========================================================
  // R56: Constructor & Index
  // ==========================================================

  /**
   * @param {Array} cardsData — Array of card objects from the API
   */
  constructor(cardsData) {
    this.cards = Array.isArray(cardsData) ? cardsData : [];
    this.index = {};          // inverted index  term -> Set<cardId>
    this.cardMap = new Map(); // id -> card
    this._recentKey = 'eb_recent_searches';
    this._maxRecent = 5;

    // DOM references (created by createSearchUI)
    this._panel = null;
    this._input = null;
    this._resultsList = null;
    this._filterChips = null;
    this._recentContainer = null;

    // Active filters
    this._activeCategory = 'all';
    this._activeTag = null;

    this.buildIndex(this.cards);
  }

  /**
   * Build an inverted index from all searchable fields.
   * Each token is lowercased; supports both Chinese characters and
   * English words.
   */
  buildIndex(cards) {
    this.index = {};
    this.cardMap.clear();

    const fields = ['title', 'titleEn', 'desc', 'category', 'tags'];

    cards.forEach(card => {
      this.cardMap.set(card.id, card);

      fields.forEach(field => {
        let value = card[field];

        // tags may be an array
        if (Array.isArray(value)) {
          value = value.join(' ');
        }

        if (!value || typeof value !== 'string') return;

        const tokens = this._tokenize(value);
        tokens.forEach(term => {
          if (!this.index[term]) {
            this.index[term] = new Set();
          }
          this.index[term].add(card.id);
        });
      });
    });
  }

  /**
   * Tokenize text into searchable terms.
   * - English: split on whitespace/punctuation, lowercase
   * - Chinese: emit each character as a token, plus bigrams
   */
  _tokenize(text) {
    if (!text) return [];
    const tokens = [];
    const lower = text.toLowerCase();

    // English words (sequences of ascii letters/digits)
    const englishWords = lower.match(/[a-z0-9]+/g);
    if (englishWords) {
      englishWords.forEach(w => {
        if (w.length >= 1) tokens.push(w);
      });
    }

    // Chinese characters — individual + bigrams for better matching
    const cjkChars = lower.match(/[一-鿿㐀-䶿]/g);
    if (cjkChars) {
      cjkChars.forEach(ch => tokens.push(ch));
      for (let i = 0; i < cjkChars.length - 1; i++) {
        tokens.push(cjkChars[i] + cjkChars[i + 1]);
      }
    }

    return tokens;
  }

  // ==========================================================
  // R56: Search
  // ==========================================================

  /**
   * Full-text search across all indexed fields.
   * Returns an array of { card, score } objects sorted by relevance.
   *
   * @param {string} query
   * @returns {Array<{ card: object, score: number }>}
   */
  search(query) {
    if (!query || !query.trim()) return [];

    const q = query.trim();
    const queryTokens = this._tokenize(q);

    // Score accumulator: cardId -> score
    const scores = {};

    // --- Exact substring match boost ---
    const lowerQuery = q.toLowerCase();

    this.cardMap.forEach((card, id) => {
      let score = 0;

      // Check each searchable field
      ['title', 'titleEn', 'desc', 'category', 'tags'].forEach(field => {
        let value = card[field];
        if (Array.isArray(value)) value = value.join(' ');
        if (!value || typeof value !== 'string') return;

        const lowerVal = value.toLowerCase();

        // Exact substring match — high score
        if (lowerVal.includes(lowerQuery)) {
          score += 50;
        }

        // Field-specific boosts
        if (field === 'title' || field === 'titleEn') {
          if (lowerVal.includes(lowerQuery)) score += 30;
        }
        if (field === 'tags' || field === 'category') {
          if (lowerVal.includes(lowerQuery)) score += 20;
        }
      });

      // Token-based inverted index scoring
      queryTokens.forEach(term => {
        if (this.index[term] && this.index[term].has(id)) {
          score += 10;
        }

        // Fuzzy: check if any indexed term fuzzy-matches this query token
        const fuzzyMatches = this._fuzzySearchTerm(term);
        fuzzyMatches.forEach(matchId => {
          if (matchId === id) {
            score += 5;
          }
        });
      });

      if (score > 0) {
        scores[id] = (scores[id] || 0) + score;
      }
    });

    // Convert to sorted array
    const results = Object.entries(scores)
      .map(([id, score]) => ({
        card: this.cardMap.get(Number(id)),
        score,
      }))
      .filter(r => r.card)
      .sort((a, b) => b.score - a.score);

    return results;
  }

  /**
   * Fuzzy matching that allows 1 character difference (edit distance 1).
   * Returns array of card IDs whose indexed terms fuzzy-match the query term.
   *
   * @param {string} queryTerm
   * @returns {number[]}
   */
  fuzzyMatch(queryTerm, text) {
    if (!queryTerm || !text) return false;
    const lowerQuery = queryTerm.toLowerCase();
    const lowerText = text.toLowerCase();

    if (lowerText.includes(lowerQuery)) return true;

    // Levenshtein distance <= 1 check
    return this._editDistance(lowerQuery, lowerText) <= 1;
  }

  /**
   * Find all indexed terms that fuzzy-match the given term.
   * Returns array of card IDs linked to those terms.
   */
  _fuzzySearchTerm(term) {
    const ids = new Set();
    const indexedTerms = Object.keys(this.index);

    for (let i = 0; i < indexedTerms.length; i++) {
      const indexed = indexedTerms[i];
      // Quick length check — only compare if lengths differ by at most 1
      if (Math.abs(indexed.length - term.length) > 1) continue;
      if (this._editDistance(indexed, term) <= 1) {
        this.index[indexed].forEach(id => ids.add(id));
      }
    }

    return Array.from(ids);
  }

  /**
   * Compute Levenshtein edit distance (for short strings only).
   */
  _editDistance(a, b) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > 1) return 2; // early exit

    const lenA = a.length;
    const lenB = b.length;

    // Only need two rows
    let prev = new Array(lenB + 1);
    let curr = new Array(lenB + 1);

    for (let j = 0; j <= lenB; j++) prev[j] = j;

    for (let i = 1; i <= lenA; i++) {
      curr[0] = i;
      for (let j = 1; j <= lenB; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(
          prev[j] + 1,       // deletion
          curr[j - 1] + 1,   // insertion
          prev[j - 1] + cost  // substitution
        );
      }
      [prev, curr] = [curr, prev];
    }

    return prev[lenB];
  }

  // ==========================================================
  // R57: Category Filter
  // ==========================================================

  /**
   * Get unique categories with counts.
   * @returns {Array<{ category: string, count: number }>}
   */
  getCategories() {
    const map = {};
    this.cards.forEach(card => {
      const cat = card.category || 'uncategorized';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Filter cards by category.
   * @param {string} category — category name, or 'all'
   * @returns {Array<object>}
   */
  filterByCategory(category) {
    if (!category || category === 'all') return this.cards;
    return this.cards.filter(card => card.category === category);
  }

  /**
   * Get all unique tags with usage counts.
   * @returns {Array<{ tag: string, count: number }>}
   */
  getTags() {
    const map = {};
    this.cards.forEach(card => {
      const tags = Array.isArray(card.tags) ? card.tags : [];
      tags.forEach(tag => {
        map[tag] = (map[tag] || 0) + 1;
      });
    });
    return Object.entries(map)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Filter cards that have a specific tag.
   * @param {string} tag
   * @returns {Array<object>}
   */
  filterByTag(tag) {
    if (!tag) return this.cards;
    return this.cards.filter(card => {
      const tags = Array.isArray(card.tags) ? card.tags : [];
      return tags.includes(tag);
    });
  }

  // ==========================================================
  // R60: Sort Options
  // ==========================================================

  /**
   * Sort an array of { card, score } results.
   *
   * @param {Array<{ card: object, score: number }>} results
   * @param {string} sortBy — 'relevance' | 'category' | 'title' | 'sortWeight'
   * @returns {Array<{ card: object, score: number }>}
   */
  sortResults(results, sortBy = 'relevance') {
    const sorted = [...results];

    switch (sortBy) {
      case 'category':
        sorted.sort((a, b) => {
          const catA = (a.card.category || '').localeCompare(b.card.category || '');
          if (catA !== 0) return catA;
          return b.score - a.score; // secondary: relevance
        });
        break;

      case 'title':
        sorted.sort((a, b) => {
          const titleA = (a.card.title || '').localeCompare(b.card.title || '', 'zh');
          if (titleA !== 0) return titleA;
          return b.score - a.score;
        });
        break;

      case 'sortWeight':
        sorted.sort((a, b) => {
          const wA = a.card.sortWeight ?? a.card.id ?? 0;
          const wB = b.card.sortWeight ?? b.card.id ?? 0;
          return wA - wB;
        });
        break;

      case 'relevance':
      default:
        // Already sorted by score descending from search()
        sorted.sort((a, b) => b.score - a.score);
        break;
    }

    return sorted;
  }

  // ==========================================================
  // R58: Search UI
  // ==========================================================

  /**
   * Create the search panel DOM and append to body.
   * Includes: input, filter chips, results list, recent searches.
   */
  createSearchUI() {
    if (this._panel) return; // already created

    // -- Overlay backdrop --
    const overlay = document.createElement('div');
    overlay.className = 'search-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.hideSearchUI();
    });

    // -- Panel --
    const panel = document.createElement('div');
    panel.className = 'search-panel';

    // Header
    const header = document.createElement('div');
    header.className = 'search-header';

    const icon = document.createElement('span');
    icon.className = 'search-header__icon';
    icon.textContent = '⌕'; // ⌕

    const title = document.createElement('span');
    title.className = 'search-header__title';
    title.textContent = 'SEARCH';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'search-close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', '关闭搜索');
    closeBtn.addEventListener('click', () => this.hideSearchUI());

    header.appendChild(icon);
    header.appendChild(title);
    header.appendChild(closeBtn);

    // Input
    const inputWrap = document.createElement('div');
    inputWrap.className = 'search-input-wrap';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'search-input';
    input.placeholder = '搜索卡片... 支持中文和英文';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', '搜索卡片');

    input.addEventListener('input', () => {
      this._onInputChange(input.value);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideSearchUI();
      } else if (e.key === 'Enter') {
        this._saveRecent(input.value);
      }
    });

    inputWrap.appendChild(input);

    // Sort options
    const sortBar = document.createElement('div');
    sortBar.className = 'search-sort-bar';

    const sortLabel = document.createElement('span');
    sortLabel.className = 'search-sort-label';
    sortLabel.textContent = 'SORT';

    const sortOptions = ['relevance', 'title', 'category', 'sortWeight'];
    const sortNames = {
      relevance: '相关度',
      title: '标题',
      category: '分类',
      sortWeight: '权重',
    };

    let currentSort = 'relevance';

    sortOptions.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'search-sort-btn' + (opt === currentSort ? ' active' : '');
      btn.textContent = sortNames[opt];
      btn.dataset.sort = opt;
      btn.addEventListener('click', () => {
        currentSort = opt;
        sortBar.querySelectorAll('.search-sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._onInputChange(input.value);
      });
      sortBar.appendChild(btn);
    });

    sortBar._getCurrentSort = () => currentSort;

    // Filter chips (categories + tags)
    const filterChips = document.createElement('div');
    filterChips.className = 'search-filters';

    // Recent searches
    const recentContainer = document.createElement('div');
    recentContainer.className = 'search-recent';

    // Results
    const resultsList = document.createElement('div');
    resultsList.className = 'search-results';

    // Empty state
    const emptyState = document.createElement('div');
    emptyState.className = 'search-empty';
    emptyState.textContent = '输入关键词开始搜索';
    resultsList.appendChild(emptyState);

    // Assemble
    panel.appendChild(header);
    panel.appendChild(inputWrap);
    panel.appendChild(sortBar);
    panel.appendChild(filterChips);
    panel.appendChild(recentContainer);
    panel.appendChild(resultsList);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // Store refs
    this._panel = overlay;
    this._input = input;
    this._resultsList = resultsList;
    this._filterChips = filterChips;
    this._sortBar = sortBar;
    this._recentContainer = recentContainer;

    // Populate filter chips
    this._populateFilterChips();
  }

  /**
   * Show the search UI with animation.
   */
  showSearchUI() {
    if (!this._panel) this.createSearchUI();

    this._panel.classList.add('visible');
    this._populateFilterChips();
    this._showRecentSearches();

    // Focus input after animation
    requestAnimationFrame(() => {
      if (this._input) this._input.focus();
    });
  }

  /**
   * Hide the search UI with animation.
   */
  hideSearchUI() {
    if (!this._panel) return;
    this._panel.classList.remove('visible');
    if (this._input) this._input.value = '';
  }

  /**
   * Render search results as mini card previews.
   * @param {Array<{ card: object, score: number }>} results
   */
  renderResults(results) {
    if (!this._resultsList) return;

    this._resultsList.innerHTML = '';

    if (!results || results.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'search-empty';
      empty.textContent = '没有找到匹配的卡片';
      this._resultsList.appendChild(empty);
      return;
    }

    results.forEach(({ card, score }) => {
      const item = document.createElement('div');
      item.className = 'search-result-card';
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');

      // Emoji
      const emoji = document.createElement('div');
      emoji.className = 'search-result-card__emoji';
      emoji.textContent = card.emoji || '';

      // Info
      const info = document.createElement('div');
      info.className = 'search-result-card__info';

      const titleZh = document.createElement('div');
      titleZh.className = 'search-result-card__title';
      titleZh.textContent = card.title || '';

      const titleEn = document.createElement('div');
      titleEn.className = 'search-result-card__title-en';
      titleEn.textContent = card.titleEn || '';

      const desc = document.createElement('div');
      desc.className = 'search-result-card__desc';
      desc.textContent = card.desc ? (card.desc.length > 60 ? card.desc.slice(0, 60) + '...' : card.desc) : '';

      // Meta row (category + score)
      const meta = document.createElement('div');
      meta.className = 'search-result-card__meta';

      if (card.category) {
        const catBadge = document.createElement('span');
        catBadge.className = 'search-result-card__category';
        catBadge.textContent = card.category;
        meta.appendChild(catBadge);
      }

      const scoreBadge = document.createElement('span');
      scoreBadge.className = 'search-result-card__score';
      scoreBadge.textContent = score + 'pts';
      meta.appendChild(scoreBadge);

      info.appendChild(titleZh);
      info.appendChild(titleEn);
      info.appendChild(desc);
      info.appendChild(meta);

      // Gradient bar
      const gradientBar = document.createElement('div');
      gradientBar.className = 'search-result-card__gradient';
      if (card.gradient) {
        gradientBar.style.background = card.gradient;
      } else if (card.color) {
        gradientBar.style.background = card.color;
      }

      item.appendChild(emoji);
      item.appendChild(info);
      item.appendChild(gradientBar);

      // Click to open card detail
      item.addEventListener('click', () => {
        this.hideSearchUI();
        // Emit a custom event so the app can handle it
        window.dispatchEvent(new CustomEvent('searchCardSelect', {
          detail: { card },
        }));
      });

      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          item.click();
        }
      });

      this._resultsList.appendChild(item);
    });
  }

  // ==========================================================
  // R58: Private UI helpers
  // ==========================================================

  _onInputChange(value) {
    if (!value || !value.trim()) {
      this._showRecentSearches();
      this.renderResults([]);
      return;
    }

    let results = this.search(value);

    // Apply category filter
    if (this._activeCategory && this._activeCategory !== 'all') {
      results = results.filter(r => r.card.category === this._activeCategory);
    }

    // Apply tag filter
    if (this._activeTag) {
      results = results.filter(r => {
        const tags = Array.isArray(r.card.tags) ? r.card.tags : [];
        return tags.includes(this._activeTag);
      });
    }

    // Apply sort
    const sortFn = this._sortBar ? this._sortBar._getCurrentSort() : 'relevance';
    results = this.sortResults(results, sortFn);

    this.renderResults(results);
  }

  /**
   * Populate the filter chips bar with categories and tags.
   */
  _populateFilterChips() {
    if (!this._filterChips) return;
    this._filterChips.innerHTML = '';

    // "All" chip
    const allChip = this._createChip('全部', 'all');
    allChip.classList.add('active');
    this._filterChips.appendChild(allChip);

    // Category chips
    const categories = this.getCategories();
    categories.forEach(({ category, count }) => {
      const chip = this._createChip(category + ' (' + count + ')', 'cat:' + category);
      this._filterChips.appendChild(chip);
    });

    // Tag chips (top 10)
    const tags = this.getTags().slice(0, 10);
    tags.forEach(({ tag, count }) => {
      const chip = this._createChip('#' + tag, 'tag:' + tag);
      chip.classList.add('search-chip--tag');
      this._filterChips.appendChild(chip);
    });
  }

  _createChip(label, value) {
    const chip = document.createElement('button');
    chip.className = 'search-chip';
    chip.textContent = label;
    chip.dataset.value = value;

    chip.addEventListener('click', () => {
      // Toggle active state
      this._filterChips.querySelectorAll('.search-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      if (value === 'all') {
        this._activeCategory = 'all';
        this._activeTag = null;
      } else if (value.startsWith('cat:')) {
        this._activeCategory = value.slice(4);
        this._activeTag = null;
      } else if (value.startsWith('tag:')) {
        this._activeTag = value.slice(4);
        // Keep category as-is
      }

      this._onInputChange(this._input ? this._input.value : '');
    });

    return chip;
  }

  // ==========================================================
  // R59: Recent Searches
  // ==========================================================

  /**
   * Get recent searches from localStorage.
   * @returns {string[]}
   */
  getRecentSearches() {
    try {
      const raw = localStorage.getItem(this._recentKey);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr.slice(0, this._maxRecent) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save a search query to recent history (prepend, dedupe, cap at 5).
   */
  _saveRecent(query) {
    if (!query || !query.trim()) return;
    const q = query.trim();
    let recent = this.getRecentSearches();
    recent = recent.filter(r => r.toLowerCase() !== q.toLowerCase());
    recent.unshift(q);
    recent = recent.slice(0, this._maxRecent);
    try {
      localStorage.setItem(this._recentKey, JSON.stringify(recent));
    } catch { /* quota exceeded — ignore */ }
  }

  /**
   * Clear all recent searches.
   */
  clearRecentSearches() {
    try {
      localStorage.removeItem(this._recentKey);
    } catch { /* ignore */ }
    this._showRecentSearches();
  }

  /**
   * Show recent searches in the panel (or hide section if empty).
   */
  _showRecentSearches() {
    if (!this._recentContainer) return;
    this._recentContainer.innerHTML = '';

    const recent = this.getRecentSearches();
    if (recent.length === 0) {
      this._recentContainer.style.display = 'none';
      return;
    }

    this._recentContainer.style.display = '';

    const headerRow = document.createElement('div');
    headerRow.className = 'search-recent__header';

    const label = document.createElement('span');
    label.className = 'search-recent__label';
    label.textContent = 'RECENT';

    const clearBtn = document.createElement('button');
    clearBtn.className = 'search-recent__clear';
    clearBtn.textContent = 'CLEAR';
    clearBtn.addEventListener('click', () => this.clearRecentSearches());

    headerRow.appendChild(label);
    headerRow.appendChild(clearBtn);
    this._recentContainer.appendChild(headerRow);

    const list = document.createElement('div');
    list.className = 'search-recent__list';

    recent.forEach(query => {
      const item = document.createElement('button');
      item.className = 'search-recent__item';
      item.textContent = query;
      item.addEventListener('click', () => {
        if (this._input) {
          this._input.value = query;
          this._input.focus();
          this._onInputChange(query);
        }
      });
      list.appendChild(item);
    });

    this._recentContainer.appendChild(list);
  }
}

// ============================================================
// Export
// ============================================================
window.CardSearch = CardSearch;
