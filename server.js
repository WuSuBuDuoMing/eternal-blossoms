/**
 * 永恒花海 · 花海记忆 — Express 服务器
 * 提供静态文件服务和卡片数据 API
 */

const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');
const cardsExtra = require('./routes/cards-extra');

const app = express();
const PORT = process.env.PORT || 3002;

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

app.use(express.json({ limit: '1mb' }));

// CORS 支持（可通过 CORS_ORIGIN 环境变量控制）
app.use((req, res, next) => {
  const origin = process.env.CORS_ORIGIN || '*';
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// ============================================================
// 路由
// ============================================================

// API 路由
app.use('/api', apiRoutes);
app.use('/api', cardsExtra);

// 静态文件服务 — public 目录
app.use(express.static(path.join(__dirname, 'public')));

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
