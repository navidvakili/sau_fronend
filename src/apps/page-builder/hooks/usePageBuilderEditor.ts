// ============================================================
// usePageBuilderEditor — state و منطق ویرایش شمای یک صفحه (SmartPageSchema)
// شامل: تاریخچهٔ Undo/Redo، انتخاب سکشن/ستون/ویجت فعلی، و همهٔ عملیات CRUD روی
// درخت سکشن‌ها (افزودن/حذف/تکثیر/جابه‌جایی سکشن یا ویجت). از PageBuilderStudio
// استخراج شد تا این منطق (که هیچ ارتباطی با فهرست صفحات/API ندارد) قابل‌آزمایش و
// خوانا از orchestration صفحه جدا باشد.
//
// عمداً شامل نیست: بارگذاری/ذخیرهٔ صفحه از/به سرور، فهرست صفحات، مدیریت زیرصفحه‌ها —
// این‌ها در PageBuilderStudio می‌مانند و با setPageSchema/resetHistory این هوک ترکیب می‌شوند.
// ============================================================

import { useState } from 'react';
import {
  SmartPageSchema,
  SectionInstance,
  ColumnInstance,
  ColumnResponsiveWidths,
  WidgetInstance,
  WidgetType,
  Breakpoint,
  PageVersion,
  PageTemplate,
  getColumnBlocks,
  setColumnBlocks,
  createIdGenerator,
  cloneSectionWithNewIds
} from '../builderTypes';
import {
  withWidths,
  getColumnSubSections,
  findSectionRecursive,
  findWidgetInTree,
  mapSectionsRecursive,
  removeSectionRecursive,
  containsSection,
  isColumnInSection
} from '../utils/sectionTree';
import { getNewWidgetDefaults, buildColumnsForPreset, getTargetWidthsForPreset, SectionColumnPreset } from '../constants/widgetDefaults';

/** ساخت یک نمونهٔ ویجت تازه از روی مقادیر پیش‌فرض نوعش (getNewWidgetDefaults) */
const buildNewWidget = (widgetType: WidgetType, id: string): WidgetInstance => {
  const defaults = getNewWidgetDefaults(widgetType);
  return {
    id,
    type: widgetType,
    title: defaults.title,
    content: defaults.initialContent ?? 'محتوای اولیه این ویجت در ویرایشگر قرار گرفته است.',
    settings: {
      style: {
        paddingTop: 0,
        paddingBottom: 0,
        textAlign: 'right'
      },
      binding: {
        dataSource: defaults.bindingDataSource as any,
        limit: 4,
        displayMode: 'grid'
      },
      customProps: defaults.customProps,
      visibility: { desktop: true, tablet: true, mobile: true },
      conditionalDisplay: { enabled: false, userRole: 'all' }
    }
  };
};

const buildNewSection = (columns: ColumnInstance[], name: string): SectionInstance => ({
  id: `section-${Date.now()}`,
  name,
  layout: 'boxed',
  paddingTop: 40,
  paddingBottom: 40,
  columns,
  visibility: { desktop: true, tablet: true, mobile: true },
  conditionalDisplay: { enabled: false, userRole: 'all' }
});

export const usePageBuilderEditor = (
  initialSchema: SmartPageSchema,
  onDirtyChange?: (dirty: boolean) => void
) => {
  const [pageSchema, setPageSchema] = useState<SmartPageSchema>(initialSchema);
  const [undoStack, setUndoStack] = useState<SmartPageSchema[]>([]);
  const [redoStack, setRedoStack] = useState<SmartPageSchema[]>([]);
  const [isPageDirty, setIsPageDirty] = useState(false);

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(initialSchema.sections[0]?.id || null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(initialSchema.sections[0]?.columns[0]?.id || null);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(
    initialSchema.sections[0]?.columns[0]?.widgets[0]?.id || null
  );

  // Component Picker Modal target (کدام ستون/ایندکس، وقتی از دیالوگ کامپوننت‌ها افزوده می‌شود)
  const [pickerTargetInsertIndex, setPickerTargetInsertIndex] = useState<number | null>(null);
  const [pickerTargetColumnId, setPickerTargetColumnId] = useState<string | null>(null);
  const setPickerTarget = (targetInsertIndex?: number, targetColumnId?: string) => {
    setPickerTargetInsertIndex(targetInsertIndex !== undefined ? targetInsertIndex : null);
    setPickerTargetColumnId(targetColumnId !== undefined ? targetColumnId : null);
  };

  // Push state to undo stack before mutation
  const pushState = (newSchema: SmartPageSchema) => {
    setUndoStack((prev) => [...prev.slice(-15), pageSchema]);
    setRedoStack([]);
    setPageSchema(newSchema);
    onDirtyChange?.(true);
    setIsPageDirty(true);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [pageSchema, ...r]);
    setUndoStack((u) => u.slice(0, -1));
    setPageSchema(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setUndoStack((u) => [...u, pageSchema]);
    setRedoStack((r) => r.slice(1));
    setPageSchema(next);
  };

  // Selectors
  const handleSelectSection = (secId: string) => {
    setSelectedSectionId(secId);
    setSelectedColumnId(null);
    setSelectedWidgetId(null);
  };

  const handleSelectColumn = (colId: string) => {
    setSelectedColumnId(colId);
    setSelectedWidgetId(null);
  };

  const handleSelectWidget = (wId: string) => {
    setSelectedWidgetId(wId);
  };

  // Find currently selected items (بازگشتی — ویجت/ستون ممکن است داخل زیربلوک باشد)
  let currentSection: SectionInstance | null = selectedSectionId
    ? findSectionRecursive(pageSchema.sections, selectedSectionId)
    : null;
  let currentColumn: ColumnInstance | null = null;
  let currentWidget: WidgetInstance | null = null;

  const findSelection = (sections: SectionInstance[]): boolean => {
    for (const sec of sections) {
      if (sec.id === selectedSectionId) currentSection = sec;
      for (const col of sec.columns) {
        if (col.id === selectedColumnId) currentColumn = col;
        const wBlock = getColumnBlocks(col).find((b) => b.kind === 'widget' && b.widget.id === selectedWidgetId);
        if (wBlock && wBlock.kind === 'widget') {
          currentWidget = wBlock.widget;
          currentColumn = col;
          if (!currentSection) currentSection = sec;
          return true;
        }
        if (findSelection(getColumnSubSections(col))) return true;
      }
    }
    return !!currentWidget;
  };
  findSelection(pageSchema.sections);

  // Adding new Section
  const handleAddSection = (layoutPreset: SectionColumnPreset) => {
    const columns = buildColumnsForPreset(layoutPreset);
    const newSec = buildNewSection(columns, `سکشن جدید (${layoutPreset})`);

    pushState({
      ...pageSchema,
      sections: [...pageSchema.sections, newSec]
    });

    setSelectedSectionId(newSec.id);
    setSelectedColumnId(columns[0].id);
  };

  // Add section from modal at specific position
  const handleAddSectionFromModal = (preset: SectionColumnPreset) => {
    const columns = buildColumnsForPreset(preset);
    const newSec = buildNewSection(columns, `سکشن جدید (${preset})`);

    const sectionsCopy = [...pageSchema.sections];
    const insertPos = pickerTargetInsertIndex !== null ? pickerTargetInsertIndex : sectionsCopy.length;
    sectionsCopy.splice(insertPos, 0, newSec);

    pushState({
      ...pageSchema,
      sections: sectionsCopy
    });

    setSelectedSectionId(newSec.id);
    setSelectedColumnId(columns[0].id);
  };

  // Add widget from modal (into specific column or creating new section at position)
  const handleAddWidgetFromModal = (widgetType: WidgetType) => {
    if (pickerTargetColumnId) {
      handleAddWidget(widgetType, pickerTargetColumnId);
      return;
    }

    const newWidgetId = `widget-${Date.now()}`;
    const newColId = `col-${Date.now()}-1`;
    const newWidget = buildNewWidget(widgetType, newWidgetId);

    const newSec = buildNewSection(
      [{ id: newColId, width: 12, widths: withWidths(12), widgets: [newWidget], subSections: [] }],
      `سکشن ${newWidget.title}`
    );
    newSec.paddingTop = 32;
    newSec.paddingBottom = 32;

    const sectionsCopy = [...pageSchema.sections];
    const insertPos = pickerTargetInsertIndex !== null ? pickerTargetInsertIndex : sectionsCopy.length;
    sectionsCopy.splice(insertPos, 0, newSec);

    pushState({
      ...pageSchema,
      sections: sectionsCopy
    });

    setSelectedSectionId(newSec.id);
    setSelectedColumnId(newColId);
    setSelectedWidgetId(newWidgetId);
  };

  // Update Section Column Layout Preset (1col, 2col, 3col, 4col, 7-5, 8-4)
  const handleUpdateSectionColumnLayout = (secId: string, preset: SectionColumnPreset) => {
    const targetWidths = getTargetWidthsForPreset(preset);

    const updatedSections = mapSectionsRecursive(pageSchema.sections, (sec) => {
      if (sec.id !== secId) return sec;

      const currentCols = sec.columns;
      const newColsCount = targetWidths.length;
      let newCols: ColumnInstance[] = [];

      if (currentCols.length === newColsCount) {
        newCols = currentCols.map((col, idx) => ({
          ...col,
          width: targetWidths[idx],
          widths: { ...col.widths, desktop: targetWidths[idx] }
        }));
      } else if (currentCols.length < newColsCount) {
        newCols = currentCols.map((col, idx) => ({
          ...col,
          width: targetWidths[idx],
          widths: { ...col.widths, desktop: targetWidths[idx] }
        }));
        for (let i = currentCols.length; i < newColsCount; i++) {
          newCols.push({
            id: `col-${secId}-${Date.now()}-${i}`,
            width: targetWidths[i],
            widths: { desktop: targetWidths[i] },
            widgets: [],
            subSections: []
          });
        }
      } else {
        const retainedCols: ColumnInstance[] = currentCols.slice(0, newColsCount).map((col, idx) => ({
          ...col,
          width: targetWidths[idx],
          widths: { ...col.widths, desktop: targetWidths[idx] }
        }));
        const overflowCols = currentCols.slice(newColsCount);
        const overflowBlocks = overflowCols.flatMap((c) => getColumnBlocks(c));

        retainedCols[retainedCols.length - 1] = setColumnBlocks(retainedCols[retainedCols.length - 1], [
          ...getColumnBlocks(retainedCols[retainedCols.length - 1]),
          ...overflowBlocks
        ]);
        newCols = retainedCols;
      }

      return { ...sec, columns: newCols };
    });

    pushState({ ...pageSchema, sections: updatedSections });
  };

  // Update single column width for a specific breakpoint (responsive layout — بازگشتی)
  const handleUpdateColumnWidth = (secId: string, colId: string, bp: Breakpoint, value: number) => {
    const updatedSections = mapSectionsRecursive(pageSchema.sections, (sec) => {
      if (sec.id !== secId) return sec;
      return {
        ...sec,
        columns: sec.columns.map((col) => {
          if (col.id !== colId) return col;
          const widths: ColumnResponsiveWidths = {
            desktop: col.widths?.desktop ?? col.width,
            tablet: col.widths?.tablet,
            mobile: col.widths?.mobile
          };
          widths[bp] = value;
          return { ...col, widths, width: bp === 'desktop' ? value : col.width };
        })
      };
    });
    pushState({ ...pageSchema, sections: updatedSections });
  };

  const handleUpdateColumn = (secId: string, colId: string, patch: Partial<ColumnInstance>) => {
    const updatedSections = mapSectionsRecursive(pageSchema.sections, (sec) => {
      if (sec.id !== secId) return sec;
      return {
        ...sec,
        columns: sec.columns.map((col) => (col.id === colId ? { ...col, ...patch } : col))
      };
    });
    pushState({ ...pageSchema, sections: updatedSections });
  };

  // Adding new Widget
  const handleAddWidget = (widgetType: WidgetType, targetColumnId?: string) => {
    const colId = targetColumnId || selectedColumnId || pageSchema.sections[0]?.columns[0]?.id;
    if (!colId) return;

    const newWidgetId = `widget-${Date.now()}`;
    const newWidget = buildNewWidget(widgetType, newWidgetId);

    const updatedSections = mapSectionsRecursive(pageSchema.sections, (sec) => ({
      ...sec,
      columns: sec.columns.map((col) => {
        if (col.id === colId) {
          return setColumnBlocks(col, [...getColumnBlocks(col), { kind: 'widget', widget: newWidget }]);
        }
        return col;
      })
    }));

    pushState({
      ...pageSchema,
      sections: updatedSections
    });

    setSelectedWidgetId(newWidgetId);
  };

  // Updating Widget (بازگشتی — ویجت داخل زیربلوک هم پشتیبانی می‌شود)
  const handleUpdateWidget = (updatedWidget: WidgetInstance) => {
    const updatedSections = mapSectionsRecursive(pageSchema.sections, (sec) => ({
      ...sec,
      columns: sec.columns.map((col) => {
        const blocks = getColumnBlocks(col);
        const changed = blocks.some((b) => b.kind === 'widget' && b.widget.id === updatedWidget.id);
        if (!changed) return col;
        return setColumnBlocks(
          col,
          blocks.map((b) => (b.kind === 'widget' && b.widget.id === updatedWidget.id ? { ...b, widget: updatedWidget } : b))
        );
      })
    }));

    pushState({
      ...pageSchema,
      sections: updatedSections
    });
  };

  // Updating Section (بازگشتی — زیربلوک‌ها هم پشتیبانی می‌شوند)
  const handleUpdateSection = (updatedSection: SectionInstance) => {
    const updatedSections = mapSectionsRecursive(pageSchema.sections, (sec) =>
      sec.id === updatedSection.id ? updatedSection : sec
    );
    pushState({
      ...pageSchema,
      sections: updatedSections
    });
  };

  // Deleting Section (از هر جای درخت)
  const handleDeleteSection = (secId: string) => {
    const updatedSections = removeSectionRecursive(pageSchema.sections, secId);
    pushState({
      ...pageSchema,
      sections: updatedSections
    });

    if (selectedSectionId === secId) {
      setSelectedSectionId(null);
      setSelectedColumnId(null);
      setSelectedWidgetId(null);
    }
  };

  // Duplicate Section (بازگشتی — با تمام ستون‌ها/ویجت‌ها/زیربلوک‌هایش، id های کاملاً جدید)
  // نسخهٔ کپی‌شده بلافاصله بعد از سکشن اصلی، در همان سطح (اصلی یا همان ستونِ والد) درج می‌شود
  const handleDuplicateSection = (secId: string) => {
    const sec = findSectionRecursive(pageSchema.sections, secId);
    if (!sec) return;

    const duplicated = cloneSectionWithNewIds(sec, createIdGenerator());
    duplicated.name = `${sec.name} (کپی)`;

    // سطح اصلی
    const topIdx = pageSchema.sections.findIndex((s) => s.id === secId);
    if (topIdx !== -1) {
      const copy = [...pageSchema.sections];
      copy.splice(topIdx + 1, 0, duplicated);
      pushState({ ...pageSchema, sections: copy });
      setSelectedSectionId(duplicated.id);
      setSelectedColumnId(null);
      setSelectedWidgetId(null);
      return;
    }

    // زیربلوک تودرتو — بلافاصله بعد از سکشن اصلی در همان ستون درج شود
    let inserted = false;
    const updatedSections = mapSectionsRecursive(pageSchema.sections, (s) => {
      if (inserted) return s;
      const newCols = s.columns.map((col) => {
        if (inserted) return col;
        const blocks = getColumnBlocks(col);
        const idx = blocks.findIndex((b) => b.kind === 'section' && b.section.id === secId);
        if (idx === -1) return col;
        const newBlocks = [...blocks];
        newBlocks.splice(idx + 1, 0, { kind: 'section', section: duplicated });
        inserted = true;
        return setColumnBlocks(col, newBlocks);
      });
      return { ...s, columns: newCols };
    });

    if (inserted) {
      pushState({ ...pageSchema, sections: updatedSections });
      setSelectedSectionId(duplicated.id);
      setSelectedColumnId(null);
      setSelectedWidgetId(null);
    }
  };

  // Deleting Widget (بازگشتی)
  const handleDeleteWidget = (wId: string) => {
    const updatedSections = mapSectionsRecursive(pageSchema.sections, (sec) => ({
      ...sec,
      columns: sec.columns.map((col) => {
        const blocks = getColumnBlocks(col);
        if (!blocks.some((b) => b.kind === 'widget' && b.widget.id === wId)) return col;
        return setColumnBlocks(
          col,
          blocks.filter((b) => !(b.kind === 'widget' && b.widget.id === wId))
        );
      })
    }));

    pushState({
      ...pageSchema,
      sections: updatedSections
    });

    if (selectedWidgetId === wId) {
      setSelectedWidgetId(null);
    }
  };

  // Moving Widget Up / Down inside column (بازگشتی) — روی لیست یکپارچه blocks
  const handleMoveWidget = (wId: string, direction: 'up' | 'down') => {
    const updatedSections = mapSectionsRecursive(pageSchema.sections, (sec) => ({
      ...sec,
      columns: sec.columns.map((col) => {
        const blocks = getColumnBlocks(col);
        const index = blocks.findIndex((b) => b.kind === 'widget' && b.widget.id === wId);
        if (index === -1) return col;

        const newBlocks = [...blocks];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex >= 0 && targetIndex < newBlocks.length) {
          const temp = newBlocks[index];
          newBlocks[index] = newBlocks[targetIndex];
          newBlocks[targetIndex] = temp;
        }

        return setColumnBlocks(col, newBlocks);
      })
    }));

    pushState({
      ...pageSchema,
      sections: updatedSections
    });
  };

  // Duplicate widget (بازگشتی)
  const handleDuplicateWidget = (widget: WidgetInstance) => {
    const duplicated: WidgetInstance = {
      ...widget,
      id: `widget-${Date.now()}`,
      title: `${widget.title} (کپی)`
    };

    const updatedSections = mapSectionsRecursive(pageSchema.sections, (sec) => ({
      ...sec,
      columns: sec.columns.map((col) => {
        const blocks = getColumnBlocks(col);
        if (!blocks.some((b) => b.kind === 'widget' && b.widget.id === widget.id)) return col;
        return setColumnBlocks(col, [...blocks, { kind: 'widget', widget: duplicated }]);
      })
    }));

    pushState({
      ...pageSchema,
      sections: updatedSections
    });
  };

  // Restore Snapshot Version
  const handleRestoreVersion = (ver: PageVersion) => {
    pushState(ver.schemaSnapshot);
  };

  // Save Draft Version
  const handleSaveDraftVersion = () => {
    const newVer: PageVersion = {
      id: `ver-${Date.now()}`,
      title: `پیش‌نویس دستی ${new Date().toLocaleTimeString('fa-IR')}`,
      timestamp: new Date().toLocaleDateString('fa-IR'),
      note: 'ذخیره نقطه بازگشت توسط کاربر در ویرایشگر',
      schemaSnapshot: JSON.parse(JSON.stringify(pageSchema))
    };

    setPageSchema({
      ...pageSchema,
      versionHistory: [newVer, ...pageSchema.versionHistory]
    });
  };

  // Load preset template
  const handleSelectTemplate = (template: PageTemplate) => {
    pushState(template.schema);
  };

  // Move widget to a target column (cross-section Drag & Drop — بازگشتی، روی لیست یکپارچه blocks)
  const handleMoveWidgetToColumn = (widgetId: string, targetColumnId: string, index?: number) => {
    let widgetToMove: WidgetInstance | null = null;
    let sourceColumnId: string | null = null;
    let sourceIndex = -1;

    // Remove widget from its source column (first pass — هر جای درخت)
    const removedSections = mapSectionsRecursive(pageSchema.sections, (sec) => ({
      ...sec,
      columns: sec.columns.map((col) => {
        const blocks = getColumnBlocks(col);
        const idx = blocks.findIndex((b) => b.kind === 'widget' && b.widget.id === widgetId);
        if (idx !== -1) {
          const found = blocks[idx];
          if (found.kind !== 'widget') return col;
          widgetToMove = found.widget;
          sourceColumnId = col.id;
          sourceIndex = idx;
          const newBlocks = [...blocks];
          newBlocks.splice(idx, 1);
          return setColumnBlocks(col, newBlocks);
        }
        return col;
      })
    }));

    if (!widgetToMove) return;

    // Append/insert widget at the target column (second pass — بازگشتی)
    const finalSections = mapSectionsRecursive(removedSections, (sec) => ({
      ...sec,
      columns: sec.columns.map((col) => {
        if (col.id === targetColumnId) {
          const blocks = getColumnBlocks(col);
          let effectiveIndex = typeof index === 'number' ? Math.min(Math.max(index, 0), blocks.length) : blocks.length;
          // جابه‌جایی در همان ستون — حذف قبلی ایندکس‌ها را یکی به عقب برده است
          if (col.id === sourceColumnId && typeof index === 'number' && sourceIndex < index) {
            effectiveIndex = Math.min(Math.max(index - 1, 0), blocks.length);
          }
          const newBlocks = [...blocks];
          newBlocks.splice(effectiveIndex, 0, { kind: 'widget', widget: widgetToMove! });
          return setColumnBlocks(col, newBlocks);
        }
        return col;
      })
    }));

    pushState({ ...pageSchema, sections: finalSections });
    setSelectedWidgetId(widgetId);
  };

  // ============ جابه‌جایی سکشن (بلوک و زیربلوک) با کشیدن و رها کردن ============

  /**
   * انتقال یک سکشن به داخل ستون هدف (تبدیل به زیربلوک)
   * — جلوگیری از تودرتویی خودارجاع (سکشن داخل خودش)
   */
  const handleMoveSectionToColumn = (sectionId: string, targetColumnId: string, index?: number) => {
    const sec = findSectionRecursive(pageSchema.sections, sectionId);
    if (!sec) return;
    if (isColumnInSection(sec, targetColumnId)) return; // داخل خودش — ممنوع

    // موقعیت مبدأ (ستون و ایندکس) قبل از حذف — برای اصلاح ایندکس هنگام جابه‌جایی در همان ستون
    let sourceColumnId: string | null = null;
    let sourceIndex = -1;
    mapSectionsRecursive(pageSchema.sections, (s) => {
      s.columns.forEach((col) => {
        const bi = getColumnBlocks(col).findIndex((b) => b.kind === 'section' && b.section.id === sectionId);
        if (bi >= 0) {
          sourceColumnId = col.id;
          sourceIndex = bi;
        }
      });
      return s;
    });

    const removedSections = removeSectionRecursive(pageSchema.sections, sectionId);
    const clone = JSON.parse(JSON.stringify(sec)) as SectionInstance;

    const finalSections = mapSectionsRecursive(removedSections, (s) => ({
      ...s,
      columns: s.columns.map((col) => {
        if (col.id !== targetColumnId) return col;
        // درج در ایندکس درخواستی (DnD قبل/بعد بلوک‌ها) — پیش‌فرض: انتهای فهرست
        const blocks = getColumnBlocks(col);
        let effectiveIndex = typeof index === 'number' ? Math.min(Math.max(index, 0), blocks.length) : blocks.length;
        // جابه‌جایی در همان ستون: بعد از حذف، فهرست یکی کوتاه‌تر شده — اگر مبدأ قبل از هدف بود یکی کم کن
        if (typeof index === 'number' && col.id === sourceColumnId && sourceIndex >= 0 && sourceIndex < index) {
          effectiveIndex = Math.min(Math.max(index - 1, 0), blocks.length);
        }
        const newBlocks = [...blocks];
        newBlocks.splice(effectiveIndex, 0, { kind: 'section', section: clone });
        return setColumnBlocks(col, newBlocks);
      })
    }));

    pushState({ ...pageSchema, sections: finalSections });
    setSelectedSectionId(sectionId);
    setSelectedColumnId(null);
    setSelectedWidgetId(null);
  };

  /**
   * انتقال سکشن به سطح اصلی در ایندکس مشخص
   * — برای رها کردن روی خط‌جداکننده و دکمهٔ «خروج از بلوک»
   */
  const handleMoveSectionToTop = (sectionId: string, index?: number) => {
    const sec = findSectionRecursive(pageSchema.sections, sectionId);
    if (!sec) return;

    const removedSections = removeSectionRecursive(pageSchema.sections, sectionId);
    const clone = JSON.parse(JSON.stringify(sec)) as SectionInstance;

    const sectionsCopy = [...removedSections];
    const pos = index !== undefined ? Math.min(index, sectionsCopy.length) : sectionsCopy.length;
    sectionsCopy.splice(pos, 0, clone);

    pushState({ ...pageSchema, sections: sectionsCopy });
    setSelectedSectionId(sectionId);
    setSelectedColumnId(null);
    setSelectedWidgetId(null);
  };

  /** خروج از بلوک: انتقال سکشن تودرتو به سطح اصلی، دقیقاً بعد از والد خود */
  const handleMoveSectionOut = (sectionId: string) => {
    const sec = findSectionRecursive(pageSchema.sections, sectionId);
    if (!sec) return;

    // والد سطح اصلی که این سکشن داخل زیردرخت آن است (یا خودش اگر سطح اصلی باشد)
    const topLevelIdx = pageSchema.sections.findIndex(
      (s) => s.id === sectionId || s.columns.some((col) => getColumnSubSections(col).some((sub) => containsSection(sub, sectionId)))
    );
    if (topLevelIdx === -1) return;

    const removedSections = removeSectionRecursive(pageSchema.sections, sectionId);
    const clone = JSON.parse(JSON.stringify(sec)) as SectionInstance;

    const sectionsCopy = [...removedSections];
    sectionsCopy.splice(topLevelIdx + 1, 0, clone);

    pushState({ ...pageSchema, sections: sectionsCopy });
    setSelectedSectionId(sectionId);
    setSelectedColumnId(null);
    setSelectedWidgetId(null);
  };

  /** جابه‌جایی سکشن بالا/پایین درون والد خود (سطح اصلی یا بلوک‌های یک ستون — روی لیست یکپارچه blocks) */
  const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
    // ابتدا سطح اصلی
    const topIdx = pageSchema.sections.findIndex((s) => s.id === sectionId);
    if (topIdx !== -1) {
      const target = direction === 'up' ? topIdx - 1 : topIdx + 1;
      if (target >= 0 && target < pageSchema.sections.length) {
        const copy = [...pageSchema.sections];
        const t = copy[topIdx];
        copy[topIdx] = copy[target];
        copy[target] = t;
        pushState({ ...pageSchema, sections: copy });
      }
      return;
    }

    // سپس زیربلوک‌ها (بازگشتی) — جابه‌جایی داخل لیست یکپارچه بلوک‌های ستون،
    // تا زیربلوک بتواند با ویجت‌های هم‌ستون نیز جابه‌جا شود
    let moved = false;
    const updatedSections = mapSectionsRecursive(pageSchema.sections, (sec) => {
      if (moved) return sec;
      const newCols = sec.columns.map((col) => {
        if (moved) return col;
        const blocks = getColumnBlocks(col);
        const idx = blocks.findIndex((b) => b.kind === 'section' && b.section.id === sectionId);
        if (idx === -1) return col;
        const target = direction === 'up' ? idx - 1 : idx + 1;
        if (target < 0 || target >= blocks.length) return col;
        const copy = [...blocks];
        const t = copy[idx];
        copy[idx] = copy[target];
        copy[target] = t;
        moved = true;
        return setColumnBlocks(col, copy);
      });
      return { ...sec, columns: newCols };
    });

    if (moved) pushState({ ...pageSchema, sections: updatedSections });
  };

  /** افزودن زیربلوک جدید به داخل یک ستون */
  const handleAddSubSection = (columnId: string) => {
    const newColId = `col-${Date.now()}-1`;
    const newSub = buildNewSection([{ id: newColId, width: 12, widths: withWidths(12), widgets: [], subSections: [] }], 'زیربلوک جدید');
    newSub.id = `sub-section-${Date.now()}`;
    newSub.paddingTop = 24;
    newSub.paddingBottom = 24;

    const updatedSections = mapSectionsRecursive(pageSchema.sections, (sec) => ({
      ...sec,
      columns: sec.columns.map((col) =>
        col.id === columnId ? setColumnBlocks(col, [...getColumnBlocks(col), { kind: 'section', section: newSub }]) : col
      )
    }));

    pushState({ ...pageSchema, sections: updatedSections });
    setSelectedSectionId(newSub.id);
    setSelectedColumnId(newColId);
    setSelectedWidgetId(null);
  };

  return {
    // schema + persistence-adjacent raw setters (برای loadPage/handleCreatePage در PageBuilderStudio)
    pageSchema,
    setPageSchema,
    isPageDirty,
    setIsPageDirty,

    // undo/redo
    undoStack,
    redoStack,
    pushState,
    handleUndo,
    handleRedo,
    setUndoStack,
    setRedoStack,

    // selection
    selectedSectionId,
    selectedColumnId,
    selectedWidgetId,
    setSelectedSectionId,
    setSelectedColumnId,
    setSelectedWidgetId,
    handleSelectSection,
    handleSelectColumn,
    handleSelectWidget,
    currentSection,
    currentColumn,
    currentWidget,

    // component picker target
    pickerTargetInsertIndex,
    pickerTargetColumnId,
    setPickerTarget,

    // tree helpers (re-exported for convenience — e.g. tab-editor widget lookup)
    findWidgetInTree,

    // CRUD handlers
    handleAddSection,
    handleAddSectionFromModal,
    handleAddWidgetFromModal,
    handleAddWidget,
    handleUpdateSectionColumnLayout,
    handleUpdateColumnWidth,
    handleUpdateColumn,
    handleUpdateWidget,
    handleUpdateSection,
    handleDeleteSection,
    handleDuplicateSection,
    handleDeleteWidget,
    handleMoveWidget,
    handleDuplicateWidget,
    handleRestoreVersion,
    handleSaveDraftVersion,
    handleSelectTemplate,
    handleMoveWidgetToColumn,
    handleMoveSectionToColumn,
    handleMoveSectionToTop,
    handleMoveSectionOut,
    handleMoveSection,
    handleAddSubSection
  };
};

export type PageBuilderEditor = ReturnType<typeof usePageBuilderEditor>;
