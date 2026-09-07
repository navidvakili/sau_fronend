// ============================================================
// ImageGalleryWidget — از WidgetRenderer.tsx استخراج شد (بخش «SMART WIDGETS»).
// ============================================================

import React from 'react';
import type { WidgetInstance, WidgetDataBinding } from '../../builderTypes';
import { fetchDataSourceMedia } from '../../api';
import type { MediaFile } from '../../../gallery/types';
import { useSmartData } from '../../hooks/useSmartData';
import { formatFileSize } from '../../utils/styleResolvers';
import { SmartEmpty, SmartSkeleton } from './SmartWidgetStates';

/** ویجت گالری تصاویر — اتصال به وب‌سرویس رسانه */
export const ImageGalleryWidget: React.FC<{
  widget: WidgetInstance;
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
}> = ({ widget, binding, containerStyle }) => {
  const { data, error, retry } = useSmartData<MediaFile>(() =>
    fetchDataSourceMedia({
      per_page: 100,
      folder_id: binding.folderFilter && binding.folderFilter !== 'all' ? binding.folderFilter : null,
      type: 'image'
    }).then((res) => res.data.slice(0, binding.limit || 8)),
    [binding.limit, binding.folderFilter]
  );

  const gallery = data || [];

  return (
    <div style={containerStyle} className="space-y-4">
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data ? (
        <SmartSkeleton variant="gallery" count={4} />
      ) : gallery.length === 0 ? null : (
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
