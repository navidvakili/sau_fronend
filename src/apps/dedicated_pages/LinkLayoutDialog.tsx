// ============================================================
// LinkLayoutDialog — اتصال یک نوع صفحهٔ اختصاصی (مثلاً «انجمن علمی دانشجویی»)
// به یک صفحهٔ Page Builder — لایوت مشترکِ همهٔ صفحات از این نوع
// (برای ساخت بخش «درباره» با ویجت‌های عنوان/متن و متغیرهای هر صفحه)
// ============================================================

import React, { useState, useEffect } from 'react';
import { X, LayoutTemplate, Search, Plus, Link2, Unlink, ExternalLink, Loader2, AlertCircle, Info } from 'lucide-react';
import { PageType, DEDICATED_PAGE_TYPES } from './types';
import {
  fetchSmartPages,
  createSmartPage,
  getSmartPageForDedicatedPageType,
  linkDedicatedPageType,
  unlinkDedicatedPageType,
  SmartPageDto
} from '../page-builder/api';
import { INITIAL_SMART_PAGE } from '../page-builder/mockData';

interface LinkLayoutDialogProps {
  pageType: PageType;
  pageTypeLabel: string;
  onClose: () => void;
  /** با انتخاب/ساخت لایوت، Page Builder را روی همان صفحه باز می‌کند */
  onOpenBuilder: (smartPageId: number) => void;
}

export default function LinkLayoutDialog({ pageType, pageTypeLabel, onClose, onOpenBuilder }: LinkLayoutDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linked, setLinked] = useState<{ id: number; slug: string; status: 'published' | 'draft' } | null>(null);
  const [candidates, setCandidates] = useState<SmartPageDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [linkingId, setLinkingId] = useState<number | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [existing, list] = await Promise.all([
        getSmartPageForDedicatedPageType(pageType),
        fetchSmartPages({ per_page: 100 })
      ]);
      setLinked(existing);
      // همهٔ صفحات قابل انتخاب‌اند — یک صفحه می‌تواند هم‌زمان لایوتِ چند نوع مختلف باشد
      setCandidates(list.data);
    } catch (e) {
      console.error('Error loading layout link data:', e);
      setError('خطا در بارگذاری اطلاعات. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageType]);

  const handleLink = async (smartPageId: number) => {
    setLinkingId(smartPageId);
    try {
      await linkDedicatedPageType(pageType, smartPageId);
      await load();
    } catch (e) {
      console.error('Error linking layout page:', e);
      alert('خطا در اتصال صفحه. لطفاً دوباره تلاش کنید.');
    } finally {
      setLinkingId(null);
    }
  };

  const handleUnlink = async () => {
    if (!linked) return;
    setIsUnlinking(true);
    try {
      await unlinkDedicatedPageType(pageType);
      await load();
    } catch (e) {
      console.error('Error unlinking layout page:', e);
      alert('خطا در قطع اتصال. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleCreateNew = async () => {
    setIsCreating(true);
    try {
      const created = await createSmartPage({
        title: `لایوت — ${pageTypeLabel}`,
        slug: `layout-type-${pageType.replace(/_/g, '-')}-${Date.now()}`,
        status: 'draft',
        schema: { sections: [], globalStyles: INITIAL_SMART_PAGE.globalStyles }
      });
      await linkDedicatedPageType(pageType, created.data.id!);
      onOpenBuilder(created.data.id!);
    } catch (e) {
      console.error('Error creating layout page:', e);
      alert('خطا در ایجاد صفحه. لطفاً دوباره تلاش کنید.');
      setIsCreating(false);
    }
  };

  const filteredCandidates = candidates.filter(c => {
    const term = searchQuery.trim().toLowerCase();
    return !term || c.title.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term);
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-[480px] max-w-[92vw] max-h-[80vh] bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl flex flex-col overflow-hidden text-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div>
            <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
              <LayoutTemplate className="w-4 h-4 text-teal-500" />
              <span>اتصال به Page Builder</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              لایوت مشترک بخش «درباره» برای نوع «{pageTypeLabel}»
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice — این لایوت مشترک همهٔ صفحات از این نوع است */}
        <div className="px-4 pt-3">
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>این لایوت برای همهٔ صفحات اختصاصی از نوع «{pageTypeLabel}» مشترک است — نه فقط این یک صفحه. همچنین می‌توانید همین صفحهٔ Page Builder را برای انواع دیگر هم انتخاب کنید.</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs">در حال بارگذاری...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <p className="text-xs text-slate-500">{error}</p>
              <button
                type="button"
                onClick={load}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                تلاش مجدد
              </button>
            </div>
          ) : linked ? (
            <div className="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/40 space-y-3">
              <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200 text-xs font-bold">
                <Link2 className="w-4 h-4" />
                این نوع صفحه هم‌اکنون متصل است
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-slate-500 dark:text-slate-400 dir-ltr">{linked.slug}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    linked.status === 'published'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                  }`}
                >
                  {linked.status === 'published' ? 'منتشرشده' : 'پیش‌نویس'}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenBuilder(linked.id)}
                  className="flex-1 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  ویرایش در Page Builder
                </button>
                <button
                  type="button"
                  onClick={handleUnlink}
                  disabled={isUnlinking}
                  className="px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  title="قطع اتصال (صفحهٔ Page Builder حذف نمی‌شود)"
                >
                  {isUnlinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlink className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCreateNew}
                disabled={isCreating}
                className="w-full px-4 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                ایجاد صفحهٔ لایوت جدید و اتصال
              </button>

              {candidates.length > 0 && (
                <>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                    یا اتصال به صفحهٔ موجود
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="جستجو در صفحات Page Builder..."
                      className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {filteredCandidates.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">صفحه‌ای یافت نشد.</p>
                    ) : (
                      filteredCandidates.map(c => {
                        const otherTypes = (c.dedicated_page_types || []).filter(t => t !== pageType);
                        return (
                        <div
                          key={c.id}
                          className="p-3 rounded-xl border border-gray-200 dark:border-slate-800 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{c.title}</div>
                            <div className="text-[10px] font-mono text-slate-400 dir-ltr truncate">{c.slug}</div>
                            {otherTypes.length > 0 && (
                              <div className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5 truncate">
                                هم‌اکنون لایوت: {otherTypes.map(t => DEDICATED_PAGE_TYPES.find(dt => dt.id === t)?.title || t).join('، ')}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleLink(c.id!)}
                            disabled={linkingId === c.id}
                            className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-[11px] font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            {linkingId === c.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
                            اتصال
                          </button>
                        </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
