# Phase 4: Site Sections CMS - Smoke Test Checklist

**Purpose**: Verify all Phase 4 features work correctly before marking complete
**Estimated Time**: 15 minutes
**Prerequisites**: Admin user account, migration 015 applied

---

## Pre-Test Setup

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Verify Admin Access**:
   - Login as admin user (must have `is_admin = true` in profiles table)
   - If no admin user exists, run:
     ```bash
     npm run set:admin
     # Or: tsx scripts/setAdminRole.ts --email your-email@example.com
     ```

3. **Verify Database**:
   - Migration 015 applied (check Supabase dashboard)
   - `site_sections` table exists with 12 rows

---

## Test 1: Admin Navigation ✅

**Steps**:
1. Login as admin user
2. Navigate to Dashboard
3. Click "Admin Panel" or go to `/#/admin`
4. Check left sidebar for "Site Sections" link
5. Click "Site Sections"

**Expected Results**:
- ✅ "Site Sections" appears in admin navigation
- ✅ Clicking link navigates to `/admin/sections`
- ✅ No console errors

**Status**: [ ] PASS / [ ] FAIL

---

## Test 2: Section List View ✅

**Steps**:
1. On `/admin/sections` page
2. Observe the table display
3. Try each page filter: All, About, Contact, News

**Expected Results**:
- ✅ Table shows section title, page, order, status, actions
- ✅ Filtering by "About" shows 4 sections
- ✅ Filtering by "Contact" shows 3 sections
- ✅ Filtering by "News" shows 5 sections
- ✅ Filtering by "All" shows 12 sections
- ✅ Page badges color-coded (blue, green, purple)
- ✅ Status shows "Active" or "Hidden" with icons

**Status**: [ ] PASS / [ ] FAIL

---

## Test 3: Edit Simple Section (Founder Bio) ✅

**Steps**:
1. Filter by "About"
2. Find "Meet Andrea Brooks" (founder_bio)
3. Click Edit icon
4. Modal opens with form
5. Change name to "Test Name"
6. Click "Save Section"
7. Modal closes
8. Navigate to `/about` in new tab
9. Verify "Test Name" appears

**Expected Results**:
- ✅ Edit modal opens with current data
- ✅ All fields populated (name, title, 3 quotes, icon)
- ✅ Save button works
- ✅ Toast notification: "Section updated successfully"
- ✅ Change appears on public About page
- ✅ Icon renders correctly

**Cleanup**: Change name back to "Andrea Brooks"

**Status**: [ ] PASS / [ ] FAIL

---

## Test 4: Edit Array Section (Mission Values) ✅

**Steps**:
1. Filter by "About"
2. Find "Our Mission & Values" (mission_values)
3. Click Edit icon
4. Scroll to "Values" array
5. Click "Add Value"
6. Fill in: Title="Test Value", Icon="Star", Description="Test description"
7. Save section
8. Navigate to `/about`
9. Verify new value card appears

**Expected Results**:
- ✅ "Add Value" button creates new empty value
- ✅ Can fill in all fields (title, icon, description)
- ✅ Icon picker works (select Star icon)
- ✅ Save works without errors
- ✅ New value card appears on About page
- ✅ Star icon renders correctly

**Cleanup**: Remove test value (click trash icon, save)

**Status**: [ ] PASS / [ ] FAIL

---

## Test 5: Icon Picker ✅

**Steps**:
1. Edit any section with an icon field (e.g., founder_bio)
2. Scroll to "Icon (Lucide React)" section
3. Click different icons (Heart, Users, Sparkles, etc.)
4. Observe selection state
5. Save and verify on public page

**Expected Results**:
- ✅ Grid shows 20 common icons
- ✅ Clicking icon highlights selection (pink border, shadow)
- ✅ Selected icon name displayed below grid
- ✅ Icon renders on public page after save

**Status**: [ ] PASS / [ ] FAIL

---

## Test 6: Toggle Section Visibility ✅

**Steps**:
1. Find any active section (green "Active" badge)
2. Click the "Active" badge
3. Confirmation dialog appears
4. Click "Deactivate"
5. Badge changes to "Hidden" (gray)
6. Navigate to corresponding public page
7. Verify section doesn't appear
8. Toggle back to "Active"
9. Verify section reappears

**Expected Results**:
- ✅ Click badge triggers confirmation dialog
- ✅ Dialog shows section title
- ✅ Deactivating hides section on public page
- ✅ Activating shows section on public page
- ✅ Toast notifications for both actions
- ✅ Badge updates immediately

**Status**: [ ] PASS / [ ] FAIL

---

## Test 7: Contact Page Integration ✅

**Steps**:
1. Navigate to `/contact`
2. Observe all sections render
3. Edit "Get in Touch" (contact_info) in admin
4. Change email to "test@sistahology.com"
5. Save and refresh Contact page
6. Verify email updated

**Expected Results**:
- ✅ Contact page shows 3 dynamic sections:
  - Get in Touch (email, phone, address, hours)
  - Frequently Asked Questions (array of Q&A)
  - Connect With Us (social platforms)
- ✅ Contact form still works (not affected)
- ✅ Email change appears on public page
- ✅ No layout issues or styling breaks

**Cleanup**: Change email back to original

**Status**: [ ] PASS / [ ] FAIL

---

## Test 8: News Page Integration ✅

**Steps**:
1. Navigate to `/news`
2. Observe all sections render
3. Edit "Upcoming Events" (upcoming_events) in admin
4. Click "Add Event" button
5. Fill in: Date="Test Date", Title="Test Event", Description="Test description"
6. Save and refresh News page
7. Verify new event appears

**Expected Results**:
- ✅ News page shows 5 dynamic sections:
  - Anniversary Celebration
  - New Book Release
  - Wellness Products
  - Upcoming Events (array of events)
  - Community Highlights
- ✅ Add Event button works
- ✅ Event fields save correctly
- ✅ New event appears in grid on News page
- ✅ Calendar icon appears with date

**Cleanup**: Remove test event

**Status**: [ ] PASS / [ ] FAIL

---

## Test 9: About Page Integration ✅

**Steps**:
1. Navigate to `/about`
2. Verify all 4 sections render:
   - Founder Bio (glass card with icon)
   - Mission & Values (3 cards in grid)
   - Platform Features (4 features)
   - Community Stats (3 statistics + CTA button)
3. Edit "Why Sistahology?" (platform_features)
4. Add a new feature: Title="Test Feature", Icon="Gift", Description="Test"
5. Save and refresh About page

**Expected Results**:
- ✅ All 4 sections render with correct styling
- ✅ Pink gradients, glass effects, animations intact
- ✅ Icons render dynamically from database
- ✅ New feature appears in features grid
- ✅ Grid adjusts to accommodate new feature
- ✅ Responsive design maintained

**Cleanup**: Remove test feature

**Status**: [ ] PASS / [ ] FAIL

---

## Test 10: Loading States ✅

**Steps**:
1. Navigate to `/about` (or any public page)
2. Open browser DevTools → Network tab
3. Throttle network to "Slow 3G"
4. Refresh page
5. Observe loading spinner
6. Wait for content to load

**Expected Results**:
- ✅ Loading spinner appears while fetching sections
- ✅ Page doesn't show empty state
- ✅ Content renders after fetch completes
- ✅ No flash of unstyled content
- ✅ No console errors

**Status**: [ ] PASS / [ ] FAIL

---

## Test 11: Error Handling ✅

**Steps**:
1. In admin, edit any section
2. Clear a required field (e.g., section title)
3. Try to save
4. Observe validation behavior
5. Fill field and save successfully

**Expected Results**:
- ✅ Save button validates form
- ✅ Toast notification shows error message
- ✅ Form doesn't submit with invalid data
- ✅ Successful save shows success toast
- ✅ Modal closes on success

**Status**: [ ] PASS / [ ] FAIL

---

## Test 12: Responsive Design ✅

**Steps**:
1. Resize browser to mobile width (375px)
2. Navigate to `/about`
3. Observe section layouts
4. Navigate to `/admin/sections`
5. Observe table responsiveness

**Expected Results**:
- ✅ About page sections stack vertically on mobile
- ✅ Cards maintain padding and spacing
- ✅ Icons and text remain readable
- ✅ Admin table scrollable on mobile
- ✅ Edit modal scrollable on mobile
- ✅ No horizontal overflow

**Status**: [ ] PASS / [ ] FAIL

---

## Test 13: RLS Security ✅

**Steps**:
1. Logout and login as regular user (not admin)
2. Try to access `/admin/sections`
3. Should redirect to dashboard
4. Navigate to `/about`, `/contact`, `/news`
5. Verify content loads correctly

**Expected Results**:
- ✅ Non-admin redirected from `/admin/sections`
- ✅ Public pages load for all users
- ✅ Only active sections visible (is_active=true)
- ✅ No RLS errors in console
- ✅ Regular users can read, not write

**Status**: [ ] PASS / [ ] FAIL

---

## Test 14: Build & Production ✅

**Steps**:
1. Run build command:
   ```bash
   npm run build
   ```
2. Observe output for errors
3. Preview production build:
   ```bash
   npm run preview
   ```
4. Navigate to sections in preview mode

**Expected Results**:
- ✅ Build completes without errors
- ✅ TypeScript compilation passes
- ✅ Bundle size reasonable (~2MB)
- ✅ Preview server starts
- ✅ All features work in production mode

**Status**: [ ] PASS / [ ] FAIL

---

## Final Smoke Test Summary

**Total Tests**: 14
**Tests Passed**: ____ / 14
**Tests Failed**: ____ / 14

**Overall Status**: [ ] PASS / [ ] FAIL

---

## Common Issues & Solutions

### Issue: "Cannot find module 'lucide-react'"
**Solution**: Icons library already installed. Check import statement.

### Issue: "Section not rendering on public page"
**Solution**: Check `is_active` flag in admin. Must be true to display.

### Issue: "Icon not rendering"
**Solution**: Verify icon name matches Lucide export exactly (case-sensitive).

### Issue: "Admin route redirects to dashboard"
**Solution**: Check `is_admin = true` in profiles table for user.

### Issue: "Array fields not saving"
**Solution**: Ensure all required fields in array items are filled.

### Issue: "TypeScript errors on build"
**Solution**: Run `npm run build` to see specific errors. Check type imports.

---

## Post-Test Cleanup

After completing smoke tests:

1. **Restore Original Content**:
   - Remove any test values, events, features added
   - Reset modified emails, names, descriptions
   - Verify all sections are "Active"

2. **Database Verification**:
   ```sql
   SELECT page_slug, COUNT(*) FROM site_sections GROUP BY page_slug;
   -- Should show: about=4, contact=3, news=5
   ```

3. **Clear Browser Cache**:
   - Clear localStorage and cookies
   - Hard refresh public pages (Cmd+Shift+R)

---

## Sign-Off

**Tester Name**: ___________________________
**Date**: ___________________________
**Test Environment**: [ ] Local Dev [ ] Staging [ ] Production
**Overall Result**: [ ] PASS [ ] FAIL

**Notes**:
___________________________________________________________
___________________________________________________________
___________________________________________________________
