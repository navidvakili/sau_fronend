export type FormType = 'form' | 'survey' | 'quiz' | 'registration';

export type FormStatus = 'draft' | 'published' | 'paused' | 'archived';

export type FieldCategory = 'basic' | 'advanced' | 'survey' | 'special';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'phone'
  | 'password'
  | 'url'
  | 'date'
  | 'time'
  | 'datetime'
  | 'checkbox'
  | 'radio'
  | 'select'
  | 'multiselect'
  | 'switch'
  | 'file'
  | 'image'
  | 'richtext'
  | 'slider'
  | 'rating'
  | 'matrix'
  | 'likert'
  | 'ranking'
  | 'yesno'
  | 'color'
  | 'location'
  | 'cascading'
  | 'signature'
  | 'captcha'
  | 'qrcode'
  | 'hidden'
  | 'calculated';

export interface FieldOption {
  id: string;
  label: string;
  value: string;
  score?: number; // Score points for quiz
}

export interface MatrixRow {
  id: string;
  label: string;
}

export interface MatrixColumn {
  id: string;
  label: string;
  score?: number;
}

export interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  regexPattern?: string;
  allowedExtensions?: string[]; // e.g. ['.pdf', '.jpg']
  maxFileSizeMb?: number;
  customErrorMessage?: string;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  options?: FieldOption[];
  matrixRows?: MatrixRow[];
  matrixCols?: MatrixColumn[];
  validation?: FieldValidation;
  columnWidth?: '100%' | '50%' | '33%' | '25%'; // Responsive width
  stepId?: string; // Step page assignment
  points?: number; // Base points for correct answer in quiz
  correctAnswer?: string | string[]; // For quizzes
  formula?: string; // For calculated fields, e.g. "field_1 * 0.15 + field_2"
  cascadingParentId?: string;
  cascadingData?: Record<string, string[]>; // e.g. {"تهران": ["تهران", "ری"], "اصفهان": ["اصفهان", "کاشان"]}
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  order: number;
}

export type LogicOperator = 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';

export type LogicAction = 'show_field' | 'hide_field' | 'skip_to_step' | 'end_survey' | 'set_value' | 'set_score';

export interface LogicRule {
  id: string;
  fieldId: string;
  operator: LogicOperator;
  value: any;
  action: LogicAction;
  targetId?: string; // Field ID or Step ID
  actionValue?: any;
}

export interface GradeThreshold {
  id: string;
  minScore: number;
  maxScore: number;
  gradeLabel: string; // e.g., 'عالی', 'خوب', 'متوسط', 'ضعیف'
  feedbackText: string;
  color: string;
}

export interface FormQuizConfig {
  isQuiz: boolean;
  showInstantResult: boolean;
  timeLimitMinutes?: number;
  allowNegativeScore: boolean;
  randomizeQuestions: boolean;
  passScore?: number;
  gradeThresholds: GradeThreshold[];
}

export interface FormTheme {
  primaryColor: string;
  backgroundColor: string;
  cardColor: string;
  textColor: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  fontFamily: string;
  showLogo: boolean;
  logoUrl?: string;
}

export interface FormSettings {
  allowAnonymous: boolean;
  limitOnePerUser: boolean;
  requireAuth: boolean;
  enableCaptcha: boolean;
  enableAutoSave: boolean;
  showProgressBar: boolean;
  customSuccessMessage: string;
  redirectUrl?: string;
  generateTrackingCode: boolean;
  trackingCodePrefix: string;
  expirationDate?: string;
  maxSubmissions?: number;
  sendEmailNotification: boolean;
  notificationEmail?: string;
  sendSmsNotification: boolean;
  notificationPhone?: string;
}

export type FormAccessPermission =
  | 'view_stats'
  | 'view_charts'
  | 'export_excel'
  | 'export_csv'
  | 'export_pdf'
  | 'view_raw_answers'
  | 'view_filtered'
  | 'create_report'
  | 'print_report'
  | 'edit_survey'
  | 'delete_survey'
  | 'view_respondent_identity';

export interface UserAccessRule {
  id: string;
  userName: string;
  userEmail?: string;
  userRole: string; // e.g. 'مسئول فرهنگی', 'استاد درس'
  department?: string;
  permissions: FormAccessPermission[];
  assignedAt: string;
  expiresAt?: string;
  status: 'active' | 'suspended';
  notes?: string;
}

export interface PublicResultConfig {
  enabled: boolean;
  customSlug: string; // e.g., 'student-cultural-satisfaction'
  title: string;
  description: string;
  universityBrand: string;
  showLogo: boolean;
  logoUrl?: string;
  passwordProtected: boolean;
  password?: string;
  expirationDate?: string;
  startDate?: string;
  endDate?: string;
  ipRestrictionsEnabled: boolean;
  allowedIps: string[]; // e.g. ['192.168.1.*', '10.0.0.*']
  anonymizeRespondents: boolean;
  allowedQuestionIds: string[]; // Selected questions visible to public
  allowedExportTypes: ('pdf' | 'excel' | 'csv')[];
  chartTypes: ('bar' | 'pie' | 'line' | 'summary')[];
  autoRefresh: boolean;
  refreshIntervalSeconds: number;
  readOnly: boolean;
  allowEmbed: boolean;
  viewsCount: number;
  qrCodeUrl?: string;
}

export interface FormReportView {
  id: string;
  title: string; // e.g., 'گزارش مدیریتی هیئت رئیسه', 'گزارش تفکیکی دانشکده‌ها'
  slug: string;
  description?: string;
  selectedQuestionIds: string[];
  filterCriteria?: {
    faculty?: string;
    role?: string;
  };
  displayType: 'dashboard' | 'charts_only' | 'table_summary';
  createdAt: string;
  isPublic: boolean;
}

export interface ReportAccessAuditLog {
  id: string;
  accessorName: string;
  accessorRoleOrIp: string;
  action: 'view_dashboard' | 'export_pdf' | 'export_excel' | 'export_csv' | 'print' | 'login_attempt';
  timestamp: string;
  success: boolean;
  details?: string;
}

export interface AuditLogItem {
  id: string;
  userName: string;
  action: string;
  timestamp: string;
  details?: string;
}

export interface FormDefinition {
  id: string;
  title: string;
  description: string;
  type: FormType;
  status: FormStatus;
  category: string;
  tags: string[];
  ownerName: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  steps: FormStep[];
  fields: FormField[];
  logicRules: LogicRule[];
  quizConfig: FormQuizConfig;
  theme: FormTheme;
  settings: FormSettings;
  userAccessRules?: UserAccessRule[];
  publicResultConfig?: PublicResultConfig;
  reportViews?: FormReportView[];
  reportAuditLogs?: ReportAccessAuditLog[];
  auditLogs: AuditLogItem[];
  viewsCount: number;
  submissionsCount: number;
  avgCompletionTimeSeconds: number;
}

export interface FormSubmission {
  id: string;
  formId: string;
  trackingCode: string;
  respondentName?: string;
  respondentEmail?: string;
  respondentRole?: string;
  submittedAt: string;
  status: 'new' | 'under_review' | 'approved' | 'rejected';
  answers: Record<string, any>;
  scoreTotal?: number;
  gradeLabel?: string;
  ipAddress: string;
  completionTimeSeconds: number;
  internalNotes?: string;
  expertAssigned?: string;
  sentimentAnalysis?: 'positive' | 'neutral' | 'negative';
}
