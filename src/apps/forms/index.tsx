import React from 'react';
import { SmartFormBuilderStudio } from './SmartFormBuilderStudio';

interface FormsAppProps {
  onOpenTab?: (tabId: string, title?: string) => void;
}

export default function FormsApp({ onOpenTab }: FormsAppProps) {
  return <SmartFormBuilderStudio onOpenTab={onOpenTab} />;
}
