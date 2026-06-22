import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * service-worker.test.js — Service Worker configuration tests
 * v1.14.0: Validate SW cache version, app shell list, and configuration
 */

const swSource = fs.readFileSync(
  path.join(__dirname, '..', 'public', 'sw.js'),
  'utf-8'
);

describe('Service Worker Configuration', () => {
  it('VERSION matches the expected pattern', () => {
    const versionMatch = swSource.match(/const VERSION\s*=\s*'([^']+)'/);
    expect(versionMatch).not.toBeNull();
    const version = versionMatch[1];
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('VERSION is 1.17.0', () => {
    const versionMatch = swSource.match(/const VERSION\s*=\s*'([^']+)'/);
    expect(versionMatch[1]).toBe('1.17.0');
  });

  it('CACHE_NAME includes VERSION', () => {
    expect(swSource).toContain('eternal-blossoms-v${VERSION}');
  });

  it('has runtime cache for API requests', () => {
    expect(swSource).toContain('RUNTIME_CACHE');
    expect(swSource).toContain('eternal-blossoms-runtime');
  });

  it('has image cache for photos', () => {
    expect(swSource).toContain('IMAGE_CACHE');
    expect(swSource).toContain('eternal-blossoms-images');
  });

  it('has cache trimming for runtime cache', () => {
    expect(swSource).toContain('trimCache');
    expect(swSource).toContain('MAX_RUNTIME_ENTRIES');
    expect(swSource).toContain('MAX_IMAGE_ENTRIES');
  });

  it('pre-caches essential app shell files', () => {
    const essentialFiles = [
      '/index.html',
      '/css/style.css',
      '/js/app.js',
      '/js/app-init.js',
      '/js/scene.js',
      '/js/particles.js',
      '/js/layouts.js',
      '/js/ui.js',
      '/js/i18n.js',
      '/js/vendor/three.min.js',
      '/manifest.json',
    ];
    for (const file of essentialFiles) {
      expect(swSource).toContain(`'${file}'`);
    }
  });

  it('handles offline fallback for navigation requests', () => {
    expect(swSource).toContain('OFFLINE_HTML');
    expect(swSource).toContain('离线模式');
    expect(swSource).toContain('mode === \'navigate\'');
  });

  it('has stale-while-revalidate for CSS/JS', () => {
    expect(swSource).toContain('.css');
    expect(swSource).toContain('.js');
  });

  it('skips non-GET requests', () => {
    expect(swSource).toContain('request.method !== \'GET\'');
  });

  it('has message handler for SKIP_WAITING', () => {
    expect(swSource).toContain('SKIP_WAITING');
    expect(swSource).toContain('CLEAR_CACHES');
  });
});

describe('Service Worker Registration', () => {
  const regSource = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'js', 'register-sw.js'),
    'utf-8'
  );

  it('registers the service worker', () => {
    expect(regSource).toContain('navigator.serviceWorker');
    expect(regSource).toContain("register('/sw.js')");
  });

  it('has periodic update checks (v1.12.0)', () => {
    expect(regSource).toContain('setInterval');
    expect(regSource).toContain('registration.update()');
  });

  it('shows update banner on new content (v1.12.0)', () => {
    expect(regSource).toContain('showUpdateBanner');
    expect(regSource).toContain('sw-update-banner');
  });

  it('handles controllerchange for auto-reload', () => {
    expect(regSource).toContain('controllerchange');
    expect(regSource).toContain('window.location.reload');
  });

  it('handles SKIP_WAITING message from update banner', () => {
    expect(regSource).toContain('SKIP_WAITING');
    expect(regSource).toContain('postMessage');
  });
});
