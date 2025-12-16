# Contact Page Content Update Guide

## Overview

This guide will help you update the Contact page content in the Supabase database to fix incorrect email and placeholder information.

## What's Being Updated

### 1. Contact Info Section (`contact_info`)
- **Email**: `hello@sistahology.com` → `info@sistahology.com` ✅
- **Phone**: `(555) 123-4567` → `Contact information coming soon` ✅
- **Address**: Fake address → `Location details coming soon` ✅
- **Hours**: Fake hours → `Availability hours coming soon` ✅

### 2. Social Media Section (`social_media`)
- **Remove**: Instagram (@sistahology - wrong account) ❌
- **Keep**: Facebook (Sistahology) ✅
- **Keep**: Twitter (@sistahology - displays as X icon in UI) ✅

## Files Included

- **UPDATE_CONTACT_SECTIONS.sql**: Main update script (makes changes)
- **VERIFY_CONTACT_SECTIONS.sql**: Verification script (read-only, safe to run anytime)
- **UPDATE_CONTACT_README.md**: This guide

## Step-by-Step Execution

### Pre-Execution Checklist

- [ ] You have admin access to Supabase project `klaspuhgafdjrrbdzlwg`
- [ ] You are logged into the Supabase dashboard
- [ ] You have navigated to the SQL Editor
- [ ] You have reviewed the changes in this README

### Execution Steps

#### Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: `klaspuhgafdjrrbdzlwg`
3. Click **SQL Editor** in the left sidebar
4. Click **New query** button

#### Step 2: Run the Update Script

1. Open the file: `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/db/UPDATE_CONTACT_SECTIONS.sql`
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** button (or press `Cmd/Ctrl + Enter`)

#### Step 3: Review Output

The script will display detailed verification output in the Results panel:

**Expected Output:**
```
==========================================
VERIFICATION RESULTS
==========================================

Contact Info Verification:
  ✓ Email: info@sistahology.com (CORRECT)
  ✓ Phone: Contact information coming soon (professional placeholder)

Social Media Verification:
  Platform count: 2
  ✓ Correct platform count (2)
  ✓ Instagram removed (was wrong account)
  ✓ Facebook present
  ✓ Twitter present (displays as X icon in UI)

==========================================
UPDATE COMPLETE
==========================================
```

#### Step 4: Verify Changes (Optional but Recommended)

1. Create a new query in SQL Editor
2. Open the file: `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/db/VERIFY_CONTACT_SECTIONS.sql`
3. Copy and paste into SQL Editor
4. Click **Run** button

This read-only script will:
- Display all 6 verification checks (all should PASS ✓)
- Show detailed content of both sections
- Confirm no data was corrupted

#### Step 5: Test in Application

1. Navigate to the Contact page: `https://your-app-url/contact`
2. Verify email shows: `info@sistahology.com`
3. Verify other fields show professional "coming soon" messages
4. Verify only Facebook and Twitter (X) icons appear (no Instagram)

#### Step 6: Admin CMS Verification

1. Log in as admin user
2. Navigate to: `/admin/sections`
3. Find Contact page sections
4. Verify you can edit the content via the CMS interface
5. Confirm Instagram can be re-added later when correct account is known

## Rollback Instructions

If you need to undo these changes:

### Option 1: Rollback During Execution

If you catch an issue immediately after running the update script:

1. Open SQL Editor
2. Run: `ROLLBACK;`
3. This will undo all changes from the last transaction

**Note**: This only works if you haven't closed the SQL Editor or run other queries.

### Option 2: Manual Rollback (Restore Previous Values)

If you need to restore the original placeholder data:

```sql
BEGIN;

-- Restore original contact_info (with fake data)
UPDATE public.site_sections
SET content_json = jsonb_build_object(
    'email', 'hello@sistahology.com',
    'phone', '(555) 123-4567',
    'address', '123 Sisterhood Lane, Suite 100, Seattle, WA 98101',
    'hours', 'Monday - Friday: 9am - 5pm PST'
)
WHERE page_slug = 'contact' AND section_key = 'contact_info';

-- Restore original social_media (with Instagram)
UPDATE public.site_sections
SET content_json = jsonb_build_object(
    'platforms', jsonb_build_array(
        jsonb_build_object(
            'name', 'Instagram',
            'handle', '@sistahology',
            'url', 'https://instagram.com/sistahology'
        ),
        jsonb_build_object(
            'name', 'Facebook',
            'handle', 'Sistahology',
            'url', 'https://facebook.com/sistahology'
        ),
        jsonb_build_object(
            'name', 'Twitter',
            'handle', '@sistahology',
            'url', 'https://twitter.com/sistahology'
        )
    )
)
WHERE page_slug = 'contact' AND section_key = 'social_media';

COMMIT;
```

## Important Notes

### CMS Editability
✅ **Andrea can still edit all contact info via Admin CMS** at `/admin/sections`

This update only changes the data, not the structure. The CMS editing interface remains fully functional.

### Instagram Re-addition
✅ **Instagram can be added back later** via Admin CMS when the correct account is known

To re-add Instagram:
1. Go to `/admin/sections`
2. Edit the "Connect With Us" section (social_media)
3. Add Instagram to the platforms array via the JSON editor

### X/Twitter Display
ℹ️ **Platform name stays "Twitter" in database** for backward compatibility

The UI component (`ContactPage.tsx`) handles displaying it as the new X (Twitter) icon using the `FaXTwitter` component. No code changes needed.

### No Schema Changes
✅ **No migration file needed** - we're only updating content (data), not structure

The `site_sections` table schema remains unchanged. This is a data update, not a schema migration.

## Verification Queries

### Quick Check
```sql
SELECT section_key, content_json
FROM site_sections
WHERE page_slug = 'contact'
  AND section_key IN ('contact_info', 'social_media')
ORDER BY section_key;
```

### Detailed Check
Run the full verification script: `VERIFY_CONTACT_SECTIONS.sql`

## Troubleshooting

### Issue: "No rows updated"
**Cause**: Section doesn't exist in database
**Solution**: Run migration 015 first (`db/migrations/015_seed_page_sections.sql`)

### Issue: "Permission denied"
**Cause**: Not logged in as admin or insufficient RLS permissions
**Solution**: Ensure you're running queries in Supabase SQL Editor (bypasses RLS)

### Issue: "Syntax error"
**Cause**: Incomplete script copied
**Solution**: Ensure entire script is copied including BEGIN/COMMIT statements

### Issue: Changes not showing on Contact page
**Cause**: Frontend cache or RLS policy issue
**Solution**:
1. Hard refresh browser (`Cmd/Ctrl + Shift + R`)
2. Clear localStorage
3. Verify RLS policies allow public SELECT on `site_sections` where `is_active = true`

## Post-Update Checklist

- [ ] Update script executed successfully
- [ ] Verification script shows all checks passing
- [ ] Contact page displays correct email: `info@sistahology.com`
- [ ] Contact page shows professional placeholders for phone/address/hours
- [ ] Only Facebook and Twitter icons appear (no Instagram)
- [ ] Admin CMS can edit Contact sections at `/admin/sections`
- [ ] No JavaScript errors in browser console

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the verification script output for specific failures
3. Check browser console for frontend errors
4. Verify Supabase RLS policies are correctly configured

## Summary

This update:
- ✅ Fixes email from `hello@` to `info@sistahology.com`
- ✅ Replaces fake contact data with professional placeholders
- ✅ Removes wrong Instagram account
- ✅ Preserves Facebook and Twitter (X) accounts
- ✅ Maintains full CMS editability for Andrea
- ✅ Allows Instagram re-addition later via CMS

The Contact page will now display accurate information while waiting for final contact details from Andrea.
