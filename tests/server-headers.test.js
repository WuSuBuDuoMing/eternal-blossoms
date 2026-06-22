import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { createRequire } from 'module';

/**
 * server-headers.test.js — Server response headers and caching tests
 * v1.14.0: Comprehensive server header validation
 */

const require = createRequire(import.meta.url);

let server;
let baseUrl;

function fetchRaw(path) {
  return new Promise((resolve, reject) => {
    http.get(`${baseUrl}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    }).on('error', reject);
  });
}

function fetchJson(path) {
  return fetchRaw(path).then(res => ({
    ...res,
    body: (() => { try { return JSON.parse(res.body); } catch { return res.body; } })()
  }));
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

describe('Security Headers', () => {
  it('includes X-Content-Type-Options', async () => {
    const { headers } = await fetchRaw('/api/health');
    expect(headers['x-content-type-options']).toBe('nosniff');
  });

  it('includes X-Frame-Options', async () => {
    const { headers } = await fetchRaw('/api/health');
    expect(headers['x-frame-options']).toBe('DENY');
  });

  it('includes X-XSS-Protection', async () => {
    const { headers } = await fetchRaw('/api/health');
    expect(headers['x-xss-protection']).toBe('1; mode=block');
  });

  it('includes Referrer-Policy', async () => {
    const { headers } = await fetchRaw('/api/health');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  it('includes Permissions-Policy', async () => {
    const { headers } = await fetchRaw('/api/health');
    expect(headers['permissions-policy']).toBeDefined();
    expect(headers['permissions-policy']).toContain('camera=()');
  });

  it('includes CORS headers', async () => {
    const { headers } = await fetchRaw('/api/health');
    expect(headers['access-control-allow-origin']).toBe('*');
    expect(headers['access-control-allow-methods']).toContain('GET');
  });
});

describe('API Caching Headers', () => {
  it('GET /api/cards has Cache-Control header', async () => {
    const { headers } = await fetchRaw('/api/cards');
    expect(headers['cache-control']).toContain('max-age');
  });

  it('GET /api/cards returns ETag', async () => {
    const { headers } = await fetchRaw('/api/cards');
    expect(headers['etag']).toBeDefined();
    expect(headers['etag'].length).toBeGreaterThan(0);
  });

  it('GET /api/cards/:id returns ETag', async () => {
    const { headers } = await fetchRaw('/api/cards/1');
    expect(headers['etag']).toBeDefined();
  });

  it('GET /api/cards returns 304 on matching If-None-Match', async () => {
    // First request to get the ETag
    const first = await fetchRaw('/api/cards');
    const etag = first.headers['etag'];
    expect(etag).toBeDefined();

    // Second request with If-None-Match
    const second = await new Promise((resolve, reject) => {
      const url = new URL(`${baseUrl}/api/cards`);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'GET',
        headers: { 'If-None-Match': etag },
      };
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      });
      req.on('error', reject);
      req.end();
    });

    expect(second.status).toBe(304);
  });
});

describe('API Health Endpoint', () => {
  it('returns healthy status', async () => {
    const { status, body } = await fetchJson('/api/health');
    expect(status).toBe(200);
    expect(body.status).toBe('ok');
  });

  it('includes uptime in seconds', async () => {
    const { body } = await fetchJson('/api/health');
    expect(body.uptime).toBeDefined();
    expect(typeof body.uptime).toBe('number');
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('includes valid ISO timestamp', async () => {
    const { body } = await fetchJson('/api/health');
    expect(body.timestamp).toBeDefined();
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
  });
});

describe('API Cards Endpoint', () => {
  it('returns a non-empty card array', async () => {
    const { status, body } = await fetchJson('/api/cards');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('count matches data length', async () => {
    const { body } = await fetchJson('/api/cards');
    expect(body.count).toBe(body.data.length);
  });

  it('single card returns expected fields', async () => {
    const { body } = await fetchJson('/api/cards/1');
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('id');
    expect(body.data).toHaveProperty('title');
    expect(body.data).toHaveProperty('titleEn');
    expect(body.data).toHaveProperty('desc');
    expect(body.data).toHaveProperty('emoji');
    expect(body.data).toHaveProperty('gradient');
    expect(body.data).toHaveProperty('color');
    expect(body.data).toHaveProperty('tags');
    expect(body.data).toHaveProperty('category');
  });

  it('returns 400 for non-integer id', async () => {
    const { status, body } = await fetchJson('/api/cards/abc');
    expect(status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('returns 404 for non-existent card', async () => {
    const { status, body } = await fetchJson('/api/cards/99999');
    expect(status).toBe(404);
    expect(body.success).toBe(false);
  });
});

describe('API Stats Endpoint', () => {
  it('returns aggregate data', async () => {
    const { status, body } = await fetchJson('/api/stats');
    expect(status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.totalCards).toBeGreaterThan(0);
    expect(body.data).toHaveProperty('categoriesDistribution');
    expect(body.data).toHaveProperty('tagsDistribution');
    expect(body.data).toHaveProperty('avgDescriptionLength');
  });
});

describe('API Categories and Tags', () => {
  it('returns categories list', async () => {
    const { status, body } = await fetchJson('/api/categories');
    expect(status).toBe(200);
    expect(body.data.count).toBeGreaterThanOrEqual(4);
    expect(body.data.data.length).toBeGreaterThanOrEqual(4);
  });

  it('returns tags list', async () => {
    const { status, body } = await fetchJson('/api/tags');
    expect(status).toBe(200);
    expect(body.data.count).toBeGreaterThan(0);
  });
});
