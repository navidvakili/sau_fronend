import React, { useState, useEffect } from 'react';
import {
  WidgetInstance,
  UserRoleCondition,
  WidgetDataBinding
} from './builderTypes';
import {
  fetchDataSourceAnnouncements,
  fetchDataSourceNews,
  fetchDataSourceMedia,
  fetchDataSourceAchievements,
  fetchDataSourcePeople
} from './api';
import type { NewsItem, AnnouncementItem, AchievementItem, PersonItem } from '@/src/shared-types';
import type { MediaFile } from '../gallery/types';
import {
  Bell,
  Newspaper,
  Image as ImageIcon,
  Award,
  UserCheck,
  FileText,
  Download,
  Calendar,
  Eye,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Play,
  Sparkles,
  Tag,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Clock,
  FolderOpen,
  Layers
} from 'lucide-react';

interface WidgetRendererProps {
  widget: WidgetInstance;
  currentUserRole?: UserRoleCondition;
  isEditorPreview?: boolean;
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

/** حالت بارگذاری ویجت هوشمند */
const SmartLoading: React.FC = () => (
  <div className="flex items-center justify-center gap-2 py-8 text-slate-400 text-xs">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span>در حال دریافت داده از وب‌سرویس...</span>
  </div>
);

/** حالت خطا / داده خالی ویجت هوشمند */
const SmartEmpty: React.FC<{ error?: string | null; onRetry?: () => void }> = ({ error, onRetry }) => (
  <div className="py-6 text-center space-y-2">
    <div className={`flex items-center justify-center gap-2 text-xs font-bold ${error ? 'text-rose-500' : 'text-slate-400'}`}>
      {error ? <AlertTriangle className="w-4 h-4" /> : <FolderOpen className="w-4 h-4" />}
      <span>{error || 'داده‌ای برای نمایش یافت نشد'}</span>
    </div>
    {error && onRetry && (
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

/** سربرگ مشترک ویجت‌های هوشمند */
const SmartHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  badge: string;
  badgeColor: string;
}> = ({ icon, title, badge, badgeColor }) => (
  <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
    <div className="flex items-center gap-2">
      <div className={`p-2 rounded-xl ${badgeColor}`}>{icon}</div>
      <h3 className="text-base font-black text-slate-900 dark:text-white">{title}</h3>
    </div>
    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md font-bold border flex items-center gap-1">
      <Tag className="w-3 h-3" />
      {badge}
    </span>
  </div>
);

// ==============================================================
// SMART WIDGETS — اتصال به وب‌سرویس‌های واقعی
// ==============================================================

/**
 * حالت ویرایش: فقط ساختار بلوک نمایش داده می‌شود (بدون دریافت داده از وب‌سرویس).
 * داده‌های واقعی فقط در پیش‌نمایش زنده (isEditorPreview=false) دریافت و نمایش داده می‌شوند.
 */
const SmartEditorPlaceholder: React.FC<{
  widget: WidgetInstance;
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
}> = ({ widget, binding, containerStyle }) => {
  const isGrid = binding.displayMode === 'grid' || binding.displayMode === 'masonry';

  return (
    <div style={containerStyle} className="space-y-4">
      <SmartHeader
        icon={<Sparkles className="w-4 h-4" />}
        title={widget.title || 'ویجت هوشمند'}
        badge="حالت ویرایش"
        badgeColor="bg-sky-500/20 text-sky-500"
      />

      <div className="rounded-xl bg-sky-500/5 border border-dashed border-sky-400/40 px-3 py-2 text-[11px] text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>
          در حالت ویرایش داده‌ها از وب‌سرویس دریافت نمی‌شوند — ساختار این بلوک در پیش‌نمایش زنده با داده واقعی نمایش داده می‌شود.
        </span>
      </div>

      {isGrid ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-600"
            >
              <ImageIcon className="w-6 h-6" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-12 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-600"
            >
              <Layers className="w-4 h-4" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** ویجت اطلاعیه‌ها — اتصال به وب‌سرویس اطلاعیه‌ها + فیلتر گروه */
const AnnouncementsFeedWidget: React.FC<{
  widget: WidgetInstance;
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
}> = ({ widget, binding, containerStyle }) => {
  const { data, error, retry } = useSmartData<AnnouncementItem>(() =>
    fetchDataSourceAnnouncements({
      per_page: binding.limit || 5,
      group: binding.categoryFilter && binding.categoryFilter !== 'all' ? binding.categoryFilter : null,
      category_id:
        binding.yearFilter && binding.yearFilter !== 'all' ? Number(binding.yearFilter) || null : null,
      status: 'published'
    }).then((res) => res.data),
    [binding.limit, binding.categoryFilter, binding.yearFilter]
  );

  let items = data || [];
  if (binding.priorityFilter && binding.priorityFilter !== 'all') {
    items = items.filter(
      (a) =>
        (binding.priorityFilter === 'urgent' && a.type === 'important') ||
        (binding.priorityFilter === 'standard' && a.type === 'normal')
    );
  }

  return (
    <div style={containerStyle} className="space-y-4">
      <SmartHeader
        icon={<Bell className="w-4 h-4" />}
        title={widget.title || 'اطلاعیه‌های متصل'}
        badge="ماژول اطلاعیه‌ها"
        badgeColor="bg-teal-500/20 text-teal-500"
      />

      {!data && !error ? (
        <SmartLoading />
      ) : error || items.length === 0 ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-teal-500/40 transition-all flex flex-col gap-1 shadow-xs"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  {item.type === 'important' && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="فوری" />
                  )}
                  {item.title}
                </span>
                <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" />
                  {formatFaDate(item.published_at || item.date)}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed truncate">
                {item.summary || item.content}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-mono text-teal-600 dark:text-teal-400">
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
          ))}
        </div>
      )}
    </div>
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
      <SmartHeader
        icon={<Newspaper className="w-4 h-4" />}
        title={widget.title || 'اخبار دانشگاه'}
        badge="ماژول اخبار"
        badgeColor="bg-indigo-500/20 text-indigo-500"
      />

      {!data && !error ? (
        <SmartLoading />
      ) : error || newsList.length === 0 ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : (
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
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-2 border-t border-gray-100 dark:border-slate-800/60">
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
      <SmartHeader
        icon={<ImageIcon className="w-4 h-4" />}
        title={widget.title || 'گالری تصاویر'}
        badge="آلبوم تصاویر"
        badgeColor="bg-amber-500/20 text-amber-500"
      />

      {!data && !error ? (
        <SmartLoading />
      ) : error || gallery.length === 0 ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : (
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
                <span className="text-[9px] text-amber-300 font-mono">{formatFileSize(img.size)}</span>
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
      <SmartHeader
        icon={<Award className="w-4 h-4" />}
        title={widget.title || 'افتخارات دانشگاه'}
        badge="ماژول افتخارات"
        badgeColor="bg-yellow-500/20 text-yellow-500"
      />

      {!data && !error ? (
        <SmartLoading />
      ) : error || achs.length === 0 ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : (
        <div className="space-y-3 relative before:absolute before:right-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-yellow-500/30">
          {achs.map((ach) => (
            <div key={ach.id} className="relative pr-9 flex flex-col gap-1">
              <div className="absolute right-2 top-1 w-5 h-5 rounded-full bg-yellow-500 text-slate-950 flex items-center justify-center text-[10px] font-black shadow-md">
                {ach.icon || '★'}
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-1 shadow-xs">
                <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white">
                  <span>{ach.title}</span>
                  <span className="font-mono text-[10px] text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded bg-yellow-500/10">
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
      <SmartHeader
        icon={<UserCheck className="w-4 h-4" />}
        title={widget.title || 'هیئت علمی و اساتید'}
        badge="سامانه پرسنلی"
        badgeColor="bg-teal-500/20 text-teal-500"
      />

      {!data && !error ? (
        <SmartLoading />
      ) : error || staffList.length === 0 ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : (
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
                {st.email && <div className="text-[10px] text-slate-400 font-mono truncate">{st.email}</div>}
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
      <SmartHeader
        icon={<FileText className="w-4 h-4" />}
        title={widget.title || 'مخزن فایل‌ها و فرم‌ها'}
        badge="مدیریت فایل"
        badgeColor="bg-blue-500/20 text-blue-500"
      />

      {!data && !error ? (
        <SmartLoading />
      ) : error || files.length === 0 ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-black text-xs uppercase shrink-0">
                  {getExt(file.name)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{file.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
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

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  widget,
  currentUserRole = 'all',
  isEditorPreview = false
}) => {
  // Check conditional display
  const cond = widget.settings.conditionalDisplay;
  if (cond && cond.enabled && !isEditorPreview) {
    if (cond.userRole && cond.userRole !== 'all') {
      if (currentUserRole !== 'all' && currentUserRole !== cond.userRole) {
        return (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs text-center font-mono">
            [محتوا بر اساس نقش کاربر «{cond.userRole}» فیلتر شده است]
          </div>
        );
      }
    }
  }

  const style = widget.settings.style || {};
  const binding = widget.settings.binding || { dataSource: 'none' };

  // Calculate container inline style
  const containerStyle: React.CSSProperties = {
    color: style.textColor,
    backgroundColor: style.backgroundColor,
    backgroundImage: style.backgroundGradient ? style.backgroundGradient : undefined,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    textAlign: style.textAlign,
    paddingTop: style.paddingTop !== undefined ? `${style.paddingTop}px` : undefined,
    paddingBottom: style.paddingBottom !== undefined ? `${style.paddingBottom}px` : undefined,
    paddingLeft: style.paddingLeft !== undefined ? `${style.paddingLeft}px` : undefined,
    paddingRight: style.paddingRight !== undefined ? `${style.paddingRight}px` : undefined,
    marginTop: style.marginTop !== undefined ? `${style.marginTop}px` : undefined,
    marginBottom: style.marginBottom !== undefined ? `${style.marginBottom}px` : undefined,
    borderRadius: style.borderRadius !== undefined ? `${style.borderRadius}px` : undefined,
    borderWidth: style.borderWidth !== undefined ? `${style.borderWidth}px` : undefined,
    borderColor: style.borderColor,
    borderStyle: style.borderWidth ? 'solid' : undefined,
    opacity: style.opacity
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
          <h2 className="text-2xl font-black tracking-tight leading-tight">
            {widget.content || widget.title}
          </h2>
        </div>
      );

    case 'text':
      return (
        <div style={containerStyle} className="transition-all leading-relaxed">
          <p className="whitespace-pre-line text-sm md:text-base">
            {widget.content || 'متن نمونه برای این ویجت قرار داده شده است.'}
          </p>
        </div>
      );

    case 'image':
      return (
        <div style={containerStyle} className="overflow-hidden transition-all">
          <img
            src={widget.imageUrl || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80'}
            alt={widget.title}
            className="w-full h-auto object-cover rounded-inherit transition-transform duration-300 hover:scale-[1.02]"
          />
        </div>
      );

    case 'button':
      return (
        <div style={containerStyle} className="inline-block transition-all">
          <a
            href={widget.buttonUrl || '#'}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm transition-all shadow-md hover:shadow-lg"
            style={{
              backgroundColor: style.backgroundColor || undefined,
              color: style.textColor || undefined,
              borderRadius: style.borderRadius ? `${style.borderRadius}px` : undefined
            }}
          >
            <span>{widget.buttonText || widget.content || 'دکمه اقدام'}</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      );

    case 'video':
      return (
        <div style={containerStyle} className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 border border-slate-700 flex items-center justify-center">
          {widget.videoUrl ? (
            <iframe
              src={widget.videoUrl}
              title={widget.title}
              className="w-full h-full border-0"
              allowFullScreen
            />
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
          <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">{widget.content || '1,420+'}</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">آمار به‌روزرسانی شده لحظه‌ای</span>
        </div>
      );

    // -------------------------------------------------------------
    // SMART DYNAMIC WIDGETS — اتصال به وب‌سرویس‌های واقعی
    // (در حالت ویرایش فقط ساختار بلوک نمایش داده می‌شود؛ داده‌ها در پیش‌نمایش)
    // -------------------------------------------------------------
    case 'announcements-feed':
      return isEditorPreview ? (
        <SmartEditorPlaceholder widget={widget} binding={binding} containerStyle={containerStyle} />
      ) : (
        <AnnouncementsFeedWidget widget={widget} binding={binding} containerStyle={containerStyle} />
      );

    case 'news-feed':
      return isEditorPreview ? (
        <SmartEditorPlaceholder widget={widget} binding={binding} containerStyle={containerStyle} />
      ) : (
        <NewsFeedWidget widget={widget} binding={binding} containerStyle={containerStyle} />
      );

    case 'image-gallery':
      return isEditorPreview ? (
        <SmartEditorPlaceholder widget={widget} binding={binding} containerStyle={containerStyle} />
      ) : (
        <ImageGalleryWidget widget={widget} binding={binding} containerStyle={containerStyle} />
      );

    case 'achievements-timeline':
      return isEditorPreview ? (
        <SmartEditorPlaceholder widget={widget} binding={binding} containerStyle={containerStyle} />
      ) : (
        <AchievementsWidget widget={widget} binding={binding} containerStyle={containerStyle} />
      );

    case 'staff-directory':
      return isEditorPreview ? (
        <SmartEditorPlaceholder widget={widget} binding={binding} containerStyle={containerStyle} />
      ) : (
        <StaffDirectoryWidget widget={widget} binding={binding} containerStyle={containerStyle} />
      );

    case 'file-manager':
      return isEditorPreview ? (
        <SmartEditorPlaceholder widget={widget} binding={binding} containerStyle={containerStyle} />
      ) : (
        <FileManagerWidget widget={widget} binding={binding} containerStyle={containerStyle} />
      );

    default:
      return (
        <div style={containerStyle} className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 text-center">
          ویجت انتخاب شده ({widget.type})
        </div>
      );
  }
};
