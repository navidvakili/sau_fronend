import React, { useState } from 'react';
import {
  SmartPageSchema,
  SectionInstance,
  ColumnInstance,
  WidgetInstance,
  WidgetType,
  GlobalStyles,
  Breakpoint,
  PageVersion,
  UserRoleCondition,
  PageTemplate
} from './builderTypes';
import { INITIAL_SMART_PAGE } from './mockData';
import { Canvas } from './Canvas';
import { SidebarPanels } from './SidebarPanels';
import { InspectorPanel } from './InspectorPanel';
import { GlobalStyleModal } from './GlobalStyleModal';
import { TemplateModal } from './TemplateModal';
import { PreviewModal } from './PreviewModal';
import { ExportModal } from './ExportModal';
import { ComponentPickerModal } from './ComponentPickerModal';
import {
  Save,
  Undo2,
  Redo2,
  Eye,
  Code,
  Palette,
  FolderPlus,
  Monitor,
  Tablet,
  Smartphone,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  FileCode,
  ArrowRight,
  Plus
} from 'lucide-react';

interface PageBuilderStudioProps {
  onBackToPortal?: () => void;
}

export const PageBuilderStudio: React.FC<PageBuilderStudioProps> = ({ onBackToPortal }) => {
  // Main Page Schema state
  const [pageSchema, setPageSchema] = useState<SmartPageSchema>(INITIAL_SMART_PAGE);

  // Undo / Redo history stack
  const [undoStack, setUndoStack] = useState<SmartPageSchema[]>([]);
  const [redoStack, setRedoStack] = useState<SmartPageSchema[]>([]);

  // Selection state
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(pageSchema.sections[0]?.id || null);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(pageSchema.sections[0]?.columns[0]?.id || null);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(pageSchema.sections[0]?.columns[0]?.widgets[0]?.id || null);

  // Responsive Breakpoint
  const [activeBreakpoint, setActiveBreakpoint] = useState<Breakpoint>('desktop');

  // Simulated User Role for testing
  const [currentUserRole, setCurrentUserRole] = useState<UserRoleCondition>('all');

  // Modals visibility
  const [showGlobalStylesModal, setShowGlobalStylesModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showComponentPickerModal, setShowComponentPickerModal] = useState(false);
  const [pickerTargetInsertIndex, setPickerTargetInsertIndex] = useState<number | null>(null);
  const [pickerTargetColumnId, setPickerTargetColumnId] = useState<string | null>(null);

  // Status notification state
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Push state to undo stack before mutation
  const pushState = (newSchema: SmartPageSchema) => {
    setUndoStack(prev => [...prev.slice(-15), pageSchema]);
    setRedoStack([]);
    setPageSchema(newSchema);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack(r => [pageSchema, ...r]);
    setUndoStack(u => u.slice(0, -1));
    setPageSchema(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setUndoStack(u => [...u, pageSchema]);
    setRedoStack(r => r.slice(1));
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

  // Find currently selected items
  const currentSection = pageSchema.sections.find(s => s.id === selectedSectionId) || null;
  let currentColumn: ColumnInstance | null = null;
  let currentWidget: WidgetInstance | null = null;

  if (currentSection) {
    for (const col of currentSection.columns) {
      if (col.id === selectedColumnId) {
        currentColumn = col;
      }
      const w = col.widgets.find(item => item.id === selectedWidgetId);
      if (w) {
        currentWidget = w;
        currentColumn = col;
        break;
      }
    }
  }

  // Adding new Section
  const handleAddSection = (layoutPreset: '1col' | '2col' | '3col' | '7-5' | '8-4') => {
    const newSecId = `section-${Date.now()}`;
    let columns: ColumnInstance[] = [];

    switch (layoutPreset) {
      case '1col':
        columns = [{ id: `col-${Date.now()}-1`, width: 12, widgets: [] }];
        break;
      case '2col':
        columns = [
          { id: `col-${Date.now()}-1`, width: 6, widgets: [] },
          { id: `col-${Date.now()}-2`, width: 6, widgets: [] }
        ];
        break;
      case '3col':
        columns = [
          { id: `col-${Date.now()}-1`, width: 4, widgets: [] },
          { id: `col-${Date.now()}-2`, width: 4, widgets: [] },
          { id: `col-${Date.now()}-3`, width: 4, widgets: [] }
        ];
        break;
      case '7-5':
        columns = [
          { id: `col-${Date.now()}-1`, width: 7, widgets: [] },
          { id: `col-${Date.now()}-2`, width: 5, widgets: [] }
        ];
        break;
      case '8-4':
        columns = [
          { id: `col-${Date.now()}-1`, width: 8, widgets: [] },
          { id: `col-${Date.now()}-2`, width: 4, widgets: [] }
        ];
        break;
    }

    const newSec: SectionInstance = {
      id: newSecId,
      name: `سکشن جدید (${layoutPreset})`,
      layout: 'boxed',
      backgroundColor: '#ffffff',
      paddingTop: 40,
      paddingBottom: 40,
      columns,
      visibility: { desktop: true, tablet: true, mobile: true },
      conditionalDisplay: { enabled: false, userRole: 'all' }
    };

    pushState({
      ...pageSchema,
      sections: [...pageSchema.sections, newSec]
    });

    setSelectedSectionId(newSecId);
    setSelectedColumnId(columns[0].id);
  };

  // Open Component Picker Modal
  const handleOpenComponentPicker = (targetInsertIndex?: number, targetColumnId?: string) => {
    setPickerTargetInsertIndex(targetInsertIndex !== undefined ? targetInsertIndex : null);
    setPickerTargetColumnId(targetColumnId !== undefined ? targetColumnId : null);
    setShowComponentPickerModal(true);
  };

  // Add section from modal at specific position
  const handleAddSectionFromModal = (preset: '1col' | '2col' | '3col' | '4col' | '7-5' | '8-4') => {
    const newSecId = `section-${Date.now()}`;
    let columns: ColumnInstance[] = [];

    switch (preset) {
      case '1col':
        columns = [{ id: `col-${Date.now()}-1`, width: 12, widgets: [] }];
        break;
      case '2col':
        columns = [
          { id: `col-${Date.now()}-1`, width: 6, widgets: [] },
          { id: `col-${Date.now()}-2`, width: 6, widgets: [] }
        ];
        break;
      case '3col':
        columns = [
          { id: `col-${Date.now()}-1`, width: 4, widgets: [] },
          { id: `col-${Date.now()}-2`, width: 4, widgets: [] },
          { id: `col-${Date.now()}-3`, width: 4, widgets: [] }
        ];
        break;
      case '4col':
        columns = [
          { id: `col-${Date.now()}-1`, width: 3, widgets: [] },
          { id: `col-${Date.now()}-2`, width: 3, widgets: [] },
          { id: `col-${Date.now()}-3`, width: 3, widgets: [] },
          { id: `col-${Date.now()}-4`, width: 3, widgets: [] }
        ];
        break;
      case '7-5':
        columns = [
          { id: `col-${Date.now()}-1`, width: 7, widgets: [] },
          { id: `col-${Date.now()}-2`, width: 5, widgets: [] }
        ];
        break;
      case '8-4':
        columns = [
          { id: `col-${Date.now()}-1`, width: 8, widgets: [] },
          { id: `col-${Date.now()}-2`, width: 4, widgets: [] }
        ];
        break;
    }

    const newSec: SectionInstance = {
      id: newSecId,
      name: `سکشن جدید (${preset})`,
      layout: 'boxed',
      backgroundColor: '#ffffff',
      paddingTop: 40,
      paddingBottom: 40,
      columns,
      visibility: { desktop: true, tablet: true, mobile: true },
      conditionalDisplay: { enabled: false, userRole: 'all' }
    };

    const sectionsCopy = [...pageSchema.sections];
    const insertPos = pickerTargetInsertIndex !== null ? pickerTargetInsertIndex : sectionsCopy.length;
    sectionsCopy.splice(insertPos, 0, newSec);

    pushState({
      ...pageSchema,
      sections: sectionsCopy
    });

    setSelectedSectionId(newSecId);
    setSelectedColumnId(columns[0].id);
  };

  // Add widget from modal (into specific column or creating new section at position)
  const handleAddWidgetFromModal = (widgetType: WidgetType) => {
    if (pickerTargetColumnId) {
      handleAddWidget(widgetType, pickerTargetColumnId);
      return;
    }

    const newSecId = `section-${Date.now()}`;
    const newColId = `col-${Date.now()}-1`;
    const newWidgetId = `widget-${Date.now()}`;

    let title = 'عنوان ویجت جدید';
    let bindingDataSource: any = 'none';

    if (widgetType === 'announcements-feed') {
      title = 'اطلاعیه‌های متصل به سیستم';
      bindingDataSource = 'announcements';
    } else if (widgetType === 'news-feed') {
      title = 'آخرین اخبار دانشگاه';
      bindingDataSource = 'news';
    } else if (widgetType === 'image-gallery') {
      title = 'گالری آلبوم تصاویر';
      bindingDataSource = 'gallery';
    } else if (widgetType === 'achievements-timeline') {
      title = 'افتخارات و دستاوردها';
      bindingDataSource = 'awards';
    } else if (widgetType === 'staff-directory') {
      title = 'لیست اساتید و هیئت علمی';
      bindingDataSource = 'staff';
    } else if (widgetType === 'file-manager') {
      title = 'مخزن اسناد و فرم‌ها';
      bindingDataSource = 'files';
    }

    const newWidget: WidgetInstance = {
      id: newWidgetId,
      type: widgetType,
      title,
      content: 'محتوای اولیه این ویجت در ویرایشگر قرار گرفته است.',
      settings: {
        style: {
          paddingTop: 0,
          paddingBottom: 0,
          textAlign: 'right'
        },
        binding: {
          dataSource: bindingDataSource,
          limit: 4,
          displayMode: 'grid'
        },
        visibility: { desktop: true, tablet: true, mobile: true },
        conditionalDisplay: { enabled: false, userRole: 'all' }
      }
    };

    const newSec: SectionInstance = {
      id: newSecId,
      name: `سکشن ${title}`,
      layout: 'boxed',
      backgroundColor: '#ffffff',
      paddingTop: 32,
      paddingBottom: 32,
      columns: [
        {
          id: newColId,
          width: 12,
          widgets: [newWidget]
        }
      ],
      visibility: { desktop: true, tablet: true, mobile: true },
      conditionalDisplay: { enabled: false, userRole: 'all' }
    };

    const sectionsCopy = [...pageSchema.sections];
    const insertPos = pickerTargetInsertIndex !== null ? pickerTargetInsertIndex : sectionsCopy.length;
    sectionsCopy.splice(insertPos, 0, newSec);

    pushState({
      ...pageSchema,
      sections: sectionsCopy
    });

    setSelectedSectionId(newSecId);
    setSelectedColumnId(newColId);
    setSelectedWidgetId(newWidgetId);
  };

  // Update Section Column Layout Preset (1col, 2col, 3col, 4col, 7-5, 8-4)
  const handleUpdateSectionColumnLayout = (secId: string, preset: '1col' | '2col' | '3col' | '4col' | '7-5' | '8-4') => {
    let targetWidths: number[] = [];
    switch (preset) {
      case '1col': targetWidths = [12]; break;
      case '2col': targetWidths = [6, 6]; break;
      case '3col': targetWidths = [4, 4, 4]; break;
      case '4col': targetWidths = [3, 3, 3, 3]; break;
      case '7-5': targetWidths = [7, 5]; break;
      case '8-4': targetWidths = [8, 4]; break;
    }

    const updatedSections = pageSchema.sections.map(sec => {
      if (sec.id !== secId) return sec;

      const currentCols = sec.columns;
      const newColsCount = targetWidths.length;
      let newCols: ColumnInstance[] = [];

      if (currentCols.length === newColsCount) {
        newCols = currentCols.map((col, idx) => ({ ...col, width: targetWidths[idx] }));
      } else if (currentCols.length < newColsCount) {
        newCols = currentCols.map((col, idx) => ({ ...col, width: targetWidths[idx] }));
        for (let i = currentCols.length; i < newColsCount; i++) {
          newCols.push({
            id: `col-${secId}-${Date.now()}-${i}`,
            width: targetWidths[i],
            widgets: []
          });
        }
      } else {
        const retainedCols = currentCols.slice(0, newColsCount).map((col, idx) => ({ ...col, width: targetWidths[idx] }));
        const overflowCols = currentCols.slice(newColsCount);
        const overflowWidgets = overflowCols.flatMap(c => c.widgets);

        retainedCols[retainedCols.length - 1] = {
          ...retainedCols[retainedCols.length - 1],
          widgets: [...retainedCols[retainedCols.length - 1].widgets, ...overflowWidgets]
        };
        newCols = retainedCols;
      }

      return { ...sec, columns: newCols };
    });

    pushState({ ...pageSchema, sections: updatedSections });
  };

  // Adding new Widget
  const handleAddWidget = (widgetType: WidgetType, targetColumnId?: string) => {
    const colId = targetColumnId || selectedColumnId || pageSchema.sections[0]?.columns[0]?.id;
    if (!colId) return;

    const newWidgetId = `widget-${Date.now()}`;
    let title = 'عنوان ویجت جدید';
    let bindingDataSource: any = 'none';

    if (widgetType === 'announcements-feed') {
      title = 'اطلاعیه‌های متصل به سیستم';
      bindingDataSource = 'announcements';
    } else if (widgetType === 'news-feed') {
      title = 'آخرین اخبار دانشگاه';
      bindingDataSource = 'news';
    } else if (widgetType === 'image-gallery') {
      title = 'گالری آلبوم تصاویر';
      bindingDataSource = 'gallery';
    } else if (widgetType === 'achievements-timeline') {
      title = 'افتخارات و دستاوردها';
      bindingDataSource = 'awards';
    } else if (widgetType === 'staff-directory') {
      title = 'لیست اساتید و هیئت علمی';
      bindingDataSource = 'staff';
    } else if (widgetType === 'file-manager') {
      title = 'مخزن اسناد و فرم‌ها';
      bindingDataSource = 'files';
    }

    const newWidget: WidgetInstance = {
      id: newWidgetId,
      type: widgetType,
      title,
      content: 'محتوای اولیه این ویجت در ویرایشگر قرار گرفته است.',
      settings: {
        style: {
          paddingTop: 0,
          paddingBottom: 0,
          textAlign: 'right'
        },
        binding: {
          dataSource: bindingDataSource,
          limit: 4,
          displayMode: 'grid'
        },
        visibility: { desktop: true, tablet: true, mobile: true },
        conditionalDisplay: { enabled: false, userRole: 'all' }
      }
    };

    const updatedSections = pageSchema.sections.map(sec => ({
      ...sec,
      columns: sec.columns.map(col => {
        if (col.id === colId) {
          return {
            ...col,
            widgets: [...col.widgets, newWidget]
          };
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

  // Updating Widget
  const handleUpdateWidget = (updatedWidget: WidgetInstance) => {
    const updatedSections = pageSchema.sections.map(sec => ({
      ...sec,
      columns: sec.columns.map(col => ({
        ...col,
        widgets: col.widgets.map(w => (w.id === updatedWidget.id ? updatedWidget : w))
      }))
    }));

    setPageSchema({
      ...pageSchema,
      sections: updatedSections
    });
  };

  // Updating Section
  const handleUpdateSection = (updatedSection: SectionInstance) => {
    const updatedSections = pageSchema.sections.map(sec => (sec.id === updatedSection.id ? updatedSection : sec));
    setPageSchema({
      ...pageSchema,
      sections: updatedSections
    });
  };

  // Deleting Section
  const handleDeleteSection = (secId: string) => {
    const updatedSections = pageSchema.sections.filter(s => s.id !== secId);
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

  // Deleting Widget
  const handleDeleteWidget = (wId: string) => {
    const updatedSections = pageSchema.sections.map(sec => ({
      ...sec,
      columns: sec.columns.map(col => ({
        ...col,
        widgets: col.widgets.filter(w => w.id !== wId)
      }))
    }));

    pushState({
      ...pageSchema,
      sections: updatedSections
    });

    if (selectedWidgetId === wId) {
      setSelectedWidgetId(null);
    }
  };

  // Moving Widget Up / Down inside column
  const handleMoveWidget = (wId: string, direction: 'up' | 'down') => {
    const updatedSections = pageSchema.sections.map(sec => ({
      ...sec,
      columns: sec.columns.map(col => {
        const index = col.widgets.findIndex(w => w.id === wId);
        if (index === -1) return col;

        const newWidgets = [...col.widgets];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex >= 0 && targetIndex < newWidgets.length) {
          const temp = newWidgets[index];
          newWidgets[index] = newWidgets[targetIndex];
          newWidgets[targetIndex] = temp;
        }

        return { ...col, widgets: newWidgets };
      })
    }));

    pushState({
      ...pageSchema,
      sections: updatedSections
    });
  };

  // Duplicate widget
  const handleDuplicateWidget = (widget: WidgetInstance) => {
    const duplicated: WidgetInstance = {
      ...widget,
      id: `widget-${Date.now()}`,
      title: `${widget.title} (کپی)`
    };

    const updatedSections = pageSchema.sections.map(sec => ({
      ...sec,
      columns: sec.columns.map(col => {
        if (col.widgets.some(w => w.id === widget.id)) {
          return {
            ...col,
            widgets: [...col.widgets, duplicated]
          };
        }
        return col;
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

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Load preset template
  const handleSelectTemplate = (template: PageTemplate) => {
    pushState(template.schema);
  };

  // Save Page Action
  const handleSavePage = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-10rem)] min-h-[560px] w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white font-sans overflow-hidden rtl text-right transition-colors">
      {/* ============================================================== */}
      {/* TOP APPLICATION BAR & WORKSPACE TOOLBAR */}
      {/* ============================================================== */}
      <header className="h-16 px-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between z-30 shadow-xs">
        {/* Right Section: Title & Status */}
        <div className="flex items-center gap-3">
          {onBackToPortal && (
            <button
              onClick={onBackToPortal}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="بازگشت به پورتال اصلی"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <input
                type="text"
                value={pageSchema.title}
                onChange={(e) => setPageSchema({ ...pageSchema, title: e.target.value })}
                className="text-sm font-black bg-transparent text-slate-900 dark:text-white border-b border-transparent hover:border-gray-300 dark:hover:border-slate-700 focus:border-teal-500 focus:outline-none px-1"
              />
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                <span>شناسه: /{pageSchema.slug}</span>
                <span>•</span>
                <span className="px-1.5 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20">
                  Intelligent Layout Engine
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Section: Responsive Breakpoint Switcher & Undo/Redo */}
        <div className="flex items-center gap-4">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-gray-200 dark:border-slate-800">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-teal-500 disabled:opacity-30 cursor-pointer"
              title="واکشی قبلی (Undo)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-teal-500 disabled:opacity-30 cursor-pointer"
              title="اعمال مجدد (Redo)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Breakpoint selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-gray-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setActiveBreakpoint('desktop')}
              className={`p-2 rounded-xl flex items-center gap-1 font-bold cursor-pointer transition-all ${
                activeBreakpoint === 'desktop' ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs' : 'text-slate-400'
              }`}
              title="نمایش دسکتاپ"
            >
              <Monitor className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveBreakpoint('tablet')}
              className={`p-2 rounded-xl flex items-center gap-1 font-bold cursor-pointer transition-all ${
                activeBreakpoint === 'tablet' ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs' : 'text-slate-400'
              }`}
              title="نمایش تبلت (768px)"
            >
              <Tablet className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveBreakpoint('mobile')}
              className={`p-2 rounded-xl flex items-center gap-1 font-bold cursor-pointer transition-all ${
                activeBreakpoint === 'mobile' ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs' : 'text-slate-400'
              }`}
              title="نمایش موبایل (390px)"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Left Section: Actions Bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-indigo-500/20 shadow-xs"
            title="کتابخانه قالب‌های آماده"
          >
            <FolderPlus className="w-4 h-4" />
            <span>کتابخانه قالب‌ها</span>
          </button>

          <button
            onClick={() => setShowGlobalStylesModal(true)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="استایل‌های سراسری"
          >
            <Palette className="w-4 h-4 text-teal-500" />
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="تولید کد خروجی"
          >
            <Code className="w-4 h-4 text-amber-500" />
          </button>

          <button
            onClick={() => handleOpenComponentPicker(pageSchema.sections.length)}
            className="px-3 py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500 hover:text-white text-teal-600 dark:text-teal-400 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-teal-500/20 shadow-xs"
            title="افزودن بلوک یا کامپوننت جدید"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن بلوک</span>
          </button>

          <button
            onClick={() => setShowPreviewModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Eye className="w-4 h-4 text-teal-500" />
            <span>پیش‌نمایش زنده</span>
          </button>

          <button
            onClick={handleSavePage}
            className="px-5 py-2 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white dark:text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white dark:text-slate-950" />
                <span>ذخیره گردید</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>انتشار / ذخیره</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* MAIN WORKSPACE BODY (Sidebars + Center Canvas) */}
      {/* ============================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Right Panel: Sidebar Elements & Widgets Palette */}
        <SidebarPanels
          pageSchema={pageSchema}
          selectedSectionId={selectedSectionId}
          selectedColumnId={selectedColumnId}
          selectedWidgetId={selectedWidgetId}
          onSelectSection={handleSelectSection}
          onSelectColumn={handleSelectColumn}
          onSelectWidget={handleSelectWidget}
          onAddSection={handleAddSection}
          onAddWidget={handleAddWidget}
          onOpenComponentPicker={handleOpenComponentPicker}
          onDeleteSection={handleDeleteSection}
          onDeleteWidget={handleDeleteWidget}
          onOpenGlobalStyles={() => setShowGlobalStylesModal(true)}
          onOpenTemplatesModal={() => setShowTemplateModal(true)}
          onRestoreVersion={handleRestoreVersion}
          onSaveDraftVersion={handleSaveDraftVersion}
        />

        {/* Center Panel: Interactive Drag & Drop Canvas */}
        <Canvas
          pageSchema={pageSchema}
          activeBreakpoint={activeBreakpoint}
          selectedSectionId={selectedSectionId}
          selectedColumnId={selectedColumnId}
          selectedWidgetId={selectedWidgetId}
          currentUserRole={currentUserRole}
          onSelectSection={handleSelectSection}
          onSelectColumn={handleSelectColumn}
          onSelectWidget={handleSelectWidget}
          onAddWidget={handleAddWidget}
          onAddSection={handleAddSection}
          onOpenComponentPicker={handleOpenComponentPicker}
          onDeleteSection={handleDeleteSection}
          onDeleteWidget={handleDeleteWidget}
          onMoveWidget={handleMoveWidget}
        />

        {/* Left Panel: Property Inspector & Binding Panel */}
        <InspectorPanel
          selectedWidget={currentWidget}
          selectedColumn={currentColumn}
          selectedSection={currentSection}
          onUpdateWidget={handleUpdateWidget}
          onUpdateSection={handleUpdateSection}
          onUpdateSectionColumnLayout={handleUpdateSectionColumnLayout}
          onDeleteWidget={handleDeleteWidget}
          onDeleteSection={handleDeleteSection}
          onDuplicateWidget={handleDuplicateWidget}
        />
      </div>

      {/* ============================================================== */}
      {/* MODALS */}
      {/* ============================================================== */}
      {showComponentPickerModal && (
        <ComponentPickerModal
          isOpen={showComponentPickerModal}
          targetInsertIndex={pickerTargetInsertIndex}
          targetColumnId={pickerTargetColumnId}
          onSelectWidget={(widgetType) => {
            handleAddWidgetFromModal(widgetType);
            setShowComponentPickerModal(false);
          }}
          onSelectSectionPreset={(preset) => {
            handleAddSectionFromModal(preset);
            setShowComponentPickerModal(false);
          }}
          onClose={() => setShowComponentPickerModal(false)}
        />
      )}
      {showGlobalStylesModal && (
        <GlobalStyleModal
          globalStyles={pageSchema.globalStyles}
          onSave={(updatedStyles) => {
            setPageSchema({ ...pageSchema, globalStyles: updatedStyles });
          }}
          onClose={() => setShowGlobalStylesModal(false)}
        />
      )}

      {showTemplateModal && (
        <TemplateModal
          currentSchema={pageSchema}
          onSelectTemplate={handleSelectTemplate}
          onImportJson={(imported) => pushState(imported)}
          onClose={() => setShowTemplateModal(false)}
        />
      )}

      {showPreviewModal && (
        <PreviewModal
          pageSchema={pageSchema}
          onClose={() => setShowPreviewModal(false)}
        />
      )}

      {showExportModal && (
        <ExportModal
          pageSchema={pageSchema}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
};
