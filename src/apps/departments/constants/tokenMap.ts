// ============================================================
// نگاشتِ توکن‌های {{...}} در قالب Page-Builder → فیلدهای واقعیِ گروه آموزشی —
// قرارداد رسمیِ «کدام توکن به کدام ستون واقعی وصل است»؛ هم دکمهٔ «درج متغیر» (فاز ۵) و هم
// ویرایشگر بصری از همین یک نگاشت می‌خوانند — منبع حقیقت واحد.
// ============================================================

import type { ImageTokenMeta, TokenFieldMeta } from '../types';

export const TOKEN_FIELD_MAP: Record<string, TokenFieldMeta> = {
  name: { label: 'نام گروه', formKey: 'name' },
  faculty: { label: 'دانشکده', formKey: 'faculty' },
  description: { label: 'توضیحات گروه', formKey: 'description' },
  headName: { label: 'نام مدیر گروه', formKey: 'head_name' },
  headTitle: { label: 'عنوان مدیر گروه', formKey: 'head_title' },
  headPhone: { label: 'تلفن مدیر گروه', formKey: 'head_phone' },
  headInternal: { label: 'داخلی مدیر گروه', formKey: 'head_internal' },
  headEmail: { label: 'ایمیل مدیر گروه', formKey: 'head_email' },
  expertName: { label: 'نام کارشناس گروه', formKey: 'expert_name' },
  expertPhone: { label: 'تلفن کارشناس گروه', formKey: 'expert_phone' },
  expertInternal: { label: 'داخلی کارشناس گروه', formKey: 'expert_internal' },
  expertEmail: { label: 'ایمیل کارشناس گروه', formKey: 'expert_email' },
  office: { label: 'اتاق گروه', formKey: 'office' },
  email: { label: 'ایمیل گروه', formKey: 'email' },
  phone: { label: 'تلفن گروه', formKey: 'phone' },
};

export const EMPTY_SCALAR_FORM: Record<string, string> = {
  name: '', faculty: '', description: '',
  head_name: '', head_title: '', head_phone: '', head_internal: '', head_email: '',
  expert_name: '', expert_phone: '', expert_internal: '', expert_email: '',
  office: '', email: '', phone: '',
};

export const DEPT_TOKEN_RE = /\{\{(\w+)\}\}/g;
export const DEPT_WIDGET_TYPES = new Set(['dept-fields', 'dept-instructors', 'dept-files']);
export const POPOVER_WIDTH = 360;
export const POPOVER_MAX_HEIGHT = 440;

/** نگاشتِ توکنِ imageUrl یک ویجت image (یا backgroundImage یک سکشن) → فیلد واقعیِ گروه —
 *  همان قرارداد {{token}} که برای متن استفاده می‌شود. توجه: «تصویر گروه» (لوگو/آواتار) و
 *  «تصویر پس‌زمینهٔ پروفایل» (بنر بخش معرفی) عمداً دو فیلد کاملاً جدا هستند تا انتخاب یکی
 *  دیگری را عوض نکند. */
export const IMAGE_TOKEN_MAP: Record<string, ImageTokenMeta> = {
  image: { label: 'تصویر گروه (لوگو)', stateKey: 'imageUrl' },
  banner: { label: 'تصویر پس‌زمینهٔ پروفایل', stateKey: 'bannerImageUrl' },
  headImage: { label: 'تصویر مدیر گروه', stateKey: 'headImageUrl' },
  expertImage: { label: 'تصویر کارشناس گروه', stateKey: 'expertImageUrl' },
};

export const IMAGE_TOKEN_RE = /^\{\{(\w+)\}\}$/;
