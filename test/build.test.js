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

  // WHY THESE ARE HERE. Same reason as the privacy.html pins below, and the
  // same failure: copy that silently stopped matching the product. This page
  // advertised $12/year while Stripe charged $3 — four times the real price, in
  // two places, one of them the structured data search engines and assistants
  // read. Nothing failed, because nothing checked. A price is the one string on
  // a marketing site that is a factual claim about a charge, so it gets pinned
  // by value rather than by "the page mentions a price".
  describe('Pro pricing matches what Stripe charges', () => {
    const PRO_PRICE = '$3';
    // Retired. `price_1TAlSLB3mV7aPjYRNCqxhdCl` is deactivated in Stripe, and
    // the live price is price_1U9BC1B3mV7aPjYROft17chl at $3/year.
    const RETIRED_PRICE = '$12';

    // The Pro card, as a visitor reads it.
    function proPriceCard(html) {
      return html.match(
        /<span class="price-amount">(\$\d+)<\/span>\s*<span class="price-period">([^<]+)<\/span>/g
      );
    }

    it('shows $3 per year on the Pro card', () => {
      const cards = proPriceCard(read('index.html'));
      // Two priced cards: Free at $0 forever, Pro at $3 per year.
      expect(cards).toHaveLength(2);
      expect(cards[1]).toContain(PRO_PRICE);
      expect(cards[1]).toContain('per year');
    });

    // THE NEGATIVE CONTROL. The assertion above is a claim that a string is
    // present; that is worth nothing unless the same matcher can report the
    // wrong price. This runs it over the page as it actually stood before this
    // change and shows it picks $12 out, so a green run above means the price
    // is right rather than that the matcher is blind.
    it('would have caught the $12 the page used to carry', () => {
      const asItStood = read('index.html').replace(PRO_PRICE, RETIRED_PRICE);
      const cards = proPriceCard(asItStood);
      expect(cards[1]).toContain(RETIRED_PRICE);
      expect(cards[1]).not.toContain(PRO_PRICE);
    });

    it('states the price the same way in the structured data', () => {
      const html = read('index.html');
      const block = html.match(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
      );
      expect(block).not.toBeNull();
      // Parsed, not grepped: this block is hand-edited and a trailing comma
      // makes Google drop the whole thing silently.
      const data = JSON.parse(block[1]);
      const pro = data.offers.find((o) => o.name === 'Pro');
      expect(pro.price).toBe('3');
      expect(pro.priceCurrency).toBe('USD');
      expect(pro.billingIncrement).toBe('P1Y');
    });

    it('states the 30-day trial next to the price, not only at checkout', () => {
      const html = read('index.html');
      // The card captured at checkout is the part a visitor must not discover
      // on the Stripe page.
      expect(html).toMatch(/30-day free trial, card required/i);
      expect(html).toMatch(/cancel any time before day 31/i);
    });

    it('does not advertise the retired price anywhere on the page', () => {
      // changelog.html keeps its $12 line — that entry is history and true of
      // the day it describes. This is about what the page sells today.
      expect(read('index.html')).not.toContain(RETIRED_PRICE);
    });
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

  // THE STORE-SUBMISSION BLOCKERS, pinned so they cannot silently return.
  // Every one of these was a sentence that was false about shipped code, found
  // by review after the page had already been rewritten once. The page is now
  // the thing a Chrome Web Store reviewer compares live traffic against, so the
  // claims most likely to be checked are the ones asserted here.
  it('does not claim dashboard data reaches us only via cloud sync', () => {
    // FALSE, and the most severe of the set: with no extension and no
    // subscription, the stock widget calls api.mykk.us directly with your
    // symbols and, if you set one, your own Marketstack API key.
    const html = read('privacy.html');
    expect(html).not.toMatch(/None of it reaches us unless you turn on cloud sync/i);
    expect(html).not.toMatch(/is kept in your own browser and is never sent to us/i);
  });

  it('names every third party a widget can reach', () => {
    // The page named Stripe, Google, Cloudflare, and Plausible, and stopped.
    // These five also receive data, three of them on the FREE tier with no
    // account at all.
    const html = read('privacy.html');
    for (const party of [
      'Yahoo Finance',
      'Marketstack',
      'rss2json',
      'corsproxy.io',
      'allorigins.win',
    ]) {
      expect(html, party).toContain(party);
    }
  });

  it('says turning cloud sync off does not delete what was already synced', () => {
    // `signOutUser()` calls auth.signOut() and nothing else; no code path in the
    // dashboard deletes the Firestore document.
    const html = read('privacy.html');
    expect(html).not.toMatch(/your configuration then lives only in your browser/i);
    expect(html).toMatch(/does not delete what has already been synced/i);
  });

  it('states the session lifetime the Worker actually issues', () => {
    // better-auth's 7-day default was correct until @tgwab/auth 0.3.1 landed in
    // mykk.us-extension #19, which sets expiresIn to 30 days.
    const html = read('privacy.html');
    expect(html).toMatch(/session token is valid for thirty days/i);
    expect(html).not.toMatch(/session token is valid for seven days/i);
  });

  it('does not claim to store a device browser name or a session IP', () => {
    // `activations` is inserted with two blind indexes and nothing else, and no
    // session on record carries an ipAddress.
    const html = read('privacy.html');
    expect(html).not.toMatch(/a hashed device identifier, the browser name/i);
    expect(html).not.toMatch(/the IP address and browser user-agent string/i);
  });

  it('does not promise subscription email this service does not send', () => {
    // The Worker sends no mail — health reports `mailer: not_provisioned`.
    // Stripe sends it, and the page now says so rather than implying we do.
    expect(read('privacy.html')).not.toMatch(/and send subscription email/i);
  });

  it('leaves Discord undisclosed, per the owner ruling', () => {
    // Michal ruled the address is masked in the Worker (mykk.us-extension #18)
    // rather than the relay being disclosed here. If that ever reverses, this
    // test is the reminder that the page has to change with it.
    expect(read('privacy.html')).not.toMatch(/discord/i);
  });

  it('carries a Last updated date', () => {
    expect(read('privacy.html')).toMatch(/<strong>Last updated:<\/strong>/);
  });
});

describe('the legal pages agree with each other', () => {
  it('does not tell two different stories about whose Firebase holds synced settings', () => {
    // dmca.html said "your own Google Firebase account rather than on our
    // systems" while privacy.html said "a Google Firebase project we operate",
    // one day apart. start.mykk.us ships projectId 'start-mykk-us', which is
    // ours — so the DMCA page was the wrong one.
    for (const page of ['privacy.html', 'dmca.html']) {
      expect(read(page), page).not.toMatch(/your own Google Firebase account/i);
    }
    expect(read('dmca.html')).toMatch(/a Google Firebase project we operate/i);
  });

  it('uses US spelling on the pages this change touches', () => {
    // House style is US English, CMOS. terms.html is a known exception, filed
    // separately rather than rewritten here.
    for (const page of ['privacy.html', 'dmca.html']) {
      expect(read(page), page).not.toMatch(/licence|honour|organisation/i);
    }
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
