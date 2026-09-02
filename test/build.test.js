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
    'dmca.html',
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

  // WHY THESE ARE HERE. The Chrome Web Store rejected MyKK on 2026-04-23 for a
  // privacy policy that contradicted the code, and the fix at the time wrote in
  // the mechanism the extension used THEN. That mechanism was retired in v1.0.6
  // and the page was not updated, so by v1.1.0 the policy described an API with
  // no call site anywhere in the extension — the same rejection reason, aimed at
  // a different sentence. The assertion above cannot catch that: it passes on
  // any page containing the word "data".
  //
  // These pin the two claims that were false, by name. If the sign-in flow
  // changes again, this test is what makes the policy fail loudly instead of
  // silently going stale until a store reviewer finds it.
  it('does not describe a sign-in mechanism the extension no longer uses', () => {
    const html = read('privacy.html');
    // Retired April 2026. `git grep getAuthToken` in mykk.us-extension: no hits.
    expect(html).not.toMatch(/getAuthToken/i);
    // Chrome's identity API no longer manages any OAuth token for MyKK —
    // launchWebAuthFlow is redirect plumbing, and Google's tokens are held
    // server-side by the Worker.
    expect(html).not.toMatch(/OAuth tokens are managed by Chrome/i);
  });

  it('describes the flow the extension actually uses', () => {
    const html = read('privacy.html');
    // Sign-in happens on the Worker, not in the extension.
    expect(html).toContain('api.mykk.us');
    // The two artefacts that replaced the Google token: a short-lived one-time
    // code, and our own session token.
    expect(html).toMatch(/one-time code/i);
    expect(html).toMatch(/session token/i);
  });

  it('routes contact through the support form, not an email address', () => {
    // Owner ruling, 2026-08-07 — the same rule dmca.html carries. terms.html is
    // a known exception, filed separately rather than changed here.
    const html = read('privacy.html');
    expect(html).not.toMatch(/[a-z0-9._%+-]+@mykk\.us/i);
    expect(html).toContain('href="/support"');
  });

  it('carries a Last updated date', () => {
    expect(read('privacy.html')).toMatch(/<strong>Last updated:<\/strong>/);
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
    expect(txt).toContain('https://mykk.us/sitemap-index.xml');
  });
});

describe('sitemap.xml', () => {
  it('lists the homepage and the privacy page', () => {
    const xml = read('sitemap.xml');
    expect(xml).toContain('<loc>https://mykk.us/</loc>');
    expect(xml).toMatch(/<loc>https:\/\/mykk\.us\/privacy<\/loc>/);
  });
});
