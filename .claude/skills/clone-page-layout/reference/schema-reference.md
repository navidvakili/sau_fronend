# SmartPageSchema — structural reference

Condensed from `frontend/src/apps/page-builder/builderTypes.ts`. **Re-read that file before relying on this** — it is the live source and this is a snapshot for quick orientation only.

## Shape

```
SmartPageSchema
├─ id: string                      // e.g. "page-1787081508482"
├─ title: string
├─ slug: string                    // kebab-case, ^[a-z0-9-]+$
├─ status: 'draft' | 'published'   // always 'draft' for generated pages
├─ seo?: { title?, description?, keywords?, og_image? }
├─ createdAt / updatedAt: string
├─ version: number                 // start at 1
├─ globalStyles: GlobalStyles
├─ sections: SectionInstance[]
└─ versionHistory: PageVersion[]   // can be [] for a fresh page

GlobalStyles
├─ primaryColor / secondaryColor / accentColor / backgroundColor / textColor: string (hex)
├─ fontFamily: string              // e.g. "Vazirmatn, sans-serif"
├─ containerMaxWidth: number       // px, e.g. 1240
├─ baseRadius: number              // px, e.g. 16
└─ showSiteNav?: boolean           // false hides the site's global header for this page (rare — default true/omit)

SectionInstance
├─ id: string
├─ name: string                    // internal label, Persian, describes the section's purpose
├─ layout: 'full-width' | 'boxed'
├─ position? / zIndex?             // usually omit
├─ backgroundColor? / backgroundGradient? / backgroundOpacity?
├─ backgroundImage? / backgroundPosition? / backgroundSize? / backgroundRepeat?
├─ bookmark?                       // anchor id, usually omit
├─ paddingTop: number              // REQUIRED, not optional
├─ paddingBottom: number           // REQUIRED, not optional
├─ paddingLeft? / paddingRight? / marginTop? / marginBottom?
├─ boxShadow?                      // 'none'|'sm'|'md'|'lg'|'xl' or raw CSS
├─ borderRadius?: { topLeft?, topRight?, bottomLeft?, bottomRight? }
├─ columns: ColumnInstance[]       // REQUIRED, at least one
├─ visibility: { desktop: true, tablet: true, mobile: true }   // REQUIRED
└─ conditionalDisplay: { enabled: false }                      // REQUIRED

ColumnInstance
├─ id: string
├─ width: number                   // 1–12, desktop/fallback width; widths in one section's columns should sum to ≤12
├─ widths?: { desktop, tablet?, mobile? }   // per-breakpoint override, usually omit (mobile defaults to 12 = stacked)
├─ widgets: WidgetInstance[]       // flat list — see `blocks` below for the authoritative order
├─ subSections?: SectionInstance[] // nested sections = "زیربلوک" (sub-blocks)
├─ blocks?: ColumnBlock[]          // { kind: 'widget', widget } | { kind: 'section', section } — if present, THIS defines render order; keep it in sync with widgets/subSections
└─ style?: { backgroundColor?, padding?, borderRadius?, borderWidth?, borderColor? }

WidgetInstance
├─ id: string
├─ type: WidgetType                // see widget-catalog.md for the full list
├─ title: string                   // internal label, shown on canvas — not always rendered publicly
├─ content: string                 // primary text/HTML value — meaning varies per type (see catalog)
├─ imageUrl? / videoUrl? / buttonUrl? / buttonText? / iconName?
└─ settings: {
     style: WidgetStyle,           // ALWAYS include, even if mostly empty {}
     binding: WidgetDataBinding,   // ALWAYS include; { dataSource: 'none' } for static widgets
     visibility: { desktop: true, tablet: true, mobile: true },   // ALWAYS include
     conditionalDisplay: { enabled: false },                       // ALWAYS include
     customProps?: Record<string, any>   // widget-type-specific extra fields, see catalog
   }
```

## Simplest possible valid example (one section, two columns, three widgets)

```json
{
  "id": "page-1787200000000",
  "title": "دربارهٔ ما",
  "slug": "about-cloned",
  "status": "draft",
  "seo": { "title": "دربارهٔ ما", "description": "" },
  "createdAt": "2026-08-21",
  "updatedAt": "2026-08-21",
  "version": 1,
  "globalStyles": {
    "primaryColor": "#0d9488",
    "secondaryColor": "#4f46e5",
    "accentColor": "#f59e0b",
    "backgroundColor": "#ffffff",
    "textColor": "#1e293b",
    "fontFamily": "Vazirmatn, sans-serif",
    "containerMaxWidth": 1240,
    "baseRadius": 16
  },
  "versionHistory": [],
  "sections": [
    {
      "id": "sec-hero",
      "name": "بخش هدر",
      "layout": "boxed",
      "backgroundColor": "#0f172a",
      "paddingTop": 48,
      "paddingBottom": 48,
      "visibility": { "desktop": true, "tablet": true, "mobile": true },
      "conditionalDisplay": { "enabled": false },
      "columns": [
        {
          "id": "col-1",
          "width": 7,
          "widgets": [
            {
              "id": "w-title",
              "type": "heading",
              "title": "عنوان اصلی",
              "content": "متن عنوان اینجا",
              "settings": {
                "style": { "textColor": "#ffffff", "fontSize": "32px", "fontWeight": "900", "textAlign": "right" },
                "binding": { "dataSource": "none" },
                "visibility": { "desktop": true, "tablet": true, "mobile": true },
                "conditionalDisplay": { "enabled": false }
              }
            },
            {
              "id": "w-btn",
              "type": "button",
              "title": "دکمه",
              "content": "دکمه",
              "buttonText": "بیشتر بدانید",
              "buttonUrl": "#",
              "settings": {
                "style": { "backgroundColor": "#0d9488", "textColor": "#ffffff", "borderRadius": 12, "paddingTop": 12, "paddingBottom": 12, "paddingLeft": 24, "paddingRight": 24 },
                "binding": { "dataSource": "none" },
                "visibility": { "desktop": true, "tablet": true, "mobile": true },
                "conditionalDisplay": { "enabled": false }
              }
            }
          ]
        },
        {
          "id": "col-2",
          "width": 5,
          "widgets": [
            {
              "id": "w-img",
              "type": "image",
              "title": "تصویر",
              "content": "",
              "imageUrl": "/placeholder-news.svg",
              "settings": {
                "style": { "borderRadius": 20, "shadow": "lg" },
                "binding": { "dataSource": "none" },
                "visibility": { "desktop": true, "tablet": true, "mobile": true },
                "conditionalDisplay": { "enabled": false }
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## Backend API contract (`backend/app/Http/Controllers/Api/SmartPageController.php`)

All routes in `backend/routes/api/smart-pages.php`, staff-authenticated (`auth:api`, Passport bearer token).

**Create** — `POST /api/smart-pages`
```
title      required|string|max:300
slug       required|string|max:191|regex:/^[a-z0-9\-]+$/|unique:smart_pages,slug
status     sometimes|in:published,draft   — forced to 'draft' server-side unless the acting user has 'page-builder.approve'
language   nullable|string|max:10          — omit to use request default
seo        nullable|array
schema     required|array                 — the SmartPageSchema object, stored opaquely (no nested validation)
parent_id  nullable|integer|exists:smart_pages,id
sort_order nullable|integer|min:0
```

**Update** — `PUT /api/smart-pages/{id}` — same fields, all `sometimes`.

**Read** — `GET /api/smart-pages/{id}` (staff), or `GET /api/smart-pages/slug/{slug}/public` (no auth, published only).

**List** — `GET /api/smart-pages` (staff, paginated).

`schema` round-trips as a fully opaque JSON blob — anything added to `GlobalStyles`/`WidgetDataBinding`/etc. in `builderTypes.ts` works immediately with zero backend changes, and conversely the backend will accept a malformed schema without complaint (validation happens only client-side, in the Page Builder UI itself) — so get the shape right by hand.
