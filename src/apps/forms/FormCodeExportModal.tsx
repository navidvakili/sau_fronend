import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Code2,
  Copy,
  Check,
  Globe,
  Share2,
  Terminal,
  FileCode,
  QrCode,
  Layers,
  Sparkles
} from 'lucide-react';
import { FormDefinition } from './types';
import { PUBLIC_SITE_URL, BACKEND_API_URL } from '@/src/shared-constants';

interface FormCodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: FormDefinition;
}

export default function FormCodeExportModal({
  isOpen,
  onClose,
  form
}: FormCodeExportModalProps) {
  const [activeTab, setActiveTab] = useState<'react' | 'iframe' | 'shortcode' | 'rest' | 'link'>('react');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const directUrl = `${PUBLIC_SITE_URL}/forms/${form.slug}`;
  const shortcode = `[nima_smart_form id="${form.id}" version="${form.version}"]`;
  const iframeCode = `<iframe 
  src="${directUrl}" 
  width="100%" 
  height="700" 
  frameborder="0" 
  style="border: 0; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08);"
  allow="camera; microphone; geolocation"
  title="${form.title}">
</iframe>`;

  const reactCode = `import React from 'react';
import { SmartFormRespondent } from '@uni-cms/form-builder-react';

export default function RegistrationPage() {
  const handleFormSubmit = async (data) => {
    console.log('Submission Received:', data);
    // Send to backend API
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4" dir="rtl">
      <SmartFormRespondent
        formId="${form.id}"
        theme={{
          primaryColor: '${form.theme.primaryColor}',
          fontFamily: '${form.theme.fontFamily}'
        }}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}`;

  const restApiCode = `curl -X POST ${BACKEND_API_URL}/api/v1/forms/${form.id}/submit \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -d '{
    "respondentName": "کاربر متقاضی",
    "answers": {
      "${form.fields[0]?.id || 'field_1'}": "پاسخ نمونه"
    }
  }'`;

  const getCodeSnippet = () => {
    switch (activeTab) {
      case 'react': return reactCode;
      case 'iframe': return iframeCode;
      case 'shortcode': return shortcode;
      case 'rest': return restApiCode;
      case 'link': return directUrl;
      default: return '';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in select-none rtl text-right">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="h-16 border-b border-gray-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 flex items-center justify-center font-bold">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>دریافت کد جاگذاری و وب‌هوک سامانه</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-[10px] font-mono font-bold">
                  v2.4 Embed
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                کدهای آماده جهت ادغام آسان در React، وردپرس، HTML و وب‌سرویس‌های REST
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'react', label: 'کامپوننت React', icon: FileCode },
            { id: 'iframe', label: 'کد Iframe HTML', icon: Code2 },
            { id: 'shortcode', label: 'شورتکد CMS', icon: Sparkles },
            { id: 'rest', label: 'وب‌سرویس REST API (cURL)', icon: Terminal },
            { id: 'link', label: 'لینک مستقیم و QR', icon: Globe }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-cyan-600 text-cyan-600 dark:border-cyan-400 dark:text-cyan-400 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
              قطعه کد انتخابی برای فرم: <span className="text-cyan-600 dark:text-cyan-400 font-black">{form.title}</span>
            </span>
            <button
              onClick={handleCopy}
              className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-cyan-500/20"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'کپی شد!' : 'کپی در کلیپ‌بورد'}</span>
            </button>
          </div>

          <div className="relative">
            <pre className="p-5 bg-slate-950 text-cyan-300 dark:text-cyan-400 rounded-2xl text-xs font-mono max-h-72 overflow-y-auto dir-ltr text-left border border-slate-800 leading-relaxed shadow-inner">
              {getCodeSnippet()}
            </pre>
          </div>

          {activeTab === 'link' && (
            <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-black text-slate-900 dark:text-white block">
                  دسترسی عمومی بدون نیاز به لاگین
                </span>
                <span className="text-[11px] text-slate-500">
                  این پیوند برای پاسخ‌دهندگان مستقیم و بدون نیاز به ورود در پرتال قابل استفاده است.
                </span>
              </div>
              <a
                href={directUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0"
              >
                <Globe className="w-4 h-4" />
                <span>باز کردن در تب جدید</span>
              </a>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
