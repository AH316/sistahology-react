# RLS Status Catalog
**Generated:** 2025-08-25  
**Source:** pg_class system catalog  
**Database:** Sistahology

---

## RLS Enablement Status

### Core Application Tables

| Schema | Table | RLS Status | Security Level | Data Sensitivity |
|--------|-------|------------|----------------|------------------|
| public | profiles | ✅ ENABLED | HIGH | Personal user data |
| public | journal | ✅ ENABLED | HIGH | Private user journals |
| public | entry | ✅ ENABLED | HIGH | Private journal content |
| public | pages | ✅ ENABLED | MEDIUM | Public CMS content |

### System Tables (If Present)

| Schema | Table | RLS Status | Notes |
|--------|-------|------------|-------|
| auth | users | N/A | Managed by Supabase |
| auth | sessions | N/A | Managed by Supabase |
| auth | refresh_tokens | N/A | Managed by Supabase |

---

## RLS Configuration Details

### Query to Check RLS Status
```sql
SELECT 
    n.nspname as schema,
    c.relname as table,
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as rls_forced,
    CASE 
        WHEN c.relrowsecurity THEN 'ENABLED'
        ELSE 'DISABLED'
    END as status,
    CASE 
        WHEN c.relforcerowsecurity THEN 'YES'
        ELSE 'NO'
    END as forced_for_owner
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'  -- regular tables only
  AND n.nspname = 'public'
  AND c.relname IN ('profiles', 'journal', 'entry', 'pages')
ORDER BY n.nspname, c.relname;
```

---

## Table Security Classifications

### Tier 1: Critical User Data (RLS Required)
**Status:** ✅ All Protected

| Table | Contains | RLS Requirement | Compliance |
|-------|----------|-----------------|------------|
| profiles | User PII, email, profile data | MANDATORY | ✅ COMPLIANT |
| journal | User's private journals | MANDATORY | ✅ COMPLIANT |
| entry | Journal content, thoughts | MANDATORY | ✅ COMPLIANT |

### Tier 2: Public/Semi-Public Data
**Status:** ✅ Appropriately Configured

| Table | Contains | RLS Requirement | Compliance |
|-------|----------|-----------------|------------|
| pages | CMS content for public pages | RECOMMENDED | ✅ COMPLIANT |

### Tier 3: System/Reference Data
**Status:** N/A - No reference tables identified

---

## RLS Enforcement Levels

### Current Configuration

| Table | RLS Enabled | Force for Owner | Bypass Possible |
|-------|-------------|-----------------|-----------------|
| profiles | ✅ YES | ❌ NO | Service role only |
| journal | ✅ YES | ❌ NO | Service role only |
| entry | ✅ YES | ❌ NO | Service role only |
| pages | ✅ YES | ❌ NO | Service role only |

### What This Means
- **RLS Enabled:** Policies are active for all normal database connections
- **Force for Owner:** Table owners (typically not enforced, allowing admin bypass)
- **Service Role Bypass:** Only Supabase service role can bypass RLS

---

## Security Posture Assessment

### ✅ Strengths
1. **100% RLS Coverage** on user data tables
2. **Consistent enforcement** across all sensitive tables
3. **No gaps** in critical data protection

### ⚠️ Considerations
1. **Service role bypass** - Ensure service role key is never exposed to client
2. **Force for owner** not enabled - Consider if admin oversight is needed
3. **Audit logging** - No apparent audit trail for RLS bypass events

---

## Enabling RLS Force for Owner

If stricter security is needed, force RLS even for table owners:

```sql
-- Force RLS for table owners (admins)
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.journal FORCE ROW LEVEL SECURITY;
ALTER TABLE public.entry FORCE ROW LEVEL SECURITY;
ALTER TABLE public.pages FORCE ROW LEVEL SECURITY;
```

**Warning:** This will apply RLS even to database owners and may complicate administrative tasks.

---

## RLS Monitoring Queries

### Check for Tables Missing RLS
```sql
-- Find unprotected tables in public schema
SELECT 
    schemaname,
    tablename,
    'MISSING RLS' as issue
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
  AND NOT c.relrowsecurity
  AND t.tablename NOT LIKE 'pg_%'
  AND t.tablename NOT LIKE '__%';
```

### Audit Policy Coverage
```sql
-- Check which operations lack policies
WITH policy_coverage AS (
    SELECT 
        tablename,
        cmd,
        COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename, cmd
),
expected_ops AS (
    SELECT 
        t.tablename,
        op.operation
    FROM pg_tables t
    CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE')) AS op(operation)
    WHERE t.schemaname = 'public'
      AND t.tablename IN ('profiles', 'journal', 'entry', 'pages')
)
SELECT 
    e.tablename,
    e.operation,
    COALESCE(p.policy_count, 0) as policies,
    CASE 
        WHEN COALESCE(p.policy_count, 0) = 0 THEN '❌ MISSING'
        ELSE '✅ COVERED'
    END as status
FROM expected_ops e
LEFT JOIN policy_coverage p 
    ON e.tablename = p.tablename 
    AND e.operation = p.cmd
ORDER BY e.tablename, e.operation;
```

---

## Recommendations

### Immediate Actions
1. ✅ **No immediate actions required** - RLS is properly enabled

### Future Enhancements
1. **Enable FORCE ROW LEVEL SECURITY** for stricter admin controls
2. **Implement audit logging** for security-sensitive operations
3. **Regular automated checks** for RLS status changes
4. **Document service role usage** patterns and restrictions

---

## Compliance Checklist

| Requirement | Status | Evidence |
|-------------|--------|----------|
| User data protected by RLS | ✅ PASS | All user tables have RLS enabled |
| Policies cover all operations | ✅ PASS | SELECT, INSERT, UPDATE, DELETE covered |
| No unauthorized data access | ✅ PASS | Policies enforce user isolation |
| Admin access controlled | ✅ PASS | Pages table has admin-only write |
| Service role documented | ⚠️ REVIEW | Ensure key management procedures exist |

---

## Quick Enable/Disable Commands

### Enable RLS (Idempotent)
```sql
-- Enable RLS on all user tables
DO $$ 
BEGIN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.journal ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.entry ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN others THEN NULL;
END $$;
```

### Emergency Disable (Use with Caution!)
```sql
-- WARNING: This disables security!
-- Only use in emergency maintenance with service role
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages DISABLE ROW LEVEL SECURITY;
```

---

*End of RLS Status Catalog*