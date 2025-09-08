# RLS Policies Catalog
**Generated:** 2025-08-25  
**Source:** pg_policies system catalog  
**Database:** Sistahology

---

## Policy Inventory by Table

### Table: `profiles`

| Policy Name | Command | Type | Roles | Using Clause | With Check |
|------------|---------|------|-------|--------------|------------|
| Users can view own profile | SELECT | PERMISSIVE | {public} | `(auth.uid() = id)` | - |
| Users can update own profile | UPDATE | PERMISSIVE | {public} | `(auth.uid() = id)` | `(auth.uid() = id)` |
| Users can insert own profile | INSERT | PERMISSIVE | {public} | - | `(auth.uid() = id)` |
| Users can delete own profile | DELETE | PERMISSIVE | {public} | `(auth.uid() = id)` | - |

**Coverage:** ✅ Complete (SELECT, INSERT, UPDATE, DELETE)

---

### Table: `journal`

| Policy Name | Command | Type | Roles | Using Clause | With Check |
|------------|---------|------|-------|--------------|------------|
| Users can view own journals | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id)` | - |
| Users can create own journals | INSERT | PERMISSIVE | {public} | - | `(auth.uid() = user_id)` |
| Users can update own journals | UPDATE | PERMISSIVE | {public} | `(auth.uid() = user_id)` | `(auth.uid() = user_id)` |
| Users can delete own journals | DELETE | PERMISSIVE | {public} | `(auth.uid() = user_id)` | - |

**Coverage:** ✅ Complete (SELECT, INSERT, UPDATE, DELETE)  
**Key Column:** `user_id` (foreign key to auth.users)

---

### Table: `entry`

| Policy Name | Command | Type | Roles | Using Clause | With Check |
|------------|---------|------|-------|--------------|------------|
| Users can view own entries | SELECT | PERMISSIVE | {public} | `(auth.uid() = user_id) OR EXISTS(...)` | - |
| Users can create entries in own journals | INSERT | PERMISSIVE | {public} | - | `(auth.uid() = user_id) AND EXISTS(...)` |
| Users can update own entries | UPDATE | PERMISSIVE | {public} | `(auth.uid() = user_id) OR EXISTS(...)` | `(auth.uid() = user_id) OR EXISTS(...)` |
| Users can delete own entries | DELETE | PERMISSIVE | {public} | `(auth.uid() = user_id) OR EXISTS(...)` | - |

**Coverage:** ✅ Complete (SELECT, INSERT, UPDATE, DELETE)  
**Complex Logic:** Uses both direct user_id check and journal ownership validation

**Expanded EXISTS Clause:**
```sql
EXISTS (
    SELECT 1 FROM public.journal 
    WHERE journal.id = entry.journal_id 
    AND journal.user_id = auth.uid()
)
```

---

### Table: `pages`

| Policy Name | Command | Type | Roles | Using Clause | With Check |
|------------|---------|------|-------|--------------|------------|
| Public can view pages | SELECT | PERMISSIVE | {public} | `true` | - |
| Admins can insert pages | INSERT | PERMISSIVE | {public} | - | `EXISTS(admin check)` |
| Admins can update pages | UPDATE | PERMISSIVE | {public} | `EXISTS(admin check)` | `EXISTS(admin check)` |
| Admins can delete pages | DELETE | PERMISSIVE | {public} | `EXISTS(admin check)` | - |

**Coverage:** ✅ Complete (SELECT, INSERT, UPDATE, DELETE)  
**Access Model:** Public read, admin-only write

**Admin Check Expansion:**
```sql
EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.uid() = id 
    AND raw_app_meta_data->>'role' = 'admin'
)
```

---

## Policy Type Distribution

| Type | Count | Percentage | Usage |
|------|-------|------------|-------|
| PERMISSIVE | 16 | 100% | All current policies |
| RESTRICTIVE | 0 | 0% | Not currently used |

**Note:** All policies are PERMISSIVE, meaning they grant access. No RESTRICTIVE policies are currently blocking access patterns.

---

## Security Functions Used

### Core Functions
| Function | Purpose | Usage Count |
|----------|---------|-------------|
| `auth.uid()` | Get current user ID | 16 policies |
| `EXISTS()` | Subquery validation | 7 policies |

### Column References
| Column | Table | Purpose | Policy Count |
|--------|-------|---------|--------------|
| `id` | profiles | User identifier | 4 |
| `user_id` | journal | Owner reference | 4 |
| `user_id` | entry | Owner reference | 4 |
| `journal_id` | entry | Parent reference | 4 |

---

## Policy Patterns Analysis

### Pattern 1: Simple Ownership
**Used in:** profiles, journal tables  
**Pattern:** `auth.uid() = [owner_column]`  
**Security Level:** High - Direct ownership validation

### Pattern 2: Cascading Ownership
**Used in:** entry table  
**Pattern:** Direct check OR parent ownership check  
**Security Level:** Medium - Multiple validation paths

### Pattern 3: Public Read
**Used in:** pages table  
**Pattern:** `true` for SELECT  
**Security Level:** Appropriate for public content

### Pattern 4: Role-Based Access
**Used in:** pages table (admin operations)  
**Pattern:** Check user metadata for role  
**Security Level:** High - Requires JWT role claim

---

## Missing Policies & Recommendations

### Potential Gaps
1. **No service role bypass policies** - Service role operates outside RLS
2. **No time-based policies** - Could add for scheduled content
3. **No group/team policies** - Future feature consideration

### Recommended Additions
```sql
-- Example: Time-based content publishing
CREATE POLICY "View published pages only" ON public.pages
    FOR SELECT 
    USING (published_at <= NOW() OR admin_check);

-- Example: Shared journals (future feature)
CREATE POLICY "View shared journals" ON public.journal
    FOR SELECT 
    USING (
        auth.uid() = user_id 
        OR 
        id IN (SELECT journal_id FROM journal_shares WHERE user_id = auth.uid())
    );
```

---

## Policy Execution Order

Policies are evaluated in the following order:
1. RESTRICTIVE policies (if any) - ALL must pass
2. PERMISSIVE policies - ANY can pass

Current setup uses only PERMISSIVE policies, so first matching policy grants access.

---

## Performance Considerations

### Indexed Columns for RLS
Ensure these columns have indexes for optimal RLS performance:
- ✅ `profiles.id` (PRIMARY KEY)
- ✅ `journal.user_id` (should have index)
- ✅ `journal.id` (PRIMARY KEY)
- ✅ `entry.journal_id` (should have index)
- ✅ `entry.user_id` (should have index)
- ✅ `pages.slug` (UNIQUE index)

### Complex Policy Performance
The `entry` table policies use EXISTS subqueries which may impact performance at scale. Consider monitoring and potentially adding materialized views if needed.

---

## SQL Query Equivalent

To retrieve this catalog directly from the database:
```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_clause,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;
```

---

*End of Policies Catalog*