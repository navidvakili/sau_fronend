// ============================================================
// useDepartmentVisualData — بارگذاری/ذخیرهٔ همهٔ دادهٔ یک گروه آموزشی برای ویرایشگر بصری:
// خودِ رکورد گروه (فیلدهای اسکالر + تصاویر + مدرسان منتخب + دستهٔ خبری + وضعیت انتشار)،
// قالب Page-Builder متصل، رشته‌های تحصیلی و فایل‌های اطلاعاتیِ زیرمجموعه، و ردیابیِ
// تغییرات ذخیره‌نشده (dirty). فیلدهای متنی/تصویری همان چیزی هستند که در toast/handleSave
// نهایی به‌صورت دسته‌ای (batch) ذخیره می‌شوند؛ رشته‌ها و فایل‌ها بخشی‌شان (افزودن/حذف) بلافاصله
// از طریق API واقعیِ خودشان انجام می‌شود.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import type { AcademicDepartmentItem, AcademicFieldItem, InfoFileItem, NewsCategory } from '@/src/shared-types';
import { useLanguage } from '@/src/shared-utils/LanguageContext';
import {
  createDepartmentFile,
  deleteDepartmentFile,
  fetchDepartmentById,
  updateDepartment,
  updateDepartmentFile,
} from '../api';
import { createField, deleteField, fetchFields, updateField } from '../../fields/api';
import { fetchCategories } from '../../news/api';
import { fetchSmartPage, getSmartPageForDedicatedPageType } from '../../page-builder/api';
import type { SmartPageSchema } from '../../page-builder/builderTypes';
import { EMPTY_SCALAR_FORM, IMAGE_TOKEN_MAP, TOKEN_FIELD_MAP } from '../constants/tokenMap';

export type ToastState = { text: string; type: 'success' | 'error' } | null;

interface UseDepartmentVisualDataOptions {
  canApprove: boolean;
  onSaved: () => void;
}

export function useDepartmentVisualData(departmentId: number, options: UseDepartmentVisualDataOptions) {
  const { canApprove, onSaved } = options;
  const { currentLang } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [department, setDepartment] = useState<AcademicDepartmentItem | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  // ===== قالب لایوت متصل (اگر باشد) =====
  const [layoutLinked, setLayoutLinked] = useState(false);
  const [layoutSchema, setLayoutSchema] = useState<SmartPageSchema | null>(null);

  // ===== دادهٔ اسکالر گروه =====
  const [scalarForm, setScalarForm] = useState<Record<string, string>>(EMPTY_SCALAR_FORM);
  const [imageUrl, setImageUrl] = useState('');
  const [headImageUrl, setHeadImageUrl] = useState('');
  const [expertImageUrl, setExpertImageUrl] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [instructorIds, setInstructorIds] = useState<number[]>([]);
  const [fieldsList, setFieldsList] = useState<AcademicFieldItem[]>([]);
  const [filesList, setFilesList] = useState<InfoFileItem[]>([]);
  const [newsCategoryId, setNewsCategoryId] = useState<number | null>(null);
  const [newsCategories, setNewsCategories] = useState<NewsCategory[]>([]);
  const [statusChoice, setStatusChoice] = useState<'published' | 'draft'>('draft');

  // ===== دیالوگ تنظیمات نشانی (slug) =====
  const [savingSlug, setSavingSlug] = useState(false);

  // ===== هشدار خروج بدون ذخیره — همانند صفحه‌ساز =====
  const [isDirty, setIsDirty] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const skipDirtyRef = useRef(true);

  const load = async () => {
    setLoading(true);
    try {
      const dept = await fetchDepartmentById(departmentId);
      setDepartment(dept);
      setScalarForm({
        name: dept.name || '', faculty: dept.faculty || '', description: dept.description || '',
        head_name: dept.headName || '', head_title: dept.headTitle || '', head_phone: dept.headPhone || '',
        head_internal: dept.headInternal || '', head_email: dept.headEmail || '',
        expert_name: dept.expertName || '', expert_phone: dept.expertPhone || '', expert_internal: dept.expertInternal || '',
        expert_email: dept.expertEmail || '', office: dept.office || '', email: dept.email || '', phone: dept.phone || '',
      });
      setImageUrl(dept.image_url || '');
      setHeadImageUrl(dept.headImageUrl || '');
      setExpertImageUrl(dept.expertImageUrl || '');
      setBannerImageUrl(dept.bannerImageUrl || '');
      setInstructorIds((dept.instructors || []).map((i) => i.id));
      setFilesList(dept.infoFiles || []);
      setNewsCategoryId(dept.newsCategoryId ?? null);
      setStatusChoice(dept.status || 'draft');

      const linkedLayout = await getSmartPageForDedicatedPageType('academic_department');
      if (linkedLayout && linkedLayout.status === 'published') {
        const full = await fetchSmartPage(linkedLayout.id);
        const schema = (full.schema ?? {}) as unknown as SmartPageSchema;
        const merged: SmartPageSchema = {
          ...schema,
          id: `page-${full.id}`,
          title: full.title ?? schema.title ?? 'قالب گروه آموزشی',
          slug: full.slug ?? schema.slug,
          status: full.status ?? schema.status ?? 'draft',
        };
        setLayoutSchema(merged);
        setLayoutLinked(true);
      } else {
        setLayoutSchema(null);
        setLayoutLinked(false);
      }

      const [fields, categories] = await Promise.all([
        fetchFields({ department_id: departmentId, per_page: 200 }),
        fetchCategories(currentLang).catch(() => ({ data: [] as NewsCategory[] })),
      ]);
      setFieldsList(fields.data || []);
      setNewsCategories(categories.data || []);
      skipDirtyRef.current = true;
      setIsDirty(false);
    } catch (err: any) {
      setToast({ text: err.message || 'خطا در بارگذاری اطلاعات گروه', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [departmentId]);

  // ردیابی تغییرات ذخیره‌نشده — هر تغییری در دادهٔ اسکالر/تصاویر/مدرسان/رشته‌ها/فایل‌ها/دستهٔ
  // خبری/وضعیت انتشار، بعد از بارگذاری اولیه، dirty را true می‌کند؛ با ذخیره یا بارگذاری مجدد ریست می‌شود
  useEffect(() => {
    if (skipDirtyRef.current) { skipDirtyRef.current = false; return; }
    setIsDirty(true);
  }, [scalarForm, imageUrl, headImageUrl, expertImageUrl, bannerImageUrl, instructorIds, fieldsList, filesList, newsCategoryId, statusChoice]);

  const variables = useMemo(
    () => {
      const imageValues: Record<string, string> = { imageUrl, headImageUrl, expertImageUrl, bannerImageUrl };
      return {
        ...Object.fromEntries(Object.entries(TOKEN_FIELD_MAP).map(([token, meta]) => [token, scalarForm[meta.formKey] || ''])),
        ...Object.fromEntries(Object.entries(IMAGE_TOKEN_MAP).map(([token, meta]) => [token, imageValues[meta.stateKey] || ''])),
      };
    },
    [scalarForm, imageUrl, headImageUrl, expertImageUrl, bannerImageUrl]
  );

  // ===== رشته‌های تحصیلی — افزودن/حذف بلافاصله API واقعی؛ ویرایش نام/مدیر در «ذخیره» دسته‌ای =====
  const handleFieldChange = (id: number, patch: Partial<AcademicFieldItem>) => {
    setFieldsList((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };
  const handleCreateField = async () => {
    try {
      const res = await createField({ department_id: departmentId, name: 'رشتهٔ جدید', status: 'published' });
      setFieldsList((prev) => [...prev, res.data]);
    } catch (err: any) {
      setToast({ text: err.message || 'خطا در افزودن رشته', type: 'error' });
    }
  };
  const handleDeleteField = async (id: number) => {
    try {
      await deleteField(id);
      setFieldsList((prev) => prev.filter((f) => f.id !== id));
    } catch (err: any) {
      setToast({ text: err.message || 'خطا در حذف رشته', type: 'error' });
    }
  };

  // ===== فایل‌های اطلاعاتی — همان الگو (academic_department_files، رکورد واقعی) =====
  const handleFileChange = (index: number, patch: Partial<InfoFileItem>) => {
    setFilesList((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };
  const handleCreateFile = async () => {
    try {
      const res = await createDepartmentFile({ department_id: departmentId, title: 'فایل جدید', url: '#' });
      setFilesList((prev) => [...prev, { id: res.data.id, title: res.data.title || '', url: res.data.url }]);
    } catch (err: any) {
      setToast({ text: err.message || 'خطا در افزودن فایل', type: 'error' });
    }
  };
  const handleDeleteFile = async (index: number) => {
    const file = filesList[index];
    if (!file) return;
    try {
      if (file.id) await deleteDepartmentFile(file.id);
      setFilesList((prev) => prev.filter((_, i) => i !== index));
    } catch (err: any) {
      setToast({ text: err.message || 'خطا در حذف فایل', type: 'error' });
    }
  };

  const handleToggleInstructor = (id: number) => {
    setInstructorIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleScalarChange = (formKey: string, value: string) => {
    setScalarForm((prev) => ({ ...prev, [formKey]: value }));
  };

  /** ذخیرهٔ نشانیِ (slug) صفحهٔ عمومی گروه. خروجی: موفقیت‌آمیز بود یا نه — دیالوگ فراخوان با
   *  true آن را می‌بندد. */
  const saveSlug = async (rawSlug: string): Promise<boolean> => {
    const trimmed = rawSlug.trim();
    if (!trimmed) {
      setToast({ text: 'نشانی صفحه نمی‌تواند خالی باشد.', type: 'error' });
      return false;
    }
    setSavingSlug(true);
    try {
      const res = await updateDepartment(departmentId, {
        name: scalarForm.name,
        slug: trimmed,
        status: department?.status || 'draft',
      });
      setDepartment(res.data);
      setToast({ text: 'نشانی صفحهٔ گروه به‌روزرسانی شد.', type: 'success' });
      return true;
    } catch (err: any) {
      setToast({ text: err.message || 'خطا در تغییر نشانی', type: 'error' });
      return false;
    } finally {
      setSavingSlug(false);
    }
  };

  /** ذخیرهٔ همهٔ تغییرات — فیلدهای اسکالر گروه از طریق updateDepartment، رشته‌ها و فایل‌ها
   *  هرکدام از طریق APIِ رکورد واقعی خودشان — طبق تصمیم «انتشار فوری»، اگر گروه از قبل
   *  published باشد این بلافاصله روی سایت عمومی هم اثر می‌گذارد. */
  const handleSave = async () => {
    setSaving(true);
    try {
      // بدون مجوز انتشار (departments.approve)، وضعیت همیشه پیش‌نویس ذخیره می‌شود —
      // دقیقاً همان قاعده‌ای که فرم تخت هم رعایت می‌کند
      const finalStatus: 'published' | 'draft' = canApprove ? statusChoice : 'draft';
      const res = await updateDepartment(departmentId, {
        name: scalarForm.name,
        faculty: scalarForm.faculty || null,
        description: scalarForm.description || null,
        head_name: scalarForm.head_name || null,
        head_title: scalarForm.head_title || null,
        head_phone: scalarForm.head_phone || null,
        head_internal: scalarForm.head_internal || null,
        head_email: scalarForm.head_email || null,
        expert_name: scalarForm.expert_name || null,
        expert_phone: scalarForm.expert_phone || null,
        expert_internal: scalarForm.expert_internal || null,
        expert_email: scalarForm.expert_email || null,
        office: scalarForm.office || null,
        email: scalarForm.email || null,
        phone: scalarForm.phone || null,
        image_url: imageUrl || null,
        head_image_url: headImageUrl || null,
        expert_image_url: expertImageUrl || null,
        banner_image_url: bannerImageUrl || null,
        instructor_ids: instructorIds,
        news_category_id: newsCategoryId,
        status: finalStatus,
      });

      // فایل‌هایی که هنوز آدرس واقعی ندارند (مثلاً «افزودن فایل» زده شده ولی هنوز از رسانه
      // انتخاب نشده) نباید کل ذخیره را با خطای اعتبارسنجی/دیتابیس متوقف کنند — نادیده گرفته
      // می‌شوند و کاربر با پیامی مطلع می‌شود تا برایشان فایل انتخاب یا حذفشان کند
      const incompleteFiles = filesList.filter((f) => !f.url || !f.url.trim());
      const completeFiles = filesList.filter((f) => f.url && f.url.trim());

      await Promise.all([
        ...fieldsList.map((f) =>
          updateField(f.id, {
            name: f.name,
            department_id: departmentId,
            manager_name: f.managerName || null,
            manager_phone: f.managerPhone || null,
            manager_internal: f.managerInternal || null,
            status: f.status,
          })
        ),
        ...completeFiles.map((f) => (f.id ? updateDepartmentFile(f.id, { title: f.title, url: f.url }) : Promise.resolve())),
      ]);

      skipDirtyRef.current = true;
      setDepartment(res.data);
      setStatusChoice(res.data.status || 'draft');
      setIsDirty(false);
      setToast(
        incompleteFiles.length > 0
          ? { text: `اطلاعات گروه ذخیره شد. ${incompleteFiles.length} فایل بدون آدرس نادیده گرفته شد — برایشان از رسانه فایل انتخاب کنید یا حذفشان کنید.`, type: 'error' }
          : { text: 'اطلاعات گروه با موفقیت ذخیره شد.', type: 'success' }
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onSaved();
    } catch (err: any) {
      setToast({ text: err.message || 'خطا در ذخیرهٔ اطلاعات', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    saveSuccess,
    isDirty,
    showLeaveConfirm,
    setShowLeaveConfirm,
    department,
    toast,
    setToast,
    layoutLinked,
    layoutSchema,
    reload: load,

    scalarForm,
    imageUrl, setImageUrl,
    headImageUrl, setHeadImageUrl,
    expertImageUrl, setExpertImageUrl,
    bannerImageUrl, setBannerImageUrl,
    instructorIds,
    fieldsList,
    filesList,
    newsCategoryId, setNewsCategoryId,
    newsCategories,
    statusChoice, setStatusChoice,
    savingSlug,
    variables,

    handleScalarChange,
    handleToggleInstructor,
    handleFieldChange,
    handleCreateField,
    handleDeleteField,
    handleFileChange,
    handleCreateFile,
    handleDeleteFile,
    handleSave,
    saveSlug,
  };
}
