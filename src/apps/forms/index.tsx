// ============================================================
// FormsApp — فرم‌ساز و پرسشنامه‌ساز هوشمند
// کپی‌شده از پروژه yazdrud/demo_frontend (src/components/forms)
// ============================================================

import React from 'react';
import { SmartFormBuilderStudio } from './SmartFormBuilderStudio';

interface FormsAppProps {
  onOpenTab?: (tabId: string, title?: string) => void;
}

export default function FormsApp(props: FormsAppProps) {
  return <SmartFormBuilderStudio onOpenTab={props.onOpenTab} />;
}
