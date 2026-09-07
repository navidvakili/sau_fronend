// ============================================================
// NewsFeedWidget (+ NewsCarousel) — از WidgetRenderer.tsx استخراج شد (بخش «SMART WIDGETS»).
// بزرگ‌ترین ویجت هوشمند — یک کامپوننت با حدود ۲۰ حالت نمایش (displayMode)، همگی روی همان
// یک منبع دادهٔ اخبار؛ به‌عمد در یک فایل نگه داشته شد چون شکستنش به‌ازای هر displayMode یک
// انشعاب مصنوعی از همان منطق واحد (fetch + pagination + فیلتر) می‌بود، نه جداسازی مسئولیت واقعی.
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { Calendar, Eye, ChevronDown, ChevronUp, Megaphone, Loader2, Plus, ArrowLeft, CalendarDays } from 'lucide-react';
import type { WidgetInstance, WidgetDataBinding } from '../../builderTypes';
import { fetchDataSourceNews } from '../../api';
import type { NewsItem } from '@/src/shared-types';
import { useSmartData } from '../../hooks/useSmartData';
import { formatFaDate } from '../../utils/styleResolvers';
import { SmartEmpty, SmartSkeleton } from './SmartWidgetStates';

/** ویجت خوراک اخبار — اتصال به وب‌سرویس اخبار + فیلتر دسته‌بندی */
export const NewsFeedWidget: React.FC<{
  widget: WidgetInstance;
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
  /** وقتی categoryFilter برابر current-department است، شناسهٔ واقعی دستهٔ خبری گروه از اینجا خوانده می‌شود */
  departmentNewsCategoryId?: number | null;
}> = ({ widget, binding, containerStyle, departmentNewsCategoryId }) => {
  const categoryId =
    binding.categoryFilter === 'current-department'
      ? departmentNewsCategoryId ?? null
      : binding.categoryFilter && binding.categoryFilter !== 'all'
        ? Number(binding.categoryFilter) || null
        : null;

  // وقتی categoryFilter روی current-department است ولی گروه هیچ دستهٔ خبری‌ای وصل نکرده،
  // بلوک باید خالی بماند (طبق پیام خودِ دیالوگ انتخاب: «بدون اتصال — بلوک اخبار خالی می‌ماند») —
  // نه اینکه category_id=null به وب‌سرویس اخبار برود و همهٔ اخبار بدون فیلتر برگردد (که برای
  // هر گروهِ بدون دسته، عملاً یک فید «پیش‌فرض» یکسان نمایش می‌داد).
  const noDepartmentConnection = binding.categoryFilter === 'current-department' && categoryId === null;

  const { data, error, retry } = useSmartData<NewsItem>(() =>
    noDepartmentConnection
      ? Promise.resolve([])
      : fetchDataSourceNews({
          per_page: binding.limit || 4,
          category_id: categoryId,
          status: 'published'
        }).then((res) => res.data),
    [binding.limit, categoryId, noDepartmentConnection]
  );

  const newsList = data || [];
  const displayMode = binding.displayMode || 'grid';
  const cols = binding.columnsCount || 2;
  const gridClass =
    cols === 3
      ? 'grid grid-cols-1 md:grid-cols-3 gap-4'
      : cols === 1
        ? 'grid grid-cols-1 gap-4'
        : 'grid grid-cols-1 md:grid-cols-2 gap-4';

  const fallbackImg =
    '/placeholder-news.svg';
  const newsImg = (n: NewsItem) => n.image_url || fallbackImg;

  // ── حالت‌های تعاملی: بارگذاری بیشتر / اسکرول بی‌نهایت / زبانه / آکاردئون ──
  const [page, setPage] = useState(1);
  const [extraItems, setExtraItems] = useState<NewsItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [sliderIndex, setSliderIndex] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // با تغییر دسته/تعداد، صفحه‌بندی و حالت‌ها بازنشانی شوند
  useEffect(() => {
    setPage(1);
    setExtraItems([]);
    setHasMore(true);
    setLoadingMore(false);
    setActiveTab('all');
    setOpenIndex(null);
    setSliderIndex(0);
  }, [binding.limit, categoryId]);

  // چرخش خودکار اسلایدشو تمام عرض
  useEffect(() => {
    if (displayMode !== 'full-width-slider' || newsList.length <= 1) return;
    const t = setInterval(() => setSliderIndex((i) => (i + 1) % newsList.length), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayMode, newsList.length]);

  const loadMore = async () => {
    if (loadingMore || !hasMore || noDepartmentConnection) return;
    setLoadingMore(true);
    try {
      const res = await fetchDataSourceNews({
        page: page + 1,
        per_page: binding.limit || 4,
        category_id: categoryId,
        status: 'published'
      });
      setExtraItems((prev) => [...prev, ...res.data]);
      setHasMore(page + 1 < res.last_page);
      setPage((p) => p + 1);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  // اسکرول بی‌نهایت — مشاهده‌گر تلاقی برای بارگذاری خودکار صفحه بعد
  useEffect(() => {
    if (displayMode !== 'infinite-scroll') return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '200px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayMode, hasMore, loadingMore]);

  if (error) {
    return (
      <div style={containerStyle} className="space-y-4">
        <SmartEmpty error={error} onRetry={retry} />
      </div>
    );
  }
  if (!data) {
    return (
      <div style={containerStyle} className="space-y-4">
        <SmartSkeleton
          variant={
            [
              'list',
              'timeline',
              'numbered-list',
              'date-based',
              'accordion',
              'ticker',
              'multi-section',
              'date-badge',
              'combined',
              'featured-list'
            ].includes(displayMode)
              ? 'list'
              : displayMode === 'carousel' || displayMode === 'full-width-slider'
                ? 'table'
                : 'cards'
          }
          count={binding.limit || 4}
        />
      </div>
    );
  }
  if (newsList.length === 0) return null;

  const metaRow = (n: NewsItem, cls = 'text-[10px] text-slate-400') => (
    <div className={`flex items-center justify-between ${cls}`}>
      <span className="flex items-center gap-1">
        <Calendar className="w-3 h-3" />
        {formatFaDate(n.published_at || n.created_at)}
      </span>
      <span className="flex items-center gap-1">
        <Eye className="w-3 h-3" />
        {n.views_count}
      </span>
    </div>
  );

  const categoryBadge = (n: NewsItem, cls = 'bg-slate-900/80 text-white') => (
    <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-lg backdrop-blur-md text-[10px] font-bold ${cls}`}>
      {n.category_name || 'بدون دسته'}
    </span>
  );

  // ── نمایش لیستی (List) ──
  if (displayMode === 'list') {
    const withThumb = !!binding.newsListImage;
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="space-y-2.5">
          {newsList.map((news) => (
            <div
              key={news.id}
              className={`group p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all ${
                withThumb ? 'flex items-center gap-3' : ''
              }`}
            >
              {withThumb && (
                <img
                  src={newsImg(news)}
                  alt={news.title}
                  loading="lazy"
                  className="w-20 h-16 rounded-lg object-cover shrink-0 group-hover:scale-105 transition-transform duration-500"
                />
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {news.title}
                </h4>
                {!withThumb && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed mt-0.5">
                    {news.summary}
                  </p>
                )}
                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                    {news.category_name || 'بدون دسته'}
                  </span>
                  {metaRow(news, 'text-[10px] text-slate-400 flex items-center gap-2')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── نمایش شبکه‌ای / کارتی (Grid) — پیش‌فرض ──
  if (displayMode === 'grid') {
    return (
      <div style={containerStyle} className="space-y-4">
        <div className={gridClass}>
          {newsList.map((news) => (
            <div
              key={news.id}
              className="group rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-500/40 transition-all flex flex-col"
            >
              <div className="h-36 overflow-hidden relative">
                <img
                  src={newsImg(news)}
                  alt={news.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {categoryBadge(news)}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {news.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {news.summary}
                </p>
                <div className="pt-2 border-t border-gray-100 dark:border-slate-800/60">
                  {metaRow(news)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── کارت با عنوان روی تصویر (Grid Overlay) ──
  if (displayMode === 'grid-overlay') {
    return (
      <div style={containerStyle} className="space-y-4">
        <div className={gridClass}>
          {newsList.map((news) => (
            <div
              key={news.id}
              className="group relative rounded-2xl overflow-hidden shadow-xs hover:shadow-lg transition-all h-52"
            >
              <img
                src={newsImg(news)}
                alt={news.title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
              {categoryBadge(news)}
              <div className="absolute bottom-0 inset-x-0 p-4 space-y-1.5">
                <h4 className="text-xs font-black text-white line-clamp-2 leading-snug drop-shadow">
                  {news.title}
                </h4>
                <div className="flex items-center gap-3 text-[10px] text-slate-300">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatFaDate(news.published_at || news.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {news.views_count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── نمایش برجسته / ویژه (Featured Hero) ──
  if (displayMode === 'featured') {
    const [hero, ...rest] = newsList;
    return (
      <div style={containerStyle} className="space-y-4">
        {hero && (
          <div className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all h-64 md:h-80">
            <img
              src={newsImg(hero)}
              alt={hero.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
            {categoryBadge(hero)}
            <div className="absolute bottom-0 inset-x-0 p-5 space-y-2">
              <h3 className="text-sm md:text-lg font-black text-white line-clamp-2 leading-snug drop-shadow">
                {hero.title}
              </h3>
              <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed hidden md:block">
                {hero.summary}
              </p>
              <div className="flex items-center gap-3 text-[10px] text-slate-300">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatFaDate(hero.published_at || hero.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {hero.views_count}
                </span>
              </div>
            </div>
          </div>
        )}
        {rest.length > 0 && (
          <div className={gridClass}>
            {rest.map((news) => (
              <div
                key={news.id}
                className="group flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all"
              >
                <img
                  src={newsImg(news)}
                  alt={news.title}
                  loading="lazy"
                  className="w-20 h-16 rounded-lg object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-[11px] font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {news.title}
                  </h4>
                  <div className="mt-1 text-[10px] text-slate-400 flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {formatFaDate(news.published_at || news.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── کاروسل خبرهای ویژه (Carousel) ──
  if (displayMode === 'carousel') {
    return <NewsCarousel newsList={newsList} formatDate={formatFaDate} />;
  }

  // ── خط زمانی اخبار (News Timeline) ──
  if (displayMode === 'timeline') {
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="relative pr-6">
          <span className="absolute top-1 bottom-1 right-2 w-px bg-gradient-to-b from-indigo-500/60 via-slate-300 dark:via-slate-700 to-transparent" />
          <div className="space-y-4">
            {newsList.map((news, i) => (
              <div key={news.id} className="relative">
                <span
                  className={`absolute -right-1.5 top-4 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                    i === 0 ? 'bg-indigo-500' : 'bg-teal-500'
                  }`}
                />
                <div className="group p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {formatFaDate(news.published_at || news.created_at)}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                      {news.category_name || 'بدون دسته'}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {news.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mt-1">
                    {news.summary}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── لیست شماره‌دار (Numbered News List) ──
  if (displayMode === 'numbered-list') {
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="space-y-2.5">
          {newsList.map((news, i) => (
            <div
              key={news.id}
              className="group flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all"
            >
              <span className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-teal-500 text-white text-xs font-black tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {news.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed mt-0.5">
                  {news.summary}
                </p>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                    {news.category_name || 'بدون دسته'}
                  </span>
                  {metaRow(news, 'text-[10px] text-slate-400 flex items-center gap-2')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── لیست افقی (Horizontal List) ──
  if (displayMode === 'horizontal-list') {
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
          {newsList.map((news) => (
            <div
              key={news.id}
              className="group min-w-[240px] md:min-w-[260px] snap-start rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-500/40 transition-all shrink-0 flex flex-col"
            >
              <div className="h-32 overflow-hidden relative">
                <img
                  src={newsImg(news)}
                  alt={news.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {categoryBadge(news)}
              </div>
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {news.title}
                </h4>
                <div className="pt-2 border-t border-gray-100 dark:border-slate-800/60">
                  {metaRow(news)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── چیدمان موزاییکی (Masonry Style) ──
  if (displayMode === 'masonry') {
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="columns-2 md:columns-3 gap-4">
          {newsList.map((news) => (
            <div
              key={news.id}
              className="group break-inside-avoid mb-4 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-500/40 transition-all"
            >
              <div className="overflow-hidden relative">
                <img
                  src={newsImg(news)}
                  alt={news.title}
                  loading="lazy"
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {categoryBadge(news)}
              </div>
              <div className="p-4 space-y-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {news.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {news.summary}
                </p>
                <div className="pt-2 border-t border-gray-100 dark:border-slate-800/60">
                  {metaRow(news)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── گروه‌بندی بر اساس تاریخ (Date-based News) ──
  if (displayMode === 'date-based') {
    const grouped = new Map<string, NewsItem[]>();
    newsList.forEach((n) => {
      const d = formatFaDate(n.published_at || n.created_at) || 'بدون تاریخ';
      if (!grouped.has(d)) grouped.set(d, []);
      grouped.get(d)!.push(n);
    });
    return (
      <div style={containerStyle} className="space-y-5">
        {[...grouped.entries()].map(([date, items]) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-black flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                {date}
              </span>
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="space-y-2.5">
              {items.map((news) => (
                <div
                  key={news.id}
                  className="group p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all"
                >
                  <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {news.title}
                  </h4>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                      {news.category_name || 'بدون دسته'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {news.views_count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── تیک خبر فوری (Breaking News / Ticker) ──
  if (displayMode === 'ticker') {
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="flex items-stretch rounded-xl overflow-hidden border border-rose-200 dark:border-rose-900/40 bg-white dark:bg-slate-900 shadow-xs">
          <span className="shrink-0 flex items-center gap-1.5 px-3.5 bg-rose-600 text-white text-[11px] font-black">
            <Megaphone className="w-3.5 h-3.5" />
            خبر فوری
          </span>
          <div className="relative flex-1 overflow-hidden">
            <div className="ticker-track absolute inset-0 flex items-center whitespace-nowrap">
              {[...newsList, ...newsList].map((news, i) => (
                <span
                  key={`${news.id}-${i}`}
                  className="inline-flex items-center gap-2 px-5 text-[11px] font-bold text-slate-700 dark:text-slate-200"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  {news.title}
                </span>
              ))}
            </div>
          </div>
        </div>
        <style>{`
          .ticker-track { animation: ticker-scroll 30s linear infinite; }
          .ticker-track:hover { animation-play-state: paused; }
          @keyframes ticker-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        `}</style>
      </div>
    );
  }

  // ── خبرهای زبانه‌دار (Tabbed News) ──
  if (displayMode === 'tabbed') {
    const cats = Array.from(new Set(newsList.map((n) => n.category_name || 'بدون دسته')));
    const tabs = cats.length > 1 ? ['all', ...cats] : cats;
    const active = activeTab === 'all' && !tabs.includes('all') ? tabs[0] : activeTab;
    const filtered =
      active === 'all' ? newsList : newsList.filter((n) => (n.category_name || 'بدون دسته') === active);
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveTab(t)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                active === t
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {t === 'all' ? 'همه' : t}
            </button>
          ))}
        </div>
        <div className="space-y-2.5">
          {filtered.map((news) => (
            <div
              key={news.id}
              className="group p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all flex items-center gap-3"
            >
              <img
                src={newsImg(news)}
                alt={news.title}
                loading="lazy"
                className="w-20 h-14 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {news.title}
                </h4>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                    {news.category_name || 'بدون دسته'}
                  </span>
                  {metaRow(news, 'text-[10px] text-slate-400 flex items-center gap-2')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── اخبار آکاردئونی (Accordion News) ──
  if (displayMode === 'accordion') {
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="space-y-2">
          {newsList.map((news, i) => {
            const open = openIndex === i;
            return (
              <div
                key={news.id}
                className={`rounded-xl border transition-all overflow-hidden ${
                  open
                    ? 'border-indigo-500/50 bg-white dark:bg-slate-900 shadow-md'
                    : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="w-full flex items-center justify-between gap-3 p-3.5 cursor-pointer"
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    <span
                      className={`w-7 h-7 shrink-0 flex items-center justify-center rounded-lg text-white text-[10px] font-black ${
                        open ? 'bg-indigo-600' : 'bg-slate-400 dark:bg-slate-700'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1 leading-snug">
                      {news.title}
                    </h4>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                {open && (
                  <div className="px-3.5 pb-3.5">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {news.summary}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                        {news.category_name || 'بدون دسته'}
                      </span>
                      {metaRow(news, 'text-[10px] text-slate-400 flex items-center gap-2')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── نمایش بیشتر (Load More) ──
  if (displayMode === 'load-more') {
    const all = [...newsList, ...extraItems];
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="space-y-2.5">
          {all.map((news) => (
            <div
              key={news.id}
              className="group flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all"
            >
              <img
                src={newsImg(news)}
                alt={news.title}
                loading="lazy"
                className="w-20 h-16 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {news.title}
                </h4>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                    {news.category_name || 'بدون دسته'}
                  </span>
                  {metaRow(news, 'text-[10px] text-slate-400 flex items-center gap-2')}
                </div>
              </div>
            </div>
          ))}
        </div>
        {hasMore && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full py-2.5 rounded-xl border border-dashed border-indigo-500/40 text-indigo-600 dark:text-indigo-400 text-xs font-black flex items-center justify-center gap-1.5 hover:bg-indigo-500/5 transition-all cursor-pointer disabled:opacity-60"
          >
            {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {loadingMore ? 'در حال بارگذاری…' : 'نمایش بیشتر'}
          </button>
        )}
      </div>
    );
  }

  // ── اسکرول بی‌نهایت (Infinite Scroll) ──
  if (displayMode === 'infinite-scroll') {
    const all = [...newsList, ...extraItems];
    return (
      <div style={containerStyle} className="space-y-4">
        <div className={gridClass}>
          {all.map((news) => (
            <div
              key={news.id}
              className="group rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-500/40 transition-all flex flex-col"
            >
              <div className="h-36 overflow-hidden relative">
                <img
                  src={newsImg(news)}
                  alt={news.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {categoryBadge(news)}
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {news.title}
                </h4>
                <div className="pt-2 border-t border-gray-100 dark:border-slate-800/60">
                  {metaRow(news)}
                </div>
              </div>
            </div>
          ))}
        </div>
        {hasMore && (
          <div
            ref={sentinelRef}
            className="flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-slate-400"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                در حال بارگذاری…
              </>
            ) : (
              'برای نمایش اخبار بیشتر اسکرول کنید'
            )}
          </div>
        )}
      </div>
    );
  }

  // ── چیدمان کنار هم (Sidebar / Mixed Layout) ──
  if (displayMode === 'mixed') {
    const [main, ...rest] = newsList;
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {main && (
            <div className="lg:col-span-2 group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all h-56 md:h-72">
              <img
                src={newsImg(main)}
                alt={main.title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
              {categoryBadge(main)}
              <div className="absolute bottom-0 inset-x-0 p-5 space-y-2">
                <h3 className="text-sm md:text-lg font-black text-white line-clamp-2 leading-snug drop-shadow">
                  {main.title}
                </h3>
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed hidden md:block">
                  {main.summary}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-slate-300">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatFaDate(main.published_at || main.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {main.views_count}
                  </span>
                </div>
              </div>
            </div>
          )}
          {rest.length > 0 && (
            <div className="space-y-2.5">
              {rest.map((news) => (
                <div
                  key={news.id}
                  className="group flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all"
                >
                  <img
                    src={newsImg(news)}
                    alt={news.title}
                    loading="lazy"
                    className="w-16 h-12 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[11px] font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {news.title}
                    </h4>
                    <div className="mt-1 text-[10px] text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {formatFaDate(news.published_at || news.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── اخبار چندبخشی (Multi-Section News): دسته‌بندی بر اساس گروه خبری ──
  if (displayMode === 'multi-section') {
    const cats = Array.from(new Set(newsList.map((n) => n.category_name || 'بدون دسته')));
    let sections: { title: string; items: NewsItem[] }[];
    if (cats.length >= 2) {
      sections = cats
        .slice(0, 3)
        .map((c) => ({
          title: c,
          items: newsList.filter((n) => (n.category_name || 'بدون دسته') === c)
        }))
        .filter((s) => s.items.length > 0);
    } else {
      const half = Math.ceil(newsList.length / 2);
      sections = [
        { title: 'بخش اول', items: newsList.slice(0, half) },
        { title: 'بخش دوم', items: newsList.slice(half) }
      ].filter((s) => s.items.length > 0);
    }
    const secColors = ['bg-indigo-600', 'bg-teal-600', 'bg-rose-500'];
    return (
      <div style={containerStyle} className="space-y-4">
        <div
          className={`grid gap-4 md:grid-cols-2 ${sections.length === 3 ? 'lg:grid-cols-3' : ''}`}
        >
          {sections.map((sec, si) => (
            <div
              key={si}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs"
            >
              <div
                className={`flex items-center gap-2 px-4 py-2.5 text-white text-xs font-black ${secColors[si % secColors.length]}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                {sec.title}
              </div>
              <div className="p-3 space-y-2.5">
                {sec.items.map((news) => (
                  <div key={news.id} className="group flex items-center gap-2.5">
                    <img
                      src={newsImg(news)}
                      alt={news.title}
                      loading="lazy"
                      className="w-14 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-[11px] font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {news.title}
                      </h4>
                      <p className="mt-0.5 text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatFaDate(news.published_at || news.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── اخبار ترکیبی (Combined News): خبر شاخص + نوار کارت‌های کوچک ──
  if (displayMode === 'combined') {
    const [main, ...rest] = newsList;
    return (
      <div style={containerStyle} className="space-y-4">
        {main && (
          <div className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all h-56 md:h-72">
            <img
              src={newsImg(main)}
              alt={main.title}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
            {categoryBadge(main)}
            <div className="absolute bottom-0 inset-x-0 p-5 space-y-2">
              <h3 className="text-sm md:text-lg font-black text-white line-clamp-2 leading-snug drop-shadow">
                {main.title}
              </h3>
              <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed hidden md:block">
                {main.summary}
              </p>
              <div className="flex items-center gap-3 text-[10px] text-slate-300">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatFaDate(main.published_at || main.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {main.views_count}
                </span>
              </div>
            </div>
          </div>
        )}
        {rest.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {rest.map((news) => (
              <div
                key={news.id}
                className="group rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-500/40 transition-all"
              >
                <div className="h-20 overflow-hidden relative">
                  <img
                    src={newsImg(news)}
                    alt={news.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-2.5">
                  <h4 className="text-[10px] font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {news.title}
                  </h4>
                  <p className="mt-1 text-[9px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {formatFaDate(news.published_at || news.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── اخبار با تاریخ برجسته (Prominent Date Badge) ──
  if (displayMode === 'date-badge') {
    const dayOf = (n: NewsItem) => {
      const d = new Date(n.published_at || n.created_at || '');
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleDateString('fa-IR', { day: 'numeric' });
    };
    const monthOf = (n: NewsItem) => {
      const d = new Date(n.published_at || n.created_at || '');
      if (Number.isNaN(d.getTime())) return '';
      return d.toLocaleDateString('fa-IR', { month: 'short' });
    };
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="space-y-2.5">
          {newsList.map((news) => (
            <div
              key={news.id}
              className="group flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all"
            >
              <div className="w-14 shrink-0 rounded-xl bg-gradient-to-b from-indigo-500/10 to-teal-500/10 border border-indigo-500/20 py-2 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 leading-none">
                  {dayOf(news)}
                </span>
                <span className="mt-1 text-[9px] font-bold text-slate-400">{monthOf(news)}</span>
              </div>
              <img
                src={newsImg(news)}
                alt={news.title}
                loading="lazy"
                className="w-16 h-14 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-[11px] font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {news.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed mt-0.5">
                  {news.summary}
                </p>
                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold">
                    {news.category_name || 'بدون دسته'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {news.views_count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── نمایش مجله‌ای (Magazine Layout): شبکه‌ی نامتقارن مانند صفحه‌ی روزنامه ──
  if (displayMode === 'magazine') {
    const [lead, ...rest] = newsList;
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-fr">
          {lead && (
            <div className="col-span-2 row-span-2 group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all h-64 md:h-full">
              <img
                src={newsImg(lead)}
                alt={lead.title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
              {categoryBadge(lead)}
              <div className="absolute bottom-0 inset-x-0 p-5 space-y-2">
                <h3 className="text-sm md:text-lg font-black text-white line-clamp-2 leading-snug drop-shadow">
                  {lead.title}
                </h3>
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed hidden md:block">
                  {lead.summary}
                </p>
                <div className="flex items-center gap-3 text-[10px] text-slate-300">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatFaDate(lead.published_at || lead.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {lead.views_count}
                  </span>
                </div>
              </div>
            </div>
          )}
          {rest.map((news) => (
            <div
              key={news.id}
              className="group rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-500/40 transition-all"
            >
              <div className="h-24 overflow-hidden relative">
                <img
                  src={newsImg(news)}
                  alt={news.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-3">
                <h4 className="text-[11px] font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {news.title}
                </h4>
                <p className="mt-1 text-[10px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatFaDate(news.published_at || news.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── اسلایدشو تمام عرض (Full-Width Slider): چرخش خودکار با فلش و نقطه ──
  if (displayMode === 'full-width-slider') {
    const total = newsList.length;
    const current = newsList[sliderIndex % total] || newsList[0];
    if (!current) return null;
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="relative rounded-2xl overflow-hidden shadow-sm h-64 md:h-96">
          <img
            src={newsImg(current)}
            alt={current.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
          {categoryBadge(current)}
          <div className="absolute bottom-0 inset-x-0 p-6 space-y-2.5">
            <h3 className="text-base md:text-2xl font-black text-white line-clamp-2 leading-snug drop-shadow">
              {current.title}
            </h3>
            <p className="text-[11px] md:text-xs text-slate-300 line-clamp-2 leading-relaxed hidden md:block">
              {current.summary}
            </p>
            <div className="flex items-center gap-3 text-[10px] md:text-[11px] text-slate-300">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatFaDate(current.published_at || current.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {current.views_count}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSliderIndex((sliderIndex - 1 + total) % total)}
            className="absolute top-1/2 right-4 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition-all cursor-pointer"
            title="قبلی"
          >
            <ChevronUp className="w-5 h-5 rotate-90" />
          </button>
          <button
            type="button"
            onClick={() => setSliderIndex((sliderIndex + 1) % total)}
            className="absolute top-1/2 left-4 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition-all cursor-pointer"
            title="بعدی"
          >
            <ChevronUp className="w-5 h-5 -rotate-90" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {newsList.map((n, i) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setSliderIndex(i)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  i === sliderIndex % total ? 'w-7 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
                title={n.title}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── خبر اصلی + اخبار فرعی (Featured + Sub News List) ──
  if (displayMode === 'featured-list') {
    const [main, ...rest] = newsList;
    return (
      <div style={containerStyle} className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {main && (
            <div className="lg:col-span-3 group rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-500/40 transition-all">
              <div className="h-44 md:h-56 overflow-hidden relative">
                <img
                  src={newsImg(main)}
                  alt={main.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {categoryBadge(main)}
              </div>
              <div className="p-4 space-y-2">
                <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {main.title}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {main.summary}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-slate-800/60">
                  {metaRow(main)}
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                    ادامه مطلب
                    <ArrowLeft className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          )}
          {rest.length > 0 && (
            <div className="lg:col-span-2 space-y-2.5">
              {rest.map((news, i) => (
                <div
                  key={news.id}
                  className="group flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all"
                >
                  <span className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-[10px] font-black">
                    {i + 1}
                  </span>
                  <img
                    src={newsImg(news)}
                    alt={news.title}
                    loading="lazy"
                    className="w-14 h-11 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[11px] font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {news.title}
                    </h4>
                    <p className="mt-0.5 text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatFaDate(news.published_at || news.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

/** کاروسل اخبار — چرخش خودکار با فلش و نقطه‌های ناوبری */
const NewsCarousel: React.FC<{
  newsList: NewsItem[];
  formatDate: (d?: string) => string;
}> = ({ newsList, formatDate }) => {
  const [index, setIndex] = useState(0);
  const total = newsList.length;
  const current = newsList[index % total] || newsList[0];
  useEffect(() => {
    if (total === 0) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % total), 5000);
    return () => clearInterval(t);
  }, [total]);
  const fallbackImg =
    '/placeholder-news.svg';
  if (!current) return null;
  return (
    <div className="space-y-4">
      <div className="relative rounded-2xl overflow-hidden shadow-sm h-56 md:h-72">
        <img
          src={current.image_url || fallbackImg}
          alt={current.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent" />
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-slate-900/80 text-white text-[10px] font-bold backdrop-blur-md">
          {current.category_name || 'بدون دسته'}
        </span>
        <div className="absolute bottom-0 inset-x-0 p-5 space-y-2">
          <h3 className="text-sm md:text-lg font-black text-white line-clamp-2 leading-snug drop-shadow">
            {current.title}
          </h3>
          <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed hidden md:block">
            {current.summary}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] text-slate-300">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(current.published_at || current.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {current.views_count}
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 tabular-nums">
              {index + 1} / {total}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIndex((index - 1 + total) % total)}
          className="absolute top-1/2 right-3 -translate-y-1/2 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition-all cursor-pointer"
          title="قبلی"
        >
          <ChevronUp className="w-4 h-4 rotate-90" />
        </button>
        <button
          type="button"
          onClick={() => setIndex((index + 1) % total)}
          className="absolute top-1/2 left-3 -translate-y-1/2 p-2 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition-all cursor-pointer"
          title="بعدی"
        >
          <ChevronUp className="w-4 h-4 -rotate-90" />
        </button>
      </div>
      <div className="flex items-center justify-center gap-1.5">
        {newsList.map((n, i) => (
          <button
            key={n.id}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              i === index % total ? 'w-6 bg-indigo-500' : 'w-1.5 bg-slate-300 dark:bg-slate-700'
            }`}
            title={n.title}
          />
        ))}
      </div>
    </div>
  );
};
