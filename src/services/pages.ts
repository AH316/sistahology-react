import { supabase } from '../lib/supabase';
import { homeHero } from '../content/pages';

export type Page = {
  slug: string;
  title: string;
  content_html: string;
};

export async function listPages(): Promise<Array<{slug: string; title: string}>> {
  try {
    const { data, error } = await supabase
      .from('pages')
      .select('slug, title')
      .order('slug');

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error listing pages:', error);
    return [];
  }
}

export async function getPage(slug: string): Promise<{slug: string; title: string; content_html: string} | null> {
  try {
    const { data, error } = await supabase
      .from('pages')
      .select('slug, title, content_html')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.code === 'PGRST205') {
        // No rows found (PGRST116) or 404 (PGRST205)
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching page:', error);
    return null;
  }
}

export async function upsertPage(input: {slug: string; title: string; content_html: string}): Promise<void> {
  try {
    const { error } = await supabase
      .from('pages')
      .upsert({
        slug: input.slug,
        title: input.title,
        content_html: input.content_html,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'slug'
      });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error upserting page:', error);
    throw error;
  }
}

export async function resetHomeFromSeed(seed = homeHero): Promise<void> {
  const content_html = seed.paragraphs.map(p => `<p>${p}</p>`).join('');
  await upsertPage({ 
    slug: 'home', 
    title: seed.title, 
    content_html 
  });
}

export async function ensureHomeAccents(): Promise<void> {
  try {
    const page = await getPage('home');
    if (!page) return;

    let html = page.content_html;
    const originalHtml = html;

    // Helper to check if a phrase is already wrapped in pink span
    function isAlreadyWrapped(html: string, phrase: string): boolean {
      const regex = new RegExp(`<span[^>]*text-sistah-pink[^>]*>[^<]*${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^<]*</span>`, 'i');
      return regex.test(html);
    }

    // 1. "just for women" - preserve em tags
    if (!isAlreadyWrapped(html, 'just for women')) {
      html = html.replace(/<em([^>]*)>([^<]*just\s+for\s+women[^<]*)<\/em>/i, 
        '<span class="text-sistah-pink font-semibold"><em$1>$2</em></span>');
    }

    // 2. "FREE online journaling platform" - preserve strong tags  
    if (!isAlreadyWrapped(html, 'FREE online journaling platform')) {
      html = html.replace(/<strong([^>]*)>([^<]*FREE\s+online\s+journaling\s+platform[^<]*)<\/strong>/i, 
        '<span class="text-sistah-pink font-semibold"><strong$1>$2</strong></span>');
    }

    // 3. "enjoy the journey" - preserve em tags
    if (!isAlreadyWrapped(html, 'enjoy the journey')) {
      html = html.replace(/<em([^>]*)>([^<]*enjoy\s+the\s+journey[^<]*)<\/em>/i, 
        '<span class="text-sistah-pink font-semibold"><em$1>$2</em></span>');
    }

    // 4. "allowed to just BE" - wrap only the BE part, preserve strong tags
    if (!isAlreadyWrapped(html, 'BE')) {
      html = html.replace(/(allowed\s+to\s+just\s+)<strong([^>]*)>(BE)<\/strong>/i, 
        '$1<span class="text-sistah-pink font-semibold"><strong$2>$3</strong></span>');
    }

    // 5. "It's not about the destination, but the journey" - preserve em tags
    if (!isAlreadyWrapped(html, "it's not about the destination, but the journey")) {
      html = html.replace(/<em([^>]*)>([^<]*it's\s+not\s+about\s+the\s+destination,\s+but\s+the\s+journey[^<]*)<\/em>/i, 
        '<span class="text-sistah-pink font-semibold"><em$1>$2</em></span>');
    }

    // If content changed, update the database
    if (html !== originalHtml) {
      await upsertPage({ ...page, content_html: html });
    }
  } catch (error) {
    console.error('Error ensuring home accents:', error);
  }
}