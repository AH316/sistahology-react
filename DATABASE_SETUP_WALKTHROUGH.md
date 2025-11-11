# DATABASE SETUP WALKTHROUGH
**The Ultra-Detailed, Beginner-Friendly Guide to Setting Up Your Sistahology Database**

> 🎯 **Purpose**: Walk you through every single step of setting up the Sistahology database in Supabase, assuming ZERO prior database experience.

**Last Updated**: January 4, 2025
**Estimated Time**: 45-60 minutes for complete setup
**Difficulty**: Beginner-friendly (no database experience needed!)

---

## 📚 Table of Contents

1. [Before You Start](#before-you-start)
2. [Part 1: Supabase SQL Editor Tutorial](#part-1-supabase-sql-editor-tutorial)
3. [Part 1.5: Understanding Who Can See What (The 3 User Roles)](#part-15-understanding-who-can-see-what-the-3-user-roles)
4. [Part 2: The 7 Database Migrations](#part-2-the-7-database-migrations)
5. [Part 3: Final Verification](#part-3-final-verification)
6. [Part 4: Troubleshooting Common Errors](#part-4-troubleshooting-common-errors)
7. [Part 5: What to Do Next](#part-5-what-to-do-next)

---

## Before You Start

### ✅ What You Need

Before starting this guide, make sure you have:

- **A Supabase account** (free tier is fine)
- **A new Supabase project created**
- **Your project URL** (looks like: `https://klaspuhgafdjrrbdzlwg.supabase.co`)
- **Your anon key** (for the app to connect)
- **Your service role key** (for admin operations - keep this SECRET!)
- **The DATABASE_SETUP.md file** (this has all the SQL code you'll copy)

💡 **Pro Tip**: Open DATABASE_SETUP.md in one browser tab and Supabase in another so you can easily copy and paste.

### 🎯 What We're Building

You're going to create a complete database with:
- **5 tables** (profiles, journal, entry, pages, writing_prompts)
- **17 security policies** (to keep user data private)
- **15 indexes** (to make queries fast)
- **6 triggers** (to auto-update timestamps)
- **2 functions** (for timestamps and admin security)
- **15 writing prompts** (starter content for users)

⏱️ **Time Breakdown**:
- Learning the SQL Editor interface: 5 minutes
- Running the 7 migrations: 20-30 minutes
- Final verification: 5-10 minutes
- Reading troubleshooting tips: 5 minutes

---

## Part 1: Supabase SQL Editor Tutorial

### 🖥️ Step 1: Access the SQL Editor

**What is the SQL Editor?**
It's a text box where you paste SQL code (database commands) and click "Run" to execute them. Think of it like a command center for your database.

**How to get there:**

1. **Open your web browser** (Chrome, Firefox, Safari, Edge)
2. **Go to**: https://supabase.com/dashboard
3. **Log in** with your Supabase account
4. **Click your project** from the list (if you have multiple projects)
5. **Look at the left sidebar** (the menu on the left side of the screen)
6. **Find the SQL Editor icon**: It looks like `</>` (angle brackets)
7. **Click it**: The label says "SQL Editor"

✅ **Success looks like**: You see a page with:
- A big text box (where you'll paste SQL)
- A green "Run" button on the right
- An empty results pane at the bottom

### 🔍 Step 2: Understand the SQL Editor Interface

Let me explain what every part of the screen does:

#### 📝 The Query Pane (Top Section)
- **Location**: Big text box at the top
- **What it's for**: This is where you paste the SQL code
- **What you'll see**: When you first open it, there might be some example SQL like `SELECT * FROM users;`
- **What to do**: You'll delete this example and paste your migration code

#### 📊 The Results Pane (Bottom Section)
- **Location**: Below the query pane
- **What it's for**: Shows the result after you click "Run"
- **Success messages**: Green checkmark with "Success. No rows returned"
- **Error messages**: Red X with "ERROR: [description]"
- **Execution time**: Shows how long the query took (e.g., "245ms")

#### 🎛️ The Schema Dropdown (Top Left)
- **Location**: Top-left corner, next to the word "Query"
- **What it's for**: Selects which "schema" (database section) you're working in
- **Default value**: Should say "public"
- **⚠️ IMPORTANT**: Always check this is set to "public" before running any migration

#### 🟢 The Run Button (Top Right)
- **Location**: Right side of the screen, green button
- **What it says**: "Run" or shows a play icon ▶️
- **Keyboard shortcut**: Cmd+Enter (Mac) or Ctrl+Enter (Windows)
- **What it does**: Executes the SQL code in the query pane

### 📖 Step 3: Understanding Database Terms

**What is a "schema"?**
A schema is like a folder in your database. The "public" schema is the default folder where all your tables live. You'll always use "public" for this project.

**What is a "table"?**
A table is like a spreadsheet. For example, the `journal` table stores information about each journal (name, color, owner).

**What is a "column"?**
A column is like a field in a spreadsheet. The `journal` table has columns like `journal_name`, `color`, `created_at`.

**What is "RLS" (Row Level Security)?**
RLS is a security feature that prevents users from seeing each other's data. When RLS is enabled, users can only access rows (entries) they own.

**What is a "migration"?**
A migration is a script that changes your database. We have 7 migrations that will build your database step-by-step.

### ▶️ Step 4: How to Run a SQL Query (Practice Run)

Let's do a practice run with a harmless query:

1. **Click in the query pane** (the big text box)
2. **Select all text**: Press Cmd+A (Mac) or Ctrl+A (Windows)
3. **Delete it**: Press Delete or Backspace
4. **Paste this practice query**:
   ```sql
   -- This is a practice query
   SELECT 'Hello, Sistahology!' as message;
   ```
5. **Check the schema dropdown** (top-left): Should say "public"
6. **Click the green "Run" button** (or press Cmd/Ctrl + Enter)
7. **Wait for the result**: You'll see a loading spinner for 1-2 seconds
8. **Check the results pane**: You should see a table with one row: "Hello, Sistahology!"

✅ **Success!** You just ran your first SQL query! Now let's do the real migrations.

### 🔄 Step 5: Understanding Success vs. Errors

**✅ What SUCCESS Looks Like:**

When you see these, the migration worked:
- **Green checkmark icon** ✓
- **Message**: "Success. No rows returned"
- **OR message**: "Success. 1 row affected" (or 4, 15, etc.)
- **Execution time**: Something like "245ms" or "3.2s"
- **No red text**

**❌ What an ERROR Looks Like:**

When you see these, something went wrong:
- **Red X icon** ✗
- **Message starting with**: "ERROR:" in red text
- **Line number**: "at line 45" (tells you where the problem is)
- **Error description**: Explains what went wrong

**💡 Pro Tip**: Most errors are fixable! See Part 4 for common errors and solutions.

---

## Part 1.5: Understanding Who Can See What (The 3 User Roles)

### 🤔 Why This Matters

Before you run migrations, you need to understand a critical concept: **Not everyone sees the same data in your database**.

There are THREE different "roles" (types of users) that access your database:
1. **You right now (postgres role)** - Using SQL Editor
2. **App users who are logged in (authenticated role)** - Using your React app
3. **Visitors who aren't logged in (anon role)** - Browsing your website

Each role sees DIFFERENT data. This is a **security feature**, not a bug!

### 👨‍💻 Role 1: You in SQL Editor (postgres)

**This is you right now!**

When you open SQL Editor and run queries, you're the "postgres" superuser. Think of yourself as the database owner who can see and do everything.

**What you can see**:
- ✅ EVERYTHING in the database
- ✅ All users' profiles
- ✅ All journals from all users
- ✅ All entries from all users
- ✅ Every single row in every table

**Why this is important**:
- When you run verification queries later, you'll see ALL data
- This does NOT mean security is broken!
- Security policies (RLS) still work for regular users in the app

**Real-world analogy**: You're the building owner with the master key. You can enter any apartment. But tenants (app users) can only enter their own apartment.

### 👤 Role 2: Logged-In App Users (authenticated)

**These are your users after they sign up and log in.**

When someone creates an account and logs in to your React app, they become an "authenticated" user. The database applies security rules to them.

**What they can see**:
- ✅ Their own profile ONLY
- ✅ Their own journals ONLY
- ✅ Their own entries ONLY
- ✅ Public pages (home, about, blog)
- ✅ Active writing prompts
- ❌ Cannot see other users' private data

**How this works**:
The database knows who they are (`auth.uid()` = their unique user ID). Security policies check this ID and only show them their own data.

**Example**:
```
User Sarah logs in
Sarah's ID = abc-123-def

When Sarah runs: SELECT * FROM journal
She ONLY sees journals where user_id = 'abc-123-def'
She does NOT see John's journals or Maria's journals
```

**Real-world analogy**: Tenants in the building. Each tenant has their own apartment key and can only enter their own apartment.

### 🌍 Role 3: Website Visitors (anon / anonymous)

**These are people browsing your website before signing up.**

When someone visits your website without logging in, they're an "anonymous" user. They have very limited access.

**What they can see**:
- ✅ Public pages (home, about, blog) - Marketing content
- ✅ Active writing prompts - To encourage sign-ups
- ❌ Cannot see ANY profiles
- ❌ Cannot see ANY journals
- ❌ Cannot see ANY entries
- ❌ Cannot create or modify data

**Why public data is public**:
- **pages** table: Home page, about page, blog posts - You WANT visitors to read this!
- **writing_prompts** (active only): Show visitors what they'll get if they sign up

**Why private data is private**:
- **profiles, journals, entries**: Personal user data - Must be protected!

**Real-world analogy**: Someone walking by the building on the street. They can see the building's sign and lobby (public), but can't enter any apartments (private).

### 📊 Quick Reference Table

| What You're Looking At | postgres (SQL Editor) | authenticated (App Users) | anon (Visitors) |
|------------------------|----------------------|---------------------------|-----------------|
| **User profiles** | ✅ ALL profiles | ✅ Own profile only | ❌ None |
| **Journals** | ✅ ALL journals | ✅ Own journals only | ❌ None |
| **Journal entries** | ✅ ALL entries | ✅ Own entries only | ❌ None |
| **Pages (home, about)** | ✅ All pages | ✅ All pages | ✅ All pages |
| **Writing prompts** | ✅ All prompts | ✅ Active prompts | ✅ Active prompts |

### ⚠️ Critical Understanding: Why SQL Editor Shows Everything

**Your question might be**: "If I can see all users' data in SQL Editor, doesn't that mean security is broken?"

**Answer**: NO! Here's why:

1. **SQL Editor = postgres superuser** - You're the database owner, you bypass all security
2. **App = authenticated/anon roles** - Regular users go through security checks
3. **Security (RLS) STILL WORKS** - It applies to app users, not to you in SQL Editor

**Example to prove it works**:

When you run this in **SQL Editor (postgres)**:
```sql
SELECT COUNT(*) FROM journal;
```
Result: `42` (you see all 42 journals from everyone)

When Sarah runs the same query in **your React app (authenticated)**:
```sql
SELECT COUNT(*) FROM journal;
```
Result: `3` (Sarah only sees her 3 journals)

When Bob visits **without logging in (anon)**:
```sql
SELECT COUNT(*) FROM journal;
```
Result: `0` (anonymous users see no journals)

### 🧪 How to Test Security (You Can't From SQL Editor!)

**Important limitation**: You CANNOT test security policies from SQL Editor because you're postgres (bypasses everything).

**How to actually test security**:

**Option 1: Use Your React App** (Recommended)
1. Create 2 test users (Sarah and Bob)
2. Log in as Sarah, create a journal
3. Log out, log in as Bob
4. Verify Bob cannot see Sarah's journal
5. ✅ If Bob only sees his own data, security works!

**Option 2: Run Verification Scripts**
1. Use `db/VERIFY_READONLY.sql` - Checks policies exist
2. Use `db/VERIFY_ANONYMOUS_ACCESS.sql` - Simulates anonymous user
3. ⚠️ These verify structure, not full functional behavior

**Option 3: Check in App During Development**
1. Open browser console (F12)
2. Look at network requests to Supabase API
3. Verify queries only return user's own data
4. Check auth token is being sent correctly

### 💡 Key Takeaways Before You Continue

Before running migrations, remember:

1. ✅ **You're running migrations as postgres** - That's correct and expected
2. ✅ **You'll see all data in verification queries** - This is normal, you're the owner
3. ✅ **Security still works for app users** - They'll only see their own data
4. ✅ **Anonymous users see only public data** - Pages and prompts, nothing private
5. ⚠️ **Test security in your app, not SQL Editor** - SQL Editor bypasses RLS

**Analogy to remember**:
- **You in SQL Editor** = Building owner with master key (sees everything)
- **App users** = Tenants (see only their apartment)
- **Visitors** = People on street (see only public lobby)

All three roles are necessary and correct. The master key doesn't mean tenant locks don't work!

---

## Part 2: The 7 Database Migrations

Now that you understand the SQL Editor, let's build your database! We'll execute 7 migrations in order. Each migration builds on the previous one, so **don't skip any steps**.

### 📋 Migration Checklist

Use this to track your progress:

- ☐ Migration 1: Base Schema (4 tables, 15 policies)
- ☐ Migration 2: Soft Delete (trash bin feature)
- ☐ Migration 3: Admin Column (admin role flag)
- ☐ Migration 4: Admin Security (3-layer protection)
- ☐ Migration 5: Journal Icons (emoji support)
- ☐ Migration 6: Home Content (default homepage)
- ☐ Migration 7: Optional Enhancements (mood + prompts)

---

## Migration 1: Base Schema

**🎯 Purpose**: Create the foundation of your database with 4 core tables.

**⏱️ Estimated Time**: 30-45 seconds

**🔧 Complexity**: Medium (this is the biggest migration)

**📦 What This Creates**:
- `profiles` table - User profile information
- `journal` table - User journals with colors
- `entry` table - Journal entries with content
- `pages` table - CMS content for website
- 15 RLS policies - Security to protect user data
- 8 indexes - Speed up database queries
- 4 triggers - Auto-update timestamps
- 1 function - Update timestamps on changes

### 📝 Step-by-Step Instructions

#### Step 1.1: Open DATABASE_SETUP.md

1. **Open your file browser** (Finder on Mac, File Explorer on Windows)
2. **Navigate to your project folder**: `/Users/Ahmad/Work/Sistahology/Projects/sistahology-react`
3. **Find the file**: `DATABASE_SETUP.md`
4. **Open it**: Double-click to open in your text editor

💡 **Pro Tip**: If you use VS Code, right-click the file and select "Open Preview" to see it formatted nicely.

#### Step 1.2: Find the SQL Code

1. **Scroll down** to the section titled **"Step 1: Base Schema"**
2. **Look for**: The heading "### SQL to Execute"
3. **You'll see**: A large code block starting with:
   ```sql
   -- =====================================================
   -- SISTAHOLOGY DATABASE SCHEMA - BASE MIGRATION
   -- =====================================================
   ```
4. **This is your migration code**: We're going to copy ALL of it

#### Step 1.3: Copy the SQL (IMPORTANT: Get Everything!)

⚠️ **Critical**: You must copy the ENTIRE migration, from the first line to the last semicolon.

**How to copy correctly**:

1. **Find the start**: The first line with `--` comments
2. **Scroll to the end**: Look for the last semicolon `;` (it's after `CHECK (slug ~ '^[a-z0-9-]+$');`)
3. **Select everything**: Click at the start, hold Shift, click at the end
4. **Copy**: Press Cmd+C (Mac) or Ctrl+C (Windows)

**⚠️ Common Mistakes to Avoid**:
- ❌ Only copying part of the migration
- ❌ Missing the last semicolon
- ❌ Accidentally copying line numbers if your editor shows them
- ❌ Copying the "```sql" and "```" markdown markers

**✅ How to check you copied correctly**:
- First line should be a comment: `-- =====================================================`
- Last line should end with: `CHECK (slug ~ '^[a-z0-9-]+$');`
- Should be about 300-350 lines total

#### Step 1.4: Switch to Supabase

1. **Open your browser**
2. **Go to the Supabase tab** (or reopen: https://supabase.com/dashboard)
3. **Click "SQL Editor"** in the left sidebar
4. **You should see**: The query pane (big text box)

#### Step 1.5: Paste the SQL

1. **Click in the query pane** (the big text box)
2. **Clear any existing text**:
   - Press Cmd+A (Mac) or Ctrl+A (Windows) to select all
   - Press Delete or Backspace
3. **Paste your SQL**:
   - Press Cmd+V (Mac) or Ctrl+V (Windows)
4. **Verify it pasted correctly**:
   - First line should be: `-- =====================================================`
   - Should be hundreds of lines long
   - Ends with: `CHECK (slug ~ '^[a-z0-9-]+$');`

#### Step 1.6: Verify Schema Setting

This is THE MOST COMMON MISTAKE. Let's check it:

1. **Look at the top-left** of the SQL Editor
2. **Find the dropdown** next to "Query" (it might say "public" or something else)
3. **Check what it says**:
   - ✅ If it says **"public"**: Perfect! Continue to next step.
   - ❌ If it says anything else: Click the dropdown, select "public"

**💡 Pro Tip**: The schema dropdown remembers your last selection, so always double-check before running!

#### Step 1.7: Run the Migration

Ready? Let's do this!

1. **Take a deep breath**: You've got this!
2. **Double-check**: Schema is "public", SQL is pasted correctly
3. **Click the green "Run" button** (or press Cmd/Ctrl + Enter)
4. **You'll see**:
   - Loading spinner appears (usually 3-10 seconds)
   - Screen dims slightly
   - Button becomes disabled
5. **Don't close the browser!** Let it finish.

#### Step 1.8: Check for Success

After 5-10 seconds, you'll see a result. Let's interpret it:

**✅ SUCCESS Looks Like**:
```
✓ Success. No rows returned
Execution time: 3.2s
```

**If you see this**: Congratulations! Migration 1 is complete! 🎉

**❌ ERROR Looks Like**:
```
✗ ERROR: relation "profiles" already exists
at line 77
```

**If you see this**: Don't panic! Check Part 4: Troubleshooting Common Errors.

#### Step 1.9: Run the Verification Query

Let's confirm the tables were created correctly:

1. **Clear the query pane**: Select all (Cmd/Ctrl+A), delete
2. **Open DATABASE_SETUP.md** and find the "Verification" section under Step 1
3. **Copy this query**:
   ```sql
   SELECT table_name,
          CASE WHEN relrowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
   FROM information_schema.tables t
   LEFT JOIN pg_class c ON c.relname = t.table_name
   WHERE table_schema = 'public'
     AND table_name IN ('profiles', 'journal', 'entry', 'pages')
   ORDER BY table_name;
   ```
4. **Paste it** into the query pane
5. **Check schema**: Should be "public"
6. **Click "Run"**
7. **Check results pane**: You should see 4 rows:

   | table_name | rls_status |
   |------------|-----------|
   | entry      | ENABLED   |
   | journal    | ENABLED   |
   | pages      | ENABLED   |
   | profiles   | ENABLED   |

**✅ Success Criteria**:
- ✅ Exactly 4 rows returned
- ✅ All tables show "ENABLED" for RLS
- ✅ No error messages

**If verification fails**: See Part 4: Troubleshooting.

#### Step 1.10: Take a Screenshot (Optional but Recommended)

1. **Take a screenshot** of the success message
2. **Save it** as `migration-1-success.png`
3. **Why?** If something goes wrong later, you have proof this step worked

### ✅ Migration 1 Complete!

**What you just created**:
- 4 database tables (profiles, journal, entry, pages)
- 15 security policies (users can't access each other's data)
- 8 indexes (makes queries fast)
- 4 triggers (auto-updates timestamps)
- 1 function (handles timestamp updates)

**Update your checklist**:
- ✅ Migration 1: Base Schema (4 tables, 15 policies)
- ☐ Migration 2: Soft Delete (trash bin feature)
- ☐ Migration 3: Admin Column (admin role flag)
- ☐ Migration 4: Admin Security (3-layer protection)
- ☐ Migration 5: Journal Icons (emoji support)
- ☐ Migration 6: Home Content (default homepage)
- ☐ Migration 7: Optional Enhancements (mood + prompts)

---

## Migration 2: Soft Delete

**🎯 Purpose**: Add trash bin functionality with 30-day recovery window.

**⏱️ Estimated Time**: 5-10 seconds

**🔧 Complexity**: Easy

**📦 What This Creates**:
- `deleted_at` column in `entry` table
- 3 indexes for trash bin queries
- Enables "move to trash" instead of permanent delete

### 📝 Step-by-Step Instructions

#### Step 2.1: Copy the SQL

1. **Open DATABASE_SETUP.md**
2. **Scroll to**: "Step 2: Soft Delete Migration"
3. **Find**: The "### SQL to Execute" section
4. **Copy the entire code block** starting with:
   ```sql
   -- =====================================================
   -- MIGRATION: Add Soft Delete to Entry Table
   -- =====================================================
   ```
   And ending with:
   ```sql
   COMMIT;
   ```

#### Step 2.2: Paste and Run

1. **Switch to Supabase SQL Editor**
2. **Clear the query pane**: Cmd/Ctrl+A, then Delete
3. **Paste the SQL**: Cmd/Ctrl+V
4. **Check schema**: Should be "public"
5. **Click "Run"** (or Cmd/Ctrl+Enter)

#### Step 2.3: Check for Success

**✅ Expected Output**:
```
✓ Success. No rows returned
Execution time: 245ms
```

#### Step 2.4: Run Verification

1. **Clear the query pane**
2. **Paste this verification query** (from DATABASE_SETUP.md Step 2):
   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'entry'
     AND column_name = 'deleted_at';
   ```
3. **Click "Run"**
4. **Expected result**: 1 row showing:
   - `column_name`: deleted_at
   - `data_type`: timestamp with time zone
   - `is_nullable`: YES
   - `column_default`: NULL

### ✅ Migration 2 Complete!

**What you just added**:
- Soft delete capability (entries go to trash, not permanently deleted)
- 30-day recovery window (entries auto-delete after 30 days in trash)
- 3 performance indexes for trash queries

**Update your checklist**:
- ✅ Migration 1: Base Schema
- ✅ Migration 2: Soft Delete
- ☐ Migration 3: Admin Column
- ☐ Migration 4: Admin Security
- ☐ Migration 5: Journal Icons
- ☐ Migration 6: Home Content
- ☐ Migration 7: Optional Enhancements

---

## Migration 3: Admin Column

**🎯 Purpose**: Add admin role flag to user profiles.

**⏱️ Estimated Time**: 5 seconds

**🔧 Complexity**: Easy

**📦 What This Creates**:
- `is_admin` column in `profiles` table
- Default value: `false` (new users are regular users)
- 1 index for admin queries

### 📝 Step-by-Step Instructions

#### Step 3.1: Copy the SQL

1. **Open DATABASE_SETUP.md**
2. **Scroll to**: "Step 3: Admin Column Migration"
3. **Copy the SQL** starting with `BEGIN;` and ending with `COMMIT;`

#### Step 3.2: Paste and Run

1. **Switch to Supabase**
2. **Clear the query pane**
3. **Paste the SQL**
4. **Check schema**: "public"
5. **Click "Run"**

#### Step 3.3: Check for Success

**✅ Expected Output**:
```
✓ Success. No rows returned
Execution time: 180ms
```

#### Step 3.4: Run Verification

**Paste and run this**:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'is_admin';
```

**Expected result**: 1 row showing:
- `column_name`: is_admin
- `data_type`: boolean
- `is_nullable`: NO
- `column_default`: false

### ✅ Migration 3 Complete!

**What you just added**:
- Admin role column (determines who can access admin panel)
- Security default (new users can't be admin)
- Fast admin lookups (index on is_admin column)

**Update your checklist**:
- ✅ Migration 1: Base Schema
- ✅ Migration 2: Soft Delete
- ✅ Migration 3: Admin Column
- ☐ Migration 4: Admin Security
- ☐ Migration 5: Journal Icons
- ☐ Migration 6: Home Content
- ☐ Migration 7: Optional Enhancements

---

## Migration 4: Admin Security Hardening

**🎯 Purpose**: Prevent users from giving themselves admin privileges.

**⏱️ Estimated Time**: 15-20 seconds

**🔧 Complexity**: Medium (creates triggers and functions)

**📦 What This Creates**:
- 3 clean RLS policies for profiles
- 1 trigger function (blocks admin self-modification)
- 1 trigger (executes the function on profile updates)
- 3-layer security system

**⚠️ IMPORTANT**: This migration drops and recreates all policies on the profiles table. This is normal and expected.

### 📝 Step-by-Step Instructions

#### Step 4.1: Copy the SQL

1. **Open DATABASE_SETUP.md**
2. **Scroll to**: "Step 4: Admin Security Hardening"
3. **Copy the ENTIRE SQL block** (it's long - about 120 lines)
   - Starts with: `BEGIN;`
   - Ends with: `COMMIT;`

#### Step 4.2: Paste and Run

1. **Switch to Supabase**
2. **Clear the query pane**
3. **Paste the SQL**
4. **Check schema**: "public"
5. **Click "Run"**
6. **Wait**: This one takes 10-15 seconds (it's doing a lot)

#### Step 4.3: Check for Success

**✅ Expected Output**:
```
✓ Success. No rows returned
Execution time: 4.5s
```

You might also see some NOTICE messages like:
```
NOTICE: Column is_admin: EXISTS with DEFAULT false NOT NULL
```

**These are normal!** NOTICE messages are informational, not errors.

#### Step 4.4: Run Verification (IMPORTANT!)

This migration is critical for security, so we'll do a comprehensive test.

1. **Open DATABASE_SETUP.md**
2. **Scroll to**: "Section 7.1: Admin Security Test"
3. **Copy the entire test query** (it's about 100 lines)
4. **Paste into Supabase**
5. **Click "Run"**

**✅ Expected Results**: 5 rows, all showing "✓ PASS":

| test | result | details |
|------|--------|---------|
| TEST 1: Column Config | ✓ PASS | is_admin: DEFAULT false NOT NULL |
| TEST 2: RLS Status | ✓ PASS | RLS is ENABLED |
| TEST 3: Policy Count | ✓ PASS | Found 3 policies (expected: 3) |
| TEST 4: Trigger Exists | ✓ PASS | Trigger exists and enabled |
| TEST 5: Function Exists | ✓ PASS | Function exists |

**❌ If Any Test Shows "✗ FAIL"**: See Part 4: Troubleshooting.

### ✅ Migration 4 Complete!

**What you just created**:
- **Layer 1**: Column defaults (is_admin defaults to false)
- **Layer 2**: RLS policies (users can update their profile but not is_admin)
- **Layer 3**: Trigger protection (blocks any attempt to modify is_admin)

This is a **3-layer security system** that prevents privilege escalation attacks.

**Update your checklist**:
- ✅ Migration 1: Base Schema
- ✅ Migration 2: Soft Delete
- ✅ Migration 3: Admin Column
- ✅ Migration 4: Admin Security
- ☐ Migration 5: Journal Icons
- ☐ Migration 6: Home Content
- ☐ Migration 7: Optional Enhancements

---

## Migration 5: Journal Icon Support

**🎯 Purpose**: Allow users to add emoji icons to their journals.

**⏱️ Estimated Time**: 3 seconds

**🔧 Complexity**: Easy

**📦 What This Creates**:
- `icon` column in `journal` table
- Optional field (can be NULL)
- Supports emojis like 📔, 💭, 🌸

### 📝 Step-by-Step Instructions

#### Step 5.1: Copy the SQL

1. **Open DATABASE_SETUP.md**
2. **Scroll to**: "Step 5: Journal Icon Support"
3. **Copy the SQL** (just 3 lines):
   ```sql
   -- Migration: Add icon column to journal table

   ALTER TABLE journal ADD COLUMN IF NOT EXISTS icon TEXT;

   COMMENT ON COLUMN journal.icon IS 'Optional emoji icon for the journal (e.g., 📔, 💭, 🌸)';
   ```

#### Step 5.2: Paste and Run

1. **Switch to Supabase**
2. **Clear the query pane**
3. **Paste the SQL**
4. **Check schema**: "public"
5. **Click "Run"**

#### Step 5.3: Check for Success

**✅ Expected Output**:
```
✓ Success. No rows returned
Execution time: 95ms
```

#### Step 5.4: Run Verification

**Paste and run**:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'journal'
  AND column_name = 'icon';
```

**Expected result**: 1 row showing:
- `column_name`: icon
- `data_type`: text
- `is_nullable`: YES

### ✅ Migration 5 Complete!

**What you just added**:
- Emoji icon support for journals
- Optional field (users don't have to set an icon)
- Examples: 📔 Daily Journal, 💭 Dream Log, 🌸 Gratitude

**Update your checklist**:
- ✅ Migration 1: Base Schema
- ✅ Migration 2: Soft Delete
- ✅ Migration 3: Admin Column
- ✅ Migration 4: Admin Security
- ✅ Migration 5: Journal Icons
- ☐ Migration 6: Home Content
- ☐ Migration 7: Optional Enhancements

---

## Migration 6: Home Page Content Seed

**🎯 Purpose**: Add default welcome message to homepage.

**⏱️ Estimated Time**: 2 seconds

**🔧 Complexity**: Easy

**📦 What This Creates**:
- 1 row in `pages` table
- Slug: "home"
- Welcome message from founder Andrea Brooks
- Pink accent styling

### 📝 Step-by-Step Instructions

#### Step 6.1: Copy the SQL

1. **Open DATABASE_SETUP.md**
2. **Scroll to**: "Step 6: Home Page Content Seed"
3. **Copy the entire INSERT statement**
   - Starts with: `-- Seed the home page hero content`
   - Ends with: `content_html = EXCLUDED.content_html;`

⚠️ **Note**: This is a long INSERT with HTML content. Make sure you get all of it!

#### Step 6.2: Paste and Run

1. **Switch to Supabase**
2. **Clear the query pane**
3. **Paste the SQL**
4. **Check schema**: "public"
5. **Click "Run"**

#### Step 6.3: Check for Success

**✅ Expected Output**:
```
✓ Success. No rows returned
Execution time: 120ms
```

**OR** (if you run it twice):
```
✓ Success. 1 row affected
```

Both are correct! The query uses `ON CONFLICT` to update if the row already exists.

#### Step 6.4: Run Verification

**Paste and run**:
```sql
SELECT slug, title, LEFT(content_html, 50) as content_preview
FROM public.pages
WHERE slug = 'home';
```

**Expected result**: 1 row showing:
- `slug`: home
- `title`: WELCOME
- `content_preview`: `<h1 class="text-5xl md:text-7xl font-extrabold...`

### ✅ Migration 6 Complete!

**What you just added**:
- Default homepage content
- Welcome message from founder
- Pink accent styling
- Call-to-action button

**Update your checklist**:
- ✅ Migration 1: Base Schema
- ✅ Migration 2: Soft Delete
- ✅ Migration 3: Admin Column
- ✅ Migration 4: Admin Security
- ✅ Migration 5: Journal Icons
- ✅ Migration 6: Home Content
- ☐ Migration 7: Optional Enhancements

---

## Migration 7: Optional Enhancements (RECOMMENDED)

**🎯 Purpose**: Add mood tracking and writing prompts for better user experience.

**⏱️ Estimated Time**: 20-25 seconds

**🔧 Complexity**: Medium (creates new table with seed data)

**📦 What This Creates**:
- `mood` column in `entry` table (6 mood options)
- `writing_prompts` table (admin-managed prompts)
- 15 curated writing prompts across 5 categories
- 4 indexes for performance
- 2 RLS policies for prompts

**💡 Why Add This?**
- **Mood Tracking**: Users can track emotions over time
- **Writing Prompts**: Helps overcome writer's block
- **Analytics Ready**: Foundation for mood analytics dashboard
- **Admin Control**: Admins can add/edit prompts via CMS

### 📝 Step-by-Step Instructions

#### Step 7.1: Copy the SQL

1. **Open DATABASE_SETUP.md**
2. **Scroll to**: "Step 7: Optional Enhancements"
3. **Copy the ENTIRE migration** (it's long - about 150 lines)
   - Starts with: `BEGIN;`
   - Ends with: `COMMIT;`

⚠️ **Make sure you get**:
- The mood column creation
- The writing_prompts table
- All 15 seed prompts
- The COMMIT at the end

#### Step 7.2: Paste and Run

1. **Switch to Supabase**
2. **Clear the query pane**
3. **Paste the SQL**
4. **Check schema**: "public"
5. **Click "Run"**
6. **Wait**: This takes 15-20 seconds (it's inserting 15 prompts)

#### Step 7.3: Check for Success

**✅ Expected Output**:
```
✓ Success. No rows returned
Execution time: 8.3s
```

You should also see NOTICE messages like:
```
NOTICE: Added mood column to entry table
NOTICE: Inserted 15 default prompts across 5 categories
```

**These are good!** They confirm everything worked.

#### Step 7.4: Run Verification (Part 1: Mood Column)

**Paste and run**:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'entry'
  AND column_name = 'mood';
```

**Expected result**: 1 row showing:
- `column_name`: mood
- `data_type`: text
- `is_nullable`: YES

#### Step 7.5: Run Verification (Part 2: Prompts Count)

**Paste and run**:
```sql
SELECT
    COUNT(*) as total_prompts,
    COUNT(*) FILTER (WHERE is_active = TRUE) as active_prompts
FROM public.writing_prompts;
```

**Expected result**: 1 row showing:
- `total_prompts`: 15
- `active_prompts`: 15

#### Step 7.6: Run Verification (Part 3: Prompts by Category)

Let's see the prompts organized by category:

**Paste and run**:
```sql
SELECT category, COUNT(*) as count
FROM public.writing_prompts
WHERE is_active = TRUE
GROUP BY category
ORDER BY category;
```

**Expected result**: 5 rows showing:

| category | count |
|----------|-------|
| creativity | 3 |
| goal-setting | 3 |
| gratitude | 3 |
| reflection | 3 |
| self-discovery | 3 |

#### Step 7.7: (Optional) View All Prompts

Want to see what prompts were created? Run this:

```sql
SELECT category, prompt_text
FROM public.writing_prompts
WHERE is_active = TRUE
ORDER BY category, prompt_text;
```

You'll see all 15 prompts! Examples:
- **Gratitude**: "What are three things you're grateful for today?"
- **Reflection**: "What did you learn about yourself today?"
- **Goal-setting**: "What would you do if you knew you could not fail?"
- **Creativity**: "Describe your perfect day from morning to night."
- **Self-discovery**: "When do you feel most authentically yourself?"

### ✅ Migration 7 Complete!

**What you just added**:
- **Mood Tracking**: 6 mood options (happy, neutral, sad, anxious, excited, grateful)
- **Writing Prompts**: 15 curated prompts across 5 categories
- **Admin Control**: Prompts are admin-managed via CMS
- **Performance**: 4 indexes for fast queries
- **Security**: 2 RLS policies (users can read, admins can manage)

**Update your checklist**:
- ✅ Migration 1: Base Schema
- ✅ Migration 2: Soft Delete
- ✅ Migration 3: Admin Column
- ✅ Migration 4: Admin Security
- ✅ Migration 5: Journal Icons
- ✅ Migration 6: Home Content
- ✅ Migration 7: Optional Enhancements

**🎉 ALL MIGRATIONS COMPLETE!** You're done!

---

## Part 3: Final Verification

Congratulations on completing all 7 migrations! Let's do a final verification to make sure everything is set up correctly.

### ✅ Final Verification Checklist

Run through this checklist to confirm your database is healthy:

#### Check 1: Table Count

**Paste and run**:
```sql
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
```

**Expected result**: 5 tables (profiles, journal, entry, pages, writing_prompts)

#### Check 2: RLS Status on All Tables

**Paste and run**:
```sql
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected result**: 5 rows, all with `rls_enabled = true`

| schemaname | tablename | rls_enabled |
|------------|-----------|-------------|
| public | entry | true |
| public | journal | true |
| public | pages | true |
| public | profiles | true |
| public | writing_prompts | true |

#### Check 3: Policy Count by Table

**Paste and run**:
```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```

**Expected result**: 5 tables with policies

| tablename | policy_count |
|-----------|-------------|
| entry | 4 |
| journal | 4 |
| pages | 4 |
| profiles | 3 |
| writing_prompts | 2 |

**Total policies**: 17

#### Check 4: Index Count

**Paste and run**:
```sql
SELECT COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public';
```

**Expected result**: 15 indexes

#### Check 5: Trigger Count

**Paste and run**:
```sql
SELECT tgrelid::regclass as table_name, COUNT(*) as trigger_count
FROM pg_trigger
WHERE tgname NOT LIKE 'RI_ConstraintTrigger%'
  AND tgname NOT LIKE 'pg_%'
GROUP BY tgrelid
ORDER BY table_name;
```

**Expected result**: 6 triggers across 5 tables

#### Check 6: Function Count

**Paste and run**:
```sql
SELECT proname as function_name
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND prokind = 'f'
ORDER BY proname;
```

**Expected result**: 2 functions:
- `prevent_is_admin_modification`
- `update_updated_at_column`

### 🎯 Final Success Summary

If all checks passed, your database setup is complete! Here's what you have:

**📊 Database Statistics**:
- **Tables**: 5 (profiles, journal, entry, pages, writing_prompts)
- **Columns**: ~35 across all tables
- **Indexes**: 15 (for fast queries)
- **RLS Policies**: 17 (for data security)
- **Triggers**: 6 (for auto-updates and security)
- **Functions**: 2 (for timestamps and admin protection)
- **Seed Data**: 16 rows (1 home page, 15 writing prompts)

**🔒 Security Features**:
- ✅ Row-Level Security enabled on all tables
- ✅ Users can only access their own journals and entries
- ✅ Admins can manage pages and prompts
- ✅ 3-layer admin security (prevents privilege escalation)
- ✅ Soft delete with 30-day recovery
- ✅ Cascade deletes (clean up related records)

**⚡ Performance Features**:
- ✅ Full-text search on entry content (GIN index)
- ✅ Fast date range queries (B-tree indexes)
- ✅ Optimized trash bin queries (partial indexes)
- ✅ Fast admin lookups (filtered indexes)

**🎨 User Features**:
- ✅ Multi-journal support with color coding
- ✅ Journal emoji icons (📔, 💭, 🌸)
- ✅ Mood tracking (6 mood options)
- ✅ Writing prompts (15 curated prompts)
- ✅ CMS for homepage content
- ✅ Archive system for old entries
- ✅ Trash bin with recovery

---

## Part 4: Troubleshooting Common Errors

Even experienced developers hit errors! Here's how to fix the most common ones.

### Error 1: "relation already exists"

**Full error message**:
```
ERROR: relation "profiles" already exists
at line 77
```

**What it means**: The table already exists in your database.

**Causes**:
- You already ran this migration successfully
- You're re-running a migration

**Is this bad?**: NO! This usually means you already completed this step.

**How to fix**:
1. **Check if you already ran this migration**: Look at your checklist
2. **If you're re-running**: This is expected, just move to the next migration
3. **If this is your first time**: Run the verification query to see if the table exists

**Verification query**:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'profiles';
```

**If it returns a row**: The table exists, skip to the next migration.

### Error 2: "syntax error at or near"

**Full error message**:
```
ERROR: syntax error at or near "CREATE"
at line 105
```

**What it means**: The SQL code has a syntax error (typo or missing part).

**Causes**:
- Didn't copy the complete SQL (missing parts)
- Accidentally modified the SQL while pasting
- Copied markdown code markers (```sql)

**How to fix**:
1. **Go back to DATABASE_SETUP.md**
2. **Re-copy the ENTIRE migration** (from first line to last semicolon)
3. **Double-check**:
   - ✅ First line starts with `--` (comment)
   - ✅ Last line ends with `;` (semicolon)
   - ✅ No markdown markers (```)
   - ✅ No line numbers from your editor
4. **Clear the query pane completely**
5. **Paste again**
6. **Try running again**

### Error 3: "schema 'X' does not exist"

**Full error message**:
```
ERROR: schema "my_schema" does not exist
```

**What it means**: You have the wrong schema selected.

**Causes**:
- Schema dropdown is not set to "public"
- The dropdown remembered your last selection

**How to fix**:
1. **Look at the top-left** of the SQL Editor
2. **Find the schema dropdown**
3. **Click it** to open the dropdown menu
4. **Select "public"**
5. **Run the query again**

**💡 Pro Tip**: ALWAYS check the schema dropdown before running any migration!

### Error 4: "column already exists"

**Full error message**:
```
ERROR: column "deleted_at" of relation "entry" already exists
```

**What it means**: You're trying to add a column that already exists.

**Causes**:
- You already ran this migration
- The migration partially completed before

**Is this bad?**: NO! This means the column already exists.

**How to fix**:
1. **Run the verification query** for that migration (from DATABASE_SETUP.md)
2. **If the column exists with correct type**: Skip to next migration
3. **If the column is wrong**: See "Advanced: Reset a Migration" below

### Error 5: "permission denied for table X"

**Full error message**:
```
ERROR: permission denied for table profiles
```

**What it means**: You don't have permission to access this table.

**Causes**:
- RLS is enabled and you're not authenticated
- You're using the wrong Supabase project
- You're using anon key instead of service role key

**How to fix**:
1. **Verify you're in the correct Supabase project**:
   - Check the project URL: should be `klaspuhgafdjrrbdzlwg`
2. **Check which account you're logged in as**:
   - Look at top-right corner of Supabase dashboard
   - Should be your admin account
3. **If running from command line**: Use service role key in `.env.scripts`

### Error 6: "Query timeout after 60s"

**Full error message**:
```
ERROR: Query timeout after 60000ms
```

**What it means**: The migration took too long to run.

**Causes**:
- Database is under heavy load
- Migration is creating many indexes at once
- Network connection is slow

**How to fix**:
1. **Wait 30 seconds** and try again (database might be busy)
2. **Refresh the page** (sometimes the query actually completed)
3. **Check if the migration completed**:
   - Run the verification query
   - If tables/columns exist, it actually worked
4. **If still failing**: Try again in a few minutes

### Error 7: "Cannot find SQL Editor"

**What it means**: You can't locate the SQL Editor in Supabase.

**Causes**:
- You're in the wrong section of the dashboard
- Old Supabase UI version

**How to fix**:
1. **Look at the left sidebar** (the menu on the left)
2. **Find the icon** that looks like `</>`
3. **If you don't see it**:
   - Scroll down in the sidebar
   - Look for "SQL" or "SQL Editor"
4. **Still can't find it?**:
   - Go directly to: `https://supabase.com/dashboard/project/klaspuhgafdjrrbdzlwg/sql`
   - Replace `klaspuhgafdjrrbdzlwg` with your project ref

### Error 8: "Transaction aborted"

**Full error message**:
```
ERROR: current transaction is aborted, commands ignored until end of transaction block
```

**What it means**: A previous error caused the transaction to fail, and now all commands are ignored.

**Causes**:
- An earlier error in the migration
- Running multiple commands in a BEGIN/COMMIT block

**How to fix**:
1. **Clear the query pane**
2. **Run this command**:
   ```sql
   ROLLBACK;
   ```
3. **Then re-run the migration** from the beginning

### Advanced: How to Reset a Migration

⚠️ **WARNING**: This will DELETE data. Only do this if you need to start over.

**When to reset**:
- Migration partially completed
- Tables have wrong structure
- You want to completely start over

**How to reset a single table** (example: profiles):
```sql
DROP TABLE IF EXISTS public.profiles CASCADE;
```

**How to reset ALL tables** (nuclear option):
```sql
-- ⚠️ WARNING: This deletes EVERYTHING
DROP TABLE IF EXISTS public.writing_prompts CASCADE;
DROP TABLE IF EXISTS public.pages CASCADE;
DROP TABLE IF EXISTS public.entry CASCADE;
DROP TABLE IF EXISTS public.journal CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.prevent_is_admin_modification() CASCADE;
```

After running this, start from Migration 1 again.

### Getting Help

If you're stuck and none of these solutions work:

1. **Take a screenshot** of the error
2. **Copy the error message** (full text)
3. **Note which migration** you were running (1-7)
4. **Ask for help**:
   - Supabase Discord: https://discord.supabase.com
   - GitHub Issues: Create an issue with the error
   - Stack Overflow: Tag with "supabase" and "postgresql"

**Include in your help request**:
- Which migration (1-7)
- Full error message
- What you've tried so far
- Screenshot of the SQL Editor

---

## Part 5: What to Do Next

🎉 **Congratulations!** You've successfully set up your Sistahology database! Here's what to do next:

### Step 1: Update Your Environment Files

You need to create 3 environment files with your Supabase credentials:

#### File 1: `.env.local` (For Development)

1. **Create a new file** in your project root: `.env.local`
2. **Add these lines**:
   ```bash
   VITE_SUPABASE_URL=https://klaspuhgafdjrrbdzlwg.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```
3. **Replace** `your_anon_key_here` with your actual anon key

**Where to find your anon key**:
- Go to Supabase Dashboard
- Click "Settings" (gear icon) in left sidebar
- Click "API"
- Copy the "anon public" key

#### File 2: `.env.test` (For E2E Testing)

1. **Create a new file**: `.env.test`
2. **Add these lines**:
   ```bash
   VITE_SUPABASE_URL=https://klaspuhgafdjrrbdzlwg.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   E2E_USER_EMAIL=e2e.user@sistahology.dev
   E2E_USER_PASSWORD=create_a_strong_password_here
   ```

#### File 3: `.env.scripts` (For Admin Operations)

1. **Create a new file**: `.env.scripts`
2. **Add these lines**:
   ```bash
   SUPABASE_URL=https://klaspuhgafdjrrbdzlwg.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

**Where to find your service role key**:
- Go to Supabase Dashboard → Settings → API
- Copy the "service_role" key
- ⚠️ **KEEP THIS SECRET!** Never commit to GitHub!

**⚠️ SECURITY WARNING**: Add these to `.gitignore`:
```
.env.local
.env.test
.env.scripts
```

### Step 2: Create Test Users

Now let's create user accounts for testing:

#### Create Regular User

1. **Start your dev server**: `npm run dev`
2. **Open browser**: http://localhost:5173
3. **Click "Register"**
4. **Fill out the form**:
   - Email: `test@example.com` (or your email)
   - Password: Create a strong password
   - Display Name: `Test User`
5. **Click "Sign Up"**
6. **Check your email**: Click the confirmation link

#### Create E2E Test User

1. **Go to**: http://localhost:5173/register
2. **Fill out the form**:
   - Email: `e2e.user@sistahology.dev`
   - Password: (use the one from `.env.test`)
   - Display Name: `E2E Test User`
3. **Click "Sign Up"**
4. **Check email**: Confirm the account

### Step 3: Grant Admin Role

To access the admin panel, you need to grant admin privileges to a user.

**Option A: Use the Script (Recommended)**

```bash
# Install dependencies if you haven't
npm install

# Grant admin to your test account
npx tsx scripts/setAdminRole.ts --email test@example.com
```

**Option B: Create a New Admin User**

```bash
# This creates a new admin user in one step
npx tsx scripts/quickCreateAdmin.ts
```

Follow the prompts to create email and password.

**Option C: Grant Admin to E2E User (For Tests)**

```bash
npx tsx scripts/setAdminRole.ts --email e2e.user@sistahology.dev
```

### Step 4: Verify Everything Works

Let's test the app to make sure everything is connected correctly:

#### Test 1: Login

1. **Open**: http://localhost:5173/login
2. **Enter your credentials**
3. **Click "Sign In"**
4. **Expected**: You're redirected to /dashboard

#### Test 2: Create a Journal

1. **Go to**: http://localhost:5173/journals
2. **Click**: "Create Journal"
3. **Fill out**:
   - Name: "My First Journal"
   - Color: Pick a pink shade
   - Icon: 📔 (optional)
4. **Click**: "Create"
5. **Expected**: Journal appears in the list

#### Test 3: Create an Entry

1. **Click on your journal**
2. **Click**: "New Entry"
3. **Fill out**:
   - Title: "My First Entry"
   - Content: "Testing my new journal!"
   - Mood: "happy" (optional)
4. **Click**: "Save"
5. **Expected**: Entry is saved and appears in the list

#### Test 4: Access Admin Panel (If You Granted Admin)

1. **Go to**: http://localhost:5173/admin/pages
2. **Expected**: You see the admin CMS
3. **Try editing**: The "home" page
4. **Click**: "Save"
5. **Expected**: Changes are saved

### Step 5: Run E2E Tests

If you created the E2E test user and granted admin:

```bash
# Run regression tests (core functionality)
npm run test:regression

# Run journal flow tests
npm run test:journals

# Run security tests (requires admin granted to E2E user)
npm run test:security
```

**Expected**: Most tests should pass. Some may need fresh data.

### Step 6: Manual Testing Checklist

Go through this checklist to test all features:

**Authentication**:
- ☐ Register new account
- ☐ Confirm email
- ☐ Login
- ☐ Logout
- ☐ Forgot password (if implemented)

**Journals**:
- ☐ Create journal
- ☐ Edit journal name
- ☐ Edit journal color
- ☐ Add journal icon
- ☐ Delete journal

**Entries**:
- ☐ Create entry
- ☐ Edit entry
- ☐ Add mood to entry (new feature!)
- ☐ Delete entry (moves to trash)
- ☐ Recover from trash
- ☐ Permanently delete from trash

**Search**:
- ☐ Search by keyword
- ☐ Filter by date range
- ☐ Filter by journal
- ☐ Filter by word count
- ☐ Sort by date/relevance

**Calendar**:
- ☐ View calendar
- ☐ Click empty date (quick entry modal)
- ☐ Click existing entry (edit/delete controls)

**Admin** (if admin role granted):
- ☐ Access /admin/pages
- ☐ Edit home page
- ☐ Save changes
- ☐ View writing prompts (new feature!)
- ☐ Add new prompt
- ☐ Deactivate prompt

**Dashboard**:
- ☐ View statistics
- ☐ See recent entries
- ☐ Check writing streak

### Step 7: Start Developing!

Your database is set up and ready! Here's what you can do next:

**For Users**:
- ✅ Start journaling!
- ✅ Try mood tracking
- ✅ Use writing prompts for inspiration
- ✅ Explore calendar view
- ✅ Search your entries

**For Developers**:
- ✅ Review `CLAUDE.md` for architecture overview
- ✅ Check `TODO.md` for upcoming features
- ✅ Read `FEATURES.md` for complete feature list
- ✅ See `TESTING.md` for test strategy
- ✅ Start implementing new features!

**For Admins**:
- ✅ Customize homepage content
- ✅ Add new writing prompts
- ✅ Manage CMS content
- ✅ Monitor user feedback

### 🎉 You're Done!

**Congratulations!** You've successfully:
- ✅ Learned how to use Supabase SQL Editor
- ✅ Executed 7 database migrations
- ✅ Created 5 tables with 17 security policies
- ✅ Added 15 writing prompts
- ✅ Set up a complete, production-ready database
- ✅ Configured your development environment
- ✅ Created test users
- ✅ Granted admin privileges
- ✅ Verified everything works

**🚀 What You Built**:
- A secure, multi-user journaling platform
- Row-level security (users can't see each other's data)
- Admin role-based access control
- Soft delete with 30-day recovery
- Full-text search capabilities
- Mood tracking
- Writing prompts system
- CMS for content management

**⏱️ Total Time Spent**: ~45-60 minutes

**📊 Database Statistics**:
- Tables: 5
- Indexes: 15
- RLS Policies: 17
- Triggers: 6
- Functions: 2
- Seed Data: 16 rows

**🔒 Security Features**:
- 3-layer admin security
- Row-level security on all tables
- Cascade deletes
- Audit timestamps
- Check constraints

**🎨 User Features**:
- Multi-journal support
- Color coding
- Emoji icons
- Mood tracking (6 moods)
- Writing prompts (15 prompts)
- Archive system
- Trash bin with recovery
- Full-text search
- Calendar view
- Dashboard with stats

---

## 📚 Additional Resources

### Documentation Files

- **`DATABASE_SETUP.md`** - The SQL code you used (reference guide)
- **`DATABASE_RECOVERY.md`** - What to do if database is deleted
- **`CLAUDE.md`** - Project architecture and development guide
- **`FEATURES.md`** - Complete feature list
- **`TESTING.md`** - Test strategy and coverage
- **`TODO.md`** - Upcoming features and backlog

### Support

- **Supabase Discord**: https://discord.supabase.com
- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **GitHub Issues**: Create an issue in the project repo

### Tips for Maintaining Your Database

**Backups**:
- Supabase automatically backs up your database daily
- Download manual backups from: Dashboard → Database → Backups

**Monitoring**:
- Check database health: Dashboard → Database → Health
- View RLS policies: Dashboard → Authentication → Policies
- Check table structure: Dashboard → Table Editor

**Security**:
- Rotate your anon key every 90 days
- Never commit service role key to GitHub
- Regularly audit RLS policies
- Monitor authentication logs

**Performance**:
- Check slow queries: Dashboard → Database → Query Performance
- Add indexes for frequently queried columns
- Vacuum tables monthly (Supabase does this automatically)

### What to Do If Something Goes Wrong

**Database Deleted**:
- See `DATABASE_RECOVERY.md`
- Re-run all 7 migrations
- Restore from backup if available

**RLS Not Working**:
- Check policies in Dashboard → Authentication → Policies
- Verify RLS is enabled on tables
- Test with verification queries from DATABASE_SETUP.md

**Users Can See Each Other's Data**:
- RLS policies might be misconfigured
- Run admin security test from DATABASE_SETUP.md
- Check `auth.uid()` in policies

**Performance Issues**:
- Add indexes on frequently queried columns
- Check query performance in dashboard
- Consider pagination for large datasets

---

## 🎓 What You Learned

By completing this walkthrough, you learned:

**Database Concepts**:
- ✅ What a database schema is
- ✅ How tables, columns, and rows work
- ✅ What indexes do (make queries fast)
- ✅ How Row-Level Security (RLS) works
- ✅ What triggers and functions are

**Supabase Skills**:
- ✅ How to use the SQL Editor
- ✅ How to run SQL queries
- ✅ How to interpret success/error messages
- ✅ How to verify migrations worked
- ✅ How to troubleshoot common errors

**Security Knowledge**:
- ✅ How to prevent users from accessing each other's data
- ✅ How to prevent privilege escalation attacks
- ✅ How to use 3-layer security (defaults, RLS, triggers)
- ✅ How to grant admin privileges safely

**Development Practices**:
- ✅ How to set up environment files
- ✅ How to create test users
- ✅ How to verify database changes
- ✅ How to read and follow technical documentation

---

## Part 6: Optional - Organizing Future Development Queries 📁

### Should You Organize Queries in SQL Editor?

**For the 7 migrations you just ran**: ❌ NO
- They're one-time setup scripts
- Source of truth is your `db/` folder (version controlled)
- No need to save them in SQL Editor

**For future development work**: ✅ YES!
- RLS policy tests you'll run repeatedly
- Security verification scripts
- Debugging helpers
- Development queries

---

### 🗂️ Recommended Folder Structure

Here's a suggested organization for queries you'll create as you develop:

```
📁 Security
   ├─ RLS Policies
   │  ├─ Test User Isolation
   │  ├─ Test Admin Access
   │  └─ Verify Policy Coverage
   ├─ Admin Security
   │  ├─ Test Self-Granting Prevention
   │  └─ Verify Trigger Protection
   └─ Authentication
      ├─ Test Protected Routes
      └─ Verify Session Persistence

📁 Development Helpers
   ├─ Check Recent Entries
   ├─ View User Stats
   ├─ Count Journals by User
   └─ Find Orphaned Data

📁 Debugging
   ├─ Check Migration Status
   ├─ View Table Schemas
   └─ Inspect Indexes

📁 Verification Scripts
   ├─ Verify RLS Enabled
   ├─ Verify Admin Security
   └─ Verify Soft Delete Working
```

---

### 📖 How to Create Folders in SQL Editor

**Step-by-step**:

1. **Go to SQL Editor**
   - Click "SQL Editor" in left sidebar
   - You should see the query interface

2. **Create a New Folder**
   - Look for "New query" button (top right)
   - Click the dropdown arrow next to it
   - Select "New folder"

3. **Name Your Folder**
   - Type folder name (e.g., "Security")
   - Click "Create"

4. **Folder Appears in Sidebar**
   - You'll see it in the left panel
   - Can expand/collapse with triangle icon

5. **Create Queries Inside Folders**
   - Click on the folder first
   - Then click "New query"
   - Query will be created inside that folder

**💡 Pro Tip**: You can also drag existing queries into folders after creating them!

---

### ✅ When to Save Queries

**Save queries that you'll run repeatedly**:

✅ **RLS Policy Tests** (run after schema changes)
```sql
-- Test User Isolation
SELECT
  COUNT(*) as my_entries,
  (SELECT COUNT(*) FROM entry) as total_entries
FROM entry
WHERE user_id = auth.uid();
```

✅ **Security Verification** (run during testing)
```sql
-- Verify RLS Enabled
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public';
```

✅ **Development Helpers** (use during coding)
```sql
-- Count Journals by User
SELECT
  user_id,
  COUNT(*) as journal_count
FROM journal
GROUP BY user_id;
```

✅ **Debugging Queries** (troubleshoot issues)
```sql
-- Find Entries with Missing Journals
SELECT e.*
FROM entry e
LEFT JOIN journal j ON e.journal_id = j.id
WHERE j.id IS NULL;
```

---

### ❌ When NOT to Save Queries

**Don't save queries that are one-time or ad-hoc**:

❌ **Initial Migrations** (already in `db/` folder)
- Run once, then forget
- Source of truth is your codebase

❌ **Random Experiments**
- Testing something quickly
- Won't reuse later

❌ **Queries You Copied from Stack Overflow**
- Unless you'll actually use them repeatedly
- SQL Editor history keeps recent queries anyway

---

### 📋 Example: Saving Your First Security Query

Let's save a query to test user data isolation (important for privacy!):

**Step 1: Write the Query**

Paste this into SQL Editor:

```sql
-- Test User Isolation
-- Purpose: Verify users can only see their own journals and entries
-- Run this as different users to confirm RLS is working

-- Check journals
SELECT
  'journals' as table_name,
  COUNT(*) as my_count,
  (SELECT COUNT(*) FROM journal) as total_count
FROM journal
WHERE user_id = auth.uid()

UNION ALL

-- Check entries
SELECT
  'entries' as table_name,
  COUNT(*) as my_count,
  (SELECT COUNT(*) FROM entry) as total_count
FROM entry
WHERE user_id = auth.uid();

-- Expected Result:
-- - my_count should be LESS than total_count
-- - If they're equal, you might be the only user OR RLS isn't working
-- - If my_count is 0 but total_count > 0, RLS is working correctly
```

**Step 2: Save It**

1. Click **"Save"** button (top right of query pane)
2. **Name**: "Test User Isolation"
3. **Description**: "Verify users can only see own data"
4. **Folder**: Select "Security → RLS Policies" (or create this folder first)
5. Click **"Save"**

**Step 3: Run It Anytime**

Now whenever you need to test user isolation:
1. Go to SQL Editor
2. Find saved query in sidebar under "Security → RLS Policies"
3. Click "Test User Isolation"
4. Click "Run"
5. Verify results look correct

---

### 🔍 Example: Saving Admin Security Verification

Here's another useful query to save:

```sql
-- Verify Admin Security (3-Layer Protection)
-- Purpose: Confirm admin security is properly configured
-- Expected: All checks should return TRUE or expected values

-- Layer 1: Check column default
SELECT
  column_default = 'false' as layer1_default_correct
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name = 'is_admin';

-- Layer 2: Check RLS policies exist
SELECT
  COUNT(*) = 3 as layer2_policies_correct
FROM pg_policies
WHERE tablename = 'profiles';

-- Layer 3: Check trigger exists
SELECT
  COUNT(*) > 0 as layer3_trigger_exists
FROM pg_trigger
WHERE tgname = 'prevent_is_admin_self_modification';

-- All results should show 'true' or '3' for policies
```

**Save this as**:
- Name: "Verify Admin Security"
- Folder: "Security → Admin Security"
- Run this whenever you modify the profiles table

---

### 👥 Sharing Folders with Your Team

If you work with other developers:

**How to Share**:
1. Create folder (e.g., "Team - Security Tests")
2. Right-click folder → "Share"
3. Set permissions (view or edit)
4. Team members see same queries

**Benefits**:
- ✅ Consistent testing across team
- ✅ Onboard new developers faster
- ✅ Document common debugging queries
- ✅ Share best practices

---

### 📊 Organizing Verification Scripts from Your Codebase

You already have great verification scripts in your `db/` folder! Consider saving these in SQL Editor:

**From `db/VERIFY_READONLY.sql`**:
- Save sections as individual queries
- Folder: "Verification Scripts"
- Run them after schema changes

**From `db/TEST_ADMIN_SECURITY_SIMPLE.sql`**:
- Save as "Test Admin Security"
- Folder: "Security → Admin Security"
- Run during security testing

**From `db/VERIFY_IS_ADMIN.sql`**:
- Save as "Check Admin Users"
- Folder: "Development Helpers"
- Run to see who has admin access

---

### 🎯 Best Practices for SQL Editor Organization

**DO**:
- ✅ Use descriptive names ("Test RLS" not "Query 1")
- ✅ Add comments in queries explaining purpose
- ✅ Organize by purpose (Security, Development, Debugging)
- ✅ Save queries you run weekly/monthly
- ✅ Share useful queries with team

**DON'T**:
- ❌ Save every random query
- ❌ Duplicate queries from your codebase (just link to `db/` folder)
- ❌ Create too many folders (keep it simple)
- ❌ Save queries you'll never run again
- ❌ Forget to add comments/descriptions

---

### 💡 Pro Tips for SQL Editor

**Keyboard Shortcuts**:
- `Cmd/Ctrl + Enter`: Run query
- `Cmd/Ctrl + S`: Save query
- `Cmd/Ctrl + K`: Open command palette
- `Cmd/Ctrl + F`: Find in query

**Quick Access**:
- Use SQL Editor's search (top of sidebar)
- Favorite frequently-run queries (star icon)
- Use query history for recent queries

**Collaboration**:
- Comment queries with `--` for team context
- Use consistent naming (verb + noun: "Check RLS", "Verify Policies")
- Update descriptions when queries change

---

### 🎓 What You Learned in Part 6

**SQL Editor Organization**:
- ✅ When to save queries (repeated use) vs. when not to (one-time)
- ✅ How to create folders for organization
- ✅ Recommended folder structure for development work
- ✅ How to save and retrieve queries
- ✅ Best practices for naming and commenting

**Workflow**:
- ✅ Keep migrations in `db/` folder (source of truth)
- ✅ Use SQL Editor for queries you run repeatedly
- ✅ Organize by purpose (Security, Development, Debugging)
- ✅ Share useful queries with team

---

## 📝 Feedback

This walkthrough was designed to be as beginner-friendly as possible. If you:

- Found a section confusing
- Hit an error not covered here
- Have suggestions for improvement
- Want to share your success story

Please create an issue on GitHub or reach out!

---

**Last Updated**: January 4, 2025
**Version**: 1.0.0
**Maintainer**: Sistahology Development Team
**License**: MIT

---

🌸 **Happy Journaling with Sistahology!** 🌸
