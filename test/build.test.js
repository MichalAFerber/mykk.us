import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteRoot = resolve(__dirname, '..');

function read(name) {
  return readFileSync(resolve(siteRoot, name), 'utf8');
}

describe('Static site — required files', () => {
  const requiredFiles = [
    'index.html',
    'privacy.html',
    'terms.html',
    'support.html',
    'docs.html',
    'roadmap.html',
    'changelog.html',
    'thank-you.html',
    'styles.css',
    'script.js',
    'robots.txt',
    'sitemap.xml',
    'favicon.svg',
  ];

  it.each(requiredFiles)('%s exists', (name) => {
    expect(existsSync(resolve(siteRoot, name))).toBe(true);
  });
});

describe('script.js', () => {
  it('parses as valid JavaScript', () => {
    expect(() =>
      execSync('node --check script.js', { cwd: siteRoot, stdio: 'pipe' })
    ).not.toThrow();
  });

  it('points the Stripe checkout flow at api.mykk.us', () => {
    expect(read('script.js')).toContain('api.mykk.us/api/checkout/create-session');
  });
});

describe('index.html', () => {
  it('declares a canonical URL', () => {
    expect(read('index.html')).toMatch(/<link\s+rel="canonical"\s+href="https:\/\/mykk\.us\/"/);
  });

  it('links to the privacy policy (Google OAuth verifier requirement)', () => {
    // Either path or absolute URL is acceptable.
    const html = read('index.html');
    expect(html).toMatch(/href="(?:\/privacy|https:\/\/mykk\.us\/privacy)/);
  });

  it('links to the terms of service', () => {
    expect(read('index.html')).toMatch(/href="(?:\/terms|https:\/\/mykk\.us\/terms)/);
  });

  it('links to the Chrome Web Store listing', () => {
    expect(read('index.html')).toContain(
      'chrome.google.com/webstore/detail/ipeboldhljgjleidbklaanchekkdnjlo'
    );
  });

  it('links to the Cloud Dashboard at start.mykk.us', () => {
    expect(read('index.html')).toContain('https://start.mykk.us');
  });
});

describe('privacy.html', () => {
  it('mentions privacy / data handling', () => {
    const html = read('privacy.html').toLowerCase();
    expect(html).toMatch(/privacy|data|collect/);
  });
});

describe('terms.html', () => {
  it('renders an h1 heading', () => {
    expect(read('terms.html')).toMatch(/<h1[^>]*>/i);
  });
});

describe('robots.txt', () => {
  it('allows all crawlers and references the sitemap', () => {
    const txt = read('robots.txt');
    expect(txt).toMatch(/User-agent:\s*\*/i);
    expect(txt).toMatch(/Allow:\s*\//i);
    expect(txt).toContain('https://mykk.us/sitemap.xml');
  });
});

describe('sitemap.xml', () => {
  it('lists the homepage and the privacy page', () => {
    const xml = read('sitemap.xml');
    expect(xml).toContain('<loc>https://mykk.us/</loc>');
    expect(xml).toMatch(/<loc>https:\/\/mykk\.us\/privacy<\/loc>/);
  });
});
