// ============================================================
// VisualDataEditor — ویرایشگر بصریِ داده‌های یک گروه آموزشی (نسخهٔ نهایی):
// خودِ بومِ واقعی Page Builder (Canvas.tsx) در «حالت محدود» رندر می‌شود — همان چیدمان/استایلی
// که طراح ساخته، بدون امکان تغییر ساختار (drag/افزودن/حذف/جابه‌جایی بلوک) و شبیه خروجی واقعی
// سایت (بدون خط‌چین/دستگیرهٔ جابه‌جایی). فقط کنار بخش‌های داده‌محور یک آیکون ویرایش کوچک
// دیده می‌شود؛ کلیک روی آن یا یک پاپ‌آور کوچک کنار همان بلوک (برای فیلدهای متنی) یا یک دیالوگ
// کامل (برای فهرست رکوردها: رشته‌ها/مدرسان/فایل‌ها/دستهٔ خبری) باز می‌کند.
//
// این کامپوننت فقط orchestration است — دادهٔ گروه (hooks/useDepartmentVisualData)، فهرست
// اساتید (hooks/useInstructorPool) و تعامل با بومِ ویرایشگر (hooks/useCanvasSelection) هرکدام
// در هوکِ خودشان، و رندر/دیالوگ‌ها در components/ زندگی می‌کنند.
// ============================================================

import React, { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { DEFAULT_GLOBAL_STYLES } from '../page-builder/builderTypes';
import ToastNotification from '@/src/shared-components/ToastNotification';
import MediaManager from '@/src/shared-components/MediaManager';
import LinkLayoutDialog from '../dedicated_pages/LinkLayoutDialog';
import { ConfirmDialog } from '@/src/shared-components/ConfirmDialog';
import ContentPopover from './components/ContentPopover';
import DeptSectionRenderer from './components/DeptSectionRenderer';
import FieldsDialog from './components/FieldsDialog';
import FilesDialog from './components/FilesDialog';
import InstructorsDialog from './components/InstructorsDialog';
import NewsCategoryDialog from './components/NewsCategoryDialog';
import SlugDialog from './components/SlugDialog';
import VisualEditorHeader from './components/VisualEditorHeader';
import { IMAGE_TOKEN_MAP } from './constants/tokenMap';
import { useCanvasSelection } from './hooks/useCanvasSelection';
import { useDepartmentVisualData } from './hooks/useDepartmentVisualData';
import { useInstructorPool } from './hooks/useInstructorPool';
import type { VisualDataEditorProps } from './types';

export default function VisualDataEditor({ departmentId, onBack, onSaved, onUseFlatForm, onOpenTab, canApprove = false }: VisualDataEditorProps) {
  const data = useDepartmentVisualData(departmentId, { canApprove, onSaved });
  const instructorPool = useInstructorPool({ onError: (msg) => data.setToast({ text: msg, type: 'error' }) });
  const canvas = useCanvasSelection(data.layoutSchema, {
    onOpenInstructors: () => { instructorPool.resetSearch(); instructorPool.ensureLoaded(); },
    onCloseDialog: () => instructorPool.resetSearch(),
  });

  // قالب هربار که واقعاً از سرور تازه بارگذاری می‌شود (بارگذاری اولیه یا بعد از اتصال قالب
  // جدید) یک شیء جدید است — انتخاب فعلیِ بوم را پاک می‌کند چون widgetId ممکن است در قالب
  // جدید دیگر معتبر نباشد.
  useEffect(() => {
    canvas.setSelectedWidgetId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.layoutSchema]);

  // ===== دیالوگ اتصال/تغییر قالب Page-Builder =====
  const [showLayoutDialog, setShowLayoutDialog] = useState(false);

  // ===== دیالوگ تنظیمات نشانی (slug) =====
  const [showSlugDialog, setShowSlugDialog] = useState(false);

  // ===== انتخاب فایل اطلاعاتی گروه از رسانه — pendingFileIndex مشخص می‌کند کدام ردیف =====
  const [showFileMediaSelector, setShowFileMediaSelector] = useState(false);
  const [pendingFileIndex, setPendingFileIndex] = useState<number | null>(null);

  const handleBack = () => {
    if (data.isDirty) {
      data.setShowLeaveConfirm(true);
      return;
    }
    onBack();
  };

  const handleSaveSlug = async (slug: string) => {
    const ok = await data.saveSlug(slug);
    if (ok) setShowSlugDialog(false);
  };

  if (data.loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!data.department) return null;

  const globalStyles = data.layoutSchema?.globalStyles || DEFAULT_GLOBAL_STYLES;
  const resolvedInstructors = instructorPool.pool.filter((p) => data.instructorIds.includes(p.id));

  return (
    <div className="flex flex-col h-full">
      <ToastNotification toast={data.toast} />

      <VisualEditorHeader
        departmentName={data.department.name}
        layoutLinked={data.layoutLinked}
        canApprove={canApprove}
        statusChoice={data.statusChoice}
        saving={data.saving}
        saveSuccess={data.saveSuccess}
        onBack={handleBack}
        onOpenSlugDialog={() => setShowSlugDialog(true)}
        onOpenLayoutDialog={() => setShowLayoutDialog(true)}
        onUseFlatForm={onUseFlatForm}
        onToggleStatus={() => data.setStatusChoice((s) => (s === 'published' ? 'draft' : 'published'))}
        onSave={data.handleSave}
      />

      {!data.layoutLinked || !data.layoutSchema ? (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-5 flex items-start gap-3 m-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-black text-amber-800 dark:text-amber-300">هنوز قالبی برای صفحهٔ گروه‌های آموزشی متصل نشده</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              می‌توانید از دکمهٔ اتصال قالب یک صفحهٔ Page Builder را طراحی/انتخاب کنید، یا فعلاً از «فرم کامل» برای ثبت اطلاعات استفاده کنید.
            </p>
          </div>
        </div>
      ) : (
        <div
          ref={canvas.contentWrapRef}
          className="flex-1 min-h-0 overflow-y-auto"
          style={{
            fontFamily: globalStyles.fontFamily,
            color: globalStyles.textColor,
            backgroundColor: globalStyles.backgroundColor || undefined
          }}
        >
          {data.layoutSchema.sections.map((sec) => (
            <DeptSectionRenderer
              key={sec.id}
              section={sec}
              depth={0}
              variables={data.variables}
              newsCategoryId={data.newsCategoryId}
              pageSlug={data.department?.slug}
              fieldsList={data.fieldsList}
              resolvedInstructors={resolvedInstructors}
              filesList={data.filesList}
              onEditWidgetClick={canvas.handleWidgetEditClick}
              onEditSectionBackground={canvas.handleEditSectionBackground}
            />
          ))}
        </div>
      )}

      {canvas.popoverPos && canvas.selectedWidget && (
        <ContentPopover
          position={canvas.popoverPos}
          widget={canvas.selectedWidget}
          scalarForm={data.scalarForm}
          onChange={data.handleScalarChange}
          onClose={canvas.closePopover}
          popoverRef={canvas.popoverRef}
        />
      )}

      <FieldsDialog
        open={canvas.activeDialog === 'fields'}
        fields={data.fieldsList}
        onChange={data.handleFieldChange}
        onCreate={data.handleCreateField}
        onDelete={data.handleDeleteField}
        onClose={canvas.closeDialog}
      />

      <InstructorsDialog
        open={canvas.activeDialog === 'instructors'}
        loading={instructorPool.loading}
        pool={instructorPool.pool}
        filteredPool={instructorPool.filteredPool}
        search={instructorPool.search}
        onSearchChange={instructorPool.setSearch}
        selectedIds={data.instructorIds}
        onToggle={data.handleToggleInstructor}
        onClose={canvas.closeDialog}
      />

      <FilesDialog
        open={canvas.activeDialog === 'files'}
        files={data.filesList}
        onChange={data.handleFileChange}
        onCreate={data.handleCreateFile}
        onDelete={data.handleDeleteFile}
        onPickMedia={(i) => { setPendingFileIndex(i); setShowFileMediaSelector(true); }}
        onClose={canvas.closeDialog}
      />

      <NewsCategoryDialog
        open={canvas.activeDialog === 'news'}
        categories={data.newsCategories}
        selectedId={data.newsCategoryId}
        onSelect={(id) => { data.setNewsCategoryId(id); canvas.closeDialog(); }}
        onClose={canvas.closeDialog}
      />

      <SlugDialog
        open={showSlugDialog}
        initialSlug={data.department.slug || ''}
        saving={data.savingSlug}
        onClose={() => setShowSlugDialog(false)}
        onSave={handleSaveSlug}
      />

      {showLayoutDialog && (
        <LinkLayoutDialog
          pageType="academic_department"
          pageTypeLabel="گروه آموزشی"
          onClose={() => { setShowLayoutDialog(false); data.reload(); }}
          onOpenBuilder={(smartPageId) => {
            setShowLayoutDialog(false);
            onOpenTab?.('page-builder', 'صفحه‌ساز هوشمند', 'LayoutTemplate', false, { initialPageId: smartPageId });
          }}
        />
      )}

      <MediaManager
        open={canvas.showMediaSelector}
        filter="image"
        onClose={canvas.closeMediaSelector}
        onSelect={(url) => {
          const stateKey = canvas.pendingImageToken ? IMAGE_TOKEN_MAP[canvas.pendingImageToken]?.stateKey : null;
          if (stateKey === 'headImageUrl') data.setHeadImageUrl(url);
          else if (stateKey === 'expertImageUrl') data.setExpertImageUrl(url);
          else if (stateKey === 'bannerImageUrl') data.setBannerImageUrl(url);
          else data.setImageUrl(url);
          canvas.closeMediaSelector();
        }}
      />

      <MediaManager
        open={showFileMediaSelector}
        filter="all"
        onClose={() => { setShowFileMediaSelector(false); setPendingFileIndex(null); }}
        onSelect={(url, mediaFile) => {
          if (pendingFileIndex !== null) {
            const autoTitle = data.filesList[pendingFileIndex]?.title;
            data.handleFileChange(pendingFileIndex, {
              url,
              title: autoTitle || mediaFile?.title || mediaFile?.name || url.split('/').pop() || 'فایل',
            });
          }
          setShowFileMediaSelector(false);
          setPendingFileIndex(null);
        }}
      />

      <ConfirmDialog
        open={data.showLeaveConfirm}
        title="تغییرات ذخیره نشده"
        message="تغییرات این گروه هنوز ذخیره نشده‌اند. آیا می‌خواهید بدون ذخیره خارج شوید؟"
        confirmLabel="خروج بدون ذخیره"
        cancelLabel="ادامه ویرایش"
        danger={false}
        onConfirm={() => { data.setShowLeaveConfirm(false); onBack(); }}
        onCancel={() => data.setShowLeaveConfirm(false)}
      />
    </div>
  );
}
