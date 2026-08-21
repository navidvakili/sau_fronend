---
name: clone-page-layout
description: Clone the visual layout of a given page (a URL on this site, or an external URL) into a new صفحه‌ساز هوشمند (Page Builder / smart_pages) page — reproducing its sections, columns, widgets, sub-blocks, and per-block settings as a real SmartPageSchema. Use when the user gives a link and asks to "شبیه‌سازی کند", "همین لایوت را بساز", "این صفحه را کپی/کلون کن در page builder", or otherwise wants an existing page's layout recreated as an editable Page Builder page.
---

# Clone a page's layout into the Page Builder

## What this does

Given a URL, produce a valid `SmartPageSchema` (the exact JSON shape stored in the `smart_pages.schema` column) that reproduces that page's section/column/widget structure, then create it as a new **draft** page so a human can review it in the Page Builder before publishing.

This is a structural/layout clone, not a pixel-perfect visual clone — there is no browser/screenshot tool available in this environment. Fidelity comes from either (a) reading the real schema directly when the source page is backed by this same system (exact), or (b) inferring structure from fetched HTML and mapping it to the closest available widget types (approximate, and must be reported as such).

## Step 0 — Read the ground truth first, every time

Before generating anything, re-read these three files fresh. They are the single source of truth and may have changed since this skill was written — never rely on memorized field names:

1. `frontend/src/apps/page-builder/builderTypes.ts` — the exact current `WidgetType` union, `WidgetStyle`, `WidgetDataBinding`, `WidgetInstance`, `ColumnInstance`, `SectionInstance`, `GlobalStyles`, `SmartPageSchema`. Every field you emit must exist in these interfaces.
2. `frontend/src/apps/page-builder/mockData.ts` (`INITIAL_SMART_PAGE`, `PRESET_PAGE_TEMPLATES`) — full, realistic, hand-built example schemas. Copy their conventions (id-naming, nesting, realistic style values) rather than inventing your own.
3. `reference/schema-reference.md` and `reference/widget-catalog.md` in this skill folder — condensed versions of the above two, plus the backend API contract. Use these for the 90% case; fall back to #1/#2 (and `InspectorPanel.tsx`, see step 3) for anything not covered here.

## Step 1 — Determine the source: same-site (exact) vs external (approximate)

Check the given URL against this Next.js public site's own domain/dev host and route patterns:

- **Same-site, Page Builder route**: `/page/{slug}` or `/page/{slug}/{child}` → the schema lives directly in `smart_pages.schema` for that `slug` (or as a linked child).
- **Same-site, dedicated-page route with a linked layout**: `/associations/{slug}`, `/clubs/{slug}`, `/unions/{slug}`, `/journals/{slug}`, `/professors/{slug}` → the `dedicated_pages` row for that slug may have a `layout_page_id` pointing at a `smart_pages` row (a page-builder layout shared by that page type). Check `dedicated_pages.layout_page_id` → `smart_pages.id`.
- **Same-site, other route** (`/vice/...`, etc.) — some of these are ALSO smart_pages under the hood (confirmed via `php artisan tinker` that rows like `vice-education` exist by slug). Match the URL's last path segment against `smart_pages.slug`.

If it matches → **exact path**: fetch the row and use `schema` (already JSON) directly as your working schema. Skip to Step 4.

```bash
cd backend && php artisan tinker --execute="
use App\Models\SmartPage;
\$p = SmartPage::where('slug', '<slug-from-url>')->first();
echo \$p ? json_encode(\$p->only(['id','title','slug','status','schema']), JSON_UNESCAPED_UNICODE) : 'not found';
"
```

If it does **not** match any known route/table → **approximate path**: continue to Step 2.

## Step 2 — Approximate path: fetch and analyze an external/unknown page

1. Use `WebFetch` on the URL to retrieve its content. Since there's no visual rendering, reason from the HTML/text structure: headings (`h1`–`h3`), distinct visual blocks (usually `<section>`, or `<div>` with a background-color/image, or a clear content grouping), images, buttons/CTAs, card grids, lists, embedded video/maps, forms, testimonial/quote blocks, pricing tables, contact info blocks.
2. Segment the page into an ordered list of **sections** — each visually/thematically distinct area becomes one `SectionInstance`. A typical marketing/university page decomposes into: hero → intro/about → feature/stat cards → content + image → gallery/cards grid → testimonials → CTA → contact/footer-like block. Don't force this template — follow what the actual page has.
3. Within each section, identify **columns** (side-by-side content = multiple columns summing to 12; stacked content = fewer/wider columns) and the **widgets** inside each column, in reading order.
4. Map each identified element to the closest widget type using `reference/widget-catalog.md`. When genuinely nothing fits well (e.g. a complex interactive widget unrelated to this site), prefer `custom-html` with a simplified static reproduction over silently dropping the element — but note it in your final report as an approximation.
5. Do **not** invent binding to `announcements`/`news`/`gallery`/`awards`/`staff`/`files`/`dedicated-page` data sources unless the source page is clearly showing this university's real live-data feeds (e.g. an actual news list on this same site). For an external page's "latest posts" section, reproduce it as static `heading`/`text`/`image` cards instead — inventing a live binding to data that doesn't correspond to reality would silently break on render.

## Step 3 — Build the schema

Assemble a `SmartPageSchema` object:

- `id`: a fresh string like `page-{timestamp}` (matches existing convention — see `mockData.ts`, `PageBuilderStudio.tsx`'s `handleCreatePage`).
- `title`: a clear Persian title for the new page (ask the user if not obvious from context, or derive from the source page's own `<title>`/`<h1>`).
- `slug`: kebab-case, `^[a-z0-9-]+$`, and must not collide with an existing `smart_pages.slug` — check first (`SmartPage::where('slug', $slug)->exists()`).
- `status`: always `'draft'` for a newly generated clone. Never set `'published'` — that decision belongs to a human, and the backend will silently downgrade it anyway unless the acting user has `page-builder.approve`.
- `seo`: fill in from the source page's meta title/description if available, else omit/leave minimal.
- `globalStyles`: pick real colors/font matching the source page's dominant palette (not always the `DEFAULT_GLOBAL_STYLES` teal/indigo/amber — that default belongs to *this* university's brand, an external source page likely has its own).
- `sections`: the array built in Step 2 (or copied from Step 1's exact schema).
- Every `WidgetInstance` needs the **full** `settings` object — `style`, `binding` (at minimum `{ dataSource: 'none' }` for static widgets), `visibility: { desktop: true, tablet: true, mobile: true }`, `conditionalDisplay: { enabled: false }`. Missing any of these produces a schema that doesn't match what the real builder always writes, even though the backend won't reject it (it validates `schema` as `required|array` only, no nested shape check).
- Every `SectionInstance` needs `paddingTop`/`paddingBottom` (required, not optional), `visibility`, `conditionalDisplay`, and at least one column.
- Every `ColumnInstance.width` values within a section's `columns` array should sum to at or under 12 for a sane desktop layout.

If you need the exact `customProps` shape for a less-common widget (`nav-menu`, `child-pages`, `map`, `contact-info`, `custom-html`, `social-links`, `share-buttons`, `pricing-table`, `testimonial`, `counter`, `image-slider`, `stat-card`, `icon-box`, `accordion`) beyond what `reference/widget-catalog.md` covers, grep `frontend/src/apps/page-builder/InspectorPanel.tsx` for `selectedWidget.type === '<that-type>'` — that block shows exactly which `customProps.*` fields the widget's settings panel reads and writes, which is the authoritative shape `WidgetRenderer.tsx` expects at render time.

## Step 4 — Validate before creating anything

- Re-check every `widget.type` value is a literal member of the `WidgetType` union you just re-read in Step 0.
- Re-check the JSON is syntactically valid (no trailing commas, no unquoted keys — this is going into a Laravel `array` validator via `json_decode`).
- Re-check the chosen `slug` is free.

## Step 5 — Create the page (staff API, draft only)

This project's convention (used throughout this codebase's own verification work) is a short-lived staff token issued via tinker, one API call, then revoke:

```bash
cd backend && php artisan tinker --execute="
use App\Models\User;
echo User::first()->createToken('clone-page-layout')->accessToken;
"
```

```bash
curl -s -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -X POST \
  -d @schema-payload.json \
  http://127.0.0.1:8000/api/smart-pages
```

Where `schema-payload.json` is `{ "title": "...", "slug": "...", "status": "draft", "schema": { ...the SmartPageSchema... } }`. See `reference/schema-reference.md` for the full endpoint contract (required fields, auth).

After creating it, revoke the token the same way prior work in this repo always has:

```bash
cd backend && php artisan tinker --execute="
use Laravel\Passport\Token;
Token::where('name', 'clone-page-layout')->delete();
"
```

If the user doesn't want a real DB row created (e.g. just wants the JSON to paste in themselves), skip this step and instead: write the schema to a `.json` file and tell them to open **صفحه‌ساز هوشمند → قالب‌ها → وارد کردن JSON** (the Import JSON tab in `TemplateModal.tsx`, wired to `PageBuilderStudio.tsx`'s `onImportJson`) and paste it there on an existing draft page.

## Step 6 — Report back

Tell the user, concisely:
- Whether this was an **exact** clone (same-site, schema copied directly) or an **approximate** one (external page, structurally inferred) — always be explicit about which, since the reliability differs completely.
- The created page's `id`, `title`, `slug`, and that its status is `draft`.
- How to open it: the Vite admin is a single-page app with no deep-linkable per-page URL — tell them to open the **«صفحه‌ساز هوشمند»** module from the sidebar and select the page by title from the list.
- For the approximate path: list any sections/elements you weren't confident mapping (so they know exactly what to check by eye), and any widget types you substituted (e.g. "the source page's video background wasn't reproducible — used a static image instead").
