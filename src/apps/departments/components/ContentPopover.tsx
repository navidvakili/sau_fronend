import React from 'react';
import { X } from 'lucide-react';
import type { WidgetInstance } from '../../page-builder/builderTypes';
import { inputCls } from '../constants/styles';
import { POPOVER_MAX_HEIGHT, POPOVER_WIDTH, TOKEN_FIELD_MAP } from '../constants/tokenMap';
import { knownTokensInWidget } from '../utils/deptTokens';

interface ContentPopoverProps {
  position: { x: number; y: number };
  widget: WidgetInstance;
  scalarForm: Record<string, string>;
  onChange: (formKey: string, value: string) => void;
  onClose: () => void;
  popoverRef: React.RefObject<HTMLDivElement | null>;
}

/** پاپ‌آور ویرایش محتوا — فقط برای فیلدهای متنی، درست کنار بلوک کلیک‌شده روی خودِ بوم */
export default function ContentPopover({ position, widget, scalarForm, onChange, onClose, popoverRef }: ContentPopoverProps) {
  return (
    <div
      ref={popoverRef}
      className="fixed z-50 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-2xl flex flex-col select-none rtl text-right"
      style={{ left: position.x, top: position.y, width: POPOVER_WIDTH, maxHeight: POPOVER_MAX_HEIGHT }}
    >
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-slate-800 shrink-0">
        <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">ویرایش محتوا</h4>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 cursor-pointer">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto">
        {knownTokensInWidget(widget).map((token) => {
          const meta = TOKEN_FIELD_MAP[token];
          const isTextarea = token === 'description';
          return (
            <div key={token} className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{meta.label}</label>
              {isTextarea ? (
                <textarea
                  rows={4}
                  value={scalarForm[meta.formKey] || ''}
                  onChange={(e) => onChange(meta.formKey, e.target.value)}
                  className={`${inputCls} leading-relaxed`}
                />
              ) : (
                <input
                  type="text"
                  value={scalarForm[meta.formKey] || ''}
                  onChange={(e) => onChange(meta.formKey, e.target.value)}
                  className={inputCls}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
