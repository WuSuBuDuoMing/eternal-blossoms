/**
 * API 路由模块
 * 提供卡片数据的 RESTful API
 */

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const path = require('path');

// 加载卡片数据
const cards = require(path.join(__dirname, '..', 'data', 'cards.json'));

/**
 * 生成简单哈希值用于 ETag
 * @param {string} data - 需要哈希的字符串
 * @returns {string} MD5 哈希值
 */
function generateETag(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * 发送带 ETag 的 JSON 响应
 * 如果客户端发送了 If-None-Match 且匹配，则返回 304
 * @param {object} req - 请求对象
 * @param {object} res - 响应对象
 * @param {object} payload - 响应数据
 */
function sendWithETag(req, res, payload) {
  const jsonStr = JSON.stringify(payload);
  const hash = generateETag(jsonStr);
  const etagValue = '"' + hash + '"';

  res.set('ETag', etagValue);

  if (req.headers['if-none-match'] === etagValue) {
    return res.status(304).end();
  }

  res.json(payload);
}

/**
 * GET /api/health
 * 健康检查端点
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/cards
 * 获取所有卡片数据
 * Cache-Control: public, max-age=300 (5 分钟缓存)
 */
router.get('/cards', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300');

  sendWithETag(req, res, {
    success: true,
    count: cards.length,
    data: cards
  });
});

/**
 * GET /api/cards/:id
 * 获取单张卡片详情
 * Cache-Control: public, max-age=600 (10 分钟缓存)
 */
router.get('/cards/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id) || !Number.isInteger(id) || id < 1) {
    return res.status(400).json({
      success: false,
      message: '无效的卡片 ID'
    });
  }

  const card = cards.find(c => c.id === id);

  if (!card) {
    return res.status(404).json({
      success: false,
      message: '卡片不存在'
    });
  }

  res.set('Cache-Control', 'public, max-age=600');

  sendWithETag(req, res, {
    success: true,
    data: card
  });
});

module.exports = router;
