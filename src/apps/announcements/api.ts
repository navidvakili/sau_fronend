import { API } from '@/src/shared-utils/functions';
import type { AnnouncementCategory, AnnouncementItem, AnnouncementPayload } from '@/src/shared-types';

export interface AnnouncementsQuery {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  type?: string;
  group?: string;
  category_id?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export const fetchAnnouncements = async (params: AnnouncementsQuery = {}) => {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.search) qs.set('search', params.search);
  if (params.status) qs.set('status', params.status);
  if (params.type) qs.set('type', params.type);
  if (params.group) qs.set('group', params.group);
  if (params.category_id) qs.set('category_id', String(params.category_id));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return API<PaginatedResponse<AnnouncementItem>>(`announcements${suffix}`);
};

export const fetchAnnouncementById = async (id: number) => {
  const res = await API<{ data: AnnouncementItem }>(`announcements/${id}`);
  return res.data;
};

export const createAnnouncement = async (data: AnnouncementPayload) => {
  return API<{ data: AnnouncementItem; message?: string }>('announcements', data, 'POST');
};

export const updateAnnouncement = async (id: number, data: Partial<AnnouncementPayload>) => {
  return API<{ data: AnnouncementItem; message?: string }>(`announcements/${id}`, data, 'PUT');
};

export const deleteAnnouncement = async (id: number) => {
  return API<{ message: string }>(`announcements/${id}`, {}, 'DELETE');
};

export const toggleAnnouncementPin = async (id: number) => {
  return API<{ data: AnnouncementItem; message?: string }>(`announcements/${id}/toggle-pin`, {}, 'PUT');
};

export const fetchAnnouncementGroups = async () => {
  const res = await API<{ data: string[] }>('announcement-groups');
  return res.data || [];
};

export const fetchAnnouncementCategories = async () => {
  const res = await API<{ data: AnnouncementCategory[] }>('announcement-categories');
  return res.data || [];
};

export const createAnnouncementCategory = async (data: { name: string; slug?: string; color?: string; description?: string }) => {
  return API<{ data: AnnouncementCategory; message?: string }>('announcement-categories', data, 'POST');
};

export const updateAnnouncementCategory = async (
  id: number,
  data: { name?: string; slug?: string; color?: string; description?: string; is_active?: boolean }
) => {
  return API<{ data: AnnouncementCategory; message?: string }>(`announcement-categories/${id}`, data, 'PUT');
};

export const deleteAnnouncementCategory = async (id: number) => {
  return API<{ message: string }>(`announcement-categories/${id}`, {}, 'DELETE');
};
