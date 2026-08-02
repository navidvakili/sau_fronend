// ============================================================
// FieldsManagement — سیستم مدیریت رشته‌های تحصیلی
// هر رشته به یک گروه آموزشی مرتبط می‌شود (زیرمجموعه گروه)
// در سایت عمومی (sau public) نمایش داده می‌شوند
// ============================================================

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap, Plus, Search, Edit3, Trash2, Image as ImageIcon,
  Send, Loader2, X, CheckCircle2, AlertCircle, Globe,
  BookOpen, Building2, Layers,
} from 'lucide-react';
import type { AcademicFieldItem, AcademicFieldPayload } from '@/src/shared-types';
import ToastNotification from '@/src/shared-components/ToastNotification';
import MediaManager from '@/src/shared-components/MediaManager';
import { fetchFields, fetchFieldById, createField, updateField, deleteField } from './api';
import { fetchDepartments } from '../departments/api';
import { useAppPermissions } from '@/src/shared-utils/PermissionsContext';
import { useLanguage } from '@/src/shared-utils/LanguageContext';

interface FieldsManagementProps {
  user?: any;
  activeTabId?: string;
  moduleId?: string;
  onOpenTab?: (id: string, title: string, iconName: string) => void;
}

type SubTab = 'list' | 'editor';

const inputCls = 'w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50';

const DEGREE_OPTIONS = ['کاردانی', 'کارشناسی', 'کارشناسی ارشد', 'دکتری'];

export default function FieldsManagement({ user }: FieldsManagementProps) {
  const { can } = useAppPermissions();
  const { currentLang, getLanguage } = useLanguage();
  const activeLanguage = getLanguage(currentLang);
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('support');
  const isEditor = user?.roles?.includes('editor');
  const roleCanEdit = isAdmin || isEditor;
  const permCanEdit = can('fields.create') || can('fields.edit');
  const permCanDelete = can('fields.delete');
  const canApprove = can('fields.approve') || isAdmin;
  const canEdit = roleCanEdit || permCanEdit;
  const canDelete = roleCanEdit || permCanDelete;

  // ===== Sub-tab state =====
  const [activeTab, setActiveTab] = useState<SubTab>('list');

  // ===== Data state =====
  const [fields, setFields] = useState<AcademicFieldItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // ===== Filter state =====
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // ===== Departments pool (for filter + form select) =====
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);

  // ===== Editor State =====
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formDepartmentId, setFormDepartmentId] = useState<string>('');
  const [formDegreeLevel, setFormDegreeLevel] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('published');

  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [formMessage, setFormMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // ===== Toast state =====
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ===== Delete Confirmation state =====
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // ===== Metrics =====
  const publishedCount = fields.filter(f => f.status === 'published').length;
  const draftCount = fields.filter(f => f.status === 'draft').length;

  // ===== Load departments pool =====
  const loadDepartments = useCallback(async () => {
    try {
      const data = await fetchDepartments({ per_page: 500, lang: currentLang });
      setDepartments((data?.data || []).map(d => ({ id: d.id, name: d.name })));
    } catch (err: any) {
      console.error('Error loading departments:', err);
    }
  }, [currentLang]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  // ===== Fetch data =====
  const loadFields = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { per_page: 100, lang: currentLang };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (departmentFilter !== 'all') params.department_id = Number(departmentFilter);
      const data = await fetchFields(params);
      setFields(data.data);
      setTotal(data.total);
    } catch (err: any) {
      console.error('Error loading fields:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, departmentFilter, currentLang]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => loadFields(), 400);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, departmentFilter]);

  // ===== Handlers =====
  const handleStartEdit = async (item: AcademicFieldItem) => {
    setFormMessage(null);
    setActiveTab('editor');
    setFormLoading(true);
    try {
      const detail = await fetchFieldById(item.id);
      fillForm(detail);
    } catch (err: any) {
      fillForm(item);
      showToast(err.message || 'خطا در بارگذاری جزئیات رشته تحصیلی', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const fillForm = (f: AcademicFieldItem) => {
    setEditingId(f.id);
    setFormName(f.name || '');
    setFormDepartmentId(f.departmentId ? String(f.departmentId) : '');
    setFormDegreeLevel(f.degreeLevel || '');
    setFormCode(f.code || '');
    setFormDescription(f.description || '');
    setFormImageUrl(f.image_url || '');
    setFormStatus(f.status);
  };

  const handleResetForm = () => {
    setEditingId(null);
    setFormName(''); setFormDepartmentId(''); setFormDegreeLevel('');
    setFormCode(''); setFormDescription(''); setFormImageUrl('');
    setFormStatus('published');
    setFormMessage(null);
  };

  const buildPayload = (): AcademicFieldPayload => {
    return {
      name: formName,
      lang: currentLang,
      department_id: formDepartmentId ? Number(formDepartmentId) : null,
      degree_level: formDegreeLevel || undefined,
      code: formCode || undefined,
      description: formDescription || undefined,
      image_url: formImageUrl || undefined,
      status: formStatus,
    };
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormMessage({ text: 'لطفاً نام رشته تحصیلی را وارد نمایید.', type: 'error' });
      return;
    }
    setFormLoading(true);
    try {
      const finalStatus: 'published' | 'draft' = canApprove ? formStatus : 'draft';
      const payload = { ...buildPayload(), status: finalStatus } as AcademicFieldPayload;

      if (editingId) {
        await updateField(editingId, payload);
        setFormMessage({ text: 'تغییرات رشته تحصیلی با موفقیت ذخیره گردید.', type: 'success' });
      } else {
        await createField(payload);
        setFormMessage({ text: 'رشته تحصیلی جدید با موفقیت ثبت شد.', type: 'success' });
      }

      setTimeout(() => {
        setActiveTab('list');
        handleResetForm();
        loadFields();
      }, 1200);
    } catch (err: any) {
      if (err.errors) {
        const firstErr = Object.values(err.errors).flat()[0];
        setFormMessage({ text: firstErr as string, type: 'error' });
      } else {
        setFormMessage({ text: err.message || 'خطا در ذخیره رشته تحصیلی', type: 'error' });
      }
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteField(deleteId);
      setFields(prev => prev.filter(f => f.id !== deleteId));
      showToast('رشته تحصیلی با موفقیت حذف شد.', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در حذف رشته تحصیلی', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  const deptName = (id: number | null) => {
    if (!id) return '';
    const found = departments.find(d => d.id === id);
    return found ? found.name : '';
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-right rtl">
      {/* ===== Module Header Banner ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-emerald-500/20">
        <div className="absolute top-0 left-0 translate-x-[-10%] translate-y-[-20%] w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
              <GraduationCap className="w-4 h-4" />
              <span>سامانه رشته‌های تحصیلی</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              مدیریت رشته‌های تحصیلی
              {activeLanguage && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/20 text-[11px] font-black font-sans uppercase">
                  <Globe className="w-3.5 h-3.5 text-emerald-300" />
                  {activeLanguage.code} • {activeLanguage.name}
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
              مدیریت رشته‌های تحصیلی دانشگاه و ارتباط هر رشته با گروه آموزشی مربوطه — رشته‌های منتشرشده در سایت عمومی نمایش داده می‌شوند
            </p>
          </div>

          {canEdit && (
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => { handleResetForm(); setActiveTab('editor'); }}
                className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت رشته جدید</span>
              </button>
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{total}</div>
              <div className="text-[11px] text-gray-300">کل رشته‌ها</div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{publishedCount}</div>
              <div className="text-[11px] text-gray-300">منتشر شده</div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{draftCount}</div>
              <div className="text-[11px] text-gray-300">پیش‌نویس</div>
            </div>
          </div>
        </div>
      </div>

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
                placeholder="جستجو در نام رشته، کد یا مقطع..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
              >
                <option value="all">همه گروه‌ها</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
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
          ) : fields.length === 0 ? (
            <div className="bg-white dark:bg-[#161618] rounded-3xl border border-gray-100 dark:border-white/10 p-16 text-center">
              <GraduationCap className="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
                رشته تحصیلی‌ای یافت نشد
              </h3>
              <p className="text-sm text-gray-400 mb-6">برای شروع، اولین رشته تحصیلی را ثبت کنید.</p>
              {canEdit && (
                <button
                  onClick={() => { handleResetForm(); setActiveTab('editor'); }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-emerald-950 font-black text-xs hover:bg-emerald-400 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  ثبت رشته جدید
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {fields.map((item) => (
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
                          <GraduationCap className="w-7 h-7" />
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
                      <GraduationCap className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-base font-black text-gray-900 dark:text-white mb-1.5 leading-tight line-clamp-1">
                      {item.name}
                    </h3>
                    {item.department && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-1 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                        {item.department.name}
                      </p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap my-3">
                      {item.degreeLevel && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          <Layers className="w-3 h-3" />
                          {item.degreeLevel}
                        </span>
                      )}
                      {item.code && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                          <BookOpen className="w-3 h-3" />
                          کد {item.code}
                        </span>
                      )}
                    </div>

                    {item.description && (
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 line-clamp-2 mb-4">{item.description}</p>
                    )}

                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-4">
                      {item.author_name ? `ثبت توسط ${item.author_name}` : item.author_username}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-white/5">
                      {canEdit && (
                        <button
                          onClick={() => handleStartEdit(item)}
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
        </div>
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
                  ویرایش رشته تحصیلی
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-emerald-500" />
                  ثبت رشته تحصیلی
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
                  نام رشته تحصیلی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثلاً مهندسی کامپیوتر"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">گروه آموزشی مرتبط</label>
                <select
                  value={formDepartmentId}
                  onChange={(e) => setFormDepartmentId(e.target.value)}
                  className={`${inputCls} cursor-pointer`}
                >
                  <option value="">بدون گروه</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">مقطع</label>
                <select
                  value={formDegreeLevel}
                  onChange={(e) => setFormDegreeLevel(e.target.value)}
                  className={`${inputCls} cursor-pointer`}
                >
                  <option value="">بدون مقطع</option>
                  {DEGREE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">کد رشته</label>
                <input
                  type="text"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="مثلاً 1234"
                  className={inputCls}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">معرفی رشته</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={4}
                placeholder="شرح مختصری درباره این رشته تحصیلی..."
                className={inputCls}
              />
            </div>

            {/* ===== Image ===== */}
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">تصویر رشته</label>
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
                  شما مجوز انتشار ندارید — این رشته به‌صورت پیش‌نویس ذخیره می‌شود تا توسط مدیر منتشر شود.
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
              {editingId ? 'ذخیره تغییرات' : 'ثبت رشته'}
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
              <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">حذف رشته تحصیلی</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                آیا از حذف این رشته تحصیلی مطمئن هستید؟ این عمل قابل بازگشت نیست.
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
    </div>
  );
}
