# CMS User Guide

**Last Updated:** November 2025
**Purpose:** Comprehensive handbook for Sistahology admin content management

---

## Table of Contents

1. [Homepage & Pages Management](#homepage--pages-management)
2. [Blog Post Management](#blog-post-management)
3. [Site Sections Management](#site-sections-management)
4. [Admin Dashboard](#admin-dashboard)

---

## Homepage & Pages Management

**Access:** Admin Panel > Content > Homepage

### Creating a New Page

1. Click the **"Create Page"** button (top right)
2. Fill in the page details:
   - **Title:** Display name (e.g., "About Us")
   - **Slug:** URL path (auto-generated from title, e.g., "about-us")
   - **Content:** Main page content using the rich text editor
   - **Published:** Check to make page visible to public
3. Click **"Save"**

**Important Notes:**
- Slug determines the page URL: `sistahology.com/about-us`
- Slugs must be unique and URL-friendly (lowercase, hyphens only)
- Unpublished pages are saved but hidden from public view

### Editing Existing Pages

1. Find the page in the table
2. Click the **pencil icon** in the Actions column
3. Make your changes in the editor
4. Update the "Published" checkbox if needed
5. Click **"Save"**

### Publishing and Unpublishing Pages

**To Publish:**
- Open the page editor
- Check the "Published" checkbox
- Click "Save"
- Page is now visible at its URL

**To Unpublish:**
- Open the page editor
- Uncheck the "Published" checkbox
- Click "Save"
- Page is now hidden but content is preserved

### Deleting Pages

**Warning:** Deletion is permanent and cannot be undone.

1. Find the page in the table
2. Click the **trash icon** in the Actions column
3. Confirm deletion in the popup dialog
4. Page is permanently removed

### Using the Rich Text Editor

The TinyMCE editor provides these formatting options:

**Text Formatting:**
- **Bold** (Ctrl/Cmd + B)
- *Italic* (Ctrl/Cmd + I)
- Underline (Ctrl/Cmd + U)

**Headings:**
- Use the Styles dropdown to select H1, H2, H3
- H1 for main page title (use once per page)
- H2 for section headers
- H3 for subsections

**Lists:**
- Bullet lists for unordered items
- Numbered lists for sequential steps
- Use tab/shift+tab to indent/outdent

**Links:**
1. Select text to link
2. Click link icon in toolbar
3. Enter URL (include https://)
4. Click "Insert"

**Images:**
1. Click image icon in toolbar
2. Enter image URL or upload file
3. Add alt text for accessibility
4. Set dimensions if needed

**Custom Styles:**
- Access "Styles" dropdown for Sistahology brand colors
- Apply pink gradient text for emphasis
- Use consistently across pages for brand cohesion

### Best Practices for Content Creation

- **Keep titles concise:** 3-8 words ideal
- **Use headings hierarchically:** H1 > H2 > H3 (don't skip levels)
- **Break up text:** Use short paragraphs (3-5 sentences)
- **Add visuals:** Include images to break up long text blocks
- **Write clear link text:** "Read our guide" not "Click here"
- **Preview before publishing:** Check formatting and links work
- **Use consistent tone:** Friendly, encouraging, supportive

---

## Blog Post Management

**Access:** Admin Panel > Content > Blog Posts

### Creating a Blog Post

1. Click **"Create New Post"** button
2. Fill in post details:
   - **Title:** Post headline
   - **Slug:** URL path (auto-generated, e.g., "my-first-post")
   - **Excerpt:** 200-character summary for previews (optional)
   - **Content:** Full post content using rich text editor
   - **Status:** Choose "Draft" or "Published"
   - **Published Date:** Required if status is "Published"
3. Click **"Save"**

### Writing Effective Excerpts

**Purpose:** Excerpts appear on blog listing pages to preview content.

**Guidelines:**
- Maximum 200 characters (counter shows remaining)
- Summarize the main point or hook readers
- End with ellipsis (...) to indicate continuation
- Example: "Discover 5 journaling techniques that helped me manage anxiety and find clarity in just 15 minutes per day..."

**If blank:** System auto-generates excerpt from first paragraph

### Draft vs. Published Status

**Draft Status:**
- Post is saved but not visible to public
- Appears with grey "Draft" badge in admin table
- No published date required
- Use for work-in-progress posts

**Published Status:**
- Post is live and visible to all visitors
- Appears with green "Published" badge
- Requires publication date to be set
- Appears in blog feed and search results

**To toggle status:** Click the status badge in the blog posts table

### Scheduling Publication Dates

1. Open blog post editor
2. Select "Published" status
3. Click **"Published Date"** field
4. Use date/time picker to choose future date
5. Click "Save"

**Behavior:**
- Post appears immediately if date is in past
- Future dates schedule automatic publication
- Shows formatted date in "Published" column

### Editing Blog Posts

1. Find post in the table
2. Click **pencil icon** in Actions column
3. Make changes
4. Update status or date if needed
5. Click **"Save"**

### Deleting Blog Posts

**Warning:** Deletion is permanent.

1. Find post in the table
2. Click **trash icon** in Actions column
3. Confirm: "Are you sure you want to delete [Post Title]?"
4. Post is permanently removed

### Blog Post Best Practices

- **Compelling titles:** Use numbers ("5 Ways...") or questions
- **Hook readers early:** First paragraph should grab attention
- **Use subheadings:** Break posts into scannable sections
- **Add personality:** Write conversationally, use "you" and "I"
- **Include call-to-action:** End with next step (comment, share, try technique)
- **Proofread:** Check spelling and grammar before publishing
- **Optimal length:** 500-1500 words for readability

---

## Site Sections Management

**Access:** Admin Panel > Content > Site Sections

### What Are Site Sections?

Site sections are pre-defined content blocks that appear on About, Contact, and News pages. Unlike full pages, sections have a fixed structure and display order.

**Example sections:**
- "About: Mission Statement" (about page)
- "Contact: Email Form" (contact page)
- "News: Latest Updates" (news page)

### Filtering by Page

Use the filter buttons at the top to view sections:
- **All:** Shows all sections from all pages
- **About:** Shows only About page sections
- **Contact:** Shows only Contact page sections
- **News:** Shows only News page sections

Sections are sorted by page name, then by display order.

### Editing Section Content

1. Filter to desired page or select "All"
2. Find section in the table
3. Click **pencil icon** in Actions column
4. Edit content in the modal editor
5. Click **"Save"**

**Notes:**
- Section title and key cannot be changed (fixed by page structure)
- Display order can be adjusted to reorder sections
- Content format depends on section type (text, JSON, etc.)

### Showing and Hiding Sections

**To hide a section:**
1. Find section in the table
2. Click the **"Active"** status badge (green)
3. Confirm: "Hide [Section Title] from public view?"
4. Status changes to "Hidden" (grey badge)

**To show a section:**
1. Find section in the table
2. Click the **"Hidden"** status badge (grey)
3. Confirm: "Make [Section Title] visible to public?"
4. Status changes to "Active" (green badge)

**Use cases:**
- Temporarily hide outdated content
- Test new sections before making them public
- Seasonal content (hide holiday sections after event)

### Reordering Sections

1. Open section editor
2. Change the **"Display Order"** number
   - Lower numbers appear first (1, 2, 3...)
   - Higher numbers appear later
3. Click "Save"
4. Sections rearrange on public page

**Example:**
- Order 1: Hero section at top
- Order 2: Main content in middle
- Order 3: Footer content at bottom

### Understanding Section Keys

Section keys are unique identifiers used by the system:
- Format: `page_section_name` (e.g., `about_mission`)
- Cannot be changed via UI (prevents breaking page structure)
- Displayed in grey monospace text under section title
- Used by developers for programmatic access

---

## Admin Dashboard

**Access:** Admin Panel > Dashboard (default landing page)

### Dashboard Statistics

The dashboard displays 4 key metrics:

**1. Total Users**
- Number of registered accounts
- Includes both regular users and admins

**2. Total Journals**
- Number of journals created across all users
- Each user can have multiple journals

**3. Total Entries**
- Number of journal entries written
- Tracks content creation activity

**4. Total Pages**
- Number of CMS pages (published and unpublished)
- Includes homepage, about, custom pages

### Quick Action Links

The dashboard provides shortcuts to common tasks:
- **Create Page:** Jump to page creation form
- **Create Blog Post:** Jump to blog post creation
- **Manage Sections:** Access site sections editor
- **Invite Admin:** Create new admin token

### Interpreting Metrics

**High user count, low journal count:**
- Users may need onboarding help
- Consider creating tutorial content

**High journal count, low entry count:**
- Journals created but not actively used
- Users may benefit from writing prompts

**Many unpublished pages:**
- Review drafts for potential publication
- Clean up abandoned content

---

## General Tips for Success

### Content Strategy
- **Plan ahead:** Outline content before writing
- **Be consistent:** Post regularly (weekly or bi-weekly blogs)
- **Know your audience:** Write for women seeking journaling support
- **Stay on brand:** Use pink accents, encouraging tone, sisterhood themes

### Workflow Efficiency
- **Save drafts frequently:** Don't lose work to browser crashes
- **Use browser bookmarks:** Bookmark `/admin` for quick access
- **Test on mobile:** Preview how content looks on phones
- **Set reminders:** Schedule time for content updates

### Accessibility Best Practices
- **Use alt text:** Describe images for screen readers
- **Write descriptive links:** "Download guide" not "Click here"
- **Check contrast:** Ensure text is readable on backgrounds
- **Use headings:** Help users navigate with assistive technology

### Security Habits
- **Log out when done:** Especially on shared computers
- **Strong passwords:** Use password manager
- **Guard admin tokens:** Share via secure channels only
- **Review permissions:** Audit who has admin access periodically

---

## Getting Help

**For technical issues:**
- Check browser console for error messages (F12 key)
- Try different browser (Chrome or Firefox recommended)
- Clear cache and cookies
- Contact your developer with specific error messages

**For content questions:**
- Refer to this guide for step-by-step instructions
- See `ADMIN_TOKEN_GUIDE.md` for invitation workflows
- Check `ADMIN_QUICKSTART.md` for quick reference

**For feature requests:**
- Document what you need and why
- Provide examples or mockups if possible
- Discuss with your development team
