# Dedicated Pages Module — Quick Start Guide

## ✅ Migration Complete

The "Dedicated Pages" module from the yazdrud demo_frontend has been successfully migrated to the sau/frontend admin system.

## 📁 Module Location

```
E:\wamp64\www\sau\frontend\src\apps\dedicated_pages\
├── index.tsx                      ← App export point
├── api.ts                         ← Backend API functions (112 lines)
├── utils.ts                       ← Permission & helper functions (259 lines)
├── DedicatedPagesStudio.tsx       ← Main CMS interface
├── DedicatedPagesStudio.tsx       ← Page listing & management
├── PageWizardModal.tsx            ← Page creation wizard
├── PageContentModerationModal.tsx ← Content review UI
├── PageLiveWebsiteView.tsx        ← Live preview
├── IsolatedManagerPortal.tsx      ← Manager-only view
├── types.ts                       ← TypeScript interfaces
├── mockData.ts                    ← Sample data & page types
├── README.md                      ← Comprehensive documentation
└── PERMISSIONS.md                 ← Access control guide
```

## 🔗 Integration Points

### 1. App Registry (apps/index.tsx)
✅ **Already Updated**
- Added to `AppModules` lazy loading registry
- 4 moduleType aliases registered:
  - `'dedicated-pages'` (primary)
  - `'dedicated_pages'`
  - `'special-pages'`
  - `'portal-pages'`

### 2. Access via Module Type
```typescript
// In your admin system, reference by:
moduleType: 'dedicated-pages'
// or any of the aliases above
```

### 3. Permission System
The module implements Spatie Laravel permissions:
- `dedicated-pages.view` — Access module
- `dedicated-pages.create` — Create pages
- `dedicated-pages.edit` — Edit pages
- `dedicated-pages.delete` — Delete pages
- `dedicated-pages.publish` — Publish/unpublish
- `dedicated-pages.manage-content` — Manage content
- `dedicated-pages.manage-access` — Manage user access

## 🎯 Key Features Available

### Page Management
- ✅ 7 page types supported (scientific associations, clubs, unions, journals, faculty profiles, surveys, events)
- ✅ Step-by-step wizard for page creation
- ✅ Multiple layout templates
- ✅ Drag-and-drop configuration

### Content Organization
- ✅ Multi-type content support (news, events, documents, gallery, research articles)
- ✅ Taxonomy/category management
- ✅ Content moderation workflow
- ✅ Live preview with actual website view

### Access Control
- ✅ Three access levels per page: Full Manager, Content Editor, Viewer
- ✅ User-level permissions assignment
- ✅ Page ownership tracking
- ✅ Delegation capabilities for non-admin users

### Additional
- ✅ SEO configuration (meta tags, canonical URLs, OG tags)
- ✅ Contact information management
- ✅ Display settings and visibility controls
- ✅ Multi-language support (Farsi/English)
- ✅ RTL layout support
- ✅ Responsive design with Tailwind CSS

## 🚀 Getting Started

### For Admin
1. Ensure backend has `dedicated-pages.*` permissions configured
2. Assign permissions to user roles
3. Access module via moduleType: `'dedicated-pages'`
4. Create first page using Page Wizard
5. Invite managers and editors

### For End Users
1. Receive page access assignment from admin
2. View module based on their access level
3. Create/edit content within their assigned pages
4. Submit for moderation/publishing

### For Integration
```typescript
// In your admin routing/menu system:
import { resolveApp } from '@/src/apps';

const appName = resolveApp('dedicated-pages'); // Returns 'dedicated-pages'
const Component = AppModules[appName]; // Loads the component

// Render with module wrapper:
<ModuleRenderer moduleType="dedicated-pages" />
```

## 📚 Documentation

### Main Documentation
- **README.md** — Complete module overview, features, and usage
- **PERMISSIONS.md** — Detailed access control documentation

### Code Documentation
- **api.ts** — Backend API integration functions (10+ endpoints)
- **utils.ts** — Permission checking utilities (20+ helper functions)
- **types.ts** — Complete TypeScript interface definitions

## 🔧 Backend Requirements

### Database Tables Required
1. `dedicated_pages` — Main page records
2. `page_authorizations` — User access assignments
3. `page_contents` — Page content items (news, events, etc.)
4. `page_taxonomies` — Categories/tags for pages

### API Endpoints Expected
- `GET/POST /api/dedicated-pages` — Page CRUD
- `GET/POST /api/dedicated-pages/{pageId}/contents` — Content management
- `POST /api/dedicated-pages/{pageId}/authorizations` — Permission management
- `POST /api/dedicated-pages/{id}/publish` — Publishing

See **PERMISSIONS.md** for complete database schema reference.

## ✨ What's Different from Demo

While the core components are from the demo, the following enhancements were added:

1. **api.ts** — Full backend integration layer
2. **utils.ts** — Permission checking and helper utilities
3. **Documentation** — Comprehensive README and PERMISSIONS guide
4. **Type Safety** — Proper TypeScript integration
5. **Integration** — Registered in app registry for admin system

## 🎓 Migration Source

Original components from:
```
E:\wamp64\www\yazdrud\demo_frontend\src\components\dedicated_pages\
```

Successfully migrated to:
```
E:\wamp64\www\sau\frontend\src\apps\dedicated_pages\
```

## ⚠️ Important Notes

1. **Mock Data**: The module currently uses `mockData.ts` for demo data
   - Replace `INITIAL_DEDICATED_PAGES` and `INITIAL_PAGE_CONTENTS` with API calls
   - Update `DedicatedPagesStudio.tsx` to use API functions from `api.ts`

2. **Backend API**: Implement the endpoints referenced in `api.ts`
   - Follow Laravel/PHP conventions
   - Use Spatie permissions for authorization
   - Validate all inputs server-side

3. **User Integration**: Connect to your user management system
   - Map user IDs/emails correctly
   - Ensure user avatars load properly
   - Sync role information

4. **Search and Filters**: Some search/filter functionality may need backend support
   - Implement FTS (Full Text Search) for large datasets
   - Add database indexes for performance

## 🔄 Next Steps

1. **Backend Implementation**
   - Create Laravel models and migrations
   - Implement API endpoints
   - Set up permissions in seeder

2. **Testing**
   - Test permission system thoroughly
   - Verify modal workflows
   - Test with mock data first

3. **UI Integration**
   - Add menu entries in admin dashboard
   - Style to match admin theme
   - Test responsive layouts

4. **User Training**
   - Document page creation process
   - Explain permission model
   - Provide troubleshooting guide

## 📞 Support

For questions or issues:
1. Review **README.md** for feature overview
2. Check **PERMISSIONS.md** for access control help
3. Review **api.ts** for backend integration details
4. Check **utils.ts** for available helper functions

---

**Migration Status**: ✅ Complete  
**Date**: 2026-08-15  
**Version**: 1.0.0
