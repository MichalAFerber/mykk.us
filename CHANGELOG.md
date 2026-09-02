# Changelog

All notable changes to the MyKK website (mykk.us).

## September 2, 2026

### Pricing
- **Corrected the Pro price to $3/year.** The pricing card and the `application/ld+json` offer both advertised **$12/year** while Stripe charged $3 on `price_1U9BC1B3mV7aPjYROft17chl` — four times the real price, including in the structured data search engines and assistants read. The $12 price was retired and deactivated in Stripe; nothing on this site was updated with it.
- **Stated the 30-day free trial where the price is.** MyKK Pro is $3/year after a free 30-day trial, matching BookmarkWizard and CaptureWizard. The card badge, the button, and a new FAQ entry now say a card is captured at checkout and the first charge falls on day 31, so a visitor does not discover the card requirement on the Stripe page.
- `changelog.html`'s "$12/year" line is left alone: it is a dated historical entry and was true of the day it describes.

### Roadmap
- **Marked the shipped Pro features on the roadmap.** `roadmap.html` listed six Pro features under Completed with no tier shown, so they read as included, while the landing page marks Pro features plainly. A visitor comparing the two pages saw a disagreement — and "an inaccurate description" was one of the three reasons the Chrome Web Store rejected MyKK on 2026-04-23.
- The six were derived from the dashboard's own gating — the call sites of `isExtensionSubscriptionActive()` in `mykk.us-dashboard/index.html` — rather than from either page's copy: **ICS Calendar Sync, Dashboard Pages, Bookmark Folders, Stock Quotes, RSS Feeds, and Ambient Sounds**. Deriving the list from the landing page instead would have found only three; its Pro list is a marketing highlight, not an inventory.
- The `Pro` badge sits **beside** `Done`, never instead of it: a shipped Pro feature is both, and replacing the status would tell a visitor the feature is not built.
- **Removed the roadmap preview from the homepage** (owner ruling). It mirrored six items from `roadmap.html` with their own status badges and had drifted four ways: Keyboard Shortcuts, Custom CSS Injection, and ICS Calendar Sync were still marked Planned after shipping, and a Music Player entry remained after the July 16 roadmap dropped it. A copy of another page's status is wrong the moment either side changes, so the section is now a heading and a link to `/roadmap`. There is one source.

### Tests
- Pinned the Pro price by value in `test/build.test.js` — on the card and in the parsed JSON-LD offer — with a negative control proving the check still catches the old figure. This drift was silent for the same reason the privacy-policy drift was: nothing checked.
- Pinned the tier of every Completed roadmap item, in both directions — the six that must carry the badge and the nine that must not — with a negative control proving the check catches a badge removed *and* a badge wrongly added.
- Pinned the homepage's roadmap removal too, so a future "just a few highlights" reintroduction fails a test rather than quietly re-creating the drift.

## July 16, 2026

### Docs
- Added a "how to add custom bookmark icons" guide (Google Images, Icons8, Simple Icons, Dashboard Icons)
- Documented Calendar Feeds (ICS Sync) as a Pro feature and installing MyKK as an app (PWA)

### Roadmap
- Moved ICS Calendar Sync, Custom CSS Injection, Keyboard Shortcuts, and Screensaver to Completed
- Added PWA / Offline Mode, High Contrast Mode, and Dashboard Pages to Completed
- Removed Music Player from Planned

### Release Notes
- Added a July 16, 2026 changelog entry covering the latest dashboard features

## March 16, 2026

### Features
- Comprehensive documentation page with all widgets, Pro features, and FAQ
- Release Notes page (/changelog)
- Expanded comparison table with Dashy (5 competitors)
- Updated pricing cards with all Pro features
- Updated roadmap: completed items moved to Done, added ICS Calendar Sync, Music Player, More Auth Providers
- Pro badges on feature cards (RSS, Ambient Sounds, Stock Quotes)
- "Cloud Dashboard" replaces "Live Demo" across all pages
- GitHub download links point directly to index.html

### Changes
- FAQ trimmed to product questions only (how-to items moved to /docs)
- Removed Marketstack pricing from help text

## March 15, 2026

### Features
- Complete website redesign (dark theme, shared CSS/JS)
- New pages: docs, roadmap, support, privacy, terms, thank-you
- Hero section with screenshot, updated nav and footer
- Webmaster files: robots.txt, sitemap.xml, .well-known/security.txt
- Favicon.svg logo in header/footer across all pages
- FAQ section with dashboard settings items
- Tally.so contact form on support page

## March 14, 2026

### Features
- Pricing section with Free and Pro cards
- Stripe Checkout integration
- Roadmap section

## March 13, 2026

### Features
- Initial website with landing page
- Repository created for mykk.us
