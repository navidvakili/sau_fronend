// ============================================================
// Shared Types — انواع و اینترفیس‌های سراسری پروژه
// ============================================================

export type UserRole = 'admin' | 'editor' | 'user' | 'support';

export interface User {
  username: string;
  fname: string;
  lname: string;
  kodmeli: string;
  mobile: string;
  email: string;
  role: UserRole;
  /** All roles from the roles table (array of role names) */
  roles?: string[];
  /** Granular permissions from Spatie (e.g. ['dashboard.view', 'users.create']) */
  permissions?: string[];
  sign?: string | null;
  /** Derived full name from fname + lname */
  name: string;
  /** Avatar URL for display */
  avatar: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// ============================================================
// Language Types — انواع مربوط به زبان‌ها
// ============================================================

export interface Language {
  id: number;
  code: string;
  name: string;
  name_en: string | null;
  dir: 'rtl' | 'ltr';
  is_active: boolean;
  is_default: boolean;
  ordering: number;
  created_at?: string;
  updated_at?: string;
}

export interface LanguagePayload {
  code: string;
  name: string;
  name_en?: string | null;
  dir?: 'rtl' | 'ltr';
  is_active?: boolean;
  is_default?: boolean;
  ordering?: number;
}

// ============================================================
// News Types — انواع مربوط به ماژول اخبار
// ============================================================

export interface NewsAttachment {
  name: string;
  size: string;
  url: string;
}

export interface PhotoReportImage {
  url: string;
  title?: string | null;
}

export interface NewsComment {
  id: number;
  news_id?: number;
  news_title?: string;
  author_name: string;
  content: string;
  is_approved: boolean;
  approved_at?: string | null;
  approved_by_name?: string | null;
  created_at: string;  updated_at?: string;
}

export interface NewsItem {
  id: number;
  title: string;
  summary: string | null;
  content: string;
  category_id: number | null;
  category_name: string | null;
  category_color: string | null;
  author_username: string;
  author_name: string | null;
  author_role?: string | null;
  image_url: string | null;
  views_count: number;
  likes_count: number;
  is_pinned: boolean;
  comments_enabled: boolean;
  is_photo_report: boolean;
  photo_report_images: PhotoReportImage[];
  comments_count: number;
  comments?: NewsComment[];
  status: 'published' | 'draft' | 'archived';
  target_audience: 'all' | 'students' | 'professors' | 'staff';
  tags: string[];
  attachments: NewsAttachment[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsCategory {
  id: number;
  name: string;
  slug: string;
  color: string;
  description: string | null;
  is_active: boolean;
  count?: number;
}

export interface AnnouncementCategory {
  id: number;
  name: string;
  slug: string;
  color: string;
  description: string | null;
  is_active: boolean;
  count?: number;
}

export interface NewsAnalytics {
  total_news: number;
  published_news: number;
  draft_news: number;
  archived_news: number;
  pinned_news: number;
  total_views: number;
  total_likes: number;
  top_viewed: Array<{
    id: number;
    title: string;
    category_id: number | null;
    views_count: number;
    likes_count: number;
  }>;
  top_liked: Array<{
    id: number;
    title: string;
    category_id: number | null;
    views_count: number;
    likes_count: number;
  }>;
  category_distribution: Array<{
    id: number;
    name: string;
    color: string;
    count: number;
    percentage: number;
  }>;
  uncategorized_count: number;
}

// ============================================================
// Announcement Types — انواع مربوط به ماژول اطلاعیه‌ها
// ============================================================

export interface AnnouncementAttachment {
  name: string;
  size: string;
  url: string;
}

export interface AnnouncementItem {
  id: number;
  title: string;
  summary: string | null;
  content: string | null;
  group: string | null;
  category_id: number | null;
  category_name: string | null;
  category_color: string | null;
  category_slug: string | null;
  type: 'important' | 'normal';
  image: string | null;
  image_url: string | null;
  files: AnnouncementAttachment[];
  status: 'published' | 'draft';
  is_pinned: boolean;
  author_username: string;
  author_name: string | null;
  author_role?: string | null;
  date: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementPayload {
  title: string;
  summary?: string | null;
  content?: string | null;
  group?: string | null;
  category_id?: number | null;
  type: 'important' | 'normal';
  image_url?: string | null;
  files?: AnnouncementAttachment[];
  status: 'published' | 'draft';
  is_pinned?: boolean;
  lang?: string;
}

// ============================================================
// Hero Slide Types — انواع مربوط به اسلایدر صفحه اصلی
// ============================================================

export interface HeroSlide {
  id: number;
  tag: string;
  title: string;
  subtitle: string;
  badge: string;
  badge_icon: string;
  bg_image: string | null;
  primary_cta_text: string;
  primary_cta_target: string;
  secondary_cta_text: string;
  secondary_cta_target: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Achievement Types — انواع مربوط به ماژول افتخارات
// ============================================================

export interface AchievementItem {
  id: number;
  language: string;
  title: string;
  subtitle: string | null;
  desc: string | null;
  description: string | null;
  image: string | null;
  image_url: string | null;
  icon: string;
  status: 'published' | 'draft';
  author_username: string;
  author_name: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AchievementPayload {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  image_url?: string | null;
  icon?: string;
  status: 'published' | 'draft';
  lang?: string;
}

// ============================================================
// People Types — انواع مربوط به ماژول اعضای دانشگاه
// (هیات علمی / اساتید مدعو / کارکنان / دانشجویان)
// ============================================================

export type PersonType = 'faculty_member' | 'visiting_professor' | 'staff' | 'student';

export interface EducationItem {
  degree: string;
  field?: string;
  institution: string;
  year?: string;
}

export interface PublicationItem {
  title: string;
  journal?: string;
  year?: string;
  citations?: number;
}

export interface AwardItem {
  title: string;
  year?: string;
}

export interface PersonItem {
  id: number;
  type: PersonType;
  types: PersonType[];
  language: string;
  slug: string;
  title: string | null;
  firstName: string | null;
  lastName: string | null;
  rank: string | null;
  specialization: string | null;
  department: string | null;
  position: string | null;
  email: string | null;
  phone: string | null;
  office: string | null;
  image: string | null;
  image_url: string | null;
  bio: string | null;
  education: EducationItem[];
  researchInterests: string[];
  publications: PublicationItem[];
  courses: string[];
  awards: AwardItem[];
  lectureNotes: Array<{ title: string }>;
  studentNumber: string | null;
  degreeLevel: string | null;
  fieldOfStudy: string | null;
  entryYear: string | null;
  status: 'published' | 'draft';
  sortOrder: number;
  author_username: string;
  author_name: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonPayload {
  type: PersonType;
  types?: PersonType[] | null;
  lang?: string;
  slug?: string | null;
  title?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  rank?: string | null;
  specialization?: string | null;
  department?: string | null;
  position?: string | null;
  email?: string | null;
  phone?: string | null;
  office?: string | null;
  image_url?: string | null;
  bio?: string | null;
  education?: EducationItem[] | null;
  research_interests?: string[] | null;
  publications?: PublicationItem[] | null;
  courses?: string[] | null;
  awards?: AwardItem[] | null;
  lecture_notes?: Array<{ title: string }> | null;
  student_number?: string | null;
  degree_level?: string | null;
  field_of_study?: string | null;
  entry_year?: string | null;
  status: 'published' | 'draft';
  sort_order?: number;
}
