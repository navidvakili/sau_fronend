// ============================================================
// useSmartData — واکشی داده با حالت‌های loading/error/retry برای ویجت‌های هوشمند.
// از WidgetRenderer.tsx استخراج شد.
// ============================================================

import { useEffect, useState, type DependencyList } from 'react';
import { fetchDedicatedPageProfessorProfileForWidget, fetchDedicatedPageAccentColorForWidget } from '../api';
import type { DedicatedPageProfessorProfile } from '../api';
import { DEFAULT_ACCENT_COLOR } from '../utils/styleResolvers';

/** هوک عمومی دریافت داده از وب‌سرویس با حالت بارگذاری/خطا */
export function useSmartData<T>(fetcher: () => Promise<T[]>, deps: DependencyList) {
  const [data, setData] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    fetcher()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'خطا در دریافت داده از وب‌سرویس');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, retryKey]);

  return { data, error, retry: () => setRetryKey((k) => k + 1) };
}

/** فچرِ مشترکِ پروفایل علمی — برای چهار ویجت تحصیلات/علایق پژوهشی/مقالات/کتب، هرکدام فقط یک فیلد را نمایش می‌دهند */
export function useDedicatedPageProfileField<T>(
  dedicatedPageId: number | string | null | undefined,
  pick: (p: DedicatedPageProfessorProfile) => T[]
) {
  return useSmartData<T>(
    () =>
      dedicatedPageId
        ? fetchDedicatedPageProfessorProfileForWidget(dedicatedPageId).then((profile) => (profile ? pick(profile) : []))
        : Promise.resolve([]),
    [dedicatedPageId]
  );
}

/** رنگ سازمانی/تاکیدیِ صفحه (layoutConfig.accentColor) — برای رنگ‌بندی پویای هدر/آیکون‌های بلوک‌های dp-* */
export function useDedicatedPageAccentColor(dedicatedPageId: number | string | null | undefined): string {
  const [accentColor, setAccentColor] = useState<string | null>(null);
  useEffect(() => {
    if (!dedicatedPageId) return;
    let cancelled = false;
    fetchDedicatedPageAccentColorForWidget(dedicatedPageId).then((color) => {
      if (!cancelled) setAccentColor(color);
    });
    return () => {
      cancelled = true;
    };
  }, [dedicatedPageId]);
  return accentColor && /^#[0-9a-fA-F]{6}$/.test(accentColor) ? accentColor : DEFAULT_ACCENT_COLOR;
}
