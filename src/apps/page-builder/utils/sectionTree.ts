// ============================================================
// Section Tree Utilities — عملیات خالص (pure) روی درخت سکشن/ستون/ویجت
// این توابع هیچ وابستگی‌ای به React ندارند و فقط SmartPageSchema.sections را می‌خوانند/می‌سازند.
// از PageBuilderStudio استخراج شدند تا منطق پیمایش بازگشتیِ درخت از state/UI جدا بماند.
// ============================================================

import {
  SectionInstance,
  ColumnInstance,
  ColumnBlock,
  ColumnResponsiveWidths,
  WidgetInstance,
  getColumnBlocks,
  setColumnBlocks
} from '../builderTypes';

/** عرض‌های واکنش‌گرای پیش‌فرض برای یک ستون — موبایل تک‌ستونه (تمام‌عرض) */
export const withWidths = (width: number): ColumnResponsiveWidths => ({
  desktop: width,
  tablet: width,
  mobile: 12
});

/** زیربلوک‌های واقعی یک ستون — منبع اصلی «blocks» است، subSections فقط فالبک قدیمی؛
 *  هر جای این فایل که باید داخل زیربلوک‌های یک ستون بگردد باید از همین تابع استفاده کند،
 *  وگرنه سکشن‌هایی که فقط در blocks هستند (و در subSections تکرار نشده‌اند) در جستجوها
 *  دیده نمی‌شوند — همان چیزی که باعث خالی ماندن پالت تنظیمات برای زیربلوک‌های چندستونه می‌شد */
export const getColumnSubSections = (col: ColumnInstance): SectionInstance[] =>
  getColumnBlocks(col)
    .filter((b): b is Extract<ColumnBlock, { kind: 'section' }> => b.kind === 'section')
    .map((b) => b.section);

/** جستجوی بازگشتی یک سکشن در کل درخت (سطح اصلی یا زیربلوک‌های داخل ستون‌ها) */
export const findSectionRecursive = (sections: SectionInstance[], id: string): SectionInstance | null => {
  for (const s of sections) {
    if (s.id === id) return s;
    for (const col of s.columns) {
      const found = findSectionRecursive(getColumnSubSections(col), id);
      if (found) return found;
    }
  }
  return null;
};

/** یافتن یک ویجت در هر جای درخت (سطح اصلی یا زیربلوک) — برای ویرایشگر محتوای تب */
export const findWidgetInTree = (sections: SectionInstance[], widgetId: string): WidgetInstance | null => {
  for (const sec of sections) {
    for (const col of sec.columns) {
      const blocks = getColumnBlocks(col);
      const found = blocks.find((b) => b.kind === 'widget' && b.widget.id === widgetId);
      if (found && found.kind === 'widget') return found.widget;
      const inSub = findWidgetInTree(getColumnSubSections(col), widgetId);
      if (inSub) return inSub;
    }
  }
  return null;
};

/** اعمال تابع روی همهٔ سکشن‌های درخت (بازگشتی) — ستون‌ها و زیربلوک‌ها حفظ می‌شوند.
 *  سکشن‌های داخل blocks هم با نسخهٔ جدید همگام می‌شوند */
export const mapSectionsRecursive = (
  sections: SectionInstance[],
  fn: (sec: SectionInstance) => SectionInstance
): SectionInstance[] =>
  sections.map((sec) => {
    const mapped = fn(sec);
    return {
      ...mapped,
      columns: (mapped.columns || []).map((col) => {
        const subs = getColumnSubSections(col);
        const newSubs = subs.length > 0 ? mapSectionsRecursive(subs, fn) : undefined;
        if (Array.isArray(col.blocks) && col.blocks.length > 0) {
          const subById = new Map((newSubs ?? []).map((s) => [s.id, s]));
          return {
            ...col,
            subSections: newSubs,
            blocks: col.blocks.map((b) =>
              b.kind === 'section' && subById.has(b.section.id)
                ? { ...b, section: subById.get(b.section.id)! }
                : b
            )
          };
        }
        return { ...col, subSections: newSubs };
      })
    };
  });

/** حذف یک سکشن از هر جای درخت (سطح اصلی یا زیربلوک)
 *  نکته: blocks باید با subSections جدید همگام شوند — فقط فیلتر مستقیم کافی نیست،
 *  چون سکشنِ حذف‌شده می‌تواند داخل یک زیربلوکِ تودرتو باشد که خودش در blocks ستونِ والد
 *  نگهداری می‌شود؛ در آن صورت نسخهٔ قدیمیِ آن زیربلوک (که هنوز سکشن حذف‌شده را دارد)
 *  در blocks می‌ماند و در DOM رندر می‌شود (باعث «حذف نشدن» زیربلوک می‌شد). */
export const removeSectionRecursive = (sections: SectionInstance[], id: string): SectionInstance[] =>
  sections
    .filter((s) => s.id !== id)
    .map((s) => ({
      ...s,
      columns: (s.columns || []).map((col) => {
        const subs = getColumnSubSections(col);
        const newSubs = subs.length > 0 ? removeSectionRecursive(subs, id) : undefined;
        if (Array.isArray(col.blocks) && col.blocks.length > 0) {
          const subById = new Map((newSubs ?? []).map((sub) => [sub.id, sub]));
          return {
            ...col,
            subSections: newSubs,
            blocks: col.blocks
              .filter((b) => !(b.kind === 'section' && b.section.id === id))
              .map((b) =>
                b.kind === 'section' && subById.has(b.section.id)
                  ? { ...b, section: subById.get(b.section.id)! }
                  : b
              )
          };
        }
        return { ...col, subSections: newSubs };
      })
    }));

/** آیا سکشن sec حاوی سکشن id در زیردرخت خود است؟ (برای جابه‌جایی بلوک) */
export const containsSection = (sec: SectionInstance, id: string): boolean =>
  sec.id === id ||
  sec.columns.some((col) => getColumnSubSections(col).some((sub) => containsSection(sub, id)));

/** آیا ستون colId در زیردرخت سکشن sec قرار دارد؟ (جلوگیری از تودرتویی خودارجاع) */
export const isColumnInSection = (sec: SectionInstance, colId: string): boolean =>
  sec.columns.some(
    (col) => col.id === colId || getColumnSubSections(col).some((sub) => isColumnInSection(sub, colId))
  );
