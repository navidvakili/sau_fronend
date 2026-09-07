import React from 'react';
import { Check, Loader2, Search, X } from 'lucide-react';
import type { PersonItem } from '@/src/shared-types';
import { dialogCardCls, dialogShellCls } from '../constants/styles';

interface InstructorsDialogProps {
  open: boolean;
  loading: boolean;
  pool: PersonItem[];
  filteredPool: PersonItem[];
  search: string;
  onSearchChange: (value: string) => void;
  selectedIds: number[];
  onToggle: (id: number) => void;
  onClose: () => void;
}

/** دیالوگ «اساتید مدعو شاخص گروه» — انتخاب چندتایی از هیات‌علمی/اساتید مدعو، با جست‌وجوی نام/تخصص/گروه/سمت */
export default function InstructorsDialog({
  open, loading, pool, filteredPool, search, onSearchChange, selectedIds, onToggle, onClose,
}: InstructorsDialogProps) {
  if (!open) return null;

  return (
    <div className={dialogShellCls} onClick={onClose}>
      <div className={dialogCardCls} onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
          <span className="text-sm font-black text-slate-900 dark:text-white">اساتید مدعو شاخص گروه</span>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        {!loading && pool.length > 0 && (
          <div className="px-5 pt-4 shrink-0">
            <div className="relative">
              <Search className="absolute top-1/2 -translate-y-1/2 right-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="جست‌وجوی نام، تخصص یا گروه..."
                className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        )}
        <div className="p-5 space-y-3 overflow-y-auto">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{selectedIds.length} نفر انتخاب شده</label>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            </div>
          ) : pool.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">هیچ عضوی از نوع هیات علمی یا استاد مدعو یافت نشد.</p>
          ) : filteredPool.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">با این جست‌وجو استادی یافت نشد.</p>
          ) : (
            <div className="space-y-1.5">
              {filteredPool.map((p) => {
                const selected = selectedIds.includes(p.id);
                const label = [p.title, p.firstName, p.lastName].filter(Boolean).join(' ') || `#${p.id}`;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onToggle(p.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-right transition-colors cursor-pointer border ${
                      selected
                        ? 'bg-emerald-500/10 border-emerald-400 text-emerald-700 dark:text-emerald-400'
                        : 'bg-slate-50 dark:bg-slate-950 border-transparent text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 shrink-0 ${selected ? 'opacity-100' : 'opacity-0'}`} />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          )}
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
