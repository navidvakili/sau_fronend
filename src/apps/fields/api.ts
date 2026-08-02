import { API } from '@/src/shared-utils/functions';
import type { AcademicFieldItem, AcademicFieldPayload } from '@/src/shared-types';

export interface FieldQuery {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  lang?: string;
  department_id?: number;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export const fetchFields = async (params: FieldQuery = {}) => {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.search) qs.set('search', params.search);
  if (params.status) qs.set('status', params.status);
  if (params.lang) qs.set('lang', params.lang);
  if (params.department_id) qs.set('department_id', String(params.department_id));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return API<PaginatedResponse<AcademicFieldItem>>(`fields${suffix}`);
};

export const fetchFieldById = async (id: number) => {
  const res = await API<{ data: AcademicFieldItem }>(`fields/${id}`);
  return res.data;
};

export const createField = async (data: AcademicFieldPayload) => {
  return API<{ data: AcademicFieldItem; message?: string }>('fields', data, 'POST');
};

export const updateField = async (id: number, data: Partial<AcademicFieldPayload>) => {
  return API<{ data: AcademicFieldItem; message?: string }>(`fields/${id}`, data, 'PUT');
};

export const deleteField = async (id: number) => {
  return API<{ message: string }>(`fields/${id}`, {}, 'DELETE');
};
