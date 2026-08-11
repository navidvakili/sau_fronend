// ============================================================
// Smart Page Builder API — ارتباط با وب‌سرویس صفحات هوشمند + منابع داده
// ============================================================

import { API } from '@/src/shared-utils/functions';
import type { MediaFile, MediaFolderDto } from '../gallery/types';
import type {
  AchievementItem,
  AnnouncementCategory,
  AnnouncementItem,
  NewsCategory,
  NewsItem,
  PersonItem,
} from '@/src/shared-types';

// ===== SmartPage CRUD =====

export interface SmartPageDto {
  id?: number;
  title: string;
  slug: string;
  parent_id?: number | null;
  parent_slug?: string | null;
  sort_order?: number;
  status: 'published' | 'draft';
  seo?: {
    title?: string;
    description?: string;
    keywords?: string;
    og_image?: string;
  } | null;
  schema: Record<string, unknown>;
  language?: string;
  author_name?: string | null;
  author_username?: string | null;
  author_role?: string | null;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

/** Admin list of pages (lightweight rows, no schema) */
export const fetchSmartPages = async (params: {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  lang?: string;
} = {}): Promise<PaginatedResponse<SmartPageDto>> => {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.search) qs.set('search', params.search);
  if (params.status) qs.set('status', params.status);
  if (params.lang) qs.set('lang', params.lang);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return API<PaginatedResponse<SmartPageDto>>(`smart-pages${suffix}`);
};

/** Admin single page (full schema) */
export const fetchSmartPage = async (id: number): Promise<SmartPageDto> => {
  const res = await API<{ data: SmartPageDto }>(`smart-pages/${id}`);
  return res.data;
};

/** Admin list of CHILD pages of a page (lightweight rows for the canvas widget) */
export const fetchSmartPageChildren = async (parentId: number): Promise<SmartPageDto[]> => {
  return API<SmartPageDto[]>(`smart-pages/${parentId}/children`);
};

/** A node of the recursive descendant tree of a page */
export interface SmartPageTreeNode extends SmartPageDto {
  children: SmartPageTreeNode[];
}

/** Admin TREE of ALL descendant pages (nested) — for the child-pages manager dialog */
export const fetchSmartPageChildrenTree = async (parentId: number): Promise<SmartPageTreeNode[]> => {
  return API<SmartPageTreeNode[]>(`smart-pages/${parentId}/children/tree`);
};

/** Create a new smart page */
export const createSmartPage = async (data: {
  title: string;
  slug: string;
  parent_id?: number | null;
  sort_order?: number;
  status?: 'published' | 'draft';
  seo?: SmartPageDto['seo'];
  schema: Record<string, unknown>;
  lang?: string;
}): Promise<{ message: string; data: SmartPageDto }> => {
  return API('smart-pages', data, 'POST');
};

/** Update a smart page */
export const updateSmartPage = async (
  id: number,
  data: Partial<{
    title: string;
    slug: string;
    parent_id?: number | null;
    sort_order?: number;
    status: 'published' | 'draft';
    seo: SmartPageDto['seo'];
    schema: Record<string, unknown>;
    lang: string;
  }>
): Promise<{ message: string; data: SmartPageDto }> => {
  return API(`smart-pages/${id}`, data, 'PUT');
};

/** Delete a smart page */
export const deleteSmartPage = async (id: number): Promise<{ message: string }> => {
  return API(`smart-pages/${id}`, {}, 'DELETE');
};

// ===== Data-source fetchers (هر بخش به وب‌سرویس مختص خود متصل می‌شود) =====

/** اخبار — برای ویجت news-feed */
export const fetchDataSourceNews = async (params: {
  per_page?: number;
  category_id?: number | null;
  status?: string;
  lang?: string;
} = {}) => {
  const qs = new URLSearchParams();
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.category_id) qs.set('category_id', String(params.category_id));
  if (params.status) qs.set('status', params.status);
  if (params.lang) qs.set('lang', params.lang);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return API<PaginatedResponse<NewsItem>>(`news${suffix}`);
};

/** دسته‌بندی اخبار — برای فیلتر گروه در تنظیمات ویجت خبر */
export const fetchDataSourceNewsCategories = async (lang?: string): Promise<NewsCategory[]> => {
  const qs = lang ? `?lang=${lang}` : '';
  const res = await API<{ data: NewsCategory[] }>(`news-categories${qs}`);
  return res.data;
};

/** اطلاعیه‌ها — برای ویجت announcements-feed */
export const fetchDataSourceAnnouncements = async (params: {
  per_page?: number;
  category_id?: number | null;
  group?: string | null;
  status?: string;
  lang?: string;
} = {}) => {
  const qs = new URLSearchParams();
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.category_id) qs.set('category_id', String(params.category_id));
  if (params.group) qs.set('group', params.group);
  if (params.status) qs.set('status', params.status);
  if (params.lang) qs.set('lang', params.lang);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return API<PaginatedResponse<AnnouncementItem>>(`announcements${suffix}`);
};

/** گروه‌های اطلاعیه — برای فیلتر گروه در تنظیمات ویجت اطلاعیه */
export const fetchDataSourceAnnouncementGroups = async (lang?: string): Promise<string[]> => {
  const qs = lang ? `?lang=${lang}` : '';
  const res = await API<{ data: string[] }>(`announcement-groups${qs}`);
  return res.data;
};

/** دسته‌بندی اطلاعیه‌ها (شکل NewsCategory دارد) */
export const fetchDataSourceAnnouncementCategories = async (lang?: string): Promise<AnnouncementCategory[]> => {
  const qs = lang ? `?lang=${lang}` : '';
  const res = await API<{ data: AnnouncementCategory[] }>(`announcement-categories${qs}`);
  return res.data;
};

/** افتخارات — برای ویجت achievements-timeline */
export const fetchDataSourceAchievements = async (params: {
  per_page?: number;
  status?: string;
  lang?: string;
} = {}) => {
  const qs = new URLSearchParams();
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.status) qs.set('status', params.status);
  if (params.lang) qs.set('lang', params.lang);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return API<PaginatedResponse<AchievementItem>>(`achievements${suffix}`);
};

/** اعضای دانشگاه — برای ویجت staff-directory */
export const fetchDataSourcePeople = async (params: {
  per_page?: number;
  type?: string;
  status?: string;
  lang?: string;
} = {}) => {
  const qs = new URLSearchParams();
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.type) qs.set('type', params.type);
  if (params.status) qs.set('status', params.status);
  if (params.lang) qs.set('lang', params.lang);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return API<PaginatedResponse<PersonItem>>(`people${suffix}`);
};

/** رسانه — برای ویجت‌های image-gallery و file-manager */
export const fetchDataSourceMedia = async (params: {
  per_page?: number;
  folder_id?: string | null;
  search?: string;
  type?: 'all' | 'image' | 'video' | 'audio' | 'document';
} = {}) => {
  const qs = new URLSearchParams();
  qs.set('page', '1');
  qs.set('per_page', String(params.per_page ?? 100));
  if (params.search) qs.set('search', params.search);
  if (params.folder_id) qs.set('folder_id', params.folder_id);
  if (params.type && params.type !== 'all') qs.set('type', params.type);
  return API<{
    data: MediaFile[];
    current_page: number;
    last_page: number;
    total: number;
  }>(`media?${qs.toString()}`);
};

/** پوشه‌های رسانه — برای فیلتر پوشه در تنظیمات ویجت گالری/فایل */
export const fetchDataSourceMediaFolders = async (): Promise<MediaFolderDto[]> => {
  const res = await API<{ data: MediaFolderDto[] }>('media/folders');
  return res.data;
};
