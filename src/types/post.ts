export type Post = {
  id: string;                 // stable uuid or shortid
  slug: string;               // kebab-case
  title: string;
  excerpt: string;
  contentHTML?: string;       // allow HTML content for now
  contentMarkdown?: string;   // optional, for future CMS/Markdown
  datePublished: string;      // ISO e.g. "2024-01-15"
  dateDisplay?: string;       // formatted display date (preserved for compatibility)
  updatedAt?: string;         // ISO
  author?: string;
  tags?: string[];
  hero?: { src: string; alt?: string };
  sourceUrl?: string;         // original URL if imported
  status?: "draft" | "published";
};