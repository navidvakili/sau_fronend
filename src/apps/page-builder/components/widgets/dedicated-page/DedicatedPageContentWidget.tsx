// ============================================================
// DedicatedPageContentWidget — پشتیبان ویجت‌های dp-news/dp-announcements/dp-journal-issues/
// dp-articles/dp-events. از WidgetRenderer.tsx استخراج شد.
// ============================================================

import React, { useState } from 'react';
import { Clock, ExternalLink, Maximize2, Minimize2, X, UserCheck, CalendarDays, MapPin, Link2, Images, Download, ChevronRight, ChevronLeft } from 'lucide-react';
import type { WidgetInstance, WidgetDataBinding } from '../../../builderTypes';
import { fetchDedicatedPageContentsForWidget, type DedicatedPageContentItem } from '../../../api';
import { useSmartData } from '../../../hooks/useSmartData';
import { formatFaDate } from '../../../utils/styleResolvers';
import { SmartEmpty, SmartSkeleton } from '../SmartWidgetStates';
import { DedicatedPageNotConfigured, DP_TYPE_DATE_LABEL, dpGridColsClass } from './shared';

/** ویجت محتوای صفحهٔ اختصاصی — خبر/اطلاعیه/مقاله/رویداد/نسخهٔ نشریه (نوع از contentType تعیین می‌شود) */
export const DedicatedPageContentWidget: React.FC<{
  widget: WidgetInstance;
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
  contentType: 'news' | 'announcement' | 'journal_issue' | 'article' | 'event';
  dedicatedPageId?: number | null;
}> = ({ binding, containerStyle, contentType, dedicatedPageId }) => {
  const sortDir: 'asc' | 'desc' = binding.sortBy === 'date_asc' ? 'asc' : 'desc';
  const [modalItem, setModalItem] = useState<DedicatedPageContentItem | null>(null);
  const [isModalFullscreen, setIsModalFullscreen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data, error, retry } = useSmartData<DedicatedPageContentItem>(
    () =>
      dedicatedPageId
        ? fetchDedicatedPageContentsForWidget(dedicatedPageId, contentType, binding.limit || 6, sortDir)
        : Promise.resolve([]),
    [dedicatedPageId, contentType, binding.limit, sortDir]
  );

  if (!dedicatedPageId) {
    return (
      <div style={containerStyle}>
        <DedicatedPageNotConfigured />
      </div>
    );
  }

  const items = data || [];
  const isGrid = (binding.displayMode || 'grid') === 'grid';
  const dateLabel = DP_TYPE_DATE_LABEL[contentType];

  const renderCard = (item: DedicatedPageContentItem) => (
    <button
      key={item.id}
      type="button"
      onClick={() => {
        setModalItem(item);
        setIsModalFullscreen(false);
      }}
      className="rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-violet-500/40 transition-all overflow-hidden shadow-xs flex flex-col text-right cursor-pointer w-full"
    >
      {item.image_url && (
        <div className="h-28 bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
          <img src={item.image_url} alt={item.title} className="w-full h-full object-contain" />
        </div>
      )}
      <div className="p-3.5 space-y-1.5 flex-1 flex flex-col">
        <span className="text-xs font-black text-slate-900 dark:text-white line-clamp-2">{item.title}</span>
        {item.summary && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{item.summary}</p>
        )}
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-auto pt-1.5">
          {item.published_date && (
            <span className="flex items-center gap-1" title={dateLabel}>
              <Clock className="w-3 h-3" />
              {formatFaDate(item.published_date)}
            </span>
          )}
          <span className="flex items-center gap-1 text-violet-600 dark:text-violet-400 font-bold">
            مشاهدهٔ جزئیات
            <ExternalLink className="w-3 h-3" />
          </span>
        </div>
      </div>
    </button>
  );

  return (
    <>
      <div style={containerStyle} className="space-y-4">
        {error ? (
          <SmartEmpty error={error} onRetry={retry} />
        ) : !data ? (
          <SmartSkeleton variant={isGrid ? 'cards' : 'list'} count={binding.limit || 6} />
        ) : items.length === 0 ? null : isGrid ? (
          <div className={`grid ${dpGridColsClass(binding.columnsCount, 2)} gap-3`}>{items.map(renderCard)}</div>
        ) : (
          <div className="space-y-2.5">{items.map(renderCard)}</div>
        )}
      </div>

      {/* Modal جزئیات — چون آیتم‌های صفحات اختصاصی مسیر اختصاصی در سایت عمومی ندارند */}
      {modalItem && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setModalItem(null)}
        >
          <div
            className={`bg-white dark:bg-slate-900 shadow-2xl overflow-y-auto relative transition-all ${
              isModalFullscreen
                ? 'w-[calc(100vw-2rem)] h-[calc(100vh-2rem)] max-w-none rounded-2xl'
                : 'max-w-4xl w-full max-h-[85vh] rounded-2xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {modalItem.image_url && (
              <div className={`bg-slate-100 dark:bg-slate-800 overflow-hidden ${isModalFullscreen ? 'h-[40vh]' : 'h-64'}`}>
                <img src={modalItem.image_url} alt={modalItem.title} className="w-full h-full object-contain" />
              </div>
            )}
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-5 py-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">{modalItem.title}</h3>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalFullscreen((v) => !v)}
                  title={isModalFullscreen ? 'خروج از حالت تمام‌صفحه' : 'نمایش تمام‌صفحه'}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-violet-500 hover:text-white text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {isModalFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setModalItem(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-3">
              {modalItem.published_date && (
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatFaDate(modalItem.published_date)}</span>
                </div>
              )}

              {/* جزئیات اختصاصی رویداد — مدرس، زمان، مکان، ثبت‌نام و وضعیت */}
              {contentType === 'event' && modalItem.metadata && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700">
                  {modalItem.metadata.instructor && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <UserCheck className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                      <span>{modalItem.metadata.instructor}</span>
                    </div>
                  )}
                  {modalItem.metadata.event_time && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <CalendarDays className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                      <span>{modalItem.metadata.event_time}</span>
                    </div>
                  )}
                  {modalItem.metadata.location && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                      <span>{modalItem.metadata.location}</span>
                    </div>
                  )}
                  {modalItem.metadata.event_status && (
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          modalItem.metadata.event_status === 'active'
                            ? 'bg-emerald-500'
                            : modalItem.metadata.event_status === 'held'
                              ? 'bg-slate-400'
                              : 'bg-rose-400'
                        }`}
                      />
                      <span>
                        {modalItem.metadata.event_status === 'active'
                          ? 'فعال'
                          : modalItem.metadata.event_status === 'held'
                            ? 'برگزار شده'
                            : 'غیرفعال'}
                      </span>
                    </div>
                  )}
                  {modalItem.metadata.registration_link && (
                    <a
                      href={modalItem.metadata.registration_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400 font-bold sm:col-span-2"
                    >
                      <Link2 className="w-3.5 h-3.5 shrink-0" />
                      <span>لینک ثبت‌نام</span>
                    </a>
                  )}
                </div>
              )}

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

              {/* گزارش تصویری */}
              {modalItem.gallery_images && modalItem.gallery_images.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Images className="w-3.5 h-3.5" />
                    <span>گزارش تصویری</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {modalItem.gallery_images.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLightboxIndex(idx)}
                        className="h-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        <img src={url} alt={`${modalItem.title} ${idx + 1}`} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {modalItem.file_url && (
                <a
                  href={modalItem.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:border-violet-500/40 transition-all"
                >
                  <div className="w-9 h-9 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">دانلود فایل پیوست</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox — نمایش تمام‌صفحهٔ تصاویر گزارش تصویری */}
      {modalItem && lightboxIndex !== null && modalItem.gallery_images && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm select-none"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 left-4 p-2 rounded-xl bg-white/10 text-white hover:bg-rose-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="absolute top-4 right-4 text-xs font-bold text-white/70 bg-white/10 px-3 py-1.5 rounded-full">
            {lightboxIndex + 1} از {modalItem.gallery_images.length}
          </span>

          {modalItem.gallery_images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i! - 1 + modalItem.gallery_images!.length) % modalItem.gallery_images!.length);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer z-10"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          )}

          <img
            src={modalItem.gallery_images[lightboxIndex]}
            alt={`${modalItem.title} ${lightboxIndex + 1}`}
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {modalItem.gallery_images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((i) => (i! + 1) % modalItem.gallery_images!.length);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer z-10"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}
        </div>
      )}
    </>
  );
};
