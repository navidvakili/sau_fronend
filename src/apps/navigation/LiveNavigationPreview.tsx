import React, { useState } from 'react';
import {
  X,
  Monitor,
  Tablet,
  Smartphone,
  Globe,
  ChevronDown,
  Menu as MenuIcon,
  Search,
  User,
  Shield,
  Sparkles,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Home,
  BookOpen,
  Cpu,
  Building,
  Heart,
  FileText,
  Activity,
  Layers,
  PhoneCall,
  GraduationCap
} from 'lucide-react';
import { NavigationMenu, NavigationItem, AccessRole } from './types';

interface LiveNavigationPreviewProps {
  menus: NavigationMenu[];
  activeMenuId: string;
  onClose: () => void;
}

export const LiveNavigationPreview: React.FC<LiveNavigationPreviewProps> = ({
  menus,
  activeMenuId,
  onClose
}) => {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [direction, setDirection] = useState<'rtl' | 'ltr'>('rtl');
  const [activeRole, setActiveRole] = useState<AccessRole>('Public User');
  const [activeMegaMenuId, setActiveMegaMenuId] = useState<string | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [expandedMobileAccordions, setExpandedMobileAccordions] = useState<string[]>([]);

  // Find header main menu
  const headerMainMenu =
    menus.find(m => m.location === 'Header Main Menu') || menus[0];
  const headerTopMenu = menus.find(m => m.location === 'Header Top Menu');
  const footer1 = menus.find(m => m.location === 'Footer Menu 1');
  const mobileMenu = menus.find(m => m.location === 'Mobile Menu') || headerMainMenu;

  // Filter items by access rules
  const filterByRole = (items: NavigationItem[]): NavigationItem[] => {
    return items
      .filter(item => {
        if (item.status !== 'active') return false;
        if (!item.settings.accessRules || item.settings.accessRules.length === 0) return true;
        return item.settings.accessRules.includes(activeRole);
      })
      .map(item => ({
        ...item,
        children: item.children ? filterByRole(item.children) : undefined
      }));
  };

  const visibleHeaderItems = headerMainMenu ? filterByRole(headerMainMenu.items) : [];
  const visibleTopItems = headerTopMenu ? filterByRole(headerTopMenu.items) : [];
  const visibleFooter1Items = footer1 ? filterByRole(footer1.items) : [];
  const visibleMobileItems = mobileMenu ? filterByRole(mobileMenu.items) : [];

  const toggleMobileAccordion = (id: string) => {
    if (expandedMobileAccordions.includes(id)) {
      setExpandedMobileAccordions(expandedMobileAccordions.filter(i => i !== id));
    } else {
      setExpandedMobileAccordions([...expandedMobileAccordions, id]);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col font-sans text-right" dir="rtl">
      {/* Top Preview Control Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">پیش‌نمایش زنده و تعاملی ناوبری وبسایت</h3>
            <p className="text-[11px] text-slate-400">
              تست پاسخگویی (Responsive)، مگا منوها، زیرمنوها و قوانین دسترسی بر اساس نقش
            </p>
          </div>
        </div>

        {/* Viewport Switcher */}
        <div className="flex items-center bg-slate-800 rounded-2xl p-1 border border-slate-700">
          <button
            onClick={() => setViewport('desktop')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold transition-all ${
              viewport === 'desktop' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" /> دسکتاپ
          </button>
          <button
            onClick={() => setViewport('tablet')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold transition-all ${
              viewport === 'tablet' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" /> تبلت
          </button>
          <button
            onClick={() => setViewport('mobile')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold transition-all ${
              viewport === 'mobile' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> موبایل
          </button>
        </div>

        {/* Direction & Role Simulator */}
        <div className="flex items-center gap-3">
          {/* Direction toggle */}
          <button
            onClick={() => setDirection(direction === 'rtl' ? 'ltr' : 'rtl')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold border border-slate-700 flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5" /> جهت: {direction.toUpperCase()}
          </button>

          {/* Role selector */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
            <Shield className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-400">نقش کاربر:</span>
            <select
              value={activeRole}
              onChange={e => setActiveRole(e.target.value as AccessRole)}
              className="bg-transparent text-teal-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value="Public User" className="bg-slate-900 text-white">کاربر عادی (Public)</option>
              <option value="Student" className="bg-slate-900 text-white">دانشجو (Student)</option>
              <option value="Employee" className="bg-slate-900 text-white">کارمند (Employee)</option>
              <option value="Administrator" className="bg-slate-900 text-white">مدیر سیستم (Admin)</option>
            </select>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Container Canvas */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-950 flex justify-center">
        <div
          dir={direction}
          className={`bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl shadow-2xl transition-all duration-300 flex flex-col min-h-[700px] border border-slate-800 ${
            viewport === 'desktop'
              ? 'w-full max-w-6xl'
              : viewport === 'tablet'
              ? 'w-[768px]'
              : 'w-[380px]'
          }`}
        >
          {/* 1. TOP HEADER BAR */}
          <div className="bg-slate-900 text-slate-300 px-6 py-2 border-b border-slate-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-4">
              <span>سامانه دانشگاهی و پورتال سازمانی CMS</span>
              <span className="hidden sm:inline text-slate-500">|</span>
              <span className="hidden sm:inline text-slate-400">پشتیبانی: ۰۲۱-۸۸۸۸۴۴۲۲</span>
            </div>

            <div className="flex items-center gap-3">
              {visibleTopItems.map(item => (
                <a
                  key={item.id}
                  href={item.targetUrl}
                  onClick={e => e.preventDefault()}
                  className="hover:text-teal-400 flex items-center gap-1 transition-colors"
                >
                  {item.title}
                  {item.settings.badge?.enabled && (
                    <span className="px-1.5 py-0.2 rounded text-[8px] bg-teal-500 text-white font-extrabold">
                      {item.settings.badge.text}
                    </span>
                  )}
                </a>
              ))}
            </div>
          </div>

          {/* 2. MAIN HEADER NAVBAR */}
          <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between relative z-30">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black shadow-lg">
                CMS
              </div>
              <div>
                <h1 className="font-extrabold text-sm text-slate-900 dark:text-white">دانشگاه بین‌المللی علوم و فناوری</h1>
                <p className="text-[10px] text-slate-400">International University Portal</p>
              </div>
            </div>

            {/* Desktop Navbar Menu */}
            {viewport !== 'mobile' && (
              <nav className="hidden md:flex items-center gap-1">
                {visibleHeaderItems.map(item => {
                  const isMega = item.displayType === 'mega_menu';
                  const isDropdown = item.displayType === 'dropdown';
                  const isMegaOpen = activeMegaMenuId === item.id;
                  const isDropdownOpen = activeDropdownId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="relative"
                      onMouseEnter={() => {
                        if (isMega) setActiveMegaMenuId(item.id);
                        if (isDropdown) setActiveDropdownId(item.id);
                      }}
                      onMouseLeave={() => {
                        if (isMega) setActiveMegaMenuId(null);
                        if (isDropdown) setActiveDropdownId(null);
                      }}
                    >
                      <button
                        onClick={() => {
                          if (isMega) setActiveMegaMenuId(isMegaOpen ? null : item.id);
                          if (isDropdown) setActiveDropdownId(isDropdownOpen ? null : item.id);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isMegaOpen || isDropdownOpen
                            ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <span>{direction === 'rtl' ? item.title : item.titleEn || item.title}</span>

                        {item.settings.badge?.enabled && (
                          <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black bg-red-500 text-white">
                            {item.settings.badge.text}
                          </span>
                        )}

                        {(isMega || isDropdown) && (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>

                      {/* DROPDOWN SUBMENU */}
                      {isDropdown && isDropdownOpen && item.children && (
                        <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-2 z-50 space-y-1">
                          {item.children.map(child => (
                            <a
                              key={child.id}
                              href={child.targetUrl}
                              onClick={e => e.preventDefault()}
                              className="block p-2.5 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-950/60 transition-colors"
                            >
                              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center justify-between">
                                <span>{child.title}</span>
                                {child.settings.badge?.enabled && (
                                  <span className="px-1.5 py-0.2 rounded text-[8px] bg-amber-500 text-white">
                                    {child.settings.badge.text}
                                  </span>
                                )}
                              </div>
                              {child.settings.description && (
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {child.settings.description}
                                </p>
                              )}
                            </a>
                          ))}
                        </div>
                      )}

                      {/* MEGA MENU OVERLAY */}
                      {isMega && isMegaOpen && item.megaMenuConfig && (
                        <div className="fixed right-0 left-0 top-[130px] mx-auto max-w-5xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl p-6 z-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {item.megaMenuConfig.columns.map(col => (
                              <div key={col.id} className="space-y-3">
                                <h4 className="font-extrabold text-xs text-teal-700 dark:text-teal-400 border-b border-slate-100 dark:border-slate-700 pb-2">
                                  {col.title}
                                </h4>

                                {col.type === 'links' && (
                                  <div className="space-y-2">
                                    {(col.links || []).map(l => (
                                      <a
                                        key={l.id}
                                        href={l.url}
                                        onClick={e => e.preventDefault()}
                                        className="block p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                      >
                                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between">
                                          <span>{l.title}</span>
                                          {l.badge && (
                                            <span className="px-1.5 py-0.2 rounded text-[8px] bg-red-500 text-white font-bold">
                                              {l.badge}
                                            </span>
                                          )}
                                        </div>
                                        {l.description && (
                                          <p className="text-[10px] text-slate-400 mt-0.5">
                                            {l.description}
                                          </p>
                                        )}
                                      </a>
                                    ))}
                                  </div>
                                )}

                                {col.type === 'image' && col.imageUrl && (
                                  <div className="space-y-2">
                                    <div className="h-32 rounded-2xl overflow-hidden shadow-md">
                                      <img
                                        src={col.imageUrl}
                                        alt={col.imageAlt || 'Mega Menu Banner'}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    {col.imageCaption && (
                                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 text-center">
                                        {col.imageCaption}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            )}

            {/* Mobile Hamburger Trigger */}
            {viewport === 'mobile' && (
              <button
                onClick={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white"
              >
                <MenuIcon className="w-6 h-6" />
              </button>
            )}
          </header>

          {/* MOBILE DRAWER ACCORDION */}
          {viewport === 'mobile' && isMobileDrawerOpen && (
            <div className="bg-slate-50 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700 space-y-2">
              <div className="text-xs font-extrabold text-slate-500 mb-2">منوی موبایل (Mobile Menu)</div>
              {visibleMobileItems.map(mItem => {
                const hasChild = mItem.children && mItem.children.length > 0;
                const isExpanded = expandedMobileAccordions.includes(mItem.id);

                return (
                  <div key={mItem.id} className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-700">
                    <div
                      onClick={() => hasChild && toggleMobileAccordion(mItem.id)}
                      className="flex items-center justify-between font-bold text-xs cursor-pointer"
                    >
                      <span>{mItem.title}</span>
                      {hasChild && (
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </div>

                    {hasChild && isExpanded && (
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 pr-3">
                        {mItem.children!.map(c => (
                          <a
                            key={c.id}
                            href={c.targetUrl}
                            onClick={e => e.preventDefault()}
                            className="block text-[11px] text-slate-600 dark:text-slate-300 font-bold hover:text-teal-600"
                          >
                            • {c.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. HERO PLACEHOLDER & BREADCRUMB */}
          <main className="p-8 space-y-6 flex-1">
            {/* Breadcrumb Preview */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Home className="w-3.5 h-3.5 text-teal-600" />
              <span>صفحه اصلی</span>
              <ChevronLeft className="w-3 h-3 text-slate-300" />
              <span>پورتال خدمات الکترونیک</span>
              <ChevronLeft className="w-3 h-3 text-slate-300" />
              <span className="font-bold text-slate-800 dark:text-white">سامانه مدیریت آموزش</span>
            </div>

            {/* Page content representation */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-teal-600 to-emerald-800 text-white space-y-3 shadow-lg">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-white/20 backdrop-blur-md">
                پیش‌نمایش محتوا
              </span>
              <h2 className="text-xl font-black">پورتال دانشگاهی و سامانه یادگیری یکپارچه</h2>
              <p className="text-xs text-teal-100 leading-relaxed max-w-xl">
                با استفاده از ماژول مدیریت ناوبری (Navigation Builder)، تمام منوهای هدر، فوتر، مگامنوها و منوی موبایل به صورت کاملاً پویا و واکنش‌گرا مدیریت و منتشر می‌شوند.
              </p>
            </div>
          </main>

          {/* 4. FOOTER PREVIEW */}
          <footer className="bg-slate-900 text-slate-300 p-8 border-t border-slate-800 rounded-b-3xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
              <div className="space-y-3">
                <h4 className="font-extrabold text-white text-sm">دسترسی سریع</h4>
                <div className="space-y-1.5 text-slate-400">
                  {visibleFooter1Items.map(f => (
                    <a key={f.id} href={f.targetUrl} onClick={e => e.preventDefault()} className="block hover:text-teal-400">
                      • {f.title}
                    </a>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-extrabold text-white text-sm">سامانه‌های الکترونیک</h4>
                <div className="space-y-1.5 text-slate-400">
                  <a href="#" onClick={e => e.preventDefault()} className="block hover:text-teal-400">• سامانه سما (انتخاب واحد)</a>
                  <a href="#" onClick={e => e.preventDefault()} className="block hover:text-teal-400">• سامانه تغذیه و رزرو غذا</a>
                  <a href="#" onClick={e => e.preventDefault()} className="block hover:text-teal-400">• اتوماسیون اداری و دبیرخانه</a>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-extrabold text-white text-sm">ارتباط با دانشگاه</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  تهران، خیابان آزادی، پردیس مرکزی دانشگاه علوم و فناوری
                  <br />
                  تلفن: ۰۲۱-۶۶۵۵۴۴۳۳
                </p>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-4 text-center text-[10px] text-slate-500">
              © کلیه حقوق مادی و معنوی این وبسایت متعلق به دانشگاه علوم و فناوری می‌باشد. طراحی شده توسط سیستم مدیریت محتوای سازمانی (Enterprise CMS).
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
