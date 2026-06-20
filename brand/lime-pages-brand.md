# Lime Pages — Brand & Design Language

The single source of truth for building Lime Pages assets — websites, decks,
brochures, social posts, OG/share cards. Everything here is extracted from the
live product, so it matches what's actually shipping.

> **How to use this:** paste this whole file into any design chat (Claude, etc.)
> or drop the logo files from `logos/` into Figma / Canva / Illustrator. A
> condensed version + downloadable logos are also served at
> **`https://www.limepages.co.za/brand/`**.

---

## 1. Brand objective & voice

**Objective (the one-liner):**
> Equipping young professionals & entrepreneurs with alternative investment
> strategies and solutions to build wealth.

**Voice & tone**
- Warm, human, plain-language — never jargon-heavy or hype-y.
- Confident and credible, but approachable. We explain, we don't gatekeep.
- Benefit-led: lead with what the reader gets, not features.

**⚠️ Compliance (non-negotiable)**
Lime Pages is **not a registered Financial Services Provider (FSP)**. Never
imply regulated or licensed financial advice. Where investments/returns are
mentioned, carry the appropriate notes:
- "Not financial advice." / `#ThisIsNotFinancialAdvice`
- "Past performance ≠ future results."
- "Investment returns are not guaranteed."

---

## 2. Colour palette

### Core
| Colour | Hex | Role |
|---|---|---|
| **Navy** | `#0B1933` | Primary brand colour. Dark backgrounds, body text on light. |
| Navy-mid | `#0F2040` | Secondary navy (panels, gradients). |
| **Lime** | `#B8FF00` | Primary accent. CTAs, highlights, energy. |
| **Teal** | `#46CDCF` | Secondary accent. Logo mark, links, calm accents. |

### Sub-brand accents
| Colour | Hex | Used by |
|---|---|---|
| Capital green | `#C1FF72` | Lime Capital |
| Lemonade yellow | `#FFE600` | Lemonade Station |
| Pink | `#FF9FBF` | Occasional tertiary accent |

### Neutrals
| Colour | Hex | Role |
|---|---|---|
| Ink | `#0B0B0B` | Headings / strong text on light |
| Muted | `#4B5563` | Body / secondary text |
| Subtle | `#6B7280` | Tertiary text, captions |
| Border | `#E5E7EB` | Hairlines, card borders |
| Snow | `#F8F9FA` | Light section backgrounds |

### Tints (for soft fills / glows)
| Token | Value |
|---|---|
| teal-light | `#E6FAF9` |
| capital-light | `#F0FFE0` |
| lime-dim | `rgba(184, 255, 0, 0.10)` |
| teal-dim | `rgba(70, 205, 207, 0.10)` |
| capital-dim | `rgba(193, 255, 114, 0.12)` |

### Signature gradient
Teal → Lime, top-left to bottom-right. Used on a single accent word in a
heading (e.g. "Together").
```css
background: linear-gradient(to bottom right, #46CDCF, #B8FF00);
```

---

## 3. Typography

**Typeface: Plus Jakarta Sans** (Google Fonts) — used for everything.
`https://fonts.google.com/specimen/Plus+Jakarta+Sans`

```
https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap
```

| Weight | Name | Use |
|---|---|---|
| 800 | ExtraBold | **Headings / display** (the default heading weight) |
| 700 | Bold | Sub-headings, eyebrows, badges, buttons |
| 600 | SemiBold | Emphasis, labels |
| 500 | Medium | Lead paragraphs, UI labels |
| 400 | Regular | Body copy |

**Rules**
- **Headings:** weight **800**, letter-spacing tight (≈ `-0.02em` / `tracking-tight`), line-height ~1.05–1.12.
- **Eyebrows / badges:** weight 700, **UPPERCASE**, letter-spacing +1.2–1.5px, ~11px.
- **Body:** weight 400–500, line-height ~1.7–1.8, colour Muted `#4B5563`.
- Headlines are usually white (on navy) or Ink, with **one** word in an accent colour or the teal→lime gradient.

> For OG/share images (Satori) the static WOFF weights are bundled at
> `public/fonts/plus-jakarta-sans-{400,500,700,800}.woff`.

---

## 4. Logos

All files live in `logos/` (and `https://www.limepages.co.za/brand/logos/`).

### Lime Pages
| File | What |
|---|---|
| `lime-pages-logo-color.svg` | Full lockup — mark + "LIME PAGES" wordmark + underline bar. Mark teal, text ink. **Use on light backgrounds.** |
| `lime-pages-logo-white.svg` | All-white lockup. **Use on navy / photos.** |
| `lime-pages-logo-teal.svg` | All-teal lockup. |
| `lime-pages-icon.svg` | App icon — navy rounded square + lime mark. Favicon, avatars, app tiles. |
| `lime-pages-mark.svg` | The circular mark alone (teal). Compact placements. |

### Lehumo (sub-brand)
| File | What |
|---|---|
| `lehumo-mark.svg` | Nested hexagon (teal). |
| `lehumo-lockup.svg` | Hexagon + "LEHUMO" (lime, 800) + "Collective Investment Trust" (teal, 500). |

The Lehumo mark, inline (copy-paste ready):
```svg
<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
  <polygon points="30,4 54,17 54,43 30,56 6,43 6,17" fill="#46cdcf" fill-opacity="0.08" stroke="#46cdcf" stroke-width="2.5"/>
  <polygon points="30,12 47,21.5 47,40.5 30,50 13,40.5 13,21.5" fill="none" stroke="#46cdcf" stroke-width="1.5" opacity="0.4"/>
</svg>
```

**Clear-space & sizing**
- Keep clear space around any logo ≥ the height of its mark.
- Minimum legible width: Lime Pages lockup ~120px; icon/mark ~24px.

**Do**
- Use the white lockup on navy/photos; the color lockup on light.
- Keep the teal mark + lime accent relationship.

**Don't**
- Recolour outside the approved variants, stretch/distort, rotate, add shadows/outlines, or place the color lockup on busy/low-contrast backgrounds.

---

## 5. CI motifs (the "Lime Pages look")

- **Glow orbs** — large blurred radial gradients behind dark sections. Teal `rgba(70,205,207,0.10–0.25)` + lime `rgba(184,255,0,0.10–0.20)`, blur 60–80px.
- **Lime grid** — faint grid on dark heroes: lime 1px lines, 60px cells, opacity ~0.035–0.05.
- **Pills / badges** — `border-radius: 9999px`; accent-tinted background (accent @10%) + accent border (@25–35%) + a small dot + UPPERCASE 700 label, tracked.
- **Buttons** — fully rounded (`9999px`). Primary = **lime fill, navy text**, lift + glow on hover. Secondary = **teal (or white) outline**. Use a trailing arrow (`→` via a lucide `ArrowRight`, not a raw glyph).
- **Cards** — radius 20–22px, 1px Border `#E5E7EB`, soft shadow.
- **Shadows**
  ```css
  --shadow-sm: 0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
  --shadow-md: 0 4px 24px rgba(0,0,0,.09), 0 1px 4px rgba(0,0,0,.04);
  /* glow (hover on accent buttons) */
  --shadow-lime-glow: 0 8px 28px rgba(184,255,0,.30);
  --shadow-teal-glow: 0 8px 28px rgba(70,205,207,.30);
  --shadow-capital-glow: 0 8px 28px rgba(193,255,114,.30);
  ```

---

## 6. OG / share-card recipe (1200 × 630)

1. Full-bleed **photo** background.
2. **Navy tint** over it: `linear-gradient(180deg, rgba(11,25,51,.82), rgba(11,25,51,.72), rgba(11,25,51,.86))`. No grid lines.
3. Centred stack, Plus Jakarta:
   - **Badge** pill (accent dot + UPPERCASE 700 label).
   - **Heading** 800, white with **one accent word** (teal/lime/capital/yellow per brand).
   - **Subtitle** ~22px, `rgba(255,255,255,.55)`.
4. Footer: **"LIME PAGES"** bottom-left, URL bottom-right.

A page's share card should mirror that page's hero (logo lockup, headline, accent colours).

---

## 7. Sub-brands

| Sub-brand | What | Accent |
|---|---|---|
| **Lehumo** | Collective Investment Trust (30 founding members, R1,000/mo, 5-yr lock-in, ~R2M) | Lime + Teal, hexagon mark |
| **Lime Capital** | Investing education — ETFs, fund comparison, home-loan accelerator | Capital green `#C1FF72` |
| **Lime Services** | Vetted services (wills & estate via PSA, financial-strategy advisory) | Teal `#46CDCF` |
| **Lemonade Station** | Free founder/SMME resources (term sheets, fundraising) | Lemonade yellow `#FFE600` |
| **Lime Advisory** | Free AI-powered consumer-finance guidance | Teal `#46CDCF` |

---

## 8. Quick token reference (devs)

```css
--color-navy: #0B1933;  --color-navy-mid: #0F2040;
--color-lime: #B8FF00;  --color-teal: #46CDCF;
--color-capital: #C1FF72;  /* Lemonade yellow: #FFE600 */
--color-ink: #0B0B0B;  --color-muted: #4B5563;  --color-subtle: #6B7280;
--color-border: #E5E7EB;  --color-snow: #F8F9FA;
--color-teal-light: #E6FAF9;  --color-capital-light: #F0FFE0;
--font-sans: "Plus Jakarta Sans", sans-serif;
```

_Tailwind v4 tokens: `app/globals.css`. Logo component: `components/shared/Logo.tsx`. Lehumo mark: `components/sections/lehumo/LehumoHero.tsx`._
