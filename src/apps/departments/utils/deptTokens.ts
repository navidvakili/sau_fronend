// ============================================================
// توابع خالصِ (pure) تشخیص/تفسیر توکن‌های {{...}} روی ویجت‌ها و سکشن‌های قالب Page-Builder،
// مخصوص ویرایشگر بصریِ گروه آموزشی
// ============================================================

import type { SectionInstance, WidgetInstance } from '../../page-builder/builderTypes';
import { applyBackgroundOpacity } from '../../page-builder/utils/styleResolvers';
import { DEPT_TOKEN_RE, DEPT_WIDGET_TYPES, IMAGE_TOKEN_MAP, IMAGE_TOKEN_RE, TOKEN_FIELD_MAP } from '../constants/tokenMap';

/** توکن‌های شناخته‌شدهٔ داخل محتوای یک ویجت متنی (heading/text/accordion) */
export const knownTokensInWidget = (widget: WidgetInstance): string[] => {
  if (widget.type !== 'heading' && widget.type !== 'text' && widget.type !== 'accordion') return [];
  const content = widget.content || '';
  const found: string[] = [];
  let m: RegExpExecArray | null;
  DEPT_TOKEN_RE.lastIndex = 0;
  while ((m = DEPT_TOKEN_RE.exec(content))) {
    if (!found.includes(m[1]) && m[1] in TOKEN_FIELD_MAP) found.push(m[1]);
  }
  return found;
};

/** ویجت «اخبار گروه» — news-feed با فیلتر دستهٔ خبریِ همین گروه (طبق فاز ۳) */
export const isDeptNewsWidget = (widget: WidgetInstance): boolean =>
  widget.type === 'news-feed' && widget.settings?.binding?.categoryFilter === 'current-department';

/** اگر این ویجت یک تصویر متصل به فیلد واقعی گروه باشد، نام توکنش را برمی‌گرداند؛ وگرنه null */
export const imageTokenOf = (widget: WidgetInstance): string | null => {
  if (widget.type !== 'image') return null;
  const m = IMAGE_TOKEN_RE.exec(widget.imageUrl || '');
  return m && m[1] in IMAGE_TOKEN_MAP ? m[1] : null;
};

export const isDeptImageWidget = (widget: WidgetInstance): boolean => imageTokenOf(widget) !== null;

export const isWidgetEditable = (widget: WidgetInstance): boolean =>
  DEPT_WIDGET_TYPES.has(widget.type) ||
  isDeptNewsWidget(widget) ||
  isDeptImageWidget(widget) ||
  knownTokensInWidget(widget).length > 0;

/** برای ویجت متنیِ متصل به توکن (name/description/headName/...)، بررسی می‌کند که آیا محتوای
 *  نهایی (بعد از جایگزینی توکن‌ها با مقدار واقعی) کاملاً خالی می‌شود — یعنی مقدار فیلد هنوز
 *  ثبت نشده و چیزی برای هاورکردن/دیدنِ دکمهٔ مداد باقی نمی‌ماند (دقیقاً همان مشکلی که برای
 *  «اخبار گروه» خالی هم پیش می‌آید). خروجی: توکن‌های شناخته‌شدهٔ خالی (برای برچسبِ جای‌گیر). */
export const emptyEditableTextTokens = (widget: WidgetInstance, variables: Record<string, string>): string[] => {
  const tokens = knownTokensInWidget(widget);
  if (tokens.length === 0) return [];
  const resolved = (widget.content || '').replace(DEPT_TOKEN_RE, (match, key) => (key in variables ? variables[key] : match));
  return resolved.trim() === '' ? tokens : [];
};

/** همان قرارداد imageTokenOf ولی برای backgroundImage یک سکشن (مثل تصویر پس‌زمینهٔ بخش معرفی گروه) */
export const sectionImageTokenOf = (section: SectionInstance): string | null => {
  const m = IMAGE_TOKEN_RE.exec(section.backgroundImage || '');
  return m && m[1] in IMAGE_TOKEN_MAP ? m[1] : null;
};

export const isSectionEditable = (section: SectionInstance): boolean => sectionImageTokenOf(section) !== null;

/** لایه‌های پس‌زمینهٔ سکشن — دقیقاً همان منطق PreviewModal/سایت عمومی (گرادیان یا رنگ زیر تصویر) */
export const buildSectionBackgroundImage = (sec: SectionInstance, variables: Record<string, string>): string | undefined => {
  const layers: string[] = [];
  if (sec.backgroundGradient) {
    const g = applyBackgroundOpacity(sec.backgroundGradient, sec.backgroundOpacity);
    if (g) layers.push(g);
  } else if (sec.backgroundColor) {
    const c = applyBackgroundOpacity(sec.backgroundColor, sec.backgroundOpacity) || sec.backgroundColor;
    layers.push(`linear-gradient(135deg, ${c} 0%, ${c} 100%)`);
  }
  if (sec.backgroundImage) {
    // برخلاف ویجت‌ها (که WidgetRenderer خودش {{token}} داخل content/imageUrl را resolve می‌کند)،
    // backgroundImage یک سکشن مستقیماً همین‌جا رندر می‌شود، پس باید دستی resolve شود؛ وگرنه
    // مقدار خام مثل «{{banner}}» به‌عنوان URL نامعتبر به CSS داده می‌شود و پس‌زمینه خالی می‌ماند
    const resolvedBg = sec.backgroundImage.replace(/\{\{(\w+)\}\}/g, (match, key) =>
      key in variables ? variables[key] : match
    );
    layers.push(`url("${resolvedBg}")`);
  }
  return layers.length ? layers.join(', ') : undefined;
};
