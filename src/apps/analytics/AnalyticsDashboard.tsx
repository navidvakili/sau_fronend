// ============================================================
// AnalyticsDashboard — داشبورد آمار بازدیدکنندگان (سراسر سایت یا یک نوع محتوا)
// قابل استفاده هم به عنوان ماژول مستقل «آمار بازدیدکنندگان» در پیشخوان،
// و هم به عنوان تب «آمار بازدیدکنندگان» داخل هر یک از ماژول‌های محتوایی
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts';
import {
  Eye, Users, Activity, Clock, LogOut, ArrowUpRight, LayoutList, Download, Search,
  TrendingUp, TrendingDown, Minus, Link2, FileDown, Globe, BarChart2, Loader2,
  ArrowRightLeft, AlertTriangle, Flame,
} from 'lucide-react';
import { PeriodPicker, type PeriodPreset, isoToJalali, isoMonthToJalali } from '@/src/shared-components/PeriodPicker';
import { toPersianDigits } from '@/src/shared-utils';
import { PUBLIC_SITE_URL } from '@/src/shared-constants';
import {
  getOverview, getCompare, getTimeseries, getTrafficSources, getTopContent, getTopLinks, getDownloads, getSearchTerms,
} from './api';
import type {
  OverviewMetrics, CompareResponse, TimeseriesPoint, TrafficSourcesResponse, TopContentItem, TopLinkItem,
  DownloadItem, SearchTermsResponse, ViewableType, Granularity, TrafficSource,
} from './api';

interface AnalyticsDashboardProps {
  /** نوع محتوا برای فیلتر کردن آمار — اگر تعیین نشود، آمار سراسر سایت نمایش داده می‌شود */
  viewableType?: ViewableType;
}

// ===== Helpers =====

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds || 0));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatInt(n: number | undefined | null): string {
  return toPersianDigits(Math.round(n || 0).toLocaleString('en-US'));
}

function formatPercent(n: number | undefined | null): string {
  return toPersianDigits((n ?? 0).toFixed(1)) + '٪';
}

function formatFloat1(n: number | undefined | null): string {
  return toPersianDigits((n ?? 0).toFixed(1));
}

const TRAFFIC_LABELS: Record<TrafficSource, string> = {
  direct: 'مستقیم',
  organic_search: 'جستجوی ارگانیک',
  social: 'شبکه‌های اجتماعی',
  referral: 'ارجاعی',
  campaign: 'کمپین',
};

const TRAFFIC_COLORS: Record<TrafficSource, string> = {
  direct: '#0d9488',
  organic_search: '#6366f1',
  social: '#ec4899',
  referral: '#f59e0b',
  campaign: '#8b5cf6',
};

interface KpiConfig {
  key: keyof OverviewMetrics;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  format: (v: number) => string;
  /** برای این معیارها کاهش مقدار مثبت تلقی می‌شود (مثلاً نرخ پرش) */
  lowerIsBetter?: boolean;
  /** فقط زمانی نمایش داده شود که آمار سراسر سایت است (بدون فیلتر نوع محتوا) */
  siteWideOnly?: boolean;
}

const KPI_CONFIGS: KpiConfig[] = [
  { key: 'views', label: 'بازدید کل', icon: Eye, format: formatInt },
  { key: 'unique_visitors', label: 'بازدیدکنندگان یکتا', icon: Users, format: formatInt },
  { key: 'sessions', label: 'جلسات', icon: Activity, format: formatInt },
  { key: 'pages_per_session', label: 'صفحات در هر جلسه', icon: LayoutList, format: formatFloat1 },
  { key: 'avg_duration_seconds', label: 'میانگین زمان حضور', icon: Clock, format: v => toPersianDigits(formatDuration(v)) },
  { key: 'bounce_rate', label: 'نرخ پرش', icon: LogOut, format: formatPercent, lowerIsBetter: true },
  { key: 'exit_rate', label: 'نرخ خروج', icon: ArrowUpRight, format: formatPercent, lowerIsBetter: true },
  { key: 'downloads', label: 'دانلودها', icon: Download, format: formatInt },
  { key: 'searches', label: 'جستجوها', icon: Search, format: formatInt, siteWideOnly: true },
];

const TREND_METRICS: { key: 'views' | 'unique_visitors' | 'sessions'; label: string; color: string }[] = [
  { key: 'views', label: 'بازدید', color: '#0d9488' },
  { key: 'unique_visitors', label: 'بازدیدکننده یکتا', color: '#6366f1' },
  { key: 'sessions', label: 'جلسه', color: '#f59e0b' },
];

const GRANULARITY_LABELS: Record<Granularity, string> = { day: 'روزانه', week: 'هفتگی', month: 'ماهانه' };

/** برچسب شمسی محور نمودار — روز/هفته: YYYY/MM/DD، ماه: نام ماه + سال */
function formatChartLabel(point: TimeseriesPoint, granularity: Granularity): string {
  if (granularity === 'month' && point.period) {
    const d = isoMonthToJalali(point.period);
    return d ? toPersianDigits(d.format('MMMM YYYY')) : point.period;
  }
  const iso = point.date ?? point.period;
  if (!iso) return '';
  const d = isoToJalali(iso);
  return d ? toPersianDigits(d.format('YYYY/MM/DD')) : iso;
}

const KPI_CARD_STYLES = [
  'bg-teal-50/60 dark:bg-teal-950/30 border-teal-200/60 dark:border-teal-800/50 text-teal-700 dark:text-teal-300',
  'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200/60 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300',
  'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/50 text-amber-700 dark:text-amber-300',
  'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200/60 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300',
  'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/60 dark:border-rose-800/50 text-rose-700 dark:text-rose-300',
  'bg-purple-50/60 dark:bg-purple-950/30 border-purple-200/60 dark:border-purple-800/50 text-purple-700 dark:text-purple-300',
];

export default function AnalyticsDashboard({ viewableType }: AnalyticsDashboardProps) {
  // ===== Period state =====
  const [preset, setPreset] = useState<PeriodPreset>('7d');
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [to, setTo] = useState<string | undefined>(undefined);
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [selectedMetrics, setSelectedMetrics] = useState<Set<'views' | 'unique_visitors' | 'sessions'>>(new Set(['views']));
  const [compareOn, setCompareOn] = useState(false);

  // ===== Data state =====
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [compareData, setCompareData] = useState<CompareResponse['data'] | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [traffic, setTraffic] = useState<TrafficSourcesResponse['data'] | null>(null);
  const [topContent, setTopContent] = useState<TopContentItem[]>([]);
  const [topLinks, setTopLinks] = useState<TopLinkItem[]>([]);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [searchTerms, setSearchTerms] = useState<SearchTermsResponse['data'] | null>(null);

  // ===== Loading state =====
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingTimeseries, setLoadingTimeseries] = useState(true);
  const [loadingCompare, setLoadingCompare] = useState(false);

  const isSiteWide = !viewableType;

  // بازهٔ سفارشی تا انتخاب کامل دو تاریخ، درخواستی ارسال نمی‌شود
  const periodReady = preset !== 'custom' || (!!from && !!to);

  const baseParams = useMemo(() => ({ preset, from, to, type: viewableType }), [preset, from, to, viewableType]);

  // ===== Load: overview + traffic + top content/links + downloads (+ search terms) =====
  useEffect(() => {
    if (!periodReady) return;
    let cancelled = false;
    setLoadingOverview(true);

    Promise.all([
      getOverview(baseParams),
      getTrafficSources(baseParams),
      getTopContent({ ...baseParams, limit: 10 }),
      getTopLinks({ ...baseParams, limit: 10 }),
      getDownloads({ ...baseParams, limit: 10 }),
      isSiteWide ? getSearchTerms({ preset, from, to, limit: 20 }) : Promise.resolve(null),
    ])
      .then(([ov, tr, tc, tl, dl, st]) => {
        if (cancelled) return;
        setOverview(ov.data);
        setTraffic(tr.data);
        setTopContent(tc.data || []);
        setTopLinks(tl.data || []);
        setDownloads(dl.data || []);
        setSearchTerms(st ? st.data : null);
      })
      .catch(() => {
        if (cancelled) return;
        setOverview(null);
        setTraffic(null);
        setTopContent([]);
        setTopLinks([]);
        setDownloads([]);
        setSearchTerms(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingOverview(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseParams, periodReady, isSiteWide]);

  // ===== Load: timeseries =====
  useEffect(() => {
    if (!periodReady) return;
    let cancelled = false;
    setLoadingTimeseries(true);
    getTimeseries({ ...baseParams, granularity })
      .then(res => { if (!cancelled) setTimeseries(res.data || []); })
      .catch(() => { if (!cancelled) setTimeseries([]); })
      .finally(() => { if (!cancelled) setLoadingTimeseries(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseParams, granularity, periodReady]);

  // ===== Load: compare (only when toggled on) =====
  useEffect(() => {
    if (!periodReady || !compareOn) return;
    let cancelled = false;
    setLoadingCompare(true);
    getCompare(baseParams)
      .then(res => { if (!cancelled) setCompareData(res.data); })
      .catch(() => { if (!cancelled) setCompareData(null); })
      .finally(() => { if (!cancelled) setLoadingCompare(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseParams, compareOn, periodReady]);

  const toggleMetric = (key: 'views' | 'unique_visitors' | 'sessions') => {
    setSelectedMetrics(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const trendData = useMemo(
    () => timeseries.map(p => ({ ...p, label: formatChartLabel(p, granularity) })),
    [timeseries, granularity]
  );

  const visibleKpis = KPI_CONFIGS.filter(k => isSiteWide || !k.siteWideOnly);

  const maxTrafficSessions = useMemo(() => {
    if (!traffic?.breakdown?.length) return 0;
    return Math.max(...traffic.breakdown.map(b => b.sessions));
  }, [traffic]);

  return (
    <div className="space-y-6">
      {/* ===== Header ===== */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                آمار بازدیدکنندگان{isSiteWide ? ' سایت' : ''}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                تحلیل بازدید، رفتار کاربران، منابع ترافیک و محتوای پربازدید
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCompareOn(v => !v)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              compareOn
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-gray-50 dark:bg-gray-850 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>مقایسه با دوره قبل</span>
          </button>
        </div>

        <PeriodPicker
          preset={preset}
          from={from}
          to={to}
          onChange={(v) => { setPreset(v.preset); setFrom(v.from); setTo(v.to); }}
        />
      </div>

      {/* ===== KPI Cards ===== */}
      {loadingOverview && !overview ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
        </div>
      ) : !overview ? (
        <div className="py-12 text-center text-xs font-bold text-gray-400">داده‌ای برای این بازه یافت نشد.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visibleKpis.map((kpi, idx) => (
            <div
              key={kpi.key}
              className={`p-5 rounded-2xl border space-y-1 ${KPI_CARD_STYLES[idx % KPI_CARD_STYLES.length]}`}
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span>{kpi.label}</span>
                <kpi.icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {kpi.format(overview[kpi.key] as number)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== Compare Section ===== */}
      {compareOn && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
            مقایسه با دوره قبل
          </h3>
          {loadingCompare && !compareData ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : !compareData ? (
            <div className="py-8 text-center text-xs font-bold text-gray-400">داده‌ای برای مقایسه یافت نشد.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleKpis.map(kpi => {
                const cur = compareData.current[kpi.key] as number;
                const prev = compareData.previous[kpi.key] as number;
                const hasPrev = prev !== 0 && prev !== undefined && prev !== null;
                const delta = hasPrev ? ((cur - prev) / prev) * 100 : (cur > 0 ? 100 : 0);
                const isFlat = Math.abs(delta) < 0.05;
                const isPositiveChange = isFlat ? null : (kpi.lowerIsBetter ? delta < 0 : delta > 0);
                return (
                  <div key={kpi.key} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400">
                      <span>{kpi.label}</span>
                      <kpi.icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-lg font-extrabold text-gray-900 dark:text-white">{kpi.format(cur)}</span>
                      <span
                        className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${
                          isFlat ? 'text-gray-400' : isPositiveChange ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                        }`}
                      >
                        {isFlat ? <Minus className="w-3 h-3" /> : delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {toPersianDigits(Math.abs(delta).toFixed(1))}٪
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400">دوره قبل: {kpi.format(prev)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== Trend Chart ===== */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-600" /> روند زمانی بازدید
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              {TREND_METRICS.map(m => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => toggleMetric(m.key)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedMetrics.has(m.key)
                      ? 'text-white shadow-xs'
                      : 'bg-gray-50 dark:bg-gray-850 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-800'
                  }`}
                  style={selectedMetrics.has(m.key) ? { backgroundColor: m.color } : undefined}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedMetrics.has(m.key) ? '#fff' : m.color }} />
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              {(['day', 'week', 'month'] as Granularity[]).map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGranularity(g)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                    granularity === g ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 shadow-xs' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                  }`}
                >
                  {GRANULARITY_LABELS[g]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loadingTimeseries && trendData.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
          </div>
        ) : trendData.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400">داده‌ای برای نمایش روند زمانی وجود ندارد.</div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.4} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Legend />
                {TREND_METRICS.filter(m => selectedMetrics.has(m.key)).map(m => (
                  <Area
                    key={m.key}
                    type="monotone"
                    dataKey={m.key}
                    name={m.label}
                    stroke={m.color}
                    fill={m.color}
                    fillOpacity={0.2}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ===== Traffic Sources ===== */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-500" /> منابع ترافیک
        </h3>
        {!traffic || traffic.breakdown.length === 0 ? (
          <div className="py-8 text-center text-xs font-bold text-gray-400">داده‌ای یافت نشد.</div>
        ) : (
          <div className="space-y-3">
            {traffic.breakdown
              .slice()
              .sort((a, b) => b.sessions - a.sessions)
              .map(b => (
                <div key={b.traffic_source} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-800 dark:text-gray-200">{TRAFFIC_LABELS[b.traffic_source] || b.traffic_source}</span>
                    <span className="font-mono text-gray-400">{formatInt(b.sessions)} جلسه</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: maxTrafficSessions ? `${(b.sessions / maxTrafficSessions) * 100}%` : 0,
                        backgroundColor: TRAFFIC_COLORS[b.traffic_source] || '#0d9488',
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        )}

        {traffic && traffic.top_referrers.length > 0 && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
            <h4 className="text-[11px] font-bold text-gray-500 dark:text-gray-400">برترین منابع ارجاع‌دهنده</h4>
            <div className="space-y-1.5">
              {traffic.top_referrers.map((r, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <span className="text-gray-700 dark:text-gray-300 truncate max-w-[70%]">{r.traffic_source_detail || TRAFFIC_LABELS[r.traffic_source] || r.traffic_source}</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{formatInt(r.sessions)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== Top Content / Top Links / Downloads ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Content */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500" /> پربازدیدترین محتوا
          </h3>
          {topContent.length === 0 ? (
            <div className="py-6 text-center text-[11px] font-bold text-gray-400">داده‌ای یافت نشد.</div>
          ) : (
            <div className="space-y-2.5">
              {topContent.map((item, idx) => (
                <div key={`${item.viewable_type ?? 'generic'}-${item.viewable_id ?? item.path}`} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 shrink-0 rounded-full bg-amber-500/10 text-amber-600 font-black text-[10px] flex items-center justify-center font-mono">
                        {toPersianDigits(idx + 1)}
                      </span>
                      <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{item.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono font-bold">
                      <span className="text-teal-600 dark:text-teal-400 flex items-center gap-0.5"><Eye className="w-3 h-3" />{formatInt(item.views)}</span>
                      <span className="text-indigo-500 flex items-center gap-0.5"><Users className="w-3 h-3" />{formatInt(item.unique_visitors)}</span>
                    </div>
                  </div>
                  {item.path && (
                    <a
                      href={`${PUBLIC_SITE_URL}${item.path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-[10px] text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 truncate transition-colors"
                      dir="ltr"
                    >
                      {item.path}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Links */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-indigo-500" /> پرکلیک‌ترین لینک‌ها
          </h3>
          {topLinks.length === 0 ? (
            <div className="py-6 text-center text-[11px] font-bold text-gray-400">داده‌ای یافت نشد.</div>
          ) : (
            <div className="space-y-2.5">
              {topLinks.map((link, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{link.label || link.href}</span>
                    <span className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0">{formatInt(link.clicks)}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 truncate" dir="ltr">{link.href}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Downloads */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <FileDown className="w-4 h-4 text-emerald-500" /> دانلودهای پرتکرار
          </h3>
          {downloads.length === 0 ? (
            <div className="py-6 text-center text-[11px] font-bold text-gray-400">داده‌ای یافت نشد.</div>
          ) : (
            <div className="space-y-2.5">
              {downloads.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{d.file_name || d.file_url}</span>
                  <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">{formatInt(d.downloads)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===== Search Terms (site-wide only) ===== */}
      {isSiteWide && (
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <Search className="w-4 h-4 text-teal-600" /> عبارت‌های جستجوشده
          </h3>

          {!searchTerms ? (
            <div className="py-6 text-center text-[11px] font-bold text-gray-400">داده‌ای یافت نشد.</div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/60 dark:border-teal-800/50">
                  <div className="text-[11px] font-bold text-teal-700 dark:text-teal-300">مجموع جستجوها</div>
                  <div className="text-xl font-extrabold text-teal-900 dark:text-teal-100 mt-1">{formatInt(searchTerms.total_searches)}</div>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/50">
                  <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> جستجوهای بدون نتیجه
                  </div>
                  <div className="text-xl font-extrabold text-rose-900 dark:text-rose-100 mt-1">{formatInt(searchTerms.zero_result_searches)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-gray-500 dark:text-gray-400">پرتکرارترین عبارت‌ها</h4>
                  {searchTerms.top_terms.length === 0 ? (
                    <div className="py-4 text-center text-[11px] text-gray-400">داده‌ای یافت نشد.</div>
                  ) : (
                    <div className="space-y-1.5">
                      {searchTerms.top_terms.map((t, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                          <span className="font-bold text-gray-800 dark:text-gray-200 truncate">{t.query}</span>
                          <span className="font-mono text-gray-400 shrink-0">
                            {formatInt(t.searches)} جستجو · میانگین {formatFloat1(t.avg_results)} نتیجه
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> عبارت‌های بدون نتیجه (فرصت تولید محتوا)
                  </h4>
                  {searchTerms.zero_result_terms.length === 0 ? (
                    <div className="py-4 text-center text-[11px] text-gray-400">داده‌ای یافت نشد.</div>
                  ) : (
                    <div className="space-y-1.5">
                      {searchTerms.zero_result_terms.map((t, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[11px] p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
                          <span className="font-bold text-rose-700 dark:text-rose-400 truncate">{t.query}</span>
                          <span className="font-mono text-rose-500 shrink-0">{formatInt(t.searches)} جستجو</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
