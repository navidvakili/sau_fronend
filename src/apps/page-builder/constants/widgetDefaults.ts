// ============================================================
// New Widget / Section Defaults — مقادیر اولیهٔ ویجت‌ها و پریست‌های ستون‌بندی سکشن
// این جدول جایگزین دو زنجیرهٔ if/else تکراری (در افزودن ویجت از کنار ستون و از دیالوگ
// کامپوننت‌ها) در PageBuilderStudio شد — هر دو مسیر دقیقاً همین مقادیر را تولید می‌کردند.
// ============================================================

import { ColumnInstance, WidgetType } from '../builderTypes';
import { withWidths } from '../utils/sectionTree';

export interface NewWidgetDefaults {
  title: string;
  /** نوع داده‌ای که واقعاً روی WidgetDataBinding.dataSource ست می‌شود، به‌جز 'academic-department'
   *  که یک نوع غیررسمی (خارج از یونیون WidgetDataBinding['dataSource']) است — همان‌طور که پیش از
   *  استخراج هم بود (کد اصلی برای این مورد از `any` استفاده می‌کرد)؛ حفظ شده بدون تغییر رفتار. */
  bindingDataSource: string;
  /** فقط برای 'nav-menu' متفاوت است (خالی، بدون متن پیش‌فرض) */
  initialContent?: string;
  customProps?: Record<string, unknown>;
}

const DEFAULT_NEW_WIDGET: NewWidgetDefaults = {
  title: 'عنوان ویجت جدید',
  bindingDataSource: 'none'
};

const NEW_WIDGET_DEFAULTS: Partial<Record<WidgetType, NewWidgetDefaults>> = {
  'announcements-feed': { title: 'اطلاعیه‌های متصل به سیستم', bindingDataSource: 'announcements' },
  'news-feed': { title: 'آخرین اخبار دانشگاه', bindingDataSource: 'news' },
  'image-gallery': { title: 'گالری آلبوم تصاویر', bindingDataSource: 'gallery' },
  'achievements-timeline': { title: 'افتخارات و دستاوردها', bindingDataSource: 'awards' },
  'staff-directory': { title: 'لیست اساتید و هیئت علمی', bindingDataSource: 'staff' },
  'file-manager': { title: 'مخزن اسناد و فرم‌ها', bindingDataSource: 'files' },
  'academic-fields-feed': { title: 'لیست رشته‌های تحصیلی', bindingDataSource: 'academic-fields' },
  form: { title: 'فرم پیوست‌شده از فرم‌ساز', bindingDataSource: 'form' },
  'dp-news': { title: 'خبرهای صفحهٔ اختصاصی', bindingDataSource: 'dedicated-page' },
  'dp-announcements': { title: 'اطلاعیه‌های صفحهٔ اختصاصی', bindingDataSource: 'dedicated-page' },
  'dp-journal-issues': { title: 'نسخه‌های نشریه', bindingDataSource: 'dedicated-page' },
  'dp-articles': { title: 'فهرست مقالات صفحهٔ اختصاصی', bindingDataSource: 'dedicated-page' },
  'dp-gallery': { title: 'گالری تصاویر صفحهٔ اختصاصی', bindingDataSource: 'dedicated-page' },
  'dp-events': { title: 'رویدادهای صفحهٔ اختصاصی', bindingDataSource: 'dedicated-page' },
  'dp-members': { title: 'اعضای شورا و کادر اجرایی', bindingDataSource: 'dedicated-page' },
  'dp-faculty-hero': { title: 'هدر غنی صفحهٔ استاد', bindingDataSource: 'dedicated-page' },
  'dp-contact-info': { title: 'اطلاعات تماس صفحه', bindingDataSource: 'dedicated-page' },
  'dp-education': { title: 'تحصیلات', bindingDataSource: 'dedicated-page' },
  'dp-awards': { title: 'افتخارات و جوایز علمی', bindingDataSource: 'dedicated-page' },
  'dp-research-interests': { title: 'علایق پژوهشی', bindingDataSource: 'dedicated-page' },
  'dp-courses-timeline': { title: 'تایم‌لاین دروس ارائه‌شده', bindingDataSource: 'dedicated-page' },
  'dp-weekly-schedule': { title: 'برنامه هفتگی ترم جاری', bindingDataSource: 'dedicated-page' },
  'dp-publications': { title: 'مقالات منتشرشده', bindingDataSource: 'dedicated-page' },
  'dp-books': { title: 'کتب تألیف‌شده', bindingDataSource: 'dedicated-page' },
  'dp-projects': { title: 'پروژه‌های تحقیقاتی', bindingDataSource: 'dedicated-page' },
  'dp-documents': { title: 'فایل‌های درس', bindingDataSource: 'dedicated-page' },
  'dept-fields': { title: 'رشته‌های تحصیلی گروه', bindingDataSource: 'academic-department' },
  'dept-instructors': { title: 'اساتید مدعو شاخص گروه', bindingDataSource: 'academic-department' },
  'dept-files': { title: 'فایل‌های اطلاعاتی گروه', bindingDataSource: 'academic-department' },
  tabs: { title: 'تب‌های محتوا', bindingDataSource: 'none' },
  'interactive-map': { title: 'نقشه تعاملی پردیس‌ها', bindingDataSource: 'none' },
  'excel-table': { title: 'جدول وارد شده از اکسل', bindingDataSource: 'none' },
  'search-filter-bar': {
    title: 'نوار جستجو و فیلتر',
    bindingDataSource: 'none',
    customProps: { searchParamKey: 'q', categoryParamKey: 'dept', categoryLabel: 'دانشکده' }
  },
  'nav-menu': { title: 'عنوان ویجت جدید', bindingDataSource: 'none', initialContent: '' }
};

/** مقادیر اولیهٔ عنوان/منبع‌دادهٔ یک ویجت تازه — فالبک به عنوان عمومی و بدون اتصال داده */
export const getNewWidgetDefaults = (widgetType: WidgetType): NewWidgetDefaults =>
  NEW_WIDGET_DEFAULTS[widgetType] ?? DEFAULT_NEW_WIDGET;

export type SectionColumnPreset = '1col' | '2col' | '3col' | '4col' | '7-5' | '8-4';

const PRESET_WIDTHS: Record<SectionColumnPreset, number[]> = {
  '1col': [12],
  '2col': [6, 6],
  '3col': [4, 4, 4],
  '4col': [3, 3, 3, 3],
  '7-5': [7, 5],
  '8-4': [8, 4]
};

/** ستون‌های یک سکشن تازه برای یک پریست چیدمان — با عرض واکنش‌گرای پیش‌فرض (موبایل تک‌ستونه) */
export const buildColumnsForPreset = (preset: SectionColumnPreset): ColumnInstance[] => {
  const stamp = Date.now();
  return PRESET_WIDTHS[preset].map((width, idx) => ({
    id: `col-${stamp}-${idx + 1}`,
    width,
    widths: withWidths(width),
    widgets: [],
    subSections: []
  }));
};

/** عرض‌های هدف ستون‌های یک سکشن موجود هنگام تغییر پریست چیدمان (بدون ساخت id تازه) */
export const getTargetWidthsForPreset = (preset: SectionColumnPreset): number[] => PRESET_WIDTHS[preset];
