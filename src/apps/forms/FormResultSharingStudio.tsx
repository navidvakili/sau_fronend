import React, { useState, useEffect } from 'react';
import {
  Share2,
  ShieldCheck,
  UserCheck,
  Globe,
  Lock,
  Eye,
  Download,
  QrCode,
  Copy,
  Plus,
  Trash2,
  Clock,
  ExternalLink,
  Sliders,
  Check
} from 'lucide-react';
import {
  FormDefinition,
  UserAccessRule,
  FormAccessPermission,
  FormReportView,
  FormShareLinkConfig
} from './types';
import { PUBLIC_SITE_URL } from '@/src/shared-constants';
import { fetchFormShareLink, updateFormShareLink } from './api';

interface FormResultSharingStudioProps {
  form: FormDefinition;
  onChange: (updatedForm: FormDefinition) => void;
  onOpenPublicPreview: () => void;
}

const ALL_PERMISSIONS: { id: FormAccessPermission; label: string; group: string }[] = [
  { id: 'view_stats', label: 'مشاهده آمار تجمیعی', group: 'آمار و نمودار' },
  { id: 'view_charts', label: 'مشاهده نمودارها', group: 'آمار و نمودار' },
  { id: 'export_excel', label: 'دریافت خروجی Excel', group: 'دریافت خروجی' },
  { id: 'export_csv', label: 'دریافت خروجی CSV', group: 'دریافت خروجی' },
  { id: 'export_pdf', label: 'دریافت خروجی PDF', group: 'دریافت خروجی' },
  { id: 'view_raw_answers', label: 'مشاهده پاسخ‌های خام', group: 'داده‌ها' },
  { id: 'view_filtered', label: 'مشاهده پاسخ‌های فیلترشده', group: 'داده‌ها' },
  { id: 'create_report', label: 'ایجاد گزارش جدید', group: 'گزارش‌گیری' },
  { id: 'print_report', label: 'چاپ گزارش', group: 'گزارش‌گیری' },
  { id: 'view_respondent_identity', label: 'مشاهده اطلاعات هویتی پاسخ‌دهندگان', group: 'محرمانه' },
  { id: 'edit_survey', label: 'ویرایش ساختار پرسشنامه', group: 'مدیریت (معمولاً لغو)' },
  { id: 'delete_survey', label: 'حذف پرسشنامه', group: 'مدیریت (معمولاً لغو)' }
];

export const FormResultSharingStudio: React.FC<FormResultSharingStudioProps> = ({
  form,
  onChange,
  onOpenPublicPreview
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'user_access' | 'public_link' | 'audit_logs'>('public_link');

  // Local state for user access rule form
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('');
  const [newUserDept, setNewUserDept] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<FormAccessPermission[]>([
    'view_stats',
    'view_charts',
    'export_excel',
    'export_pdf',
    'create_report'
  ]);

  // Local state for the form's own dedicated share link (slug + optional password/expiry)
  const [shareLink, setShareLink] = useState<FormShareLinkConfig | null>(null);
  const [isLoadingShareLink, setIsLoadingShareLink] = useState(true);
  const [isSavingShareLink, setIsSavingShareLink] = useState(false);
  const [shareSaveMessage, setShareSaveMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [slugInput, setSlugInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [expiresAtInput, setExpiresAtInput] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [qrSaveSuccess, setQrSaveSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingShareLink(true);
    fetchFormShareLink(form.id)
      .then(link => {
        if (cancelled) return;
        setShareLink(link);
        setSlugInput(link.slug);
        setExpiresAtInput(link.expiresAt ? link.expiresAt.slice(0, 10) : '');
        setPasswordInput('');
        setPasswordTouched(false);
      })
      .catch(error => {
        console.error('Failed to load form share link:', error);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingShareLink(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.id]);

  const handleSaveShareLink = async () => {
    setIsSavingShareLink(true);
    setShareSaveMessage(null);
    try {
      const payload: { slug?: string; password?: string | null; expires_at?: string | null; is_active?: boolean } = {
        slug: slugInput,
        expires_at: expiresAtInput || null,
        is_active: shareLink?.isActive ?? false
      };
      if (passwordTouched) {
        payload.password = passwordInput || null;
      }
      const updated = await updateFormShareLink(form.id, payload);
      setShareLink(updated);
      setSlugInput(updated.slug);
      setPasswordInput('');
      setPasswordTouched(false);
      setShareSaveMessage({ text: 'تنظیمات لینک با موفقیت ذخیره شد.', isError: false });
    } catch (error: any) {
      setShareSaveMessage({ text: error?.message || 'خطا در ذخیره تنظیمات لینک', isError: true });
    } finally {
      setIsSavingShareLink(false);
      setTimeout(() => setShareSaveMessage(null), 4000);
    }
  };

  const handleToggleShareLinkActive = async (isActive: boolean) => {
    setShareLink(prev => (prev ? { ...prev, isActive } : prev));
    setIsSavingShareLink(true);
    try {
      const updated = await updateFormShareLink(form.id, { is_active: isActive });
      setShareLink(updated);
    } catch (error: any) {
      setShareSaveMessage({ text: error?.message || 'خطا در تغییر وضعیت لینک', isError: true });
      setTimeout(() => setShareSaveMessage(null), 4000);
    } finally {
      setIsSavingShareLink(false);
    }
  };

  const handleRemovePassword = () => {
    setPasswordInput('');
    setPasswordTouched(true);
  };

  // Copy Public Link
  const publicUrl = `${PUBLIC_SITE_URL}/forms/share/${slugInput || shareLink?.slug || ''}`;
  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(publicUrl)}`;
  const handleSaveQrCode = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      if (!response.ok) throw new Error('QR request failed');
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${slugInput || form.id}-qr.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
      setQrSaveSuccess(true);
      setTimeout(() => setQrSaveSuccess(false), 2500);
    } catch {
      window.open(qrCodeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Add User Access Rule
  const handleAddUserRule = () => {
    if (!newUserName.trim() || !newUserRole.trim()) return;

    const newRule: UserAccessRule = {
      id: `uar_${Date.now()}`,
      userName: newUserName,
      userEmail: newUserEmail,
      userRole: newUserRole,
      department: newUserDept || 'سازمانی',
      permissions: selectedPerms,
      assignedAt: '۱۴۰۵/۰۵/۱۰',
      status: 'active'
    };

    const currentRules = form.userAccessRules || [];
    const updatedRules = [...currentRules, newRule];

    onChange({
      ...form,
      userAccessRules: updatedRules
    });

    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('');
    setNewUserDept('');
    setIsAddingUser(false);
  };

  // Remove Rule
  const handleRemoveRule = (ruleId: string) => {
    const updated = (form.userAccessRules || []).filter(r => r.id !== ruleId);
    onChange({
      ...form,
      userAccessRules: updated
    });
  };

  // Toggle permission in new user modal
  const togglePermission = (perm: FormAccessPermission) => {
    if (selectedPerms.includes(perm)) {
      setSelectedPerms(selectedPerms.filter(p => p !== perm));
    } else {
      setSelectedPerms([...selectedPerms, perm]);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-8 text-right font-sans" dir="rtl">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-inner">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                سیستم مدیریت دسترسی و انتشار نتایج (Report & Result Sharing)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                تفکیک کامل دسترسی CMS
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              تعیین سطح دسترسی اختصاصی کاربران بدون ورود به پنل مدیریت + انتشار صفحه عمومی نتایج با کنترل‌های امنیتی و محرمانه
            </p>
          </div>
        </div>

        {/* Global Public Page Launch Button */}
        <button
          onClick={onOpenPublicPreview}
          className="px-5 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
        >
          <ExternalLink className="w-4 h-4" /> پیش‌نمایش داشبورد عمومی نتایج
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1 text-xs font-bold">
        {[
          { id: 'public_link', label: 'عمومی و گزارش‌های اختصاصی', icon: Globe, badge: (form.reportViews || []).length },
          { id: 'audit_logs', label: 'لاگ مشاهده و خروجی‌ها', icon: Clock, badge: (form.reportAuditLogs || []).length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-3 rounded-2xl transition-all flex items-center gap-2 whitespace-nowrap border-b-2 ${
              activeSubTab === tab.id
                ? 'border-teal-600 text-teal-700 dark:text-teal-400 bg-teal-50/50 dark:bg-teal-950/30'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Sub-Tab 1: User & Role Granular Access Rules */}
      {activeSubTab === 'user_access' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-600" />
                تعیین دسترسی اختصاصی به شخص، کاربر یا نقش سازمانی
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                کاربران تعیین‌شده فقط به آمار و نتایج **همین یک پرسشنامه** دسترسی دارند و به هیچ بخش دیگری از CMS یا سایر فرم‌ها دسترسی نخواهند داشت.
              </p>
            </div>

            <button
              onClick={() => setIsAddingUser(true)}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" /> تخصیص دسترسی جدید
            </button>
          </div>

          {/* Add User Modal / Panel */}
          {isAddingUser && (
            <div className="bg-slate-50 dark:bg-slate-800/80 border border-teal-200 dark:border-teal-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  افزودن کاربر یا نقش سازمانی برای دریافت نتایج
                </h4>
                <button
                  onClick={() => setIsAddingUser(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  انصراف ✖
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نام و نام خانوادگی مسئول *
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: جناب آقای حسینی (مسئول فرهنگی)"
                    value={newUserName}
                    onChange={e => setNewUserName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نقش سازمانی *
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: مسئول فرهنگی / مدیر گروه آموزشی"
                    value={newUserRole}
                    onChange={e => setNewUserRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    پست الکترونیکی (جهت ورود یا ارسال لینک)
                  </label>
                  <input
                    type="email"
                    placeholder="cultural@university.ac.ir"
                    value={newUserEmail}
                    onChange={e => setNewUserEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    دپارتمان / معاونت
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: معاونت فرهنگی و دانشجویی"
                    value={newUserDept}
                    onChange={e => setNewUserDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                  />
                </div>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  تعیین دقیق سطح دسترسی اختصاصی (Granular Permissions):
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  {ALL_PERMISSIONS.map(perm => {
                    const isChecked = selectedPerms.includes(perm.id);
                    const isForbidden = perm.id === 'edit_survey' || perm.id === 'delete_survey';

                    return (
                      <label
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer border text-xs transition-all ${
                          isChecked
                            ? isForbidden
                              ? 'bg-red-50 text-red-800 border-red-300'
                              : 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 border-teal-300'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <span className="font-semibold">{isChecked ? '✓' : '✗'}</span>
                        <span className="flex-1">{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsAddingUser(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  onClick={handleAddUserRule}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
                >
                  ذخیره و اعطای دسترسی
                </button>
              </div>
            </div>
          )}

          {/* User Access Rules Table */}
          <div className="space-y-3">
            {(form.userAccessRules || []).length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-500">
                  هنوز دسترسی اختصاصی منفردی برای این پرسشنامه ثبت نشده است.
                </p>
                <p className="text-[11px] text-slate-400">
                  می‌توانید برای مسئول یا مدیر گروه، فقط دسترسی به آمار و گزارش‌های همین پرسشنامه را تعریف کنید.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    <tr>
                      <th className="p-3">کاربر / شخص</th>
                      <th className="p-3">نقش و دپارتمان</th>
                      <th className="p-3">سطوح دسترسی مجاز</th>
                      <th className="p-3">وضعیت</th>
                      <th className="p-3">تاریخ اعطا</th>
                      <th className="p-3 text-center">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(form.userAccessRules || []).map(rule => (
                      <tr key={rule.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          <div>{rule.userName}</div>
                          {rule.userEmail && <div className="text-[10px] text-slate-400 font-normal">{rule.userEmail}</div>}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          <span className="font-semibold">{rule.userRole}</span>
                          <div className="text-[10px] text-slate-400">{rule.department}</div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1 max-w-md">
                            {rule.permissions.map(p => {
                              const permObj = ALL_PERMISSIONS.find(ap => ap.id === p);
                              return (
                                <span
                                  key={p}
                                  className="px-2 py-0.5 rounded text-[10px] bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                                >
                                  ✓ {permObj ? permObj.label : p}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            فعال
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{rule.assignedAt}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleRemoveRule(rule.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                            title="لغو دسترسی"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Public Sharing Link for the Form itself (optional password/expiry) */}
      {activeSubTab === 'public_link' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-teal-600" />
                لینک عمومی اختصاصی فرم
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                یک لینک مستقل برای پر کردن همین فرم بساز — با slug دلخواه، رمز عبور اختیاری و تاریخ انقضای اختیاری
              </p>
            </div>

            {shareLink && (
              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareLink.isActive}
                    onChange={e => void handleToggleShareLinkActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                  <span className="mr-3 text-xs font-bold text-slate-800 dark:text-slate-200">
                    {shareLink.isActive ? 'لینک عمومی فعال است' : 'لینک عمومی غیرفعال است'}
                  </span>
                </label>
              </div>
            )}
          </div>

          {isLoadingShareLink ? (
            <div className="py-10 text-center text-xs font-bold text-slate-500">در حال دریافت تنظیمات لینک...</div>
          ) : (
            <>
              {/* Public URL Box */}
              <div className="p-5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-900 dark:text-teal-200">
                    آدرس اختصاصی (URL) عمومی فرم:
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-teal-300 dark:border-teal-700 shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copySuccess ? 'کپی شد! ✓' : 'کپی لینک'}
                  </button>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono text-teal-800 dark:text-teal-300 dir-ltr text-left">
                  <span>{publicUrl}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">نام Slug اختصاصی:</span>
                  <input
                    type="text"
                    value={slugInput}
                    onChange={e => setSlugInput(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono dir-ltr text-left"
                  />
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-3 text-center">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-teal-600" /> کد QR لینک فرم
                </h3>
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-40 h-40 object-contain p-2 bg-white rounded-2xl border border-slate-200 shadow-md"
                />
                <p className="text-[11px] text-slate-500">اسکن برای دسترسی سریع موبایلی به فرم</p>
                <button
                  onClick={handleSaveQrCode}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  {qrSaveSuccess ? 'ذخیره شد!' : 'ذخیره تصویر QR'}
                </button>
              </div>

              {/* Password & Expiry */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-3">
                  <Lock className="w-4 h-4 text-teal-600" /> محافظت رمز عبور و تاریخ انقضا
                </h4>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      کلمه عبور ورود (اختیاری — برای تغییر وارد کنید، برای بدون‌تغییر خالی بگذارید)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        placeholder={shareLink?.hasPassword ? 'رمز فعلی تنظیم شده — برای تغییر وارد کنید' : 'بدون رمز عبور'}
                        value={passwordInput}
                        onChange={e => {
                          setPasswordInput(e.target.value);
                          setPasswordTouched(true);
                        }}
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                      {shareLink?.hasPassword && (
                        <button
                          type="button"
                          onClick={handleRemovePassword}
                          className="px-3 py-2 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl text-[11px] font-bold border border-red-200 dark:border-red-800 whitespace-nowrap"
                        >
                          حذف رمز عبور
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">تاریخ انقضای لینک (اختیاری)</label>
                    <input
                      type="date"
                      value={expiresAtInput}
                      onChange={e => setExpiresAtInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => void handleSaveShareLink()}
                  disabled={isSavingShareLink}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  {isSavingShareLink ? (
                    'در حال ذخیره...'
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> ذخیره تنظیمات لینک
                    </>
                  )}
                </button>
                {shareSaveMessage && (
                  <span
                    className={`text-xs font-bold ${
                      shareSaveMessage.isError ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    {shareSaveMessage.text}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Sub-Tab 3: Custom Report Views */}
      {activeSubTab === 'public_link' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-teal-600" />
                ایجاد چند View یا گزارش تخصصی (Multiple Report Views)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                تعریف گزارش‌های مجزا مانند «گزارش هیئت رئیسه» یا «گزارش تفکیکی دانشکده‌ها» با لینک‌های اختصاصی
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(form.reportViews || []).map(rv => (
              <div
                key={rv.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{rv.title}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-teal-100 text-teal-800 font-bold">
                    View اختصاصی
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  لینک گزارش: <code className="text-teal-600 dir-ltr inline-block">/reports/{rv.slug}</code>
                </p>
                <div className="text-[11px] text-slate-400">تاریخ ایجاد: {rv.createdAt}</div>
                <button
                  onClick={onOpenPublicPreview}
                  className="w-full py-2 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 text-teal-700 dark:text-teal-300 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> مشاهده نمای این گزارش
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 5: Access Audit Logs */}
      {activeSubTab === 'audit_logs' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" /> لاگ جامع ثبت مشاهده و دریافت خروجی گزارش‌ها (Audit Logs)
          </h3>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                <tr>
                  <th className="p-3">کاربر / آی‌پی</th>
                  <th className="p-3">نقش</th>
                  <th className="p-3">عملیات انجام‌شده</th>
                  <th className="p-3">زمان دقیق</th>
                  <th className="p-3">توضیحات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(form.reportAuditLogs || []).map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{log.accessorName}</td>
                    <td className="p-3 text-slate-500">{log.accessorRoleOrIp}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-teal-100 text-teal-800 font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{log.timestamp}</td>
                    <td className="p-3 text-slate-500">{log.details || 'ـ'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
