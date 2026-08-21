import React, { useState } from 'react';
import { Globe, Code2, QrCode, Copy, Check, Share2, ExternalLink, Rocket } from 'lucide-react';
import { FormDefinition } from './types';
import { PUBLIC_SITE_URL } from '@/src/shared-constants';

interface FormPublishModalProps {
  form: FormDefinition;
  isOpen: boolean;
  onClose: () => void;
  /** انتشار واقعی فرم (تغییر وضعیت روی سرور) — قبل از انتشار، نشانی عمومی هنوز کار نمی‌کند */
  onPublish?: () => void;
}

export const FormPublishModal: React.FC<FormPublishModalProps> = ({ form, isOpen, onClose, onPublish }) => {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  if (!isOpen) return null;

  const isPublished = form.status === 'published';
  const directUrl = `${PUBLIC_SITE_URL}/forms/${form.slug || form.id}`;
  const shortcode = `[nima_form id="${form.id}"]`;
  const iframeCode = `<iframe src="${directUrl}" width="100%" height="600" frameborder="0" style="border:0; border-radius: 16px;"></iframe>`;

  const handleCopy = (text: string, tabId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabId);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">انتشار و جاگذاری فرم در وب‌سایت (Embed & Share)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                کد کوتاه شورتکد، لینک مستقیم یا کدهای iframe را برای وب‌سایت کپی کنید
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl font-bold">
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 text-xs">
          {/* وضعیت انتشار — قبل از انتشار، نشانی عمومی زیر روی سرور در دسترس نیست */}
          {isPublished ? (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold">
              <Check className="w-4 h-4" /> این فرم منتشر شده و نشانی زیر برای همه در دسترس است.
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
              <span className="text-amber-800 dark:text-amber-300 font-bold">
                این فرم هنوز پیش‌نویس است — تا انتشار نشود، نشانی عمومی آن باز نمی‌شود.
              </span>
              <button
                onClick={onPublish}
                disabled={!onPublish}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Rocket className="w-4 h-4" /> انتشار فرم
              </button>
            </div>
          )}

          {/* Direct Link */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Globe className="w-4 h-4 text-teal-600" /> لینک مستقیم اشتراک‌گذاری (Direct Link):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={directUrl}
                className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-left dir-ltr"
              />
              <button
                onClick={() => handleCopy(directUrl, 'link')}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-1.5 shrink-0"
              >
                {copiedTab === 'link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                کپی لینک
              </button>
            </div>
          </div>

          {/* Shortcode */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-600" /> کد کوتاه ویژه ویرایشگر متنی CMS (Shortcode):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={shortcode}
                className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-left dir-ltr font-bold text-indigo-600"
              />
              <button
                onClick={() => handleCopy(shortcode, 'shortcode')}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-1.5 shrink-0"
              >
                {copiedTab === 'shortcode' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                کپی شورتکد
              </button>
            </div>
          </div>

          {/* Iframe */}
          <div className="space-y-2">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-600" /> کد جاگذاری HTML (Iframe Embed Code):
            </label>
            <div className="flex gap-2">
              <textarea
                rows={2}
                readOnly
                value={iframeCode}
                className="flex-1 p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-left dir-ltr"
              />
              <button
                onClick={() => handleCopy(iframeCode, 'iframe')}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shrink-0"
              >
                {copiedTab === 'iframe' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                کپی کد
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
