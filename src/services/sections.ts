import { supabase } from '../lib/supabase';
import type { SiteSection, SiteSectionInput } from '../types/sections';
import type { ApiResponse } from '../types';

/**
 * Get all sections for a specific page
 * Returns sections ordered by display_order
 */
export async function getSections(
  pageSlug: string
): Promise<ApiResponse<SiteSection[]>> {
  try {
    const { data, error } = await supabase
      .from('site_sections')
      .select('*')
      .eq('page_slug', pageSlug)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching sections:', error);
      throw error;
    }

    return { success: true, data: data || [] };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load sections';
    return { success: false, error: errorMessage };
  }
}

/**
 * Get active sections for a specific page (public-facing)
 * Only returns sections where is_active = true
 */
export async function getActiveSections(
  pageSlug: string
): Promise<ApiResponse<SiteSection[]>> {
  try {
    const { data, error } = await supabase
      .from('site_sections')
      .select('*')
      .eq('page_slug', pageSlug)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching active sections:', error);
      throw error;
    }

    return { success: true, data: data || [] };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load sections';
    return { success: false, error: errorMessage };
  }
}

/**
 * Get a single section by page slug and section key
 */
export async function getSection(
  pageSlug: string,
  sectionKey: string
): Promise<ApiResponse<SiteSection | null>> {
  try {
    const { data, error } = await supabase
      .from('site_sections')
      .select('*')
      .eq('page_slug', pageSlug)
      .eq('section_key', sectionKey)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.code === 'PGRST205') {
        // No rows found
        return { success: true, data: null };
      }
      console.error('Error fetching section:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to load section';
    return { success: false, error: errorMessage };
  }
}

/**
 * Create or update a section (upsert based on page_slug + section_key)
 * Admin only operation
 */
export async function upsertSection(
  section: SiteSectionInput
): Promise<ApiResponse<SiteSection>> {
  try {
    const { data, error } = await supabase
      .from('site_sections')
      .upsert(
        {
          page_slug: section.page_slug,
          section_key: section.section_key,
          section_title: section.section_title,
          content_json: section.content_json,
          display_order: section.display_order,
          is_active: section.is_active,
        },
        {
          onConflict: 'page_slug,section_key',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting section:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to save section';
    return { success: false, error: errorMessage };
  }
}

/**
 * Toggle section visibility (is_active flag)
 * Admin only operation
 */
export async function toggleSectionVisibility(
  id: string,
  isActive: boolean
): Promise<ApiResponse<SiteSection>> {
  try {
    const { data, error } = await supabase
      .from('site_sections')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling section visibility:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Failed to toggle section visibility';
    return { success: false, error: errorMessage };
  }
}

/**
 * Delete a section
 * Admin only operation
 */
export async function deleteSection(id: string): Promise<ApiResponse<void>> {
  try {
    const { error } = await supabase
      .from('site_sections')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting section:', error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to delete section';
    return { success: false, error: errorMessage };
  }
}
