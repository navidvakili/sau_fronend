// ============================================================
// FileManagerWidget — از WidgetRenderer.tsx استخراج شد (بخش «SMART WIDGETS»).
// ============================================================

import React from 'react';
import { Download, FileText } from 'lucide-react';
import type { WidgetInstance, WidgetDataBinding } from '../../builderTypes';
import { fetchDataSourceMedia } from '../../api';
import type { MediaFile } from '../../../gallery/types';
import { useSmartData } from '../../hooks/useSmartData';
import { formatFileSize } from '../../utils/styleResolvers';
import { SmartEmpty, SmartSkeleton } from './SmartWidgetStates';

/** ویجت مخزن اسناد و فایل‌ها — اتصال به وب‌سرویس رسانه */
export const FileManagerWidget: React.FC<{
  widget: WidgetInstance;
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
}> = ({ widget, binding, containerStyle }) => {
  const { data, error, retry } = useSmartData<MediaFile>(() =>
    fetchDataSourceMedia({
      // Fetch a large page and let the server apply the type/folder filters —
      // otherwise a small per_page would cut the list BEFORE filtering and only
      // a few matching files would remain.
      per_page: 100,
      folder_id: binding.folderFilter && binding.folderFilter !== 'all' ? binding.folderFilter : null,
      type: binding.fileType || 'document'
    }).then((res) => res.data.slice(0, binding.limit || 6)),
    [binding.limit, binding.folderFilter, binding.fileType]
  );

  const files = data || [];
  const displayMode = binding.displayMode || 'list';

  const getExt = (name: string) => {
    const parts = name.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase().slice(0, 4) : 'FILE';
  };

  const fileName = (file: MediaFile) => file.title || file.name;
  const isImageFile = (file: MediaFile) => (file.type || '').startsWith('image/');

  // ── تعداد کارت در هر ردیف (حالت شبکه‌ای / کادر فایلی) ──
  const cols = Math.min(Math.max(Number(binding.columnsCount) || 3, 1), 6);
  const gridCols =
    {
      1: 'sm:grid-cols-1 lg:grid-cols-1',
      2: 'sm:grid-cols-2 lg:grid-cols-2',
      3: 'sm:grid-cols-2 lg:grid-cols-3',
      4: 'sm:grid-cols-2 lg:grid-cols-4',
      5: 'sm:grid-cols-2 lg:grid-cols-5',
      6: 'sm:grid-cols-2 lg:grid-cols-6'
    }[cols] || 'sm:grid-cols-2 lg:grid-cols-3';

  const fileBadge = (file: MediaFile, cls: string) =>
    isImageFile(file) ? (
      <img
        src={file.url}
        alt={file.name}
        loading="lazy"
        className={`rounded-lg object-cover shrink-0 ${cls}`}
      />
    ) : (
      <div className={`rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black uppercase shrink-0 ${cls}`}>
        {getExt(file.name)}
      </div>
    );

  if (error) {
    return (
      <div style={containerStyle}>
        <SmartEmpty error={error} onRetry={retry} />
      </div>
    );
  }
  if (!data) {
    return (
      <div style={containerStyle}>
        <SmartSkeleton
          variant={displayMode === 'table' ? 'table' : displayMode === 'grid' || displayMode === 'boxes' ? 'cards' : 'list'}
          count={binding.limit || 6}
        />
      </div>
    );
  }
  if (files.length === 0) return null;

  // ── حالت جدول (Table) ──
  if (displayMode === 'table') {
    return (
      <div style={containerStyle}>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800">
                <th className="px-3 py-2.5 font-bold">نام سند</th>
                <th className="px-3 py-2.5 font-bold hidden sm:table-cell">توضیح</th>
                <th className="px-3 py-2.5 font-bold">حجم</th>
                <th className="px-3 py-2.5 font-bold text-center w-14">دانلود</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
              {files.map((file) => (
                <tr key={file.id} className="hover:bg-teal-500/5 transition-colors">
                  <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2 min-w-0">
                      {fileBadge(file, 'p-1.5 text-[10px] w-8 h-8 flex items-center justify-center')}
                      <span className="truncate" title={file.name}>{fileName(file)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 hidden sm:table-cell max-w-[260px]">
                    {file.description ? (
                      <span className="line-clamp-2">{file.description}</span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {formatFileSize(file.size)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-all"
                      title="دانلود فایل"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ── حالت شبکه کارتی (Grid) ──
  if (displayMode === 'grid') {
    return (
      <div style={containerStyle}>
        <div className={`grid grid-cols-1 ${gridCols} gap-3`}>
          {files.map((file) => (
            <div
              key={file.id}
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-blue-500/30 hover:shadow-md transition-all flex flex-col gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {fileBadge(file, 'p-2.5 text-xs w-10 h-10 flex items-center justify-center')}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate" title={file.name}>
                    {fileName(file)}
                  </div>
                  <div className="text-[10px] text-slate-400">حجم: {formatFileSize(file.size)}</div>
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
              {file.description && (
                <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400 line-clamp-2 border-t border-gray-100 dark:border-slate-800 pt-2">
                  {file.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── حالت کادر کوچک فایلی (File Box) ──
  if (displayMode === 'boxes') {
    return (
      <div style={containerStyle}>
        <div className={`grid grid-cols-2 ${gridCols} gap-2.5`}>
          {files.map((file) => (
            <a
              key={file.id}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-xs hover:border-blue-500/40 hover:shadow-md transition-all flex items-center gap-2 min-w-0"
              title={file.name}
            >
              {isImageFile(file) ? (
                <img
                  src={file.url}
                  alt={file.name}
                  loading="lazy"
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black uppercase flex items-center justify-center text-[9px] shrink-0">
                  {getExt(file.name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                  {fileName(file)}
                </div>
                <div className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <FileText className="w-2.5 h-2.5" />
                  <span className="truncate">{formatFileSize(file.size)}</span>
                </div>
              </div>
              <Download className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 shrink-0 transition-colors" />
            </a>
          ))}
        </div>
      </div>
    );
  }

  // ── حالت لیست (List) — پیش‌فرض ──
  return (
    <div style={containerStyle} className="space-y-4">
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs hover:border-blue-500/30 transition-all"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {fileBadge(file, 'p-2 text-xs w-9 h-9 flex items-center justify-center')}
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate" title={file.name}>
                  {fileName(file)}
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                  <span>حجم: {formatFileSize(file.size)}</span>
                </div>
                {file.description && (
                  <p className="text-[11px] leading-5 text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {file.description}
                  </p>
                )}
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
    </div>
  );
};
