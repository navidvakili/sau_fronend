import React from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type { AcademicFieldItem } from '@/src/shared-types';
import { dialogCardCls, dialogShellCls, inputCls } from '../constants/styles';

interface FieldsDialogProps {
  open: boolean;
  fields: AcademicFieldItem[];
  onChange: (id: number, patch: Partial<AcademicFieldItem>) => void;
  onCreate: () => void;
  onDelete: (id: number) => void;
  onClose: () => void;
}

/** دیالوگ «رشته‌های تحصیلی گروه» — افزودن/حذف بلافاصله از طریق API واقعی؛ ویرایش نام در «ذخیره» دسته‌ای صفحه */
export default function FieldsDialog({ open, fields, onChange, onCreate, onDelete, onClose }: FieldsDialogProps) {
  if (!open) return null;

  return (
    <div className={dialogShellCls} onClick={onClose}>
      <div className={dialogCardCls} onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950 shrink-0">
          <span className="text-sm font-black text-slate-900 dark:text-white">رشته‌های تحصیلی گروه</span>
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
            افزودن رشتهٔ جدید
          </button>
          {fields.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">هنوز رشته‌ای زیر این گروه ثبت نشده است.</p>
          )}
          {fields.map((f) => (
            <div key={f.id} className="flex items-center gap-2">
              <input
                type="text"
                value={f.name}
                onChange={(e) => onChange(f.id, { name: e.target.value })}
                placeholder="نام رشته"
                className={`flex-1 ${inputCls} font-bold`}
              />
              <button
                type="button"
                onClick={() => onDelete(f.id)}
                className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white cursor-pointer shrink-0"
                title="حذف رشته"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
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
