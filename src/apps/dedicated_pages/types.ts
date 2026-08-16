export type PageType =
  | 'scientific_association' // انجمن علمی
  | 'cultural_club'          // کانون فرهنگی و هنری
  | 'student_union'          // تشکل دانشجویی
  | 'student_journal'        // نشریه دانشجویی
  | 'faculty_member'         // صفحه اختصاصی استاد
  | 'interactive_survey'     // پرسشنامه تعاملی — فعلاً غیرفعال
  | 'special_event';         // همایش و رویداد اختصاصی — فعلاً غیرفعال

export interface PageTypeDefinition {
  id: PageType;
  title: string;
  category: 'academic' | 'cultural' | 'union' | 'media' | 'person' | 'service';
  description: string;
  iconName: string;
  badge: string;
  color: string;
  bgGradient: string;
  isDisabled: boolean;
  disabledReason?: string;
  defaultEnabledModules: string[];
  defaultTaxonomies: string[];
}

export interface PageOwner {
  id: string;
  name: string;
  username?: string;
  password?: string;
  email: string;
  phone: string;
  roleTitle: string;
  avatar?: string;
  nationalCode?: string;
  personnelId?: string;
  facultyId?: string;
  isFacultyMember?: boolean;
}

export type AccessLevel = 'full_manager' | 'content_editor' | 'viewer';

export interface AuthorizedUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  roleTitle: string;
  accessLevel: AccessLevel;
  canManageTaxonomies: boolean;
  canManageModules: boolean;
  canPublish: boolean;
  assignedAt: string;
}

export type LayoutType =
  | 'single_column'
  | 'two_column_sidebar_right'
  | 'two_column_sidebar_left'
  | 'three_column'
  | 'magazine_grid';

export type HeaderStyle = 'banner_hero' | 'compact_glass' | 'profile_card' | 'minimal_clean';

export interface PageLayoutConfig {
  layoutType: LayoutType;
  headerStyle: HeaderStyle;
  accentColor: string;
  fontFamily: 'iransans' | 'vazir' | 'sahel' | 'shabnam' | 'dana';
  bannerImage?: string;
  showSidebar: boolean;
  widgetOrder: string[];
  cardStyle: 'modern_rounded' | 'flat_minimal' | 'bordered_sharp' | 'glassmorphism';
}

export interface PageTaxonomy {
  id: string;
  title: string;
  slug: string;
  color: string;
  description?: string;
  itemCount: number;
}

export interface PageFeaturesConfig {
  hasNews: boolean;
  hasEvents: boolean;
  hasGallery: boolean;
  hasDocuments: boolean;
  hasBoardMembers: boolean;
  hasResearchArticles: boolean;
  hasContactForm: boolean;
  hasSurvey: boolean;
  hasUsefulLinks: boolean;
}

export interface ProfessorProfileData {
  professorId: string;
  fullName: string;
  personnelId: string;
  academicRank: 'استاد تمام' | 'دانشیار' | 'استادیار' | 'مربی' | 'استاد مدعو';
  department: string;
  faculty: string;
  officeLocation: string;
  internalPhone: string;
  officeHours: string;
  email: string;
  googleScholarUrl?: string;
  orcidId?: string;
  researchgateUrl?: string;
  linkedinUrl?: string;
  researchInterests: string[];
  taughtCourses: string[];
  supervisedThesesCount: number;
  publishedPapersCount: number;
  cvFileUrl?: string;
}

export interface PageSeoConfig {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  canonicalUrl?: string;
  ogImage?: string;
}

export interface PageContactInfo {
  email: string;
  phone: string;
  location: string;
  telegramOrEitaa?: string;
  instagram?: string;
  linkedin?: string;
  website?: string;
}

export interface PageDisplaySettings {
  showInNavigation: boolean;
  showInDirectory: boolean;
  highlightOnHome: boolean;
}

export interface DedicatedPage {
  id: string;
  pageType: PageType;
  title: string;
  shortTitle: string;
  slug: string;
  fullUrl: string;
  featuredImage: string;
  logo: string;
  shortDescription: string;
  fullDescription: string;
  status: 'active' | 'inactive' | 'draft' | 'maintenance';
  publishStatus: 'published' | 'draft' | 'scheduled';
  createdAt: string;
  updatedAt: string;
  owner: PageOwner;
  authorizedUsers: AuthorizedUser[];
  seo: PageSeoConfig;
  contactInfo: PageContactInfo;
  displaySettings: PageDisplaySettings;
  layoutConfig: PageLayoutConfig;
  features: PageFeaturesConfig;
  taxonomies: PageTaxonomy[];
  professorData?: ProfessorProfileData;
  customFields?: {
    facultyName?: string;
    councilMembersCount?: number;
    establishmentDate?: string;
    licenseCode?: string;
    // Journal fields
    journalLicenseNumber?: string;
    journalPublisher?: string;
    journalManagingDirector?: string;
    journalEditorInChief?: string;
    journalFrequency?: 'ماهنامه' | 'فصلنامه' | 'دوفصلنامه' | 'گاهنامه';
    journalCirculation?: number;
  };
}

export interface PageContentItem {
  id: string;
  pageId: string;
  type: 'news' | 'announcement' | 'event' | 'document' | 'gallery' | 'article';
  title: string;
  summary: string;
  content: string;
  categorySlug: string;
  categoryTitle: string;
  publishedDate: string;
  author: string;
  status: 'published' | 'draft' | 'archived';
  views: number;
  fileUrl?: string;
  fileSize?: string;
  imageUrl?: string;
}
