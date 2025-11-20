import { supabase } from '../../lib/supabase';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content_html: string;
  author: string;
  published_at: string | null;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface CreateBlogPostInput {
  title: string;
  excerpt?: string;
  content_html: string;
  author?: string;
  status?: 'draft' | 'published';
  published_at?: string | null;
}

export interface UpdateBlogPostInput {
  title?: string;
  excerpt?: string;
  content_html?: string;
  status?: 'draft' | 'published';
  published_at?: string | null;
}

/**
 * Convert title to URL-safe slug
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * List all blog posts (admin can see drafts, public sees only published)
 */
export async function listBlogPosts(includeUnpublished = false): Promise<BlogPost[]> {
  try {
    let query = supabase
      .from('blog_posts')
      .select('*')
      .order('published_at', { ascending: false, nullsFirst: false });

    // If not including unpublished, filter to published posts only
    if (!includeUnpublished) {
      query = query
        .eq('status', 'published')
        .not('published_at', 'is', null)
        .lte('published_at', new Date().toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error listing blog posts:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in listBlogPosts:', error);
    return [];
  }
}

/**
 * Get a single blog post by slug
 */
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.code === 'PGRST205') {
        // No rows found or 404
        return null;
      }
      console.error('Error fetching blog post:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getBlogPost:', error);
    return null;
  }
}

/**
 * Create a new blog post (admin only)
 */
export async function createBlogPost(input: CreateBlogPostInput): Promise<BlogPost> {
  try {
    // Generate slug from title
    const slug = generateSlug(input.title);

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (existing) {
      throw new Error(`A post with slug "${slug}" already exists`);
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        slug,
        title: input.title,
        excerpt: input.excerpt || null,
        content_html: input.content_html,
        author: input.author || 'sistahology.com',
        status: input.status || 'draft',
        published_at: input.published_at || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating blog post:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createBlogPost:', error);
    throw error;
  }
}

/**
 * Update an existing blog post (admin only)
 */
export async function updateBlogPost(
  id: string,
  updates: UpdateBlogPostInput
): Promise<BlogPost> {
  try {
    // If title is being updated, regenerate slug
    let updateData: any = { ...updates };

    if (updates.title) {
      const newSlug = generateSlug(updates.title);

      // Check if new slug conflicts with existing posts (excluding current post)
      const { data: existing } = await supabase
        .from('blog_posts')
        .select('id, slug')
        .eq('slug', newSlug)
        .neq('id', id)
        .single();

      if (existing) {
        throw new Error(`A post with slug "${newSlug}" already exists`);
      }

      updateData.slug = newSlug;
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating blog post:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateBlogPost:', error);
    throw error;
  }
}

/**
 * Delete a blog post (admin only)
 */
export async function deleteBlogPost(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting blog post:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteBlogPost:', error);
    throw error;
  }
}

/**
 * Check if a slug is available (for validation)
 */
export async function isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  try {
    let query = supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query.single();

    if (error && (error.code === 'PGRST116' || error.code === 'PGRST205')) {
      // No rows found - slug is available
      return true;
    }

    // If we got data, slug is taken
    return !data;
  } catch (error) {
    console.error('Error checking slug availability:', error);
    return false;
  }
}
