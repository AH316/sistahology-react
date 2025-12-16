# Contact Page Update - Quick Start

## TL;DR

Fix Contact page email and remove fake data in 3 steps.

## 3-Step Execution

### Step 1: Open Supabase SQL Editor
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select project: `klaspuhgafdjrrbdzlwg`
3. Click **SQL Editor** → **New query**

### Step 2: Run Update Script
1. Open file: `db/UPDATE_CONTACT_SECTIONS.sql`
2. Copy entire contents
3. Paste in SQL Editor
4. Click **Run** (or `Cmd/Ctrl + Enter`)
5. Verify output shows ✓ success indicators

### Step 3: Verify Results
1. Create **New query** in SQL Editor
2. Open file: `db/VERIFY_CONTACT_SECTIONS.sql`
3. Copy and paste
4. Click **Run**
5. Confirm all 6 checks show ✓ PASS

## What Changes

**Contact Info**:
- Email: `hello@` → `info@sistahology.com` ✅
- Others: Fake data → Professional "coming soon" placeholders

**Social Media**:
- Remove: Instagram (wrong account) ❌
- Keep: Facebook + Twitter (correct) ✅

## Expected Output

After Step 2, you should see:
```
✓ Updated 1 row(s) in contact_info section
✓ Updated 1 row(s) in social_media section
✓ Email: info@sistahology.com (CORRECT)
✓ Platform count: 2
✓ Instagram removed
✓ Facebook present
✓ Twitter present
```

After Step 3, you should see:
```
✓ PASS - Email is info@sistahology.com
✓ PASS - All placeholders are professional
✓ PASS - Exactly 2 platforms
✓ PASS - Instagram removed
✓ PASS - Facebook present
✓ PASS - Twitter present
```

## Files

All in `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react/db/`:

- **UPDATE_CONTACT_SECTIONS.sql** - Main update (run this first)
- **VERIFY_CONTACT_SECTIONS.sql** - Verification (run after update)
- **UPDATE_CONTACT_README.md** - Full guide with rollback instructions
- **UPDATE_CONTACT_SUMMARY.md** - Complete deliverables overview

## Need Help?

See `UPDATE_CONTACT_README.md` for:
- Detailed step-by-step instructions
- Rollback procedures
- Troubleshooting guide
- Post-update checklist

## Safety

✅ Transaction-wrapped (safe rollback)
✅ Idempotent (safe to re-run)
✅ No schema changes
✅ CMS still works
✅ Read-only verification script included

---

**Ready?** Copy `UPDATE_CONTACT_SECTIONS.sql` into Supabase SQL Editor and hit Run!
