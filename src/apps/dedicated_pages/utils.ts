// ============================================================
// Dedicated Pages Utils — توابع کمکی و بررسی‌های دسترسی
// ============================================================

import type { User } from '@/src/shared-types';
import { PUBLIC_SITE_URL } from '@/src/shared-constants';
import type { DedicatedPage, AuthorizedUser, AccessLevel, PageType } from './types';

/**
 * پیشوند مسیر عمومی هر نوع صفحه اختصاصی در سایت عمومی (Next.js).
 * این مقادیر باید همواره با مسیرهای واقعی زیر public/src/app هم‌راستا بمانند:
 * associations/[slug]، clubs/[slug]، unions/[slug]، journals/[slug]، professors/[slug]
 */
export const DEDICATED_PAGE_TYPE_URL_PREFIXES: Record<PageType, string> = {
  scientific_association: 'associations',
  cultural_club: 'clubs',
  student_union: 'unions',
  student_journal: 'journals',
  faculty_member: 'professors',
  interactive_survey: 'surveys',
  special_event: 'events'
};

/**
 * تولید آدرس کامل و واقعی صفحه اختصاصی در سایت عمومی
 * (بر اساس نوع صفحه و اسلاگ آن) — مثال: /journals/student-journal-newsletter
 */
export function getDedicatedPagePublicPath(pageType: PageType, slug: string): string {
  const prefix = DEDICATED_PAGE_TYPE_URL_PREFIXES[pageType] || 'pages';
  const cleanSlug = (slug || '').trim() || 'my-page';
  return `/${prefix}/${cleanSlug}`;
}

/**
 * آدرس کامل (با دامنه سایت عمومی) صفحه اختصاصی
 */
export function getDedicatedPagePublicUrl(pageType: PageType, slug: string): string {
  return `${PUBLIC_SITE_URL}${getDedicatedPagePublicPath(pageType, slug)}`;
}

/**
 * بررسی اینکه کاربر می‌تواند ماژول صفحات اختصاصی را مشاهده کند
 */
export function canViewDedicatedPagesModule(user: User): boolean {
  return (
    user.permissions?.includes('dedicated-pages.view') ||
    user.role === 'admin'
  );
}

/**
 * بررسی اینکه کاربر می‌تواند صفحات جدید بسازد
 */
export function canCreateDedicatedPage(user: User): boolean {
  return (
    user.permissions?.includes('dedicated-pages.create') ||
    user.role === 'admin'
  );
}

/**
 * بررسی اینکه کاربر می‌تواند صفحه را ویرایش کند
 */
export function canEditDedicatedPage(user: User, page?: DedicatedPage): boolean {
  if (user.role === 'admin') return true;

  if (!page) {
    return user.permissions?.includes('dedicated-pages.edit') || false;
  }

  // Check if user is the owner
  if (page.owner.id === user.username || page.owner.email === user.email) {
    return true;
  }

  // Check if user is in authorized users with appropriate access
  return checkPageAccessLevel(user, page) in ['full_manager', 'content_editor'];
}

/**
 * بررسی اینکه کاربر می‌تواند صفحه را حذف کند
 */
export function canDeleteDedicatedPage(user: User, page?: DedicatedPage): boolean {
  if (user.role === 'admin') return true;

  if (!page) {
    return user.permissions?.includes('dedicated-pages.delete') || false;
  }

  // Only page owner and admins can delete
  return (
    user.username === page.owner.id ||
    user.email === page.owner.email ||
    user.role === 'admin'
  );
}

/**
 * بررسی اینکه کاربر می‌تواند صفحه را منتشر کند
 */
export function canPublishPage(user: User, page?: DedicatedPage): boolean {
  if (user.role === 'admin') return true;

  if (!page) {
    return user.permissions?.includes('dedicated-pages.publish') || false;
  }

  const accessLevel = checkPageAccessLevel(user, page);
  return (
    user.username === page.owner.id ||
    user.email === page.owner.email ||
    (accessLevel === 'full_manager')
  );
}

/**
 * بررسی اینکه کاربر می‌تواند محتوای صفحه را مدیریت کند
 */
export function canManagePageContent(user: User, page?: DedicatedPage): boolean {
  if (user.role === 'admin') return true;

  if (!page) {
    return user.permissions?.includes('dedicated-pages.manage-content') || false;
  }

  const accessLevel = checkPageAccessLevel(user, page);
  return (
    user.username === page.owner.id ||
    user.email === page.owner.email ||
    accessLevel in ['full_manager', 'content_editor']
  );
}

/**
 * بررسی اینکه کاربر می‌تواند دسترسی‌های صفحه را مدیریت کند
 */
export function canManagePageAccess(user: User, page?: DedicatedPage): boolean {
  if (user.role === 'admin') return true;

  if (!page) {
    return user.permissions?.includes('dedicated-pages.manage-access') || false;
  }

  // Only owner and full_manager can manage access
  return (
    user.username === page.owner.id ||
    user.email === page.owner.email ||
    checkPageAccessLevel(user, page) === 'full_manager'
  );
}

/**
 * تعیین سطح دسترسی کاربر برای یک صفحه
 * برمی‌گرداند: 'admin' | 'full_manager' | 'content_editor' | 'viewer' | 'none'
 */
export function checkPageAccessLevel(
  user: User,
  page: DedicatedPage
): 'admin' | 'full_manager' | 'content_editor' | 'viewer' | 'none' {
  // Admin has full access
  if (user.role === 'admin') return 'admin';

  // Check if user is owner
  if (user.username === page.owner.id || user.email === page.owner.email) {
    return 'full_manager';
  }

  // Check authorized users
  const authorizedUser = page.authorizedUsers?.find(
    au => au.userId === user.username || au.email === user.email
  );

  return authorizedUser?.accessLevel || 'none';
}

/**
 * فیلتر کردن صفحات براساس دسترسی کاربر
 */
export function filterAccessiblePages(
  pages: DedicatedPage[],
  user: User
): DedicatedPage[] {
  if (user.role === 'admin') {
    return pages;
  }

  return pages.filter(page => {
    const accessLevel = checkPageAccessLevel(user, page);
    return accessLevel !== 'none';
  });
}

/**
 * دریافت صفحاتی که کاربر می‌تواند ویرایش کند
 */
export function getEditablePages(
  pages: DedicatedPage[],
  user: User
): DedicatedPage[] {
  return pages.filter(page => canEditDedicatedPage(user, page));
}

/**
 * دریافت صفحاتی که کاربر مالک آن‌هاست
 */
export function getOwnedPages(
  pages: DedicatedPage[],
  user: User
): DedicatedPage[] {
  return pages.filter(
    page =>
      user.username === page.owner.id || user.email === page.owner.email
  );
}

/**
 * بررسی اینکه صفحه منتشر شده است
 */
export function isPagePublished(page: DedicatedPage): boolean {
  return page.publishStatus === 'published' && page.status === 'active';
}

/**
 * بررسی اینکه صفحه درحال تدوین است
 */
export function isPageDraft(page: DedicatedPage): boolean {
  return page.publishStatus === 'draft' || page.status === 'draft';
}

/**
 * بررسی اینکه صفحه غیرفعال است
 */
export function isPageDisabled(page: DedicatedPage): boolean {
  return page.status === 'inactive' || page.status === 'maintenance';
}

/**
 * بازیابی نام فارسی برای سطح دسترسی
 */
export function getAccessLevelLabel(level: AccessLevel): string {
  const labels: Record<AccessLevel, string> = {
    full_manager: 'مدیر کامل',
    content_editor: 'ویرایشگر محتوا',
    viewer: 'بیننده'
  };
  return labels[level] || level;
}

/**
 * بازیابی نام فارسی برای وضعیت صفحه
 */
export function getPageStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'فعال',
    inactive: 'غیرفعال',
    draft: 'پیش‌نویس',
    maintenance: 'تعمیر و نگهداری'
  };
  return labels[status] || status;
}

/**
 * بازیابی رنگ برای وضعیت صفحه
 */
export function getPageStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    draft: 'bg-yellow-100 text-yellow-800',
    maintenance: 'bg-orange-100 text-orange-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * تولید URL صفحه اختصاصی
 */
export function generatePageUrl(
  pageSlug: string,
  siteBaseUrl: string = window.location.origin
): string {
  // Remove leading/trailing slashes
  const slug = pageSlug.replace(/^\/+|\/+$/g, '');
  return `${siteBaseUrl}/${slug}`;
}

/**
 * اعتبارسنجی slug صفحه
 */
export function validatePageSlug(slug: string): {
  valid: boolean;
  error?: string;
} {
  if (!slug || slug.trim().length === 0) {
    return { valid: false, error: 'slug نمی‌تواند خالی باشد' };
  }

  if (!/^[a-z0-9-]+$/.test(slug)) {
    return {
      valid: false,
      error: 'slug فقط می‌تواند شامل حروف کوچک، اعداد و خط تیره باشد'
    };
  }

  if (slug.length < 3) {
    return {
      valid: false,
      error: 'slug باید حداقل ۳ کاراکتر داشته باشد'
    };
  }

  if (slug.length > 100) {
    return {
      valid: false,
      error: 'slug نمی‌تواند بیش از ۱۰۰ کاراکتر داشته باشد'
    };
  }

  return { valid: true };
}

/**
 * تبدیل عنوان به slug
 */
export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]/g, '')
    .replace(/\-+/g, '-')
    .replace(/^\-+|\-+$/g, '');
}
