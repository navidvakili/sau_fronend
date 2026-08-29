// ============================================================
// Analytics API — توابع ارتباط با وب‌سرویس‌های آمار بازدیدکنندگان
// ============================================================

import { API } from '@/src/shared-utils/functions';
import type { PeriodPreset } from '@/src/shared-components/PeriodPicker';

export type ViewableType = 'news' | 'announcement' | 'achievement' | 'smart_page' | 'dedicated_page';
export type Granularity = 'day' | 'week' | 'month';

export interface AnalyticsQueryParams {
  preset?: PeriodPreset;
  from?: string;
  to?: string;
  type?: ViewableType;
}

// ===== Overview =====

export interface OverviewMetrics {
  views: number;
  unique_visitors: number;
  sessions: number;
  avg_duration_seconds: number;
  bounce_rate: number;
  exit_rate: number;
  pages_per_session: number;
  downloads: number;
  searches: number;
}

export interface OverviewResponse {
  data: OverviewMetrics;
  range: { from: string; to: string };
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

/** آمار کلی یک بازهٔ زمانی (بازدید، بازدیدکننده یکتا، نشست، ...) */
export async function getOverview(params: AnalyticsQueryParams = {}): Promise<OverviewResponse> {
  const qs = buildQuery({ preset: params.preset, from: params.from, to: params.to, type: params.type });
  return API(`analytics/overview${qs}`);
}

// ===== Compare =====

export interface ComparePeriodMetrics extends OverviewMetrics {
  from: string;
  to: string;
}

export interface CompareResponse {
  data: {
    current: ComparePeriodMetrics;
    previous: ComparePeriodMetrics;
  };
}

/** مقایسهٔ بازهٔ فعلی با بازهٔ مشابه قبلی */
export async function getCompare(params: AnalyticsQueryParams = {}): Promise<CompareResponse> {
  const qs = buildQuery({ preset: params.preset, from: params.from, to: params.to, type: params.type });
  return API(`analytics/compare${qs}`);
}

// ===== Timeseries =====

export interface TimeseriesPoint {
  date?: string;
  period?: string;
  views: number;
  unique_visitors: number;
  sessions: number;
  downloads: number;
  searches: number;
  avg_duration_seconds: number;
  bounce_rate: number;
  exit_rate: number;
  pages_per_session: number;
}

export interface TimeseriesResponse {
  data: TimeseriesPoint[];
}

/** سری زمانی آمار بازدید بر اساس گرانولاریتی روز/هفته/ماه */
export async function getTimeseries(params: AnalyticsQueryParams & { granularity?: Granularity } = {}): Promise<TimeseriesResponse> {
  const qs = buildQuery({
    preset: params.preset,
    from: params.from,
    to: params.to,
    type: params.type,
    granularity: params.granularity || 'day',
  });
  return API(`analytics/timeseries${qs}`);
}

// ===== Traffic Sources =====

export type TrafficSource = 'direct' | 'organic_search' | 'social' | 'referral' | 'campaign';

export interface TrafficSourcesResponse {
  data: {
    breakdown: { traffic_source: TrafficSource; sessions: number }[];
    top_referrers: { traffic_source: TrafficSource; traffic_source_detail: string | null; sessions: number }[];
  };
}

/** منابع ترافیک (مستقیم، جستجوی ارگانیک، شبکه‌های اجتماعی، ارجاعی، کمپین) */
export async function getTrafficSources(params: AnalyticsQueryParams = {}): Promise<TrafficSourcesResponse> {
  const qs = buildQuery({ preset: params.preset, from: params.from, to: params.to, type: params.type });
  return API(`analytics/traffic-sources${qs}`);
}

// ===== Top Content =====

export interface TopContentItem {
  /** null یعنی صفحه‌ی هاردکد بدون رکورد محتوایی (مثل «درباره ما») — فقط در آمار سراسر سایت لحاظ می‌شود */
  viewable_type: ViewableType | null;
  viewable_id: number | null;
  views: number;
  unique_visitors: number;
  title: string;
  /** آخرین مسیر ثبت‌شده برای این محتوا (نسبی، مثل /news/12/slug) */
  path: string;
}

export interface TopContentResponse {
  data: TopContentItem[];
}

/** پربازدیدترین محتوا */
export async function getTopContent(params: AnalyticsQueryParams & { limit?: number } = {}): Promise<TopContentResponse> {
  const qs = buildQuery({ preset: params.preset, from: params.from, to: params.to, type: params.type, limit: params.limit || 10 });
  return API(`analytics/top-content${qs}`);
}

// ===== Top Links =====

export interface TopLinkItem {
  href: string;
  label: string | null;
  clicks: number;
}

export interface TopLinksResponse {
  data: TopLinkItem[];
}

/** پرکلیک‌ترین لینک‌ها */
export async function getTopLinks(params: AnalyticsQueryParams & { limit?: number } = {}): Promise<TopLinksResponse> {
  const qs = buildQuery({ preset: params.preset, from: params.from, to: params.to, type: params.type, limit: params.limit || 10 });
  return API(`analytics/top-links${qs}`);
}

// ===== Downloads =====

export interface DownloadItem {
  file_url: string;
  file_name: string | null;
  downloads: number;
}

export interface DownloadsResponse {
  data: DownloadItem[];
}

/** دانلودهای پرتکرار */
export async function getDownloads(params: AnalyticsQueryParams & { limit?: number } = {}): Promise<DownloadsResponse> {
  const qs = buildQuery({ preset: params.preset, from: params.from, to: params.to, type: params.type, limit: params.limit || 10 });
  return API(`analytics/downloads${qs}`);
}

// ===== Search Terms (site-wide only) =====

export interface SearchTermItem {
  query: string;
  searches: number;
  avg_results: number;
}

export interface ZeroResultTermItem {
  query: string;
  searches: number;
}

export interface SearchTermsResponse {
  data: {
    total_searches: number;
    zero_result_searches: number;
    top_terms: SearchTermItem[];
    zero_result_terms: ZeroResultTermItem[];
  };
}

/** عبارت‌های جستجوشده — فقط سراسر سایت (بدون فیلتر نوع محتوا) */
export async function getSearchTerms(params: Omit<AnalyticsQueryParams, 'type'> & { limit?: number } = {}): Promise<SearchTermsResponse> {
  const qs = buildQuery({ preset: params.preset, from: params.from, to: params.to, limit: params.limit || 20 });
  return API(`analytics/search-terms${qs}`);
}
