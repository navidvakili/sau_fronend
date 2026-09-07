// ============================================================
// FormEmbedWidget — از WidgetRenderer.tsx استخراج شد.
// ============================================================

import React, { useEffect, useState } from 'react';
import type { WidgetDataBinding } from '../../builderTypes';
import { fetchForm } from '../../../forms/api';
import type { FormDefinition } from '../../../forms/types';
import { FormRespondentView } from '../../../forms/FormRespondentView';

/**
 * ویجت «جاسازی فرم» — فرم منتخب از فرم‌ساز را به‌صورت واقعی (نه iframe) با همان
 * کامپوننت پاسخ‌دهی خودِ فرم‌ساز (FormRespondentView) رندر می‌کند.
 */
export const FormEmbedWidget: React.FC<{
  binding: WidgetDataBinding;
  containerStyle: React.CSSProperties;
}> = ({ binding, containerStyle }) => {
  const [form, setForm] = useState<FormDefinition | null | undefined>(undefined);

  useEffect(() => {
    if (!binding.formId) {
      setForm(null);
      return;
    }
    let cancelled = false;
    setForm(undefined);
    fetchForm(binding.formId)
      .then((f) => {
        if (!cancelled) setForm(f);
      })
      .catch(() => {
        if (!cancelled) setForm(null);
      });
    return () => {
      cancelled = true;
    };
  }, [binding.formId]);

  if (!binding.formId) {
    return (
      <div style={containerStyle} className="p-6 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 text-center">
        هنوز فرمی برای این بلوک انتخاب نشده — از پنل تنظیمات یک فرم منتشرشده انتخاب کنید.
      </div>
    );
  }
  if (form === undefined) {
    return (
      <div style={containerStyle} className="p-6 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 text-center">
        در حال دریافت فرم...
      </div>
    );
  }
  if (form === null) {
    return (
      <div style={containerStyle} className="p-6 rounded-xl bg-red-50 dark:bg-red-950/30 text-xs text-red-600 text-center">
        این فرم یافت نشد.
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <FormRespondentView form={form} isEmbedPreview />
    </div>
  );
};
