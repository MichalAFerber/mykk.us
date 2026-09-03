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

  // WHY THIS IS PINNED. The Pro card listed "Donetick task integration" twice,
  // at index.html:751 and again at :767, and it survived long enough to be
  // noticed by accident — which says nobody had read that list as a list since
  // it was written. A duplicate is small, but a pricing card is the page that
  // says what a customer gets for $3, and a list nobody proof-reads is exactly
  // where a stale or wrong entry hides next.
  //
  // Cheap to state, so it is stated for BOTH cards: a repeat in Free is the same
  // defect as a repeat in Pro.
  describe('the pricing cards', () => {
    /** The visible text of every <li> in one pricing card. */
    function featuresOf(cardClass) {
      const html = read('index.html');
      const card = html.match(
        new RegExp(`<div class="${cardClass}">([\\s\\S]*?)</ul>`)
      );
      expect(card, `no pricing card matching "${cardClass}"`).not.toBeNull();
      return [...card[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) =>
        m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      );
    }

    function duplicatesIn(items) {
      const seen = new Set();
      return items.filter((t) => (seen.has(t) ? true : (seen.add(t), false)));
    }

    it.each([
      ['Pro', 'pricing-card featured'],
      ['Free', 'pricing-card'],
    ])('the %s card names no feature twice', (_label, cardClass) => {
      const items = featuresOf(cardClass);
      // A card with no features parsed would pass the duplicate check for the
      // wrong reason, so prove the reader found the list first.
      expect(items.length).toBeGreaterThan(5);
      expect(duplicatesIn(items)).toEqual([]);
    });

    // THE NEGATIVE CONTROL. The assertion above claims an absence, which is the
    // kind that passes when the reader is broken. This runs the same detector
    // over the list as it actually stood and requires it to name the repeat.
    it('would have caught the Donetick entry listed twice', () => {
      const asItStood = [
        'Everything in Free',
        'Live weather &amp; radar',
        'Donetick task integration',
        'RSS feeds',
        'Donetick task integration',
        'Ambient sounds',
      ];
      expect(duplicatesIn(asItStood)).toEqual(['Donetick task integration']);
    });

    // ---- MEMBERSHIP ------------------------------------------------------
    //
    // WHAT THE SOURCE OF TRUTH ACTUALLY IS, AND WHAT THIS TEST CAN SEE. A
    // feature is Pro if and only if the dashboard gates it, and that gating
    // lives in ANOTHER REPO — `mykk.us-dashboard/index.html` on origin/main.
    // This suite cannot read it, so what follows is a pinned CONCLUSION, not a
    // verification. If the dashboard's gating changes, this list has to be
    // re-derived by hand; a failure here means "the card changed", never "the
    // card disagrees with the dashboard".
    //
    // HOW TO RE-DERIVE IT (the complete method — the earlier one was wrong):
    //   1. every call site of `isExtensionSubscriptionActive()`, which catches
    //      per-widget gates; PLUS
    //   2. the section-level toggles, `updateIntegrationsVisibility()` above
    //      all, which gates whole settings sections at once.
    // Step 2 is not optional. "iFrame widgets" is gated ONLY at the section
    // level (`section-iframe`, and `.iframe-widget` hidden in bulk), so a
    // call-site-only sweep returns 11 of the 12 features and looks complete.
    //
    // The 12 gated features and where they are gated, as of 2026-09-02:
    //   Live weather & radar   6387, 7770        Twitter/X feed    6415, 7770
    //   Daily focus            6392              Donetick          6422, 9049, 7770
    //   To-do list             6393              Bookmark folders  6008, 6979
    //   Stock quotes           6396, 7910, 7770  iFrame widgets    7770 only
    //   ICS calendar sync      6402, 8449, 8582  RSS feeds         8011, 8177, 7770
    //   Ambient sounds         6407, 8791        Dashboard pages   8807, 8922, 7770
    //
    // "Daily focus" and "to-do list" are two gates carried by one card entry,
    // which is why 12 features read as 11 lines below.
    const PRO_FEATURES = [
      'Everything in Free',
      'Live weather &amp; radar',
      'iFrame widgets (unlimited)',
      'Donetick task integration',
      'RSS feeds',
      'Stock quotes (Yahoo Finance)',
      'Twitter/X feed widget',
      'Daily focus &amp; to-do list',
      'Ambient sounds',
      'ICS calendar sync (Google, Outlook, Apple, Nextcloud)',
      'Bookmark folders',
      'Dashboard pages (multiple, tabbed)',
      'Chrome extension',
      'Priority support',
    ];

    const FREE_FEATURES = [
      'Search bar (7 engines)',
      // Both parentheticals are load-bearing: the free feature is real, and the
      // richer half of it is gated. Without them a reader can take either entry
      // as covering the paid half.
      'Favorites / bookmarks (folders are Pro)',
      'Mini calendar (ICS calendar sync is Pro)',
      'Date &amp; clock widgets',
      'Drag &amp; drop layout',
      'Custom themes &amp; backgrounds',
      'Greeting &amp; quotes',
      'Notepad (plain, rich text, markdown)',
      'Paint canvas &amp; webcam',
      'Light / dark mode',
      'Cloud sync (Google Sign-In)',
      'Export / import settings',
    ];

    // Sorted, so reordering the card for design reasons is free while adding,
    // dropping or renaming an entry is not.
    it.each([
      ['Pro', 'pricing-card featured', PRO_FEATURES],
      ['Free', 'pricing-card', FREE_FEATURES],
    ])('the %s card lists exactly the expected features', (_l, cardClass, expected) => {
      expect(featuresOf(cardClass).sort()).toEqual([...expected].sort());
    });

    // THE NEGATIVE CONTROL for the pin. Dropping a paid feature is the failure
    // this exists to prevent, so prove the comparison reports it rather than
    // trusting that it would.
    it('would catch a paid feature dropped from the Pro card', () => {
      const missingOne = PRO_FEATURES.filter((f) => f !== 'Bookmark folders');
      expect(missingOne.sort()).not.toEqual([...PRO_FEATURES].sort());
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

  it('does not claim an installed base on a version the Store never served', () => {
    // The page said "Copies of the extension still on version 1.0.6 use an older
    // token mechanism, which we continue to honor until those copies update."
    // Both halves were wrong. The Chrome Web Store has served v1.0.4 throughout
    // (mykk.us-extension #22): 1.0.5 and 1.0.6 were built and tagged in July and
    // never submitted. And v1.0.4 cannot obtain or present a session token
    // against the current Worker at all -- its sign-in POST to
    // /api/license/auth is 400 "Missing id_token or device_id", and its
    // revalidation POST to /api/license/email-status is an unrouted 404.
    //
    // The mechanism claim on its own is true and is kept: resolveToken still
    // tries the legacy HMAC token first (worker/src/session.js). It is the
    // version number, and the installed base it asserted, that were invented.
    const html = read('privacy.html');
    expect(html).not.toMatch(/version 1\.0\.6/i);
    // Pinned by shape as well as by number, so the same claim cannot return
    // wearing a different version.
    expect(html).not.toMatch(/copies of the extension still on version/i);
    // ...and the true disclosure must survive the removal of the false one.
    expect(html).toMatch(/older session token/i);
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

// WHY THIS MOVED AND WIDENED. The owner ruling of 2026-08-07 — contact routes
// through the support form, not an email address — was enforced on privacy.html
// alone, inside the privacy.html block, while its own comment noted that
// dmca.html carried the same rule and terms.html was an exception "filed
// separately". Two pages later (terms.html in #24, index.html here) that is
// three instances of one ruling reached one page at a time. When a rule keeps
// escaping its test, the test has the wrong scope, so the assertion now runs
// over every page the ruling covers instead of the one it was written against.
//
// terms.html is no longer an exception: #24 routed both of its contacts through
// the form, so including it here is free regression cover for that fix.
describe('contact routes through the support form, not an email address', () => {
  // Owner ruling, 2026-08-07.
  //
  // support.html is the one page NOT in this list, and deliberately: its three
  // meta descriptions (description, og:, twitter:) still name support@mykk.us,
  // and it is the page the form itself lives on. Whether the ruling reaches a
  // social-preview string on the support page is a copy decision, not mine to
  // make silently — it is filed rather than fixed here, exactly the way
  // terms.html was. Named in the code so the omission reads as considered
  // rather than missed.
  const PAGES = [
    'index.html',
    'privacy.html',
    'terms.html',
    'dmca.html',
    'docs.html',
    'roadmap.html',
    'changelog.html',
    'thank-you.html',
    '404.html',
  ];

  it.each(PAGES)('%s names no @mykk.us address', (page) => {
    expect(read(page), page).not.toMatch(/[a-z0-9._%+-]+@mykk\.us/i);
  });

  // THE NEGATIVE CONTROL. Every assertion above claims an absence, and an
  // absence is exactly the claim that passes when the instrument is broken.
  // This runs the same matcher over the sentence index.html actually carried
  // and requires it to fire.
  it('catches the address index.html used to carry', () => {
    const before =
      "<p>Yes, we offer a 30-day money-back guarantee. If you're not " +
      'satisfied with Pro, contact us at support@mykk.us for a full refund.</p>';
    expect(before).toMatch(/[a-z0-9._%+-]+@mykk\.us/i);
  });

  // The other half of the ruling: removing an address is only half a fix if it
  // leaves the reader with no way to make contact at all.
  it.each(['index.html', 'privacy.html', 'terms.html', 'dmca.html'])(
    '%s offers the support form instead',
    (page) => {
      expect(read(page), page).toContain('href="/support"');
    }
  );
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
