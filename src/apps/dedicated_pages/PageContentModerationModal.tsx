import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Eye,
  EyeOff,
  Search,
  Filter,
  FileText,
  Calendar,
  Sparkles,
  Download,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { DedicatedPage, PageContentItem } from './types';
import { ConfirmDialog } from '@/src/shared-components/ConfirmDialog';

interface PageContentModerationModalProps {
  page: DedicatedPage;
  contents: PageContentItem[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateContents: (contents: PageContentItem[]) => void;
}

export default function PageContentModerationModal({
  page,
  contents,
  isOpen,
  onClose,
  onUpdateContents
}: PageContentModerationModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'news' | 'event' | 'document' | 'article'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');

  // New Content Form Modal / State
  const [isAddingContent, setIsAddingContent] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'news' | 'announcement' | 'event' | 'document' | 'article'>('news');
  const [newCategorySlug, setNewCategorySlug] = useState(page.taxonomies?.[0]?.slug || 'general');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');
  const [newFileSize, setNewFileSize] = useState('');
  const [newAuthor, setNewAuthor] = useState(page.owner?.name || '');
  const [contentToDelete, setContentToDelete] = useState<PageContentItem | null>(null);

  if (!isOpen) return null;

  const pageContents = contents.filter(c => c.pageId === page.id);

  const filteredContents = pageContents.filter(item => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleToggleStatus = (id: string) => {
    const updated: PageContentItem[] = contents.map(item => {
      if (item.id === id) {
        return {
          ...item,
          status: item.status === 'published' ? ('draft' as const) : ('published' as const)
        };
      }
      return item;
    });
    onUpdateContents(updated);
  };

  const handleDeleteContent = (id: string) => {
    const item = contents.find(c => c.id === id);
    if (item) setContentToDelete(item);
  };

  const confirmDeleteContent = () => {
    if (!contentToDelete) return;
    const updated = contents.filter(item => item.id !== contentToDelete.id);
    onUpdateContents(updated);
    setContentToDelete(null);
  };

  const handleSaveNewContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const matchedTax = page.taxonomies?.find(t => t.slug === newCategorySlug);
    const categoryTitle = matchedTax ? matchedTax.title : 'عمومی';

    const newItem: PageContentItem = {
      id: `cnt_${Date.now()}`,
      pageId: page.id,
      type: newType,
      title: newTitle,
      summary: newSummary,
      content: newContent,
      categorySlug: newCategorySlug,
      categoryTitle,
      publishedDate: '۱۴۰۵/۰۳/۲۵',
      author: newAuthor || page.owner?.name || '',
      status: 'published',
      views: 1,
      imageUrl: newImageUrl || undefined,
      fileUrl: newFileUrl || undefined,
      fileSize: newFileSize || undefined
    };

    onUpdateContents([...contents, newItem]);
    setIsAddingContent(false);
    // Reset Form
    setNewTitle('');
    setNewSummary('');
    setNewContent('');
    setNewImageUrl('');
    setNewFileUrl('');
    setNewFileSize('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-hidden">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[88vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
              style={{ backgroundColor: page.layoutConfig?.accentColor || '#0284c7' }}
            >
              {page.shortTitle ? page.shortTitle.slice(0, 2) : 'صف'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  مدیریت و نظارت بر محتوای صفحه: {page.title}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold">
                  {pageContents.length} آیتم
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                مشاهده، ویرایش وضعیت انتشار، فیلتر و حذف محتواهای منتشر شده
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="جستجو در عنوان، متن یا نویسنده..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300"
            >
              <option value="all">همه انواع محتوا</option>
              <option value="news">اخبار و اطلاعیه‌ها</option>
              <option value="event">رویدادها</option>
              <option value="document">اسناد و فایل‌ها</option>
              <option value="article">مقالات علمی</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="published">منتشر شده</option>
              <option value="draft">پیش‌نویس</option>
            </select>
          </div>

          <button
            onClick={() => setIsAddingContent(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            انتشار محتوای جدید در صفحه
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {filteredContents.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
              <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">محتوایی یافت نشد</h4>
              <p className="text-xs text-slate-400 mt-1">با معیارهای جستجو یا فیلتر فعلی محتوایی وجود ندارد.</p>
            </div>
          ) : (
            filteredContents.map(item => {
              const isPublished = item.status === 'published';

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {item.type === 'news' && <FileText className="w-5 h-5 text-blue-600" />}
                      {item.type === 'event' && <Calendar className="w-5 h-5 text-amber-600" />}
                      {item.type === 'document' && <Download className="w-5 h-5 text-purple-600" />}
                      {item.type === 'article' && <Sparkles className="w-5 h-5 text-emerald-600" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                          {item.categoryTitle}
                        </span>
                        <span className="text-xs text-slate-400">{item.publishedDate}</span>
                        <span className="text-xs text-slate-400">• نویسنده: {item.author}</span>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{item.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.summary}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                    <button
                      onClick={() => handleToggleStatus(item.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isPublished
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                      }`}
                      title={isPublished ? 'تغییر به پیش‌نویس (غیرفعال در سایت)' : 'انتشار عمومی'}
                    >
                      {isPublished ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          منتشر شده
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          پیش‌نویس
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteContent(item.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="حذف این محتوا"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Inner Modal: Add New Content */}
        <AnimatePresence>
          {isAddingContent && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    ایجاد و انتشار محتوای جدید در {page.shortTitle || page.title}
                  </h3>
                  <button
                    onClick={() => setIsAddingContent(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveNewContent} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        نوع محتوا *
                      </label>
                      <select
                        value={newType}
                        onChange={e => setNewType(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <option value="news">خبر / اطلاعیه</option>
                        <option value="event">رویداد / همایش / کارگاه</option>
                        <option value="document">سند دانلودی / فرم</option>
                        <option value="article">مقاله علمی / یادداشت</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        دسته‌بندی محتوا *
                      </label>
                      <select
                        value={newCategorySlug}
                        onChange={e => setNewCategorySlug(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        {(page.taxonomies || []).map(t => (
                          <option key={t.id} value={t.slug}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">عنوان محتوا *</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="عنوان خبر یا سند..."
                      required
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">چکیده / خلاصه</label>
                    <input
                      type="text"
                      value={newSummary}
                      onChange={e => setNewSummary(e.target.value)}
                      placeholder="خلاصه کوتاه جهت نمایش در کارت‌ها..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">متن کامل</label>
                    <textarea
                      rows={4}
                      value={newContent}
                      onChange={e => setNewContent(e.target.value)}
                      placeholder="شرح کامل رویداد، بیانیه یا دستورالعمل..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        آدرس تصویر شاخص
                      </label>
                      <input
                        type="text"
                        value={newImageUrl}
                        onChange={e => setNewImageUrl(e.target.value)}
                        placeholder="https://... /image.jpg"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono dir-ltr"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                        آدرس فایل دانلودی (در صورت وجود)
                      </label>
                      <input
                        type="text"
                        value={newFileUrl}
                        onChange={e => setNewFileUrl(e.target.value)}
                        placeholder="/downloads/handout.pdf"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono dir-ltr"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsAddingContent(false)}
                      className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-semibold"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md"
                    >
                      انتشار و ذخیره
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500">
          <div>در حال مدیریت محتوای {page.title}</div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-300"
          >
            بستن
          </button>
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!contentToDelete}
        title="حذف محتوا"
        message={`آیا از حذف «${contentToDelete?.title}» از صفحه اختصاصی اطمینان دارید؟`}
        onConfirm={confirmDeleteContent}
        onCancel={() => setContentToDelete(null)}
      />
    </div>
  );
}
