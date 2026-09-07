// ============================================================
// useCanvasSelection — انتخاب/تعامل با بومِ Page-Builder در ویرایشگر بصری: کدام ویجت/سکشن
// انتخاب شده، پاپ‌آور کوچکِ ویرایش متن کجا باز شود، کدام دیالوگ کامل فعال است، و انتخاب تصویر
// از رسانه برای کدام توکن در جریان است.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import type { SmartPageSchema } from '../../page-builder/builderTypes';
import { POPOVER_WIDTH } from '../constants/tokenMap';
import type { ListDialogKind } from '../types';
import { imageTokenOf, isDeptNewsWidget, knownTokensInWidget, sectionImageTokenOf } from '../utils/deptTokens';
import { findSectionById, findWidgetById } from '../utils/widgetTree';

interface UseCanvasSelectionOptions {
  /** وقتی ویجت «اساتید مدعو» انتخاب می‌شود (برای بارگذاری/ریست جست‌وجوی فهرست اساتید) */
  onOpenInstructors?: () => void;
  /** وقتی هر دیالوگی بسته می‌شود (برای ریست حالت‌های محلی مثل جست‌وجوی اساتید) */
  onCloseDialog?: () => void;
}

export function useCanvasSelection(layoutSchema: SmartPageSchema | null, options: UseCanvasSelectionOptions = {}) {
  const { onOpenInstructors, onCloseDialog } = options;

  // ===== انتخاب فعلی + پاپ‌آور ویرایش کنار همان بلوک (فقط برای فیلدهای متنی) =====
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ x: number; y: number } | null>(null);
  const lastClickPosRef = useRef({ x: 0, y: 0 });
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const contentWrapRef = useRef<HTMLDivElement | null>(null);

  // ===== دیالوگ‌های کامل برای فهرست رکوردها (رشته‌ها/مدرسان/فایل‌ها/دستهٔ خبری) =====
  const [activeDialog, setActiveDialog] = useState<ListDialogKind>(null);

  // ===== انتخاب تصویر (گروه/مدیر/کارشناس) از رسانه — pendingImageToken مشخص می‌کند کدام فیلد =====
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [pendingImageToken, setPendingImageToken] = useState<string | null>(null);

  const selectedWidget = useMemo(
    () => (layoutSchema && selectedWidgetId ? findWidgetById(layoutSchema.sections, selectedWidgetId) : null),
    [layoutSchema, selectedWidgetId]
  );

  const closePopover = () => { setPopoverPos(null); setSelectedWidgetId(null); };
  const closeDialog = () => { setActiveDialog(null); setSelectedWidgetId(null); onCloseDialog?.(); };
  const closeMediaSelector = () => { setShowMediaSelector(false); setSelectedWidgetId(null); setPendingImageToken(null); };

  const handleSelectWidget = (widgetId: string) => {
    const widget = layoutSchema ? findWidgetById(layoutSchema.sections, widgetId) : null;
    if (!widget) {
      setSelectedWidgetId(null);
      setPopoverPos(null);
      return;
    }
    // فهرستِ رکوردها (رشته‌ها/مدرسان/فایل‌ها) و دستهٔ خبری — با یک دیالوگ کامل مدیریت می‌شوند،
    // نه پاپ‌آور کوچک، چون به فضای بیشتری برای «ثبت» نیاز دارند
    if (widget.type === 'dept-fields') {
      setSelectedWidgetId(widgetId);
      setPopoverPos(null);
      setActiveDialog('fields');
      return;
    }
    if (widget.type === 'dept-instructors') {
      setSelectedWidgetId(widgetId);
      setPopoverPos(null);
      setActiveDialog('instructors');
      onOpenInstructors?.();
      return;
    }
    if (widget.type === 'dept-files') {
      setSelectedWidgetId(widgetId);
      setPopoverPos(null);
      setActiveDialog('files');
      return;
    }
    if (isDeptNewsWidget(widget)) {
      setSelectedWidgetId(widgetId);
      setPopoverPos(null);
      setActiveDialog('news');
      return;
    }
    const imgToken = imageTokenOf(widget);
    if (imgToken) {
      setSelectedWidgetId(widgetId);
      setPopoverPos(null);
      setPendingImageToken(imgToken);
      setShowMediaSelector(true);
      return;
    }
    if (knownTokensInWidget(widget).length === 0) {
      setSelectedWidgetId(null);
      setPopoverPos(null);
      return;
    }
    setSelectedWidgetId(widgetId);
    const raw = lastClickPosRef.current;
    const x = Math.min(Math.max(8, raw.x), window.innerWidth - POPOVER_WIDTH - 8);
    const y = Math.min(Math.max(8, raw.y), window.innerHeight - 80);
    setPopoverPos({ x, y });
  };

  /** کلیک روی بلوک/ویجت از داخل بوم — موقعیت کلیک را ثبت و انتخاب را اجرا می‌کند */
  const handleWidgetEditClick = (widgetId: string, e: { stopPropagation: () => void; clientX: number; clientY: number }) => {
    e.stopPropagation();
    lastClickPosRef.current = { x: e.clientX, y: e.clientY };
    handleSelectWidget(widgetId);
  };

  const handleEditSectionBackground = (sectionId: string) => {
    const section = layoutSchema ? findSectionById(layoutSchema.sections, sectionId) : null;
    const imgToken = section ? sectionImageTokenOf(section) : null;
    if (imgToken) {
      setPendingImageToken(imgToken);
      setShowMediaSelector(true);
    }
  };

  // بستن پاپ‌آور با کلیک بیرون از بوم/پاپ‌آور (مثلاً روی هدر)
  useEffect(() => {
    if (!popoverPos) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (contentWrapRef.current?.contains(target)) return;
      closePopover();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popoverPos]);

  return {
    selectedWidgetId,
    setSelectedWidgetId,
    selectedWidget,
    popoverPos,
    popoverRef,
    contentWrapRef,
    activeDialog,
    showMediaSelector,
    pendingImageToken,
    closePopover,
    closeDialog,
    closeMediaSelector,
    handleSelectWidget,
    handleWidgetEditClick,
    handleEditSectionBackground,
  };
}
