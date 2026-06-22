/**
 * 扩展 API 路由模块 — R86 ~ R90
 * 搜索、分页、统计、批量查询、收藏
 *
 * NOTE: 此文件不修改 server.js，由其他 agent 在 server.js 中挂载。
 *       本文件导出 router，挂载方式示例：
 *       const cardsExtra = require('./routes/cards-extra');
 *       app.use('/api', cardsExtra);
 */

const express = require('express');
const path = require('path');
const router = express.Router();

// 加载卡片数据
const cards = require(path.join(__dirname, '..', 'data', 'cards.json'));

// ============================================================
// 工具函数
// ============================================================

/**
 * 统一成功响应
 */
function ok(res, data, statusCode) {
  const status = statusCode || 200;
  return res.status(status).json({ success: true, data });
}

/**
 * 统一错误响应
 */
function fail(res, message, statusCode) {
  const status = statusCode || 400;
  return res.status(status).json({ success: false, message });
}

/**
 * 将字符串安全转为正则，防止特殊字符导致的异常
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 计算搜索相关度评分（简单策略）
 *  - 标题精确匹配   +40
 *  - 标题包含       +30
 *  - 标签精确匹配   +20（每个标签）
 *  - 描述包含       +10
 */
function relevanceScore(card, keyword) {
  const kw = keyword.toLowerCase();
  let score = 0;

  // 标题匹配
  if (card.title.toLowerCase() === kw || (card.titleEn && card.titleEn.toLowerCase() === kw)) {
    score += 40;
  } else if (card.title.toLowerCase().includes(kw) || (card.titleEn && card.titleEn.toLowerCase().includes(kw))) {
    score += 30;
  }

  // 标签匹配
  if (Array.isArray(card.tags)) {
    card.tags.forEach(tag => {
      if (tag.toLowerCase() === kw) score += 20;
      else if (tag.toLowerCase().includes(kw)) score += 10;
    });
  }

  // 描述匹配
  if (card.desc && card.desc.toLowerCase().includes(kw)) {
    score += 10;
  }

  return score;
}

// ============================================================
// R86 — Search API
// ============================================================

/**
 * GET /search?q=keyword
 * 按关键词搜索卡片（标题、描述、标签）
 * 返回结果按相关度降序排列
 */
router.get('/search', (req, res) => {
  const q = (req.query.q || '').trim();

  if (!q) {
    return fail(res, '缺少搜索关键词 q', 400);
  }

  const keyword = q.toLowerCase();

  const results = cards
    .map(card => ({ card, score: relevanceScore(card, keyword) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => ({ ...item.card, relevanceScore: item.score }));

  return ok(res, {
    query: q,
    count: results.length,
    data: results
  });
});

/**
 * GET /categories
 * 返回所有分类及对应的卡片数量
 */
router.get('/categories', (_req, res) => {
  const map = {};

  cards.forEach(card => {
    const cat = card.category || '未分类';
    if (!map[cat]) {
      map[cat] = { name: cat, count: 0 };
    }
    map[cat].count += 1;
  });

  const categories = Object.values(map).sort((a, b) => b.count - a.count);

  return ok(res, {
    count: categories.length,
    data: categories
  });
});

/**
 * GET /tags
 * 返回所有标签及使用次数
 */
router.get('/tags', (_req, res) => {
  const map = {};

  cards.forEach(card => {
    if (Array.isArray(card.tags)) {
      card.tags.forEach(tag => {
        if (!map[tag]) {
          map[tag] = { name: tag, count: 0 };
        }
        map[tag].count += 1;
      });
    }
  });

  const tags = Object.values(map).sort((a, b) => b.count - a.count);

  return ok(res, {
    count: tags.length,
    data: tags
  });
});

/**
 * GET /cards/category/:category
 * 按分类筛选卡片
 */
router.get('/cards/category/:category', (req, res) => {
  const category = decodeURIComponent(req.params.category).trim();

  if (!category) {
    return fail(res, '分类名称不能为空', 400);
  }

  const matched = cards.filter(c => c.category === category);

  return ok(res, {
    category,
    count: matched.length,
    data: matched
  });
});

/**
 * GET /cards/tag/:tag
 * 按标签筛选卡片
 */
router.get('/cards/tag/:tag', (req, res) => {
  const tag = decodeURIComponent(req.params.tag).trim();

  if (!tag) {
    return fail(res, '标签名称不能为空', 400);
  }

  const matched = cards.filter(c => Array.isArray(c.tags) && c.tags.includes(tag));

  return ok(res, {
    tag,
    count: matched.length,
    data: matched
  });
});

// ============================================================
// R87 — Pagination API
// ============================================================

/**
 * GET /cards?page=1&limit=10&sort=title
 * 分页卡片列表
 * 支持排序字段: title, id, category, sortWeight
 */
router.get('/cards', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const sortField = req.query.sort || 'id';

  const allowedSortFields = ['title', 'id', 'category', 'sortWeight'];
  if (!allowedSortFields.includes(sortField)) {
    return fail(res, `不支持的排序字段 "${sortField}"，可选: ${allowedSortFields.join(', ')}`, 400);
  }

  // 排序
  const sorted = [...cards].sort((a, b) => {
    const va = a[sortField];
    const vb = b[sortField];

    if (typeof va === 'number' && typeof vb === 'number') {
      return va - vb;
    }

    return String(va || '').localeCompare(String(vb || ''), 'zh');
  });

  const total = sorted.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = sorted.slice(start, start + limit);

  return ok(res, {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
});

// ============================================================
// R88 — Stats API
// ============================================================

/**
 * GET /stats
 * 返回卡片集合的聚合统计信息
 */
router.get('/stats', (_req, res) => {
  const totalCards = cards.length;

  // 分类分布
  const categoriesDistribution = {};
  cards.forEach(card => {
    const cat = card.category || '未分类';
    categoriesDistribution[cat] = (categoriesDistribution[cat] || 0) + 1;
  });

  // 标签分布
  const tagsDistribution = {};
  cards.forEach(card => {
    if (Array.isArray(card.tags)) {
      card.tags.forEach(tag => {
        tagsDistribution[tag] = (tagsDistribution[tag] || 0) + 1;
      });
    }
  });

  // 平均描述长度
  const totalDescLength = cards.reduce((sum, c) => sum + (c.desc ? c.desc.length : 0), 0);
  const avgDescriptionLength = totalCards > 0 ? +(totalDescLength / totalCards).toFixed(1) : 0;

  return ok(res, {
    totalCards,
    categoriesDistribution,
    tagsDistribution,
    avgDescriptionLength
  });
});

// ============================================================
// R89 — Batch API
// ============================================================

/**
 * POST /cards/batch
 * 批量获取卡片
 * Body: { ids: [1, 2, 3] }
 * 校验: ids 必须为正整数数组，最多 50 条
 */
router.post('/cards/batch', (req, res) => {
  const { ids } = req.body || {};

  if (!Array.isArray(ids)) {
    return fail(res, 'ids 必须为数组', 400);
  }

  if (ids.length === 0) {
    return fail(res, 'ids 不能为空', 400);
  }

  if (ids.length > 50) {
    return fail(res, '单次批量查询最多 50 条', 400);
  }

  // 校验每个 id 是否为正整数
  const invalidIds = ids.filter(id => !Number.isInteger(id) || id < 1);
  if (invalidIds.length > 0) {
    return fail(res, `无效的 ID: ${invalidIds.join(', ')}，所有 ID 必须为正整数`, 400);
  }

  const idSet = new Set(ids);
  const matched = cards.filter(c => idSet.has(c.id));
  const foundIds = new Set(matched.map(c => c.id));
  const notFoundIds = ids.filter(id => !foundIds.has(id));

  return ok(res, {
    count: matched.length,
    data: matched,
    ...(notFoundIds.length > 0 ? { notFoundIds } : {})
  });
});

// ============================================================
// R90 — Favorites API
// ============================================================

/**
 * GET /favorites?ids=1,2,3
 * 通过逗号分隔的 ID 列表获取收藏的卡片
 * 仅返回列表中实际存在的卡片
 */
router.get('/favorites', (req, res) => {
  const raw = (req.query.ids || '').trim();

  if (!raw) {
    return fail(res, '缺少收藏 ID 列表 ids', 400);
  }

  const parts = raw.split(',');

  const validIds = [];
  const invalidIds = [];

  parts.forEach(part => {
    const id = parseInt(part.trim(), 10);
    if (isNaN(id) || !Number.isInteger(id) || id < 1) {
      invalidIds.push(part.trim());
    } else {
      validIds.push(id);
    }
  });

  if (validIds.length === 0) {
    return fail(res, 'ids 中没有有效的 ID', 400);
  }

  const idSet = new Set(validIds);
  const matched = cards.filter(c => idSet.has(c.id));
  const foundIds = new Set(matched.map(c => c.id));
  const missingIds = validIds.filter(id => !foundIds.has(id));

  return ok(res, {
    count: matched.length,
    data: matched,
    ...(invalidIds.length > 0 ? { invalidIds } : {}),
    ...(missingIds.length > 0 ? { missingIds } : {})
  });
});

/**
 * POST /validate-favorites
 * 验证收藏 ID 列表，分别返回有效 ID 和无效 ID
 * Body: { ids: [1, 2, 3, -1, "abc"] }
 */
router.post('/validate-favorites', (req, res) => {
  const { ids } = req.body || {};

  if (!Array.isArray(ids)) {
    return fail(res, 'ids 必须为数组', 400);
  }

  if (ids.length === 0) {
    return fail(res, 'ids 不能为空', 400);
  }

  const validIds = [];
  const invalidIds = [];

  ids.forEach(item => {
    if (Number.isInteger(item) && item >= 1) {
      validIds.push(item);
    } else {
      invalidIds.push(item);
    }
  });

  // 检查有效 ID 中哪些在卡片数据中不存在
  const idSet = new Set(validIds);
  const existingIds = new Set(cards.filter(c => idSet.has(c.id)).map(c => c.id));
  const validExisting = validIds.filter(id => existingIds.has(id));
  const validNotFound = validIds.filter(id => !existingIds.has(id));

  return ok(res, {
    validIds: validExisting,
    invalidIds: invalidIds.length > 0 ? invalidIds : undefined,
    validNotFound: validNotFound.length > 0 ? validNotFound : undefined
  });
});

// ============================================================
// v1.15.0 — POST /favorites
// ============================================================

/**
 * POST /favorites
 * v1.15.0: Alternative to GET /favorites — accepts JSON body
 * Body: { ids: [1, 2, 3] }
 * Returns favorite cards matching the provided IDs
 */
router.post('/favorites', (req, res) => {
  const { ids } = req.body || {};

  if (!Array.isArray(ids)) {
    return fail(res, 'ids 必须为数组', 400);
  }

  if (ids.length === 0) {
    return fail(res, 'ids 不能为空', 400);
  }

  const validIds = [];
  const invalidIds = [];

  ids.forEach(item => {
    if (Number.isInteger(item) && item >= 1) {
      validIds.push(item);
    } else {
      invalidIds.push(item);
    }
  });

  if (validIds.length === 0) {
    return fail(res, 'ids 中没有有效的 ID', 400);
  }

  const idSet = new Set(validIds);
  const matched = cards.filter(c => idSet.has(c.id));
  const foundIds = new Set(matched.map(c => c.id));
  const missingIds = validIds.filter(id => !foundIds.has(id));

  return ok(res, {
    count: matched.length,
    data: matched,
    ...(invalidIds.length > 0 ? { invalidIds } : {}),
    ...(missingIds.length > 0 ? { missingIds } : {})
  });
});

// ============================================================
// 导出
// ============================================================
module.exports = router;
