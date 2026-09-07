import React from 'react';
import { Pencil } from 'lucide-react';
import type { AcademicFieldItem, InfoFileItem, PersonItem } from '@/src/shared-types';
import { applyBackgroundOpacity } from '../../page-builder/WidgetRenderer';
import { getColumnBlocks, getColumnWidth, resolveBoxShadow, type SectionInstance } from '../../page-builder/builderTypes';
import { buildSectionBackgroundImage, isSectionEditable } from '../utils/deptTokens';
import DeptWidgetRenderer from './DeptWidgetRenderer';

interface DeptSectionRendererProps {
  section: SectionInstance;
  depth?: number;
  variables: Record<string, string>;
  newsCategoryId: number | null;
  pageSlug?: string;
  fieldsList: AcademicFieldItem[];
  resolvedInstructors: PersonItem[];
  filesList: InfoFileItem[];
  onEditWidgetClick: (widgetId: string, e: React.MouseEvent) => void;
  onEditSectionBackground: (sectionId: string) => void;
}

/** رندر بازگشتیِ سکشن‌ها — همان چیدمان/استایل PreviewModal (خروجی واقعی صفحه)؛ فقط اگر
 *  تصویر پس‌زمینهٔ این سکشن به یک فیلد واقعی متصل باشد (isSectionEditable)، یک دکمهٔ آیکونی
 *  کوچک برای تغییرش نشان داده می‌شود */
export default function DeptSectionRenderer({
  section: sec, depth = 0, variables, newsCategoryId, pageSlug, fieldsList, resolvedInstructors, filesList,
  onEditWidgetClick, onEditSectionBackground,
}: DeptSectionRendererProps) {
  if (depth >= 6) return null;
  if (!sec.visibility.desktop) return null;
  const sectionEditable = isSectionEditable(sec);

  return (
    <div
      className="relative group/dept-section"
      style={{
        position: sec.position || undefined,
        zIndex: sec.zIndex || undefined,
        backgroundColor:
          sec.backgroundImage || sec.backgroundGradient
            ? undefined
            : sec.backgroundColor
              ? applyBackgroundOpacity(sec.backgroundColor, sec.backgroundOpacity)
              : undefined,
        backgroundImage: buildSectionBackgroundImage(sec, variables),
        backgroundPosition: sec.backgroundImage ? sec.backgroundPosition || 'center' : undefined,
        backgroundSize: sec.backgroundImage ? sec.backgroundSize || 'cover' : undefined,
        backgroundRepeat: sec.backgroundImage ? sec.backgroundRepeat || 'no-repeat' : undefined,
        marginTop: sec.marginTop !== undefined ? `${sec.marginTop}px` : undefined,
        marginBottom: sec.marginBottom !== undefined ? `${sec.marginBottom}px` : undefined,
        boxShadow: resolveBoxShadow(sec.boxShadow),
        paddingTop: `${sec.paddingTop}px`,
        paddingBottom: `${sec.paddingBottom}px`,
        paddingLeft: sec.paddingLeft !== undefined ? `${sec.paddingLeft}px` : undefined,
        paddingRight: sec.paddingRight !== undefined ? `${sec.paddingRight}px` : undefined,
        borderRadius: sec.borderRadius
          ? [sec.borderRadius.topLeft, sec.borderRadius.topRight, sec.borderRadius.bottomRight, sec.borderRadius.bottomLeft]
              .map((v) => (v ? `${v}px` : '0px'))
              .join(' ')
          : undefined
      }}
    >
      {sectionEditable && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEditSectionBackground(sec.id); }}
          className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-emerald-600 text-white shadow-md opacity-0 group-hover/dept-section:opacity-100 transition-opacity cursor-pointer"
          title="تغییر تصویر پس‌زمینه"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      <div className={sec.layout === 'boxed' ? 'max-w-[1200px] mx-auto px-4 md:px-6' : 'w-full px-4'}>
        <div className="grid grid-cols-12 gap-4 md:gap-6">
          {sec.columns.map((col) => (
            <div
              key={col.id}
              style={{ gridColumn: `span ${getColumnWidth(col, 'desktop')} / span ${getColumnWidth(col, 'desktop')}` }}
              className="space-y-4"
            >
              {getColumnBlocks(col).map((block) =>
                block.kind === 'section' ? (
                  <DeptSectionRenderer
                    key={block.section.id}
                    section={block.section}
                    depth={depth + 1}
                    variables={variables}
                    newsCategoryId={newsCategoryId}
                    pageSlug={pageSlug}
                    fieldsList={fieldsList}
                    resolvedInstructors={resolvedInstructors}
                    filesList={filesList}
                    onEditWidgetClick={onEditWidgetClick}
                    onEditSectionBackground={onEditSectionBackground}
                  />
                ) : (
                  <DeptWidgetRenderer
                    key={block.widget.id}
                    widget={block.widget}
                    variables={variables}
                    newsCategoryId={newsCategoryId}
                    pageSlug={pageSlug}
                    fieldsList={fieldsList}
                    resolvedInstructors={resolvedInstructors}
                    filesList={filesList}
                    onEditClick={onEditWidgetClick}
                  />
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
