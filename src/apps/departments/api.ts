import { API } from '@/src/shared-utils/functions';
import type { AcademicDepartmentItem, AcademicDepartmentPayload } from '@/src/shared-types';

export interface DepartmentQuery {
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

export const fetchDepartments = async (params: DepartmentQuery = {}) => {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.search) qs.set('search', params.search);
  if (params.status) qs.set('status', params.status);
  if (params.lang) qs.set('lang', params.lang);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return API<PaginatedResponse<AcademicDepartmentItem>>(`departments${suffix}`);
};

export const fetchDepartmentById = async (id: number) => {
  const res = await API<{ data: AcademicDepartmentItem }>(`departments/${id}`);
  return res.data;
};

export const createDepartment = async (data: AcademicDepartmentPayload) => {
  return API<{ data: AcademicDepartmentItem; message?: string }>('departments', data, 'POST');
};

export const updateDepartment = async (id: number, data: Partial<AcademicDepartmentPayload>) => {
  return API<{ data: AcademicDepartmentItem; message?: string }>(`departments/${id}`, data, 'PUT');
};

export const deleteDepartment = async (id: number) => {
  return API<{ message: string }>(`departments/${id}`, {}, 'DELETE');
};

// ===== فایل‌های اطلاعاتی گروه (academic_department_files) — طبق فاز ۲.۶؛ رکورد واقعی، نه JSON =====

export interface DepartmentFileItem {
  id: number;
  departmentId: number;
  title: string | null;
  url: string;
  sortOrder: number;
}

export const fetchDepartmentFiles = async (departmentId: number) => {
  const res = await API<{ data: DepartmentFileItem[] }>(`department-files?department_id=${departmentId}`);
  return res.data;
};

export const createDepartmentFile = async (data: { department_id: number; title?: string | null; url: string; sort_order?: number }) => {
  return API<{ data: DepartmentFileItem; message?: string }>('department-files', data, 'POST');
};

export const updateDepartmentFile = async (id: number, data: { title?: string | null; url?: string; sort_order?: number }) => {
  return API<{ data: DepartmentFileItem; message?: string }>(`department-files/${id}`, data, 'PUT');
};

export const deleteDepartmentFile = async (id: number) => {
  return API<{ message: string }>(`department-files/${id}`, {}, 'DELETE');
};
