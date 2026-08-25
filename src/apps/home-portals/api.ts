import { API } from '@/src/shared-utils/functions';

export const PORTAL_COLORS = ['blue', 'green', 'purple', 'yellow', 'red', 'indigo', 'teal', 'pink'] as const;
export type PortalColor = typeof PORTAL_COLORS[number];

export interface HomePortalItem {
  icon: string;
  title: string;
  description?: string;
  url: string;
  color: PortalColor;
}

export interface HomePortalSection {
  id: number;
  language: string;
  title: string | null;
  subtitle: string | null;
  items: HomePortalItem[];
  is_active: boolean;
}

export interface HomePortalPayload {
  title?: string | null;
  subtitle?: string | null;
  items?: HomePortalItem[];
  is_active?: boolean;
  lang?: string;
}

export const fetchCurrentHomePortals = async (lang?: string) => {
  const suffix = lang ? `?lang=${lang}` : '';
  const res = await API<{ data: HomePortalSection }>(`admin/home-portals/current${suffix}`);
  return res.data;
};

export const updateHomePortals = async (data: HomePortalPayload) => {
  return API<{ data: HomePortalSection; message?: string }>('admin/home-portals', data, 'PUT');
};
