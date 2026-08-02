import { API } from '@/src/shared-utils/functions';
import type { PersonItem, PersonPayload, PersonType } from '@/src/shared-types';

export interface PeopleQuery {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  lang?: string;
  type?: PersonType;
}

interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export const fetchPeople = async (params: PeopleQuery = {}) => {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.search) qs.set('search', params.search);
  if (params.status) qs.set('status', params.status);
  if (params.lang) qs.set('lang', params.lang);
  if (params.type) qs.set('type', params.type);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return API<PaginatedResponse<PersonItem>>(`people${suffix}`);
};

export const fetchPersonById = async (id: number) => {
  const res = await API<{ data: PersonItem }>(`people/${id}`);
  return res.data;
};

export const createPerson = async (data: PersonPayload) => {
  return API<{ data: PersonItem; message?: string }>('people', data, 'POST');
};

export const updatePerson = async (id: number, data: Partial<PersonPayload>) => {
  return API<{ data: PersonItem; message?: string }>(`people/${id}`, data, 'PUT');
};

export const deletePerson = async (id: number) => {
  return API<{ message: string }>(`people/${id}`, {}, 'DELETE');
};

export interface ImportResult {
  message: string;
  created: number;
  failed: number;
  errors?: string[];
}

/**
 * Bulk import people from Excel rows parsed client-side (SheetJS).
 * rows: array of flat objects with snake_case keys (e.g. first_name, last_name, ...)
 */
export const importPeople = async (type: PersonType, rows: Record<string, any>[], lang?: string) => {
  return API<ImportResult>('people/import', { type, rows, lang }, 'POST');
};
