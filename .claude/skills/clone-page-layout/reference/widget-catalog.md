# Widget catalog — mapping HTML elements to Page Builder widgets

Condensed from `builderTypes.ts` (`WidgetType`, `WIDGET_TYPE_LABELS`) and `ComponentPickerModal.tsx`. For any `customProps` field not listed here, grep `frontend/src/apps/page-builder/InspectorPanel.tsx` for `selectedWidget.type === '<type>'` — that block is the authoritative shape.

## Text & headings

| type | use for | key fields |
|---|---|---|
| `heading` | any `<h1>`–`<h3>`-level title | `content` = the text. `settings.style.fontSize/fontWeight/textAlign/textColor` |
| `text` | a short paragraph, subtitle, or plain description | `content` = plain text (no HTML) |
| `richtext` | a longer block with mixed formatting — multiple paragraphs, inline links, lists | `content` = HTML string. Renders via `RichTextBlock`/`prose-editor`-style CSS |
| `callout` | a highlighted note/warning/tip box | `content` = text. `iconName`. `settings.style.backgroundColor` sets the tint. **Always full-width in its column by default — a `boxed` section does NOT shrink it.** To use it as a small centered pill/badge instead of a full-width bar, explicitly set `settings.style.widthMode: 'center'` + `settings.style.maxWidth` (px) on that widget instance |
| `testimonial` | a quote/review with an attributed person | `content` = quote text. `customProps.author`, `customProps.role` |

## Media

| type | use for | key fields |
|---|---|---|
| `image` | a single photo/banner | `imageUrl`. `settings.style.borderRadius/shadow/objectFit/imageFrame` (`rounded`\|`square`\|`circle`) |
| `image-slider` | a carousel/slideshow of images | `customProps.images: string[]` (or `sliderSource`/`mediaFolder` for a media-library-backed slider — leave as static `images` for cloned content) |
| `video` | an embedded/uploaded video | `videoUrl`. `settings.style.videoAutoplay/videoLoop/videoMuted/videoControls/videoPoster/aspectRatio` |
| `icon` | a single decorative icon | `iconName` (see `IconPicker.tsx`/`ICON_CHOICES` for valid names — stick to common lucide-react names like `sparkles`, `star`, `check-circle`, `graduation-cap`) |

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
| `map` | an embedded location map | `customProps.embedUrl` or `customProps.address` |
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
