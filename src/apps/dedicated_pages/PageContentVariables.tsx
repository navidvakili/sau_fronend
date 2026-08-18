// ============================================================
// PageContentVariables — تبدیل متغیرهای صفحه اختصاصی به مقدار واقعی
// (دکمهٔ درج متغیر و کاتالوگ متغیرها در shared-components/PageVariables.tsx است)
// ============================================================

import { DedicatedPage, DEDICATED_PAGE_TYPES } from './types';
import { getDedicatedPagePublicUrl } from './utils';

/** مقدار فعلی هر متغیر برای یک صفحه اختصاصی مشخص */
export function getPageVariableValues(page: DedicatedPage): Record<string, string> {
  return {
    pageType: DEDICATED_PAGE_TYPES.find(t => t.id === page.pageType)?.title || page.pageType,
    title: page.title || '',
    shortTitle: page.shortTitle || '',
    shortDescription: page.shortDescription || '',
    fullDescription: page.fullDescription || '',
    url: getDedicatedPagePublicUrl(page.pageType, page.slug),
    ownerName: page.owner?.name || '',
    ownerRole: page.owner?.roleTitle || '',
    ownerPhone: page.owner?.phone || '',
    ownerEmail: page.owner?.email || ''
  };
}

/** جایگزینی توکن‌های {{key}} موجود در متن با مقدار واقعی همان صفحه */
export function resolvePageContentVariables(text: string, page: DedicatedPage): string {
  if (!text) return text;
  const values = getPageVariableValues(page);
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => (key in values ? values[key] : match));
}
