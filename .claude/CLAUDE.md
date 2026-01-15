# DermLead Project Instructions

## Critical Preferences
- **ALWAYS use claude-mem** instead of Serena for memory and context retrieval
- **ALWAYS use Supabase CLI** for database operations (never direct SQL unless necessary)

## Supabase Database CLI Commands

### Project Info
- **Project Ref**: `xxzenpjxsysqpimqtosi`
- **Project URL**: `https://xxzenpjxsysqpimqtosi.supabase.co`

### Get API Keys
```bash
cd /Users/charleskrivan/Desktop/Projects/Risha/Lead\ Generation
npx supabase projects api-keys --project-ref xxzenpjxsysqpimqtosi
```

### Push Migrations
```bash
npx supabase db push
```

### List Migrations
```bash
npx supabase migration list
```

### Repair Migration Status
Mark a migration as applied (skip it):
```bash
npx supabase migration repair --status applied <migration_version>
```

Mark a migration as reverted (re-run it):
```bash
npx supabase migration repair --status reverted <migration_version>
```

### Query Database via REST API

**With anon key (respects RLS):**
```bash
curl -s "https://xxzenpjxsysqpimqtosi.supabase.co/rest/v1/TABLE?select=*" \
  -H "apikey: <anon_key>" \
  -H "Authorization: Bearer <anon_key>"
```

**With service_role key (bypasses RLS):**
```bash
curl -s "https://xxzenpjxsysqpimqtosi.supabase.co/rest/v1/TABLE?select=*" \
  -H "apikey: <service_role_key>" \
  -H "Authorization: Bearer <service_role_key>"
```

### Insert Data via REST API
```bash
curl -s -X POST "https://xxzenpjxsysqpimqtosi.supabase.co/rest/v1/TABLE" \
  -H "apikey: <service_role_key>" \
  -H "Authorization: Bearer <service_role_key>" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '[{"column": "value"}]'
```

### Migration File Naming
Migration files must follow this format: `YYYYMMDDHHMMSS_description.sql`

Example: `20260115185800_leads_dev_access.sql`

Files without proper timestamps (like `20260115_something.sql`) will cause errors.

## Flutter Commands

### Run on iOS Device (Release Mode)
```bash
flutter run --release
```

### Build iOS (No Code Sign)
```bash
flutter build ios --no-codesign
```

### Regenerate Freezed/Riverpod Code
```bash
flutter pub run build_runner build --delete-conflicting-outputs
```

## Project Structure

- `lib/` - Flutter app source code
- `supabase/migrations/` - Database migrations (auto-applied via `npx supabase db push`)
- `supabase/*.sql` - Manual SQL scripts (reference only, not auto-applied)

## Lead Generation Backend Status

### Database Tables (Supabase PostgreSQL)

**Core Tables:**
| Table | Description | Status |
|-------|-------------|--------|
| `organizations` | Multi-tenant orgs | ✅ Complete |
| `profiles` | User profiles (extends auth.users) | ✅ Complete |
| `events` | Conferences/conventions | ✅ Complete |
| `leads` | Captured leads | ✅ Complete |
| `sessions` | Conference sessions/talks | ✅ Complete |
| `speakers` | Speaker profiles (demo) | ✅ Complete |
| `session_speakers` | Speaker-session links | ✅ Complete |
| `user_agenda` | User's saved sessions | ✅ Complete |
| `attendees` | Event attendees/check-in | ✅ Complete |

**Profile Extended Fields:**
- `fcm_token` - Push notification token
- `credentials`, `bio`, `specialty`, `institution`, `title`, `is_speaker`

### Applied Migrations (Latest)
1. `20260115120100_update_dates_to_2026.sql` - Date updates
2. `20260115122141_add_demo_leads.sql` - Demo leads
3. `20260115155830_sessions_schema.sql` - Sessions & agenda
4. `20260115155844_demo_data.sql` - Demo event data
5. `20260115162259_dev_public_access.sql` - Dev access
6. `20260115185800_leads_dev_access.sql` - Permissive leads policies
7. `20260115193000_add_fcm_token.sql` - FCM token support
8. `20260115200000_attendees_dev_access.sql` - Permissive attendees policies

### Current RLS Mode
⚠️ **DEV MODE** - Permissive policies enabled for testing
- **Leads**: Public read/write/delete access
- **Attendees**: Public read/write/delete access
- **Sessions**: Role-based + dev access
- Before production: Revert to strict RLS policies

### IMPORTANT: RLS Policy Requirements
When creating new tables, **ALWAYS add permissive RLS policies for dev mode**:

```sql
-- Template for dev-mode RLS policies
DROP POLICY IF EXISTS "Allow public read access to TABLE_NAME" ON TABLE_NAME;
DROP POLICY IF EXISTS "Allow public write access to TABLE_NAME" ON TABLE_NAME;

CREATE POLICY "Allow public read access to TABLE_NAME"
ON TABLE_NAME FOR SELECT USING (true);

CREATE POLICY "Allow public write access to TABLE_NAME"
ON TABLE_NAME FOR ALL USING (true) WITH CHECK (true);
```

Without RLS policies, the `anon` key (used by admin panel) returns empty results even when data exists.

### Features Status
- ✅ Lead capture and management
- ✅ Event management
- ✅ Organization multi-tenancy
- ✅ Role-based access (admin/rep)
- ✅ Sessions and agenda system
- ✅ Speakers management
- ✅ Attendee check-in system
- ✅ FCM push notification token storage
- ✅ Demo data for DID 2025 event

### TODO - Backend Items
- [ ] Edge Functions for complex operations
- [ ] Production RLS policy migration
- [ ] Real-time subscriptions setup
- [ ] Storage bucket for lead photos
- [ ] Admin panel integration endpoints

## CRITICAL: Actual Database Schema

⚠️ **ALWAYS verify column names against this schema before writing code!**

### `attendees` Table (ACTUAL COLUMNS)
```sql
id                UUID PRIMARY KEY
organization_id   UUID NOT NULL
event_id          UUID NOT NULL
first_name        TEXT NOT NULL       -- NOT "full_name"!
last_name         TEXT NOT NULL       -- NOT "full_name"!
email             TEXT NOT NULL
phone             TEXT
specialty         TEXT
institution       TEXT
title             TEXT
badge_type        TEXT                -- NOT "registration_type"!
badge_generated   BOOLEAN DEFAULT false
badge_printed     BOOLEAN DEFAULT false
qr_data           JSONB               -- NOT "qr_code" string!
registered_at     TIMESTAMPTZ
checked_in        BOOLEAN DEFAULT false
checked_in_at     TIMESTAMPTZ
checked_in_by     UUID
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
```

### `events` Table (ACTUAL COLUMNS)
```sql
id                UUID PRIMARY KEY
organization_id   UUID NOT NULL
name              TEXT NOT NULL
slug              TEXT
location          TEXT
start_date        DATE NOT NULL
end_date          DATE NOT NULL
invite_code       TEXT
description       TEXT
banner_url        TEXT
tracks            TEXT[]
brand_color       TEXT
logo_url          TEXT
show_logo_on_banner BOOLEAN
custom_url_slug   TEXT
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
```

### `leads` Table (ACTUAL COLUMNS)
```sql
id                UUID PRIMARY KEY
organization_id   UUID NOT NULL
event_id          UUID
captured_by       UUID NOT NULL
first_name        TEXT NOT NULL
last_name         TEXT NOT NULL
work_email        TEXT NOT NULL
personal_email    TEXT
phone             TEXT
specialty         TEXT NOT NULL
institution       TEXT
years_in_practice TEXT
interest_areas    JSONB DEFAULT '[]'
notes             TEXT
lead_score        INTEGER DEFAULT 3
photo_url         TEXT
synced_at         TIMESTAMPTZ
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
```

### `sessions` Table (ACTUAL COLUMNS)
```sql
id                UUID PRIMARY KEY
event_id          UUID NOT NULL
title             TEXT NOT NULL
description       TEXT
objectives        TEXT[]
session_type      TEXT DEFAULT 'presentation'
session_date      DATE NOT NULL
start_time        TIME NOT NULL
end_time          TIME NOT NULL
location          TEXT
location_details  TEXT
capacity          INTEGER
requires_registration BOOLEAN DEFAULT false
is_highlighted    BOOLEAN DEFAULT false
track             TEXT
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
```

### `speakers` Table (ACTUAL COLUMNS)
```sql
id                UUID PRIMARY KEY
full_name         TEXT NOT NULL       -- speakers uses full_name (not first/last)
credentials       TEXT
bio               TEXT
specialty         TEXT
institution       TEXT
photo_url         TEXT
created_at        TIMESTAMPTZ
```

### Admin Panel Type Mapping
When writing admin panel code, map these correctly:
- Attendee name: Combine `first_name` + `last_name` → display as `full_name`
- Registration type: Use `badge_type` column
- QR code: Use `qr_data` (JSONB object, not string)
