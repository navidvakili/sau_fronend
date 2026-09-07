// ============================================================
// SearchFilterBarBlock — نوار جستجو و فیلتر دانشکده — روی سایت عمومی روی کارت‌های خواهر/فرزند
// اثر واقعی دارد (از طریق conditionalDisplay.searchParamKey/urlParamKey همان کارت‌ها)؛ این‌جا
// (بومِ ویرایشگر) فقط پیش‌نمایش بصری غیرفعال است. از WidgetRenderer.tsx استخراج شد.
// ============================================================

import React from 'react';
import { Search } from 'lucide-react';
import type { WidgetInstance } from '../../builderTypes';

export const SearchFilterBarBlock: React.FC<{ widget: WidgetInstance; containerStyle: React.CSSProperties }> = ({ widget, containerStyle }) => {
  const props = widget.settings.customProps || {};
  const placeholder: string = props.placeholder || 'جستجو...';
  const categoryLabel: string = props.categoryLabel || 'دانشکده';
  const categoryOptions: string[] = props.categoryOptions || [];
  return (
    <div style={containerStyle} className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <input
          type="text"
          disabled
          placeholder={placeholder}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl pr-9 pl-3 py-2.5 text-xs cursor-not-allowed"
        />
        <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
      </div>
      {categoryOptions.length > 0 && (
        <select
          disabled
          className="bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs cursor-not-allowed"
        >
          <option>همه {categoryLabel}‌ها</option>
          {categoryOptions.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      )}
      <span className="text-[10px] text-slate-400 basis-full">
        این نوار فقط در سایت عمومی فعال است (پیش‌نمایش غیرتعاملی)
      </span>
    </div>
  );
};
