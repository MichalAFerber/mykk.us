# MyKK.us

Landing page for [MyKK](https://mykk.us/) — a customizable, single-file browser start page and new-tab dashboard.

**Live dashboard:** [start.mykk.us](https://start.mykk.us)
**Source code:** [github.com/MichalAFerber/start.mykk.us](https://github.com/MichalAFerber/start.mykk.us)

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
- Sticky nav with blur on scroll
- SVG icons throughout (no icon library)
- Zero dependencies beyond Google Fonts (Inter)

## Deployment

Deployed automatically via Cloudflare Pages on push to `main`.

## License

[MIT](LICENSE)
