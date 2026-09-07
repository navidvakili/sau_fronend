// ============================================================
// WidgetRenderer — دیسپچر اصلیِ رندر یک ویجت (سوئیچ روی widget.type)، به‌همراه محاسبهٔ
// containerStyle مشترک (استایل لایه: رنگ/پدینگ/حاشیه/سایه/…) و اعمال فیلترهای نمایش
// (نقش کاربر، تگ URL، جستجوی متنی). پیاده‌سازی هر نوع ویجت در components/widgets/ است.
// ============================================================

import React, { cloneElement, useEffect, useState, type ReactElement } from 'react';
import { WidgetInstance, WidgetStyle, UserRoleCondition, WIDGET_TYPE_LABELS } from './builderTypes';
import type { AcademicFieldItem, PersonItem, InfoFileItem } from '@/src/shared-types';
import { ExternalLink, Info, Play, ChevronDown, ChevronUp, Plus, Sparkles, Download, FileText } from 'lucide-react';

import { useDedicatedPageAccentColor } from './hooks/useSmartData';
import {
  normalizeArabicChars,
  resolveBackgroundColor,
  resolveBorderRadius,
  resolveBoxShadow,
  isDirectVideo,
} from './utils/styleResolvers';
import { iconMap, renderTextWithIcons, resolveVariableTokens } from './utils/textAndIcons';

import { RichTextBlock, IconBoxBlock, ContainerBlock, CounterBlock, NavigatorBlock, NavMenuBlock, MapBlock, ContactInfoBlock, CustomHtmlBlock, SocialLinksBlock, ShareButtonsBlock, PricingTableBlock, TestimonialBlock } from './components/widgets/StaticBlocks';
import { ImageSliderBlock } from './components/widgets/ImageSliderBlock';
import { ChildPagesBlock } from './components/widgets/ChildPagesBlock';
import { TabsBlock } from './components/widgets/TabsBlock';
import { InteractiveMapBlock } from './components/widgets/InteractiveMapBlock';
import { ExcelTableBlock } from './components/widgets/ExcelTableBlock';
import { SearchFilterBarBlock } from './components/widgets/SearchFilterBarBlock';
import { AnnouncementsFeedWidget } from './components/widgets/AnnouncementsFeedWidget';
import { NewsFeedWidget } from './components/widgets/NewsFeedWidget';
import { ImageGalleryWidget } from './components/widgets/ImageGalleryWidget';
import { AchievementsWidget } from './components/widgets/AchievementsWidget';
import { StaffDirectoryWidget } from './components/widgets/StaffDirectoryWidget';
import { AcademicFieldsFeedWidget } from './components/widgets/AcademicFieldsFeedWidget';
import { FileManagerWidget } from './components/widgets/FileManagerWidget';
import { FormEmbedWidget } from './components/widgets/FormEmbedWidget';

import { DedicatedPageContentWidget } from './components/widgets/dedicated-page/DedicatedPageContentWidget';
import { DedicatedPageGalleryWidget } from './components/widgets/dedicated-page/DedicatedPageGalleryWidget';
import { DedicatedPageMembersWidget } from './components/widgets/dedicated-page/DedicatedPageMembersWidget';
import { DedicatedPageFacultyHeroWidget } from './components/widgets/dedicated-page/DedicatedPageFacultyHeroWidget';
import { DedicatedPageContactInfoWidget } from './components/widgets/dedicated-page/DedicatedPageContactInfoWidget';
import {
  DedicatedPageEducationWidget,
  DedicatedPageAwardsWidget,
  DedicatedPageResearchInterestsWidget,
  DedicatedPagePublicationsWidget,
  DedicatedPageBooksWidget,
} from './components/widgets/dedicated-page/DedicatedPageProfessorFactsWidgets';
import { DedicatedPageCoursesTimelineWidget } from './components/widgets/dedicated-page/DedicatedPageCoursesTimelineWidget';
import { DedicatedPageProjectsWidget } from './components/widgets/dedicated-page/DedicatedPageProjectsWidget';
import { DedicatedPageWeeklyScheduleWidget } from './components/widgets/dedicated-page/DedicatedPageWeeklyScheduleWidget';
import { DedicatedPageDocumentsWidget } from './components/widgets/dedicated-page/DedicatedPageDocumentsWidget';

interface WidgetRendererProps {
  widget: WidgetInstance;
  currentUserRole?: UserRoleCondition;
  isEditorPreview?: boolean;
  /** عمق تو در تویی رندر (برای دربرگیرنده‌ها) — جلوگیری از حلقه بی‌نهایت */
  depth?: number;
  /** شناسه و slug صفحهٔ در حال ویرایش — برای ویجت child-pages (لیست زیرصفحه‌ها) */
  pageId?: number | null;
  pageSlug?: string | null;
  /** مقدار متغیرهای صفحهٔ اختصاصی — وقتی این صفحه به یک صفحهٔ اختصاصی متصل است (برای توکن‌های {{key}} در متن) */
  variables?: Record<string, string>;
  /** شناسهٔ نمونهٔ صفحهٔ اختصاصیِ در حال پیش‌نمایش — برای بلوک‌های dp-* (وقتی این لایوت به یک نوع صفحهٔ اختصاصی متصل است) */
  dedicatedPageId?: number | null;
  /** دادهٔ گروه آموزشیِ در حال ویرایش — فقط در ویرایشگر بصری گروه (فاز ۴) ست می‌شود؛ برای رندر واقعی dept-fields/dept-instructors/dept-files */
  departmentFields?: AcademicFieldItem[];
  departmentInstructors?: PersonItem[];
  departmentInfoFiles?: InfoFileItem[];
  /** نام دستهٔ خبریِ متصل به گروه (برای نمایش placeholder قابل‌کلیک به‌جای null، وقتی ویجت
   *  news-feed با categoryFilter=current-department در بومِ ویرایشگر بصری گروه پیش‌نمایش می‌شود) */
  departmentNewsCategoryName?: string | null;
  /** شناسهٔ واقعیِ دستهٔ خبری گروه — برای رندر واقعیِ ویجت news-feed (isEditorPreview=false،
   *  مثلاً در محیط پیش‌نمایش ویرایشگر بصری گروه) وقتی categoryFilter برابر current-department است */
  departmentNewsCategoryId?: number | null;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  widget,
  currentUserRole = 'all',
  isEditorPreview = false,
  depth = 0,
  pageId,
  pageSlug,
  variables,
  dedicatedPageId,
  departmentFields,
  departmentInstructors,
  departmentInfoFiles,
  departmentNewsCategoryName,
  departmentNewsCategoryId
}) => {
  const accentColor = useDedicatedPageAccentColor(dedicatedPageId);

  // خواندن Query String فعلی — برای فیلتر بر اساس برچسب (conditionalDisplay.urlParamKey/urlParamValue)
  // با popstate به‌روز می‌شود تا تغییر آدرس (بازگشت/جلو مرورگر، یا لینک‌های فیلتر) بدون رفرش کامل اثر کند
  const [urlSearch, setUrlSearch] = useState<string>(() => (typeof window !== 'undefined' ? window.location.search : ''));
  useEffect(() => {
    const onUrlChange = () => setUrlSearch(window.location.search);
    window.addEventListener('popstate', onUrlChange);
    return () => window.removeEventListener('popstate', onUrlChange);
  }, []);

  // Check conditional display
  const cond = widget.settings.conditionalDisplay;
  // برچسب‌های این ویجت (مثلاً "field-card degree-masters faculty-humanities") — هم برای فیلتر
  // بر اساس URL استفاده می‌شوند، هم به‌عنوان class واقعی روی عنصر رندرشده اعمال می‌شوند
  const filterTags = cond?.urlParamValue?.trim();
  const filterParamKey = cond?.urlParamKey?.trim() || 'filter';
  const activeFilterValue = new URLSearchParams(urlSearch).get(filterParamKey);
  // آیا این ویجت «فعال» است؟ برای styleOnly (چیپ/تب فیلتر) — یا تطابق برچسب، یا (matchWhenEmpty)
  // نبودِ هرگونه فیلتر در URL — بدون تأثیر بر نمایش/عدم‌نمایش ویجت
  const isActiveTagMatch = cond?.matchWhenEmpty
    ? !activeFilterValue
    : !!(filterTags && activeFilterValue && filterTags.split(/\s+/).includes(activeFilterValue));

  if (cond && cond.enabled && !isEditorPreview) {
    if (cond.userRole && cond.userRole !== 'all') {
      if (currentUserRole !== 'all' && currentUserRole !== cond.userRole) {
        return (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs text-center">
            [محتوا بر اساس نقش کاربر «{cond.userRole}» فیلتر شده است]
          </div>
        );
      }
    }
    if (filterTags && activeFilterValue && !cond.styleOnly) {
      const allowedTags = filterTags.split(/\s+/);
      if (!allowedTags.includes(activeFilterValue)) {
        return null;
      }
    }
    // جستجوی متنی (substring) — مستقل از urlParamKey/urlParamValue بالا، با AND ترکیب می‌شود
    const searchParamKey = cond.searchParamKey?.trim();
    if (searchParamKey) {
      const searchQuery = normalizeArabicChars((new URLSearchParams(urlSearch).get(searchParamKey) || '').trim().toLowerCase());
      if (searchQuery && !normalizeArabicChars((cond.searchKeywords || '').toLowerCase()).includes(searchQuery)) {
        return null;
      }
    }
  }

  const style: WidgetStyle =
    cond?.enabled && cond?.styleOnly && isActiveTagMatch && widget.settings.activeStyle
      ? { ...(widget.settings.style || {}), ...widget.settings.activeStyle }
      : widget.settings.style || {};
  const binding = widget.settings.binding || { dataSource: 'none' };
  // برای خط جداکننده، borderWidth/borderColor/borderStyle/borderRadius معنای «رنگ/ضخامت/نوع
  // خودِ خط» را دارند (روی خودِ <hr> اعمال می‌شوند در case مربوطه) نه یک قاب دور بلوک —
  // پس از اعمال آن‌ها به عنوان border جعبهٔ containerStyle صرف‌نظر می‌کنیم
  const isDivider = widget.type === 'divider';

  // راست‌چین/چپ‌چین/وسط‌چین کردن ویجتِ کوچک‌تر از عرض کامل — با auto کردن حاشیهٔ سمتِ مقابل
  // (فیزیکی، نه وابسته به RTL) — همان الگوی cardAlign در icon-box؛ اگر کاربر خودش حاشیهٔ آن
  // سمت را دستی تنظیم کرده باشد، به‌جای auto همان مقدار دستی حفظ می‌شود
  const alignMarginLeft =
    style.widthMode === 'center' || style.widthMode === 'right'
      ? 'auto'
      : style.marginLeft !== undefined ? `${style.marginLeft}px` : undefined;
  const alignMarginRight =
    style.widthMode === 'center' || style.widthMode === 'left'
      ? 'auto'
      : style.marginRight !== undefined ? `${style.marginRight}px` : undefined;

  // Calculate container inline style (تنظیمات لایه — هم‌سطح slider-studio)
  const containerStyle: React.CSSProperties = {
    color: style.textColor === '{{accentColor}}' ? accentColor : style.textColor,
    backgroundColor: resolveBackgroundColor(style),
    backgroundImage: style.backgroundGradient ? style.backgroundGradient : undefined,
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    textAlign: style.textAlign,
    lineHeight: style.lineHeight !== undefined ? style.lineHeight : undefined,
    letterSpacing: style.letterSpacing !== undefined ? `${style.letterSpacing}px` : undefined,
    textTransform: style.textTransform,
    paddingTop: style.paddingTop !== undefined ? `${style.paddingTop}px` : undefined,
    paddingBottom: style.paddingBottom !== undefined ? `${style.paddingBottom}px` : undefined,
    paddingLeft: style.paddingLeft !== undefined ? `${style.paddingLeft}px` : undefined,
    paddingRight: style.paddingRight !== undefined ? `${style.paddingRight}px` : undefined,
    marginTop: style.marginTop !== undefined ? `${style.marginTop}px` : undefined,
    marginBottom: style.marginBottom !== undefined ? `${style.marginBottom}px` : undefined,
    marginLeft: alignMarginLeft,
    marginRight: alignMarginRight,
    borderRadius: isDivider ? undefined : resolveBorderRadius(style),
    borderWidth: isDivider || style.borderWidth === undefined ? undefined : `${style.borderWidth}px`,
    borderColor: isDivider ? undefined : style.borderColor,
    borderStyle: isDivider || !style.borderWidth ? undefined : (style.borderStyle || 'solid'),
    boxShadow: resolveBoxShadow(style.shadow),
    opacity: style.opacity,
    maxWidth: style.maxWidth !== undefined ? `${style.maxWidth}px` : undefined,
    maxHeight: style.maxHeight !== undefined ? `${style.maxHeight}px` : undefined,
    overflowY: style.maxHeight !== undefined ? 'auto' : undefined,
    width: style.widthMode === 'auto' || style.widthMode === 'center' || style.widthMode === 'left' || style.widthMode === 'right' ? 'fit-content' : undefined
  };

  // State for accordions
  const [accordionOpen, setAccordionOpen] = useState(false);

  // Dynamic Widget Rendering
  const renderedWidget: React.ReactNode = (() => {
  switch (widget.type) {
    // -------------------------------------------------------------
    // STATIC WIDGETS
    // -------------------------------------------------------------
    case 'heading':
      return (
        <div style={containerStyle} className="transition-all">
          <h2
            className="tracking-tight leading-tight"
            style={{
              fontSize: style.fontSize || '1.5rem',
              fontWeight: style.fontWeight || 900
            }}
          >
            {renderTextWithIcons(widget.content || widget.title, variables)}
          </h2>
        </div>
      );

    case 'text':
      return (
        <div style={containerStyle} className="transition-all leading-relaxed">
          <p
            className="whitespace-pre-line text-sm md:text-base"
            style={{ fontSize: style.fontSize || undefined }}
          >
            {renderTextWithIcons(widget.content || 'متن نمونه برای این ویجت قرار داده شده است.', variables)}
          </p>
        </div>
      );

    case 'image': {
      const frame = style.imageFrame;
      const squaredFrame = frame === 'square' || frame === 'circle';
      // شعاع گوشه فقط روی خود تصویر اعمال شود، نه روی بلوک/قالب دور آن
      const { borderRadius: _containerRadius, ...imgWrapperStyle } = containerStyle;
      return (
        <div
          style={imgWrapperStyle}
          className={`overflow-hidden transition-all ${
            squaredFrame ? 'aspect-square' : ''
          }`}
        >
          <img
            src={resolveVariableTokens(widget.imageUrl || '', variables) || '/placeholder-news.svg'}
            alt={widget.title}
            className={`transition-transform duration-300 ${
              style.imageHoverZoom !== false ? 'hover:scale-[1.02]' : ''
            } ${squaredFrame ? 'w-full h-full' : 'w-full h-auto'}`}
            style={{
              objectFit: style.objectFit || 'cover',
              borderRadius:
                frame === 'circle'
                  ? '9999px'
                  : resolveBorderRadius(style) || (frame === 'rounded' ? '16px' : undefined)
            }}
          />
        </div>
      );
    }

    case 'button': {
      // استایل ظاهری (رنگ پس‌زمینه/خط/سایه/پدینگ) فقط روی خود دکمه اعمال شود —
      // wrapper فقط چیدمان است؛ وگرنه رنگ/خطِ پشت دکمه به‌صورت باکس دیده می‌شود
      const {
        backgroundColor: _wrapBg,
        backgroundImage: _wrapBgImage,
        lineHeight: _wrapLh,
        borderRadius: _wrapBr,
        borderWidth: _wrapBw,
        borderColor: _wrapBc,
        borderStyle: _wrapBs,
        boxShadow: _wrapSh,
        paddingTop: _wrapPt,
        paddingBottom: _wrapPb,
        paddingLeft: _wrapPl,
        paddingRight: _wrapPr,
        ...buttonWrapperStyle
      } = containerStyle;
      // ترازبندی دکمه در سکشن — مثل ویجت عنوان: راست (پیش‌فرض RTL) / وسط / چپ
      const buttonJustify = style.fullWidth
        ? undefined
        : style.textAlign === 'center'
          ? 'center'
          : style.textAlign === 'left'
            ? 'flex-end'
            : 'flex-start';
      return (
        <div
          style={{
            ...buttonWrapperStyle,
            display: style.fullWidth ? undefined : 'flex',
            justifyContent: buttonJustify
          }}
          className={`transition-all ${style.fullWidth ? 'w-full' : ''}`}
        >
          <a
            href={widget.buttonUrl || '#'}
            target={widget.buttonTarget === 'new' ? '_blank' : undefined}
            rel={widget.buttonTarget === 'new' ? 'noopener noreferrer' : undefined}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 font-black text-sm transition-all ${
              style.fullWidth ? 'w-full' : ''
            }`}
            style={{
              backgroundColor: resolveBackgroundColor(style),
              backgroundImage: style.backgroundGradient ? style.backgroundGradient : undefined,
              color: style.textColor || undefined,
              borderRadius: resolveBorderRadius(style),
              borderWidth: style.borderWidth !== undefined ? `${style.borderWidth}px` : undefined,
              borderColor: style.borderColor,
              borderStyle: style.borderWidth ? (style.borderStyle || 'solid') : undefined,
              boxShadow: resolveBoxShadow(style.shadow),
              paddingTop: style.paddingTop !== undefined ? `${style.paddingTop}px` : undefined,
              paddingBottom: style.paddingBottom !== undefined ? `${style.paddingBottom}px` : undefined,
              paddingLeft: style.paddingLeft !== undefined ? `${style.paddingLeft}px` : undefined,
              paddingRight: style.paddingRight !== undefined ? `${style.paddingRight}px` : undefined,
              fontFamily: style.fontFamily,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
              letterSpacing: style.letterSpacing !== undefined ? `${style.letterSpacing}px` : undefined,
              textTransform: style.textTransform
            }}
          >
            {widget.iconName && iconMap[widget.iconName] ? (
              cloneElement(iconMap[widget.iconName] as ReactElement<any, any>, {
                className: 'w-4 h-4 shrink-0',
                key: 'btn-icon'
              })
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            <span>{widget.buttonText || widget.content || 'دکمه اقدام'}</span>
          </a>
        </div>
      );
    }

    case 'video':
      return (
        <div
          style={{
            ...containerStyle,
            aspectRatio: style.aspectRatio || '16 / 9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          className="relative overflow-hidden bg-slate-900"
        >
          {widget.videoUrl ? (
            isDirectVideo(widget.videoUrl) ? (
              <video
                src={widget.videoUrl}
                poster={style.videoPoster || undefined}
                autoPlay={style.videoAutoplay}
                loop={style.videoLoop}
                muted={style.videoMuted}
                controls={style.videoControls !== false}
                playsInline
                className="w-full h-full object-cover"
                style={{ objectFit: style.objectFit || 'cover' }}
              />
            ) : (
              <iframe
                src={widget.videoUrl}
                title={widget.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="p-4 rounded-full bg-teal-500/20 text-teal-400">
                <Play className="w-8 h-8 fill-current" />
              </div>
              <span className="text-xs font-bold">پخش‌کننده ویدیوهای آموزشی</span>
            </div>
          )}
        </div>
      );

    case 'divider': {
      // وقتی خط تراز راست/چپ/وسط دارد (widthMode !== 'full')، عرض خودِ خط کوتاه‌تر از
      // ۱۰۰٪ می‌شود (پیش‌فرض ۵۰٪ یا حداکثر عرض دستی) و بلوکِ دربرگیرنده (containerStyle)
      // با marginLeft/marginRight محاسبه‌شده در بالا آن را به همان سمت می‌چسباند
      const isAligned = style.widthMode === 'left' || style.widthMode === 'right' || style.widthMode === 'center';
      const lineWidth = isAligned ? (style.maxWidth !== undefined ? `${style.maxWidth}px` : '50%') : '100%';
      const lineBorderStyle: 'solid' | 'dashed' | 'dotted' | 'none' = style.borderStyle || 'solid';
      return (
        <div style={containerStyle} className="py-3">
          <hr
            className={!style.borderColor ? 'border-slate-200 dark:border-slate-800' : ''}
            style={{
              width: lineWidth,
              borderTopWidth: `${style.borderWidth ?? 1}px`,
              borderTopColor: style.borderColor || undefined,
              borderTopStyle: lineBorderStyle
            }}
          />
        </div>
      );
    }

    case 'spacer':
      return <div style={{ height: `${style.paddingTop || 32}px` }} />;

    case 'accordion':
      return (
        <div style={containerStyle} className="border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
          <button
            onClick={() => setAccordionOpen(!accordionOpen)}
            className="w-full p-4 flex items-center justify-between text-right font-black text-sm text-slate-900 dark:text-white cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <span>{widget.title || 'سوال یا لایه آکاردئونی'}</span>
            {accordionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {accordionOpen && (
            <div className="p-4 border-t border-gray-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-950/30">
              {widget.content || 'محتوای متنی آکاردئون در این بخش نمایش داده می‌شود.'}
            </div>
          )}
        </div>
      );

    case 'stat-card':
      return (
        <div style={containerStyle} className="p-6 rounded-2xl bg-gradient-to-br from-teal-500/10 to-indigo-500/10 border border-teal-500/20 text-right flex flex-col gap-1">
          <div className="text-xs text-teal-600 dark:text-teal-400 font-bold uppercase tracking-wider">{widget.title}</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{widget.content || '1,420+'}</div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">آمار به‌روزرسانی شده لحظه‌ای</span>
        </div>
      );

    // -------------------------------------------------------------
    // NEW STATIC BLOCKS — بلوک‌های جدید سازنده صفحه
    // -------------------------------------------------------------
    case 'richtext':
      return <RichTextBlock widget={widget} containerStyle={containerStyle} variables={variables} />;

    case 'icon-box':
      return <IconBoxBlock widget={widget} containerStyle={containerStyle} />;

    case 'vertical-container':
      return (
        <ContainerBlock
          widget={widget}
          containerStyle={containerStyle}
          vertical
          depth={depth}
          isEditorPreview={isEditorPreview}
          variables={variables}
        />
      );

    case 'horizontal-container':
      return (
        <ContainerBlock
          widget={widget}
          containerStyle={containerStyle}
          vertical={false}
          depth={depth}
          isEditorPreview={isEditorPreview}
          variables={variables}
        />
      );

    case 'image-slider':
      return <ImageSliderBlock widget={widget} containerStyle={containerStyle} isEditorPreview={isEditorPreview} />;

    case 'counter':
      return <CounterBlock widget={widget} containerStyle={containerStyle} isEditorPreview={isEditorPreview} />;

    case 'navigator':
      return <NavigatorBlock widget={widget} containerStyle={containerStyle} />;

    case 'nav-menu':
      return <NavMenuBlock widget={widget} containerStyle={containerStyle} isEditorPreview={isEditorPreview} />;

    case 'child-pages':
      return (
        <ChildPagesBlock
          widget={widget}
          containerStyle={containerStyle}
          pageId={pageId}
        />
      );

    case 'map':
      return <MapBlock widget={widget} containerStyle={containerStyle} />;

    case 'contact-info':
      return <ContactInfoBlock widget={widget} containerStyle={containerStyle} />;

    case 'custom-html':
      return <CustomHtmlBlock widget={widget} containerStyle={containerStyle} />;

    case 'social-links':
      return <SocialLinksBlock widget={widget} containerStyle={containerStyle} />;

    case 'share-buttons':
      return <ShareButtonsBlock widget={widget} containerStyle={containerStyle} />;

    case 'pricing-table':
      return <PricingTableBlock widget={widget} containerStyle={containerStyle} />;

    case 'testimonial':
      return <TestimonialBlock widget={widget} containerStyle={containerStyle} />;

    case 'callout':
      return (
        <div
          style={containerStyle}
          className="flex items-start gap-3 p-4 rounded-2xl border border-amber-300/40 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-200"
        >
          <span className="p-2 rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-300 shrink-0">
            {iconMap[widget.iconName || 'info'] || <Info className="w-5 h-5" />}
          </span>
          <div>
            <div className="text-sm font-black">{widget.title || 'یادآوری یا نکته مهم'}</div>
            <p className="text-xs leading-relaxed mt-1">{widget.content || 'این متن می‌تواند نکته، هشدار یا اطلاعیه مهم باشد.'}</p>
          </div>
        </div>
      );

    case 'icon':
      return (
        <div style={containerStyle} className="flex justify-center">
          <span className="p-4 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 inline-flex">
            {iconMap[widget.iconName || 'sparkles'] || <Sparkles className="w-6 h-6" />}
          </span>
        </div>
      );

    case 'tabs':
      return (
        <TabsBlock
          widget={widget}
          containerStyle={containerStyle}
          isEditorPreview={isEditorPreview}
          pageId={pageId}
          pageSlug={pageSlug}
          variables={variables}
          dedicatedPageId={dedicatedPageId}
        />
      );

    case 'interactive-map':
      return <InteractiveMapBlock widget={widget} containerStyle={containerStyle} />;

    case 'excel-table':
      return <ExcelTableBlock widget={widget} containerStyle={containerStyle} />;

    case 'search-filter-bar':
      return <SearchFilterBarBlock widget={widget} containerStyle={containerStyle} />;

    // -------------------------------------------------------------
    // SMART DYNAMIC WIDGETS — اتصال به وب‌سرویس‌های واقعی
    // (در حالت ویرایش فقط ساختار بلوک نمایش داده می‌شود؛ داده‌ها در پیش‌نمایش)
    // -------------------------------------------------------------
    case 'announcements-feed':
      return isEditorPreview ? null : <AnnouncementsFeedWidget widget={widget} binding={binding} containerStyle={containerStyle} />;

    case 'academic-fields-feed':
      return isEditorPreview ? null : <AcademicFieldsFeedWidget widget={widget} binding={binding} containerStyle={containerStyle} />;

    case 'news-feed':
      if (isEditorPreview && binding.categoryFilter === 'current-department') {
        return departmentNewsCategoryName ? (
          <div style={containerStyle} className="p-4 rounded-xl border border-dashed border-emerald-300 bg-emerald-500/5 text-[11px] text-emerald-700 dark:text-emerald-400 flex items-center justify-between gap-2 cursor-pointer">
            <span>اخبار گروه — دستهٔ خبری:</span>
            <span className="font-black">{departmentNewsCategoryName}</span>
          </div>
        ) : (
          <div style={containerStyle} className="p-4 rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-500/5 text-[11px] text-emerald-700 dark:text-emerald-400 text-center font-bold flex items-center justify-center gap-1.5 cursor-pointer">
            <Plus className="w-3.5 h-3.5" />
            انتخاب دستهٔ خبری گروه
          </div>
        );
      }
      return isEditorPreview ? null : (
        <NewsFeedWidget
          widget={widget}
          binding={binding}
          containerStyle={containerStyle}
          departmentNewsCategoryId={binding.categoryFilter === 'current-department' ? departmentNewsCategoryId : undefined}
        />
      );

    case 'image-gallery':
      return isEditorPreview ? null : <ImageGalleryWidget widget={widget} binding={binding} containerStyle={containerStyle} />;

    case 'achievements-timeline':
      return isEditorPreview ? null : <AchievementsWidget widget={widget} binding={binding} containerStyle={containerStyle} />;

    case 'staff-directory':
      return isEditorPreview ? null : <StaffDirectoryWidget widget={widget} binding={binding} containerStyle={containerStyle} />;

    case 'file-manager':
      return isEditorPreview ? null : <FileManagerWidget widget={widget} binding={binding} containerStyle={containerStyle} />;

    case 'form':
      return isEditorPreview ? (
        <div style={containerStyle} className="p-6 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 text-center">
          {binding.formId
            ? 'جاسازی فرم — محتوای فرم در پیش‌نمایش/انتشار نمایش داده می‌شود'
            : 'هنوز فرمی برای این بلوک انتخاب نشده — از پنل تنظیمات یک فرم منتشرشده انتخاب کنید.'}
        </div>
      ) : (
        <FormEmbedWidget binding={binding} containerStyle={containerStyle} />
      );

    // بلوک‌های صفحات اختصاصی — اتصال به یک DedicatedPage مشخص (binding.dedicatedPageId)
    case 'dp-news':
      return isEditorPreview ? null : (
        <DedicatedPageContentWidget widget={widget} binding={binding} containerStyle={containerStyle} contentType="news" dedicatedPageId={dedicatedPageId} />
      );
    case 'dp-announcements':
      return isEditorPreview ? null : (
        <DedicatedPageContentWidget widget={widget} binding={binding} containerStyle={containerStyle} contentType="announcement" dedicatedPageId={dedicatedPageId} />
      );
    case 'dp-journal-issues':
      return isEditorPreview ? null : (
        <DedicatedPageContentWidget widget={widget} binding={binding} containerStyle={containerStyle} contentType="journal_issue" dedicatedPageId={dedicatedPageId} />
      );
    case 'dp-articles':
      return isEditorPreview ? null : (
        <DedicatedPageContentWidget widget={widget} binding={binding} containerStyle={containerStyle} contentType="article" dedicatedPageId={dedicatedPageId} />
      );
    case 'dp-events':
      return isEditorPreview ? null : (
        <DedicatedPageContentWidget widget={widget} binding={binding} containerStyle={containerStyle} contentType="event" dedicatedPageId={dedicatedPageId} />
      );
    case 'dp-gallery':
      return isEditorPreview ? null : (
        <DedicatedPageGalleryWidget widget={widget} binding={binding} containerStyle={containerStyle} dedicatedPageId={dedicatedPageId} />
      );
    case 'dp-members':
      return isEditorPreview ? null : (
        <DedicatedPageMembersWidget widget={widget} binding={binding} containerStyle={containerStyle} dedicatedPageId={dedicatedPageId} />
      );

    // بلوک‌های اختصاصیِ صفحهٔ استاد (هیئت علمی) — تحصیلات/تماس/دروس/فایل‌ها و...
    case 'dp-faculty-hero':
      return isEditorPreview ? null : (
        <DedicatedPageFacultyHeroWidget containerStyle={containerStyle} dedicatedPageId={dedicatedPageId} accentColor={accentColor} />
      );
    case 'dp-contact-info':
      return isEditorPreview ? null : (
        <DedicatedPageContactInfoWidget containerStyle={containerStyle} dedicatedPageId={dedicatedPageId} accentColor={accentColor} />
      );
    case 'dp-education':
      return isEditorPreview ? null : (
        <DedicatedPageEducationWidget containerStyle={containerStyle} dedicatedPageId={dedicatedPageId} accentColor={accentColor} />
      );
    case 'dp-awards':
      return isEditorPreview ? null : (
        <DedicatedPageAwardsWidget containerStyle={containerStyle} dedicatedPageId={dedicatedPageId} />
      );
    case 'dp-research-interests':
      return isEditorPreview ? null : (
        <DedicatedPageResearchInterestsWidget containerStyle={containerStyle} dedicatedPageId={dedicatedPageId} accentColor={accentColor} />
      );
    case 'dp-publications':
      return isEditorPreview ? null : (
        <DedicatedPagePublicationsWidget containerStyle={containerStyle} dedicatedPageId={dedicatedPageId} accentColor={accentColor} />
      );
    case 'dp-books':
      return isEditorPreview ? null : (
        <DedicatedPageBooksWidget containerStyle={containerStyle} dedicatedPageId={dedicatedPageId} />
      );
    case 'dp-courses-timeline':
      return isEditorPreview ? null : (
        <DedicatedPageCoursesTimelineWidget binding={binding} containerStyle={containerStyle} dedicatedPageId={dedicatedPageId} accentColor={accentColor} />
      );
    case 'dp-projects':
      return isEditorPreview ? null : (
        <DedicatedPageProjectsWidget binding={binding} containerStyle={containerStyle} dedicatedPageId={dedicatedPageId} />
      );
    case 'dp-weekly-schedule':
      return isEditorPreview ? null : (
        <DedicatedPageWeeklyScheduleWidget containerStyle={containerStyle} dedicatedPageId={dedicatedPageId} accentColor={accentColor} />
      );
    case 'dp-documents':
      return isEditorPreview ? null : (
        <DedicatedPageDocumentsWidget containerStyle={containerStyle} dedicatedPageId={dedicatedPageId} />
      );

    // بلوک‌های قالب گروه آموزشی — همیشه به گروهِ صفحهٔ جاری وصل‌اند (بدون binding دستی).
    // در بومِ عمومیِ Page Builder (طراحی قالب مشترک) دادهٔ هیچ گروه خاصی موجود نیست → placeholder.
    // در ویرایشگر بصریِ یک گروه مشخص (فاز ۴)، Canvas این props را با دادهٔ واقعی همان گروه پر می‌کند.
    case 'dept-fields':
      return departmentFields === undefined ? (
        <div style={containerStyle} className="p-6 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-500/5 text-xs text-emerald-700 dark:text-emerald-400 text-center">
          {WIDGET_TYPE_LABELS[widget.type]} — این بلوک در صفحهٔ عمومی هر گروه آموزشی با دادهٔ همان گروه پر می‌شود
        </div>
      ) : departmentFields.length === 0 ? (
        <div style={containerStyle} className="p-4 rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-500/5 text-[11px] text-emerald-700 dark:text-emerald-400 text-center font-bold flex items-center justify-center gap-1.5 cursor-pointer">
          <Plus className="w-3.5 h-3.5" />
          افزودن رشتهٔ تحصیلی
        </div>
      ) : (
        <ul style={{ ...containerStyle, listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {departmentFields.map((field) => (
            <li key={field.id} className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {field.name}
            </li>
          ))}
        </ul>
      );

    case 'dept-instructors':
      return departmentInstructors === undefined ? (
        <div style={containerStyle} className="p-6 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-500/5 text-xs text-emerald-700 dark:text-emerald-400 text-center">
          {WIDGET_TYPE_LABELS[widget.type]} — این بلوک در صفحهٔ عمومی هر گروه آموزشی با دادهٔ همان گروه پر می‌شود
        </div>
      ) : departmentInstructors.length === 0 ? (
        <div style={containerStyle} className="p-4 rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-500/5 text-[11px] text-emerald-700 dark:text-emerald-400 text-center font-bold flex items-center justify-center gap-1.5 cursor-pointer">
          <Plus className="w-3.5 h-3.5" />
          افزودن استاد مدعو
        </div>
      ) : (
        <div style={containerStyle} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {departmentInstructors.map((person) => {
            const fullName = [person.title, person.firstName, person.lastName].filter(Boolean).join(' ') || `#${person.id}`;
            const img = person.image_url || person.image;
            return (
              <div key={person.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
                {img ? (
                  <img src={img} alt={fullName} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shrink-0">
                    <span className="text-sm font-black">{(fullName || '؟').trim().charAt(0)}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{fullName}</div>
                  {(person.rank || person.specialization) && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{[person.rank, person.specialization].filter(Boolean).join(' — ')}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );

    case 'dept-files':
      return departmentInfoFiles === undefined ? (
        <div style={containerStyle} className="p-6 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-500/5 text-xs text-emerald-700 dark:text-emerald-400 text-center">
          {WIDGET_TYPE_LABELS[widget.type]} — این بلوک در صفحهٔ عمومی هر گروه آموزشی با دادهٔ همان گروه پر می‌شود
        </div>
      ) : departmentInfoFiles.length === 0 ? (
        <div style={containerStyle} className="p-4 rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-500/5 text-[11px] text-emerald-700 dark:text-emerald-400 text-center font-bold flex items-center justify-center gap-1.5 cursor-pointer">
          <Plus className="w-3.5 h-3.5" />
          افزودن فایل اطلاعاتی
        </div>
      ) : (
        <div style={containerStyle} className="space-y-2.5">
          {departmentInfoFiles.map((file, idx) => (
            <div key={file.id ?? idx} className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{file.title || 'فایل'}</span>
              </div>
              <Download className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
            </div>
          ))}
        </div>
      );

    default:
      return (
        <div style={containerStyle} className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 text-center">
          ویجت انتخاب شده ({widget.type})
        </div>
      );
  }
  })();

  // برچسب‌ها را به‌عنوان class واقعی روی یک عنصر دربرگیرنده اعمال می‌کنیم — فقط وقتی برچسبی
  // ست شده باشد (بدون برچسب، هیچ عنصر اضافه‌ای دور ویجت اضافه نمی‌شود، یعنی صفر تغییر برای
  // ویجت‌های فعلی که از این قابلیت استفاده نمی‌کنند)
  if (filterTags) {
    return (
      <div className={filterTags} data-filter-tags={filterTags}>
        {renderedWidget}
      </div>
    );
  }

  return renderedWidget;
};
