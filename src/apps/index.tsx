// ============================================================
// App Route Registry — تجمیع مسیریابی تمام App ها
//
// هر App یک کامپوننت Lazy Load شده است که بر اساس moduleType
// انتخاب و رندر می‌شود.
// ============================================================

import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';

// ===== تعریف App های اصلی با Lazy Loading =====
export const AppModules: Record<string, LazyExoticComponent<ComponentType<any>>> = {
  accounting: lazy(() => import('./accounting')),
  analytics: lazy(() => import('./analytics')),
  auth: lazy(() => import('./auth')),
  users: lazy(() => import('./users')),
  news: lazy(() => import('./news')),
  announcements: lazy(() => import('./announcements')),
  'slider-studio': lazy(() => import('./slider-studio')),
  'home-intro': lazy(() => import('./home-intro')),
  'home-portals': lazy(() => import('./home-portals')),
  achievements: lazy(() => import('./achievements')),
  people: lazy(() => import('./people')),
  departments: lazy(() => import('./departments')),
  'page-builder': lazy(() => import('./page-builder')),
  gallery: lazy(() => import('./gallery')),
  forms: lazy(() => import('./forms')),
  navigation: lazy(() => import('./navigation')),
  'dedicated-pages': lazy(() => import('./dedicated_pages')),
};

/**
 * نگاشت moduleType به App مربوطه
 * هر moduleType مشخص می‌کند کدام App باید رندر شود
 */
export const moduleToAppMap: Record<string, string> = {
  // Accounting App
  'finance': 'accounting',

  // Analytics App (آمار بازدیدکنندگان سراسر سایت — ماژول مستقل در پیشخوان)
  'analytics': 'analytics',

  // Auth App
  'profile': 'auth',
  'change-password': 'auth',
  'sessions': 'auth',
  'admin-sessions': 'auth',

  // Users Management App
  'users': 'users',

  // News App
  'news': 'news',
  'news-create': 'news',
  'news-categories': 'news',
  'news-analytics': 'news',
  'news-visitor-analytics': 'news',

  // Announcements App
  'announcements': 'announcements',
  'announcements-create': 'announcements',
  'announcements-visitor-analytics': 'announcements',

  // Slider Studio App
  'slider-studio': 'slider-studio',

  // Home Intro App (معرفی صفحه اصلی)
  'home-intro': 'home-intro',

  // Home Portals App (سامانه‌های دانشگاه در صفحه اصلی)
  'home-portals': 'home-portals',

  // Achievements App
  'achievements': 'achievements',
  'achievements-create': 'achievements',
  'achievements-visitor-analytics': 'achievements',

  // People App (اعضای دانشگاه)
  'people': 'people',

  // Academic Departments App (گروه‌های آموزشی)
  'departments': 'departments',

  // نکته: ماژول مستقل «رشته‌های تحصیلی» (fields) طبق فاز ۲.۵ حذف شد — مدیریت رشته از
  // داخل ویرایشگر بصری گروه‌های آموزشی انجام می‌شود، نه یک منوی جدا.

  // Smart Page Builder App (صفحه ساز هوشمند)
  'page-builder': 'page-builder',
  'smart-page-builder': 'page-builder',
  'smart-page-visitor-analytics': 'page-builder',

  // Gallery App (مدیریت دارایی‌های دیجیتال / DAM)
  'gallery': 'gallery',
  'dam': 'gallery',
  'dam-studio': 'gallery',
  'dam-assets': 'gallery',

  // Forms App (فرم‌ساز و پرسشنامه‌ساز هوشمند)
  'forms': 'forms',
  'forms-studio': 'forms',
  'form-builder': 'forms',
  'survey-builder': 'forms',

  // Navigation App (مدیریت و ساخت ناوبری)
  'navigation': 'navigation',
  'navigation-builder': 'navigation',
  'nav-builder': 'navigation',
  'menu-builder': 'navigation',

  // Dedicated Pages App (صفحات اختصاصی و مستقل)
  'dedicated-pages': 'dedicated-pages',
  'dedicated_pages': 'dedicated-pages',
  'special-pages': 'dedicated-pages',
  'portal-pages': 'dedicated-pages',
  'dedicated-page-visitor-analytics': 'dedicated-pages',

};

/**
 * برگرداندن App name برای یک moduleType
 */
export function resolveApp(moduleType: string): string {
  return moduleToAppMap[moduleType] || '';
}

/**
 * کامپوننت نمایش در هنگام بارگذاری (Fallback)
 */
export { default as ModuleRenderer } from './ModuleRenderer';

export function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-3 text-gray-400">
        <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm font-bold">در حال بارگذاری...</span>
      </div>
    </div>
  );
}

/**
 * Suspense wrapper برای Lazy Loaded components
 */
export function withSuspense(Component: ComponentType<any>, props: Record<string, any> = {}) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component {...props} />
    </Suspense>
  );
}
