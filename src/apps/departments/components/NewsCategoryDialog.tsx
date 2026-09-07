import React from 'react';
import { Check, Newspaper, X } from 'lucide-react';
import type { NewsCategory } from '@/src/shared-types';
import { dialogCardCls, dialogShellCls } from '../constants/styles';

interface NewsCategoryDialogProps {
  open: boolean;
  categories: NewsCategory[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onClose: () => void;
}

/** دیالوگ انتخاب دستهٔ خبریِ گروه — اخبار این دسته در بلوک «اخبار گروه» صفحه نمایش داده می‌شوند */
export default function NewsCategoryDialog({ open, categories, selectedId, onSelect, onClose }: NewsCategoryDialogProps) {
  if (!open) return null;

  return (
    <div className={dialogShellCls} onClick={onClose}>
      <div className={dialogCardCls} onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
          <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-emerald-500" />
            دستهٔ خبریِ گروه
          </span>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-2 overflow-y-auto">
          <p className="text-[11px] text-slate-400 mb-2">
            اخباری که در این دسته ثبت می‌شوند، در بلوک «اخبار گروه» این صفحه نمایش داده می‌شوند.
          </p>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-right transition-colors cursor-pointer border ${
              selectedId === null
                ? 'bg-emerald-500/10 border-emerald-400 text-emerald-700 dark:text-emerald-400'
                : 'bg-slate-50 dark:bg-slate-950 border-transparent text-slate-600 dark:text-slate-300'
            }`}
          >
            <Check className={`w-3.5 h-3.5 shrink-0 ${selectedId === null ? 'opacity-100' : 'opacity-0'}`} />
            <span>بدون اتصال (بلوک اخبار خالی می‌ماند)</span>
          </button>
          {categories.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">هیچ دستهٔ خبری‌ای یافت نشد.</p>
          ) : (
            categories.map((c) => {
              const selected = selectedId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-right transition-colors cursor-pointer border ${
                    selected
                      ? 'bg-emerald-500/10 border-emerald-400 text-emerald-700 dark:text-emerald-400'
                      : 'bg-slate-50 dark:bg-slate-950 border-transparent text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 shrink-0 ${selected ? 'opacity-100' : 'opacity-0'}`} />
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: c.color || '#10b981' }}
                  />
                  <span className="truncate">{c.name}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
