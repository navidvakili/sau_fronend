export type Breakpoint = 'desktop' | 'tablet' | 'mobile';

export type UserRoleCondition = 'all' | 'student' | 'professor' | 'admin' | 'guest' | 'authenticated';

export interface ResponsiveValue<T> {
  desktop: T;
  tablet?: T;
  mobile?: T;
}

export interface ConditionalDisplayRule {
  enabled: boolean;
  userRole?: UserRoleCondition;
  urlParamKey?: string;
  urlParamValue?: string;
}

export type WidgetCategory = 'static' | 'dynamic' | 'layout';

export type StaticWidgetType =
  | 'heading'
  | 'text'
  | 'image'
  | 'button'
  | 'video'
  | 'icon'
  | 'divider'
  | 'spacer'
  | 'stat-card'
  | 'accordion'
  | 'callout';

export type SmartWidgetType =
  | 'announcements-feed'
  | 'news-feed'
  | 'image-gallery'
  | 'achievements-timeline'
  | 'staff-directory'
  | 'file-manager';

export type WidgetType = StaticWidgetType | SmartWidgetType;

export interface WidgetStyle {
  textColor?: string;
  backgroundColor?: string;
  backgroundGradient?: string;
  fontFamily?: string;
  fontSize?: string; // e.g., '18px', '1.25rem'
  fontWeight?: string;
  textAlign?: 'right' | 'center' | 'left' | 'justify';
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  marginTop?: number;
  marginBottom?: number;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  opacity?: number;
  customCss?: string;
}

export interface WidgetDataBinding {
  dataSource: 'announcements' | 'news' | 'gallery' | 'awards' | 'staff' | 'files' | 'none';
  categoryFilter?: string;
  priorityFilter?: 'all' | 'urgent' | 'standard';
  departmentFilter?: string;
  yearFilter?: string;
  folderFilter?: string;
  limit?: number;
  sortBy?: 'date_desc' | 'date_asc' | 'views' | 'priority' | 'title';
  displayMode?: 'grid' | 'list' | 'carousel' | 'masonry' | 'timeline' | 'marquee' | 'table';
  columnsCount?: number;
}

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  title: string;
  content: string; // HTML or plain text or primary value
  imageUrl?: string;
  videoUrl?: string;
  buttonUrl?: string;
  buttonText?: string;
  iconName?: string;
  settings: {
    style: WidgetStyle;
    binding: WidgetDataBinding;
    visibility: {
      desktop: boolean;
      tablet: boolean;
      mobile: boolean;
    };
    conditionalDisplay: ConditionalDisplayRule;
    customProps?: Record<string, any>;
  };
}

export interface ColumnInstance {
  id: string;
  width: number; // 1 to 12 in a 12-column grid
  widgets: WidgetInstance[];
  style?: {
    backgroundColor?: string;
    padding?: number;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
  };
}

export interface SectionInstance {
  id: string;
  name: string;
  layout: 'full-width' | 'boxed';
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundImage?: string;
  paddingTop: number;
  paddingBottom: number;
  columns: ColumnInstance[];
  visibility: {
    desktop: boolean;
    tablet: boolean;
    mobile: boolean;
  };
  conditionalDisplay: ConditionalDisplayRule;
}

export interface GlobalStyles {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  containerMaxWidth: number; // e.g. 1200
  baseRadius: number;
}

export interface PageVersion {
  id: string;
  timestamp: string;
  title: string;
  note: string;
  schemaSnapshot: SmartPageSchema;
}

export interface SmartPageSchema {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
  version: number;
  globalStyles: GlobalStyles;
  sections: SectionInstance[];
  versionHistory: PageVersion[];
}

export interface PageTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  thumbnail: string;
  schema: SmartPageSchema;
}

export interface SectionTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  section: SectionInstance;
}
