// ============================================================
// DedicatedPageDocumentsWidget — از WidgetRenderer.tsx استخراج شد
// (بخش «بلوک‌های اختصاصیِ صفحهٔ استاد»).
// ============================================================

import React from 'react';
import { FileText, Lock } from 'lucide-react';
import {
  fetchDedicatedPageTaxonomiesForWidget,
  fetchDedicatedPageContentsForWidget,
  type DedicatedPageTaxonomyOption,
  type DedicatedPageContentItem
} from '../../../api';
import { useSmartData } from '../../../hooks/useSmartData';
import { SmartEmpty, SmartSkeleton } from '../SmartWidgetStates';
import { DedicatedPageNotConfigured } from './shared';

/** ویجت فایل‌های درس — عمومیِ دسته‌بندی‌شده + خصوصیِ رمزدار (هر دسته پسورد جداگانه) */
export const DedicatedPageDocumentsWidget: React.FC<{
  containerStyle: React.CSSProperties;
  dedicatedPageId?: number | null;
}> = ({ containerStyle, dedicatedPageId }) => {
  const { data: taxonomies, error: taxError, retry: retryTax } = useSmartData<DedicatedPageTaxonomyOption>(
    () => (dedicatedPageId ? fetchDedicatedPageTaxonomiesForWidget(dedicatedPageId) : Promise.resolve([])),
    [dedicatedPageId]
  );
  const { data: docs, error: docError, retry: retryDocs } = useSmartData<DedicatedPageContentItem>(
    () => (dedicatedPageId ? fetchDedicatedPageContentsForWidget(dedicatedPageId, 'document', 200, 'desc') : Promise.resolve([])),
    [dedicatedPageId]
  );

  if (!dedicatedPageId) {
    return <div style={containerStyle}><DedicatedPageNotConfigured /></div>;
  }

  const error = taxError || docError;
  if (error) {
    return <div style={containerStyle}><SmartEmpty error={error} onRetry={() => { retryTax(); retryDocs(); }} /></div>;
  }
  if (!taxonomies || !docs) {
    return <div style={containerStyle}><SmartSkeleton variant="list" count={3} /></div>;
  }

  const byCategory = new Map<string, DedicatedPageContentItem[]>();
  docs.forEach((d) => {
    const key = d.category_slug || '';
    const list = byCategory.get(key) || [];
    list.push(d);
    byCategory.set(key, list);
  });

  const categories = taxonomies.filter((t) => (byCategory.get(t.slug) || []).length > 0);
  const uncategorized = byCategory.get('') || [];

  if (categories.length === 0 && uncategorized.length === 0) {
    return <div style={containerStyle}><SmartEmpty error="هنوز فایلی برای این صفحه ثبت نشده است" /></div>;
  }

  const renderFileRow = (file: DedicatedPageContentItem) => (
    <a
      key={file.id}
      href={file.file_url || undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
    >
      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate flex-1">{file.title}</span>
      {file.file_size && <span className="text-[10px] text-slate-400 shrink-0">{file.file_size}</span>}
    </a>
  );

  return (
    <div style={containerStyle} className="space-y-4">
      {categories.map((cat) => (
        <div key={cat.id} className="rounded-xl border border-gray-200 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60">
            {cat.is_private ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <FileText className="w-3.5 h-3.5 text-slate-400" />}
            <span className="text-xs font-black text-slate-800 dark:text-white">{cat.title}</span>
            {cat.is_private && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">خصوصی</span>
            )}
          </div>
          <div className="p-1.5">
            {(byCategory.get(cat.slug) || []).map(renderFileRow)}
          </div>
        </div>
      ))}
      {uncategorized.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-slate-800 p-1.5">
          {uncategorized.map(renderFileRow)}
        </div>
      )}
    </div>
  );
};
