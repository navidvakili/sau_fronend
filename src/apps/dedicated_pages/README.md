# Dedicated Pages Module — صفحات اختصاصی و مستقل

This module provides a comprehensive CMS for managing specialized portal pages within the university system.

## Overview — خلاصه

The **Dedicated Pages Module** enables creation and management of:
- Scientific associations (انجمن‌های علمی)
- Cultural clubs (کانون‌های فرهنگی و هنری)
- Student unions (تشکل‌های دانشجویی)
- Student journals (نشریات دانشجویی)
- Faculty member profiles (صفحات اختصاصی اساتید)
- Interactive surveys (پرسشنامه‌های تعاملی)
- Special events (همایش‌ها و رویدادهای اختصاصی)

## Features — ویژگی‌ها

### Page Management
- **Page Creation Wizard**: Step-by-step setup for different page types
- **Layout Customization**: Multiple layout templates with drag-and-drop configuration
- **Content Moderation**: Review and approve content before publication
- **Live Preview**: Real-time website view of published pages

### Content Organization
- **Taxonomies**: Category management (tags, topics, etc.)
- **Multi-type Content**: Support for news, events, documents, galleries, research articles
- **Document Repository**: File upload and versioning
- **Gallery Integration**: Image management with tags and descriptions

### Access Control
Three access levels per page:
- **Full Manager** (مدیر کامل): Full control over page, content, and user access
- **Content Editor** (ویرایشگر محتوا): Can create and edit content
- **Viewer** (بیننده): Read-only access

### Additional Features
- **SEO Configuration**: Meta tags, canonical URLs, Open Graph settings
- **Contact Information**: Phone, email, social media links
- **Display Settings**: Control visibility in navigation and directories
- **Page Ownership**: Assign page owners with credentials
- **Multi-language Support**: Full RTL/LTR support with Farsi/English

## Module Access — دسترسی‌های ماژول

### Required Permissions
To access the Dedicated Pages module, users need:
- `dedicated-pages.view` — View module and list pages
- `dedicated-pages.create` — Create new pages
- `dedicated-pages.edit` — Edit existing pages
- `dedicated-pages.delete` — Delete pages
- `dedicated-pages.publish` — Publish/unpublish pages
- `dedicated-pages.manage-content` — Manage page content

### User Roles with Access
- **Admin** (مدیر کل): Full access, can manage all pages
- **Editor** (ویرایشگر): Can create/edit pages and content (configurable)

### Page-Level Permissions
Individual pages can grant access to specific users regardless of system role:
```typescript
interface AuthorizedUser {
  userId: string;
  name: string;
  email: string;
  accessLevel: 'full_manager' | 'content_editor' | 'viewer';
  canPublish: boolean;
}
```

## Integration with Admin System — یکپارچگی با سیستم مدیریت

### Module Registration
The module is registered in `src/apps/index.tsx`:
```typescript
AppModules: {
  'dedicated-pages': lazy(() => import('./dedicated_pages')),
}

moduleToAppMap: {
  'dedicated-pages': 'dedicated-pages',
  'dedicated_pages': 'dedicated-pages',
  'special-pages': 'dedicated-pages',
  'portal-pages': 'dedicated-pages',
}
```

### Accessing the Module
To access the Dedicated Pages module in the admin system:
1. Ensure user has appropriate permissions in backend
2. Use the module type `'dedicated-pages'` or `'special-pages'`
3. The component will render in the ModuleRenderer framework

### Menu Integration (Optional)
To add menu entries for dedicated pages in the admin dashboard/sidebar:
```typescript
// In your admin menu definition
{
  id: 'dedicated-pages',
  label: 'صفحات اختصاصی',
  icon: 'Sparkles',
  moduleType: 'dedicated-pages',
  permissions: ['dedicated-pages.view'],
  order: 8
}
```

## Component Structure — ساختار کامپوننت‌ها

### Main Components
- **DedicatedPagesStudio.tsx** — Main CMS interface with list, filters, and controls
- **DedicatedPagesStudio.tsx** — Page listing with search, filter, and sort
- **PageWizardModal.tsx** — Step-by-step page creation form
- **PageLiveWebsiteView.tsx** — Live preview of published pages
- **PageContentModerationModal.tsx** — Content review and approval interface
- **IsolatedManagerPortal.tsx** — Restricted view for page managers

### Supporting Files
- **types.ts** — TypeScript interfaces for all data models
- **mockData.ts** — Sample data and page type registry
- **api.ts** — Backend API integration functions

## Usage — نحوه استفاده

### Creating a Page
1. Open Dedicated Pages module
2. Click "+" button to open Page Wizard
3. Select page type
4. Fill in basic information (title, slug, description)
5. Configure layout and design
6. Add content (if applicable)
7. Set up access permissions
8. Review and publish

### Managing Content
1. Select a page from the list
2. Open content moderation modal
3. Review pending content
4. Approve or reject items
5. Publish when ready

### Accessing as Page Manager
Non-admin page managers see an "Isolated Manager Portal" view:
- Only their assigned pages are visible
- Full editing capabilities for assigned page
- Limited moderation and publishing options

## API Endpoints — نقاط پایانی API

### Pages
- `GET /api/dedicated-pages` — List all pages (with filters)
- `GET /api/dedicated-pages/{id}` — Get page details
- `POST /api/dedicated-pages` — Create new page
- `PUT /api/dedicated-pages/{id}` — Update page
- `DELETE /api/dedicated-pages/{id}` — Delete page
- `POST /api/dedicated-pages/{id}/publish` — Publish page
- `POST /api/dedicated-pages/{id}/unpublish` — Unpublish page

### Page Content
- `GET /api/page-contents?pageId={pageId}` — List page contents
- `POST /api/page-contents` — Create content
- `PUT /api/page-contents/{id}` — Update content
- `DELETE /api/page-contents/{id}` — Delete content

### Permissions
- `PUT /api/dedicated-pages/{id}/authorizations` — Update user access

## Data Types — انواع داده

See `types.ts` for complete type definitions including:
- `PageType` — Enum of available page types
- `DedicatedPage` — Main page object with all settings
- `PageContentItem` — Content item (news, event, document, etc.)
- `PageLayoutConfig` — Layout and design settings
- `PageTaxonomy` — Category/tag definitions
- `ProfessorProfileData` — Special data for faculty pages

## Styling & Theming — سبک و تم‌بندی

The module inherits admin system styling from `globals.css`:
- Uses Tailwind CSS utility classes
- Follows admin light theme with navy/blue accent colors
- Supports RTL layout with Vazirmatn font
- Motion animations with motion/react library

## Testing — آزمایشی

The `mockData.ts` file contains:
- Sample page instances for each type
- Initial page content items
- Page type registry with categories and settings
- Mock user personas for testing different access levels

To test with mock data, the component uses `INITIAL_DEDICATED_PAGES` and `INITIAL_PAGE_CONTENTS` for demo mode.

## Future Enhancements — بهبودی‌های آتی

Potential extensions to the module:
- Workflow management (draft → review → publish)
- Scheduled publishing
- Version history and rollback
- Content templates
- Advanced analytics
- API rate limiting and caching
- Batch operations
- Content migration tools
