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

  // WHY THIS IS PINNED. index.html used to carry a roadmap PREVIEW: six items
  // copied from roadmap.html, each with its own Done/Planned badge. A second
  // copy of another page's status is wrong the moment either side changes, and
  // this one had drifted four ways — Keyboard Shortcuts, Custom CSS Injection,
  // and ICS Calendar Sync still marked Planned after they shipped, plus a Music
  // Player entry the July 16 changelog records removing from the roadmap.
  //
  // Owner ruling, 2026-09-02: delete the duplicate rather than sync it. These
  // assertions are what make that a decision instead of a one-time tidy — a
  // future "let's show a few highlights on the homepage" fails here first.
  describe('the roadmap lives on one page', () => {
    it('carries no roadmap items of its own', () => {
      const html = read('index.html');
      expect(html).not.toContain('roadmap-item');
      expect(html).not.toContain('roadmap-status');
    });

    it('does not restate a Done or Planned status', () => {
      const html = read('index.html');
      expect(html).not.toContain('status-done');
      expect(html).not.toContain('status-planned');
    });

    // Removing the copy is only half the job; the reader still needs the page.
    it('links to /roadmap instead', () => {
      expect(read('index.html')).toMatch(/href="\/roadmap"/);
    });

    // THE NEGATIVE CONTROL. Three of the four assertions above are absence
    // claims, which pass just as happily when the matcher is wrong. This runs
    // them over the markup index.html actually carried and requires them to
    // fire.
    it('would catch the preview markup coming back', () => {
      const asItStood =
        '<div class="roadmap-item">' +
        '<div class="roadmap-status status-planned">Planned</div>' +
        '<h3>Music Player</h3></div>';
      expect(asItStood).toContain('roadmap-item');
      expect(asItStood).toContain('status-planned');
    });
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

// WHY THESE ARE HERE. Same class as the pricing pins: two of our own pages
// disagreed, and nothing checked. The roadmap listed shipped Pro features under
// Completed with no tier shown, so they read as included — and "an inaccurate
// description" was one of the three reasons the Chrome Web Store rejected MyKK
// on 2026-04-23.
//
// THE AUTHORITY IS THE DASHBOARD CODE, NOT EITHER PAGE. The list below was
// derived from the call sites of `isExtensionSubscriptionActive()` in
// `mykk.us-dashboard/index.html` on origin/main, because a feature is Pro if and
// only if the dashboard gates it. Deriving it from the landing page instead
// would have missed three of the six: the pricing card's Pro list is a marketing
// highlight, not an inventory. This test cannot reach that repo, so it pins the
// conclusion; if the gating changes there, this is the thing that has to be
// re-derived, not quietly edited to match.
describe('roadmap.html', () => {
  // Feature → the gate's line numbers in mykk.us-dashboard/index.html.
  const PRO_FEATURES = {
    'ICS Calendar Sync': '6402, 8449, 8582',
    'Dashboard Pages': '8807, 8922',
    'Bookmark Folders': '6008, 6979',
    'Stock Quotes': '6396, 7910',
    'RSS Feeds': '8011, 8177',
    'Ambient Sounds': '6407, 8791',
  };

  // Ungated in the dashboard, so they must NOT carry the badge. This half is
  // what stops the fix from degenerating into "mark everything Pro".
  const FREE_FEATURES = [
    'PWA / Offline Mode',
    'Custom CSS Injection',
    'Keyboard Shortcuts',
    'Screensaver',
    'High Contrast Mode',
    'Accessibility (a11y)',
    'Touch-Friendly UI',
    'Light / Dark Mode',
    'Notepad Modes',
  ];

  /** Every roadmap card, as { title, isPro, isDone }. */
  function items() {
    const html = read('roadmap.html');
    return [...html.matchAll(/<div class="roadmap-item">([\s\S]*?)<\/div>/g)].map((m) => ({
      title: (m[1].match(/<h3>([^<]+)<\/h3>/) || [, ''])[1],
      isPro: m[1].includes('status-pro'),
      isDone: m[1].includes('status-done'),
    }));
  }

  function find(title) {
    const item = items().find((i) => i.title === title);
    expect(item, `no roadmap item titled "${title}"`).toBeDefined();
    return item;
  }

  it.each(Object.keys(PRO_FEATURES))('marks %s as Pro', (title) => {
    expect(find(title).isPro).toBe(true);
  });

  it.each(FREE_FEATURES)('does not mark %s as Pro', (title) => {
    expect(find(title).isPro).toBe(false);
  });

  // THE NEGATIVE CONTROL. The assertions above claim a badge is present; that
  // is worth nothing unless the same reader reports it missing. This strips the
  // badge from a real item and requires the check to catch it, so a green run
  // means the roadmap is marked rather than that the matcher sees Pro
  // everywhere.
  it('would catch a Pro item that lost its badge', () => {
    const html = read('roadmap.html');
    const stripped = html.replace(
      '<span class="roadmap-status status-pro">Pro</span>\n          <h3>Stock Quotes</h3>',
      '<h3>Stock Quotes</h3>'
    );
    expect(stripped).not.toBe(html); // the strip actually did something
    const block = stripped.match(
      /<div class="roadmap-item">(?:(?!<\/div>)[\s\S])*?<h3>Stock Quotes<\/h3>[\s\S]*?<\/div>/
    );
    expect(block[0].includes('status-pro')).toBe(false);
  });

  it('marks Pro alongside Done, never instead of it', () => {
    // A shipped Pro feature is both. Replacing the status badge rather than
    // adding to it would tell a visitor the feature is not built.
    for (const item of items().filter((i) => i.isPro)) {
      expect(item.isDone, `${item.title} is Pro but not Done`).toBe(true);
    }
  });

  // A tripwire, deliberately exact. A seventh gated feature reaching the
  // roadmap should fail here and be re-derived from the dashboard's gating,
  // not absorbed silently.
  it('marks exactly the six features the dashboard gates', () => {
    const marked = items().filter((i) => i.isPro).map((i) => i.title).sort();
    expect(marked).toEqual(Object.keys(PRO_FEATURES).sort());
  });
});
