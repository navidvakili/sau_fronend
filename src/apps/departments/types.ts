// ============================================================
// انواع (Types) مشترکِ ویرایشگر بصریِ گروه آموزشی
// ============================================================

/** نگاشتِ یک توکن متنی {{...}} به فیلد واقعیِ گروه آموزشی */
export interface TokenFieldMeta {
  label: string;
  formKey: string;
}

/** نگاشتِ یک توکن تصویری {{...}} به فیلد واقعیِ گروه آموزشی */
export interface ImageTokenMeta {
  label: string;
  stateKey: 'imageUrl' | 'headImageUrl' | 'expertImageUrl' | 'bannerImageUrl';
}

/** نوع دیالوگ کامل فعال (برای فهرست رکوردها: رشته‌ها/مدرسان/فایل‌ها/دستهٔ خبری) */
export type ListDialogKind = 'fields' | 'instructors' | 'files' | 'news' | null;

export interface VisualDataEditorProps {
  departmentId: number;
  onBack: () => void;
  onSaved: () => void;
  /** بازگشت به فرم تخت سنتی (مثلاً وقتی هنوز قالبی متصل نیست) */
  onUseFlatForm: () => void;
  onOpenTab?: (id: string, title: string, iconName: string, forceNewInstance?: boolean, initialProps?: Record<string, any>) => void;
  /** مجوز انتشار (departments.approve) — بدون آن، وضعیت همیشه پیش‌نویس ذخیره می‌شود */
  canApprove?: boolean;
}
