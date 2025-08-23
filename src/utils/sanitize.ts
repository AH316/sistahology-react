import sanitizeHtmlLib from 'sanitize-html';

/**
 * Sanitizes HTML content for admin-authored CMS content
 * Allows broader formatting tags while maintaining security
 * Ensures external links have rel="noopener" for security
 */
export function sanitizeHtml(html: string): string {
  // Sanitize with a safe but broader allow-list for admin content
  const sanitized = sanitizeHtmlLib(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'p', 'em', 'strong', 
      'span', 'a', 'br', 'div', 'ul', 'ol', 'li'
    ],
    allowedAttributes: {
      'a': ['href', 'target', 'rel', 'class'],
      'span': ['class'],
      'p': ['class'],
      'h1': ['class'],
      'h2': ['class'],
      'h3': ['class'],
      'div': ['class'],
      'ul': ['class'],
      'ol': ['class'],
      'li': ['class'],
      'strong': ['class'],
      'em': ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    disallowedTagsMode: 'discard',
    transformTags: {
      // Ensure links with target="_blank" have rel="noopener" for security
      'a': (_tagName, attribs) => {
        const transformedAttribs = { ...attribs };
        
        // If target="_blank", ensure rel="noopener" is present
        if (transformedAttribs.target === '_blank') {
          // Preserve existing rel values but ensure noopener is included
          const existingRel = transformedAttribs.rel || '';
          const relValues = existingRel.split(' ').filter(Boolean);
          if (!relValues.includes('noopener')) {
            relValues.push('noopener');
          }
          transformedAttribs.rel = relValues.join(' ');
        }
        
        return {
          tagName: 'a',
          attribs: transformedAttribs
        };
      }
    }
  });

  return sanitized;
}