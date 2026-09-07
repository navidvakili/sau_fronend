import React from 'react';
import { Newspaper, Pencil } from 'lucide-react';
import type { AcademicFieldItem, InfoFileItem, PersonItem } from '@/src/shared-types';
import { WidgetRenderer } from '../../page-builder/WidgetRenderer';
import type { WidgetInstance } from '../../page-builder/builderTypes';
import { TOKEN_FIELD_MAP } from '../constants/tokenMap';
import { emptyEditableTextTokens, isDeptNewsWidget, isWidgetEditable } from '../utils/deptTokens';

interface DeptWidgetRendererProps {
  widget: WidgetInstance;
  variables: Record<string, string>;
  newsCategoryId: number | null;
  pageSlug?: string;
  fieldsList: AcademicFieldItem[];
  resolvedInstructors: PersonItem[];
  filesList: InfoFileItem[];
  onEditClick: (widgetId: string, e: React.MouseEvent) => void;
}

/** رندر یک ویجت — دقیقاً همان WidgetRenderer با isEditorPreview=false (خروجی واقعیِ سایت)،
 *  فقط اگر واقعاً به فیلد/رابطهٔ واقعی گروه متصل باشد (isWidgetEditable) یک دکمهٔ آیکونی
 *  کوچکِ ویرایش کنارش نشان داده می‌شود */
export default function DeptWidgetRenderer({
  widget, variables, newsCategoryId, pageSlug, fieldsList, resolvedInstructors, filesList, onEditClick,
}: DeptWidgetRendererProps) {
  if (!widget.settings.visibility.desktop) return null;

  const editable = isWidgetEditable(widget);
  // وقتی بلوک «اخبار گروه» به هیچ دسته‌ای وصل نیست، WidgetRenderer چیزی رندر نمی‌کند (null) —
  // یعنی هیچ ناحیه‌ای برای هاور و دیدنِ دکمهٔ مدادِ ویرایش باقی نمی‌ماند و امکان اتصال دسته از
  // بین می‌رود. برای همین در همین حالت، به‌جای خروجی واقعی (خالی)، یک جای‌گیرِ همیشه‌دیده و
  // مستقیماً قابل‌کلیک نمایش داده می‌شود.
  const isEmptyDeptNews = isDeptNewsWidget(widget) && !newsCategoryId;
  // فیلد متنیِ متصل به توکن که هنوز مقدار ندارد — همان مشکل «اخبار گروه» خالی، تعمیم‌یافته
  // به هر فیلد اسکالر (name/description/headName/expertName/...): بدون این جای‌گیر، ویجت
  // کاملاً خالی رندر می‌شود و هیچ ناحیه‌ای برای هاور و پیداکردنِ دکمهٔ ویرایش باقی نمی‌ماند.
  const emptyTokens = emptyEditableTextTokens(widget, variables);
  const isEmptyEditableText = emptyTokens.length > 0;
  const openDialog = (e: React.MouseEvent) => onEditClick(widget.id, e);

  return (
    <div className="relative group/dept-widget">
      {editable && !isEmptyDeptNews && !isEmptyEditableText && (
        <button
          type="button"
          onClick={openDialog}
          className="absolute top-1/2 -translate-y-1/2 right-1.5 z-20 p-1.5 rounded-full bg-emerald-600 text-white shadow-md opacity-0 group-hover/dept-widget:opacity-100 transition-opacity cursor-pointer"
          title="ویرایش این بخش"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      {isEmptyDeptNews ? (
        <button
          type="button"
          onClick={openDialog}
          className="w-full flex items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-emerald-400/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/5 transition-colors cursor-pointer"
        >
          <Newspaper className="w-4 h-4" />
          بدون دستهٔ خبری متصل — برای اتصال کلیک کنید
        </button>
      ) : isEmptyEditableText ? (
        <button
          type="button"
          onClick={openDialog}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-emerald-400/50 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-500/5 transition-colors cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" />
          {`«${emptyTokens.map((t) => TOKEN_FIELD_MAP[t].label).join('، ')}» هنوز ثبت نشده — برای وارد کردن کلیک کنید`}
        </button>
      ) : (
        <WidgetRenderer
          widget={widget}
          currentUserRole="all"
          isEditorPreview={false}
          pageId={null}
          pageSlug={pageSlug}
          variables={variables}
          departmentFields={fieldsList}
          departmentInstructors={resolvedInstructors}
          departmentInfoFiles={filesList}
          departmentNewsCategoryId={newsCategoryId}
        />
      )}
    </div>
  );
}
