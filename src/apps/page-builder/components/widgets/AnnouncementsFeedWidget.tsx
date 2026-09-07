// ============================================================
// AnnouncementsFeedWidget — از WidgetRenderer.tsx استخراج شد (بخش «SMART WIDGETS»).
// ============================================================

import React, { useState } from 'react';
import { Clock, FileText, Download, X } from 'lucide-react';
import type { WidgetInstance, WidgetDataBinding } from '../../builderTypes';
import { fetchDataSourceAnnouncements } from '../../api';
import type { AnnouncementItem } from '@/src/shared-types';
import { useSmartData } from '../../hooks/useSmartData';
import { formatFaDate } from '../../utils/styleResolvers';
import { SmartEmpty, SmartSkeleton } from './SmartWidgetStates';

/** ویجت اطلاعیه‌ها — اتصال به وب‌سرویس اطلاعیه‌ها + فیلتر گروه */
export const AnnouncementsFeedWidget: React.FC<{
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
        ) : !data ? (
          <SmartSkeleton variant="list" count={binding.limit || 5} />
        ) : items.length === 0 ? null : (
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
