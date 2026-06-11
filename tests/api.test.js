import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

let server;
let baseUrl;

function fetchJson(path) {
  return new Promise((resolve, reject) => {
    http.get(`${baseUrl}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

beforeAll(async () => {
  const app = require('../server.js');
  return new Promise((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://localhost:${server.address().port}`;
      resolve();
    });
  });
});

afterAll(() => {
  if (server) server.close();
});

describe('API Health', () => {
  it('GET /api/health returns ok', async () => {
    const { status, body } = await fetchJson('/api/health');
    expect(status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body).toHaveProperty('uptime');
    expect(body).toHaveProperty('timestamp');
  });
});

describe('API Cards', () => {
  it('GET /api/cards returns all cards', async () => {
    const { status, body } = await fetchJson('/api/cards');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.count).toBeGreaterThan(0);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('GET /api/cards/:id returns single card', async () => {
    const { status, body } = await fetchJson('/api/cards/1');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(1);
  });

  it('GET /api/cards/:id returns 400 for invalid id', async () => {
    const { status, body } = await fetchJson('/api/cards/abc');
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('GET /api/cards/:id returns 404 for non-existent card', async () => {
    const { status, body } = await fetchJson('/api/cards/99999');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

describe('API Search', () => {
  it('GET /api/search?q=安静 returns results', async () => {
    const { status, body } = await fetchJson('/api/search?q=%E5%AE%89%E9%9D%99');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.count).toBeGreaterThan(0);
  });

  it('GET /api/search without q returns 400', async () => {
    const { status, body } = await fetchJson('/api/search');
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });
});

describe('API Categories & Tags', () => {
  it('GET /api/categories returns categories', async () => {
    const { status, body } = await fetchJson('/api/categories');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.count).toBeGreaterThanOrEqual(4);
  });

  it('GET /api/tags returns tags', async () => {
    const { status, body } = await fetchJson('/api/tags');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.count).toBeGreaterThan(0);
  });
});

describe('API Stats', () => {
  it('GET /api/stats returns aggregate data', async () => {
    const { status, body } = await fetchJson('/api/stats');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totalCards).toBeGreaterThan(0);
    expect(body.data).toHaveProperty('categoriesDistribution');
    expect(body.data).toHaveProperty('tagsDistribution');
  });
});
