// ============================================================
// DepartmentsManagement — سیستم مدیریت گروه‌های آموزشی
// شامل: معرفی مدیر گروه، کارشناس، فایل‌های اطلاعاتی،
// مدرسان گروه (از میان اعضای هیات علمی و اساتید مدعو)
// و رشته‌های تحصیلی زیرمجموعه
// در سایت عمومی (sau public) نمایش داده می‌شوند
// ============================================================

import { useState, useEffect, useCallback, type FormEvent, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2, Plus, Search, Edit3, Trash2, Image as ImageIcon,
  Send, Loader2, X, CheckCircle2, AlertCircle, Globe,
  GraduationCap, Phone, Mail, FileText, UserRound, BookOpen, Users,
  ChevronRight, ChevronLeft, LayoutTemplate,
} from 'lucide-react';
import type {
  AcademicDepartmentItem, AcademicDepartmentPayload, InfoFileItem,
  DepartmentInstructor, DepartmentField, PersonItem, NewsCategory,
} from '@/src/shared-types';
import ToastNotification from '@/src/shared-components/ToastNotification';
import MediaManager from '@/src/shared-components/MediaManager';
import { fetchDepartments, fetchDepartmentById, createDepartment, updateDepartment, deleteDepartment } from './api';
import { fetchPeople } from '../people/api';
import { fetchCategories } from '../news/api';
import LinkLayoutDialog from '../dedicated_pages/LinkLayoutDialog';
import QuickCreateDialog from './QuickCreateDialog';
import VisualDataEditor from './VisualDataEditor';
import { useAppPermissions } from '@/src/shared-utils/PermissionsContext';
import { useLanguage } from '@/src/shared-utils/LanguageContext';

interface DepartmentsManagementProps {
  user?: any;
  activeTabId?: string;
  moduleId?: string;
  onOpenTab?: (id: string, title: string, iconName: string, forceNewInstance?: boolean, initialProps?: Record<string, any>) => void;
}

type SubTab = 'list' | 'editor' | 'visual';

const inputCls = 'w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50';

export default function DepartmentsManagement({ user, onOpenTab }: DepartmentsManagementProps) {
  const { can } = useAppPermissions();
  const { currentLang, getLanguage } = useLanguage();
  const activeLanguage = getLanguage(currentLang);
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('support');
  const isEditor = user?.roles?.includes('editor');
  const roleCanEdit = isAdmin || isEditor;
  const permCanEdit = can('departments.create') || can('departments.edit');
  const permCanDelete = can('departments.delete');
  const canApprove = can('departments.approve') || isAdmin;
  const canEdit = roleCanEdit || permCanEdit;
  const canDelete = roleCanEdit || permCanDelete;

  // ===== Sub-tab state =====
  const [activeTab, setActiveTab] = useState<SubTab>('list');

  // ===== Data state =====
  const [departments, setDepartments] = useState<AcademicDepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ===== Filter state =====
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // ===== Editor State =====
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formFaculty, setFormFaculty] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formHeadName, setFormHeadName] = useState('');
  const [formHeadTitle, setFormHeadTitle] = useState('');
  const [formHeadPhone, setFormHeadPhone] = useState('');
  const [formHeadInternal, setFormHeadInternal] = useState('');
  const [formHeadEmail, setFormHeadEmail] = useState('');
  const [formExpertName, setFormExpertName] = useState('');
  const [formExpertPhone, setFormExpertPhone] = useState('');
  const [formExpertInternal, setFormExpertInternal] = useState('');
  const [formExpertEmail, setFormExpertEmail] = useState('');
  const [formOffice, setFormOffice] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formInfoFiles, setFormInfoFiles] = useState<Array<{ id?: number; title: string; url: string }>>([]);
  const [formNewsCategoryId, setFormNewsCategoryId] = useState<string>('');
  const [formInstructorIds, setFormInstructorIds] = useState<number[]>([]);
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('published');
  const [formSubFields, setFormSubFields] = useState<DepartmentField[]>([]);

  // ===== News categories (for "دستهٔ خبری گروه") =====
  const [newsCategories, setNewsCategories] = useState<NewsCategory[]>([]);
  useEffect(() => {
    fetchCategories(currentLang).then(res => setNewsCategories(res.data || [])).catch(() => {});
  }, [currentLang]);

  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [formMessage, setFormMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // ===== Instructor pool (faculty_member + visiting_professor) =====
  const [instructorPool, setInstructorPool] = useState<PersonItem[]>([]);
  const [poolLoading, setPoolLoading] = useState(false);

  // ===== Toast state =====
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ===== Delete Confirmation state =====
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // ===== Page Builder layout link dialog (قالب پویای صفحهٔ گروه آموزشی) =====
  const [showLayoutDialog, setShowLayoutDialog] = useState(false);

  // ===== دیالوگ ایجاد سریع + ویرایشگر بصری =====
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [visualDepartmentId, setVisualDepartmentId] = useState<number | null>(null);

  // ===== Metrics =====
  const publishedCount = departments.filter(d => d.status === 'published').length;
  const draftCount = departments.filter(d => d.status === 'draft').length;

  // ===== Fetch data =====
  const loadDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page: currentPage, per_page: 15, lang: currentLang };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await fetchDepartments(params);
      setDepartments(data.data);
      setTotal(data.total);
      setTotalPages(data.last_page || 1);
    } catch (err: any) {
      console.error('Error loading departments:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, currentLang]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  // Reset to first page whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, currentLang]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => loadDepartments(), 400);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter]);

  const getPageNumbers = (current: number, total: number): (number | 'ellipsis')[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | 'ellipsis')[] = [1];
    if (current > 3) pages.push('ellipsis');
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push('ellipsis');
    if (total > 1) pages.push(total);
    return pages;
  };

  // ===== Load instructor pool when the editor opens =====
  const loadInstructorPool = useCallback(async () => {
    setPoolLoading(true);
    try {
      const [faculty, visiting] = await Promise.all([
        fetchPeople({ type: 'faculty_member', per_page: 500, lang: currentLang }),
        fetchPeople({ type: 'visiting_professor', per_page: 500, lang: currentLang }),
      ]);
      const seen = new Set<number>();
      const merged: PersonItem[] = [];
      [...(faculty?.data || []), ...(visiting?.data || [])].forEach(p => {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          merged.push(p);
        }
      });
      setInstructorPool(merged);
    } catch (err: any) {
      console.error('Error loading instructor pool:', err);
    } finally {
      setPoolLoading(false);
    }
  }, [currentLang]);

  // ===== Handlers =====
  const openFlatFormForId = async (id: number) => {
    setFormMessage(null);
    setActiveTab('editor');
    setFormLoading(true);
    try {
      const detail = await fetchDepartmentById(id);
      fillForm(detail);
    } catch (err: any) {
      showToast(err.message || 'خطا در بارگذاری جزئیات گروه آموزشی', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const fillForm = (d: AcademicDepartmentItem) => {
    setEditingId(d.id);
    setFormName(d.name || '');
    setFormFaculty(d.faculty || '');
    setFormDescription(d.description || '');
    setFormHeadName(d.headName || '');
    setFormHeadTitle(d.headTitle || '');
    setFormHeadPhone(d.headPhone || '');
    setFormHeadInternal(d.headInternal || '');
    setFormHeadEmail(d.headEmail || '');
    setFormExpertName(d.expertName || '');
    setFormExpertPhone(d.expertPhone || '');
    setFormExpertInternal(d.expertInternal || '');
    setFormExpertEmail(d.expertEmail || '');
    setFormOffice(d.office || '');
    setFormEmail(d.email || '');
    setFormPhone(d.phone || '');
    setFormImageUrl(d.image_url || '');
    setFormInfoFiles((d.infoFiles || []).map(f => ({ id: f.id, title: f.title || '', url: f.url || '' })));
    setFormNewsCategoryId(d.newsCategoryId ? String(d.newsCategoryId) : '');
    setFormInstructorIds((d.instructors || []).map(i => i.id));
    setFormStatus(d.status);
    setFormSubFields(d.fields || []);
    loadInstructorPool();
  };

  const handleResetForm = () => {
    setEditingId(null);
    setFormName(''); setFormFaculty(''); setFormDescription('');
    setFormHeadName(''); setFormHeadTitle(''); setFormHeadPhone(''); setFormHeadInternal(''); setFormHeadEmail('');
    setFormExpertName(''); setFormExpertPhone(''); setFormExpertInternal(''); setFormExpertEmail('');
    setFormOffice(''); setFormEmail(''); setFormPhone(''); setFormImageUrl('');
    setFormInfoFiles([]); setFormNewsCategoryId(''); setFormInstructorIds([]); setFormStatus('published'); setFormSubFields([]);
    setFormMessage(null);
  };

  const buildPayload = (): AcademicDepartmentPayload => {
    return {
      name: formName,
      lang: currentLang,
      faculty: formFaculty || null,
      description: formDescription || null,
      head_name: formHeadName || null,
      head_title: formHeadTitle || null,
      head_phone: formHeadPhone || null,
      head_internal: formHeadInternal || null,
      head_email: formHeadEmail || null,
      expert_name: formExpertName || null,
      expert_phone: formExpertPhone || null,
      expert_internal: formExpertInternal || null,
      expert_email: formExpertEmail || null,
      office: formOffice || null,
      email: formEmail || null,
      phone: formPhone || null,
      image_url: formImageUrl || null,
      info_files: formInfoFiles.filter(f => f.title || f.url).map(f => ({ id: f.id, title: f.title, url: f.url })),
      news_category_id: formNewsCategoryId ? Number(formNewsCategoryId) : null,
      instructor_ids: formInstructorIds,
      status: formStatus,
    };
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormMessage({ text: 'لطفاً نام گروه آموزشی را وارد نمایید.', type: 'error' });
      return;
    }
    setFormLoading(true);
    try {
      const finalStatus: 'published' | 'draft' = canApprove ? formStatus : 'draft';
      const payload = { ...buildPayload(), status: finalStatus } as AcademicDepartmentPayload;

      if (editingId) {
        await updateDepartment(editingId, payload);
        setFormMessage({ text: 'تغییرات گروه آموزشی با موفقیت ذخیره گردید.', type: 'success' });
      } else {
        await createDepartment(payload);
        setFormMessage({ text: 'گروه آموزشی جدید با موفقیت ثبت شد.', type: 'success' });
      }

      setTimeout(() => {
        setActiveTab('list');
        handleResetForm();
        loadDepartments();
      }, 1200);
    } catch (err: any) {
      if (err.errors) {
        const firstErr = Object.values(err.errors).flat()[0];
        setFormMessage({ text: firstErr as string, type: 'error' });
      } else {
        setFormMessage({ text: err.message || 'خطا در ذخیره گروه آموزشی', type: 'error' });
      }
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDepartment(deleteId);
      setDepartments(prev => prev.filter(d => d.id !== deleteId));
      showToast('گروه آموزشی با موفقیت حذف شد.', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در حذف گروه آموزشی', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const toggleInstructor = (id: number) => {
    setFormInstructorIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const instructorName = (p: PersonItem) =>
    [p.title, p.firstName, p.lastName].filter(Boolean).join(' ') || `#${p.id}`;

  return (
    <div className="space-y-6 pb-12 font-sans text-right rtl">
      {/* ===== Module Header — هم‌سبک هدر صفحه‌ساز (page-builder) — فقط در فهرست؛ فرم ویرایش و
          ویرایشگر بصری هرکدام هدر مستقل خودشان را دارند (برای جلوگیری از دو هدر هم‌زمان) ===== */}
      {activeTab === 'list' && (
      <header className="h-16 px-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-xs rounded-2xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-slate-900 dark:text-white truncate">مدیریت گروه‌های آموزشی</h1>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 flex-wrap">
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                {total} گروه
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold border border-teal-500/20">
                {publishedCount} منتشر شده
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                {draftCount} پیش‌نویس
              </span>
              {activeLanguage && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-500/10 text-slate-500 dark:text-slate-400 font-bold border border-slate-500/20 uppercase">
                  <Globe className="w-3 h-3" />
                  {activeLanguage.code}
                </span>
              )}
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowLayoutDialog(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              title="اتصال قالب Page Builder"
            >
              <LayoutTemplate className="w-4 h-4 text-indigo-500" />
              <span>اتصال قالب</span>
            </button>
            <button
              onClick={() => setShowQuickCreate(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 text-white dark:text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت گروه جدید</span>
            </button>
          </div>
        )}
      </header>
      )}

      <ToastNotification toast={toast} />

      {/* ===== List View ===== */}
      {activeTab === 'list' && (
        <div className="space-y-5">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-[#161618] rounded-2xl p-4 border border-gray-100 dark:border-white/10 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در نام گروه، دانشکده، مدیر گروه یا کارشناس..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'published', 'draft'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-emerald-500 text-emerald-950 shadow'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                >
                  {st === 'all' ? 'همه' : st === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
            </div>
          ) : departments.length === 0 ? (
            <div className="bg-white dark:bg-[#161618] rounded-3xl border border-gray-100 dark:border-white/10 p-16 text-center">
              <Building2 className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
                گروه آموزشی‌ای یافت نشد
              </h3>
              <p className="text-sm text-gray-400 mb-6">برای شروع، اولین گروه آموزشی را ثبت کنید.</p>
              {canEdit && (
                <button
                  onClick={() => setShowQuickCreate(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-emerald-950 font-black text-xs hover:bg-emerald-400 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  ثبت گروه جدید
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {departments.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-3xl overflow-hidden bg-white dark:bg-[#161618] border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Image */}
                  <div className="relative h-44 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-slate-800 to-indigo-950 flex items-center justify-center">
                        <div className="bg-emerald-500/20 backdrop-blur-md w-14 h-14 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                          <Building2 className="w-7 h-7" />
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                    {/* Status badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black backdrop-blur-md border ${
                        item.status === 'published'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        {item.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                      </span>
                    </div>

                    {/* Type icon over image */}
                    <div className="absolute bottom-3 right-4 bg-emerald-500/20 backdrop-blur-md w-11 h-11 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                      <Building2 className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-base font-black text-gray-900 dark:text-white mb-1.5 leading-tight line-clamp-1">
                      {item.name}
                    </h3>
                    {item.faculty && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-1">{item.faculty}</p>
                    )}

                    <div className="space-y-1.5 my-3">
                      {item.headName && (
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                          <UserRound className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                          <span className="truncate">مدیر گروه: {item.headName}</span>
                        </div>
                      )}
                      {item.expertName && (
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                          <Users className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                          <span className="truncate">کارشناس: {item.expertName}</span>
                        </div>
                      )}
                      {(item.phone || item.email) && (
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                          {item.phone ? <Phone className="w-3.5 h-3.5 shrink-0" /> : <Mail className="w-3.5 h-3.5 shrink-0" />}
                          <span className="truncate">{item.phone || item.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mb-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                        <GraduationCap className="w-3 h-3" />
                        {item.fieldsCount} رشته
                      </span>
                      {(item.infoFiles?.length ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                          <FileText className="w-3 h-3" />
                          {item.infoFiles.length} فایل
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-4">
                      {item.author_name ? `ثبت توسط ${item.author_name}` : item.author_username}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-white/5">
                      {canEdit && (
                        <button
                          onClick={() => { setVisualDepartmentId(item.id); setActiveTab('visual'); }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          ویرایش
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeleteId(item.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          حذف
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {getPageNumbers(currentPage, totalPages).map((page, idx) =>
                page === 'ellipsis' ? (
                  <span key={`e-${idx}`} className="px-1.5 text-gray-400 dark:text-gray-500 text-xs font-bold">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-[32px] px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      page === currentPage
                        ? 'bg-emerald-500 text-emerald-950 shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== Visual Data Editor ===== */}
      {activeTab === 'visual' && visualDepartmentId && (
        <VisualDataEditor
          departmentId={visualDepartmentId}
          onBack={() => { setVisualDepartmentId(null); setActiveTab('list'); loadDepartments(); }}
          onSaved={() => loadDepartments()}
          onUseFlatForm={() => openFlatFormForId(visualDepartmentId)}
          onOpenTab={onOpenTab}
          canApprove={canApprove}
        />
      )}

      {/* ===== Editor View ===== */}
      {activeTab === 'editor' && (
        <form onSubmit={handleSave} className="bg-white dark:bg-[#161618] rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden">
          {/* Editor header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5">
            <h2 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              {editingId ? (
                <>
                  <Edit3 className="w-4 h-4 text-emerald-500" />
                  ویرایش گروه آموزشی
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-emerald-500" />
                  ثبت گروه آموزشی
                </>
              )}
            </h2>
            <button
              type="button"
              onClick={() => { setActiveTab('list'); handleResetForm(); }}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {formMessage && (
              <div className={`px-4 py-3 rounded-2xl text-xs font-bold ${
                formMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
              }`}>
                {formMessage.text}
              </div>
            )}

            {/* Basic info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">
                  نام گروه آموزشی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثلاً گروه مهندسی کامپیوتر"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">دانشکده</label>
                <input
                  type="text"
                  value={formFaculty}
                  onChange={(e) => setFormFaculty(e.target.value)}
                  placeholder="مثلاً دانشکده فنی و مهندسی"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">معرفی گروه</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={4}
                placeholder="شرح مختصری درباره این گروه آموزشی..."
                className={inputCls}
              />
            </div>

            {/* ===== مدیر گروه block ===== */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <UserRound className="w-4 h-4" />
                </div>
                <label className="text-xs font-black text-gray-700 dark:text-gray-200">معرفی مدیر گروه</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">نام مدیر گروه</label>
                  <input type="text" value={formHeadName} onChange={(e) => setFormHeadName(e.target.value)} placeholder="دکتر ..." className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">سمت / عنوان</label>
                  <input type="text" value={formHeadTitle} onChange={(e) => setFormHeadTitle(e.target.value)} placeholder="مدیر گروه" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">ایمیل</label>
                  <input type="email" value={formHeadEmail} onChange={(e) => setFormHeadEmail(e.target.value)} placeholder="head@sau.ac.ir" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">تلفن مدیر گروه</label>
                  <input type="text" value={formHeadPhone} onChange={(e) => setFormHeadPhone(e.target.value)} placeholder="035-3111..." className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">تلفن داخلی مدیر گروه</label>
                  <input type="text" value={formHeadInternal} onChange={(e) => setFormHeadInternal(e.target.value)} placeholder="مثلاً 1234" className={inputCls} />
                </div>
              </div>
            </div>

            {/* ===== کارشناس block ===== */}
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.03] p-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                  <Users className="w-4 h-4" />
                </div>
                <label className="text-xs font-black text-gray-700 dark:text-gray-200">معرفی کارشناس گروه</label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">نام کارشناس</label>
                  <input type="text" value={formExpertName} onChange={(e) => setFormExpertName(e.target.value)} placeholder="مهندس ..." className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">تلفن کارشناس</label>
                  <input type="text" value={formExpertPhone} onChange={(e) => setFormExpertPhone(e.target.value)} placeholder="035-3111..." className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">تلفن داخلی کارشناس</label>
                  <input type="text" value={formExpertInternal} onChange={(e) => setFormExpertInternal(e.target.value)} placeholder="مثلاً 1235" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">ایمیل کارشناس</label>
                  <input type="email" value={formExpertEmail} onChange={(e) => setFormExpertEmail(e.target.value)} placeholder="expert@sau.ac.ir" className={inputCls} />
                </div>
              </div>
            </div>

            {/* ===== Contact ===== */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">ایمیل گروه</label>
                <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="dept@sau.ac.ir" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">تلفن گروه</label>
                <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="035-3111..." className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">دفتر / اتاق</label>
                <input type="text" value={formOffice} onChange={(e) => setFormOffice(e.target.value)} placeholder="اتاق 301" className={inputCls} />
              </div>
            </div>

            {/* ===== Image ===== */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">تصویر گروه</label>
              <div className="flex items-start gap-4">
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 shrink-0">
                  {formImageUrl ? (
                    <img src={formImageUrl} alt="پیش‌نمایش" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300 dark:text-gray-600">
                      <ImageIcon className="w-8 h-8 mb-1" />
                      <span className="text-[10px] font-bold">بدون تصویر</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => setShowMediaSelector(true)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-colors cursor-pointer w-fit"
                  >
                    انتخاب از رسانه
                  </button>
                  {formImageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormImageUrl('')}
                      className="px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-colors cursor-pointer w-fit"
                    >
                      حذف تصویر
                    </button>
                  )}
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="یا آدرس تصویر را وارد کنید..."
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
            </div>

            {/* ===== فایل‌های اطلاعاتی ===== */}
            <div className="rounded-2xl border border-gray-100 dark:border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" />
                  فایل‌های اطلاعاتی
                </label>
                <button
                  type="button"
                  onClick={() => setFormInfoFiles(prev => [...prev, { title: '', url: '' }])}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> افزودن فایل
                </button>
              </div>
              {formInfoFiles.length === 0 && <p className="text-[10px] text-gray-400">موردی ثبت نشده است.</p>}
              {formInfoFiles.map((file, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                  <input
                    type="text"
                    value={file.title}
                    onChange={(e) => { const next = [...formInfoFiles]; next[i] = { ...next[i], title: e.target.value }; setFormInfoFiles(next); }}
                    placeholder="عنوان فایل (مثلاً آیین‌نامه آموزشی)"
                    className="px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={file.url}
                      onChange={(e) => { const next = [...formInfoFiles]; next[i] = { ...next[i], url: e.target.value }; setFormInfoFiles(next); }}
                      placeholder="آدرس فایل (PDF / DOC / ...)"
                      className="flex-1 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <button type="button" onClick={() => setFormInfoFiles(prev => prev.filter((_, idx) => idx !== i))} className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ===== دستهٔ خبری گروه (برای ویجت «خبرهای گروه» در قالب پویا) ===== */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">دستهٔ خبری گروه</label>
              <select
                value={formNewsCategoryId}
                onChange={(e) => setFormNewsCategoryId(e.target.value)}
                className={`${inputCls} cursor-pointer`}
              >
                <option value="">بدون دستهٔ خبری</option>
                {newsCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-1">
                اخبار همین دستهٔ خبری در بخش «خبرهای گروه» صفحهٔ عمومی این گروه نمایش داده می‌شود.
              </p>
            </div>

            {/* ===== مدرسان گروه (multi-select from people) ===== */}
            <div className="rounded-2xl border border-gray-100 dark:border-white/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-500" />
                  مدرسان گروه ({formInstructorIds.length} انتخاب شده)
                  <span className="text-[10px] font-normal text-gray-400">— فقط اعضای هیات علمی و اساتید مدعو</span>
                </label>
              </div>
              {poolLoading ? (
                <div className="flex items-center gap-2 text-xs text-gray-400 py-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال بارگذاری مدرسان...
                </div>
              ) : instructorPool.length === 0 ? (
                <p className="text-[10px] text-gray-400 py-2">
                  هیچ عضوی از نوع هیات علمی یا استاد مدعو یافت نشد — ابتدا از ماژول «اعضای دانشگاه» عضو ثبت کنید.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 max-h-72 overflow-auto pr-1">
                  {instructorPool.map((p) => {
                    const selected = formInstructorIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => toggleInstructor(p.id)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer text-right ${
                          selected
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-300'
                            : 'border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-emerald-500/30'
                        }`}
                      >
                        <div className="relative shrink-0">
                          {p.image ? (
                            <img src={p.image} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400">
                              <UserRound className="w-4 h-4" />
                            </div>
                          )}
                          {selected && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute -top-1.5 -left-1.5 bg-white dark:bg-[#161618] rounded-full" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold truncate">{instructorName(p)}</p>
                          <p className="text-[10px] text-gray-400 truncate">{p.rank || p.specialization || p.department || ''}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ===== رشته‌های زیرمجموعه (read-only list) ===== */}
            <div className="rounded-2xl border border-gray-100 dark:border-white/10 p-4 space-y-3">
              <label className="text-xs font-black text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                رشته‌های زیرمجموعه
                <span className="text-[10px] font-normal text-gray-400">— از ماژول «رشته‌های تحصیلی» مدیریت می‌شوند</span>
              </label>
              {formSubFields.length === 0 ? (
                <p className="text-[10px] text-gray-400">رشته‌ای ثبت نشده است.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formSubFields.map((f) => (
                    <span key={f.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold border border-indigo-500/20">
                      <GraduationCap className="w-3 h-3" />
                      {f.name}
                      {f.degreeLevel && <span className="text-[10px] font-normal text-gray-400">• {f.degreeLevel}</span>}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">وضعیت انتشار</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormStatus('published')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    formStatus === 'published'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-500 border border-transparent'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  انتشار (نمایش در سایت عمومی)
                </button>
                <button
                  type="button"
                  onClick={() => setFormStatus('draft')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    formStatus === 'draft'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/40'
                      : 'bg-gray-50 dark:bg-white/5 text-gray-500 border border-transparent'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  پیش‌نویس
                </button>
              </div>
              {!canApprove && (
                <p className="text-[10px] text-gray-400 mt-2">
                  شما مجوز انتشار ندارید — این گروه به‌صورت پیش‌نویس ذخیره می‌شود تا توسط مدیر منتشر شود.
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
            <button
              type="button"
              onClick={() => { setActiveTab('list'); handleResetForm(); }}
              className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {formLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {editingId ? 'ذخیره تغییرات' : 'ثبت گروه'}
            </button>
          </div>
        </form>
      )}

      {/* ===== Media Manager ===== */}
      <MediaManager
        open={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={(url: string) => { setFormImageUrl(url); setShowMediaSelector(false); }}
      />

      {/* ===== Delete Confirmation Modal ===== */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative bg-white dark:bg-[#161618] rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-gray-100 dark:border-white/10"
            >
              <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-4">
                <Trash2 className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">حذف گروه آموزشی</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                آیا از حذف این گروه آموزشی مطمئن هستید؟ این عمل قابل بازگشت نیست.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black text-xs shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
                >
                  حذف
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ===== دیالوگ ایجاد سریع ===== */}
      {showQuickCreate && (
        <QuickCreateDialog
          onClose={() => setShowQuickCreate(false)}
          onCreated={(dept) => {
            setShowQuickCreate(false);
            setVisualDepartmentId(dept.id);
            setActiveTab('visual');
            loadDepartments();
          }}
        />
      )}

      {/* ===== اتصال قالب پویای Page Builder برای صفحهٔ گروه‌های آموزشی ===== */}
      {showLayoutDialog && (
        <LinkLayoutDialog
          pageType="academic_department"
          pageTypeLabel="گروه آموزشی"
          onClose={() => setShowLayoutDialog(false)}
          onOpenBuilder={(smartPageId) => {
            setShowLayoutDialog(false);
            onOpenTab?.('page-builder', 'صفحه‌ساز هوشمند', 'LayoutTemplate', false, { initialPageId: smartPageId });
          }}
        />
      )}
    </div>
  );
}
