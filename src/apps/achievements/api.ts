import { API } from '@/src/shared-utils/functions';
import type { AchievementItem, AchievementPayload } from '@/src/shared-types';

export interface AchievementsQuery {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  lang?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export const fetchAchievements = async (params: AchievementsQuery = {}) => {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.search) qs.set('search', params.search);
  if (params.status) qs.set('status', params.status);
  if (params.lang) qs.set('lang', params.lang);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return API<PaginatedResponse<AchievementItem>>(`achievements${suffix}`);
};

export const fetchAchievementById = async (id: number) => {
  const res = await API<{ data: AchievementItem }>(`achievements/${id}`);
  return res.data;
};

export const createAchievement = async (data: AchievementPayload) => {
  return API<{ data: AchievementItem; message?: string }>('achievements', data, 'POST');
};

export const updateAchievement = async (id: number, data: Partial<AchievementPayload>) => {
  return API<{ data: AchievementItem; message?: string }>(`achievements/${id}`, data, 'PUT');
};

export const deleteAchievement = async (id: number) => {
  return API<{ message: string }>(`achievements/${id}`, {}, 'DELETE');
};
