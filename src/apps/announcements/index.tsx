// ============================================================
// AnnouncementManagement — سیستم مدیریت اطلاعیه‌ها
// شامل: آرشیو اطلاعیه‌ها و ویرایشگر
// اطلاعیه‌ها در صفحه اصلی سایت عمومی (sau public) نمایش داده می‌شوند
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Megaphone, Plus, Search, Filter, Pin, Edit3, Trash2, Calendar,
  User as UserIcon, Clock, Send, Loader2, Upload, X, Info,
  ChevronRight, ChevronLeft, LayoutGrid, List, FileText, Download,
  Eye, CheckCircle2, AlertCircle, Paperclip, Layers, Globe,
} from 'lucide-react';
import type { AnnouncementItem, AnnouncementCategory, User, AnnouncementAttachment } from '@/src/shared-types';
import { decodeHtmlEntities } from '@/src/shared-utils';
import ToastNotification from '@/src/shared-components/ToastNotification';
import WysiwygEditor from '@/src/shared-components/WysiwygEditor';
import MediaManager from '@/src/shared-components/MediaManager';
import {
  fetchAnnouncements, fetchAnnouncementById, createAnnouncement, updateAnnouncement,
  deleteAnnouncement, toggleAnnouncementPin, fetchAnnouncementGroups,
  fetchAnnouncementCategories, createAnnouncementCategory, updateAnnouncementCategory,
  deleteAnnouncementCategory,
} from './api';
import { useAppPermissions } from '@/src/shared-utils/PermissionsContext';
import { useLanguage } from '@/src/shared-utils/LanguageContext';

interface AnnouncementManagementProps {
  user?: User | null;
  activeTabId?: string;
  moduleId?: string;
  onOpenTab?: (id: string, title: string, iconName: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

type SubTab = 'list' | 'editor' | 'categories';

export default function AnnouncementManagement({ user, moduleId, onDirtyChange }: AnnouncementManagementProps) {
  const { can } = useAppPermissions();
  const { currentLang, getLanguage } = useLanguage();
  const activeLanguage = getLanguage(currentLang);
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('support');
  const isEditor = user?.roles?.includes('editor');
  const roleCanEdit = isAdmin || isEditor;
  const permCanEdit = can('announcements.create') || can('announcements.edit');
  const permCanDelete = can('announcements.delete');
  const canApprove = can('announcements.approve') || isAdmin;
  const canEdit = roleCanEdit || permCanEdit;
  const canDelete = roleCanEdit || permCanDelete;

  // ===== Sub-tab state =====
  const [activeTab, setActiveTab] = useState<SubTab>(() => {
    if (moduleId === 'announcements-create') return 'editor';
    return 'list';
  });

  // ===== Data state =====
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ===== Filter state =====
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [groups, setGroups] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // ===== Reader Modal State =====
  const [activeReaderItem, setActiveReaderItem] = useState<AnnouncementItem | null>(null);

  // ===== Editor State =====
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formGroup, setFormGroup] = useState('');
  const [formCategoryId, setFormCategoryId] = useState<number | ''>('');
  const [formType, setFormType] = useState<'important' | 'normal'>('normal');
  const [formSummary, setFormSummary] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formStatus, setFormStatus] = useState<'published' | 'draft'>('published');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formFiles, setFormFiles] = useState<AnnouncementAttachment[]>([]);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [formMessage, setFormMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const formInitialized = useRef(false);

  useEffect(() => {
    if (!formInitialized.current) {
      formInitialized.current = true;
      return;
    }
    onDirtyChange?.(activeTab === 'editor');
  }, [activeTab, formTitle, formGroup, formCategoryId, formType, formSummary, formContent, formStatus, formIsPinned, formImageUrl, formFiles, onDirtyChange]);

  // ===== Toast state =====
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ===== Delete Confirmation state =====
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // ===== Categories state =====
  const [categories, setCategories] = useState<AnnouncementCategory[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatColor, setNewCatColor] = useState('bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30');
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatDesc, setEditCatDesc] = useState('');
  const [editCatColor, setEditCatColor] = useState('');
  const [editCatLoading, setEditCatLoading] = useState(false);
  const [deleteCatId, setDeleteCatId] = useState<number | null>(null);

  // ===== Metrics =====
  const publishedCount = announcements.filter(a => a.status === 'published').length;
  const pinnedCount = announcements.filter(a => a.is_pinned).length;
  const importantCount = announcements.filter(a => a.type === 'important').length;

  // ===== Category color map for display =====
  const CATEGORY_COLORS: Record<string, string> = {
    'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30': 'teal',
    'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30': 'indigo',
    'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30': 'amber',
    'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30': 'rose',
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30': 'emerald',
    'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30': 'purple',
  };

  // ===== Smart pagination helper =====
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

  // ===== Fetch data =====
  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: currentPage,
        per_page: 12,
        lang: currentLang,
      };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      if (groupFilter !== 'all') params.group = groupFilter;
      if (categoryFilter !== 'all') params.category_id = categoryFilter;

      const data = await fetchAnnouncements(params);
      setAnnouncements(data.data);
      setTotalPages(data.last_page);
      setTotal(data.total);
    } catch (err: any) {
      console.error('Error loading announcements:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, typeFilter, groupFilter, categoryFilter, currentLang]);

  const loadGroups = useCallback(async () => {
    try {
      const data = await fetchAnnouncementGroups();
      setGroups(data);
    } catch (err: any) {
      console.error('Error loading groups:', err);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchAnnouncementCategories(currentLang);
      setCategories(data);
    } catch (err: any) {
      console.error('Error loading categories:', err);
    }
  }, [currentLang]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadAnnouncements();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, typeFilter, groupFilter, categoryFilter]);

  // ===== Handlers =====
  const handleOpenReader = async (item: AnnouncementItem) => {
    try {
      const detail = await fetchAnnouncementById(item.id);
      setActiveReaderItem(detail);
    } catch {
      setActiveReaderItem(item);
    }
  };

  const handleTogglePin = async (itemId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const item = announcements.find(a => a.id === itemId);
    const wasPinned = item?.is_pinned;
    try {
      await toggleAnnouncementPin(itemId);
      setAnnouncements(prev => prev.map(a => a.id === itemId ? { ...a, is_pinned: !a.is_pinned } : a));
      if (activeReaderItem?.id === itemId) {
        setActiveReaderItem(prev => prev ? { ...prev, is_pinned: !prev.is_pinned } : null);
      }
      showToast(wasPinned ? 'اطلاعیه از حالت ویژه خارج شد.' : 'اطلاعیه به حالت ویژه درآمد.', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در تغییر وضعیت اطلاعیه ویژه', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAnnouncement(deleteId);
      setAnnouncements(prev => prev.filter(a => a.id !== deleteId));
      if (activeReaderItem?.id === deleteId) setActiveReaderItem(null);
      showToast('اطلاعیه با موفقیت حذف شد.', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در حذف اطلاعیه', 'error');
    } finally {
      setDeleteId(null);
    }
  };

  // ===== Category handlers =====
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setCatLoading(true);
    try {
      await createAnnouncementCategory({
        name: newCatName,
        color: newCatColor,
        description: newCatDesc || undefined,
        lang: currentLang,
      });
      await loadCategories();
      setNewCatName('');
      setNewCatDesc('');
      showToast('دسته‌بندی با موفقیت ایجاد شد.', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در ایجاد دسته‌بندی', 'error');
    } finally {
      setCatLoading(false);
    }
  };

  const handleStartEditCategory = (cat: AnnouncementCategory) => {
    setEditingCategoryId(cat.id);
    setEditCatName(cat.name);
    setEditCatDesc(cat.description || '');
    setEditCatColor(cat.color || 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30');
  };

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditCatName('');
    setEditCatDesc('');
    setEditCatColor('');
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategoryId || !editCatName.trim()) return;
    setEditCatLoading(true);
    try {
      await updateAnnouncementCategory(editingCategoryId, {
        name: editCatName.trim(),
        description: editCatDesc || undefined,
        color: editCatColor || undefined,
        lang: currentLang,
      });
      await loadCategories();
      handleCancelEditCategory();
      showToast('عنوان دسته‌بندی با موفقیت به‌روزرسانی شد.', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در ویرایش دسته‌بندی', 'error');
    } finally {
      setEditCatLoading(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCatId) return;
    try {
      await deleteAnnouncementCategory(deleteCatId);
      await loadCategories();
      if (categoryFilter === deleteCatId) setCategoryFilter('all');
      showToast('دسته‌بندی با موفقیت حذف شد.', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در حذف دسته‌بندی', 'error');
    } finally {
      setDeleteCatId(null);
    }
  };

  // ===== Helper to get category name by id =====
  const getCategoryName = (id: number | null): string => {
    if (!id) return 'عمومی';
    return categories.find(c => c.id === id)?.name || 'نامشخص';
  };

  const handleStartEdit = async (item: AnnouncementItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFormMessage(null);
    setActiveTab('editor');
    setFormLoading(true);
    try {
      const detail = await fetchAnnouncementById(item.id);
      setEditingId(detail.id);
      setFormTitle(detail.title);
      setFormGroup(detail.group || '');
      setFormCategoryId(detail.category_id ?? '');
      setFormType(detail.type);
      setFormSummary(detail.summary || '');
      setFormContent(decodeHtmlEntities(detail.content || ''));
      setFormStatus(detail.status);
      setFormIsPinned(detail.is_pinned);
      setFormImageUrl(detail.image_url || '');
      setFormFiles(detail.files || []);
    } catch (err: any) {
      // Fallback to list item
      setEditingId(item.id);
      setFormTitle(item.title);
      setFormGroup(item.group || '');
      setFormCategoryId(item.category_id ?? '');
      setFormType(item.type);
      setFormSummary(item.summary || '');
      setFormContent(decodeHtmlEntities(item.content || ''));
      setFormStatus(item.status);
      setFormIsPinned(item.is_pinned);
      setFormImageUrl(item.image_url || '');
      setFormFiles(item.files || []);
      showToast(err.message || 'خطا در بارگذاری جزئیات اطلاعیه', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleResetForm = () => {
    setEditingId(null);
    setFormTitle('');
    setFormGroup('');
    setFormCategoryId('');
    setFormType('normal');
    setFormSummary('');
    setFormContent('');
    setFormStatus('published');
    setFormIsPinned(false);
    setFormImageUrl('');
    setFormFiles([]);
    setFormMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormMessage({ text: 'لطفاً عنوان اطلاعیه را وارد نمایید.', type: 'error' });
      return;
    }

    setFormLoading(true);

    try {
      // If user cannot approve, force draft (backend also enforces this)
      const finalStatus: 'published' | 'draft' = canApprove ? formStatus : 'draft';
      const payload = {
        title: formTitle,
        group: formGroup || undefined,
        category_id: formCategoryId === '' ? null : formCategoryId,
        type: formType,
        summary: formSummary || undefined,
        content: formContent || undefined,
        image_url: formImageUrl || undefined,
        files: formFiles.length > 0 ? formFiles : undefined,
        status: finalStatus,
        is_pinned: formIsPinned,
        lang: currentLang,
      };

      if (editingId) {
        await updateAnnouncement(editingId, payload);
        setFormMessage({ text: 'تغییرات اطلاعیه با موفقیت ذخیره گردید.', type: 'success' });
      } else {
        await createAnnouncement(payload);
        setFormMessage({ text: 'اطلاعیه جدید با موفقیت ثبت شد.', type: 'success' });
      }

      setTimeout(() => {
        setActiveTab('list');
        handleResetForm();
        loadAnnouncements();
      }, 1200);
    } catch (err: any) {
      if (err.errors) {
        const firstErr = Object.values(err.errors).flat()[0];
        setFormMessage({ text: firstErr as string, type: 'error' });
      } else {
        setFormMessage({ text: err.message || 'خطا در ذخیره اطلاعیه', type: 'error' });
      }
    } finally {
      setFormLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleAddFile = (url: string, file?: { name?: string; size?: number }) => {
    const fileName = file?.name || url.split('/').pop()?.split('?')[0] || 'فایل';
    const size = file?.size ? formatFileSize(file.size) : '';
    setFormFiles(prev => [...prev, { name: fileName, size, url }]);
  };

  const handleRemoveFile = (index: number) => {
    setFormFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-right rtl">
      {/* ===== Module Header Banner ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-teal-500/20">
        <div className="absolute top-0 left-0 translate-x-[-10%] translate-y-[-20%] w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold">
              <Megaphone className="w-4 h-4" />
              <span>سامانه اطلاعیه‌های رسمی</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              مدیریت اطلاعیه‌ها
              {activeLanguage && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 border border-white/20 text-[11px] font-black font-sans uppercase">
                  <Globe className="w-3.5 h-3.5 text-teal-300" />
                  {activeLanguage.code} • {activeLanguage.name}
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
              ثبت، ویرایش و انتشار اطلاعیه‌های آموزشی، اداری و رویدادهای دانشگاه — اطلاعیه‌های منتشرشده در صفحه اصلی سایت عمومی نمایش داده می‌شوند
            </p>
          </div>

          {canEdit && (
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => { handleResetForm(); setActiveTab('editor'); }}
                className="px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-teal-950 font-black text-xs shadow-lg shadow-teal-500/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت اطلاعیه جدید</span>
              </button>
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{total}</div>
              <div className="text-[11px] text-gray-300">کل اطلاعیه‌ها</div>
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
              <div className="text-lg font-black text-white">{importantCount}</div>
              <div className="text-[11px] text-gray-300">فوری</div>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300">
              <Pin className="w-5 h-5" />
            </div>
            <div>
              <div className="text-lg font-black text-white">{pinnedCount}</div>
              <div className="text-[11px] text-gray-300">ویژه (سنجاق‌شده)</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Sub-Navigation Bar ===== */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-900 p-2 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto p-1">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'list' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>آرشیو اطلاعیه‌ها</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">{announcements.length}</span>
          </button>

          {canEdit && (
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'editor' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>{editingId ? 'ویرایش اطلاعیه' : 'ثبت اطلاعیه جدید'}</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'categories' ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>دسته‌بندی‌ها</span>
          </button>
        </div>

        {activeTab === 'list' && (
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 shadow-xs' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
              title="نمایش کارتی"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white dark:bg-gray-700 text-teal-600 dark:text-teal-400 shadow-xs' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
              }`}
              title="نمایش جدولی"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ===== TAB 1: LIST & SEARCH ===== */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {/* Search & Filters */}
          <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-4 relative">
                <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="جستجو در عنوان یا متن اطلاعیه..."
                  className="w-full pr-10 pl-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 transition-all placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute left-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="md:col-span-2">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="published">منتشر شده</option>
                  <option value="draft">پیش‌نویس</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="all">همه انواع</option>
                  <option value="important">فوری</option>
                  <option value="normal">عادی</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <select
                  value={groupFilter}
                  onChange={e => setGroupFilter(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="all">همه گروه‌ها</option>
                  {groups.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <select
                  value={categoryFilter === 'all' ? 'all' : String(categoryFilter)}
                  onChange={e => setCategoryFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full py-2.5 px-3 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="all">همه دسته‌بندی‌ها</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-gray-400 shrink-0 font-semibold text-[11px] flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                فیلتر سریع:
              </span>
              <button
                onClick={() => { setTypeFilter('all'); setStatusFilter('all'); setGroupFilter('all'); setCategoryFilter('all'); }}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  typeFilter === 'all' && statusFilter === 'all' && groupFilter === 'all' && categoryFilter === 'all' ? 'bg-teal-500 text-white shadow-xs' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                همه ({total})
              </button>
              <button
                onClick={() => { setTypeFilter('important'); setStatusFilter('all'); }}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  typeFilter === 'important' ? 'bg-rose-500 text-white shadow-xs' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                فوری
              </button>
              <button
                onClick={() => { setTypeFilter('all'); setStatusFilter('published'); }}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'published' ? 'bg-emerald-500 text-white shadow-xs' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                منتشر شده
              </button>
              <button
                onClick={() => { setTypeFilter('all'); setStatusFilter('draft'); }}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'draft' ? 'bg-amber-500 text-white shadow-xs' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                پیش‌نویس
              </button>
              {categories.slice(0, 5).map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(categoryFilter === c.id ? 'all' : c.id)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    categoryFilter === c.id ? 'bg-teal-500 text-white shadow-xs' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            </div>
          )}

          {/* Grid View */}
          {!loading && viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {announcements.map(item => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={item.id}
                  onClick={() => handleOpenReader(item)}
                  className={`group bg-white dark:bg-gray-900 rounded-3xl border ${
                    item.is_pinned ? 'border-amber-400/60 dark:border-amber-500/40 shadow-lg shadow-amber-500/5' : 'border-gray-100 dark:border-gray-800 shadow-xs'
                  } hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer relative`}
                >
                  {/* Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-500/10 to-indigo-500/10">
                        <Megaphone className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-gray-950/20 to-transparent" />

                    {item.is_pinned && (
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-amber-500 text-amber-950 font-black text-[10px] shadow-md flex items-center gap-1">
                        <Pin className="w-3 h-3 fill-current" />
                        <span>ویژه</span>
                      </div>
                    )}

                    {item.type === 'important' && (
                      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-rose-600 text-white font-black text-[10px] shadow-md flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>فوری</span>
                      </div>
                    )}

                    <div className={`absolute bottom-3 right-3 px-3 py-1 rounded-xl font-bold text-[11px] backdrop-blur-md shadow-xs ${item.category_color ? item.category_color : 'bg-teal-600/90 text-white'}`}>
                      {item.category_name || item.group || 'عمومی'}
                    </div>

                    {item.status !== 'published' && (
                      <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-amber-600 text-white font-bold text-[10px]">
                        پیش‌نویس
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-teal-500" />
                          {item.published_at ? new Date(item.published_at).toLocaleDateString('fa-IR') : new Date(item.created_at).toLocaleDateString('fa-IR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                          {item.author_name || item.author_username}
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                        {item.summary}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-3">
                      {(item.files || []).length > 0 && (
                        <span className="flex items-center gap-1 text-[11px]" title="فایل پیوست">
                          <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="font-mono">{item.files.length}</span>
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400">تاریخ: {item.published_at ? new Date(item.published_at).toLocaleDateString('fa-IR') : '-'}</span>
                    </div>

                    {canEdit && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={e => handleTogglePin(item.id, e)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            item.is_pinned ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400'
                          }`}
                          title={item.is_pinned ? 'برداشتن از ویژه' : 'سنجاق به ویژه'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => handleStartEdit(item, e)}
                          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-teal-600 dark:text-teal-400 transition-colors cursor-pointer"
                          title="ویرایش"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {canDelete && (
                          <button
                            onClick={e => { e.stopPropagation(); setDeleteId(item.id); }}
                            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Table View */}
          {!loading && viewMode === 'table' && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                    <th className="py-3.5 px-4 font-bold">عنوان اطلاعیه</th>
                    <th className="py-3.5 px-4 font-bold">دسته‌بندی</th>
                    <th className="py-3.5 px-4 font-bold">نوع</th>
                    <th className="py-3.5 px-4 font-bold">تاریخ</th>
                    <th className="py-3.5 px-4 font-bold">نویسنده</th>
                    <th className="py-3.5 px-4 font-bold text-center">وضعیت</th>
                    <th className="py-3.5 px-4 font-bold text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {announcements.map(item => (
                    <tr key={item.id} onClick={() => handleOpenReader(item)} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                      <td className="py-3.5 px-4 font-extrabold text-gray-900 dark:text-white max-w-xs truncate">
                        <div className="flex items-center gap-2">
                          {item.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                          <span>{item.title}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] ${item.category_color ? item.category_color : 'bg-teal-500/10 text-teal-700 dark:text-teal-300'}`}>
                          {item.category_name || item.group || 'عمومی'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.type === 'important' ? (
                          <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 font-bold text-[10px] flex items-center gap-1 w-fit">
                            <AlertCircle className="w-3 h-3" />فوری
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 font-bold text-[10px]">عادی</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-500 dark:text-gray-400">
                        {item.published_at ? new Date(item.published_at).toLocaleDateString('fa-IR') : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">{item.author_name || item.author_username}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          item.status === 'published' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {item.status === 'published' ? 'منتشر شده' : 'پیش‌نویس'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={e => handleTogglePin(item.id, e)} className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            item.is_pinned ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'
                          }`} title={item.is_pinned ? 'برداشتن از ویژه' : 'سنجاق به ویژه'}>
                            <Pin className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleOpenReader(item)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300" title="مطالعه">
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEdit && (
                            <>
                              <button onClick={e => handleStartEdit(item, e)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-teal-600" title="ویرایش">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {canDelete && (
                                <button onClick={e => { e.stopPropagation(); setDeleteId(item.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="حذف">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                        ? 'bg-teal-600 text-white shadow-sm'
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

          {/* Empty state */}
          {!loading && announcements.length === 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center space-y-3 border border-gray-100 dark:border-gray-800">
              <Megaphone className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" />
              <h3 className="text-base font-bold text-gray-700 dark:text-gray-200">هیچ اطلاعیه‌ای یافت نشد</h3>
              <p className="text-xs text-gray-400">عبارت دیگری جستجو کنید یا فیلترها را تغییر دهید.</p>
            </div>
          )}
        </div>
      )}

      {/* ===== TAB 2: EDITOR ===== */}
      {activeTab === 'editor' && canEdit && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          className="space-y-6"
        >
          {formMessage && (
            <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
              formMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200' : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200'
            }`}>
              <Info className="w-4 h-4 shrink-0" />
              <span>{formMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Fields */}
              <div className="lg:col-span-8 space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-1.5">
                    عنوان اطلاعیه <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" required value={formTitle} onChange={e => setFormTitle(e.target.value)}
                    placeholder="مثال: آغاز ثبت‌نام ترم جدید"
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-1.5">خلاصه اطلاعیه</label>
                  <textarea
                    rows={2} value={formSummary} onChange={e => setFormSummary(e.target.value)}
                    placeholder="توضیح کوتاه در کارت اطلاعیه..."
                    className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-700 dark:text-gray-300 mb-1.5">متن کامل اطلاعیه</label>
                  <WysiwygEditor
                    content={formContent}
                    onChange={setFormContent}
                    placeholder="متن کامل اطلاعیه را بنویسید..."
                    minHeight="320px"
                  />
                </div>
              </div>

              {/* Sidebar Settings */}
              <div className="lg:col-span-4 space-y-5 bg-gray-50/50 dark:bg-gray-800/40 p-5 rounded-3xl border border-gray-100 dark:border-gray-800">
                <h3 className="text-xs font-black text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">تنظیمات انتشار</h3>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">دسته‌بندی</label>
                  <select
                    value={formCategoryId === '' ? '' : String(formCategoryId)}
                    onChange={e => setFormCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="">بدون دسته‌بندی</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-400 mt-1">اطلاعیه‌ها را می‌توان در دسته‌بندی‌های دلخواه گروه‌بندی کرد.</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">نوع اطلاعیه</label>
                  <select
                    value={formType} onChange={e => setFormType(e.target.value as any)}
                    className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="normal">عادی</option>
                    <option value="important">فوری</option>
                  </select>
                  {formType === 'important' && (
                    <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      اطلاعیه فوری در سایت عمومی با ظاهر ویژه نمایش داده می‌شود.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">وضعیت</label>
                  <select
                    value={formStatus} onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full py-2.5 px-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    {canApprove && <option value="published">منتشر شده</option>}
                    <option value="draft">پیش‌نویس</option>
                  </select>
                  {!canApprove && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      اطلاعیه پس از ذخیره به صورت پیش‌نویس ثبت شده و پس از تایید مدیر منتشر خواهد شد.
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={formIsPinned} onChange={e => setFormIsPinned(e.target.checked)} className="rounded text-teal-600 focus:ring-teal-500 h-4 w-4" />
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                      <Pin className="w-3.5 h-3.5 text-amber-500" />
                      اطلاعیه ویژه (سنجاق‌شده)
                    </span>
                  </label>
                  <p className="text-[10px] text-gray-400 mt-1 mr-6">اطلاعیه‌های ویژه در بالای لیست اطلاعیه‌های سایت عمومی نمایش داده می‌شوند.</p>
                </div>

                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">تصویر شاخص</label>
                  <div className="space-y-2">
                    {formImageUrl ? (
                      <div className="relative h-32 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
                        <img src={formImageUrl} alt="پیش‌نمایش" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowMediaSelector(true)}
                            className="px-3 py-1.5 rounded-lg bg-white text-gray-800 text-xs font-bold cursor-pointer hover:bg-gray-100"
                          >
                            تغییر
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormImageUrl('')}
                            className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold cursor-pointer hover:bg-red-600"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowMediaSelector(true)}
                        className="w-full h-32 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-teal-500 hover:text-teal-500 transition-all cursor-pointer"
                      >
                        <Upload className="w-6 h-6" />
                        <span className="text-xs font-bold">انتخاب تصویر</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400">فایل‌های پیوست</label>
                    <button
                      type="button"
                      onClick={() => setShowFileSelector(true)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold hover:bg-indigo-500/20 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      افزودن فایل
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mb-1.5">
                    فایل‌های PDF، Word، Excel و ... را از گالری رسانه انتخاب کنید
                  </p>
                  {formFiles.length === 0 && (
                    <p className="text-[10px] text-gray-400 text-center py-3 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                      هنوز فایلی اضافه نشده است
                    </p>
                  )}
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {formFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-2">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <input
                            type="text"
                            value={file.name}
                            onChange={e => {
                              const updated = [...formFiles];
                              updated[idx] = { ...updated[idx], name: e.target.value };
                              setFormFiles(updated);
                            }}
                            placeholder="نام فایل"
                            className="w-full px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:border-indigo-500"
                          />
                          <input
                            type="text"
                            value={file.url}
                            onChange={e => {
                              const updated = [...formFiles];
                              updated[idx] = { ...updated[idx], url: e.target.value };
                              setFormFiles(updated);
                            }}
                            placeholder="آدرس فایل"
                            dir="ltr"
                            className="w-full px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-mono text-gray-600 dark:text-gray-300 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                          title="حذف فایل"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <button
                    type="submit" disabled={formLoading}
                    className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{editingId ? 'ذخیره تغییرات' : 'ثبت اطلاعیه'}</span>
                  </button>
                  <button type="button" onClick={() => setActiveTab('list')} className="w-full py-2.5 px-4 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-300 cursor-pointer">
                    انصراف
                  </button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      )}

      {/* ===== Categories Tab ===== */}
      {activeTab === 'categories' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Categories list */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-500" />
                  دسته‌بندی‌های اطلاعیه
                </h3>
                <span className="text-[11px] font-bold text-gray-400">{categories.length} دسته‌بندی</span>
              </div>

              {categories.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">
                  هنوز دسته‌بندی‌ای ایجاد نشده است.
                </div>
              ) : (
                <div className="space-y-3">
                  {categories.map(cat => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 hover:border-teal-500/40 transition-colors"
                    >
                      {editingCategoryId === cat.id ? (
                        <form onSubmit={handleUpdateCategory} className="flex-1 flex flex-wrap items-center gap-2">
                          <input
                            type="text"
                            value={editCatName}
                            onChange={e => setEditCatName(e.target.value)}
                            className="flex-1 min-w-32 px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-teal-500"
                            placeholder="نام دسته‌بندی"
                            required
                          />
                          <select
                            value={editCatColor}
                            onChange={e => setEditCatColor(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-[11px] font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                          >
                            <option value="bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30">سبز فیروزه‌ای</option>
                            <option value="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30">نیلی</option>
                            <option value="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">طلایی</option>
                            <option value="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30">رز</option>
                            <option value="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">سبز</option>
                            <option value="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30">بنفش</option>
                          </select>
                          <button
                            type="submit"
                            disabled={editCatLoading}
                            className="px-3 py-2 rounded-xl bg-teal-600 text-white text-[11px] font-bold hover:bg-teal-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                          >
                            {editCatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            ذخیره
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEditCategory}
                            className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 text-[11px] font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                          >
                            انصراف
                          </button>
                        </form>
                      ) : (
                        <>
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`w-3 h-3 rounded-full shrink-0 ${cat.color?.split(' ')[0] || 'bg-teal-500'}`} />
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold text-gray-900 dark:text-white truncate">{cat.name}</div>
                              {cat.description && (
                                <div className="text-[10px] text-gray-400 truncate mt-0.5">{cat.description}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] font-bold">
                              {cat.count ?? 0} اطلاعیه
                            </span>
                            <button
                              onClick={() => { setCategoryFilter(cat.id); setActiveTab('list'); }}
                              className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[10px] font-bold hover:bg-teal-500/20 transition-colors cursor-pointer"
                            >
                              مشاهده اطلاعیه‌ها
                            </button>
                            <button
                              onClick={() => handleStartEditCategory(cat)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-teal-600 hover:bg-teal-500/10 transition-colors cursor-pointer"
                              title="ویرایش"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteCatId(cat.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Create category form */}
          {canEdit && (
            <div className="lg:col-span-4">
              <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs p-5 sticky top-24">
                <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                  <Plus className="w-4 h-4 text-teal-500" />
                  دسته‌بندی جدید
                </h3>
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">نام دسته‌بندی *</label>
                    <input
                      type="text"
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      placeholder="مثال: آموزشی، اداری..."
                      className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-teal-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">توضیحات</label>
                    <textarea
                      value={newCatDesc}
                      onChange={e => setNewCatDesc(e.target.value)}
                      placeholder="توضیح کوتاه برای این دسته‌بندی (اختیاری)"
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">رنگ</label>
                    <select
                      value={newCatColor}
                      onChange={e => setNewCatColor(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                    >
                      <option value="bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30">سبز فیروزه‌ای</option>
                      <option value="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30">نیلی</option>
                      <option value="bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30">طلایی</option>
                      <option value="bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30">رز</option>
                      <option value="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">سبز</option>
                      <option value="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30">بنفش</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={catLoading || !newCatName.trim()}
                    className="w-full py-2.5 rounded-xl bg-teal-600 text-white text-xs font-black hover:bg-teal-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {catLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    ایجاد دسته‌بندی
                  </button>
                </form>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Media Manager for form image */}
      <MediaManager
        open={showMediaSelector}
        onClose={() => setShowMediaSelector(false)}
        onSelect={(url) => { setFormImageUrl(url); }}
        filter="image"
        title="انتخاب تصویر شاخص"
      />

      {/* Media Manager for attachments */}
      <MediaManager
        open={showFileSelector}
        onClose={() => setShowFileSelector(false)}
        onSelect={handleAddFile}
        filter="all"
        title="انتخاب فایل پیوست"
      />

      {/* ===== Toast Notification ===== */}
      <ToastNotification toast={toast} />

      {/* ===== Delete Confirmation Modal ===== */}
      <AnimatePresence>
        {deleteId !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 w-full max-w-md pointer-events-auto text-center">
                <div className="mx-auto w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">حذف اطلاعیه</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  آیا از حذف این اطلاعیه اطمینان دارید؟
                  <br />
                  <span className="text-rose-500 text-xs">این عمل قابل بازگشت نیست.</span>
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setDeleteId(null)}
                    className="px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors cursor-pointer"
                  >
                    حذف اطلاعیه
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== Delete Category Confirmation Modal ===== */}
      <AnimatePresence>
        {deleteCatId !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setDeleteCatId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6 w-full max-w-md pointer-events-auto text-center">
                <div className="mx-auto w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2">حذف دسته‌بندی</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  آیا از حذف این دسته‌بندی اطمینان دارید؟
                  <br />
                  <span className="text-amber-500 text-xs">اطلاعیه‌های این دسته‌بندی بدون دسته‌بندی (عمومی) خواهند شد.</span>
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setDeleteCatId(null)}
                    className="px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={confirmDeleteCategory}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors cursor-pointer"
                  >
                    حذف دسته‌بندی
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===== READER MODAL ===== */}
      <AnimatePresence>
        {activeReaderItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-3xl max-w-3xl w-full border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col text-right"
            >
              {/* Banner */}
              <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-gray-950 shrink-0">
                {activeReaderItem.image_url ? (
                  <img src={activeReaderItem.image_url} alt={activeReaderItem.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-500/20 to-indigo-500/20">
                    <Megaphone className="w-20 h-20 text-gray-600" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
                <button
                  onClick={() => setActiveReaderItem(null)}
                  className="absolute top-4 left-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-6 right-6 left-6 space-y-2 text-white">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-xl font-bold text-xs shadow-xs ${activeReaderItem.category_color ? activeReaderItem.category_color : 'bg-teal-600 text-white'}`}>
                      {activeReaderItem.category_name || activeReaderItem.group || 'عمومی'}
                    </span>
                    {activeReaderItem.type === 'important' && (
                      <span className="px-3 py-1 rounded-xl bg-rose-600 font-black text-xs flex items-center gap-1 shadow-xs">
                        <AlertCircle className="w-3.5 h-3.5" />فوری
                      </span>
                    )}
                    {activeReaderItem.is_pinned && (
                      <span className="px-3 py-1 rounded-xl bg-amber-500 text-amber-950 font-black text-xs flex items-center gap-1 shadow-xs">
                        <Pin className="w-3.5 h-3.5" />ویژه
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black leading-snug">{activeReaderItem.title}</h1>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
                <div className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 text-xs text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-teal-600" />
                      {activeReaderItem.published_at ? new Date(activeReaderItem.published_at).toLocaleDateString('fa-IR') : new Date(activeReaderItem.created_at).toLocaleDateString('fa-IR')}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <UserIcon className="w-4 h-4 text-indigo-500" />
                      {activeReaderItem.author_name || activeReaderItem.author_username}
                    </span>
                  </div>
                  {activeReaderItem.status === 'draft' && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 text-[10px] font-bold">پیش‌نویس</span>
                  )}
                </div>

                {activeReaderItem.summary && (
                  <div className="p-4 rounded-2xl bg-teal-500/5 dark:bg-teal-500/10 border-r-4 border-teal-500 text-xs sm:text-sm font-semibold text-teal-900 dark:text-teal-200 leading-relaxed">
                    {activeReaderItem.summary}
                  </div>
                )}

                {activeReaderItem.content && (
                  <div
                    className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 leading-relaxed space-y-4 font-sans prose-content"
                    dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(activeReaderItem.content) }}
                  />
                )}

                {/* Attachments */}
                {(activeReaderItem.files || []).length > 0 && (
                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                    <h4 className="text-xs font-black text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                      <Paperclip className="w-4 h-4 text-indigo-500" />
                      فایل‌های پیوست
                    </h4>
                    <div className="space-y-2">
                      {(activeReaderItem.files || []).map((file, idx) => (
                        <a
                          key={idx}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 hover:border-indigo-400 transition-all group"
                        >
                          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{file.name}</div>
                            {file.size && <div className="text-[10px] text-gray-400 font-mono">{file.size}</div>}
                          </div>
                          <Download className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs shrink-0">
                <span className="text-gray-400 text-[11px]">پرتال مدیریت اطلاعیه‌ها</span>
                <button onClick={() => setActiveReaderItem(null)} className="px-5 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold cursor-pointer">
                  بستن پنجره
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
