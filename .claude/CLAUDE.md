# DermLead Project Instructions

## Critical Preferences
- **ALWAYS use Supabase CLI** for database operations (never direct SQL unless necessary)
- **Deploy to Vercel** after admin panel changes: `vercel deploy --prod`

## Roles & Permissions Architecture

**Source of truth chain: Supabase → Admin Panel → Flutter App**

- `profiles.role` = GLOBAL role (admin, rep, leadership, attendee)
- `attendees.badge_type` = EVENT-SCOPED role (per event)
- Flutter's `effectiveRoleProvider` combines both

### Rules
1. **NEVER sync event-scoped data to global fields** — badge_type is per-event, profile.role is global
2. **effectiveRoleProvider is the single source of truth** in Flutter for capabilities
3. **When fixing permissions, grep ALL files** — same gate may exist in multiple screens
4. **FutureProvider caches** — use real-time listeners for externally-changing data
5. **selectedEventProvider can be null** — handle gracefully

## Schema Gotchas
- Attendee name: `first_name` + `last_name` (NOT `full_name`)
- Speaker name: `full_name` (NOT first/last)
- QR code: `qr_data` JSONB (NOT `qr_code` string)
- Registration type: `badge_type` column
- Full schema: `docs/schema.md` | CLI commands: `docs/cli-reference.md`

## RLS — DEV MODE
All tables have permissive RLS policies. When creating new tables, add:
```sql
CREATE POLICY "dev_read" ON TABLE_NAME FOR SELECT USING (true);
CREATE POLICY "dev_write" ON TABLE_NAME FOR ALL USING (true) WITH CHECK (true);
```
Without RLS policies, the `anon` key returns empty results.
