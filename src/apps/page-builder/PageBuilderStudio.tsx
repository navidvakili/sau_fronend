import React, { useState, useEffect } from 'react';
import {
  SmartPageSchema,
  SectionInstance,
  ColumnInstance,
  ColumnResponsiveWidths,
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
import { InspectorPanel } from './InspectorPanel';
import { GlobalStyleModal } from './GlobalStyleModal';
import { TemplateModal } from './TemplateModal';
import { PreviewModal } from './PreviewModal';
import { ExportModal } from './ExportModal';
import { ComponentPickerModal } from './ComponentPickerModal';
import { PagesList, buildPagePath } from './PagesList';
import { ConfirmDialog } from './ConfirmDialog';
import { PageSettingsModal } from './PageSettingsModal';
import { ChildPagesManagerModal } from './ChildPagesManagerModal';
import {
  fetchSmartPages,
  fetchSmartPage,
  fetchSmartPageChildren,
  createSmartPage,
  updateSmartPage,
  deleteSmartPage,
  SmartPageDto
} from './api';
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
  CheckCircle,
  Clock,
  History,
  LayoutGrid,
  Sparkles,
  Layers,
  FileCode,
  ArrowRight,
  Plus,
  Settings2,
  Loader2,
  FolderTree
} from 'lucide-react';

interface PageBuilderStudioProps {
  onBackToPortal?: () => void;
}

export const PageBuilderStudio: React.FC<PageBuilderStudioProps> = ({ onBackToPortal }) => {
  // Main Page Schema state
  const [pageSchema, setPageSchema] = useState<SmartPageSchema>(INITIAL_SMART_PAGE);

  // Multi-page state (persisted via backend SmartPage API)
  const [pages, setPages] = useState<SmartPageDto[]>([]);
  const [activePageId, setActivePageId] = useState<number | null>(null);
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  const [isLoadingPages, setIsLoadingPages] = useState(true);
  const [isSavingPage, setIsSavingPage] = useState(false);
  const [showPageSettingsModal, setShowPageSettingsModal] = useState(false);

  // View mode: card-list of pages (default) OR the builder editor
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');

  // Version history dropdown (moved from the removed right sidebar into the top bar)
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Delete confirmation dialog state
  const [pageToDelete, setPageToDelete] = useState<SmartPageDto | null>(null);
  const [isDeletingPage, setIsDeletingPage] = useState(false);

  // Child-pages manager (زیرصفحه‌ها فقط از داخل استودیوی صفحهٔ والد مدیریت می‌شوند)
  const [showChildPagesModal, setShowChildPagesModal] = useState(false);
  const [childPages, setChildPages] = useState<SmartPageDto[]>([]);
  const [isLoadingChildPages, setIsLoadingChildPages] = useState(false);
  const [isCreatingChild, setIsCreatingChild] = useState(false);
  const [childCreateError, setChildCreateError] = useState<string | null>(null);

  // Load saved pages from backend on mount (card list is shown first)
  useEffect(() => {
    let cancelled = false;
    fetchSmartPages({ per_page: 100 })
      .then((res) => {
        if (cancelled) return;
        setPages(res.data);
        setIsLoadingPages(false);
      })
      .catch(() => {
        if (!cancelled) setIsLoadingPages(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open the editor for a saved page
  const openEditor = (id: number) => {
    loadPage(id);
    setViewMode('editor');
    setShowVersionHistory(false);
  };

  // Load a saved page (full schema) and make it active
  const loadPage = async (id: number) => {
    try {
      const dto = await fetchSmartPage(id);
      const schema = (dto.schema ?? {}) as unknown as SmartPageSchema;
      const merged: SmartPageSchema = {
        ...schema,
        id: `page-${dto.id}`,
        title: dto.title ?? schema.title ?? 'صفحه بدون عنوان',
        slug: dto.slug ?? schema.slug ?? `page-${dto.id}`,
        status: dto.status ?? schema.status ?? 'draft',
        seo: dto.seo ?? schema.seo,
        updatedAt: dto.updated_at ?? schema.updatedAt,
      };
      setActivePageId(dto.id!);
      setCurrentParentId(dto.parent_id ?? null);
      setPageSchema(merged);
      setUndoStack([]);
      setRedoStack([]);
      setSelectedSectionId(merged.sections[0]?.id ?? null);
      setSelectedColumnId(merged.sections[0]?.columns[0]?.id ?? null);
      setSelectedWidgetId(merged.sections[0]?.columns[0]?.widgets[0]?.id ?? null);
    } catch {
      // ignore — keep current schema
    }
  };

  // Create a brand-new (unsaved) page
  const handleCreatePage = () => {
    const fresh = JSON.parse(JSON.stringify(INITIAL_SMART_PAGE)) as SmartPageSchema;
    fresh.id = `page-new-${Date.now()}`;
    fresh.slug = `page-${Date.now()}`;
    fresh.title = 'صفحه جدید';
    fresh.status = 'draft';
    fresh.seo = { title: '', description: '', keywords: '', og_image: '' };
    fresh.createdAt = new Date().toISOString().slice(0, 10);
    fresh.updatedAt = new Date().toISOString().slice(0, 10);
    fresh.versionHistory = [];
    fresh.sections = [];
    setActivePageId(null);
    setCurrentParentId(null);
    setPageSchema(fresh);
    setUndoStack([]);
    setRedoStack([]);
    setSelectedSectionId(null);
    setSelectedColumnId(null);
    setSelectedWidgetId(null);
    setViewMode('editor');
    setShowVersionHistory(false);
    // Prompt user to fill title/slug/SEO right away
    setShowPageSettingsModal(true);
  };

  // Open the delete confirmation dialog for a page
  const handleDeleteRequest = (page: SmartPageDto) => {
    setPageToDelete(page);
  };

  // Actually delete after dialog confirmation
  const handleConfirmDeletePage = async () => {
    const id = pageToDelete?.id;
    if (!id) return;
    setIsDeletingPage(true);
    try {
      await deleteSmartPage(id);
      const remaining = pages.filter((p) => p.id !== id);
      setPages(remaining);
      if (activePageId === id) {
        // Deleted page was active in the editor → reset and return to the list
        setActivePageId(null);
        setPageSchema(JSON.parse(JSON.stringify(INITIAL_SMART_PAGE)));
        setUndoStack([]);
        setRedoStack([]);
        setViewMode('list');
      } else if (activePageId) {
        // حذف یک زیرصفحه → فهرست زیرصفحه‌های صفحهٔ باز به‌روز شود
        void loadChildPages(activePageId);
      }
      setPageToDelete(null);
    } catch {
      // keep dialog open on failure
    } finally {
      setIsDeletingPage(false);
    }
  };

  // ---- مدیریت زیرصفحه‌ها (Child Pages) ----

  // بارگذاری زیرصفحه‌های یک صفحه برای نمایش در مدیر زیرصفحه‌ها
  const loadChildPages = async (id: number) => {
    setIsLoadingChildPages(true);
    try {
      setChildPages(await fetchSmartPageChildren(id));
    } catch {
      setChildPages([]);
    } finally {
      setIsLoadingChildPages(false);
    }
  };

  // باز کردن مدیر زیرصفحه‌ها از داخل استودیوی صفحهٔ والد
  const handleOpenChildPages = () => {
    setChildCreateError(null);
    if (activePageId) void loadChildPages(activePageId);
    else setChildPages([]);
    setShowChildPagesModal(true);
  };

  // ساخت زیرصفحهٔ جدید برای صفحهٔ فعلی — بلافاصله در ویرایشگر باز می‌شود
  const handleCreateChild = async (data: { title: string; slug: string; status: 'published' | 'draft' }) => {
    if (!activePageId) return;
    setIsCreatingChild(true);
    setChildCreateError(null);
    try {
      const fresh = JSON.parse(JSON.stringify(INITIAL_SMART_PAGE)) as SmartPageSchema;
      fresh.id = `page-new-${Date.now()}`;
      fresh.slug = data.slug;
      fresh.title = data.title;
      fresh.status = data.status;
      fresh.seo = { title: '', description: '', keywords: '', og_image: '' };
      fresh.createdAt = new Date().toISOString().slice(0, 10);
      fresh.updatedAt = new Date().toISOString().slice(0, 10);
      fresh.versionHistory = [];
      fresh.sections = [];
      const res = await createSmartPage({
        title: data.title,
        slug: data.slug,
        parent_id: activePageId,
        sort_order: childPages.length,
        status: data.status,
        seo: { title: '', description: '', keywords: '', og_image: '' },
        schema: fresh as unknown as Record<string, unknown>,
      });
      // به‌روزرسانی فهرست‌ها و رفتن به طراحی زیرصفحهٔ تازه‌ساخته
      const list = await fetchSmartPages({ per_page: 100 });
      setPages(list.data);
      void loadChildPages(activePageId);
      setShowChildPagesModal(false);
      openEditor(res.data.id!);
    } catch (err) {
      setChildCreateError(err instanceof Error ? err.message : 'خطا در ایجاد زیرصفحه');
    } finally {
      setIsCreatingChild(false);
    }
  };

  // درخواست حذف یک زیرصفحه (دیالوگ تأیید مشترک با صفحات عادی)
  const handleDeleteChild = (page: SmartPageDto) => {
    handleDeleteRequest(page);
  };

  // Save page meta (title/slug/status/seo) — create or update
  const handleSavePageSettings = async (data: {
    title: string;
    slug: string;
    parent_id?: number | null;
    status: 'published' | 'draft';
    seo: { title?: string; description?: string; keywords?: string; og_image?: string };
  }) => {
    setIsSavingPage(true);
    try {
      const payload = {
        title: data.title,
        slug: data.slug,
        parent_id: data.parent_id ?? null,
        status: data.status,
        seo: data.seo,
        schema: JSON.parse(JSON.stringify(pageSchema)),
      };
      if (activePageId) {
        await updateSmartPage(activePageId, payload);
        setCurrentParentId(data.parent_id ?? null);
      } else {
        const res = await createSmartPage(payload);
        setActivePageId(res.data.id!);
        setCurrentParentId(data.parent_id ?? null);
        setPageSchema((prev) => ({ ...prev, id: `page-${res.data.id}` }));
      }
      setPageSchema((prev) => ({
        ...prev,
        title: data.title,
        slug: data.slug,
        status: data.status,
        seo: data.seo,
      }));
      const list = await fetchSmartPages({ per_page: 100 });
      setPages(list.data);
      setShowPageSettingsModal(false);
    } catch {
      // keep modal open on failure
    } finally {
      setIsSavingPage(false);
    }
  };

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

  // ============ Helpers بازگشتی — سکشن‌های تودرتو (بلوک و زیربلوک) ============

  /** جستجوی بازگشتی یک سکشن در کل درخت (سطح اصلی یا زیربلوک‌های داخل ستون‌ها) */
  const findSectionRecursive = (sections: SectionInstance[], id: string): SectionInstance | null => {
    for (const s of sections) {
      if (s.id === id) return s;
      for (const col of s.columns) {
        const found = findSectionRecursive(col.subSections || [], id);
        if (found) return found;
      }
    }
    return null;
  };

  /** اعمال تابع روی همهٔ سکشن‌های درخت (بازگشتی) — ستون‌ها و زیربلوک‌ها حفظ می‌شوند */
  const mapSectionsRecursive = (
    sections: SectionInstance[],
    fn: (sec: SectionInstance) => SectionInstance
  ): SectionInstance[] =>
    sections.map((sec) => {
      const mapped = fn(sec);
      return {
        ...mapped,
        columns: (mapped.columns || []).map((col) => ({
          ...col,
          subSections: col.subSections ? mapSectionsRecursive(col.subSections, fn) : undefined
        }))
      };
    });

  /** حذف یک سکشن از هر جای درخت (سطح اصلی یا زیربلوک) */
  const removeSectionRecursive = (sections: SectionInstance[], id: string): SectionInstance[] =>
    sections
      .filter((s) => s.id !== id)
      .map((s) => ({
        ...s,
        columns: (s.columns || []).map((col) => ({
          ...col,
          subSections: col.subSections ? removeSectionRecursive(col.subSections, id) : undefined
        }))
      }));

  /** آیا سکشن sec حاوی سکشن id در زیردرخت خود است؟ (برای جابه‌جایی بلوک) */
  const containsSection = (sec: SectionInstance, id: string): boolean =>
    sec.id === id ||
    sec.columns.some((col) => (col.subSections || []).some((sub) => containsSection(sub, id)));

  /** آیا ستون colId در زیردرخت سکشن sec قرار دارد؟ (جلوگیری از تودرتویی خودارجاع) */
  const isColumnInSection = (sec: SectionInstance, colId: string): boolean =>
    sec.columns.some(
      (col) => col.id === colId || (col.subSections || []).some((sub) => isColumnInSection(sub, colId))
    );

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
        const w = col.widgets.find((item) => item.id === selectedWidgetId);
        if (w) {
          currentWidget = w;
          currentColumn = col;
          if (!currentSection) currentSection = sec;
          return true;
        }
        if (col.subSections && findSelection(col.subSections)) return true;
      }
    }
    return !!currentWidget;
  };
  findSelection(pageSchema.sections);

  // Adding new Section
  /** عرض‌های واکنش‌گرای پیش‌فرض برای یک ستون — موبایل تک‌ستونه (تمام‌عرض) */
  const withWidths = (width: number): ColumnResponsiveWidths => ({
    desktop: width,
    tablet: width,
    mobile: 12
  });

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

    // responsive widths: mobile defaults to single column
    columns = columns.map((c) => ({ ...c, widths: withWidths(c.width) }));

    const newSec: SectionInstance = {
      id: newSecId,
      name: `سکشن جدید (${layoutPreset})`,
      layout: 'boxed',
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

    // responsive widths: mobile defaults to single column
    columns = columns.map((c) => ({ ...c, widths: withWidths(c.width) }));

    const newSec: SectionInstance = {
      id: newSecId,
      name: `سکشن جدید (${preset})`,
      layout: 'boxed',
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
      paddingTop: 32,
      paddingBottom: 32,
      columns: [
        {
          id: newColId,
          width: 12,
          widths: withWidths(12),
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

    const updatedSections = mapSectionsRecursive(pageSchema.sections, sec => {
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
            widgets: []
          });
        }
      } else {
        const retainedCols = currentCols.slice(0, newColsCount).map((col, idx) => ({
          ...col,
          width: targetWidths[idx],
          widths: { ...col.widths, desktop: targetWidths[idx] }
        }));
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

  // Update single column width for a specific breakpoint (responsive layout — بازگشتی)
  const handleUpdateColumnWidth = (secId: string, colId: string, bp: Breakpoint, value: number) => {
    const updatedSections = mapSectionsRecursive(pageSchema.sections, sec => {
      if (sec.id !== secId) return sec;
      return {
        ...sec,
        columns: sec.columns.map(col => {
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

    const updatedSections = mapSectionsRecursive(pageSchema.sections, sec => ({
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

  // Updating Widget (بازگشتی — ویجت داخل زیربلوک هم پشتیبانی می‌شود)
  const handleUpdateWidget = (updatedWidget: WidgetInstance) => {
    const updatedSections = mapSectionsRecursive(pageSchema.sections, sec => ({
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

  // Updating Section (بازگشتی — زیربلوک‌ها هم پشتیبانی می‌شوند)
  const handleUpdateSection = (updatedSection: SectionInstance) => {
    const updatedSections = mapSectionsRecursive(pageSchema.sections, sec =>
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

  // Deleting Widget (بازگشتی)
  const handleDeleteWidget = (wId: string) => {
    const updatedSections = mapSectionsRecursive(pageSchema.sections, sec => ({
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

  // Moving Widget Up / Down inside column (بازگشتی)
  const handleMoveWidget = (wId: string, direction: 'up' | 'down') => {
    const updatedSections = mapSectionsRecursive(pageSchema.sections, sec => ({
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

  // Duplicate widget (بازگشتی)
  const handleDuplicateWidget = (widget: WidgetInstance) => {
    const duplicated: WidgetInstance = {
      ...widget,
      id: `widget-${Date.now()}`,
      title: `${widget.title} (کپی)`
    };

    const updatedSections = mapSectionsRecursive(pageSchema.sections, sec => ({
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

  // Save Page Action — persist full schema to backend (create or update)
  const savePageWithStatus = async (status: 'published' | 'draft') => {
    setIsSavingPage(true);
    try {
      const payload = {
        title: pageSchema.title,
        slug: pageSchema.slug,
        status,
        seo: pageSchema.seo,
        schema: JSON.parse(JSON.stringify(pageSchema)),
      };
      if (activePageId) {
        await updateSmartPage(activePageId, payload);
      } else {
        const res = await createSmartPage(payload);
        setActivePageId(res.data.id!);
        setPageSchema((prev) => ({ ...prev, id: `page-${res.data.id}` }));
      }
      setPageSchema((prev) => ({ ...prev, status }));
      const list = await fetchSmartPages({ per_page: 100 });
      setPages(list.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch {
      // API layer shows the error toast; keep editing
    } finally {
      setIsSavingPage(false);
    }
  };

  /** ذخیره به‌صورت پیش‌نویس (وضعیت draft) */
  const handleSaveDraft = () => savePageWithStatus('draft');

  /** ذخیره و انتشار (وضعیت published) */
  const handleSavePublish = () => savePageWithStatus('published');

  // Move widget to a target column (cross-section Drag & Drop — بازگشتی)
  const handleMoveWidgetToColumn = (widgetId: string, targetColumnId: string, index?: number) => {
    let widgetToMove: WidgetInstance | null = null;
    let sourceColumnId: string | null = null;
    let sourceIndex = -1;

    // Remove widget from its source column (first pass — هر جای درخت)
    const removedSections = mapSectionsRecursive(pageSchema.sections, sec => ({
      ...sec,
      columns: sec.columns.map(col => {
        const idx = col.widgets.findIndex(w => w.id === widgetId);
        if (idx !== -1) {
          widgetToMove = col.widgets[idx];
          sourceColumnId = col.id;
          sourceIndex = idx;
          const newWidgets = [...col.widgets];
          newWidgets.splice(idx, 1);
          return { ...col, widgets: newWidgets };
        }
        return col;
      })
    }));

    if (!widgetToMove) return;

    // Append/insert widget at the target column (second pass — بازگشتی)
    const finalSections = mapSectionsRecursive(removedSections, sec => ({
      ...sec,
      columns: sec.columns.map(col => {
        if (col.id === targetColumnId) {
          let effectiveIndex =
            typeof index === 'number' ? Math.min(Math.max(index, 0), col.widgets.length) : col.widgets.length;
          // جابه‌جایی در همان ستون — حذف قبلی ایندکس‌ها را یکی به عقب برده است
          if (col.id === sourceColumnId && typeof index === 'number' && sourceIndex < index) {
            effectiveIndex = Math.min(Math.max(index - 1, 0), col.widgets.length);
          }
          const newWidgets = [...col.widgets];
          newWidgets.splice(effectiveIndex, 0, widgetToMove!);
          return { ...col, widgets: newWidgets };
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
  const handleMoveSectionToColumn = (sectionId: string, targetColumnId: string) => {
    const sec = findSectionRecursive(pageSchema.sections, sectionId);
    if (!sec) return;
    if (isColumnInSection(sec, targetColumnId)) return; // داخل خودش — ممنوع

    const removedSections = removeSectionRecursive(pageSchema.sections, sectionId);
    const clone = JSON.parse(JSON.stringify(sec)) as SectionInstance;

    const finalSections = mapSectionsRecursive(removedSections, s => ({
      ...s,
      columns: s.columns.map(col =>
        col.id === targetColumnId
          ? { ...col, subSections: [...(col.subSections || []), clone] }
          : col
      )
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
      s => s.id === sectionId || s.columns.some(col => (col.subSections || []).some(sub => containsSection(sub, sectionId)))
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

  /** جابه‌جایی سکشن بالا/پایین درون والد خود (سطح اصلی یا زیربلوک‌های یک ستون) */
  const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
    // ابتدا سطح اصلی
    const topIdx = pageSchema.sections.findIndex(s => s.id === sectionId);
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

    // سپس زیربلوک‌ها (بازگشتی)
    let moved = false;
    const updatedSections = mapSectionsRecursive(pageSchema.sections, sec => {
      if (moved) return sec;
      const newCols = sec.columns.map(col => {
        if (moved || !col.subSections) return col;
        const idx = col.subSections.findIndex(s => s.id === sectionId);
        if (idx === -1) return col;
        const target = direction === 'up' ? idx - 1 : idx + 1;
        if (target < 0 || target >= col.subSections.length) return col;
        const copy = [...col.subSections];
        const t = copy[idx];
        copy[idx] = copy[target];
        copy[target] = t;
        moved = true;
        return { ...col, subSections: copy };
      });
      return { ...sec, columns: newCols };
    });

    if (moved) pushState({ ...pageSchema, sections: updatedSections });
  };

  /** افزودن زیربلوک جدید به داخل یک ستون */
  const handleAddSubSection = (columnId: string) => {
    const newSecId = `sub-section-${Date.now()}`;
    const newColId = `col-${Date.now()}-1`;
    const newSub: SectionInstance = {
      id: newSecId,
      name: 'زیربلوک جدید',
      layout: 'boxed',
      paddingTop: 24,
      paddingBottom: 24,
      columns: [{ id: newColId, width: 12, widths: withWidths(12), widgets: [] }],
      visibility: { desktop: true, tablet: true, mobile: true },
      conditionalDisplay: { enabled: false, userRole: 'all' }
    };

    const updatedSections = mapSectionsRecursive(pageSchema.sections, sec => ({
      ...sec,
      columns: sec.columns.map(col =>
        col.id === columnId
          ? { ...col, subSections: [...(col.subSections || []), newSub] }
          : col
      )
    }));

    pushState({ ...pageSchema, sections: updatedSections });
    setSelectedSectionId(newSecId);
    setSelectedColumnId(newColId);
    setSelectedWidgetId(null);
  };

  // ---- مقادیر محاسبه‌شده برای هدر (زیرصفحه‌ها) ----
  const childCount = activePageId == null ? 0 : pages.filter((p) => p.parent_id === activePageId).length;
  const parentOfCurrent = currentParentId ? pages.find((p) => p.id === currentParentId) : undefined;

  return (
    <>
      {viewMode === 'list' ? (
        <PagesList
          pages={pages}
          isLoading={isLoadingPages}
          onBackToPortal={onBackToPortal}
          onCreatePage={handleCreatePage}
          onEditPage={(id) => openEditor(id)}
          onOpenSettings={async (id) => {
            // فقط دیالوگ تنظیمات باز شود — بدون رفتن به صفحه ویرایش
            await loadPage(id);
            setShowPageSettingsModal(true);
          }}
          onPreviewPage={async (id) => {
            await loadPage(id);
            setShowPreviewModal(true);
          }}
          onDeletePage={(page) => handleDeleteRequest(page)}
        />
      ) : (
      <div className="flex flex-col flex-1 min-h-[480px] w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white font-sans overflow-hidden rtl text-right transition-colors">
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

          {/* Back to the pages card list */}
          <button
            onClick={() => setViewMode('list')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="بازگشت به فهرست صفحات"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

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
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span className="px-1.5 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20">
                  Intelligent Layout Engine
                </span>
                {parentOfCurrent && (
                  <button
                    onClick={() => openEditor(parentOfCurrent.id!)}
                    className="px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors cursor-pointer inline-flex items-center gap-1"
                    title="این صفحه زیرصفحه است — برای رفتن به صفحهٔ والد کلیک کنید"
                  >
                    <FolderTree className="w-3 h-3" />
                    زیرصفحهٔ {parentOfCurrent.title}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Page settings (title / slug / SEO) */}
          <button
            onClick={() => setShowPageSettingsModal(true)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="تنظیمات صفحه و سئو (عنوان، لینک، متادیتا)"
          >
            <Settings2 className="w-4 h-4 text-indigo-500" />
          </button>

          {/* Child-pages manager: زیرصفحه‌ها از داخل همین صفحه ساخته و مدیریت می‌شوند */}
          <button
            onClick={handleOpenChildPages}
            className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="مدیریت زیرصفحه‌های این صفحه (ایجاد، باز کردن، حذف)"
          >
            <FolderTree className="w-4 h-4 text-teal-600" />
            {childCount > 0 && (
              <span className="absolute -top-1.5 -left-1.5 min-w-4 h-4 px-1 rounded-full bg-teal-600 text-white text-[9px] font-black flex items-center justify-center shadow-sm">
                {childCount}
              </span>
            )}
          </button>
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
          {/* Version history dropdown (moved from the removed right sidebar) */}
          <div className="relative">
            <button
              onClick={() => setShowVersionHistory((v) => !v)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="تاریخچه نسخه‌ها"
            >
              <History className="w-4 h-4 text-purple-500" />
            </button>
            {showVersionHistory && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowVersionHistory(false)} />
                <div className="absolute top-full left-0 mt-2 z-50 w-80 max-h-96 overflow-y-auto bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white">پیش‌نویس‌ها و تاریخچه</span>
                    <button
                      onClick={handleSaveDraftVersion}
                      className="px-2.5 py-1.5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white dark:text-slate-950 font-bold text-[10px] cursor-pointer flex items-center gap-1 shadow-xs shrink-0"
                    >
                      <Clock className="w-3 h-3" />
                      <span>ثبت نسخه</span>
                    </button>
                  </div>

                  {pageSchema.versionHistory.length === 0 ? (
                    <div className="text-center text-xs text-slate-400 py-6">
                      هنوز نسخه‌ای ثبت نشده است
                    </div>
                  ) : (
                    pageSchema.versionHistory.map((ver) => (
                      <div
                        key={ver.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                          <span className="truncate">{ver.title}</span>
                          <span className="text-[10px] text-teal-600 dark:text-teal-400 shrink-0">{ver.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{ver.note}</p>
                        <button
                          onClick={() => {
                            handleRestoreVersion(ver);
                            setShowVersionHistory(false);
                          }}
                          className="w-full py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-teal-500" />
                          <span>بازگردانی به این نسخه</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

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
            onClick={() => setShowPreviewModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Eye className="w-4 h-4 text-teal-500" />
            <span>پیش‌نمایش زنده</span>
          </button>

          <button
            onClick={handleSaveDraft}
            disabled={isSavingPage}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-600 dark:text-amber-400 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all border border-amber-500/20 disabled:opacity-60"
            title="ذخیره به‌عنوان پیش‌نویس (بدون انتشار)"
          >
            {isSavingPage ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Clock className="w-4 h-4" />
            )}
            <span>ذخیره پیش‌نویس</span>
          </button>

          <button
            onClick={handleSavePublish}
            disabled={isSavingPage}
            className="px-5 py-2 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white dark:text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all disabled:opacity-60"
          >
            {isSavingPage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال ذخیره...</span>
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white dark:text-slate-950" />
                <span>ذخیره گردید</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>ذخیره و انتشار</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* MAIN WORKSPACE BODY (Sidebars + Center Canvas) */}
      {/* ============================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Center Panel: Interactive Drag & Drop Canvas */}
        <Canvas
          pageSchema={pageSchema}
          pageId={activePageId}
          pageSlug={pageSchema.slug}
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
          onMoveWidgetToColumn={handleMoveWidgetToColumn}
          onMoveSectionToColumn={handleMoveSectionToColumn}
          onMoveSectionToTop={handleMoveSectionToTop}
          onMoveSectionOut={handleMoveSectionOut}
          onMoveSection={handleMoveSection}
          onAddSubSection={handleAddSubSection}
        />

        {/* Left Panel: Property Inspector & Binding Panel */}
        <InspectorPanel
          selectedWidget={currentWidget}
          selectedColumn={currentColumn}
          selectedSection={currentSection}
          activeBreakpoint={activeBreakpoint}
          onUpdateWidget={handleUpdateWidget}
          onUpdateSection={handleUpdateSection}
          onUpdateSectionColumnLayout={handleUpdateSectionColumnLayout}
          onUpdateColumnWidth={handleUpdateColumnWidth}
          onDeleteWidget={handleDeleteWidget}
          onDeleteSection={handleDeleteSection}
          onDuplicateWidget={handleDuplicateWidget}
        />
      </div>
      </div>
      )}

      {/* ============================================================== */}
      {/* MODALS (rendered outside viewMode so they work from the list) */}
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

      {showPageSettingsModal && (
        <PageSettingsModal
          page={{
            id: activePageId ?? undefined,
            title: pageSchema.title,
            slug: pageSchema.slug,
            parent_id: currentParentId,
            status: pageSchema.status,
            seo: pageSchema.seo,
            schema: pageSchema as unknown as Record<string, unknown>,
          }}
          pages={pages}
          isSaving={isSavingPage}
          onSave={handleSavePageSettings}
          onClose={() => setShowPageSettingsModal(false)}
        />
      )}

      {showChildPagesModal && (
        <ChildPagesManagerModal
          parentId={activePageId}
          parentTitle={pageSchema.title}
          parentSlug={pageSchema.slug}
          children={childPages}
          isLoading={isLoadingChildPages}
          isCreating={isCreatingChild}
          createError={childCreateError}
          onCreateChild={handleCreateChild}
          onOpenChild={(id) => {
            setShowChildPagesModal(false);
            openEditor(id);
          }}
          onDeleteChild={handleDeleteChild}
          onClose={() => setShowChildPagesModal(false)}
        />
      )}

      {/* Delete confirmation dialog (replaces window.confirm) */}
      {pageToDelete && (() => {
        const deletedChildCount = pages.filter((p) => p.parent_id === pageToDelete.id).length;
        return (
          <ConfirmDialog
            title={pageToDelete.parent_id ? 'حذف زیرصفحه' : 'حذف صفحه'}
            message={
              `آیا از حذف «${pageToDelete.title}» (${buildPagePath(pageToDelete, pages)}) مطمئن هستید؟ این عملیات قابل بازگشت نیست.` +
              (deletedChildCount > 0
                ? `\nاین صفحه ${deletedChildCount} زیرصفحه دارد که همراه آن حذف خواهند شد.`
                : '')
            }
            confirmLabel="حذف"
            isBusy={isDeletingPage}
            onConfirm={handleConfirmDeletePage}
            onCancel={() => setPageToDelete(null)}
          />
        );
      })()}
    </>
  );
};
