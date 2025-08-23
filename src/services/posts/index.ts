export type { Post } from "../../types/post";

// For now, wire to the static provider
export { listPosts, getPostBySlug } from "./staticPosts";

// TODO: later switch based on import.meta.env.VITE_POSTS_PROVIDER to use a Supabase provider