# CMS User Guide

**Last Updated:** November 2025
**Purpose:** Comprehensive handbook for Sistahology admin content management

---

## Table of Contents

1. [Homepage & Pages Management](#homepage--pages-management)
2. [Blog Post Management](#blog-post-management)
3. [Site Sections Management](#site-sections-management)
4. [Managing Contact Submissions](#managing-contact-submissions)
5. [Admin Dashboard](#admin-dashboard)

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

### Managing Social Media Platforms

**Location:** Contact Page > "Connect with Us" section

The social media platforms section allows you to add, edit, and remove social media links that appear on the Contact page. Each platform displays as a clickable icon that links to your social media profile.

#### Adding a New Platform

1. Navigate to **Admin Panel > Content > Site Sections**
2. Click **"Contact"** filter to show Contact page sections
3. Find the **"Connect with Us"** section (key: `social_media`)
4. Click the **pencil icon** to edit
5. In the Section Editor modal:
   - Scroll to **"Social Platforms"** section
   - Click **"Add Platform"** button
   - Fill in the platform form:
     - **Platform Name:** Enter exact platform name (see supported platforms below)
     - **Handle:** Your profile handle (e.g., `@sistahology` or `Sistahology`)
     - **URL:** Full profile URL (e.g., `https://instagram.com/sistahology`)
   - Click **"Save Section"**
6. Visit the Contact page to see your new icon

**Important:** Platform names must match exactly (case-insensitive) for icons to display correctly.

#### Supported Platform Names

The following platforms have automatic icon support:

| Platform Name | Example Handle | Example URL | Icon Displayed |
|--------------|----------------|-------------|---------------|
| `Facebook` | `Sistahology` | `https://facebook.com/sistahology` | Facebook logo |
| `Instagram` | `@sistahology` | `https://instagram.com/sistahology` | Instagram logo |
| `Twitter` or `X` | `@sistahology` | `https://twitter.com/sistahology` | X (Twitter) logo |
| `TikTok` | `@sistahology` | `https://tiktok.com/@sistahology` | TikTok logo |
| `LinkedIn` | `Sistahology` | `https://linkedin.com/company/sistahology` | LinkedIn logo |
| `YouTube` | `Sistahology` | `https://youtube.com/@sistahology` | YouTube logo |
| `Pinterest` | `Sistahology` | `https://pinterest.com/sistahology` | Pinterest logo |
| `Snapchat` | `@sistahology` | `https://snapchat.com/add/sistahology` | Snapchat logo |

**For other platforms:** Enter any name, and the system will display initials (e.g., "TW" for Twitch) as a fallback.

#### Editing Platform Information

1. Open the **"Connect with Us"** section editor
2. Find the platform in the list
3. Click the **"Edit"** button next to the platform
4. Update the **Handle** or **URL** fields
5. Click **"Save Section"**

**Note:** To change the platform name (e.g., Twitter → X), delete the old platform and add a new one.

#### Removing a Platform

1. Open the **"Connect with Us"** section editor
2. Find the platform you want to remove
3. Click the **"Delete"** button (trash icon)
4. Confirm deletion
5. Click **"Save Section"**
6. The platform icon will no longer appear on the Contact page

**Common Use Cases:**
- Removing platforms with incorrect account information
- Hiding platforms temporarily (remove and re-add later when ready)
- Updating profile URLs after rebranding

#### Platform Display Order

Platforms appear in the order they're listed in the editor:
- The first platform in the list appears first (left) on the page
- Drag platforms up/down to reorder (if drag-and-drop is enabled)
- Alphabetical order is recommended for consistency

#### Troubleshooting Icons

**Icon not showing (displays initials instead):**
- Verify platform name matches exactly from supported list above
- Common mistake: "twitter" vs "Twitter" (case doesn't matter, but spelling does)
- For Twitter/X: use either "Twitter" or "X" as the platform name

**Link not working:**
- Ensure URL includes `https://` prefix
- Test URL in browser first to confirm it works
- Some platforms require specific URL formats (e.g., TikTok needs `/@username`)

**Icon size or alignment issues:**
- All icons are automatically sized and styled consistently
- Contact developer if visual issues persist after refreshing page

#### Best Practices

- **Keep platforms updated:** Remove inactive accounts, add new ones
- **Use consistent handles:** Match your branding across platforms
- **Test links after changes:** Click each icon to verify they work
- **Limit platform count:** 3-5 platforms is ideal for clean design
- **Prioritize active platforms:** Remove platforms you don't actively use

---

## Managing Contact Submissions

**Access:** Admin Panel > Contact Submissions or `/admin/contact-submissions`

### Overview

The Contact Submissions dashboard allows you to view and manage all inquiries submitted through the public contact form on your website.

**Purpose:** Track, respond to, and organize customer inquiries from your contact form.

---

### The Dashboard

When you open the Contact Submissions page, you'll see:

#### Statistics Cards

At the top of the page, five cards display submission counts:
- **Total:** All submissions ever received
- **Pending:** New submissions that haven't been viewed yet (yellow badge)
- **Read:** Submissions you've opened and viewed (blue badge)
- **Replied:** Submissions you've responded to (green badge)
- **Archived:** Old or resolved submissions (gray badge)

**Note:** These cards update automatically when you change submission statuses.

#### Submissions Table

Below the statistics, a table displays all submissions with the following columns:
- **Date:** When the inquiry was submitted
- **Name:** The person who submitted the form
- **Email:** Their email address
- **Subject:** The inquiry category they selected
- **Status:** Current status with color-coded badge
- **Actions:** Quick action buttons

---

### Viewing Submissions

#### Viewing the List

- All submissions appear in the table, sorted by **newest first**
- Each row shows key information at a glance
- Status badges are color-coded for quick identification

#### Viewing Full Details

1. Click the **"View"** button (eye icon) on any submission
2. A modal window opens showing:
   - Full name and email (email is clickable to send a reply)
   - Subject and submission date/time
   - Complete message text
   - Current status badge
3. Click outside the modal or press **ESC** to close

**Automatic Status Update:** When you view a **Pending** submission, it automatically changes to **Read** status.

---

### Filtering and Searching

Use the filter bar to find specific submissions:

#### Status Filter

- Click the **"Status"** dropdown
- Select: All Statuses, Pending, Read, Replied, or Archived
- Table updates instantly to show only matching submissions

#### Search

- Type in the **search box** to filter by:
  - Name
  - Email address
  - Subject line
  - Message content
- Search is **instant** as you type
- Searches across all text fields simultaneously

#### Date Range Filter

- **Start Date:** Show only submissions from this date forward
- **End Date:** Show only submissions up to this date
- Use both to filter a specific date range
- Leave blank to ignore date filtering

#### Clear Filters

- Click **"Clear Filters"** button (appears when filters are active)
- Resets all filters to defaults
- Shows all submissions again

---

### Managing Submission Status

Each submission moves through a workflow as you handle inquiries.

#### Status Meanings

1. **Pending** (yellow): Brand new, unread inquiry
2. **Read** (blue): You've viewed it but haven't responded yet
3. **Replied** (green): You've sent a response to the customer
4. **Archived** (gray): Resolved or old inquiry

#### Changing Status (Single Submission)

**Method 1: From the Table**
1. Find the submission in the table
2. Click the status **dropdown** in the "Status" column
3. Select new status (Pending, Read, Replied, or Archived)
4. Status updates immediately

**Method 2: From the Detail Modal**
1. Click **"View"** to open the submission
2. Click one of the quick action buttons at the bottom:
   - **Mark as Read:** Change to blue "Read" status
   - **Mark as Replied:** Change to green "Replied" status
   - **Archive:** Change to gray "Archived" status
3. Modal closes and table updates

#### Recommended Workflow

```
New Inquiry (Pending)
    ↓
View details (auto-changes to Read)
    ↓
Send response via email
    ↓
Mark as Replied
    ↓
After resolved: Archive
```

---

### Bulk Operations

When you need to process multiple submissions at once:

#### Selecting Submissions

- **Select Individual:** Click checkbox next to each submission
- **Select All:** Click checkbox in table header to select all visible submissions
- **Selection Count:** Bulk action bar shows how many are selected

#### Bulk Actions Bar

When submissions are selected, a pink bar appears with buttons:

1. **Mark as Read:** Changes all selected to "Read" status
2. **Mark as Replied:** Changes all selected to "Replied" status
3. **Archive:** Changes all selected to "Archived" status

#### Using Bulk Actions

1. Select submissions using checkboxes
2. Click the appropriate bulk action button
3. Confirmation toast appears showing how many were updated
4. Selection clears automatically
5. Table and statistics update

**Example:** Select all pending submissions and click "Mark as Read" to process a batch of inquiries.

---

### Exporting Data

Download submission data for record-keeping or analysis.

#### Export to CSV

1. Apply any filters you want (optional)
2. Click **"Export CSV"** button (top right)
3. A CSV file downloads automatically with:
   - Submission date
   - Name
   - Email address
   - Subject
   - Full message
   - Current status

**Filename Format:** `contact-submissions-YYYY-MM-DD.csv`

**What Gets Exported:** Only the submissions currently visible after filtering. Use "Clear Filters" first to export everything.

#### Uses for CSV Export

- Import into your email marketing tool
- Create reports in Excel or Google Sheets
- Archive historical inquiries
- Analyze inquiry trends over time

---

### Best Practices

#### Daily Workflow

1. **Morning Check:** Open Contact Submissions to see new pending inquiries
2. **Review:** Click "View" on each pending submission (auto-marks as Read)
3. **Respond:** Use the email link to reply to customer
4. **Update Status:** Mark as "Replied" after sending response
5. **Archive:** Weekly or monthly, archive old resolved submissions

#### Organization Tips

- **Use Status Consistently:** Always mark submissions "Replied" after responding
- **Archive Regularly:** Move resolved inquiries to archived to keep the list clean
- **Search First:** Before responding, search the person's email to see if they've submitted before
- **Export Monthly:** Download CSV backups at the end of each month

#### Response Time Goals

- **Pending → Read:** Within 24 hours (view all new inquiries daily)
- **Read → Replied:** Within 48 hours (respond quickly to maintain customer trust)
- **Replied → Archived:** Within 30 days after final resolution

#### Using Filters Effectively

- **Monday Morning:** Filter by "Pending" to see what came in over the weekend
- **Weekly Review:** Filter by "Read" to find inquiries you viewed but haven't responded to
- **Monthly Cleanup:** Filter by "Replied" older than 30 days and bulk archive them

---

### Troubleshooting

**I don't see any submissions**
- Check if the contact form is working on the public `/contact` page
- Verify filters aren't hiding submissions (click "Clear Filters")
- Contact support if the table is truly empty and the form is working

**Status won't update**
- Refresh the page and try again
- Check your admin permissions
- Look for error messages in red toast notifications

**Export button does nothing**
- Ensure you have submissions visible (clear filters if table is empty)
- Check your browser's download settings
- Try a different browser if issue persists

**Search isn't finding a submission**
- Verify spelling (search is exact match)
- Check if the submission is filtered out by status or date
- Clear all filters and search again

---

### Quick Reference

| Task | Action |
|------|--------|
| View new inquiries | Filter by "Pending" status |
| See full message | Click "View" button (eye icon) |
| Reply to customer | Click email address in detail modal |
| Update single status | Use dropdown in table or buttons in modal |
| Update multiple statuses | Select checkboxes, use bulk action buttons |
| Find specific inquiry | Use search box (searches all text) |
| Export for records | Click "Export CSV" button |
| Clean up old inquiries | Filter by date range, select all, archive |

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
