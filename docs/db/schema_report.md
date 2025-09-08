# Sistahology Database Schema Report

**Generated**: 2025-09-02  
**Purpose**: Comprehensive schema documentation with tables, relationships, indexes, and triggers  
**Source**: Analysis of `/db/exports/schema.sql` and RLS verification scripts  

---

## Executive Summary

The Sistahology database implements a secure multi-tenant journaling platform with 4 core tables, comprehensive Row Level Security (RLS) policies, and a performance-optimized index strategy. All tables utilize UUID primary keys and timestamp audit trails with automated triggers.

**Key Metrics**:
- **Tables**: 4 core tables (`profiles`, `journal`, `entry`, `pages`)
- **Indexes**: 9 strategic indexes for performance optimization
- **RLS Policies**: 16 comprehensive security policies across all tables
- **Triggers**: 4 automated `updated_at` timestamp triggers
- **Constraints**: 3 business logic validation constraints

---

## Table Structure & Relationships

### 1. `profiles` Table
**Purpose**: User profile management and authentication integration

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE | User identifier linked to Supabase Auth |
| `email` | TEXT | NOT NULL | User's email address |
| `full_name` | TEXT | | User's display name |
| `avatar_url` | TEXT | | Profile picture URL |
| `created_at` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Last modification time |

**Indexes**:
- `idx_profiles_email` ON (`email`) - Email lookup optimization

**Foreign Keys**:
- `id` → `auth.users(id)` CASCADE DELETE (Supabase Auth integration)

### 2. `journal` Table
**Purpose**: User-owned journal containers with customization

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Journal identifier |
| `user_id` | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Journal owner |
| `journal_name` | TEXT | NOT NULL, CHECK constraint for non-empty | Journal display name |
| `color` | TEXT | DEFAULT '#F5C3E2' | Journal theme color |
| `created_at` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Last modification time |

**Indexes**:
- `idx_journal_user_id` ON (`user_id`) - Owner-based filtering
- `idx_journal_created_at` ON (`created_at DESC`) - Chronological sorting

**Foreign Keys**:
- `user_id` → `auth.users(id)` CASCADE DELETE

**Constraints**:
- `check_journal_name_not_empty`: Ensures journal names contain actual content

### 3. `entry` Table
**Purpose**: Individual journal entries with rich content and metadata

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Entry identifier |
| `journal_id` | UUID | NOT NULL, REFERENCES journal(id) ON DELETE CASCADE | Parent journal |
| `user_id` | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Entry author |
| `title` | TEXT | | Optional entry title |
| `content` | TEXT | NOT NULL | Entry content (markdown/HTML) |
| `entry_date` | DATE | NOT NULL, DEFAULT CURRENT_DATE, CHECK constraint | Entry date |
| `is_archived` | BOOLEAN | DEFAULT FALSE | Archival status |
| `created_at` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Last modification time |

**Indexes**:
- `idx_entry_journal_id` ON (`journal_id`) - Journal-based filtering
- `idx_entry_user_id` ON (`user_id`) - User-based filtering  
- `idx_entry_date` ON (`entry_date DESC`) - Chronological sorting
- `idx_entry_archived` ON (`is_archived`) - Archival status filtering
- `idx_entry_content_search` GIN ON (`to_tsvector('english', content)`) - Full-text search

**Foreign Keys**:
- `journal_id` → `journal(id)` CASCADE DELETE
- `user_id` → `auth.users(id)` CASCADE DELETE

**Constraints**:
- `check_entry_date_not_future`: Prevents entries with future dates

### 4. `pages` Table  
**Purpose**: CMS content management for static pages

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Page identifier |
| `slug` | TEXT | UNIQUE NOT NULL, CHECK constraint for URL format | URL-friendly identifier |
| `title` | TEXT | NOT NULL | Page title |
| `content_html` | TEXT | | Page content (HTML) |
| `created_at` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `updated_at` | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | Last modification time |

**Indexes**:
- `idx_pages_slug` UNIQUE ON (`slug`) - URL routing optimization

**Constraints**:
- `check_page_slug_format`: Ensures slugs match pattern `^[a-z0-9-]+$`

---

## Relationship Diagram

```
auth.users (Supabase)
    ↓ (1:1)
profiles (User profile data)
    
auth.users (Supabase)  
    ↓ (1:N)
journal (User's journals)
    ↓ (1:N)  
entry (Journal entries)
    ↑ (N:1)
auth.users (Direct user reference)

pages (CMS content - standalone)
```

---

## Triggers & Automation

### Update Timestamp Triggers
All tables implement automated `updated_at` timestamp management:

**Function**: `update_updated_at_column()`
- **Language**: PL/pgSQL  
- **Purpose**: Sets `NEW.updated_at = CURRENT_TIMESTAMP` on UPDATE operations
- **Returns**: TRIGGER

**Applied To**:
- `update_profiles_updated_at` → `profiles` table
- `update_journal_updated_at` → `journal` table  
- `update_entry_updated_at` → `entry` table
- `update_pages_updated_at` → `pages` table

**Trigger Configuration**: `BEFORE UPDATE FOR EACH ROW`

---

## Performance Index Strategy

### Query Optimization Indexes

1. **User-Centric Queries**:
   - `idx_profiles_email`: Email-based user lookup
   - `idx_journal_user_id`: User's journals filtering  
   - `idx_entry_user_id`: User's entries filtering

2. **Hierarchical Relationships**:
   - `idx_entry_journal_id`: Journal → entries navigation

3. **Chronological Queries**:
   - `idx_journal_created_at DESC`: Recent journals first
   - `idx_entry_date DESC`: Recent entries first  

4. **Content Discovery**:
   - `idx_entry_content_search` (GIN): Full-text search across entry content
   - `idx_pages_slug` (UNIQUE): Fast URL routing

5. **Status Filtering**:
   - `idx_entry_archived`: Active vs archived entry filtering

### Index Coverage Analysis
- **User isolation queries**: Fully covered by user_id indexes
- **Journal browsing**: Covered by journal_id and date indexes  
- **Search functionality**: Covered by GIN full-text index
- **CMS routing**: Covered by unique slug index

---

## Data Integrity & Constraints

### Business Logic Constraints

1. **`check_journal_name_not_empty`**:
   - **Table**: `journal`
   - **Rule**: `LENGTH(TRIM(journal_name)) > 0`
   - **Purpose**: Prevents empty or whitespace-only journal names

2. **`check_entry_date_not_future`**:
   - **Table**: `entry`  
   - **Rule**: `entry_date <= CURRENT_DATE`
   - **Purpose**: Prevents backdating or future-dating entries

3. **`check_page_slug_format`**:
   - **Table**: `pages`
   - **Rule**: `slug ~ '^[a-z0-9-]+$'`
   - **Purpose**: Ensures URL-safe slug format (lowercase, numbers, hyphens only)

### Referential Integrity

**Cascade Delete Patterns**:
- User deletion → Cascades to profiles, journals, entries (complete cleanup)
- Journal deletion → Cascades to entries (preserves user profile)
- Pages table → Standalone (no cascade dependencies)

---

## Schema Adaptability Notes

The database schema demonstrates flexibility for evolution:

### Historical Compatibility
- **Column Detection**: RLS verification scripts auto-detect `owner_id` vs `user_id` naming
- **Migration Safety**: All DDL uses `IF NOT EXISTS` for idempotent application
- **Schema Version Tolerance**: Handles both legacy and current column naming conventions

### Future Extensibility  
- **UUID Primary Keys**: Enable distributed database scaling
- **JSON Support**: PostgreSQL JSON columns ready for flexible metadata
- **GIN Indexes**: Prepared for complex search requirements
- **Timestamp Auditing**: Complete audit trail on all tables

---

## Performance Characteristics

### Query Performance Profile
- **User Dashboard**: Optimized by `user_id` indexes across all tables
- **Journal Navigation**: Efficient via `journal_id` + `entry_date` indexes
- **Search Operations**: Full-text search via GIN index on entry content  
- **CMS Routing**: Single-lookup via unique slug index

### Storage Efficiency
- **UUID Storage**: 16 bytes per primary key (vs 8 for BIGINT)
- **GIN Index Overhead**: ~2-3x storage for full-text search capability
- **Timestamp Precision**: Full timezone awareness with TIMESTAMPTZ

---

## Security Integration Points

### Authentication Integration
- **Supabase Auth**: Direct foreign key relationships to `auth.users`
- **Cascade Cleanup**: User deletion removes all associated data
- **Profile Sync**: Profiles table maintains denormalized user data

### RLS Foundation  
- **Table Structure**: Designed with RLS user isolation in mind
- **User Columns**: Consistent `user_id` pattern across all user-owned tables
- **Admin Boundaries**: Pages table separated for admin-only management

---

**End of Schema Report**