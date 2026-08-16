# Dedicated Pages Module — دسترسی‌ها و مدیریت نقش‌ها

## Permission Model — مدل دسترسی‌ها

The Dedicated Pages Module implements a **two-tier permission system**:

### 1. System-Level Permissions (Backend/Laravel)
Global permissions that control access to the module itself:

| Permission | Description | دسترسی |
|-----------|-------------|--------|
| `dedicated-pages.view` | View module and list pages | مشاهده ماژول و صفحات |
| `dedicated-pages.create` | Create new dedicated pages | ایجاد صفحات جدید |
| `dedicated-pages.edit` | Edit existing pages | ویرایش صفحات موجود |
| `dedicated-pages.delete` | Delete pages | حذف صفحات |
| `dedicated-pages.publish` | Publish/unpublish pages | انتشار و لغو انتشار |
| `dedicated-pages.manage-content` | Manage page content items | مدیریت محتوای صفحات |
| `dedicated-pages.manage-access` | Manage user access to pages | مدیریت دسترسی کاربران |

### 2. Page-Level Permissions (Database)
Per-page access controls for individual pages:

```typescript
interface AuthorizedUser {
  userId: string;
  name: string;
  email: string;
  accessLevel: 'full_manager' | 'content_editor' | 'viewer';
  canPublish: boolean;
  canManageTaxonomies: boolean;
  canManageModules: boolean;
}
```

## Access Levels — سطح‌های دسترسی

### Full Manager (مدیر کامل)
- **Page Owner Default**: Page creator automatically has this level
- **Capabilities**:
  - View all page content
  - Create and edit content
  - Manage page settings
  - Manage user access
  - Publish/unpublish
  - Configure taxonomies and modules
  - Delete content
  - Access all page functions

### Content Editor (ویرایشگر محتوا)
- **Typical Users**: Content creators, news writers
- **Capabilities**:
  - View all page content
  - Create new content
  - Edit own content (and others if permitted)
  - Upload media
  - Manage taxonomies (if enabled)
  - Cannot publish (unless explicitly granted)
  - Cannot manage page settings
  - Cannot manage other users' access

### Viewer (بیننده)
- **Typical Users**: Reviewers, stakeholders
- **Capabilities**:
  - View published content
  - View page settings
  - Cannot create or edit
  - Cannot delete
  - View-only access to everything

## Role-Based Access Control (RBAC) — کنترل دسترسی بر اساس نقش

### System Roles
The admin system defines these roles with corresponding default permissions:

| Role | Module Access | Edit Pages | Delete Pages | Manage All | نقش |
|------|---------------|-----------|-------------|-----------|------|
| **Admin** | Full Access | ✅ All | ✅ All | ✅ Yes | مدیر کل |
| **Editor** | Full Access* | ✅ Assigned | ⛔ Own Only | ⛔ No | ویرایشگر |
| **User** | Limited | ⛔ No | ⛔ No | ⛔ No | کاربر عام |
| **Support** | Limited | ⛔ No | ⛔ No | ⛔ No | پشتیبانی |

*With backend permission `dedicated-pages.view`

### Permission Inheritance
```
System Admin
  └─ Can access all pages regardless of page-level permissions
     ├─ Can grant/revoke any page-level access
     └─ Can delete any page

System Editor (with dedicated-pages.* permissions)
  └─ Can create and edit assigned pages
     ├─ Can manage page-level access for own pages
     └─ Cannot delete pages (owner only can)

Page Owner (any system role)
  └─ Full control over their page regardless of system role
     ├─ Can assign access to other users
     └─ Only they can delete their page

Assigned User (granted via page authorization)
  └─ Access level determined by page authorization
     ├─ Full Manager: Nearly same as owner
     ├─ Content Editor: Can create/edit content
     └─ Viewer: Read-only access
```

## Setup Instructions — راهنمای تنظیم

### 1. Backend (Laravel) Setup
Add permissions to your `database/seeders/PermissionSeeder.php`:

```php
<?php

namespace Database\Seeders;

use Spatie\Permission\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Dedicated Pages Permissions
        Permission::firstOrCreate(['name' => 'dedicated-pages.view']);
        Permission::firstOrCreate(['name' => 'dedicated-pages.create']);
        Permission::firstOrCreate(['name' => 'dedicated-pages.edit']);
        Permission::firstOrCreate(['name' => 'dedicated-pages.delete']);
        Permission::firstOrCreate(['name' => 'dedicated-pages.publish']);
        Permission::firstOrCreate(['name' => 'dedicated-pages.manage-content']);
        Permission::firstOrCreate(['name' => 'dedicated-pages.manage-access']);
    }
}
```

### 2. Assign to Roles
In your role seeder or admin panel:

```php
// For Editor role
$editorRole = Role::firstOrCreate(['name' => 'editor']);
$editorRole->givePermissionTo([
    'dedicated-pages.view',
    'dedicated-pages.create',
    'dedicated-pages.edit',
    'dedicated-pages.manage-content',
]);

// For Admin role (all permissions)
$adminRole = Role::firstOrCreate(['name' => 'admin']);
$adminRole->givePermissionTo(Permission::all());
```

### 3. Frontend Permission Checks
Use the utility functions in `utils.ts` to check permissions:

```typescript
import {
  canViewDedicatedPagesModule,
  canCreateDedicatedPage,
  canEditDedicatedPage,
  canPublishPage,
  checkPageAccessLevel
} from '@/src/apps/dedicated_pages/utils';

// In your component
export function DedicatedPagesAccess() {
  const { currentUser } = useAdmin();
  
  // Check module access
  if (!canViewDedicatedPagesModule(currentUser)) {
    return <AccessDenied />;
  }

  // Check creation capability
  const canCreate = canCreateDedicatedPage(currentUser);

  // Check page-specific access
  const accessLevel = checkPageAccessLevel(currentUser, page);
  
  // Filter pages user can edit
  const editablePages = getEditablePages(allPages, currentUser);
}
```

## Access Scenarios — سناریوهای دسترسی

### Scenario 1: Admin Creating a Page
1. Admin navigates to Dedicated Pages module
2. Clicks "New Page"
3. Wizard opens (always full access)
4. Admin creates page
5. Admin can edit, publish, delete, and manage access

### Scenario 2: Dean Assigned to Faculty Profile
1. Dean has "Editor" system role
2. Faculty profile page created by Admin
3. Admin assigns Dean as "Full Manager" to that page
4. Dean can:
   - View and edit page details
   - Create/edit content
   - Manage other users' access
   - Publish (if permitted by admin)
5. Dean cannot:
   - Delete page (admin only)
   - Manage other pages without explicit access

### Scenario 3: Content Writer on Science Club Page
1. Science Club page created by club president
2. Club president assigns Writer as "Content Editor"
3. Writer can:
   - View page structure and settings
   - Create and edit content (news, events, etc.)
   - Upload media
4. Writer cannot:
   - Change page settings
   - Manage user access
   - Publish (unless explicitly granted)
   - Delete anything

### Scenario 4: Super Admin Audit
1. Super Admin has access to ALL pages
2. Can view even private/draft pages
3. Can see all user access assignments
4. Can revoke anyone's access
5. Can delete pages

## Permission Checks in Components

### Using Utility Functions

```typescript
// Check if current user can view module
if (!canViewDedicatedPagesModule(user)) {
  return <div>نیاز به دسترسی</div>;
}

// Check if user can create
const createButton = canCreateDedicatedPage(user) ? (
  <button onClick={createNew}>صفحه جدید</button>
) : null;

// Check page-specific edit access
const isEditable = canEditDedicatedPage(user, page);

// Get user's role on this page
const myRole = checkPageAccessLevel(user, page);

// Filter accessible pages
const myPages = filterAccessiblePages(allPages, user);
```

### Inline Permission Checks

```typescript
// One-off check
if (user.role === 'admin' || 
    user.permissions?.includes('dedicated-pages.delete')) {
  // Show delete button
}

// Check ownership
if (user.username === page.owner.id || user.email === page.owner.email) {
  // Show owner-only options
}
```

## Database Schema Reference

### dedicated_pages Table
```sql
CREATE TABLE dedicated_pages (
    id VARCHAR(36) PRIMARY KEY,
    page_type VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    status ENUM('active', 'inactive', 'draft', 'maintenance'),
    publish_status ENUM('published', 'draft', 'scheduled'),
    owner_id VARCHAR(36) FOREIGN KEY,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### page_authorizations Table
```sql
CREATE TABLE page_authorizations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    page_id VARCHAR(36) FOREIGN KEY,
    user_id VARCHAR(36) FOREIGN KEY,
    access_level ENUM('full_manager', 'content_editor', 'viewer'),
    can_publish BOOLEAN DEFAULT false,
    can_manage_taxonomies BOOLEAN DEFAULT false,
    can_manage_modules BOOLEAN DEFAULT false,
    assigned_at TIMESTAMP,
    assigned_by VARCHAR(36),
    UNIQUE(page_id, user_id)
);
```

## Testing Permissions

### Unit Tests
```typescript
describe('canEditDedicatedPage', () => {
  it('should allow admin to edit any page', () => {
    const admin = { role: 'admin' };
    const page = { owner: { id: 'other-user' } };
    expect(canEditDedicatedPage(admin, page)).toBe(true);
  });

  it('should allow page owner to edit', () => {
    const user = { role: 'editor', username: 'owner-user' };
    const page = { owner: { id: 'owner-user' } };
    expect(canEditDedicatedPage(user, page)).toBe(true);
  });

  it('should check authorization list', () => {
    const user = { role: 'editor', username: 'other-user' };
    const page = {
      owner: { id: 'owner-user' },
      authorizedUsers: [{
        userId: 'other-user',
        accessLevel: 'content_editor'
      }]
    };
    expect(canEditDedicatedPage(user, page)).toBe(true);
  });
});
```

## Troubleshooting — رفع مشکلات

| Issue | Cause | Solution |
|-------|-------|----------|
| Module not visible | Missing `dedicated-pages.view` permission | Add permission to user's role in backend |
| Can't create page | Missing `dedicated-pages.create` permission | Grant permission or promote to Admin |
| Can't edit own page | System role restriction | Assign higher role or add explicit page access |
| Can't publish | No `dedicated-pages.publish` permission | Grant permission or ask owner to grant |
| Access denied for delegated user | Wrong access level | Check page_authorizations table for `access_level` value |

## Best Practices — بهترین روش‌ها

1. **Principle of Least Privilege**: Only grant necessary permissions
2. **Regular Audits**: Periodically review page authorizations
3. **Clear Ownership**: Always assign a clear owner/manager for each page
4. **Role Clarity**: Maintain consistent role definitions across the system
5. **Access Logs**: Track who accessed/modified what and when
6. **Backup Contacts**: Have backup managers for critical pages
7. **Gradual Delegation**: Start with limited access, expand as trust builds
