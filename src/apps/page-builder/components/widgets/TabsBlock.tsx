// ============================================================
// TabsBlock — تب‌ها: سوئیچ بین چند SectionInstance مستقل.
// از WidgetRenderer.tsx استخراج شد.
// ============================================================

import React, { useState } from 'react';
import type { WidgetInstance, SectionInstance } from '../../builderTypes';
// چرخهٔ متقابلِ ذاتیِ حوزه: تب می‌تواند یک سکشن کامل (با ویجت‌های خودش) در خود جای دهد.
// eslint-disable-next-line import/no-cycle
import { RenderSectionReadOnly } from '../../RenderSectionReadOnly';

export const TabsBlock: React.FC<{
  widget: WidgetInstance;
  containerStyle: React.CSSProperties;
  isEditorPreview: boolean;
  pageId?: number | null;
  pageSlug?: string | null;
  variables?: Record<string, string>;
  dedicatedPageId?: number | null;
}> = ({ widget, containerStyle, isEditorPreview, pageId, pageSlug, variables, dedicatedPageId }) => {
  const [active, setActive] = useState(0);
  const tabs: { id: string; label: string; section: SectionInstance }[] = widget.settings.customProps?.tabs || [];

  if (tabs.length === 0) {
    return (
      <div style={containerStyle} className="p-6 rounded-2xl border-2 border-dashed border-gray-300 dark:border-slate-700 text-center text-xs text-slate-400">
        هنوز هیچ تبی برای این بلوک تعریف نشده است.
      </div>
    );
  }

  const activeTab = tabs[Math.min(active, tabs.length - 1)];

  return (
    <div style={containerStyle}>
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-2 mb-4">
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(i)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              i === active
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab?.section && (
        <RenderSectionReadOnly
          section={activeTab.section}
          isEditorPreview={isEditorPreview}
          pageId={pageId}
          pageSlug={pageSlug}
          variables={variables}
          dedicatedPageId={dedicatedPageId}
        />
      )}
    </div>
  );
};
