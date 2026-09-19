# Deploy Schema to Supabase

## Quick Steps (2 minutes)

1. Go to: https://supabase.com/dashboard/project/eufbzktzoaergssmqkvh/sql
2. Click "New Query"
3. Copy entire contents of `schema.sql` 
4. Paste into editor
5. Click "Run"

That's it. All 25 tables, 50+ badges, 28 pro habits deployed.

## If you get errors

The schema should run clean. If you see errors about existing tables:
- Go to Table Editor
- Delete existing tables (if any test data)
- Re-run the schema

## After deploying

Enable Row Level Security in the dashboard:
- Authentication > Policies > Enable RLS on all tables

The schema already includes RLS policies but you may need to review them.
