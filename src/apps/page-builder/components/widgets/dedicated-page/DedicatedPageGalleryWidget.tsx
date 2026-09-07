// ============================================================
// DedicatedPageGalleryWidget — از WidgetRenderer.tsx استخراج شد.
// ============================================================

import React from 'react';
import type { WidgetInstance, WidgetDataBinding } from '../../../builderTypes';
import { fetchDedicatedPageContentsForWidget, type DedicatedPageContentItem } from '../../../api';
import { useSmartData } from '../../../hooks/useSmartData';
import { SmartEmpty, SmartSkeleton } from '../SmartWidgetStates';
import { DedicatedPageNotConfigured, dpGridColsClass } from './shared';

/** ویجت گالری تصاویر صفحهٔ اختصاصی — تصاویر آیتم‌های نوع gallery، با فیلتر دسته‌بندی اختیاری */
export const DedicatedPageGalleryWidget: React.FC<{
  widget: WidgetInstance;
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
  dedicatedPageId?: number | null;
}> = ({ binding, containerStyle, dedicatedPageId }) => {
  const sortDir: 'asc' | 'desc' = binding.sortBy === 'date_asc' ? 'asc' : 'desc';

  const { data, error, retry } = useSmartData<DedicatedPageContentItem>(
    () =>
      dedicatedPageId
        ? fetchDedicatedPageContentsForWidget(dedicatedPageId, 'gallery', binding.limit || 12, sortDir)
        : Promise.resolve([]),
    [dedicatedPageId, binding.limit, sortDir]
  );

  if (!dedicatedPageId) {
    return (
      <div style={containerStyle}>
        <DedicatedPageNotConfigured />
      </div>
    );
  }

  const filtered =
    binding.categoryFilter && binding.categoryFilter !== 'all'
      ? (data || []).filter((item) => item.category_slug === binding.categoryFilter)
      : data || [];

  const images = filtered.flatMap((item) =>
    (item.gallery_images && item.gallery_images.length > 0 ? item.gallery_images : item.image_url ? [item.image_url] : []).map(
      (url) => ({ url, title: item.title })
    )
  );

  const isGridMode = (binding.displayMode || 'grid') === 'grid';

  return (
    <div style={containerStyle} className="space-y-4">
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data ? (
        <SmartSkeleton variant="gallery" count={4} />
      ) : images.length === 0 ? null : isGridMode ? (
        <div className={`grid ${dpGridColsClass(binding.columnsCount, 4)} gap-3`}>
          {images.map((img, idx) => (
            <div
              key={idx}
              className="group relative h-32 rounded-xl overflow-hidden bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs"
            >
              <img
                src={img.url}
                alt={img.title}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end text-white">
                <span className="text-[11px] font-bold truncate">{img.title}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                <img src={img.url} alt={img.title} className="w-full h-full object-contain" />
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{img.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
