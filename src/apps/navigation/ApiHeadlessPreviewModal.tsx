import React, { useState } from 'react';
import {
  X,
  Code,
  Copy,
  Check,
  Globe,
  Shield,
  Layers,
  Terminal,
  Server
} from 'lucide-react';
import { NavigationMenu, MenuLocation, LanguageCode, AccessRole } from './types';

interface ApiHeadlessPreviewModalProps {
  menus: NavigationMenu[];
  onClose: () => void;
}

export const ApiHeadlessPreviewModal: React.FC<ApiHeadlessPreviewModalProps> = ({
  menus,
  onClose
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<'/api/navigation/header' | '/api/navigation/footer' | '/api/navigation/mobile'>('/api/navigation/header');
  const [selectedLang, setSelectedLang] = useState<LanguageCode>('fa');
  const [selectedRole, setSelectedRole] = useState<AccessRole>('Public User');
  const [copied, setCopied] = useState(false);

  // Map endpoint to location
  const locationMap: Record<string, MenuLocation> = {
    '/api/navigation/header': 'Header Main Menu',
    '/api/navigation/footer': 'Footer Menu 1',
    '/api/navigation/mobile': 'Mobile Menu'
  };

  const targetMenu = menus.find(
    m => m.location === locationMap[selectedEndpoint] && m.language === selectedLang
  ) || menus[0];

  // Generate Headless JSON Payload
  const jsonResponse = {
    status: 'success',
    code: 200,
    meta: {
      endpoint: selectedEndpoint,
      location: targetMenu?.location || 'Header Main Menu',
      language: selectedLang,
      role: selectedRole,
      menuId: targetMenu?.id,
      version: targetMenu?.version,
      generatedAt: new Date().toISOString()
    },
    navigationTree: targetMenu?.items || []
  };

  const jsonString = JSON.stringify(jsonResponse, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans text-right" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                سرویس‌دهی Headless CMS (RESTful API Endpoint)
              </h3>
              <p className="text-xs text-slate-400">
                دریافت درخت ساختار ناوبری در قالب JSON معتبر جهت مصرف در فرانت‌اند‌های ری‌اکت، نكست، فلاتر و اپلیکیشن‌های نیتیو
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Endpoint selector */}
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-teal-400" />
            <span className="font-bold text-slate-300">Endpoint:</span>
            <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800 dir-ltr font-mono">
              {[
                '/api/navigation/header',
                '/api/navigation/footer',
                '/api/navigation/mobile'
              ].map(ep => (
                <button
                  key={ep}
                  onClick={() => setSelectedEndpoint(ep as any)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    selectedEndpoint === ep ? 'bg-teal-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {ep}
                </button>
              ))}
            </div>
          </div>

          {/* Query Params Filters */}
          <div className="flex items-center gap-3">
            {/* Language filter */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <Globe className="w-3.5 h-3.5 text-teal-400" />
              <select
                value={selectedLang}
                onChange={e => setSelectedLang(e.target.value as LanguageCode)}
                className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="fa" className="bg-slate-900">فارسی (fa)</option>
                <option value="en" className="bg-slate-900">English (en)</option>
                <option value="ar" className="bg-slate-900">العربية (ar)</option>
              </select>
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value as AccessRole)}
                className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="Public User" className="bg-slate-900">Public User</option>
                <option value="Student" className="bg-slate-900">Student</option>
                <option value="Employee" className="bg-slate-900">Employee</option>
                <option value="Administrator" className="bg-slate-900">Administrator</option>
              </select>
            </div>
          </div>
        </div>

        {/* Code JSON Viewer Body */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs relative bg-slate-950/80">
          <button
            onClick={handleCopy}
            className="absolute top-8 left-8 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl font-sans font-bold flex items-center gap-1.5 border border-slate-700 shadow transition-all z-10"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" /> کپی شد!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> کپی JSON
              </>
            )}
          </button>

          <pre className="text-teal-300 dir-ltr text-left leading-relaxed overflow-x-auto whitespace-pre-wrap">
            {jsonString}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400 font-sans">
          <span>فرمت پاسخ: <strong className="text-white font-mono">application/json (UTF-8)</strong></span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
