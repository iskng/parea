# Paréa Zion — Redesigned site

A fully fleshed-out, single-page redesign of [pareazion.com](https://pareazion.com),
built from scratch in this `site/` folder. The original vendored WordPress copy in
`../public/` is left untouched.

## What this is

An immersive, architecture-forward scrolling site for Paréa Zion — a landscape
hotel and retreat center on 240 acres beside Zion National Park, designed by
Studio Andrew Trotter. Hand-written HTML/CSS/JS, no build step.

Sections: hero · the meaning of *paréa* · the place · the land · architecture ·
the bathhouse · stays · gallery · join the list · contact · footer.

## Design

- **Palette** drawn from the real renders — lime-plaster sand, Martian red,
  desert sage, dusty Zion sky.
- **Type** — Fraunces (editorial serif) + Inter.
- **Imagery** — the original Studio Andrew Trotter renders, vendored under
  `assets/img/`.
- **Motion** — scroll reveals, subtle hero parallax, sticky header. Fully
  respects `prefers-reduced-motion`.

## Hero background — video / image switch

The hero plays a muted, looping background video (the Paréa Zion film). To
switch it back to the original still image, change **one attribute** on the
hero `<section>` in `index.html`:

```html
<section class="hero" id="hero" data-hero="video">   <!-- video background -->
<section class="hero" id="hero" data-hero="image">   <!-- still image  -->
```

Both backgrounds stay in the markup; CSS shows whichever the attribute selects.
Visitors with `prefers-reduced-motion` automatically get the poster image even
in video mode.

Video assets live in `assets/video/`:

| File | Size | Use |
|------|------|-----|
| `hero-1080.webm` | ~12 MB | Primary (VP9, modern browsers) |
| `hero-1080.mp4`  | ~19 MB | Fallback (H.264) |
| `hero-720.mp4`   | ~8 MB  | Mobile / `< 768px` |
| `hero-poster.jpg`| ~250 KB| Poster shown before the video loads |

All are muted, ~63 s, trimmed from the source. To re-export from a new master
(`master.mp4`):

```sh
# 1080p H.264 (muted, faststart)
ffmpeg -i master.mp4 -an -vf scale=1920:-2 -c:v libx264 -crf 27 -preset slower \
  -pix_fmt yuv420p -movflags +faststart assets/video/hero-1080.mp4
# 1080p VP9 WebM
ffmpeg -i master.mp4 -an -vf scale=1920:-2 -c:v libvpx-vp9 -b:v 0 -crf 37 \
  -row-mt 1 assets/video/hero-1080.webm
# 720p H.264
ffmpeg -i master.mp4 -an -vf scale=1280:-2 -c:v libx264 -crf 28 -preset slower \
  -pix_fmt yuv420p -movflags +faststart assets/video/hero-720.mp4
# poster
ffmpeg -ss 32 -i master.mp4 -vframes 1 -vf scale=1600:-2 -q:v 5 assets/video/hero-poster.jpg
```

## Run / deploy

```sh
npm install
npm run dev      # wrangler pages dev .
npm run deploy   # deploys Pages project "pareazion-site"
```

## Newsletter

`functions/api/newsletter.js` is the same Cloudflare Pages Function as the
original, writing to the shared `pareazion-newsletter` D1 database (binding `DB`),
with optional Mailchimp fallback. The form posts `EMAIL` to `/api/newsletter`.
