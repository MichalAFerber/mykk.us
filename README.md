# MyKK.us

Landing page for [MyKK](https://mykk.us/) — a customizable, single-file browser start page and new-tab dashboard.

**Live dashboard:** [start.mykk.us](https://start.mykk.us)
**Source code:** [github.com/MichalAFerber/mykk.us-dashboard](https://github.com/MichalAFerber/mykk.us-dashboard)

## What's New

See the full [Changelog](CHANGELOG.md) for all updates. Recent highlights:

- Comprehensive documentation page with all widgets, Pro features, and FAQ
- Release Notes page at /changelog
- Expanded comparison table (5 competitors including Dashy)
- Updated pricing cards and roadmap
- Pro badges on feature cards (RSS, Ambient Sounds, Stock Quotes)
- Complete website redesign with dark theme and shared CSS/JS
- New pages: docs, roadmap, support, privacy, terms

## What's Here

This repo contains the marketing site at [mykk.us](https://mykk.us/). It's a single `index.html` that showcases the dashboard and links visitors to the live demo and GitHub source.

### Sections

- **Hero** — tagline, CTA buttons, key stats (1 file, 0 deps, 10+ widgets, 7 search engines)
- **Live Preview** — embedded iframe of `start.mykk.us` in faux browser chrome, with fallback
- **Features** — 6 cards: Single File, Customizable, Drag & Drop, Cloud Sync, Weather & Radar, Privacy
- **How It Works** — 3 steps: Download, Open, Customize
- **Comparison** — table vs Homarr, Homepage, and Heimdall (setup, server, offline, layout, file size)
- **Widget Showcase** — 8 cards: Search, Calendar, Paint, Notepad, Favorites, iFrame, Webcam, Clock
- **CTA + Footer** — demo/GitHub links, attribution

### Design

- Glassmorphism with animated gradient background orbs
- Fully responsive with mobile hamburger nav overlay
- Scroll-triggered fade-in animations via IntersectionObserver
- Sticky, backdrop-blurred family nav with dark/light theme toggle
- SVG icons throughout (no icon library)
- Zero dependencies; display headings use self-hosted JetBrains Mono Variable (no Google Fonts)

## Deployment

Deployed automatically via Cloudflare Pages on push to `main`.

## Standards

Governed by [TGWAB Dev Standards](https://github.com/MichalAFerber/tgwab-standards) v2.33.0. The site shell tracks the wizard-family design system (`wizard-web` `packages/theme` + `packages/ui`) out of tree—family tokens with dual theme, the shared nav/footer markup, and hand-written utilities implementing the classes that markup emits (see the header notes in `styles.css`). Conformity is manual: changes to the shared shell must be ported by hand.

## Deviations

- §1—footer year rendered at build time—no build step: static HTML ships a literal year, bumped each January—2026-08-11—review 2027-01-01

## License

[MIT](LICENSE)
