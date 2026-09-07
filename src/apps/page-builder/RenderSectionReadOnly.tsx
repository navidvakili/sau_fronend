// ============================================================
// RenderSectionReadOnly — از WidgetRenderer.tsx استخراج شد.
// رندر خواندنی (بدون قابلیت ویرایش/انتخاب) یک SectionInstance — برای پیش‌نمایش بوم، پیش‌نمایش زنده
// و بلوک تب‌ها که باید محتوای تب فعال را نشان دهد. مشابه سبک‌تری از renderSectionBlock در Canvas.tsx
// (که یک closure خصوصی است و اینجا در دسترس نیست) — بدون منطق انتخاب/کشیدن‌ورها.
// ============================================================

import React, { useEffect, useState } from 'react';
import type { SectionInstance, UserRoleCondition } from './builderTypes';
import { getColumnBlocks } from './builderTypes';
import { normalizeArabicChars, applyBackgroundOpacity, resolveBoxShadow } from './utils/styleResolvers';
// چرخهٔ متقابلِ ذاتیِ حوزه: یک سکشن ویجت‌ها را رندر می‌کند و یک ویجت (دربرگیرنده/تب) می‌تواند
// دوباره یک سکشن کامل در خود داشته باشد.
// eslint-disable-next-line import/no-cycle
import { WidgetRenderer } from './WidgetRenderer';

export const RenderSectionReadOnly: React.FC<{
  section: SectionInstance;
  depth?: number;
  currentUserRole?: UserRoleCondition;
  isEditorPreview?: boolean;
  pageId?: number | null;
  pageSlug?: string | null;
  variables?: Record<string, string>;
  dedicatedPageId?: number | null;
}> = ({ section, depth = 0, currentUserRole = 'all', isEditorPreview = false, pageId, pageSlug, variables, dedicatedPageId }) => {
  if (depth > 6) return null;

  // فیلتر کل سکشن بر اساس برچسب URL — همان مکانیزم ویجت‌ها (conditionalDisplay.urlParamKey/urlParamValue)،
  // برای سکشن‌هایی که باید یکجا (تیتر + همهٔ کارت‌های داخلشان) مخفی/نمایان شوند
  const [sectionUrlSearch, setSectionUrlSearch] = useState<string>(() => (typeof window !== 'undefined' ? window.location.search : ''));
  useEffect(() => {
    const onUrlChange = () => setSectionUrlSearch(window.location.search);
    window.addEventListener('popstate', onUrlChange);
    return () => window.removeEventListener('popstate', onUrlChange);
  }, []);

  const sectionCond = section.conditionalDisplay;
  const sectionFilterTags = sectionCond?.urlParamValue?.trim();
  const sectionFilterParamKey = sectionCond?.urlParamKey?.trim() || 'filter';
  const sectionActiveFilterValue = new URLSearchParams(sectionUrlSearch).get(sectionFilterParamKey);

  if (sectionCond?.enabled && sectionFilterTags && sectionActiveFilterValue && !isEditorPreview) {
    const allowedTags = sectionFilterTags.split(/\s+/);
    if (!allowedTags.includes(sectionActiveFilterValue)) {
      return null;
    }
  }
  // جستجوی متنی (substring) روی کل سکشن — مستقل از urlParamKey/urlParamValue بالا، با AND ترکیب می‌شود
  const sectionSearchParamKey = sectionCond?.enabled ? sectionCond.searchParamKey?.trim() : undefined;
  if (sectionSearchParamKey && !isEditorPreview) {
    const sectionSearchQuery = normalizeArabicChars((new URLSearchParams(sectionUrlSearch).get(sectionSearchParamKey) || '').trim().toLowerCase());
    if (sectionSearchQuery && !normalizeArabicChars((sectionCond?.searchKeywords || '').toLowerCase()).includes(sectionSearchQuery)) {
      return null;
    }
  }

  // پس‌زمینهٔ لایه‌ای سکشن — همان منطق buildSectionBackgroundImage در Canvas.tsx: گرادیان (یا رنگ ساده
  // به‌صورت لایهٔ گرادیان یکنواخت) همیشه روی تصویر قرار می‌گیرد، تصویر پایین‌ترین لایه است، وگرنه
  // (وقتی هر دو backgroundColor/backgroundImage به‌صورت جداگانه ست شوند) تصویر رنگ را کاملاً می‌پوشاند.
  const bgLayers: string[] = [];
  if (section.backgroundGradient) {
    bgLayers.push(applyBackgroundOpacity(section.backgroundGradient, section.backgroundOpacity) || section.backgroundGradient);
  } else if (section.backgroundColor) {
    const c = applyBackgroundOpacity(section.backgroundColor, section.backgroundOpacity) || section.backgroundColor;
    bgLayers.push(`linear-gradient(135deg, ${c} 0%, ${c} 100%)`);
  }
  if (section.backgroundImage) {
    bgLayers.push(`url("${section.backgroundImage}")`);
  }
  const backgroundImageValue = bgLayers.length ? bgLayers.join(', ') : undefined;

  return (
    <div
      style={{
        backgroundColor:
          section.backgroundImage || section.backgroundGradient
            ? undefined
            : section.backgroundColor
              ? applyBackgroundOpacity(section.backgroundColor, section.backgroundOpacity)
              : undefined,
        backgroundImage: backgroundImageValue,
        backgroundPosition: section.backgroundImage ? section.backgroundPosition || 'center' : undefined,
        backgroundSize: section.backgroundImage ? section.backgroundSize || 'cover' : undefined,
        backgroundRepeat: section.backgroundImage ? section.backgroundRepeat || 'no-repeat' : undefined,
        paddingTop: section.paddingTop,
        paddingBottom: section.paddingBottom,
        paddingLeft: section.paddingLeft,
        paddingRight: section.paddingRight,
        boxShadow: resolveBoxShadow(section.boxShadow),
        borderTopLeftRadius: section.borderRadius?.topLeft,
        borderTopRightRadius: section.borderRadius?.topRight,
        borderBottomLeftRadius: section.borderRadius?.bottomLeft,
        borderBottomRightRadius: section.borderRadius?.bottomRight
      }}
      className="transition-all"
    >
      <div className={section.layout === 'boxed' ? 'max-w-[1200px] mx-auto px-4' : 'w-full px-4'}>
        <div className="grid grid-cols-12 gap-4">
          {section.columns.map((col) => (
            <div
              key={col.id}
              style={{ gridColumn: `span ${Math.min(12, Math.max(1, col.width))} / span ${Math.min(12, Math.max(1, col.width))}` }}
              className="space-y-4"
            >
              {getColumnBlocks(col).map((block) =>
                block.kind === 'widget' ? (
                  <WidgetRenderer
                    key={block.widget.id}
                    widget={block.widget}
                    currentUserRole={currentUserRole}
                    isEditorPreview={isEditorPreview}
                    depth={depth + 1}
                    pageId={pageId}
                    pageSlug={pageSlug}
                    variables={variables}
                    dedicatedPageId={dedicatedPageId}
                  />
                ) : (
                  <RenderSectionReadOnly
                    key={block.section.id}
                    section={block.section}
                    depth={depth + 1}
                    currentUserRole={currentUserRole}
                    isEditorPreview={isEditorPreview}
                    pageId={pageId}
                    pageSlug={pageSlug}
                    variables={variables}
                    dedicatedPageId={dedicatedPageId}
                  />
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
