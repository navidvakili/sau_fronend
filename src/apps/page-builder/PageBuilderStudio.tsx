import React, { useState, useEffect } from 'react';
import {
  SmartPageSchema,
  SectionInstance,
  ColumnInstance,
  ColumnBlock,
  Breakpoint,
  UserRoleCondition,
  getColumnBlocks,
  setColumnBlocks
} from './builderTypes';
import { INITIAL_SMART_PAGE } from './mockData';
import { Canvas } from './Canvas';
import { InspectorPanel } from './InspectorPanel';
import { GlobalStyleModal } from './GlobalStyleModal';
import { TemplateModal } from './TemplateModal';
import { PreviewModal } from './PreviewModal';
import { ExportModal } from './ExportModal';
import { ComponentPickerModal } from './ComponentPickerModal';
import { TabSectionEditorModal } from './TabSectionEditorModal';
import { PagesList, buildPagePath } from './PagesList';
import { ConfirmDialog } from '@/src/shared-components/ConfirmDialog';
import { PageSettingsModal } from './PageSettingsModal';
import { ChildPagesManagerModal } from './ChildPagesManagerModal';
import AnalyticsDashboard from '@/src/apps/analytics/AnalyticsDashboard';
import { BuilderToolbar } from './components/BuilderToolbar';
import { usePageBuilderEditor } from './hooks/usePageBuilderEditor';
import {
  fetchSmartPages,
  fetchSmartPage,
  fetchSmartPageChildrenTree,
  createSmartPage,
  updateSmartPage,
  deleteSmartPage,
  duplicateSmartPage,
  updateSmartPageLocks,
  SmartPageDto,
  SmartPageTreeNode
} from './api';
import type { SmartPageLockField } from './PagesList';
import { fetchDedicatedPages } from '../dedicated_pages/api';
import { getPageVariableValues } from '../dedicated_pages/PageContentVariables';
import { useLanguage } from '@/src/shared-utils/LanguageContext';
import { LayoutGrid } from 'lucide-react';

interface PageBuilderStudioProps {
  onBackToPortal?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  /** اگر تنظیم شود، استودیو مستقیماً همان صفحه را باز می‌کند (نه فهرست) — مثلاً هنگام ورود از «ویرایش لایوت» یک صفحهٔ اختصاصی */
  initialPageId?: string | number;
  /** شناسهٔ ماژول فعلی — اگر برابر با تب «آمار بازدیدکنندگان صفحات هوشمند» باشد، استودیو مستقیماً همان تب را باز می‌کند */
  moduleId?: string;
}

export const PageBuilderStudio: React.FC<PageBuilderStudioProps> = ({ onBackToPortal, initialPageId, onDirtyChange, moduleId }) => {
  // زبان محتوای فعال — فهرست صفحات و ایجاد صفحهٔ جدید همیشه مطابق همین زبان است
  const { currentLang, languages } = useLanguage();

  // شمای صفحه، انتخاب سکشن/ستون/ویجت، Undo/Redo و همهٔ عملیات CRUD روی درخت سکشن‌ها
  const editor = usePageBuilderEditor(INITIAL_SMART_PAGE, onDirtyChange);
  const { pageSchema } = editor;

  // Multi-page state (persisted via backend SmartPage API)
  const [pages, setPages] = useState<SmartPageDto[]>([]);
  const [activePageId, setActivePageId] = useState<number | null>(null);
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  // متغیرهای صفحهٔ اختصاصی‌ای که صفحهٔ لایوت فعلی به آن متصل است (اگر باشد) — برای
  // حل توکن‌های {{key}} در ویجت‌های عنوان/متن، هم در بوم و هم در پیش‌نمایش
  const [dedicatedPageVariables, setDedicatedPageVariables] = useState<Record<string, string> | undefined>(undefined);
  /** شناسهٔ نمونهٔ صفحهٔ اختصاصیِ استفاده‌شده برای پیش‌نمایش بلوک‌های dp-* — وقتی این لایوت به یک نوع صفحهٔ اختصاصی متصل است */
  const [previewDedicatedPageId, setPreviewDedicatedPageId] = useState<number | undefined>(undefined);
  const [isLoadingPages, setIsLoadingPages] = useState(true);
  const [isSavingPage, setIsSavingPage] = useState(false);
  const [showPageSettingsModal, setShowPageSettingsModal] = useState(false);

  // View mode: card-list of pages (default) OR the builder editor OR the visitor-analytics dashboard
  const [viewMode, setViewMode] = useState<'list' | 'editor' | 'analytics'>(
    () => (moduleId === 'smart-page-visitor-analytics' ? 'analytics' : 'list')
  );

  // Version history dropdown (moved from the removed right sidebar into the top bar)
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);

  // Delete confirmation dialog state
  const [pageToDelete, setPageToDelete] = useState<SmartPageDto | null>(null);
  const [isDeletingPage, setIsDeletingPage] = useState(false);

  // Duplicate-to-another-language state
  const [duplicatingPageId, setDuplicatingPageId] = useState<number | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  // Child-pages manager (زیرصفحه‌ها فقط از داخل استودیوی صفحهٔ والد مدیریت می‌شوند)
  const [showChildPagesModal, setShowChildPagesModal] = useState(false);
  const [childPagesTree, setChildPagesTree] = useState<SmartPageTreeNode[]>([]);
  const [isLoadingChildPages, setIsLoadingChildPages] = useState(false);
  const [isCreatingChild, setIsCreatingChild] = useState(false);
  const [childCreateError, setChildCreateError] = useState<string | null>(null);

  // Load saved pages from backend on mount, and again whenever the active
  // content language changes (the list is scoped to one language at a time).
  useEffect(() => {
    let cancelled = false;
    setIsLoadingPages(true);
    fetchSmartPages({ per_page: 100, lang: currentLang })
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
  }, [currentLang]);

  // Open the editor for a saved page
  const openEditor = (id: number) => {
    loadPage(id);
    setViewMode('editor');
    setShowVersionHistory(false);
  };

  // اگر با initialPageId باز شده باشیم (مثلاً از «ویرایش لایوت» یک صفحهٔ اختصاصی)،
  // مستقیماً همان صفحه را باز کن — نه فهرست را. با تغییر initialPageId (تب همان
  // ماژول برای رکورد دیگری دوباره استفاده شود) هم دوباره اجرا می‌شود.
  useEffect(() => {
    if (initialPageId !== undefined && initialPageId !== null) {
      openEditor(Number(initialPageId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPageId]);

  // Recursively ensure every column has a subSections array (heals legacy schemas
  // created before the key existed, preventing renderer crashes). Nested sections are
  // read from getColumnBlocks (blocks is the source of truth), not the raw subSections
  // field — otherwise a sub-block authored only in `blocks` (no mirrored `subSections`)
  // never gets recursed into, and its own descendants stay un-normalized.
  const normalizeSubSections = (sections: SectionInstance[]): SectionInstance[] =>
    sections.map((sec) => ({
      ...sec,
      columns: (sec.columns ?? []).map((col) => {
        const rawBlocks = getColumnBlocks(col);
        const normalizedSubs = normalizeSubSections(
          rawBlocks
            .filter((b): b is Extract<ColumnBlock, { kind: 'section' }> => b.kind === 'section')
            .map((b) => b.section)
        );
        const subById = new Map(normalizedSubs.map((s) => [s.id, s]));
        const finalBlocks: ColumnBlock[] = rawBlocks.map((b) =>
          b.kind === 'section' && subById.has(b.section.id) ? { ...b, section: subById.get(b.section.id)! } : b
        );
        const base: ColumnInstance = {
          ...col,
          widgets: Array.isArray(col.widgets) ? col.widgets : [],
        };
        // blocks را می‌سازد (اگر نبود) و subSections/widgets را از همان همگام می‌کند
        return setColumnBlocks(base, finalBlocks);
      }),
    }));

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
      merged.sections = normalizeSubSections(merged.sections ?? []);
      setActivePageId(dto.id!);
      setCurrentParentId(dto.parent_id ?? null);
      editor.setPageSchema(merged);
      editor.setUndoStack([]);
      editor.setRedoStack([]);
      editor.setIsPageDirty(false);
      editor.setSelectedSectionId(merged.sections[0]?.id ?? null);
      editor.setSelectedColumnId(merged.sections[0]?.columns[0]?.id ?? null);
      editor.setSelectedWidgetId(merged.sections[0]?.columns[0]?.widgets[0]?.id ?? null);

      // اگر این صفحه لایوت مشترک یک یا چند نوع صفحهٔ اختصاصی است، یک نمونه از
      // اولین نوع را برای پیش‌نمایش حل توکن‌های {{key}} در پیش‌نمایش بارگذاری کن
      // (چون این لایوت به یک رکورد مشخص متصل نیست، بلکه به همهٔ صفحات از آن نوع/انواع)
      const firstType = dto.dedicated_page_types?.[0];
      if (firstType) {
        const sample = await fetchDedicatedPages({ pageType: firstType as any, perPage: 1 });
        setDedicatedPageVariables(sample.data[0] ? getPageVariableValues(sample.data[0]) : undefined);
        setPreviewDedicatedPageId(sample.data[0]?.id ? Number(sample.data[0].id) : undefined);
      } else {
        setDedicatedPageVariables(undefined);
        setPreviewDedicatedPageId(undefined);
      }
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
    setDedicatedPageVariables(undefined);
    editor.setPageSchema(fresh);
    editor.setUndoStack([]);
    editor.setRedoStack([]);
    editor.setIsPageDirty(false);
    editor.setSelectedSectionId(null);
    editor.setSelectedColumnId(null);
    editor.setSelectedWidgetId(null);
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
        editor.setPageSchema(JSON.parse(JSON.stringify(INITIAL_SMART_PAGE)));
        editor.setUndoStack([]);
        editor.setRedoStack([]);
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

  // کپی صفحه به یک زبان دیگر — چون هر زبان یک صفحهٔ مستقل است، این تنها راه
  // شروع سریع (بدون بازسازی چیدمان از صفر) برای ساخت نسخهٔ همان صفحه در زبان
  // دیگر است؛ نسخهٔ تازه همیشه پیش‌نویس است تا محتوایش ترجمه/بازبینی شود.
  const handleDuplicatePage = async (page: SmartPageDto, targetLang: string) => {
    if (!page.id) return;
    setDuplicatingPageId(page.id);
    setDuplicateError(null);
    try {
      await duplicateSmartPage(page.id, targetLang);
      // نسخهٔ تازه در زبان مقصد ساخته شده — اگر همان زبان فعلی است در فهرست هم نمایش داده شود
      if (targetLang === currentLang) {
        const list = await fetchSmartPages({ per_page: 100, lang: currentLang });
        setPages(list.data);
      }
    } catch (err) {
      setDuplicateError(err instanceof Error ? err.message : 'خطا در ایجاد نسخهٔ زبان دیگر');
    } finally {
      setDuplicatingPageId(null);
    }
  };

  // تغییر یکی از قفل‌های صفحه (ویرایش/حذف/نمایش در فهرست) — فقط کاربر support این دکمه‌ها را می‌بیند؛
  // به‌روزرسانی خوش‌بینانه (optimistic) با بازگردانی در صورت خطا.
  const handleToggleLock = async (page: SmartPageDto, field: SmartPageLockField, value: boolean) => {
    if (!page.id) return;
    const previous = pages;
    setPages(pages.map((p) => (p.id === page.id ? { ...p, [field]: value } : p)));
    try {
      await updateSmartPageLocks(page.id, { [field]: value });
    } catch {
      setPages(previous);
    }
  };

  // ---- مدیریت زیرصفحه‌ها (Child Pages) ----

  // بارگذاری زیرصفحه‌های یک صفحه برای نمایش در مدیر زیرصفحه‌ها
  const loadChildPages = async (id: number) => {
    setIsLoadingChildPages(true);
    try {
      setChildPagesTree(await fetchSmartPageChildrenTree(id));
    } catch {
      setChildPagesTree([]);
    } finally {
      setIsLoadingChildPages(false);
    }
  };

  // باز کردن مدیر زیرصفحه‌ها از داخل استودیوی صفحهٔ والد
  const handleOpenChildPages = () => {
    setChildCreateError(null);
    if (activePageId) void loadChildPages(activePageId);
    else setChildPagesTree([]);
    setShowChildPagesModal(true);
  };

  // ساخت زیرصفحهٔ جدید برای صفحهٔ فعلی — بلافاصله در ویرایشگر باز می‌شود
  const handleCreateChild = async (
    data: { title: string; slug: string; status: 'published' | 'draft' },
    parentId: number
  ) => {
    setIsCreatingChild(true);
    setChildCreateError(null);
    try {
      // sort_order = تعداد زیرصفحه‌های مستقیمِ همان والد (از روی درخت)
      const directChildCount = (nodes: SmartPageTreeNode[], targetId: number): number | null => {
        if (targetId === activePageId) return nodes.length;
        for (const n of nodes) {
          if (n.id === targetId) return n.children.length;
          const found = directChildCount(n.children, targetId);
          if (found !== null) return found;
        }
        return null;
      };
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
        parent_id: parentId,
        sort_order: directChildCount(childPagesTree, parentId) ?? 0,
        status: data.status,
        seo: { title: '', description: '', keywords: '', og_image: '' },
        schema: fresh as unknown as Record<string, unknown>,
        lang: currentLang,
      });
      // به‌روزرسانی فهرست‌ها و رفتن به طراحی زیرصفحهٔ تازه‌ساخته
      const list = await fetchSmartPages({ per_page: 100, lang: currentLang });
      setPages(list.data);
      void loadChildPages(activePageId!);
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
    setPublishWarning(null);
    try {
      const payload = {
        title: data.title,
        slug: data.slug,
        parent_id: data.parent_id ?? null,
        status: data.status,
        seo: data.seo,
        schema: JSON.parse(JSON.stringify(pageSchema)),
      };
      let actualStatus: 'published' | 'draft' = data.status;
      if (activePageId) {
        const res = await updateSmartPage(activePageId, payload);
        actualStatus = res.data.status;
        setCurrentParentId(data.parent_id ?? null);
      } else {
        const res = await createSmartPage({ ...payload, lang: currentLang });
        setActivePageId(res.data.id!);
        setCurrentParentId(data.parent_id ?? null);
        editor.setPageSchema((prev) => ({ ...prev, id: `page-${res.data.id}` }));
        actualStatus = res.data.status;
      }
      // وضعیت واقعیِ بازگشتی از سرور ملاک است (نبود دسترسی «تأیید» می‌تواند انتشار را رد کند)
      editor.setPageSchema((prev) => ({
        ...prev,
        title: data.title,
        slug: data.slug,
        status: actualStatus,
        seo: data.seo,
      }));
      if (data.status === 'published' && actualStatus !== 'published') {
        setPublishWarning('عدم دسترسی «تأیید انتشار» — صفحه به‌صورت پیش‌نویس ذخیره شد و هنوز روی سایت منتشر نیست.');
      }
      const list = await fetchSmartPages({ per_page: 100, lang: currentLang });
      setPages(list.data);
      setShowPageSettingsModal(false);
    } catch {
      // keep modal open on failure
    } finally {
      setIsSavingPage(false);
    }
  };

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
  // ویرایشگر محتوای یک تب (ویجت tabs) — کدام ویجت و کدام ایندکس تب
  const [editingTabWidgetId, setEditingTabWidgetId] = useState<string | null>(null);
  const [editingTabIndex, setEditingTabIndex] = useState<number | null>(null);

  // Status notification state
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [publishWarning, setPublishWarning] = useState<string | null>(null);
  const [showLeaveListConfirm, setShowLeaveListConfirm] = useState(false);

  const handleBackToPageList = () => {
    if (editor.isPageDirty) {
      setShowLeaveListConfirm(true);
      return;
    }
    setViewMode('list');
  };

  // Open Component Picker Modal
  const handleOpenComponentPicker = (targetInsertIndex?: number, targetColumnId?: string) => {
    editor.setPickerTarget(targetInsertIndex, targetColumnId);
    setShowComponentPickerModal(true);
  };

  const handleSaveDraftVersionWithToast = () => {
    editor.handleSaveDraftVersion();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Save Page Action — persist full schema to backend (create or update)
  const savePageWithStatus = async (status: 'published' | 'draft') => {
    setIsSavingPage(true);
    setPublishWarning(null);
    try {
      const payload = {
        title: pageSchema.title,
        slug: pageSchema.slug,
        status,
        seo: pageSchema.seo,
        schema: JSON.parse(JSON.stringify(pageSchema)),
      };
      let actualStatus: 'published' | 'draft' = status;
      if (activePageId) {
        const res = await updateSmartPage(activePageId, payload);
        actualStatus = res.data.status;
      } else {
        const res = await createSmartPage({ ...payload, lang: currentLang });
        setActivePageId(res.data.id!);
        editor.setPageSchema((prev) => ({ ...prev, id: `page-${res.data.id}` }));
        actualStatus = res.data.status;
      }
      // همیشه از وضعیت واقعیِ بازگشتی از سرور استفاده شود، نه وضعیتِ درخواست‌شده —
      // چون سرور ممکن است (مثلاً به‌دلیل نبود دسترسیِ «تأیید») انتشار را رد کند.
      editor.setPageSchema((prev) => ({ ...prev, status: actualStatus }));
      if (status === 'published' && actualStatus !== 'published') {
        setPublishWarning('عدم دسترسی «تأیید انتشار» — صفحه به‌صورت پیش‌نویس ذخیره شد و هنوز روی سایت منتشر نیست.');
      }
      const list = await fetchSmartPages({ per_page: 100, lang: currentLang });
      setPages(list.data);
      setSaveSuccess(true);
      onDirtyChange?.(false);
      editor.setIsPageDirty(false);
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
          languages={languages}
          currentLang={currentLang}
          onDuplicatePage={handleDuplicatePage}
          duplicatingPageId={duplicatingPageId}
          duplicateError={duplicateError}
          onOpenAnalytics={() => setViewMode('analytics')}
          onToggleLock={handleToggleLock}
        />
      ) : viewMode === 'analytics' ? (
        <div className="h-[calc(100dvh_-_13rem)] min-h-[480px] w-full bg-slate-100 dark:bg-slate-950 overflow-y-auto rtl text-right transition-colors">
          <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
            <button
              onClick={() => setViewMode('list')}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-gray-200 dark:border-slate-800 font-black text-xs flex items-center gap-1.5 transition-colors cursor-pointer w-fit"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>بازگشت به فهرست صفحات</span>
            </button>
            <AnalyticsDashboard viewableType="smart_page" />
          </div>
        </div>
      ) : (
      <div className="flex flex-col flex-1 min-h-[480px] w-full bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white font-sans overflow-hidden rtl text-right transition-colors">
      {/* ============================================================== */}
      {/* TOP APPLICATION BAR & WORKSPACE TOOLBAR */}
      {/* ============================================================== */}
      <BuilderToolbar
        onBackToPortal={onBackToPortal}
        onBackToPageList={handleBackToPageList}
        title={pageSchema.title}
        onTitleChange={(title) => editor.pushState({ ...pageSchema, title })}
        parentPage={parentOfCurrent?.id ? { id: parentOfCurrent.id, title: parentOfCurrent.title } : undefined}
        onOpenParentPage={(id) => openEditor(id)}
        onOpenPageSettings={() => setShowPageSettingsModal(true)}
        onOpenChildPages={handleOpenChildPages}
        childCount={childCount}
        canUndo={editor.undoStack.length > 0}
        canRedo={editor.redoStack.length > 0}
        onUndo={editor.handleUndo}
        onRedo={editor.handleRedo}
        activeBreakpoint={activeBreakpoint}
        onChangeBreakpoint={setActiveBreakpoint}
        showVersionHistory={showVersionHistory}
        onToggleVersionHistory={() => setShowVersionHistory((v) => !v)}
        onCloseVersionHistory={() => setShowVersionHistory(false)}
        versionHistory={pageSchema.versionHistory}
        onSaveDraftVersion={handleSaveDraftVersionWithToast}
        onRestoreVersion={editor.handleRestoreVersion}
        onOpenTemplateLibrary={() => setShowTemplateModal(true)}
        onOpenGlobalStyles={() => setShowGlobalStylesModal(true)}
        onOpenExport={() => setShowExportModal(true)}
        onOpenPreview={() => setShowPreviewModal(true)}
        onSavePublish={handleSavePublish}
        onSaveDraft={handleSaveDraft}
        isSavingPage={isSavingPage}
        saveSuccess={saveSuccess}
        showSaveMenu={showSaveMenu}
        onToggleSaveMenu={() => setShowSaveMenu((v) => !v)}
        onCloseSaveMenu={() => setShowSaveMenu(false)}
        publishWarning={publishWarning}
        onClearPublishWarning={() => setPublishWarning(null)}
      />

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
          selectedSectionId={editor.selectedSectionId}
          selectedColumnId={editor.selectedColumnId}
          selectedWidgetId={editor.selectedWidgetId}
          currentUserRole={currentUserRole}
          onSelectSection={editor.handleSelectSection}
          onSelectColumn={editor.handleSelectColumn}
          onSelectWidget={editor.handleSelectWidget}
          onAddWidget={editor.handleAddWidget}
          onAddSection={editor.handleAddSection}
          onOpenComponentPicker={handleOpenComponentPicker}
          onDeleteSection={editor.handleDeleteSection}
          onDuplicateSection={editor.handleDuplicateSection}
          onDeleteWidget={editor.handleDeleteWidget}
          onMoveWidget={editor.handleMoveWidget}
          onMoveWidgetToColumn={editor.handleMoveWidgetToColumn}
          onMoveSectionToColumn={editor.handleMoveSectionToColumn}
          onMoveSectionToTop={editor.handleMoveSectionToTop}
          onMoveSectionOut={editor.handleMoveSectionOut}
          onMoveSection={editor.handleMoveSection}
          onAddSubSection={editor.handleAddSubSection}
        />

        {/* Left Panel: Property Inspector & Binding Panel */}
        <InspectorPanel
          selectedWidget={editor.currentWidget}
          selectedColumn={editor.currentColumn}
          selectedSection={editor.currentSection}
          activeBreakpoint={activeBreakpoint}
          onUpdateWidget={editor.handleUpdateWidget}
          onUpdateSection={editor.handleUpdateSection}
          onUpdateSectionColumnLayout={editor.handleUpdateSectionColumnLayout}
          onUpdateColumnWidth={editor.handleUpdateColumnWidth}
          onUpdateColumn={editor.handleUpdateColumn}
          onDeleteWidget={editor.handleDeleteWidget}
          onDeleteSection={editor.handleDeleteSection}
          onDuplicateSection={editor.handleDuplicateSection}
          onDuplicateWidget={editor.handleDuplicateWidget}
          dedicatedPageId={previewDedicatedPageId}
          onEditTabSection={(widgetId, tabIndex) => {
            setEditingTabWidgetId(widgetId);
            setEditingTabIndex(tabIndex);
          }}
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
          targetInsertIndex={editor.pickerTargetInsertIndex}
          targetColumnId={editor.pickerTargetColumnId}
          onSelectWidget={(widgetType) => {
            editor.handleAddWidgetFromModal(widgetType);
            setShowComponentPickerModal(false);
          }}
          onSelectSectionPreset={(preset) => {
            editor.handleAddSectionFromModal(preset);
            setShowComponentPickerModal(false);
          }}
          onClose={() => setShowComponentPickerModal(false)}
        />
      )}
      {editingTabWidgetId !== null && editingTabIndex !== null && (() => {
        const editingTabWidget = editor.findWidgetInTree(pageSchema.sections, editingTabWidgetId);
        const tabs = editingTabWidget?.settings.customProps?.tabs || [];
        const editingSection: SectionInstance | null = tabs[editingTabIndex]?.section ?? null;
        return (
          <TabSectionEditorModal
            open={!!editingTabWidget && !!editingSection}
            section={editingSection}
            tabLabel={tabs[editingTabIndex]?.label}
            onClose={() => {
              setEditingTabWidgetId(null);
              setEditingTabIndex(null);
            }}
            onSave={(updatedSection) => {
              if (!editingTabWidget) return;
              const newTabs = [...tabs];
              newTabs[editingTabIndex] = { ...newTabs[editingTabIndex], section: updatedSection };
              editor.handleUpdateWidget({
                ...editingTabWidget,
                settings: {
                  ...editingTabWidget.settings,
                  customProps: { ...(editingTabWidget.settings.customProps || {}), tabs: newTabs }
                }
              });
              setEditingTabWidgetId(null);
              setEditingTabIndex(null);
            }}
          />
        );
      })()}
      {showGlobalStylesModal && (
        <GlobalStyleModal
          globalStyles={pageSchema.globalStyles}
          onSave={(updatedStyles) => {
            editor.pushState({ ...pageSchema, globalStyles: updatedStyles });
          }}
          onClose={() => setShowGlobalStylesModal(false)}
        />
      )}

      {showTemplateModal && (
        <TemplateModal
          currentSchema={pageSchema}
          onSelectTemplate={editor.handleSelectTemplate}
          onImportJson={(imported) => editor.pushState(imported)}
          onClose={() => setShowTemplateModal(false)}
        />
      )}

      {showPreviewModal && (
        <PreviewModal
          pageSchema={pageSchema}
          onClose={() => setShowPreviewModal(false)}
          variables={dedicatedPageVariables}
          dedicatedPageId={previewDedicatedPageId}
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
          language={
            (activePageId ? pages.find((p) => p.id === activePageId)?.language : undefined) ?? currentLang
          }
          pages={pages}
          isSaving={isSavingPage}
          onSave={handleSavePageSettings}
          onClose={() => setShowPageSettingsModal(false)}
        />
      )}

      {showChildPagesModal && (
        <ChildPagesManagerModal
          key={activePageId ?? 'new'}
          parentId={activePageId}
          parentTitle={pageSchema.title}
          parentSlug={pageSchema.slug}
          childrenTree={childPagesTree}
          isLoading={isLoadingChildPages}
          isCreating={isCreatingChild}
          createError={childCreateError}
          onCreateChild={(data, parentId) => void handleCreateChild(data, parentId)}
          onOpenChild={(id) => {
            setShowChildPagesModal(false);
            openEditor(id);
          }}
          onDeleteChild={handleDeleteChild}
          onClose={() => setShowChildPagesModal(false)}
        />
      )}

      {/* Delete confirmation dialog (replaces window.confirm) */}
      <ConfirmDialog
        open={!!pageToDelete}
        title={pageToDelete?.parent_id ? 'حذف زیرصفحه' : 'حذف صفحه'}
        message={
          pageToDelete ? (() => {
            const deletedChildCount = pages.filter((p) => p.parent_id === pageToDelete.id).length;
            return (
              `آیا از حذف «${pageToDelete.title}» (${buildPagePath(pageToDelete, pages)}) مطمئن هستید؟ این عملیات قابل بازگشت نیست.` +
              (deletedChildCount > 0
                ? `\nاین صفحه ${deletedChildCount} زیرصفحه دارد که همراه آن حذف خواهند شد.`
                : '')
            );
          })() : ''
        }
        confirmLabel="حذف"
        busy={isDeletingPage}
        onConfirm={handleConfirmDeletePage}
        onCancel={() => setPageToDelete(null)}
      />

      <ConfirmDialog
        open={showLeaveListConfirm}
        title="تغییرات ذخیره نشده"
        message="تغییرات صفحه هنوز ذخیره نشده‌اند. آیا می‌خواهید به فهرست صفحات برگردید؟"
        confirmLabel="بازگشت بدون ذخیره"
        cancelLabel="ادامه ویرایش"
        danger={false}
        onConfirm={() => {
          setShowLeaveListConfirm(false);
          setViewMode('list');
        }}
        onCancel={() => setShowLeaveListConfirm(false)}
      />
    </>
  );
};
