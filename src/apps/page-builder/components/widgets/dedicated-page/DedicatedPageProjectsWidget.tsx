// ============================================================
// DedicatedPageProjectsWidget — از WidgetRenderer.tsx استخراج شد
// (بخش «بلوک‌های اختصاصیِ صفحهٔ استاد»).
// ============================================================

import React from 'react';
import { CheckCircle2, Clock, FlaskConical } from 'lucide-react';
import type { WidgetDataBinding } from '../../../builderTypes';
import { fetchDedicatedPageContentsForWidget, type DedicatedPageContentItem } from '../../../api';
import { useSmartData } from '../../../hooks/useSmartData';
import { SmartEmpty, SmartSkeleton } from '../SmartWidgetStates';
import { DedicatedPageNotConfigured, dpGridColsClass } from './shared';

/** ویجت پروژه‌های تحقیقاتی — از page_contents نوع research_project (metadata: funder/status/startYear/endYear) */
export const DedicatedPageProjectsWidget: React.FC<{
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
  dedicatedPageId?: number | null;
}> = ({ binding, containerStyle, dedicatedPageId }) => {
  const { data, error, retry } = useSmartData<DedicatedPageContentItem>(
    () => (dedicatedPageId ? fetchDedicatedPageContentsForWidget(dedicatedPageId, 'research_project', binding.limit || 20, 'desc') : Promise.resolve([])),
    [dedicatedPageId, binding.limit]
  );

  if (!dedicatedPageId) {
    return <div style={containerStyle}><DedicatedPageNotConfigured /></div>;
  }

  return (
    <div style={containerStyle}>
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data ? (
        <SmartSkeleton variant="cards" count={2} />
      ) : data.length === 0 ? (
        <SmartEmpty error="هنوز پروژهٔ تحقیقاتی‌ای برای این استاد ثبت نشده است" />
      ) : (
        <div className={`grid ${dpGridColsClass(binding.columnsCount, 2)} gap-3`}>
          {data.map((item) => (
            <div key={item.id} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div className="text-xs font-black text-slate-900 dark:text-white">{item.title}</div>
              </div>
              {item.metadata?.role && <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">نقش: {item.metadata.role}</p>}
              {item.summary && <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{item.summary}</p>}
              <div className="flex flex-wrap items-center gap-x-2 text-[10px] text-slate-400">
                {item.metadata?.funder && <span>حامی مالی: {item.metadata.funder}</span>}
                {item.metadata?.status && (
                  <span className={`px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                    ['ongoing', 'در حال اجرا', 'جاری'].includes(item.metadata.status)
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {['ongoing', 'در حال اجرا', 'جاری'].includes(item.metadata.status) ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                    <span>{item.metadata.status}</span>
                  </span>
                )}
                {(item.metadata?.startYear || item.metadata?.endYear) && (
                  <span>{[item.metadata?.startYear, item.metadata?.endYear].filter(Boolean).join(' تا ')}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
