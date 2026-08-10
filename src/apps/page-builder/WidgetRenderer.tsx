import React, { useState, useEffect, cloneElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  WidgetInstance,
  WidgetStyle,
  UserRoleCondition,
  WidgetDataBinding
} from './builderTypes';
import {
  fetchDataSourceAnnouncements,
  fetchDataSourceNews,
  fetchDataSourceMedia,
  fetchDataSourceAchievements,
  fetchDataSourcePeople,
  fetchSmartPageChildrenTree
} from './api';
import type { SmartPageTreeNode } from './api';
import type { NewsItem, AnnouncementItem, AchievementItem, PersonItem } from '@/src/shared-types';
import type { MediaFile } from '../gallery/types';
import {
  FileText,
  Download,
  Calendar,
  Eye,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Play,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Clock,
  Layers,
  MapPin,
  Phone,
  Mail,
  Share2,
  MessageCircle,
  Link2,
  Type,
  Columns,
  Rows,
  Images,
  Gauge,
  Compass,
  Code2,
  Quote,
  Info,
  Send,
  Globe,
  Hash,
  Heart,
  CheckCircle2,
  ArrowLeft,
  Users,
  UsersRound,
  BadgeDollarSign,
  BookOpen,
  Award,
  LockOpen,
  Lock,
  GraduationCap,
  ChartNoAxesColumn,
  Monitor,
  FileCheck,
  BookmarkCheck,
  Box,
  ShieldCheck,
  UserCheck,
  CircleHelp,
  Linkedin,
  Instagram,
  Youtube,
  MessagesSquare,
  MonitorPlay,
  X
} from 'lucide-react';

interface WidgetRendererProps {
  widget: WidgetInstance;
  currentUserRole?: UserRoleCondition;
  isEditorPreview?: boolean;
  /** عمق تو در تویی رندر (برای دربرگیرنده‌ها) — جلوگیری از حلقه بی‌نهایت */
  depth?: number;
  /** شناسه و slug صفحهٔ در حال ویرایش — برای ویجت child-pages (لیست زیرصفحه‌ها) */
  pageId?: number | null;
  pageSlug?: string | null;
}

/** تبدیل تاریخ ISO به تاریخ شمسی کوتاه */
const formatFaDate = (iso?: string | null): string => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fa-IR');
  } catch {
    return '';
  }
};

// ── لایه‌سازی (هم‌سطح slider-studio): شعاع گوشه، سایه، پس‌زمینه با شفافیت ──

/** سایه‌های آماده — یا رشتهٔ CSS سفارشی */
const SHADOW_PRESETS: Record<string, string> = {
  sm: '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)',
  md: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
  xl: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)'
};

/** تبدیل فیلد shadow به مقدار CSS (پریست یا رشتهٔ خام) */
const resolveBoxShadow = (shadow?: string): string | undefined => {
  if (!shadow || shadow === 'none') return undefined;
  if (shadow in SHADOW_PRESETS) return SHADOW_PRESETS[shadow];
  return shadow;
};

/** شعاع گوشه‌ها — اولویت با گوشه‌های جداگانه (مانند فتوشاپ)، وگرنه مقدار قدیمی واحد */
const resolveBorderRadius = (s: WidgetStyle): string | undefined => {
  const tl = s.borderRadiusTopLeft;
  const tr = s.borderRadiusTopRight;
  const br = s.borderRadiusBottomLeft;
  const bl = s.borderRadiusBottomRight;
  if (tl !== undefined || tr !== undefined || br !== undefined || bl !== undefined) {
    return [tl ?? 0, tr ?? 0, br ?? 0, bl ?? 0].map((v) => `${v}px`).join(' ');
  }
  return s.borderRadius !== undefined ? `${s.borderRadius}px` : undefined;
};

/** رنگ پس‌زمینهٔ ساده با اعمال شفافیت (backgroundOpacity) — فقط برای رنگ ثابت */
const resolveBackgroundColor = (s: WidgetStyle): string | undefined => {
  if (!s.backgroundColor) return undefined;
  const opacity = s.backgroundOpacity;
  if (opacity === undefined || opacity >= 100) return s.backgroundColor;
  const hex = s.backgroundColor.replace('#', '');
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(100, opacity)) / 100})`;
  }
  return s.backgroundColor;
};

/** اعمال شفافیت روی هر مقدار CSS پس‌زمینه (رنگ ثابت یا گرادیان) — رنگ‌های hex داخل گرادیان هم به rgba تبدیل می‌شوند */
export const applyBackgroundOpacity = (value?: string, opacity?: number): string | undefined => {
  if (!value) return undefined;
  if (opacity === undefined || opacity >= 100) return value;
  const alpha = Math.max(0, Math.min(100, opacity)) / 100;
  const hexToRgba = (hex: string): string => {
    const h = hex.replace('#', '');
    if (/^[0-9a-fA-F]{6}$/.test(h)) {
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return hex;
  };
  // گرادیان → همه رنگ‌های hex داخل را شفاف کن (بقیه ساختار دست‌نخورده می‌ماند)
  if (/gradient\(/i.test(value)) {
    return value.replace(/#[0-9a-fA-F]{3,8}\b/g, hexToRgba);
  }
  // رنگ ثابت
  if (/^#[0-9a-fA-F]{3,8}$/.test(value.trim())) return hexToRgba(value.trim());
  return value;
};

/** آیا URL ویدیو مستقیم است (فایل رسانه) یا جاساز (iframe)؟ */
const isDirectVideo = (url?: string): boolean => {
  if (!url) return false;
  return /\.(mp4|webm|ogg|ogv)(\?.*)?$/i.test(url);
};

/** فرمت حجم فایل (بایت → KB/MB) */
const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/** هوک عمومی دریافت داده از وب‌سرویس با حالت بارگذاری/خطا */
function useSmartData<T>(
  fetcher: () => Promise<T[]>,
  deps: React.DependencyList
) {
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    fetcher()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'خطا در دریافت داده از وب‌سرویس');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, retryKey]);

  return { data, error, retry: () => setRetryKey((k) => k + 1) };
}

/** حالت خطا / داده خالی ویجت هوشمند — فقط در صورت خطا نمایش داده می‌شود */
const SmartEmpty: React.FC<{ error?: string | null; onRetry?: () => void }> = ({ error, onRetry }) => (
  <div className="py-6 text-center space-y-2">
    <div className="flex items-center justify-center gap-2 text-xs font-bold text-rose-500">
      <AlertTriangle className="w-4 h-4" />
      <span>{error || 'داده‌ای برای نمایش یافت نشد'}</span>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1.5 mx-auto cursor-pointer"
      >
        <RefreshCw className="w-3 h-3" />
        <span>تلاش مجدد</span>
      </button>
    )}
  </div>
);

// ==============================================================
// SMART WIDGETS — اتصال به وب‌سرویس‌های واقعی
// ==============================================================

/**
 * حالت ویرایش: هیچ نمایشی رندر نمی‌شود (بدون دریافت داده از وب‌سرویس).
 * داده‌های واقعی فقط در پیش‌نمایش زنده (isEditorPreview=false) دریافت و نمایش داده می‌شوند.
 */

/** ویجت اطلاعیه‌ها — اتصال به وب‌سرویس اطلاعیه‌ها + فیلتر گروه */
const AnnouncementsFeedWidget: React.FC<{
  widget: WidgetInstance;
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
}> = ({ widget, binding, containerStyle }) => {
  const openMode = binding.openMode || 'self';
  const [modalItem, setModalItem] = useState<AnnouncementItem | null>(null);

  const { data, error, retry } = useSmartData<AnnouncementItem>(() =>
    fetchDataSourceAnnouncements({
      per_page: binding.limit || 5,
      group: binding.categoryFilter && binding.categoryFilter !== 'all' ? binding.categoryFilter : null,
      status: 'published'
    }).then((res) => res.data),
    [binding.limit, binding.categoryFilter]
  );

  let items = data || [];
  if (binding.priorityFilter && binding.priorityFilter !== 'all') {
    items = items.filter(
      (a) =>
        (binding.priorityFilter === 'urgent' && a.type === 'important') ||
        (binding.priorityFilter === 'standard' && a.type === 'normal')
    );
  }

  const renderCard = (item: AnnouncementItem) => (
    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-teal-500/40 transition-all flex flex-col gap-1 shadow-xs">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          {item.type === 'important' && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="فوری" />
          )}
          {item.title}
        </span>
        <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
          <Clock className="w-3 h-3" />
          {formatFaDate(item.published_at || item.date)}
        </span>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed truncate">
        {item.summary || item.content}
      </p>
      <div className="flex items-center gap-2 text-[10px] text-teal-600 dark:text-teal-400">
        {item.group && (
          <span className="px-1.5 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
            {item.group}
          </span>
        )}
        {item.category_name && (
          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
            {item.category_name}
          </span>
        )}
      </div>
    </div>
  );

  const itemHref = (item: AnnouncementItem) => `/announcements/${item.id}`;

  return (
    <>
      <div style={containerStyle} className="space-y-4">
        {error ? (
          <SmartEmpty error={error} onRetry={retry} />
        ) : !data || items.length === 0 ? null : (
          <div className="space-y-2.5">
            {items.map((item) =>
              openMode === 'new' ? (
                <a
                  key={item.id}
                  href={itemHref(item)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block no-underline"
                >
                  {renderCard(item)}
                </a>
              ) : openMode === 'modal' ? (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setModalItem(item)}
                  className="w-full text-right block no-underline cursor-pointer"
                >
                  {renderCard(item)}
                </button>
              ) : (
                <a key={item.id} href={itemHref(item)} className="block no-underline">
                  {renderCard(item)}
                </a>
              )
            )}
          </div>
        )}
      </div>

      {/* Modal — باز شدن اطلاعیه در پنجره modal */}
      {modalItem && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setModalItem(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-5 py-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                {modalItem.type === 'important' && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="فوری" />
                )}
                {modalItem.title}
              </h3>
              <button
                type="button"
                onClick={() => setModalItem(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                <Clock className="w-3.5 h-3.5" />
                <span>{formatFaDate(modalItem.published_at || modalItem.date)}</span>
                {modalItem.group && (
                  <span className="px-1.5 py-0.5 rounded bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400">
                    {modalItem.group}
                  </span>
                )}
              </div>
              {modalItem.content ? (
                <div
                  className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: modalItem.content }}
                />
              ) : (
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {modalItem.summary || 'بدون توضیحات'}
                </p>
              )}

              {/* فایل‌های ضمیمه اطلاعیه */}
              {modalItem.files && modalItem.files.length > 0 && (
                <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-teal-500/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-white">فایل‌های ضمیمه</h4>
                    <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                      {modalItem.files.length} فایل
                    </span>
                  </div>
                  <div className="space-y-2">
                    {modalItem.files.map((file, index) => (
                      <a
                        key={index}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-teal-50 dark:hover:bg-slate-800 hover:border-teal-500/30 transition-all group"
                      >
                        <div className="w-9 h-9 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white transition-all shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate group-hover:text-teal-700 transition-colors">
                            {file.name || `فایل ${index + 1}`}
                          </p>
                          {file.size && <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{file.size}</p>}
                        </div>
                        <Download className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-teal-500 transition-colors shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/** ویجت خوراک اخبار — اتصال به وب‌سرویس اخبار + فیلتر دسته‌بندی */
const NewsFeedWidget: React.FC<{
  widget: WidgetInstance;
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
}> = ({ widget, binding, containerStyle }) => {
  const categoryId =
    binding.categoryFilter && binding.categoryFilter !== 'all'
      ? Number(binding.categoryFilter) || null
      : null;

  const { data, error, retry } = useSmartData<NewsItem>(() =>
    fetchDataSourceNews({
      per_page: binding.limit || 4,
      category_id: categoryId,
      status: 'published'
    }).then((res) => res.data),
    [binding.limit, categoryId]
  );

  const newsList = data || [];
  const cols = binding.columnsCount || 2;
  const gridClass =
    cols === 3
      ? 'grid grid-cols-1 md:grid-cols-3 gap-4'
      : cols === 1
        ? 'grid grid-cols-1 gap-4'
        : 'grid grid-cols-1 md:grid-cols-2 gap-4';

  return (
    <div style={containerStyle} className="space-y-4">
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data || newsList.length === 0 ? null : (
        <div className={gridClass}>
          {newsList.map((news) => (
            <div
              key={news.id}
              className="group rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-500/40 transition-all flex flex-col"
            >
              <div className="h-36 overflow-hidden relative">
                <img
                  src={news.image_url || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80'}
                  alt={news.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-slate-900/80 text-white text-[10px] font-bold backdrop-blur-md">
                  {news.category_name || 'بدون دسته'}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {news.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {news.summary}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-gray-100 dark:border-slate-800/60">
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
      )}
    </div>
  );
};

/** ویجت گالری تصاویر — اتصال به وب‌سرویس رسانه */
const ImageGalleryWidget: React.FC<{
  widget: WidgetInstance;
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
}> = ({ widget, binding, containerStyle }) => {
  const { data, error, retry } = useSmartData<MediaFile>(() =>
    fetchDataSourceMedia({
      per_page: binding.limit || 8,
      folder_id: binding.folderFilter && binding.folderFilter !== 'all' ? binding.folderFilter : null
    }).then((res) => res.data.filter((f) => f.type.startsWith('image/'))),
    [binding.limit, binding.folderFilter]
  );

  const gallery = data || [];

  return (
    <div style={containerStyle} className="space-y-4">
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data || gallery.length === 0 ? null : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {gallery.map((img) => (
            <div
              key={img.id}
              className="group relative h-32 rounded-xl overflow-hidden bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs"
            >
              <img
                src={img.url}
                alt={img.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-white">
                <span className="text-[11px] font-bold truncate">{img.name}</span>
                <span className="text-[9px] text-amber-300">{formatFileSize(img.size)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** ویجت تایم‌لاین افتخارات — اتصال به وب‌سرویس افتخارات */
const AchievementsWidget: React.FC<{
  widget: WidgetInstance;
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
}> = ({ widget, binding, containerStyle }) => {
  const { data, error, retry } = useSmartData<AchievementItem>(() =>
    fetchDataSourceAchievements({
      per_page: binding.limit || 5,
      status: 'published'
    }).then((res) => res.data),
    [binding.limit]
  );

  const achs = data || [];

  return (
    <div style={containerStyle} className="space-y-4">
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data || achs.length === 0 ? null : (
        <div className="space-y-3 relative before:absolute before:right-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-yellow-500/30">
          {achs.map((ach) => (
            <div key={ach.id} className="relative pr-9 flex flex-col gap-1">
              <div className="absolute right-2 top-1 w-5 h-5 rounded-full bg-yellow-500 text-slate-950 flex items-center justify-center text-[10px] font-black shadow-md">
                {ach.icon || '★'}
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-1 shadow-xs">
                <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white">
                  <span>{ach.title}</span>
                  <span className="text-[10px] text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded bg-yellow-500/10">
                    {ach.published_at ? formatFaDate(ach.published_at) : ''}
                  </span>
                </div>
                {ach.subtitle && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">{ach.subtitle}</div>
                )}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                  {ach.desc || ach.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** ویجت دلیل اعضای هیئت علمی — اتصال به وب‌سرویس پرسنلی */
const StaffDirectoryWidget: React.FC<{
  widget: WidgetInstance;
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
}> = ({ widget, binding, containerStyle }) => {
  const { data, error, retry } = useSmartData<PersonItem>(() =>
    fetchDataSourcePeople({
      per_page: binding.limit || 6,
      type: binding.departmentFilter && binding.departmentFilter !== 'all' ? binding.departmentFilter : 'faculty_member',
      status: 'published'
    }).then((res) => res.data),
    [binding.limit, binding.departmentFilter]
  );

  const staffList = data || [];

  return (
    <div style={containerStyle} className="space-y-4">
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data || staffList.length === 0 ? null : (
        <div className="space-y-3">
          {staffList.map((st) => (
            <div
              key={st.id}
              className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center gap-3 shadow-xs"
            >
              <img
                src={st.image_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(st.title || st.lastName || '')}
                alt={st.title || `${st.firstName} ${st.lastName}`}
                className="w-12 h-12 rounded-full object-cover border border-teal-500/30 bg-slate-100"
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {st.title || `${st.firstName || ''} ${st.lastName || ''}`}
                </div>
                <div className="text-[11px] text-teal-600 dark:text-teal-400 font-bold truncate">
                  {st.rank || st.position || st.specialization}
                </div>
                {st.email && <div className="text-[10px] text-slate-400 truncate">{st.email}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** ویجت مخزن اسناد و فایل‌ها — اتصال به وب‌سرویس رسانه */
const FileManagerWidget: React.FC<{
  widget: WidgetInstance;
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
}> = ({ widget, binding, containerStyle }) => {
  const { data, error, retry } = useSmartData<MediaFile>(() =>
    fetchDataSourceMedia({
      per_page: binding.limit || 6,
      folder_id: binding.folderFilter && binding.folderFilter !== 'all' ? binding.folderFilter : null
    }).then((res) => res.data.filter((f) => !f.type.startsWith('image/'))),
    [binding.limit, binding.folderFilter]
  );

  const files = data || [];

  const getExt = (name: string) => {
    const parts = name.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase().slice(0, 4) : 'FILE';
  };

  return (
    <div style={containerStyle} className="space-y-4">
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data || files.length === 0 ? null : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-xs uppercase shrink-0">
                  {getExt(file.name)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{file.name}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2">
                    <span>حجم: {formatFileSize(file.size)}</span>
                  </div>
                </div>
              </div>

              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shrink-0"
                title="دانلود فایل"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==============================================================
// NEW STATIC BLOCKS — بلوک‌های جدید سازنده صفحه
// ==============================================================

/** آیکون‌های قابل انتخاب برای باکس آیکون / متن‌های دارای آیکون */
const iconMap: Record<string, React.ReactNode> = {
  map: <MapPin className="w-5 h-5" />,
  phone: <Phone className="w-5 h-5" />,
  mail: <Mail className="w-5 h-5" />,
  share: <Share2 className="w-5 h-5" />,
  chat: <MessageCircle className="w-5 h-5" />,
  link: <Link2 className="w-5 h-5" />,
  type: <Type className="w-5 h-5" />,
  columns: <Columns className="w-5 h-5" />,
  rows: <Rows className="w-5 h-5" />,
  images: <Images className="w-5 h-5" />,
  gauge: <Gauge className="w-5 h-5" />,
  compass: <Compass className="w-5 h-5" />,
  code: <Code2 className="w-5 h-5" />,
  quote: <Quote className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
  send: <Send className="w-5 h-5" />,
  globe: <Globe className="w-5 h-5" />,
  hash: <Hash className="w-5 h-5" />,
  heart: <Heart className="w-5 h-5" />,
  check: <CheckCircle2 className="w-5 h-5" />,
  arrow: <ArrowLeft className="w-5 h-5" />,
  users: <Users className="w-5 h-5" />,
  dollar: <BadgeDollarSign className="w-5 h-5" />,
  external: <ExternalLink className="w-5 h-5" />,
  students: <UsersRound className="w-5 h-5" />,
  book: <BookOpen className="w-5 h-5" />,
  award: <Award className="w-5 h-5" />,
  unlock: <LockOpen className="w-5 h-5" />,
  lock: <Lock className="w-5 h-5" />,
  grad: <GraduationCap className="w-5 h-5" />,
  sparkles: <Sparkles className="w-5 h-5" />,
  stat: <ChartNoAxesColumn className="w-5 h-5" />,
  monitor: <Monitor className="w-5 h-5" />,
  'file-check': <FileCheck className="w-5 h-5" />,
  'bookmark-check': <BookmarkCheck className="w-5 h-5" />,
  layers: <Layers className="w-5 h-5" />,
  box: <Box className="w-5 h-5" />,
  'shield-check': <ShieldCheck className="w-5 h-5" />,
  'user-check': <UserCheck className="w-5 h-5" />,
  'file-text': <FileText className="w-5 h-5" />,
  'circle-question-mark': <CircleHelp className="w-5 h-5" />,
  linkedin: <Linkedin className="w-5 h-5" />,
  instagram: <Instagram className="w-5 h-5" />,
  x: <X className="w-5 h-5" />,
  youtube: <Youtube className="w-5 h-5" />,
  telegram: <Send className="w-5 h-5" />,
  aparat: <MonitorPlay className="w-5 h-5" />,
  bale: <MessagesSquare className="w-5 h-5" />,
  eitaa: <MessageCircle className="w-5 h-5" />,
};

/** استخراج گزینه‌ها از محتوای متنی (هر خط: برچسب|مقدار|...) */
const parseLines = (content: string, separators = '|،,;'): string[][] =>
  (content || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(new RegExp(`[${separators}]`)).map((p) => p.trim()));

// ────────────────────────────────────────────────
// رندر آیکون‌های درج‌شده در متن (توکن [icon:name])
// ────────────────────────────────────────────────
const ICON_TOKEN_RE = /\[icon:([a-zA-Z-]+)\]/g;

/** اندازه آیکون داخل متن */
const inlineIconClass = 'inline-block w-4 h-4 align-middle mx-1 shrink-0';

/** جایگزینی توکن‌های [icon:name] در متن ساده با کامپوننت آیکون */
const renderTextWithIcons = (content: string): ReactNode => {
  const parts = (content || '').split(ICON_TOKEN_RE);
  // split با گروه ضبط‌شده: [متن, نام, متن, نام, ...]
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      const el = iconMap[part];
      if (!el) return `[icon:${part}]`;
      return cloneElement(el as ReactElement<any, any>, { className: inlineIconClass, key: `ic-${i}` });
    }
    return part;
  });
};

/** جایگزینی توکن‌های [icon:name] در HTML (ریش‌تکست) با SVG درون‌خطی */
const renderHtmlWithIcons = (html: string): string => {
  return (html || '').replace(ICON_TOKEN_RE, (match, name: string) => {
    const el = iconMap[name];
    if (!el) return match;
    try {
      return renderToStaticMarkup(cloneElement(el as ReactElement<any, any>, { className: inlineIconClass }));
    } catch {
      return match;
    }
  });
};

/** بلوک متن غنی WYSIWYG (محتوای HTML) */
const RichTextBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => (
  <div
    style={containerStyle}
    className="transition-all richtext-content"
    dangerouslySetInnerHTML={{
      __html:
        renderHtmlWithIcons(
          widget.content ||
            '<p>متن غنی خود را اینجا بنویسید — از HTML برای تیتر، پاراگراف، لینک و آیکون استفاده کنید.</p>'
        )
    }}
  />
);

/** باکس آیکون — آیکون + عنوان + متن */
const IconBoxBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const icon = iconMap[props.iconName || widget.iconName || 'sparkles'] || <Sparkles className="w-5 h-5" />;
  return (
    <div style={containerStyle} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm text-right flex flex-col items-start gap-3 transition-all hover:shadow-md">
      <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">{icon}</div>
      <h3 className="text-base font-black text-slate-900 dark:text-white">{widget.title || 'عنوان باکس آیکون'}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        {widget.content || 'توضیحات کوتاه این باکس در این بخش نمایش داده می‌شود.'}
      </p>
      {props.buttonUrl && (
        <a href={props.buttonUrl} className="mt-1 inline-flex items-center gap-1 text-xs font-black text-teal-600 dark:text-teal-400 hover:gap-2 transition-all cursor-pointer">
          {props.buttonText || 'بیشتر بدانید'} <ArrowLeft className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
};

/** دربرگیرنده (Container) — عمودی یا افقی؛ شامل زیربلوک‌ها */
const ContainerBlock: React.FC<{
  widget: WidgetInstance;
  containerStyle: React.CSSProperties;
  vertical: boolean;
  depth: number;
  isEditorPreview: boolean;
}> = ({ widget, containerStyle, vertical, depth, isEditorPreview }) => {
  const children: WidgetInstance[] = (widget.settings.customProps?.children as WidgetInstance[]) || [];
  const gap = (widget.settings.customProps?.gap as number) ?? 16;

  return (
    <div
      style={{
        ...containerStyle,
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row',
        gap: `${gap}px`,
        flexWrap: vertical ? undefined : 'wrap',
      }}
      className={`rounded-2xl p-4 transition-all ${
        vertical
          ? 'flex-col'
          : 'flex-row items-stretch'
      }`}
    >
      {children.length === 0 ? (
        <div className="flex-1 min-h-[80px] rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs text-slate-400">
          <Layers className="w-4 h-4 ml-1.5" />
          دربرگیرنده خالی — از پنل تنظیمات زیربلوک‌ها را مدیریت کنید
        </div>
      ) : (
        children.map((child) => (
          <div key={child.id} style={vertical ? undefined : { flex: 1, minWidth: 180 }} className={vertical ? undefined : 'flex'}>
            <WidgetRenderer
              widget={child}
              currentUserRole="all"
              isEditorPreview={isEditorPreview}
              depth={depth + 1}
            />
          </div>
        ))
      )}
    </div>
  );
};

/** اسلایدر تصویر — چرخش خودکار تصاویر */
const ImageSliderBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const images: string[] =
    (props.images as string[]) ||
    parseLines(widget.content || '').map((p) => p[0]).filter(Boolean) ||
    [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % images.length), 3500);
    return () => clearInterval(t);
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div style={containerStyle} className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 aspect-video text-slate-400 text-xs">
        <Images className="w-5 h-5" />
        تصاویری برای اسلایدر تنظیم نشده است
      </div>
    );
  }

  return (
    <div style={containerStyle} className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 group">
      <img src={images[index]} alt={`اسلاید ${index + 1}`} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
      <div className="absolute bottom-3 right-4 text-white text-sm font-black drop-shadow">
        {index + 1} / {images.length}
      </div>
      <div className="absolute bottom-3 left-3 flex gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
            aria-label={`اسلاید ${i + 1}`}
          />
        ))}
      </div>
      <button
        onClick={() => setIndex((index - 1 + images.length) % images.length)}
        className="absolute top-1/2 right-2 -translate-y-1/2 p-2 rounded-full bg-slate-950/40 hover:bg-slate-950/70 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        aria-label="اسلاید قبلی"
      >
        <ChevronUp className="w-4 h-4 rotate-90" />
      </button>
      <button
        onClick={() => setIndex((index + 1) % images.length)}
        className="absolute top-1/2 left-2 -translate-y-1/2 p-2 rounded-full bg-slate-950/40 hover:bg-slate-950/70 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        aria-label="اسلاید بعدی"
      >
        <ChevronDown className="w-4 h-4 rotate-90" />
      </button>
    </div>
  );
};

/** شمارنده — عدد متحرک با پیشوند/پسوند + آیکون و استایل کامل (رنگ/اندازه عدد، کپشن) */
const CounterBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const style = widget.settings.style || {};
  const target = Number(props.target ?? (parseFloat(widget.content) || 100));
  const prefix = props.prefix || '';
  const suffix = props.suffix || '+';
  const duration = Number(props.duration) || 1200;
  // رنگ عدد — تنظیم اختصاصی شمارنده یا رنگ متن عمومی ویجت
  const numberColor = props.numberColor || style.textColor || '#0f172a';
  const numberFontSize = props.numberFontSize ? `${props.numberFontSize}px` : undefined;
  const captionColor = props.captionColor || style.textColor || '#64748b';
  const captionFontSize = props.captionFontSize ? `${props.captionFontSize}px` : undefined;
  // کپشن: متن ویجت (content) اولویت دارد؛ وگرنه عنوان ویجت
  const hasRealContent = !!widget.content && widget.content !== 'محتوای اولیه این ویجت در ویرایشگر قرار گرفته است.';
  const caption = hasRealContent ? widget.content : (widget.title || 'شمارنده آماری');
  const icon = props.icon ? iconMap[props.icon] : null;
  const iconColor = props.iconColor || numberColor;
  const iconSize = Number(props.iconSize) || 32;
  const layout = props.layout || 'stacked';
  const align = props.align || 'center';
  const alignCls =
    align === 'center' ? 'items-center text-center'
    : align === 'start' ? 'items-start text-start'
    : 'items-end text-end';
  // فاصله بین اجزا — تنظیم «فاصله بین اجزا (px)» در پنل
  const gap = Number(props.gap) || 6;
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  // عدد نهایی (شبح نامرئی) — باکس در طول انیمیشن کوچک/بزرگ نمی‌شود و از کارت بیرون نمی‌زند
  const finalStr = `${prefix}${target.toLocaleString('fa-IR')}${suffix}`;
  const displayStr = `${prefix}${value.toLocaleString('fa-IR')}${suffix}`;
  const iconEl = icon
    ? cloneElement(icon as ReactElement<any, any>, { className: '', style: { width: iconSize, height: iconSize } })
    : null;
  const numberBox = (
    <div
      className="relative font-black leading-none"
      style={{ color: numberColor, fontSize: numberFontSize || undefined, maxWidth: '100%', overflowWrap: 'anywhere' }}
    >
      <span className="invisible">{finalStr}</span>
      <span className="absolute inset-0 flex items-center justify-center" style={{ color: numberColor }}>
        {displayStr}
      </span>
    </div>
  );

  return (
    <div style={{ ...containerStyle, gap: `${gap}px` }} className={`p-6 rounded-2xl bg-gradient-to-br from-teal-500/10 to-indigo-500/10 border border-teal-500/20 flex flex-col ${alignCls}`}>
      {layout === 'inline' ? (
        <div className={`flex items-center ${align === 'center' ? 'justify-center' : ''}`} style={{ gap: `${gap}px` }}>
          {iconEl}
          {numberBox}
        </div>
      ) : (
        <>
          {iconEl ? (
            <div style={{ color: iconColor }} className="mb-1 flex items-center justify-center">
              {iconEl}
            </div>
          ) : null}
          {numberBox}
        </>
      )}
      {caption ? (
        <span className="font-bold whitespace-pre-line" style={{ color: captionColor, fontSize: captionFontSize || undefined }}>
          {caption}
        </span>
      ) : null}
    </div>
  );
};

/** پیمایشگر — فهرستی از نوشته‌ها/برگه‌ها/پست‌های تایپ‌های دلخواه */
const NavigatorBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const postType = props.postType || 'صفحه';
  const items: { label: string; url: string }[] =
    (props.items as { label: string; url: string }[]) ||
    parseLines(widget.content || '').map((p) => ({ label: p[0] || 'مورد', url: p[1] || '#' }));

  return (
    <div style={containerStyle} className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center gap-2">
        <Compass className="w-4 h-4 text-indigo-500" />
        <span className="text-xs font-black text-slate-900 dark:text-white">{widget.title || 'پیمایش سریع'}</span>
        <span className="mr-auto text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">{postType}</span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-slate-800">
        {(items.length ? items : [{ label: 'نمونه نوشته ۱', url: '#' }, { label: 'نمونه برگه ۲', url: '#' }]).map((item, i) => (
          <a
            key={i}
            href={item.url || '#'}
            className="flex items-center gap-2.5 px-4 py-3 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
          >
            <span className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5" />
            </span>
            <span className="flex-1 font-bold">{item.label}</span>
            <ArrowLeft className="w-3.5 h-3.5 text-slate-300" />
          </a>
        ))}
      </div>
    </div>
  );
};

/** نوار راهبری — برند + لینک‌های منو با استایل کامل (رنگ/سایز/انیمیشن هر آیتم) */
const NavMenuBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const brand = props.brand || widget.title;
  const brandColor = props.brandColor || '#ffffff';
  const brandFontSize = props.brandFontSize ? `${props.brandFontSize}px` : undefined;
  const brandPosition = props.brandPosition || 'start';
  const menuPosition = props.menuPosition || 'start';
  const defaultItemColor = props.itemColor || '#e2e8f0';
  const defaultItemFontSize = props.itemFontSize || 13;
  const hoverColor = props.itemHoverColor || '#ffffff';
  const defaultAnimation = props.itemAnimation || 'underline';
  // آیتم‌های منو — اولویت: customProps.items ساختاریافته ← fallback: content (هر خط عنوان|لینک) ← legacy items
  const hasRealContent = !!widget.content && widget.content !== 'محتوای اولیه این ویجت در ویرایشگر قرار گرفته است.';
  const contentItems = parseLines(widget.content || '').map((p) => ({ label: p[0] || 'مورد', url: p[1] || '#' }));
  const items: { label: string; url: string; color?: string; fontSize?: number; animation?: string; bold?: boolean }[] =
    (props.items as any[]) && (props.items as any[]).length > 0
      ? (props.items as any[])
      : hasRealContent && contentItems.length > 0
        ? contentItems
        : [];

  // استایل‌های داینامیک (هاور + انیمیشن) — اسکوپ‌شده با شناسهٔ ویجت
  const uid = `nm-${String(widget.id).replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const animCss = `
.${uid} .nm-item{position:relative;transition:color .2s ease,transform .2s ease,opacity .2s ease}
.${uid} .nm-item:hover{color:${hoverColor}!important}
.${uid} .nm-anim-underline::after{content:'';position:absolute;bottom:-3px;right:0;width:0;height:2px;background:${hoverColor};transition:width .25s ease}
.${uid} .nm-anim-underline:hover::after{width:100%}
.${uid} .nm-anim-fade:hover{opacity:.6}
.${uid} .nm-anim-slide:hover{transform:translateY(-2px)}
.${uid} .nm-anim-pulse{animation:${uid}-pulse 2.2s ease-in-out infinite}
@keyframes ${uid}-pulse{0%,100%{opacity:1}50%{opacity:.55}}
`;

  // ترازبندی — برند در راست/وسط/چپ و تراز نوار منو
  let navCls = 'flex items-center gap-4 flex-wrap';
  if (brandPosition === 'center') {
    navCls += '';
  } else if (menuPosition === 'center') {
    navCls += ' mx-auto';
  } else if (menuPosition === 'end') {
    navCls += ' me-auto';
  } else {
    navCls += ' ms-auto';
  }

  return (
    <>
      <style>{animCss}</style>
      <div
        style={containerStyle}
        className={`flex items-center gap-4 flex-wrap py-1.5 ${brandPosition === 'center' ? 'justify-center' : ''}`}
      >
        {brand && brandPosition !== 'end' ? (
          <strong
            className="font-black whitespace-nowrap"
            style={{ color: brandColor, fontSize: brandFontSize }}
          >
            {brand}
          </strong>
        ) : null}
        <nav className={navCls}>
          {items.map((item, i) => {
            const anim = item.animation || defaultAnimation;
            const cls = [
              'nm-item',
              'font-bold',
              'cursor-pointer',
              anim && anim !== 'none' ? `nm-anim-${anim}` : ''
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <a
                key={i}
                href={item.url || '#'}
                className={cls}
                style={{
                  color: item.color || defaultItemColor,
                  fontSize: item.fontSize ? `${item.fontSize}px` : `${defaultItemFontSize}px`,
                  fontWeight: item.bold ? 900 : undefined
                }}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
        {brand && brandPosition === 'end' ? (
          <strong
            className="font-black whitespace-nowrap"
            style={{ color: brandColor, fontSize: brandFontSize }}
          >
            {brand}
          </strong>
        ) : null}
      </div>
    </>
  );
};

/** لیست زیرصفحه‌ها — زیرصفحه‌های صفحهٔ فعلی را از وب‌سرویس می‌خواند
 *  حالت «درختی» (tree): همهٔ نسل‌ها به‌صورت تودرتو.
 *  حالت «مستقیم» (direct): فقط زیرصفحه‌های مستقیم همین صفحه (هر صفحه در خودش). */
const ChildPagesBlock: React.FC<{
  widget: WidgetInstance;
  containerStyle: React.CSSProperties;
  pageId?: number | null;
}> = ({ widget, containerStyle, pageId }) => {
  const props = widget.settings.customProps || {};
  const limit = Number(props.limit) || 12;
  const mode = props.mode === 'direct' ? 'direct' : 'tree';

  const { data, error, retry } = useSmartData<SmartPageTreeNode>(() =>
    pageId ? fetchSmartPageChildrenTree(pageId) : Promise.resolve([]),
    [pageId]
  );

  const children = (data || []).slice(0, limit);

  // ردیف بازگشتی — عنوان + نام زیرصفحه‌های آن (بدون تاریخ)
  // در محیط مدیریت، کلیک روی ردیف‌ها هیچ عملی انجام نمی‌دهد (فقط پیش‌نمایش بصری)
  const renderRow = (node: SmartPageTreeNode, depth: number): React.ReactNode => {
    const subs = mode === 'tree' ? node.children || [] : [];
    if (depth > 6) return null;
    return (
      <div key={node.id} className="min-w-0">
        <div
          className="flex items-center gap-2.5 px-4 py-3 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-teal-600 dark:hover:text-teal-400 transition-all cursor-default select-none"
          style={depth > 0 ? { paddingRight: `${18 + depth * 20}px` } : undefined}
        >
          <span className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <FileText className={`${depth > 0 ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
          </span>
          <span className="flex-1 font-bold truncate">{node.title}</span>
          <ArrowLeft className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        </div>
        {subs.length > 0 && (
          <div className="border-r border-teal-500/10 mr-5">
            {subs.map((sub) => renderRow(sub, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // بدون pageId (صفحهٔ جدید هنوز ذخیره نشده) → ساختار نمونه نمایش داده می‌شود
  if (!pageId) {
    return (
      <div style={containerStyle} className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-teal-500" />
          {widget.title || 'لیست زیرصفحه‌ها'}
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          این ویجت زیرصفحه‌های این صفحه را به‌صورت خودکار فهرست می‌کند.
          ابتدا صفحه را ذخیره کنید تا فهرست واقعی نمایش داده شود.
        </p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {widget.title ? (
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-teal-500" />
          {widget.title}
        </h3>
      ) : null}
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data ? (
        <div className="grid gap-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : children.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400">
          هنوز زیرصفحه‌ای برای این صفحه ساخته نشده است.
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {children.map((child) => renderRow(child, 0))}
          </div>
        </div>
      )}
    </div>
  );
};

/** نقشه — جاسازی نقشه گوگل */
const MapBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const embedUrl =
    props.embedUrl ||
    widget.content ||
    'https://www.google.com/maps?q=Yazd&output=embed';

  return (
    <div style={containerStyle} className="rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-800">
      <iframe
        src={embedUrl}
        title={widget.title || 'نقشه'}
        className="w-full h-72 border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="px-4 py-2.5 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-rose-500" />
        {props.address || widget.title || 'نشانی روی نقشه'}
      </div>
    </div>
  );
};

/** اطلاعات تماس */
const ContactInfoBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const rows: { icon: React.ReactNode; label: string; value: string; href?: string }[] = [
    { icon: <Phone className="w-4 h-4" />, label: 'تلفن', value: props.phone || '۰۳۵-۳۱۲۳۴۵۶۷', href: `tel:${props.phone || ''}` },
    { icon: <Mail className="w-4 h-4" />, label: 'ایمیل', value: props.email || 'info@example.ac.ir', href: `mailto:${props.email || ''}` },
    { icon: <MapPin className="w-4 h-4" />, label: 'نشانی', value: props.address || 'یزد، بلوار دانشگاه، دانشگاه علم و هنر' },
    { icon: <Clock className="w-4 h-4" />, label: 'ساعات کاری', value: props.workHours || 'شنبه تا چهارشنبه ۸ تا ۱۶' },
  ];

  return (
    <div style={containerStyle} className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-5 space-y-3">
      <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
        <Phone className="w-4 h-4 text-teal-500" />
        {widget.title || 'اطلاعات تماس'}
      </h3>
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-3 text-xs">
          <span className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">{row.icon}</span>
          <span className="text-slate-400 w-16 shrink-0 font-bold">{row.label}</span>
          {row.href ? (
            <a href={row.href} className="font-bold text-slate-700 dark:text-slate-200 hover:text-teal-600 transition-colors cursor-pointer" dir="auto">
              {row.value}
            </a>
          ) : (
            <span className="font-bold text-slate-700 dark:text-slate-200" dir="auto">{row.value}</span>
          )}
        </div>
      ))}
    </div>
  );
};

/** HTML دلخواه */
const CustomHtmlBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => (
  <div
    style={containerStyle}
    className="transition-all custom-html-block"
    dangerouslySetInnerHTML={{
      __html:
        widget.content ||
        '<div style="padding:24px;border:2px dashed #94a3b8;border-radius:12px;text-align:center;color:#94a3b8;font-size:13px">HTML دلخواه خود را در پنل تنظیمات وارد کنید</div>'
    }}
  />
);

/** لینک‌های اجتماعی */
const SocialLinksBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const networks = ['telegram', 'instagram', 'twitter', 'linkedin', 'youtube', 'whatsapp'];
  const labels: Record<string, string> = { telegram: 'تلگرام', instagram: 'اینستاگرام', twitter: 'توییتر', linkedin: 'لینکدین', youtube: 'یوتیوب', whatsapp: 'واتساپ' };
  const colors: Record<string, string> = { telegram: 'bg-sky-500', instagram: 'bg-pink-600', twitter: 'bg-sky-600', linkedin: 'bg-blue-700', youtube: 'bg-rose-600', whatsapp: 'bg-emerald-500' };
  const urls = props.urls as Record<string, string> | undefined;

  return (
    <div style={containerStyle} className="flex items-center gap-2.5">
      <span className="text-xs font-black text-slate-600 dark:text-slate-300">{widget.title || 'ما را دنبال کنید'}</span>
      {networks.map((n) => {
        const url = urls?.[n] || '#';
        return (
          <a
            key={n}
            href={url}
            title={labels[n]}
            className={`w-9 h-9 rounded-full ${colors[n]} text-white flex items-center justify-center hover:scale-110 hover:shadow-lg transition-all cursor-pointer`}
          >
            <Share2 className="w-4 h-4" />
          </a>
        );
      })}
    </div>
  );
};

/** دکمه‌های اشتراک‌گذاری */
const ShareButtonsBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const url = props.pageUrl || (typeof window !== 'undefined' ? window.location.href : '#');
  const encoded = encodeURIComponent(url);
  const title = encodeURIComponent(widget.title || 'صفحه');
  const shareItems = [
    { label: 'تلگرام', color: 'bg-sky-500', href: `https://t.me/share/url?url=${encoded}&text=${title}` },
    { label: 'واتساپ', color: 'bg-emerald-500', href: `https://wa.me/?text=${title}%20${encoded}` },
    { label: 'توییتر', color: 'bg-sky-600', href: `https://twitter.com/intent/tweet?url=${encoded}&text=${title}` },
    { label: 'لینکدین', color: 'bg-blue-700', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encoded}` },
    { label: 'ایمیل', color: 'bg-slate-500', href: `mailto:?subject=${title}&body=${encoded}` },
  ];

  return (
    <div style={containerStyle} className="flex items-center gap-2">
      <span className="text-xs font-black text-slate-600 dark:text-slate-300 flex items-center gap-1">
        <Share2 className="w-3.5 h-3.5 text-teal-500" />
        اشتراک‌گذاری:
      </span>
      {shareItems.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          title={item.label}
          className="px-2.5 py-1.5 rounded-lg text-[10px] font-black text-white hover:scale-105 transition-all cursor-pointer shadow-sm"
          style={{ backgroundColor: item.color }}
        >
          {item.label}
        </a>
      ))}
    </div>
  );
};

/** جدول قیمت */
const PricingTableBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const plans: { name: string; price: string; features: string[]; highlight?: boolean }[] =
    (props.plans as { name: string; price: string; features: string[]; highlight?: boolean }[]) ||
    [
      { name: 'پایه', price: 'رایگان', features: ['۱ نوشته', 'پشتیبانی ایمیل'] },
      { name: 'حرفه‌ای', price: '۱٬۵۰۰٬۰۰۰ تومان', features: ['۱۰ نوشته', 'پشتیبانی ۲۴/۷', 'گزارش پیشرفته'], highlight: true },
      { name: 'سازمانی', price: 'تماس بگیرید', features: ['نامحدود', 'مشاور اختصاصی'] },
    ];

  return (
    <div style={containerStyle}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan, i) => (
          <div
            key={i}
            className={`rounded-2xl p-5 border flex flex-col gap-3 transition-all ${
              plan.highlight
                ? 'border-teal-500 bg-gradient-to-b from-teal-500/10 to-transparent shadow-lg -translate-y-1'
                : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-white">{plan.name}</span>
              {plan.highlight && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-teal-600 text-white">پیشنهادی</span>}
            </div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{plan.price}</div>
            <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
              {plan.features.map((f, j) => (
                <li key={j} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="#"
              className={`mt-auto text-center py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                plan.highlight
                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-teal-500 hover:text-white text-slate-700 dark:text-slate-200'
              }`}
            >
              انتخاب این پلن
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

/** نظر کاربر (Testimonial) */
const TestimonialBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  return (
    <div style={containerStyle} className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-3">
      <Quote className="w-8 h-8 text-teal-500/40" />
      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
        {widget.content || 'تجربه کاربری یا نظر یک نفر از مخاطبان شما در این بخش نمایش داده می‌شود.'}
      </p>
      <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-slate-800">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-500 text-white flex items-center justify-center font-black text-sm">
          {(props.author || 'ک').slice(0, 1)}
        </div>
        <div>
          <div className="text-xs font-black text-slate-900 dark:text-white">{props.author || 'کاربر نمونه'}</div>
          <div className="text-[10px] text-slate-400">{props.role || 'دانشجوی دانشگاه'}</div>
        </div>
      </div>
    </div>
  );
};

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  widget,
  currentUserRole = 'all',
  isEditorPreview = false,
  depth = 0,
  pageId,
  pageSlug
}) => {
  // Check conditional display
  const cond = widget.settings.conditionalDisplay;
  if (cond && cond.enabled && !isEditorPreview) {
    if (cond.userRole && cond.userRole !== 'all') {
      if (currentUserRole !== 'all' && currentUserRole !== cond.userRole) {
        return (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs text-center">
            [محتوا بر اساس نقش کاربر «{cond.userRole}» فیلتر شده است]
          </div>
        );
      }
    }
  }

  const style = widget.settings.style || {};
  const binding = widget.settings.binding || { dataSource: 'none' };

  // Calculate container inline style (تنظیمات لایه — هم‌سطح slider-studio)
  const containerStyle: React.CSSProperties = {
    color: style.textColor,
    backgroundColor: resolveBackgroundColor(style),
    backgroundImage: style.backgroundGradient ? style.backgroundGradient : undefined,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    textAlign: style.textAlign,
    lineHeight: style.lineHeight !== undefined ? style.lineHeight : undefined,
    letterSpacing: style.letterSpacing !== undefined ? `${style.letterSpacing}px` : undefined,
    textTransform: style.textTransform,
    paddingTop: style.paddingTop !== undefined ? `${style.paddingTop}px` : undefined,
    paddingBottom: style.paddingBottom !== undefined ? `${style.paddingBottom}px` : undefined,
    paddingLeft: style.paddingLeft !== undefined ? `${style.paddingLeft}px` : undefined,
    paddingRight: style.paddingRight !== undefined ? `${style.paddingRight}px` : undefined,
    marginTop: style.marginTop !== undefined ? `${style.marginTop}px` : undefined,
    marginBottom: style.marginBottom !== undefined ? `${style.marginBottom}px` : undefined,
    marginLeft: style.marginLeft !== undefined ? `${style.marginLeft}px` : undefined,
    marginRight: style.marginRight !== undefined ? `${style.marginRight}px` : undefined,
    borderRadius: resolveBorderRadius(style),
    borderWidth: style.borderWidth !== undefined ? `${style.borderWidth}px` : undefined,
    borderColor: style.borderColor,
    borderStyle: style.borderWidth ? (style.borderStyle || 'solid') : undefined,
    boxShadow: resolveBoxShadow(style.shadow),
    opacity: style.opacity,
    maxWidth: style.maxWidth !== undefined ? `${style.maxWidth}px` : undefined,
    width: style.widthMode === 'auto' || style.widthMode === 'center' ? 'fit-content' : undefined,
    marginInline: style.widthMode === 'center' ? 'auto' : undefined
  };

  // State for accordions
  const [accordionOpen, setAccordionOpen] = useState(false);

  // Dynamic Widget Rendering
  switch (widget.type) {
    // -------------------------------------------------------------
    // STATIC WIDGETS
    // -------------------------------------------------------------
    case 'heading':
      return (
        <div style={containerStyle} className="transition-all">
          <h2
            className="tracking-tight leading-tight"
            style={{
              fontSize: style.fontSize || '1.5rem',
              fontWeight: style.fontWeight || 900
            }}
          >
            {renderTextWithIcons(widget.content || widget.title)}
          </h2>
        </div>
      );

    case 'text':
      return (
        <div style={containerStyle} className="transition-all leading-relaxed">
          <p
            className="whitespace-pre-line text-sm md:text-base"
            style={{ fontSize: style.fontSize || undefined }}
          >
            {renderTextWithIcons(widget.content || 'متن نمونه برای این ویجت قرار داده شده است.')}
          </p>
        </div>
      );

    case 'image': {
      const frame = style.imageFrame;
      const squaredFrame = frame === 'square' || frame === 'circle';
      // شعاع گوشه فقط روی خود تصویر اعمال شود، نه روی بلوک/قالب دور آن
      const { borderRadius: _containerRadius, ...imgWrapperStyle } = containerStyle;
      return (
        <div
          style={imgWrapperStyle}
          className={`overflow-hidden transition-all ${
            squaredFrame ? 'aspect-square' : ''
          }`}
        >
          <img
            src={widget.imageUrl || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80'}
            alt={widget.title}
            className={`transition-transform duration-300 hover:scale-[1.02] ${
              squaredFrame ? 'w-full h-full' : 'w-full h-auto'
            }`}
            style={{
              objectFit: style.objectFit || 'cover',
              borderRadius:
                frame === 'circle'
                  ? '9999px'
                  : resolveBorderRadius(style) || (frame === 'rounded' ? '16px' : undefined)
            }}
          />
        </div>
      );
    }

    case 'button': {
      // استایل ظاهری (رنگ پس‌زمینه/خط/سایه/پدینگ) فقط روی خود دکمه اعمال شود —
      // wrapper فقط چیدمان است؛ وگرنه رنگ/خطِ پشت دکمه به‌صورت باکس دیده می‌شود
      const {
        backgroundColor: _wrapBg,
        backgroundImage: _wrapBgImage,
        lineHeight: _wrapLh,
        borderRadius: _wrapBr,
        borderWidth: _wrapBw,
        borderColor: _wrapBc,
        borderStyle: _wrapBs,
        boxShadow: _wrapSh,
        paddingTop: _wrapPt,
        paddingBottom: _wrapPb,
        paddingLeft: _wrapPl,
        paddingRight: _wrapPr,
        ...buttonWrapperStyle
      } = containerStyle;
      return (
        <div style={buttonWrapperStyle} className={`transition-all ${style.fullWidth ? 'w-full' : 'inline-block'}`}>
          <a
            href={widget.buttonUrl || '#'}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 font-black text-sm transition-all ${
              style.fullWidth ? 'w-full' : ''
            }`}
            style={{
              backgroundColor: resolveBackgroundColor(style),
              backgroundImage: style.backgroundGradient ? style.backgroundGradient : undefined,
              color: style.textColor || undefined,
              borderRadius: resolveBorderRadius(style),
              borderWidth: style.borderWidth !== undefined ? `${style.borderWidth}px` : undefined,
              borderColor: style.borderColor,
              borderStyle: style.borderWidth ? (style.borderStyle || 'solid') : undefined,
              boxShadow: resolveBoxShadow(style.shadow),
              paddingTop: style.paddingTop !== undefined ? `${style.paddingTop}px` : undefined,
              paddingBottom: style.paddingBottom !== undefined ? `${style.paddingBottom}px` : undefined,
              paddingLeft: style.paddingLeft !== undefined ? `${style.paddingLeft}px` : undefined,
              paddingRight: style.paddingRight !== undefined ? `${style.paddingRight}px` : undefined,
              fontFamily: style.fontFamily,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              letterSpacing: style.letterSpacing !== undefined ? `${style.letterSpacing}px` : undefined,
              textTransform: style.textTransform
            }}
          >
            {widget.iconName && iconMap[widget.iconName] ? (
              cloneElement(iconMap[widget.iconName] as ReactElement<any, any>, {
                className: 'w-4 h-4 shrink-0',
                key: 'btn-icon'
              })
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            <span>{widget.buttonText || widget.content || 'دکمه اقدام'}</span>
          </a>
        </div>
      );
    }

    case 'video':
      return (
        <div
          style={{
            ...containerStyle,
            aspectRatio: style.aspectRatio || '16 / 9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          className="relative overflow-hidden bg-slate-900"
        >
          {widget.videoUrl ? (
            isDirectVideo(widget.videoUrl) ? (
              <video
                src={widget.videoUrl}
                poster={style.videoPoster || undefined}
                autoPlay={style.videoAutoplay}
                loop={style.videoLoop}
                muted={style.videoMuted}
                controls={style.videoControls !== false}
                playsInline
                className="w-full h-full object-cover"
                style={{ objectFit: style.objectFit || 'cover' }}
              />
            ) : (
              <iframe
                src={widget.videoUrl}
                title={widget.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="p-4 rounded-full bg-teal-500/20 text-teal-400">
                <Play className="w-8 h-8 fill-current" />
              </div>
              <span className="text-xs font-bold">پخش‌کننده ویدیوهای آموزشی</span>
            </div>
          )}
        </div>
      );

    case 'divider':
      return (
        <div style={containerStyle} className="py-3">
          <hr className="border-t border-slate-200 dark:border-slate-800" />
        </div>
      );

    case 'spacer':
      return <div style={{ height: `${style.paddingTop || 32}px` }} />;

    case 'accordion':
      return (
        <div style={containerStyle} className="border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
          <button
            onClick={() => setAccordionOpen(!accordionOpen)}
            className="w-full p-4 flex items-center justify-between text-right font-black text-sm text-slate-900 dark:text-white cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <span>{widget.title || 'سوال یا لایه آکاردئونی'}</span>
            {accordionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {accordionOpen && (
            <div className="p-4 border-t border-gray-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-950/30">
              {widget.content || 'محتوای متنی آکاردئون در این بخش نمایش داده می‌شود.'}
            </div>
          )}
        </div>
      );

    case 'stat-card':
      return (
        <div style={containerStyle} className="p-6 rounded-2xl bg-gradient-to-br from-teal-500/10 to-indigo-500/10 border border-teal-500/20 text-right flex flex-col gap-1">
          <div className="text-xs text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">{widget.title}</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{widget.content || '1,420+'}</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">آمار به‌روزرسانی شده لحظه‌ای</span>
        </div>
      );

    // -------------------------------------------------------------
    // NEW STATIC BLOCKS — بلوک‌های جدید سازنده صفحه
    // -------------------------------------------------------------
    case 'richtext':
      return <RichTextBlock widget={widget} containerStyle={containerStyle} />;

    case 'icon-box':
      return <IconBoxBlock widget={widget} containerStyle={containerStyle} />;

    case 'vertical-container':
      return (
        <ContainerBlock
          widget={widget}
          containerStyle={containerStyle}
          vertical
          depth={depth}
          isEditorPreview={isEditorPreview}
        />
      );

    case 'horizontal-container':
      return (
        <ContainerBlock
          widget={widget}
          containerStyle={containerStyle}
          vertical={false}
          depth={depth}
          isEditorPreview={isEditorPreview}
        />
      );

    case 'image-slider':
      return <ImageSliderBlock widget={widget} containerStyle={containerStyle} />;

    case 'counter':
      return <CounterBlock widget={widget} containerStyle={containerStyle} />;

    case 'navigator':
      return <NavigatorBlock widget={widget} containerStyle={containerStyle} />;

    case 'nav-menu':
      return <NavMenuBlock widget={widget} containerStyle={containerStyle} />;

    case 'child-pages':
      return (
        <ChildPagesBlock
          widget={widget}
          containerStyle={containerStyle}
          pageId={pageId}
        />
      );

    case 'map':
      return <MapBlock widget={widget} containerStyle={containerStyle} />;

    case 'contact-info':
      return <ContactInfoBlock widget={widget} containerStyle={containerStyle} />;

    case 'custom-html':
      return <CustomHtmlBlock widget={widget} containerStyle={containerStyle} />;

    case 'social-links':
      return <SocialLinksBlock widget={widget} containerStyle={containerStyle} />;

    case 'share-buttons':
      return <ShareButtonsBlock widget={widget} containerStyle={containerStyle} />;

    case 'pricing-table':
      return <PricingTableBlock widget={widget} containerStyle={containerStyle} />;

    case 'testimonial':
      return <TestimonialBlock widget={widget} containerStyle={containerStyle} />;

    case 'callout':
      return (
        <div
          style={containerStyle}
          className="flex items-start gap-3 p-4 rounded-2xl border border-amber-300/40 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200"
        >
          <span className="p-2 rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-300 shrink-0">
            {iconMap[widget.iconName || 'info'] || <Info className="w-5 h-5" />}
          </span>
          <div>
            <div className="text-sm font-black">{widget.title || 'یادآوری یا نکته مهم'}</div>
            <p className="text-xs leading-relaxed mt-1">{widget.content || 'این متن می‌تواند نکته، هشدار یا اطلاعیه مهم باشد.'}</p>
          </div>
        </div>
      );

    case 'icon':
      return (
        <div style={containerStyle} className="flex justify-center">
          <span className="p-4 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 inline-flex">
            {iconMap[widget.iconName || 'sparkles'] || <Sparkles className="w-6 h-6" />}
          </span>
        </div>
      );

    // -------------------------------------------------------------
    // SMART DYNAMIC WIDGETS — اتصال به وب‌سرویس‌های واقعی
    // (در حالت ویرایش فقط ساختار بلوک نمایش داده می‌شود؛ داده‌ها در پیش‌نمایش)
    // -------------------------------------------------------------
    case 'announcements-feed':
      return isEditorPreview ? null : <AnnouncementsFeedWidget widget={widget} binding={binding} containerStyle={containerStyle} />;

    case 'news-feed':
      return isEditorPreview ? null : <NewsFeedWidget widget={widget} binding={binding} containerStyle={containerStyle} />;

    case 'image-gallery':
      return isEditorPreview ? null : <ImageGalleryWidget widget={widget} binding={binding} containerStyle={containerStyle} />;

    case 'achievements-timeline':
      return isEditorPreview ? null : <AchievementsWidget widget={widget} binding={binding} containerStyle={containerStyle} />;

    case 'staff-directory':
      return isEditorPreview ? null : <StaffDirectoryWidget widget={widget} binding={binding} containerStyle={containerStyle} />;

    case 'file-manager':
      return isEditorPreview ? null : <FileManagerWidget widget={widget} binding={binding} containerStyle={containerStyle} />;

    default:
      return (
        <div style={containerStyle} className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 text-center">
          ویجت انتخاب شده ({widget.type})
        </div>
      );
  }
};
