// ============================================================
// DedicatedPageCoursesTimelineWidget — از WidgetRenderer.tsx استخراج شد
// (بخش «بلوک‌های اختصاصیِ صفحهٔ استاد»).
// ============================================================

import React from 'react';
import type { WidgetDataBinding } from '../../../builderTypes';
import { fetchDedicatedPageContentsForWidget, type DedicatedPageContentItem } from '../../../api';
import { useSmartData } from '../../../hooks/useSmartData';
import { SmartEmpty, SmartSkeleton } from '../SmartWidgetStates';
import { DedicatedPageNotConfigured } from './shared';
import { DEFAULT_ACCENT_COLOR, accentWithAlpha } from '../../../utils/styleResolvers';

/** ویجت تایم‌لاین دروس ارائه‌شده — از page_contents نوع course (metadata: term/year/code) */
export const DedicatedPageCoursesTimelineWidget: React.FC<{
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
  dedicatedPageId?: number | null;
  accentColor?: string;
}> = ({ binding, containerStyle, dedicatedPageId, accentColor = DEFAULT_ACCENT_COLOR }) => {
  const { data, error, retry } = useSmartData<DedicatedPageContentItem>(
    () => (dedicatedPageId ? fetchDedicatedPageContentsForWidget(dedicatedPageId, 'course', binding.limit || 50, 'desc') : Promise.resolve([])),
    [dedicatedPageId, binding.limit]
  );

  if (!dedicatedPageId) {
    return <div style={containerStyle}><DedicatedPageNotConfigured /></div>;
  }

  const items = (data || []).slice().sort((a, b) => {
    const ay = Number(a.metadata?.year) || 0;
    const by = Number(b.metadata?.year) || 0;
    return by - ay;
  });

  return (
    <div style={containerStyle}>
      {error ? (
        <SmartEmpty error={error} onRetry={retry} />
      ) : !data ? (
        <SmartSkeleton variant="list" count={4} />
      ) : items.length === 0 ? (
        <SmartEmpty error="هنوز درسی برای این استاد ثبت نشده است" />
      ) : (
        <div className="relative pr-6 space-y-6">
          <div className="absolute right-[7px] top-1 bottom-1 w-0.5" style={{ backgroundColor: accentWithAlpha(accentColor, '33') }} />
          {items.map((item) => (
            <div key={item.id} className="relative">
              <span className="absolute right-[-24px] top-1 w-3.5 h-3.5 rounded-full ring-4" style={{ backgroundColor: accentColor, boxShadow: `0 0 0 4px ${accentWithAlpha(accentColor, '26')}` }} />
              <div className="text-[10px] font-bold" style={{ color: accentColor }}>
                {[item.metadata?.term, item.metadata?.year].filter(Boolean).join(' — ')}
              </div>
              <div className="text-xs font-black text-slate-900 dark:text-white mt-0.5 flex items-center gap-2 flex-wrap">
                <span>{item.title}</span>
                {item.metadata?.level && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: accentWithAlpha(accentColor, '1a'), color: accentColor }}>{item.metadata.level}</span>
                )}
                {item.metadata?.units && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-500/10 text-slate-500 dark:text-slate-400 font-bold">{item.metadata.units} واحد</span>
                )}
              </div>
              {item.metadata?.code && <div className="text-[11px] text-slate-400">کد درس: {item.metadata.code}</div>}
              {item.summary && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{item.summary}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
