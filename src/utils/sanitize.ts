import sanitizeHtmlLib from 'sanitize-html';

/**
 * Sanitizes HTML content for admin-authored CMS content
 * Allows broader formatting tags while maintaining security
 * Ensures external links have rel="noopener" for security
 * Preserves Sistahology custom pink Tailwind classes
 */
export function sanitizeHtml(html: string): string {
  // Sanitize with a safe but broader allow-list for admin content
  const sanitized = sanitizeHtmlLib(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'p', 'em', 'strong',
      'span', 'a', 'br', 'div', 'ul', 'ol', 'li',
      'svg', 'path'
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
      'em': ['class'],
      'svg': [
        'class', 'aria-hidden', 'xmlns', 'width', 'height', 'viewBox',
        'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'
      ],
      'path': [
        'd', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin'
      ]
    },
    allowedClasses: {
      'span': [
        'text-sistah-pink', 'text-sistah-rose', 'text-sistah-purple',
        'font-semibold', 'font-bold', 'italic', 'underline'
      ],
      'div': [
        // Divider line classes
        'h-1', 'bg-pink-300', 'bg-pink-400', 'bg-pink-500', 'rounded-full', 'my-8', 'my-4', 'my-6',
        // Border classes
        'border-t', 'border-b', 'border-white/20', 'border-pink-300',
        // Spacing classes
        'mt-4', 'mt-6', 'mt-8', 'mb-4', 'mb-6', 'mb-8', 'pt-4', 'pt-6', 'pt-8', 'pb-4', 'pb-6', 'pb-8',
        // Layout classes
        'flex', 'justify-center', 'items-center', 'space-x-4', 'overflow-hidden',
        // Size classes
        'flex-shrink-0',
        'w-8', 'w-16', 'w-24', 'w-32', 'w-40', 'w-48', 'w-64',
        'h-8', 'h-12', 'h-16',
        // Responsive size classes
        'sm:w-32', 'sm:w-40', 'sm:w-48', 'sm:w-56', 'sm:w-64',
        'md:w-48', 'md:w-56', 'md:w-64',
        'lg:w-64', 'lg:w-72', 'lg:w-80'
      ],
      'svg': [
        'flex-shrink-0', 'w-4', 'w-5', 'w-6', 'w-8', 'w-10', 'w-12',
        'h-4', 'h-5', 'h-6', 'h-8', 'h-10', 'h-12',
        'text-pink-300', 'text-pink-400', 'text-pink-500',
        'text-sistah-pink', 'text-sistah-rose', 'text-sistah-purple',
        'floating-flower'
      ],
      'h1': ['text-sistah-pink', 'text-sistah-rose', 'text-sistah-purple'],
      'h2': ['text-sistah-pink', 'text-sistah-rose', 'text-sistah-purple'],
      'h3': ['text-sistah-pink', 'text-sistah-rose', 'text-sistah-purple'],
      'p': ['text-sistah-pink', 'text-sistah-rose', 'text-sistah-purple'],
      'strong': ['text-sistah-pink', 'text-sistah-rose', 'text-sistah-purple'],
      'em': ['text-sistah-pink', 'text-sistah-rose', 'text-sistah-purple']
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