/**
 * 永恒花海 · 花海记忆 — Express 服务器
 * 提供静态文件服务和卡片数据 API
 */

const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3002;

// ============================================================
// 中间件
// ============================================================
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

// 静态文件服务 — public 目录
app.use(express.static(path.join(__dirname, 'public')));

// SPA 回退 — 所有非 API 请求返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
