# Row-Level Security (RLS) Troubleshooting

## Common RLS Errors

### Error: "new row violates row-level security policy"

**Error Code:** `42501`

**What it means:**
You're trying to INSERT, UPDATE, or DELETE a row in a table that has RLS enabled, but there's no policy allowing that operation for your role.

**Example:**
```
Error creating match: {
  code: '42501',
  details: null,
  hint: null,
  message: 'new row violates row-level security policy for table "combat_matches"'
}
```

### How to Debug

1. **Check if RLS is enabled:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'your_table_name';
```

2. **List all policies for the table:**
```sql
SELECT 
  tablename, 
  policyname, 
  cmd,  -- SELECT, INSERT, UPDATE, DELETE, or ALL
  roles,
  qual,  -- USING clause
  with_check  -- WITH CHECK clause
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'your_table_name'
ORDER BY cmd, policyname;
```

3. **Check grants:**
```sql
SELECT 
  grantee, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'your_table_name';
```

### Common Causes

1. **Missing INSERT policy** (most common)
   - RLS is enabled
   - GRANT INSERT exists
   - But no `CREATE POLICY ... FOR INSERT` statement

2. **Policy condition fails**
   - Policy exists but the `WITH CHECK` condition evaluates to false
   - Example: `WITH CHECK (userId = auth.uid())` but you're inserting a different userId

3. **Wrong role**
   - Policy is created for `authenticated` but you're using `anon` or `service_role`

4. **Policy uses wrong column names**
   - Policy references a column that doesn't exist or is misspelled

## Combat Matches RLS Issue (Fixed)

### The Problem
In migration `0004_arena_queue_system.sql`:
- ✅ RLS was enabled on `combat_matches`
- ✅ GRANT INSERT was given to `authenticated`
- ❌ No INSERT policy was created

Result: API couldn't create matches during matchmaking.

### The Fix
Migration `0006_fix_combat_matches_rls.sql` adds:
```sql
create policy combat_matches_insert_authenticated on public.combat_matches for insert
  to authenticated
  with check (true);
```

### Why `with check (true)`?
- Allows any authenticated user to insert
- Safe because:
  - API validates gladiator ownership before queueing
  - Matchmaking only pairs different users/ludi
  - No direct client access to match creation

## Best Practices

### 1. Always Create Policies When Enabling RLS

**Bad:**
```sql
alter table my_table enable row level security;
grant select, insert on my_table to authenticated;
-- Missing policies!
```

**Good:**
```sql
alter table my_table enable row level security;
grant select, insert on my_table to authenticated;

create policy my_table_select on my_table for select
  using (true);

create policy my_table_insert on my_table for insert
  with check (userId = auth.uid());
```

### 2. Test Each Operation

After creating policies, test:
- SELECT: Can users read the data they should?
- INSERT: Can users create new rows?
- UPDATE: Can users modify existing rows?
- DELETE: Can users remove rows?

### 3. Use Specific Policies Over Permissive Ones

**Less secure:**
```sql
create policy allow_all on my_table for all
  using (true)
  with check (true);
```

**More secure:**
```sql
create policy select_all on my_table for select
  using (true);

create policy insert_own on my_table for insert
  with check (userId = auth.uid());

create policy update_own on my_table for update
  using (userId = auth.uid())
  with check (userId = auth.uid());

create policy delete_own on my_table for delete
  using (userId = auth.uid());
```

### 4. Document Why Policies Are Permissive

If you use `with check (true)`, add a comment explaining why:
```sql
-- Allow all authenticated users to insert matches
-- This is safe because the API validates ownership before queueing
create policy combat_matches_insert_authenticated on public.combat_matches for insert
  to authenticated
  with check (true);
```

## Useful Queries

### View All RLS-Enabled Tables
```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true
ORDER BY tablename;
```

### View All Policies in Your Schema
```sql
SELECT 
  tablename, 
  policyname, 
  cmd,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;
```

### Check If a Specific User Can Access a Table
```sql
-- Run this as the user you want to test
SELECT * FROM your_table LIMIT 1;
-- If it fails, check the error message for clues
```

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Performance Tips](https://supabase.com/docs/guides/database/postgres/row-level-security#performance)

