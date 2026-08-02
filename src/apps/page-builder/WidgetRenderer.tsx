import React, { useState } from 'react';
import {
  WidgetInstance,
  UserRoleCondition
} from './builderTypes';
import {
  MOCK_ANNOUNCEMENTS,
  MOCK_NEWS,
  MOCK_GALLERY,
  MOCK_ACHIEVEMENTS,
  MOCK_STAFF,
  MOCK_FILES
} from './mockData';
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
  Tag
} from 'lucide-react';

interface WidgetRendererProps {
  widget: WidgetInstance;
  currentUserRole?: UserRoleCondition;
  isEditorPreview?: boolean;
}

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
    // SMART DYNAMIC WIDGETS
    // -------------------------------------------------------------
    case 'announcements-feed': {
      let items = [...MOCK_ANNOUNCEMENTS];
      if (binding.priorityFilter && binding.priorityFilter !== 'all') {
        items = items.filter(a => a.priority === binding.priorityFilter);
      }
      if (binding.limit) {
        items = items.slice(0, binding.limit);
      }

      return (
        <div style={containerStyle} className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-500">
                <Bell className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">{widget.title || 'اطلاعیه‌های متصل'}</h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 font-bold">
              ماژول اطلاعیه ها
            </span>
          </div>

          <div className="space-y-2.5">
            {items.map(item => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-teal-500/40 transition-all flex flex-col gap-1 shadow-xs"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {item.priority === 'urgent' && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="فوری" />
                    )}
                    {item.title}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{item.date}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed truncate">{item.excerpt}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'news-feed': {
      let newsList = [...MOCK_NEWS];
      if (binding.categoryFilter && binding.categoryFilter !== 'all') {
        newsList = newsList.filter(n => n.category === binding.categoryFilter);
      }
      if (binding.limit) {
        newsList = newsList.slice(0, binding.limit);
      }

      const cols = binding.columnsCount || 2;
      const gridClass = cols === 3 ? 'grid grid-cols-1 md:grid-cols-3 gap-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4';

      return (
        <div style={containerStyle} className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-500">
                <Newspaper className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">{widget.title || 'اخبار دانشگاه'}</h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-bold">
              ماژول اخبار
            </span>
          </div>

          <div className={gridClass}>
            {newsList.map(news => (
              <div
                key={news.id}
                className="group rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-500/40 transition-all flex flex-col"
              >
                <div className="h-36 overflow-hidden relative">
                  <img
                    src={news.featuredImage}
                    alt={news.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-slate-900/80 text-white text-[10px] font-bold backdrop-blur-md">
                    {news.category}
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
                      {news.publishDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {news.views}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'image-gallery': {
      let gallery = [...MOCK_GALLERY];
      if (binding.limit) {
        gallery = gallery.slice(0, binding.limit);
      }

      return (
        <div style={containerStyle} className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
                <ImageIcon className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">{widget.title || 'گالری تصاویر'}</h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
              آلبوم تصاویر
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {gallery.map(img => (
              <div
                key={img.id}
                className="group relative h-32 rounded-xl overflow-hidden bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs"
              >
                <img
                  src={img.url}
                  alt={img.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-white">
                  <span className="text-[11px] font-bold truncate">{img.title}</span>
                  <span className="text-[9px] text-amber-300 font-mono">{img.album}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'achievements-timeline': {
      let achs = [...MOCK_ACHIEVEMENTS];
      if (binding.limit) achs = achs.slice(0, binding.limit);

      return (
        <div style={containerStyle} className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-yellow-500/20 text-yellow-500">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">{widget.title || 'افتخارات دانشگاه'}</h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 font-bold">
              ماژول افتخارات
            </span>
          </div>

          <div className="space-y-3 relative before:absolute before:right-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-yellow-500/30">
            {achs.map(ach => (
              <div key={ach.id} className="relative pr-9 flex flex-col gap-1">
                <div className="absolute right-2 top-1 w-5 h-5 rounded-full bg-yellow-500 text-slate-950 flex items-center justify-center text-[10px] font-black shadow-md">
                  {ach.badgeLogo}
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-1 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white">
                    <span>{ach.title}</span>
                    <span className="font-mono text-[10px] text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded bg-yellow-500/10">{ach.year}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">{ach.issuingOrganization}</div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{ach.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'staff-directory': {
      let staffList = [...MOCK_STAFF];
      if (binding.limit) staffList = staffList.slice(0, binding.limit);

      return (
        <div style={containerStyle} className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-500/20 text-teal-500">
                <UserCheck className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">{widget.title || 'هیئت علمی و اساتید'}</h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 font-bold">
              سامانه پرسنلی
            </span>
          </div>

          <div className="space-y-3">
            {staffList.map(st => (
              <div
                key={st.id}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center gap-3 shadow-xs"
              >
                <img src={st.photo} alt={st.fullName} className="w-12 h-12 rounded-full object-cover border border-teal-500/30" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-slate-900 dark:text-white truncate">{st.fullName}</div>
                  <div className="text-[11px] text-teal-600 dark:text-teal-400 font-bold truncate">{st.titlePosition}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{st.email}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'file-manager': {
      let files = [...MOCK_FILES];
      if (binding.limit) files = files.slice(0, binding.limit);

      return (
        <div style={containerStyle} className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-500">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">{widget.title || 'مخزن فایل‌ها و فرم‌ها'}</h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold">
              مدیریت فایل
            </span>
          </div>

          <div className="space-y-2">
            {files.map(file => (
              <div
                key={file.id}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs hover:border-blue-500/30 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-black text-xs uppercase">
                    {file.fileType}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{file.fileName}</div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                      <span>حجم: {file.size}</span>
                      <span>•</span>
                      <span>دانلودها: {file.downloadCount}</span>
                    </div>
                  </div>
                </div>

                <a
                  href={file.downloadUrl}
                  className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                  title="دانلود فایل"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      );
    }

    default:
      return (
        <div style={containerStyle} className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 text-center">
          ویجت انتخاب شده ({widget.type})
        </div>
      );
  }
};
