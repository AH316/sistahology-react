// Export new database-driven blog post functions
export {
  listBlogPosts,
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  generateSlug,
  isSlugAvailable
} from './supabasePosts';

// Export types
export type {
  BlogPost,
  CreateBlogPostInput,
  UpdateBlogPostInput
} from './supabasePosts';

// Keep old Post type for backward compatibility (deprecated)
export type { Post } from "../../types/post";

// Keep old functions for backward compatibility (deprecated - use listBlogPosts/getBlogPost instead)
export { listPosts, getPostBySlug } from "./staticPosts";