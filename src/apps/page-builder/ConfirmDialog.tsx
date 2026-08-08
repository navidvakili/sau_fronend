import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** دیالوگ تأیید حذف (به‌جای window.confirm) */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmLabel = 'حذف',
  cancelLabel = 'انصراف',
  isBusy = false,
  onConfirm,
  onCancel
}) => (
  <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md rtl text-right">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl p-6"
    >
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-500/20 text-rose-500 border border-rose-200 dark:border-rose-500/30 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-black text-slate-900 dark:text-white">{title}</h3>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
        </div>
        <button
          onClick={onCancel}
          disabled={isBusy}
          className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-40"
          title="بستن"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-5 flex items-center justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={isBusy}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          disabled={isBusy}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait"
        >
          {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </motion.div>
  </div>
);
