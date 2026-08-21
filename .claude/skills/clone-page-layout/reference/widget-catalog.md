# Widget catalog — mapping HTML elements to Page Builder widgets

Condensed from `builderTypes.ts` (`WidgetType`, `WIDGET_TYPE_LABELS`) and `ComponentPickerModal.tsx`. For any `customProps` field not listed here, grep `frontend/src/apps/page-builder/InspectorPanel.tsx` for `selectedWidget.type === '<type>'` — that block is the authoritative shape.

## Valid icon names — a small fixed list, NOT arbitrary lucide-react names

Every `iconName` value (on `WidgetInstance.iconName`, `icon-box`/`counter`'s `customProps.iconName`, etc.) **and** every inline `[icon:name]` token (used inside `heading`/`text`/`richtext`/`accordion` content — see the badge/chip pattern below) is looked up in ONE fixed `iconMap` in `frontend/src/apps/page-builder/WidgetRenderer.tsx` (grep `const iconMap`). An unrecognized name silently falls back to a generic default icon (`info`/`sparkles` depending on widget) with no error — so a wrong guess doesn't fail loudly, it just renders the wrong icon. Re-grep that map fresh each time in case it changed, but as of this writing the valid keys are exactly:

`map`, `phone`, `mail`, `share`, `chat`, `link`, `type`, `columns`, `rows`, `images`, `gauge`, `compass`, `code`, `quote`, `info`, `send`, `globe`, `hash`, `heart`, `clock`, `check`, `arrow`, `users`, `dollar`, `external`, `students`, `book`, `award`, `unlock`, `lock`, `grad`, `sparkles`, `stat`, `monitor`, `file-check`, `bookmark-check`, `layers`, `box`, `shield-check`, `user-check`, `file-text`, `circle-question-mark`, `linkedin`, `instagram`, `x`, `youtube`, `telegram`, plus a few payment/social-app brand icons (`aparat`, `bale`, `eitaa`, `cafebazaar`, `enamad`, `gap`, `sapp`, `shetab`, `adobe*`).

Common near-misses that do **not** exist: `star`, `check-circle` (use `check`), `printer`/`fax` (nothing fax-specific — use `file-text` or `box`), `message-square` (use `chat`), `graduation-cap` (use `grad`), `user` singular (use `users`). Always pick from the real list above, not from general lucide-react icon-name conventions.

## Icon + short-text "badge/chip" pattern (pill-shaped label, e.g. a small tag above a heading)

Do **not** use `callout` for this — `callout` is a full alert-box component (icon-in-a-square + bold title line + separate body paragraph), not a small pill. For a compact "[icon] short label" chip:
- Use `heading` (or `text`) with `content` starting with an inline icon token: `"[icon:sparkles] عالی‌ترین مرجع سیاست‌گذاری..."`. This is a real, first-class mechanism — `InspectorPanel.tsx` shows a "درج آیکون" (insert icon) button for exactly `heading`/`text`/`accordion` widgets that inserts this same `[icon:name]` token; it renders as an inline SVG next to the text (see `renderTextWithIcons` in `WidgetRenderer.tsx`).
- Colored, semi-transparent background: set `settings.style.backgroundColor` to a plain 6-digit hex **plus** `settings.style.backgroundOpacity` (0–100) — `WidgetRenderer.tsx`'s `resolveBackgroundColor` converts the pair into an `rgba(...)` value at render time. Do not use an 8-digit alpha hex directly (`#ffffff1a`); it isn't parsed by that resolver and falls back to being passed through as a literal (unreliable across browsers) — `backgroundColor` + `backgroundOpacity` is the supported way to get a tinted/transparent fill.
- Outline: `settings.style.borderWidth` (px) + `settings.style.borderColor`.
- Pill shape + compact sizing: `settings.style.borderRadius: 999`, small `fontSize`/`fontWeight`, `paddingTop/Bottom/Left/Right`, and `widthMode: 'center'` (or `'auto'`) + `maxWidth` so it doesn't stretch to the column's full width (a plain `heading`/`text` widget is full-width by default, same caveat as `callout`).

## Text & headings

| type | use for | key fields |
|---|---|---|
| `heading` | any `<h1>`–`<h3>`-level title | `content` = the text. `settings.style.fontSize/fontWeight/textAlign/textColor` |
| `text` | a short paragraph, subtitle, or plain description | `content` = plain text (no HTML) |
| `richtext` | a longer block with mixed formatting — multiple paragraphs, inline links, lists | `content` = HTML string. Renders via `RichTextBlock`/`prose-editor`-style CSS |
| `callout` | a highlighted note/warning/tip **box** — icon-in-a-square + bold title line + separate body paragraph (NOT a small pill/badge — see the badge/chip pattern above for that case) | `content` = body text, `title` = the bold heading line. `iconName`. `settings.style.backgroundColor` sets the tint. **Always full-width in its column by default — a `boxed` section does NOT shrink it.** If ever used for something narrower, set `settings.style.widthMode: 'center'` + `settings.style.maxWidth` (px) |
| `testimonial` | a quote/review with an attributed person | `content` = quote text. `customProps.author`, `customProps.role` |

## Media

| type | use for | key fields |
|---|---|---|
| `image` | a single photo/banner | `imageUrl`. `settings.style.borderRadius/shadow/objectFit/imageFrame` (`rounded`\|`square`\|`circle`) |
| `image-slider` | a carousel/slideshow of images | `customProps.images: string[]` (or `sliderSource`/`mediaFolder` for a media-library-backed slider — leave as static `images` for cloned content) |
| `video` | an embedded/uploaded video | `videoUrl`. `settings.style.videoAutoplay/videoLoop/videoMuted/videoControls/videoPoster/aspectRatio` |
| `icon` | a single decorative icon | `iconName` — must be one of the fixed valid keys listed at the top of this file, not an arbitrary lucide-react name |

## Cards, stats, structured content

| type | use for | key fields |
|---|---|---|
| `icon-box` | icon + title + description card (a feature/service tile) | `title`, `content` = description. `customProps.iconName/iconColor/iconSize/iconBgColor/titleColor/descColor/layout/cardAlign`, optional `customProps.buttonText/buttonUrl` |
| `stat-card` | a single "1200+ دانشجو" style stat | `customProps.prefix/suffix`, number lives in `content` or a dedicated numeric customProp — check `InspectorPanel.tsx` `stat-card` block before use |
| `counter` | an animated counting number | `content` = target number. `customProps.duration/prefix/suffix/numberColor/numberFontSize` |
| `accordion` | an FAQ / expandable list | `customProps.items: { question, answer }[]` |
| `pricing-table` | a plans/tiers comparison | `customProps.plans: {...}[]` |
| `divider` | a horizontal rule between content | `settings.style.borderColor/borderWidth` |
| `spacer` | pure vertical gap, no visible content | height usually via `settings.style` padding/margin only |

## Layout containers

| type | use for |
|---|---|
| `vertical-container` | group of sub-widgets stacked vertically inside one card/box (`customProps.children` holds nested widgets in some builds — prefer nesting via `ColumnBlock`/`subSections` at the column level instead, which is the primary nesting mechanism) |
| `horizontal-container` | same, arranged in a row |

**Preferred nesting mechanism**: a column's `blocks` array can contain `{ kind: 'section', section: SectionInstance }` entries — this is how "زیربلوک" (sub-blocks / nested sections) are actually built, not primarily via the container widgets. Use nested `SectionInstance`s inside a column when the source page has a visually distinct sub-region within a larger section (e.g. a bordered card grid inside a full-width section).

## Navigation & site structure

| type | use for | key fields |
|---|---|---|
| `nav-menu` | a local nav bar (brand + links) at the top of the page | `customProps.brand/brandColor/brandFontSize/brandPosition`, `customProps.items: {label, url}[]`, `customProps.menuPosition` |
| `navigator` | a list of posts/pages of a chosen content type | `customProps.postType/limit` |
| `child-pages` | auto-list of this page's sub-pages | `customProps.mode: 'tree'|'direct'`, `customProps.limit` |
| `map` | an embedded location map | Prefer `customProps.latitude`/`customProps.longitude` (numbers) — this builds a precise OpenStreetMap embed automatically, no API key needed. `customProps.embedUrl` is only a fallback used when latitude/longitude are absent. `customProps.address` is the caption text shown under the map. |
| `tabs` | a tab-switcher, each tab a full independent multi-column layout | `customProps.tabs: { id, label, section: SectionInstance }[]` — each tab's `section` is a real nested `SectionInstance` (columns/widgets/sub-sections), not a flat widget list. Built via the block picker + the "ویرایش محتوای این تب" mini page-builder modal in the Inspector — do not hand-author a tab's `section` content by copy-pasting a whole page's worth of nested JSON into `customProps` in one shot; keep it to what the source page's tab actually shows. |
| `interactive-map` | a map that switches between several pre-set locations (e.g. a campus picker) | `customProps.locations: { id, label, latitude?, longitude?, embedUrl?, address? }[]`. Same coordinate-first rule as `map`: set `latitude`/`longitude` per location for a precise embed; `embedUrl` is the manual fallback. This is the correct widget for "campus map with a switcher between buildings" style sections seen in cloned pages — don't downgrade that to a single static `map` widget when `interactive-map` exists. |
| `excel-table` | a searchable data table (name/role/phone-style directories, member lists, etc.) | `customProps.columns: string[]`, `customProps.rows: string[][]`, `customProps.enableSearch?: boolean` (default true). Normally populated by a real `.xlsx` upload in the Inspector, but when cloning a page you may construct `columns`/`rows` directly from the source page's real data (same as you'd otherwise bake into a `custom-html` table) — this is the correct widget for any "list/table of items with a search box" section, not `custom-html`. |
| `contact-info` | phone/email/address block | Renders a **fixed 4-row card**: تلفن, ایمیل, نشانی, ساعات کاری (`customProps.phone/email/address/workHours`), always all four, in that order — cannot be limited to a custom subset or relabeled. If the source shows only e.g. email+phone as two individual compact rows (not a 4-row card), don't force it into `contact-info` — use two `icon-box` widgets instead (`customProps.layout: 'row'`, `title` = label, `content` = value, padding tightened via `settings.style`) |
| `social-links` | row of social icons | `customProps.urls` |
| `share-buttons` | "share this page" row | `customProps.pageUrl` |
| `custom-html` | anything with no good match — raw HTML/embed | `content` = raw HTML string. Use as a last resort, not a default |

## Smart / dynamic — site-wide modules (this university's real data)

Only use these when the source page is genuinely showing this site's own live announcements/news/gallery/achievements/staff/files feed. **Never** invent a binding to make an external page's static content "dynamic."

| type | binds to | key `settings.binding` fields |
|---|---|---|
| `announcements-feed` | announcements module | `limit`, `categoryFilter`, `priorityFilter`, `openMode` |
| `news-feed` | news module | `limit`, `categoryFilter`, `displayMode`, `columnsCount` |
| `image-gallery` | media gallery | `limit`, `folderFilter` |
| `achievements-timeline` | achievements module | `limit` |
| `staff-directory` | faculty/staff directory | `limit`, `departmentFilter` |
| `file-manager` | document repository | `limit`, `folderFilter`, `fileType` |

## Dedicated-page blocks (`dp-*`)

Only relevant when the page being cloned is itself a dedicated-page layout (`layout_page` for an association/club/union/journal/professor type). These auto-bind to **whichever dedicated page the layout is currently rendering for** — there is no `dedicatedPageId` field to set; the binding is contextual, so cloning one of these onto a *different* target page type/page still works correctly without adjustment.

| type | shows |
|---|---|
| `dp-news` | that page's news items |
| `dp-announcements` | that page's announcements |
| `dp-journal-issues` | journal issue list (only meaningful for `student_journal`-type pages) |
| `dp-articles` | articles list |
| `dp-gallery` | photo gallery (`settings.binding.categoryFilter` = taxonomy slug) |
| `dp-events` | events list |
| `dp-members` | council/executive members roster |

Shared `settings.binding` fields across all `dp-*`: `limit`, `sortBy` (`'date_desc'`\|`'date_asc'`), `displayMode` (`'grid'`\|`'list'`), `columnsCount`. `dp-members` additionally uses `avatarPosition` (`'top'`\|`'right'`\|`'left'`\|`'card-right'`\|`'card-left'`) instead of `displayMode` to control its own layout.
