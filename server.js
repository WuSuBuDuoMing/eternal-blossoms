/**
 * 永恒花海 · 花海记忆 — Express 服务器
 * 提供静态文件服务和卡片数据 API
 */

const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');
const cardsExtra = require('./routes/cards-extra');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3002;
const IS_PROD = process.env.NODE_ENV === 'production';

// v1.16.0: Request body size limit — configurable via env
const BODY_LIMIT = process.env.BODY_LIMIT || '10mb';

// ============================================================
// 中间件
// ============================================================
// ------------------------------------------------------------
// R1: 安全头中间件
// ------------------------------------------------------------
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// ------------------------------------------------------------
// R2: 请求日志中间件
// ------------------------------------------------------------
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const elapsed = Date.now() - start;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    console.log(`[${now}] ${req.method} ${req.originalUrl} ${res.statusCode} ${elapsed}ms`);
  });
  next();
});

app.use(express.json({ limit: BODY_LIMIT })); // configurable limit for photo uploads

// CORS 支持（可通过 CORS_ORIGIN 环境变量控制）
app.use((req, res, next) => {
  const origin = process.env.CORS_ORIGIN || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// v1.15.0: Performance — HSTS header for production
if (IS_PROD) {
  app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });
}

// v1.12.0: Compression for text-based responses
// Only in production to avoid interfering with dev tools
if (IS_PROD) {
  try {
    const compression = require('compression');
    app.use(compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      },
      threshold: 256, // Only compress responses > 256 bytes
    }));
  } catch (_) {
    // compression not installed — gracefully skip
  }
}

// ============================================================
// 路由
// ============================================================

// API 路由
app.use('/api', apiRoutes);
app.use('/api', cardsExtra);
app.use('/api', uploadRoutes);

// 静态文件服务 — public 目录
// 生产环境: 启用 ETag + 长缓存（配合 Service Worker 版本化更新）
// 开发环境: 禁用缓存便于调试
app.use(express.static(path.join(__dirname, 'public'), {
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      // HTML: no-cache to ensure fresh navigation
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      // JS/CSS: long cache with revalidation (SW handles versioning)
      res.set('Cache-Control', IS_PROD
        ? 'public, max-age=31536000, immutable'
        : 'no-cache');
    } else if (/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(filePath)) {
      // Images: long cache
      res.set('Cache-Control', IS_PROD
        ? 'public, max-age=2592000'
        : 'no-cache');
    } else if (filePath.endsWith('.json')) {
      // JSON: moderate cache
      res.set('Cache-Control', 'public, max-age=300');
    }
  }
}));

// SPA 回退 — 所有非 API 请求返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ------------------------------------------------------------
// R3: 全局错误处理中间件
// ------------------------------------------------------------
app.use((err, req, res, _next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl} —`, err.message || err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : (err.message || '服务器内部错误'),
  });
});

// ============================================================
// 启动服务
// ============================================================
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════════╗');
    console.log('  ║                                          ║');
    console.log('  ║     🌸 永恒花海 · 花海记忆 🌸            ║');
    console.log('  ║     ETERNAL BLOSSOMS — HUA HAI JI YI     ║');
    console.log('  ║                                          ║');
    console.log(`  ║     http://localhost:${PORT}               ║`);
    console.log('  ║                                          ║');
    console.log('  ╚══════════════════════════════════════════╝');
    console.log('');
  });
}

module.exports = app;
