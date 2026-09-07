// ============================================================
// جست‌وجوی بازگشتی در درخت سکشن‌ها/ویجت‌های یک قالب Page-Builder
// ============================================================

import { getColumnBlocks, type SectionInstance, type WidgetInstance } from '../../page-builder/builderTypes';

/** جست‌وجوی بازگشتیِ یک ویجت با شناسه در همهٔ سکشن‌ها/زیربلوک‌ها */
export const findWidgetById = (sections: SectionInstance[], widgetId: string): WidgetInstance | null => {
  for (const sec of sections) {
    for (const col of sec.columns) {
      for (const block of getColumnBlocks(col)) {
        if (block.kind === 'widget') {
          if (block.widget.id === widgetId) return block.widget;
        } else {
          const found = findWidgetById([block.section], widgetId);
          if (found) return found;
        }
      }
    }
  }
  return null;
};

/** جست‌وجوی بازگشتیِ یک سکشن با شناسه در همهٔ سکشن‌ها/زیربلوک‌ها */
export const findSectionById = (sections: SectionInstance[], sectionId: string): SectionInstance | null => {
  for (const sec of sections) {
    if (sec.id === sectionId) return sec;
    for (const col of sec.columns) {
      for (const block of getColumnBlocks(col)) {
        if (block.kind === 'section') {
          const found = findSectionById([block.section], sectionId);
          if (found) return found;
        }
      }
    }
  }
  return null;
};
