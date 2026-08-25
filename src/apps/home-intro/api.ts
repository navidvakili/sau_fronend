import { API } from '@/src/shared-utils/functions';

export interface HomeIntroImage {
  url: string;
  alt?: string | null;
}

export interface HomeIntroStat {
  icon: string;
  number: string;
  label: string;
  sub?: string;
}

export interface HomeIntro {
  id: number;
  language: string;
  tag: string | null;
  title: string | null;
  description: string | null;
  images: HomeIntroImage[];
  stats: HomeIntroStat[];
  stats_columns: number;
  is_active: boolean;
}

export interface HomeIntroPayload {
  tag?: string | null;
  title?: string | null;
  description?: string | null;
  images?: HomeIntroImage[];
  stats?: HomeIntroStat[];
  stats_columns?: number;
  is_active?: boolean;
  lang?: string;
}

export const fetchCurrentHomeIntro = async (lang?: string) => {
  const suffix = lang ? `?lang=${lang}` : '';
  const res = await API<{ data: HomeIntro }>(`admin/home-intro/current${suffix}`);
  return res.data;
};

export const updateHomeIntro = async (data: HomeIntroPayload) => {
  return API<{ data: HomeIntro; message?: string }>('admin/home-intro', data, 'PUT');
};
