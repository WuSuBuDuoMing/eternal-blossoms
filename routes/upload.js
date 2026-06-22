/**
 * 上传路由模块 — 照片上传、列表、删除
 * 提供 /api/upload, /api/photos, /api/photos/:filename 的 RESTful API
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const router = express.Router();

// ============================================================
// 路径常量
// ============================================================
const PHOTOS_DIR = path.join(__dirname, '..', 'public', 'photos');
const CARDS_JSON = path.join(__dirname, '..', 'data', 'cards.json');

// ============================================================
// 工具函数
// ============================================================

/**
 * 读取 cards.json 并解析为数组
 */
function readCards() {
  try {
    const raw = fs.readFileSync(CARDS_JSON, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    // 如果文件不存在或为空，返回空数组
    return [];
  }
}

/**
 * 将卡片数组写回 cards.json（2 空格缩进）
 */
function writeCards(cards) {
  fs.writeFileSync(CARDS_JSON, JSON.stringify(cards, null, 2), 'utf-8');
}

/**
 * 确保 photos 目录存在
 */
function ensurePhotosDir() {
  if (!fs.existsSync(PHOTOS_DIR)) {
    fs.mkdirSync(PHOTOS_DIR, { recursive: true });
  }
}

/**
 * 根据分类自动分配 emoji
 */
function emojiForCategory(category) {
  const map = {
    '日常': '🌸',
    '浪漫': '💕',
    '旅行': '✈️',
    '季节': '🍃',
  };
  return map[category] || '🌺';
}

/**
 * 根据分类自动生成渐变色
 */
function gradientForCategory(category, color) {
  if (color) {
    // 使用传入的颜色生成渐变
    return `linear-gradient(135deg, ${color} 0%, ${color}99 100%)`;
  }
  const defaults = {
    '日常': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    '浪漫': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    '旅行': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    '季节': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  };
  return defaults[category] || 'linear-gradient(135deg, #ff6b9d 0%, #c084fc 100%)';
}

/**
 * 生成安全的文件名
 */
function generateFilename() {
  const ts = Date.now();
  const rand = crypto.randomBytes(4).toString('hex');
  return `card-${ts}-${rand}.jpg`;
}

/**
 * 统一成功响应
 */
function ok(res, data, statusCode) {
  return res.status(statusCode || 200).json({ success: true, data });
}

/**
 * 统一错误响应
 */
function fail(res, message, statusCode) {
  return res.status(statusCode || 400).json({ success: false, message });
}

// ============================================================
// POST /api/upload — 上传照片
// ============================================================
router.post('/upload', (req, res) => {
  try {
    const { title, titleEn, desc, category, tags, image, emoji, color } = req.body;

    // 校验必填字段
    if (!title || !title.trim()) {
      return fail(res, '缺少必填字段: title', 400);
    }
    if (!image || !image.trim()) {
      return fail(res, '缺少必填字段: image', 400);
    }

    // v1.15.0: Validate image size before decoding (prevent OOM)
    if (image.length > 20 * 1024 * 1024) {
      return fail(res, '图片数据过大，最大 15 MB', 413);
    }

    // 确保目录存在
    ensurePhotosDir();

    // 解码 base64 图片
    // 支持 data:image/xxx;base64,... 格式和纯 base64
    let base64Data = image;
    let mimeType = 'image/jpeg';
    const base64Match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (base64Match) {
      mimeType = base64Match[1];
      base64Data = base64Match[2];
    }

    const imageBuffer = Buffer.from(base64Data, 'base64');

    // 生成文件名并保存
    const filename = generateFilename();
    const filepath = path.join(PHOTOS_DIR, filename);
    fs.writeFileSync(filepath, imageBuffer);

    // 获取文件大小
    const stats = fs.statSync(filepath);

    // 生成新卡片
    const cards = readCards();
    const maxId = cards.length > 0 ? Math.max(...cards.map(c => c.id || 0)) : 0;

    const assignedEmoji = emoji || emojiForCategory(category || '日常');
    const assignedGradient = gradientForCategory(category || '日常', color);

    const newCard = {
      id: maxId + 1,
      title: title.trim(),
      titleEn: (titleEn || '').trim().toUpperCase() || title.trim().toUpperCase(),
      desc: (desc || '').trim(),
      emoji: assignedEmoji,
      gradient: assignedGradient,
      color: color || '#ff6b9d',
      category: category || '日常',
      tags: Array.isArray(tags)
        ? tags
        : (typeof tags === 'string'
          ? tags.split(/[,，]/).map(t => t.trim()).filter(Boolean)
          : []),
      image: `/photos/${filename}`,
      sortWeight: 50,
      createdAt: new Date().toISOString(),
    };

    cards.push(newCard);
    writeCards(cards);

    return ok(res, {
      card: newCard,
      savedFile: {
        filename,
        size: stats.size,
        path: `/photos/${filename}`,
      },
    }, 201);

  } catch (err) {
    console.error('[UPLOAD ERROR]', err.message || err);
    return fail(res, '上传失败: ' + (err.message || '未知错误'), 500);
  }
});

// ============================================================
// GET /api/photos — 列出所有已上传的照片
// ============================================================
router.get('/photos', (_req, res) => {
  try {
    ensurePhotosDir();

    const files = fs.readdirSync(PHOTOS_DIR).filter(f => {
      // 排除 .gitkeep 和非图片文件
      if (f === '.gitkeep') return false;
      const ext = path.extname(f).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });

    const photos = files.map(filename => {
      const filepath = path.join(PHOTOS_DIR, filename);
      const stats = fs.statSync(filepath);
      return {
        filename,
        url: `/photos/${filename}`,
        size: stats.size,
        uploadedAt: stats.mtime.toISOString(),
      };
    }).sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return ok(res, {
      count: photos.length,
      data: photos,
    });

  } catch (err) {
    console.error('[PHOTOS LIST ERROR]', err.message || err);
    return fail(res, '获取照片列表失败', 500);
  }
});

// ============================================================
// DELETE /api/photos/:filename — 删除照片
// ============================================================
router.delete('/photos/:filename', (req, res) => {
  try {
    const filename = req.params.filename;

    // 安全校验：防止路径穿越
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return fail(res, '无效的文件名', 400);
    }

    const filepath = path.join(PHOTOS_DIR, filename);

    // 检查文件是否存在
    if (!fs.existsSync(filepath)) {
      return fail(res, '照片不存在', 404);
    }

    // 删除文件
    fs.unlinkSync(filepath);

    // 从 cards.json 中移除对应卡片
    const cards = readCards();
    const filtered = cards.filter(c => c.image !== `/photos/${filename}`);
    writeCards(filtered);

    return ok(res, {
      filename,
      deleted: true,
      removedCards: cards.length - filtered.length,
    });

  } catch (err) {
    console.error('[PHOTO DELETE ERROR]', err.message || err);
    return fail(res, '删除照片失败', 500);
  }
});

// ============================================================
// 导出
// ============================================================
module.exports = router;
