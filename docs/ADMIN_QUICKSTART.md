# Admin Quickstart Guide

**Last Updated:** November 2025
**Purpose:** Get started managing Sistahology website content in 5 minutes

---

## Quick Start Checklist

- [ ] Login at sistahology.com with your admin credentials
- [ ] Navigate to Admin Panel using the admin menu link
- [ ] Familiarize yourself with the 4 main sections (Dashboard, Homepage, Site Sections, Blog Posts, Admin Tokens)
- [ ] Make your first content edit
- [ ] Save and verify changes on the public site

---

## Accessing the Admin Panel

### Step 1: Login
1. Go to `https://sistahology.com/login` (replace with your actual domain)
2. Enter your admin email and password
3. Click "Sign In"

### Step 2: Navigate to Admin Panel
1. Once logged in, you'll see the main dashboard
2. Look for the "Admin Panel" link in your navigation menu (visible only to admin users)
3. Click to access `/admin` - you'll see a sidebar with pink floral background

**Troubleshooting:** If you don't see the Admin Panel link, your account may not have admin privileges. Contact the site administrator to grant you admin access using an admin token.

---

## Admin Panel Overview

The Admin Panel has **5 main sections** accessible from the sidebar:

### 1. Dashboard
**Quick view of site statistics**
- Total users, journals, entries, and pages
- Quick action buttons for common tasks
- System health overview

### 2. Homepage (Content > Homepage)
**Manage pages and homepage content**
- Create new pages with titles and URL slugs
- Edit existing page content using the rich text editor
- Publish or unpublish pages
- Delete pages you no longer need

**Quick actions:**
- Click "Create Page" button to add a new page
- Click pencil icon to edit existing pages
- Toggle "Published" checkbox to show/hide pages from public view

### 3. Site Sections (Content > Site Sections)
**Edit content blocks for About, Contact, and News pages**
- Edit pre-defined sections without changing page structure
- Toggle sections on/off with the visibility button
- Filter by page (About, Contact, News, or All)
- Change display order for section arrangement

**Quick actions:**
- Use filter buttons to view sections for specific pages
- Click pencil icon to edit section content
- Click status badge (Active/Hidden) to toggle visibility

### 4. Blog Posts (Content > Blog Posts)
**Create and manage blog content**
- Write new blog posts with rich formatting
- Save posts as drafts or publish immediately
- Schedule publication dates
- Add excerpts (200 character summaries for previews)

**Quick actions:**
- Click "Create New Post" button
- Click status badge to toggle Draft/Published status
- Click pencil icon to edit posts
- Click trash icon to delete posts

### 5. Admin Tokens (Administration > Admin Tokens)
**Invite new administrators securely**
- Generate secure, time-limited invitation links
- Track token status (Active, Used, Expired)
- Delete unused tokens if plans change

**Quick actions:**
- Click "Create Token" to invite a new admin
- Copy the registration link and share it securely
- Monitor token usage in the table

---

## Common Admin Tasks

### Edit Homepage Content
1. Go to Content > Homepage
2. Find the page in the table
3. Click the pencil icon
4. Edit content in the rich text editor
5. Click "Save"

### Create a Blog Post
1. Go to Content > Blog Posts
2. Click "Create New Post"
3. Enter title (slug auto-generates)
4. Write content using the editor
5. Choose Draft or Published
6. If Published, set publication date
7. Click "Save"

### Invite a New Admin
1. Go to Administration > Admin Tokens
2. Click "Create Token"
3. Enter the new admin's email
4. Choose expiration time (1, 7, or 30 days)
5. Click "Generate Token"
6. Copy the registration link and share via secure channel

### Toggle Section Visibility
1. Go to Content > Site Sections
2. Find the section you want to show/hide
3. Click the status badge (Active or Hidden)
4. Confirm the change
5. Section is now visible or hidden from public view

---

## Using the Rich Text Editor

The editor toolbar includes:
- **Headings:** H1, H2, H3 for section titles
- **Formatting:** Bold, Italic, Underline
- **Lists:** Bullet and numbered lists
- **Links:** Add hyperlinks to text
- **Images:** Insert images (paste URL)
- **Code blocks:** For technical content
- **Styles dropdown:** Custom pink text styles for brand consistency

**Tip:** Use the "Styles" dropdown to apply Sistahology's signature pink gradient text.

---

## Need More Help?

- **Detailed tutorials:** See `CMS_USER_GUIDE.md` for step-by-step instructions
- **Admin token management:** See `ADMIN_TOKEN_GUIDE.md` for security best practices
- **Technical issues:** Contact your developer or check browser console for error messages

---

## Quick Troubleshooting

**Can't access Admin Panel?**
- Verify you're logged in as an admin user
- Check that your account has admin privileges (ask existing admin to send you a token)
- Try logging out and back in

**Can't see changes on public site?**
- Make sure the page/post is set to "Published"
- Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check if section is toggled to "Active"

**Save button greyed out?**
- Fill in all required fields (title, slug, content)
- Check for error messages in red text
- Ensure slug contains only lowercase letters, numbers, and hyphens

**Editor not loading?**
- Refresh the page
- Check your internet connection
- Try a different browser (Chrome or Firefox recommended)
