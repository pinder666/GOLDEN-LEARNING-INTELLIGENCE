# Design Review: CoachSoccerPro Landing
**Date**: 2026-09-30
**URL**: http://localhost:3030/landing-page.html (+ terms.html, privacy.html)
**Note**: Visual screenshot pass blocked (Chrome window minimized, captures return 0 width). This review covers structure, code, SEO, accessibility and consistency from source + DOM. Re-run the visual pass with the browser window restored.

## Overall Impression
Strong dark brand, coherent copy arc (pain, creed, missing piece, arsenal, mental side, switch, clubs, pricing), fully bilingual. Reads as designed, not developer-assembled. The gaps are launch-mechanics: SEO head is nearly empty, the Spanish half is invisible to search engines, one real responsive bug, and heavy images.

## Findings

### High
- **Responsive bug: inline grid overrides on new sections** at Arsenal + Switch grids. `style="grid-template-columns: repeat(3, 1fr)"` is inline, so the stylesheet's 1024px/768px media queries can never override it. On phones these grids stay 3 columns and crush. → Remove the inline grid rule and add a class (e.g. `.grid-3`) defined in the stylesheet with its own breakpoints.
- **SEO head nearly empty** at landing-page.html. No meta description, no Open Graph or Twitter card tags, no favicon, no canonical. Link previews in WhatsApp (where coaches live) will render bare. → Add meta description (EN), og:title/og:description/og:image (needs a 1200x630 share image), twitter:card, favicon, canonical.
- **Spanish is unindexable**. The ES copy is a client-side toggle on one URL with `lang="en"` hardcoded. Search engines index only English; the primary market cannot find the site in its own language. → For launch: a real `/es/` page (or `?lang=es` prerendered) with hreflang pairs. Minimum stopgap: JS sets `document.documentElement.lang` on toggle.
- **Page weight**. soccermental-badge.png is 1.5MB; img-1..4.jpg are full-size photos; no `width`/`height` attributes (layout shift) and no `loading="lazy"`. → Compress badge to ~40KB WebP/PNG, lazy-load below-fold images, add dimensions.

### Medium
- **No persistent CTA after the hero scrolls away**. The nav lost its CTA when the duplicate was removed; from the stats section to pricing there is no action in view. → Either restore a small nav CTA (standard practice: one in nav + one in hero is not a duplicate, it is persistence) or accept pricing/closing CTAs as the only ones. Owner's call, flagged for conversion.
- **mailto: is the only conversion path**. Desktop users without a configured mail client click Request Access and nothing happens. → A simple form (Web3Forms is already proven on the SoccerMental site) with mailto as fallback.
- **ES display classes inconsistent on block elements**. `div class="stat-label es"` renders `display:inline` in ES mode (the `.es` rule forces inline); stacked labels can collapse onto one line inside stat cards. → Use `es es-block` on block-level ES elements throughout (pattern already exists in the stylesheet).
- **Hand-drawn dashboard embed vs real product**. The hero embed is hand-built HTML. The research doc's own rule: real screenshots only. The real app looks good now. → Replace embed (or at least the four showcase images) with real captures.
- **Embed sidebar advertises Checkmatch and Automation**, both ruled hidden/facade for the demo. A coach who buys off this picture will look for them. → Remove those two rows from the marketing embed until the features are live.
- **Tiny type in stat-source rows** (10px) carries real content in the Switch section ("we never touch your money"). → Raise to 12px; that line is a selling point, not a footnote.

### Low
- `document.documentElement.lang` never updates on language toggle (screen readers announce Spanish text as English).
- Lang toggle buttons lack `aria-pressed`; emoji icons are unlabeled (acceptable as decorative, but arsenal icons could carry `aria-hidden="true"`).
- No visible custom focus styles; default focus ring is acceptable but faint on the dark ground.
- `soccermental.com` link in the footer badge: verify the domain is actually live before launch; a dead sister-company link undermines the exact trust it exists to build.
- No robots.txt / sitemap.xml / 404 page for the deployed site (not needed locally).
- Nav "About" and footer links all resolve now (good); hero secondary "See It In Action" scrolls to features rather than showing the product live — consider pointing at a demo video when one exists.

## What Looks Good
- One accent (orange) doing all the CTA work; consistent card language (same radius, border, bg) across stats, features, pricing.
- Clear h1 → h2 hierarchy, one h1, sectioned labels (eyebrow pattern) used consistently.
- The copy arc is genuinely strong and bilingual throughout; no lorem, no dead claims, no em dashes in rendered copy.
- Terms and Privacy pages: consistent styling, real meta descriptions, bilingual, child-safety content is a differentiator ("children never log in") rather than boilerplate.
- Footer sister-company badge block follows the brand-marquee law: logo on black, fine print separate, no explaining.

## Top 3 Fixes
1. Fix the inline-grid responsive bug (Arsenal + Switch collapse on mobile) — 10 minutes, prevents a broken phone experience for the exact audience that will open this from a WhatsApp link.
2. Fill the SEO head: meta description, OG/Twitter tags + share image, favicon — the WhatsApp link preview IS the first impression for this market.
3. Compress the 1.5MB badge and lazy-load the photo row — biggest single performance win.
