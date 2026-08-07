import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  FileText,
  Link,
  Code,
  Download,
  Trash2,
  Edit2,
  Copy,
  Check,
  Folder,
  Calendar,
  HardDrive,
  Tag as TagIcon
} from 'lucide-react';
import { GalleryAsset, Folder as FolderType, formatDate } from './types';
import { VideoPlayer } from './VideoPlayer';

interface AssetDetailsDrawerProps {
  asset: GalleryAsset;
  folders: FolderType[];
  onClose: () => void;
  onDelete: (asset: GalleryAsset) => void;
  onMove: (asset: GalleryAsset, folderId: number | null) => void;
  onOpenEditor?: () => void;
}

export const AssetDetailsDrawer: React.FC<AssetDetailsDrawerProps> = ({
  asset,
  folders,
  onClose,
  onDelete,
  onMove,
  onOpenEditor
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'embed'>('info');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(
    asset.folder_id !== null && asset.folder_id !== undefined ? String(asset.folder_id) : ''
  );

  const handleCopyCode = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const currentFolderName = folders.find((f) => String(f.id) === String(selectedFolderId))?.name;

  const isPdf =
    (asset.type || '').toLowerCase().includes('pdf') ||
    (asset.name || '').toLowerCase().endsWith('.pdf');

  const handleMoveClick = () => {
    const target = selectedFolderId === '' ? null : Number(selectedFolderId);
    onMove(asset, target);
  };

  const htmlSnippet = `<img 
  src="${asset.url}" 
  alt="${asset.name}" 
  loading="lazy" 
  decoding="async"
/>`;

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-full sm:w-[460px] bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 h-full flex flex-col shadow-2xl z-[60] select-none text-right rtl"
    >
      {/* Drawer Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold text-xs uppercase border border-teal-500/20 shrink-0">
            {asset.fileType}
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-black text-slate-900 dark:text-white truncate">
              {asset.name}
            </h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              {asset.sizeFormatted} • {asset.type}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Image / Media Header Preview */}
      <div
        className={`relative bg-slate-950/90 ${isPdf ? 'h-72' : 'h-52'} flex items-center justify-center p-3 overflow-hidden border-b border-gray-200 dark:border-slate-800`}
      >
        {asset.fileType === 'image' && (
          <img
            src={asset.url}
            alt={asset.name}
            className="max-h-full max-w-full object-contain rounded-lg shadow-lg"
          />
        )}
        {asset.fileType === 'video' && (
          <VideoPlayer
            key={asset.id}
            src={asset.url}
            className="max-h-full max-w-full rounded-lg shadow-lg overflow-hidden"
          />
        )}
        {asset.fileType === 'audio' && (
          <div className="flex flex-col items-center justify-center text-amber-500 gap-2">
            <FileText className="w-16 h-16" />
            <span className="text-xs font-mono font-bold text-white">{asset.name}</span>
            <audio src={asset.url} controls className="w-4/5" />
          </div>
        )}
        {asset.fileType === 'document' && isPdf && (
          <div className="w-full h-full flex flex-col gap-2">
            <div className="flex-1 min-h-0 overflow-hidden rounded-lg bg-white">
              <embed src={asset.url} type="application/pdf" className="w-full h-full" />
            </div>
            <a
              href={asset.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600/90 hover:bg-sky-500 text-white text-[11px] font-bold transition-all shrink-0"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>مشاهده PDF در تب جدید</span>
            </a>
          </div>
        )}
        {asset.fileType === 'document' && !isPdf && (
          <div className="flex flex-col items-center justify-center text-amber-500 gap-2">
            <FileText className="w-16 h-16" />
            <span className="text-xs font-mono font-bold text-white">{asset.name}</span>
          </div>
        )}

        {asset.fileType === 'image' && onOpenEditor && (
          <button
            onClick={onOpenEditor}
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>ویرایش تصویر</span>
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/80 p-1 text-xs font-bold">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'info'
              ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          اطلاعات فایل
        </button>

        <button
          onClick={() => setActiveTab('embed')}
          className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'embed'
              ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-xs'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          کد خروجی
        </button>
      </div>

      {/* Drawer Body Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* TAB 1: FILE INFO */}
        {activeTab === 'info' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs">
              <span className="text-[10px] text-slate-400 block mb-0.5">نام فایل</span>
              <span className="font-bold text-slate-900 dark:text-white break-all">{asset.name}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5 flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  حجم فایل
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{asset.sizeFormatted}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5 flex items-center gap-1">
                  <TagIcon className="w-3 h-3" />
                  نوع فرمت
                </span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">{asset.type}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  تاریخ بارگذاری
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatDate(asset.created_at)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5 flex items-center gap-1">
                  <Folder className="w-3 h-3" />
                  پوشه مجازی
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {currentFolderName || '— بدون پوشه —'}
                </span>
              </div>
            </div>

            {/* Move to folder */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 block font-bold">انتقال به پوشه مجازی دیگر:</span>
              <div className="flex items-center gap-2">
                <select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="">— بدون پوشه (ریشه) —</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleMoveClick}
                  className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  انتقال
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EMBED & CODES */}
        {activeTab === 'embed' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span>تگ HTML:</span>
                <button
                  onClick={() => handleCopyCode(htmlSnippet, 'html')}
                  className="text-teal-600 dark:text-teal-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'html' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  کپی تگ HTML
                </button>
              </div>
              <textarea
                readOnly
                rows={4}
                value={htmlSnippet}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-950 text-emerald-400 font-mono text-[11px] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span>لینک مستقیم فایل:</span>
                <button
                  onClick={() => handleCopyCode(asset.url, 'url')}
                  className="text-teal-600 dark:text-teal-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  کپی لینک
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={asset.url}
                  className="flex-1 p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-mono text-[11px] focus:outline-none"
                />
                <a
                  href={asset.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl text-teal-600 hover:bg-teal-500/10 transition-colors"
                  title="باز کردن در تب جدید"
                >
                  <Link className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
              <Code className="w-4 h-4 shrink-0 mt-0.5 text-teal-500" />
              <p className="leading-relaxed">
                این فایل از طریق سرویس مدیریت رسانه (Media Manager) در دسترس است. برای استفاده در صفحات پرتال، لینک مستقیم را در تگ img قرار دهید.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex items-center justify-between gap-2">
        <a
          href={asset.url}
          target="_blank"
          rel="noreferrer"
          className="flex-1 py-2.5 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>دانلود فایل</span>
        </a>

        <button
          onClick={() => onDelete(asset)}
          className="py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-red-500/20"
          title="حذف دائمی فایل"
        >
          <Trash2 className="w-4 h-4" />
          <span>حذف</span>
        </button>
      </div>
    </motion.div>
  );
};
