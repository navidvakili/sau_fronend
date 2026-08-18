// ============================================================
// Dedicated Pages API — ارتباط ماژول صفحات اختصاصی با وب‌سرویس
// ============================================================

import { API } from '@/src/shared-utils/functions';
import type { DedicatedPage, PageContentItem, PageType, ProfessorProfileData } from './types';

// ==================== Professors Data ====================

/**
 * دریافت لیست اساتید و اطلاعات پروفایل آنها از وب‌سرویس
 */
export async function fetchProfessors(): Promise<ProfessorProfileData[]> {
  const res = await API<{ data: ProfessorProfileData[] }>('professors');
  return res.data || [];
}

// ==================== Dedicated Pages CRUD ====================

/**
 * دریافت تمام صفحات اختصاصی
 */
export async function fetchDedicatedPages(filters?: {
  pageType?: PageType;
  status?: 'active' | 'inactive' | 'draft' | 'maintenance';
  searchQuery?: string;
}): Promise<DedicatedPage[]> {
  const params = new URLSearchParams();
  if (filters?.pageType) params.append('pageType', filters.pageType);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.searchQuery) params.append('search', filters.searchQuery);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const res = await API<{ data: DedicatedPage[] }>(`dedicated-pages${queryString}`);
  return res.data || [];
}

/**
 * دریافت یک صفحه اختصاصی بر اساس id
 */
export async function fetchDedicatedPageById(pageId: string): Promise<DedicatedPage | null> {
  try {
    const res = await API<{ data: DedicatedPage }>(`dedicated-pages/${pageId}`);
    return res.data || null;
  } catch (error) {
    console.error(`Error fetching dedicated page ${pageId}:`, error);
    return null;
  }
}

/**
 * ایجاد صفحه اختصاصی جدید
 */
export async function createDedicatedPage(page: Omit<DedicatedPage, 'id' | 'createdAt' | 'updatedAt' | 'fullUrl'>): Promise<DedicatedPage> {
  const res = await API<{ data: DedicatedPage }>('dedicated-pages', page, 'POST');
  return res.data;
}

/**
 * به‌روزرسانی صفحه اختصاصی
 */
export async function updateDedicatedPage(pageId: string, updates: Partial<DedicatedPage>): Promise<DedicatedPage> {
  const res = await API<{ data: DedicatedPage }>(`dedicated-pages/${pageId}`, updates, 'PUT');
  return res.data;
}

/**
 * حذف صفحه اختصاصی
 */
export async function deleteDedicatedPage(pageId: string): Promise<{ message: string }> {
  const res = await API<{ message: string }>(`dedicated-pages/${pageId}`, {}, 'DELETE');
  return res;
}

// ==================== Page Content Management ====================

/**
 * دریافت محتوای یک صفحه اختصاصی
 */
export async function fetchPageContents(pageId: string, filters?: {
  type?: string;
  status?: 'published' | 'draft' | 'archived';
}): Promise<PageContentItem[]> {
  const params = new URLSearchParams();
  if (filters?.type) params.append('type', filters.type);
  if (filters?.status) params.append('status', filters.status);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  const res = await API<{ data: PageContentItem[] }>(`dedicated-pages/${pageId}/contents${queryString}`);
  return res.data || [];
}

/**
 * ایجاد محتوای جدید برای صفحه
 */
export async function createPageContent(pageId: string, content: Omit<PageContentItem, 'id'>): Promise<PageContentItem> {
  const res = await API<{ data: PageContentItem }>(`dedicated-pages/${pageId}/contents`, content, 'POST');
  return res.data;
}

/**
 * به‌روزرسانی محتوای صفحه
 */
export async function updatePageContent(pageId: string, contentId: string, updates: Partial<PageContentItem>): Promise<PageContentItem> {
  const res = await API<{ data: PageContentItem }>(`dedicated-pages/${pageId}/contents/${contentId}`, updates, 'PUT');
  return res.data;
}

/**
 * حذف محتوای صفحه
 */
export async function deletePageContent(pageId: string, contentId: string): Promise<{ message: string }> {
  const res = await API<{ message: string }>(`dedicated-pages/${pageId}/contents/${contentId}`, {}, 'DELETE');
  return res;
}

// ==================== Page Publish & Status Management ====================

/**
 * انتشار صفحه اختصاصی
 */
export async function publishDedicatedPage(pageId: string): Promise<{ message: string }> {
  const res = await API<{ message: string }>(`dedicated-pages/${pageId}/publish`, {}, 'POST');
  return res;
}

/**
 * بایگانی / بیرون‌رفتن صفحه اختصاصی
 */
export async function unpublishDedicatedPage(pageId: string): Promise<{ message: string }> {
  const res = await API<{ message: string }>(`dedicated-pages/${pageId}/unpublish`, {}, 'POST');
  return res;
}

/**
 * مدیریت دسترسی‌های کاربری برای صفحه
 */
export async function updatePageAuthorizations(pageId: string, authorizationData: {
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  user_role_title?: string;
}): Promise<{ message: string }> {
  const res = await API<{ message: string }>(`dedicated-pages/${pageId}/authorizations`, authorizationData, 'POST');
  return res;
}
