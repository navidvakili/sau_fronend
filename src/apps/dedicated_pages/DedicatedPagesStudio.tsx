import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Layers,
  Plus,
  Search,
  Filter,
  GraduationCap,
  Palette,
  Users,
  BookOpen,
  UserCheck,
  Sparkles,
  MessageSquare,
  Eye,
  Settings,
  Trash2,
  Edit,
  ExternalLink,
  Shield,
  CheckCircle,
  Clock,
  Globe,
  Share2,
  FileText,
  AlertCircle,
  User,
  Sliders,
  Maximize2,
  X,
  RotateCcw,
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  Loader2
} from 'lucide-react';
import { DedicatedPage, PageType, PageContentItem, PageTypeDefinition, DEDICATED_PAGE_TYPES } from './types';
import { fetchDedicatedPages, fetchPageContents, createDedicatedPage, updateDedicatedPage, deleteDedicatedPage, publishDedicatedPage, unpublishDedicatedPage } from './api';
import PageWizardModal from './PageWizardModal';
import PageLiveWebsiteView from './PageLiveWebsiteView';
import PageContentModerationModal from './PageContentModerationModal';
import IsolatedManagerPortal from './IsolatedManagerPortal';
import { ConfirmDialog } from '@/src/shared-components/ConfirmDialog';
import Pagination from '@/src/shared-components/Pagination';
import { getDedicatedPagePublicUrl } from './utils';
import type { DedicatedPagesStats } from './types';

const PER_PAGE = 12;
const EMPTY_STATS: DedicatedPagesStats = { total: 0, active: 0, total_contents: 0, total_authorized_users: 0, by_type: {} };

interface DedicatedPagesStudioProps {
  onOpenTab?: (id: string, title: string, iconName: string, forceNewInstance?: boolean, initialProps?: Record<string, any>) => void;
}

export default function DedicatedPagesStudio({ onOpenTab }: DedicatedPagesStudioProps) {
  // Primary State
  const [pages, setPages] = useState<DedicatedPage[]>([]);
  const [pageTypeRegistry] = useState<PageTypeDefinition[]>(DEDICATED_PAGE_TYPES);
  const [isLoading, setIsLoading] = useState(true); // blocking loader — first load only
  const [isFetching, setIsFetching] = useState(false); // lightweight indicator for subsequent reloads
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DedicatedPagesStats>(EMPTY_STATS);
  const [paginationTotal, setPaginationTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Persona / Access Simulation (Super Admin vs. Isolated Page Manager)
  const [currentPersona, setCurrentPersona] = useState<string>('super_admin');

  // Modals & Active Views
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<DedicatedPage | null>(null);

  const [previewPage, setPreviewPage] = useState<DedicatedPage | null>(null);
  const [moderationPage, setModerationPage] = useState<DedicatedPage | null>(null);
  const [isolatedViewPage, setIsolatedViewPage] = useState<DedicatedPage | null>(null);
  const [pageToDelete, setPageToDelete] = useState<DedicatedPage | null>(null);
  const [isDeletingPage, setIsDeletingPage] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'title' | 'contents'>('newest');

  // Debounce search input so typing doesn't fire a request per keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Changing a filter/sort always restarts from page 1
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedTypeFilter, selectedStatusFilter, sortBy]);

  // Load data from API — ONE consolidated request per change (list + pagination + stats)
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedTypeFilter, selectedStatusFilter, sortBy, currentPage]);

  const loadData = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const result = await fetchDedicatedPages({
        pageType: selectedTypeFilter !== 'all' ? (selectedTypeFilter as PageType) : undefined,
        status: selectedStatusFilter !== 'all' ? (selectedStatusFilter as any) : undefined,
        searchQuery: debouncedSearch || undefined,
        sort: sortBy,
        page: currentPage,
        perPage: PER_PAGE
      });
      setPages(result.data);
      setPaginationTotal(result.pagination?.total ?? result.data.length);
      setStats(result.stats ?? EMPTY_STATS);
    } catch (e) {
      console.error('Error loading data:', e);
      setError('خطا در بارگذاری اطلاعات. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsFetching(false);
      setIsLoading(false);
    }
  };

  // On-demand content loading — fetches contents ONLY for the single page currently
  // open in a moderation / preview / isolated-portal view (replaces the old N+1
  // "fetch every page's contents up front" pattern).
  const activeContentPageId = moderationPage?.id || previewPage?.id || isolatedViewPage?.id || null;
  const [activePageContents, setActivePageContents] = useState<PageContentItem[]>([]);

  useEffect(() => {
    if (!activeContentPageId) {
      setActivePageContents([]);
      return;
    }
    fetchPageContents(activeContentPageId)
      .then(setActivePageContents)
      .catch(e => {
        console.error(`Error loading contents for page ${activeContentPageId}:`, e);
        setActivePageContents([]);
      });
  }, [activeContentPageId]);

  // Available Personas for Access Simulation — derived from real page owners in the database
  const PERSONA_OPTIONS = [
    { id: 'super_admin', label: 'مدیر کل سیستم (Super Admin - دسترسی نامحدود)', role: 'admin', pageId: null as string | null, ownerName: '' },
    ...pages
      .filter(p => !!p.owner?.name)
      .map(p => ({
        id: `page_${p.id}`,
        label: `${p.owner!.name}${p.owner!.roleTitle ? ` — ${p.owner!.roleTitle}` : ''} (${p.shortTitle || p.title})`,
        role: 'owner',
        pageId: p.id as string | null,
        ownerName: p.owner!.name
      }))
  ];

  // Handle Persona Switching
  const handlePersonaChange = (personaId: string) => {
    setCurrentPersona(personaId);
    if (personaId === 'super_admin') {
      setIsolatedViewPage(null);
    } else {
      const personaObj = PERSONA_OPTIONS.find(p => p.id === personaId);
      if (personaObj && personaObj.pageId) {
        const targetPage = pages.find(p => p.id === personaObj.pageId);
        if (targetPage) {
          setIsolatedViewPage(targetPage);
        }
      }
    }
  };

  // Search/type/status filtering and sorting now happen on the server (see loadData),
  // so `pages` already reflects the current filters/sort/page — no client-side pass needed.
  const filteredPages = pages;

  const activeFiltersCount =
    (searchQuery.trim() !== '' ? 1 : 0) +
    (selectedTypeFilter !== 'all' ? 1 : 0) +
    (selectedStatusFilter !== 'all' ? 1 : 0) +
    (sortBy !== 'newest' ? 1 : 0);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedTypeFilter('all');
    setSelectedStatusFilter('all');
    setSortBy('newest');
  };

  // Page CRUD Operations (connected to backend API)
  const handleSavePage = async (savedPage: DedicatedPage) => {
    try {
      const exists = pages.some(p => p.id === savedPage.id);
      if (exists) {
        await updateDedicatedPage(savedPage.id, savedPage);
      } else {
        await createDedicatedPage(savedPage);
      }
      setEditingPage(null);
      await loadData();
    } catch (e) {
      console.error('Error saving page:', e);
      alert('خطا در ذخیره‌سازی صفحه. لطفاً دوباره تلاش کنید.');
    }
  };

  const handleDeletePage = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const page = pages.find(p => p.id === id);
    if (page) setPageToDelete(page);
  };

  const confirmDeletePage = async () => {
    if (!pageToDelete) return;
    const id = pageToDelete.id;
    setIsDeletingPage(true);
    try {
      await deleteDedicatedPage(id);
      if (previewPage?.id === id) setPreviewPage(null);
      if (moderationPage?.id === id) setModerationPage(null);
      if (isolatedViewPage?.id === id) setIsolatedViewPage(null);
      setPageToDelete(null);
      await loadData();
    } catch (e) {
      console.error('Error deleting page:', e);
      alert('خطا در حذف صفحه. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsDeletingPage(false);
    }
  };

  const handleToggleStatus = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const page = pages.find(p => p.id === id);
      if (!page) return;
      if (page.status === 'active') {
        await unpublishDedicatedPage(id);
      } else {
        await publishDedicatedPage(id);
      }
      const newStatus = page.status === 'active' ? 'draft' : 'active';
      setPages(
        pages.map(p => {
          if (p.id === id) {
            return { ...p, status: newStatus as any };
          }
          return p;
        })
      );
    } catch (e) {
      console.error('Error toggling status:', e);
      alert('خطا در تغییر وضعیت. لطفاً دوباره تلاش کنید.');
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">در حال بارگذاری اطلاعات...</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">لطفاً صبر کنید</p>
        </div>
      </div>
    );
  }

  // Error State — only block the whole screen if we have nothing else to show yet.
  // A failed reload while filtering (with previous results still on screen) shouldn't
  // hide the filters/grid; it's logged and the previous results just stay as-is.
  if (error && pages.length === 0) {
    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{error}</h3>
          <button
            onClick={loadData}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            تلاش مجدد
          </button>
        </div>
      </div>
    );
  }

  // If in Isolated Tenant View, render IsolatedManagerPortal
  if (isolatedViewPage && currentPersona !== 'super_admin') {
    const activePersonaObj = PERSONA_OPTIONS.find(p => p.id === currentPersona);
    return (
      <IsolatedManagerPortal
        page={isolatedViewPage}
        allPages={pages}
        contents={activePageContents}
        currentPersonaName={activePersonaObj?.ownerName || 'کاربر اختصاصی'}
        onSelectPage={setIsolatedViewPage}
        onUpdatePage={handleSavePage}
        onUpdateContents={setActivePageContents}
        onOpenLivePreview={setPreviewPage}
        onExitToSuperAdmin={() => handlePersonaChange('super_admin')}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 p-4 sm:p-6 overflow-y-auto space-y-6">
      {/* Top Banner / Persona Switcher Bar */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
              سامانه مدیریت پورتال و صفحات مستقل
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            مدیریت صفحات اختصاصی واحدها، تشکل‌ها و اشخاص
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            تعریف ساختار، دسترسی‌های ایزوله، لایوت با Page Builder، دسته‌بندی‌ها و نظارت بر محتوای انجمن‌های علمی، کانون‌ها، نشریات و اساتید دانشگاه.
          </p>
        </div>

        {/* Persona & Role Switcher */}
        <div className="bg-slate-800/90 border border-slate-700/80 p-3 rounded-2xl flex flex-col gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>شبیه‌ساز نقش و احراز هویت ایزوله:</span>
          </div>
          <select
            value={currentPersona}
            onChange={e => handlePersonaChange(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 font-medium cursor-pointer"
          >
            {PERSONA_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">کل صفحات اختصاصی</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">{stats.total}</div>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">تعریف شده در پرتال</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">صفحات فعال و عمومی</span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
              {stats.active}
            </div>
            <span className="text-[11px] text-slate-400">در دسترس کاربران</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">مجموع محتواهای ثبت شده</span>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1 font-mono">
              {stats.total_contents}
            </div>
            <span className="text-[11px] text-slate-400">خبر، سند، مقاله و رویداد</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">اساتید و مسئولین متصل</span>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 font-mono">
              {stats.total_authorized_users}
            </div>
            <span className="text-[11px] text-slate-400">با دسترسی مدیریتی مجزا</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Comprehensive and Clear Filter & Search Control Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 space-y-5">
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  فیلتر و جستجوی پیشرفته صفحات اختصاصی
                </h3>
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                    {activeFiltersCount} فیلتر فعال
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                بر اساس عنوان، مسئول، نوع صفحه، وضعیت فعالیت و ترتیب نمایش فیلتر کنید.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {activeFiltersCount > 0 && (
              <button
                onClick={resetAllFilters}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="پاکسازی تمام فیلترها"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                پاکسازی فیلترها
              </button>
            )}

            {/* Create Button */}
            <button
              onClick={() => {
                setEditingPage(null);
                setIsWizardOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              ایجاد صفحه اختصاصی جدید
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              جستجو در صفحات
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
              <input
                type="text"
                placeholder="جستجو در عنوان صفحه، نامک (Slug)، نام یا سمت مسئول..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Page Type Selector Dropdown */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              دسته‌بندی نوع صفحه
            </label>
            <select
              value={selectedTypeFilter}
              onChange={e => setSelectedTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">همه انواع صفحات ({stats.total})</option>
              <option value="scientific_association">
                انجمن‌های علمی ({stats.by_type.scientific_association || 0})
              </option>
              <option value="cultural_club">
                کانون‌های فرهنگی ({stats.by_type.cultural_club || 0})
              </option>
              <option value="student_union">
                تشکل‌های دانشجویی ({stats.by_type.student_union || 0})
              </option>
              <option value="student_journal">
                نشریات دانشجویی ({stats.by_type.student_journal || 0})
              </option>
              <option value="faculty_member">
                صفحات اساتید و هیئت علمی ({stats.by_type.faculty_member || 0})
              </option>
            </select>
          </div>

          {/* Status Filter Dropdown */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              وضعیت فعالیت
            </label>
            <select
              value={selectedStatusFilter}
              onChange={e => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="active">فقط فعال در وب‌سایت</option>
              <option value="draft">پیش‌نویس</option>
              <option value="maintenance">در دست به‌روزرسانی</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
              مرتب‌سازی
            </label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">جدیدترین صفحات</option>
              <option value="title">حروف الفبا (عنوان)</option>
              <option value="contents">بیشترین محتوا</option>
            </select>
          </div>
        </div>

        {/* Quick Category Filter Pills */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
            دسترسی سریع به گروه‌ها:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-medium">
            <button
              onClick={() => setSelectedTypeFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedTypeFilter === 'all'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>همه صفحات</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                selectedTypeFilter === 'all' ? 'bg-blue-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {stats.total}
              </span>
            </button>

            {DEDICATED_PAGE_TYPES.map(type => {
              const count = stats.by_type[type.id] || 0;
              const isSelected = selectedTypeFilter === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedTypeFilter(type.id)}
                  className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    type.isDisabled
                      ? 'opacity-50 bg-slate-50 dark:bg-slate-800/60 text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 cursor-not-allowed'
                      : isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {type.id === 'scientific_association' && <GraduationCap className="w-3.5 h-3.5" />}
                  {type.id === 'cultural_club' && <Palette className="w-3.5 h-3.5" />}
                  {type.id === 'student_union' && <Users className="w-3.5 h-3.5" />}
                  {type.id === 'student_journal' && <BookOpen className="w-3.5 h-3.5" />}
                  {type.id === 'faculty_member' && <UserCheck className="w-3.5 h-3.5" />}
                  {type.id === 'interactive_survey' && <MessageSquare className="w-3.5 h-3.5" />}
                  {type.id === 'special_event' && <Sparkles className="w-3.5 h-3.5" />}

                  <span>{type.title}</span>

                  {type.isDisabled ? (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-normal">
                      غیرفعال
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isSelected
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filters Summary Strip */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-semibold text-[11px]">نتایج:</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              نمایش {filteredPages.length} صفحه از {paginationTotal} صفحه
            </span>
            {isFetching && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />}

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[11px] font-medium border border-blue-200 dark:border-blue-800">
                <span>جستجو: «{searchQuery}»</span>
                <button onClick={() => setSearchQuery('')} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedTypeFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[11px] font-medium border border-blue-200 dark:border-blue-800">
                <span>
                  نوع: {pageTypeRegistry.find(t => t.id === selectedTypeFilter)?.title || selectedTypeFilter}
                </span>
                <button onClick={() => setSelectedTypeFilter('all')} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedStatusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[11px] font-medium border border-blue-200 dark:border-blue-800">
                <span>
                  وضعیت: {selectedStatusFilter === 'active' ? 'فعال' : selectedStatusFilter === 'draft' ? 'پیش‌نویس' : 'تعمیر'}
                </span>
                <button onClick={() => setSelectedStatusFilter('all')} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {sortBy !== 'newest' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700">
                <span>
                  ترتیب: {sortBy === 'title' ? 'الفبایی' : 'بیشترین محتوا'}
                </span>
                <button onClick={() => setSortBy('newest')} className="hover:text-slate-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={resetAllFilters}
              className="text-blue-600 dark:text-blue-400 hover:underline text-[11px] font-medium flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              حذف همه فیلترها
            </button>
          )}
        </div>
      </div>

      {/* Dedicated Pages Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPages.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
            <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-200">صفحه اختصاصی یافت نشد</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              هیچ صفحه‌ای با فیلترها و کلمات جستجوی فعلی همخوانی ندارد.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTypeFilter('all');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-blue-600"
            >
              پاکسازی فیلترها
            </button>
          </div>
        ) : (
          filteredPages.map(page => {
            const pageTypeObj = pageTypeRegistry.find(t => t.id === page.pageType);
            const contentCount = page.contents_count ?? 0;
            const isActive = page.status === 'active';

            return (
              <div
                key={page.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
              >
                {/* Card Top Banner with Emblem */}
                <div>
                  <div className="h-28 w-full relative overflow-hidden bg-slate-800">
                    {page.featuredImage ? (
                      <img
                        src={page.featuredImage}
                        alt={page.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-80"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: page.layoutConfig?.accentColor || '#0284c7' }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <button
                        onClick={e => handleToggleStatus(page.id, e)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md transition-colors flex items-center gap-1 shadow-sm ${
                          isActive
                            ? 'bg-emerald-500/90 text-white'
                            : page.status === 'draft'
                            ? 'bg-amber-500/90 text-white'
                            : 'bg-slate-700/90 text-white'
                        }`}
                        title="تغییر وضعیت فعالیت"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-slate-300'}`} />
                        {isActive ? 'فعال در سایت' : page.status === 'draft' ? 'پیش‌نویس' : 'در دست تعمیر'}
                      </button>
                    </div>

                    {/* Type Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-white shadow-sm flex items-center gap-1"
                        style={{ backgroundColor: pageTypeObj?.color || '#0284c7' }}
                      >
                        {pageTypeObj?.title || page.pageType}
                      </span>
                    </div>

                    {/* Title — overlaid on the banner image */}
                    <div className="absolute bottom-2 right-3 left-3">
                      <h3 className="font-bold text-sm sm:text-base text-white truncate drop-shadow-md">
                        {page.title}
                      </h3>
                      {page.shortTitle && (
                        <span className="text-[11px] text-white/80 truncate block drop-shadow-md">{page.shortTitle}</span>
                      )}
                    </div>
                  </div>

                  {/* Body Info Overlap */}
                  <div className="p-5 pt-0">
                    <div className="flex items-end gap-3 -mt-9 mb-3 relative z-10">
                      <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 p-1 border-2 border-white dark:border-slate-700 shadow-lg overflow-hidden flex-shrink-0 mr-auto">
                        {page.logo ? (
                          <img src={page.logo} alt={page.title} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <div
                            className="w-full h-full rounded-xl flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: page.layoutConfig?.accentColor || '#0284c7' }}
                          >
                            {page.shortTitle ? page.shortTitle.slice(0, 2) : 'صف'}
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-4">
                      {page.shortDescription}
                    </p>

                    {/* Owner / Professor Row */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs mb-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <div>
                          <span className="text-slate-400 text-[11px] block">مسئول / مالک:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{page.owner?.name || 'تعریف نشده'}</span>
                        </div>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {page.owner?.roleTitle || 'بدون نقش'}
                      </span>
                    </div>

                    {/* Metrics Counters */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div>
                        <span className="text-slate-400 text-[10px] block">محتواها</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{contentCount}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">دسته‌ها</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                          {page.taxonomies?.length || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">مدیران فرعی</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                          {page.authorizations_count ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-4 pt-0 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPreviewPage(page)}
                      className="py-2 px-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      پیش‌نمایش سایت
                    </button>

                    <button
                      onClick={() => setModerationPage(page)}
                      className="py-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-semibold hover:bg-purple-100 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      مدیریت محتوا ({contentCount})
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => setIsolatedViewPage(page)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      ورود به پنل ایزوله صفحه
                    </button>

                    <div className="flex items-center gap-1">
                      <a
                        href={getDedicatedPagePublicUrl(page.pageType, page.slug)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="باز کردن صفحه در وب‌سایت (تب جدید)"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => {
                          setEditingPage(page);
                          setIsWizardOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="ویرایش کامل مشخصات و لایوت"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={e => handleDeletePage(page.id, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="حذف صفحه"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalItems={paginationTotal}
        perPage={PER_PAGE}
        onPageChange={setCurrentPage}
      />

      {/* 10-Step Wizard Modal */}
      <AnimatePresence>
        {isWizardOpen && (
          <PageWizardModal
            isOpen={isWizardOpen}
            onClose={() => {
              setIsWizardOpen(false);
              setEditingPage(null);
            }}
            onSavePage={handleSavePage}
            initialPage={editingPage}
            onOpenTab={onOpenTab}
          />
        )}
      </AnimatePresence>

      {/* Live Responsive Website View Modal */}
      <AnimatePresence>
        {previewPage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-6xl h-[92vh]"
            >
              <PageLiveWebsiteView
                page={previewPage}
                contents={activePageContents}
                onClose={() => setPreviewPage(null)}
                onEditPage={p => {
                  setPreviewPage(null);
                  setEditingPage(p);
                  setIsWizardOpen(true);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Content Moderation Modal */}
      <AnimatePresence>
        {moderationPage && (
          <PageContentModerationModal
            page={moderationPage}
            contents={activePageContents}
            isOpen={!!moderationPage}
            onClose={() => setModerationPage(null)}
            onUpdateContents={setActivePageContents}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!pageToDelete}
        title="حذف صفحه اختصاصی"
        message={`آیا از حذف «${pageToDelete?.title}» و تمام تنظیمات آن اطمینان دارید؟ این عملیات قابل بازگشت نیست.`}
        busy={isDeletingPage}
        onConfirm={confirmDeletePage}
        onCancel={() => setPageToDelete(null)}
      />
    </div>
  );
}
