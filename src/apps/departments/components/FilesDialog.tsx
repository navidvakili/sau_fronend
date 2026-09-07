import React from 'react';
import { FolderOpen, Plus, Trash2, X } from 'lucide-react';
import type { InfoFileItem } from '@/src/shared-types';
import { dialogCardCls, dialogShellCls, inputCls } from '../constants/styles';

interface FilesDialogProps {
  open: boolean;
  files: InfoFileItem[];
  onChange: (index: number, patch: Partial<InfoFileItem>) => void;
  onCreate: () => void;
  onDelete: (index: number) => void;
  /** انتخاب فایل از رسانه برای ردیف با این اندیس */
  onPickMedia: (index: number) => void;
  onClose: () => void;
}

/** دیالوگ «فایل‌های اطلاعاتی گروه» — رکورد واقعی در academic_department_files، افزودن/حذف بلافاصله API واقعی */
export default function FilesDialog({ open, files, onChange, onCreate, onDelete, onPickMedia, onClose }: FilesDialogProps) {
  if (!open) return null;

  return (
    <div className={dialogShellCls} onClick={onClose}>
      <div className={dialogCardCls} onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
          <span className="text-sm font-black text-slate-900 dark:text-white">فایل‌های اطلاعاتی گروه</span>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto">
          <button
            type="button"
            onClick={onCreate}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            افزودن فایل جدید
          </button>
          {files.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">موردی ثبت نشده است.</p>
          )}
          {files.map((file, i) => (
            <div key={file.id ?? i} className="rounded-xl border border-gray-200 dark:border-slate-800 p-3 space-y-2">
              <input
                type="text"
                value={file.title}
                onChange={(e) => onChange(i, { title: e.target.value })}
                placeholder="عنوان فایل"
                className={inputCls}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onPickMedia(i)}
                  className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-right cursor-pointer hover:border-teal-500 transition-colors ${
                    file.url ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5 shrink-0 text-teal-500" />
                  <span className="truncate">{file.url ? file.url.split('/').pop() : 'انتخاب فایل از رسانه...'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(i)}
                  className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white cursor-pointer shrink-0"
                  title="حذف فایل"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end px-5 py-3.5 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black transition-colors cursor-pointer"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}
