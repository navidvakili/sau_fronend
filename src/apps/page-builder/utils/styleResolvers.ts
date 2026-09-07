// ============================================================
// Style resolution helpers — شعاع گوشه، سایه، پس‌زمینه با شفافیت، رنگ accent، فرمت تاریخ/حجم.
// از WidgetRenderer.tsx استخراج شد.
// ============================================================

import type { WidgetStyle } from '../builderTypes';

/** تبدیل تاریخ ISO به تاریخ شمسی کوتاه */
export const formatFaDate = (iso?: string | null): string => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('fa-IR');
  } catch {
    return '';
  }
};

/** فرمت حجم فایل (بایت → KB/MB) */
export const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ── لایه‌سازی (هم‌سطح slider-studio): شعاع گوشه، سایه، پس‌زمینه با شفافیت ──

/** سایه‌های آماده — یا رشتهٔ CSS سفارشی */
export const SHADOW_PRESETS: Record<string, string> = {
  sm: '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)',
  md: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
  xl: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)'
};

/** تبدیل فیلد shadow به مقدار CSS (پریست یا رشتهٔ خام) */
export const resolveBoxShadow = (shadow?: string): string | undefined => {
  if (!shadow || shadow === 'none') return undefined;
  if (shadow in SHADOW_PRESETS) return SHADOW_PRESETS[shadow];
  return shadow;
};

/** شعاع گوشه‌ها — اولویت با گوشه‌های جداگانه (مانند فتوشاپ)، وگرنه مقدار قدیمی واحد */
export const resolveBorderRadius = (s: WidgetStyle): string | undefined => {
  const tl = s.borderRadiusTopLeft;
  const tr = s.borderRadiusTopRight;
  const br = s.borderRadiusBottomLeft;
  const bl = s.borderRadiusBottomRight;
  if (tl !== undefined || tr !== undefined || br !== undefined || bl !== undefined) {
    return [tl ?? 0, tr ?? 0, br ?? 0, bl ?? 0].map((v) => `${v}px`).join(' ');
  }
  return s.borderRadius !== undefined ? `${s.borderRadius}px` : undefined;
};

/** یکسان‌سازی کاراکترهای عربی/فارسی مشابه (ي/ك عربی ↔ ی/ک فارسی) پیش از مقایسهٔ جستجوی متنی —
 *  چون کاربر ممکن است با کیبورد عربی یا فارسی تایپ کند و محتوای صفحه هم می‌تواند مخلوط باشد */
export const normalizeArabicChars = (s: string): string => s.replace(/ي/g, 'ی').replace(/ك/g, 'ک');

/** رنگ پس‌زمینهٔ ساده با اعمال شفافیت (backgroundOpacity) — فقط برای رنگ ثابت */
export const resolveBackgroundColor = (s: WidgetStyle): string | undefined => {
  if (!s.backgroundColor) return undefined;
  const opacity = s.backgroundOpacity;
  if (opacity === undefined || opacity >= 100) return s.backgroundColor;
  const hex = s.backgroundColor.replace('#', '');
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(100, opacity)) / 100})`;
  }
  return s.backgroundColor;
};

/** اعمال شفافیت روی هر مقدار CSS پس‌زمینه (رنگ ثابت یا گرادیان) — رنگ‌های hex و rgb/rgba داخل گرادیان
 * هم پشتیبانی می‌شوند. مقدار opacity آلفای موجود را ضرب می‌کند (نه جایگزین) — دقیقاً مثل رفتار CSS
 * opacity در پیش‌نمایش خودِ انتخابگر گرادیان — تا اختلاف عمدی آلفای هر نقطهٔ گرادیان (مثلاً یک سمت
 * کاملاً شفاف rgba(...,0) برای افکت محوشدگی) حفظ شود؛ فقط با اسلایدر شفافیت کمرنگ‌تر می‌شود، نه یکسان. */
export const applyBackgroundOpacity = (value?: string, opacity?: number): string | undefined => {
  if (!value) return undefined;
  if (opacity === undefined || opacity >= 100) return value;
  const factor = Math.max(0, Math.min(100, opacity)) / 100;
  const scaleAlpha = (existing: number) => Math.round(Math.max(0, Math.min(1, existing * factor)) * 1000) / 1000;
  const hexToRgba = (hex: string): string => {
    const h = hex.replace('#', '');
    if (/^[0-9a-fA-F]{6}$/.test(h)) {
      const r = parseInt(h.slice(0, 2), 16);
      const g = parseInt(h.slice(2, 4), 16);
      const b = parseInt(h.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${scaleAlpha(1)})`;
    }
    return hex;
  };
  const replaceColors = (input: string): string =>
    input
      .replace(/#[0-9a-fA-F]{3,8}\b/g, hexToRgba)
      .replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/gi, (_m, r, g, b, a) =>
        `rgba(${r}, ${g}, ${b}, ${scaleAlpha(a !== undefined ? parseFloat(a) : 1)})`
      );
  // گرادیان → همهٔ رنگ‌های hex یا rgb/rgba داخل را شفاف کن (بقیهٔ ساختار دست‌نخورده می‌ماند)
  if (/gradient\(/i.test(value)) {
    return replaceColors(value);
  }
  // رنگ ثابت (hex یا rgb/rgba)
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return hexToRgba(trimmed);
  if (/^rgba?\(/i.test(trimmed)) return replaceColors(trimmed);
  return value;
};

/** آیا URL ویدیو مستقیم است (فایل رسانه) یا جاساز (iframe)؟ */
export const isDirectVideo = (url?: string): boolean => {
  if (!url) return false;
  return /\.(mp4|webm|ogg|ogv)(\?.*)?$/i.test(url);
};

export const DEFAULT_ACCENT_COLOR = '#7c3aed';

export const accentWithAlpha = (accentColor: string, alphaHex: string): string => `${accentColor}${alphaHex}`;

/** رنگ accent را روشن‌تر/تیره‌تر می‌کند (percent مثبت = روشن‌تر به‌سمت سفید، منفی = تیره‌تر به‌سمت سیاه) */
export const shadeAccentColor = (accentColor: string, percent: number): string => {
  const hex = accentColor.replace('#', '');
  const num = parseInt(hex, 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent) / 100;
  r = Math.round((t - r) * p) + r;
  g = Math.round((t - g) * p) + g;
  b = Math.round((t - b) * p) + b;
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};
