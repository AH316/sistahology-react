// TypeScript interfaces for site_sections JSONB schemas

// =====================================================
// ABOUT PAGE SECTION TYPES
// =====================================================

export interface FounderBio {
  name: string;
  title: string;
  quote_1: string;
  quote_2: string;
  quote_3: string;
  icon: string; // Lucide icon name (e.g., 'Heart')
}

export interface MissionValue {
  title: string;
  icon: string; // Lucide icon name
  description: string;
}

export interface MissionValues {
  intro: string;
  values: MissionValue[];
}

export interface PlatformFeature {
  title: string;
  icon: string; // Lucide icon name
  description: string;
}

export interface PlatformFeatures {
  features: PlatformFeature[];
}

export interface CommunityStat {
  value: string; // e.g., "15,000+"
  label: string;
}

export interface CommunityStats {
  stats: CommunityStat[];
}

// =====================================================
// CONTACT PAGE SECTION TYPES
// =====================================================

export interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  hours: string;
}

export interface SocialPlatform {
  name: string; // e.g., "Instagram"
  handle: string; // e.g., "@sistahology"
  url: string;
}

export interface SocialMedia {
  platforms: SocialPlatform[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQLinks {
  questions: FAQItem[];
}

// =====================================================
// NEWS PAGE SECTION TYPES
// =====================================================

export interface AnniversaryEvent {
  icon: string; // Lucide icon name
  date: string;
  description: string;
  cta_text: string | null;
  cta_link: string | null;
}

export interface BookLaunch {
  icon: string; // Lucide icon name
  book_title: string;
  author: string;
  description: string;
  cta_text: string | null;
  cta_link: string | null;
}

export interface WellnessProducts {
  icon: string; // Lucide icon name
  collection_name: string;
  description: string;
  social_handle: string;
  social_platform: string;
}

export interface UpcomingEventItem {
  date: string;
  title: string;
  description: string;
}

export interface UpcomingEvents {
  events: UpcomingEventItem[];
}

export interface CommunitySpotlightStat {
  icon: string; // Lucide icon name
  value: string;
  label: string;
}

export interface CommunitySpotlight {
  intro: string;
  stats: CommunitySpotlightStat[];
  cta_text: string;
  cta_link: string;
}

// =====================================================
// DISCRIMINATED UNION FOR TYPE SAFETY
// =====================================================

export type SectionContentType =
  // About page sections
  | { type: 'founder_bio'; data: FounderBio }
  | { type: 'mission_values'; data: MissionValues }
  | { type: 'platform_features'; data: PlatformFeatures }
  | { type: 'community_stats'; data: CommunityStats }
  // Contact page sections
  | { type: 'contact_info'; data: ContactInfo }
  | { type: 'social_media'; data: SocialMedia }
  | { type: 'faq_links'; data: FAQLinks }
  // News page sections
  | { type: 'anniversary_event'; data: AnniversaryEvent }
  | { type: 'book_launch'; data: BookLaunch }
  | { type: 'wellness_products'; data: WellnessProducts }
  | { type: 'upcoming_events'; data: UpcomingEvents }
  | { type: 'community_spotlight'; data: CommunitySpotlight };

// Union of all content types for flexible content_json
export type SectionContent =
  | FounderBio
  | MissionValues
  | PlatformFeatures
  | CommunityStats
  | ContactInfo
  | SocialMedia
  | FAQLinks
  | AnniversaryEvent
  | BookLaunch
  | WellnessProducts
  | UpcomingEvents
  | CommunitySpotlight;

// =====================================================
// BASE SITE SECTION TYPE
// =====================================================

export interface SiteSection {
  id: string;
  page_slug: 'about' | 'contact' | 'news';
  section_key: string;
  section_title: string;
  content_json: SectionContent;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Type for creating/updating sections (optional id)
export interface SiteSectionInput {
  id?: string;
  page_slug: 'about' | 'contact' | 'news';
  section_key: string;
  section_title: string;
  content_json: SectionContent;
  display_order: number;
  is_active: boolean;
}
