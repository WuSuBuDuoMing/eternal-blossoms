/**
 * API 路由模块
 * 提供卡片数据的 RESTful API
 */

const express = require('express');
const router = express.Router();
const path = require('path');

// 加载卡片数据
const cards = require(path.join(__dirname, '..', 'data', 'cards.json'));

/**
 * GET /api/cards
 * 获取所有卡片数据
 */
router.get('/cards', (req, res) => {
  res.json({
    success: true,
    count: cards.length,
    data: cards
  });
});

/**
 * GET /api/cards/:id
 * 获取单张卡片详情
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

  res.json({
    success: true,
    data: card
  });
});

module.exports = router;
