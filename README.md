# Converge Capture - Admin Panel

Web-based admin dashboard for managing medical conferences, events, and lead retrieval. Built for [BCI Management Group](https://convergecapture.com).

## What It Does

Converge Capture is a conference management platform for dermatology and medical events. The admin panel gives organizers full control over events, attendees, speakers, sessions, and lead data.

### Event Management
- Create and configure multi-day conferences with custom branding
- Manage attendee registration, check-in status, and badge generation
- QR code generation for attendee badges
- Track and export leads captured by sales reps at events

### People Management
- **Attendees** - Import, search, filter, assign groups, toggle lead access
- **Speakers** - Full CRUD with photo upload, bio, credentials, institution, city/state
- **Industry Partners** - Unified sponsor + exhibitor management with tier system
- **User Roles** - Admin, organiser, leadership, rep, attendee

### Lead Retrieval
- View all leads captured via the mobile app's QR scanner
- Filter by event, date range, rep, specialty
- Export to CSV/Excel (Pfizer industry standard format)
- Lead scoring and interest area tracking
- Respects attendee contact-sharing privacy preferences

### Content & Communication
- **Sessions** - Manage talks, workshops, product theaters with tracks and schedules
- **Announcements** - Push announcements to event attendees
- **FAQ** - Create and manage event FAQ sections
- **Groups** - Organize attendees into networking/discussion groups
- **Support Requests** - View and manage user-submitted support tickets

### Analytics & Reports
- Event dashboard with attendance, check-in, and lead capture stats
- Exportable reports

### Account & Compliance
- Account deletion page (App Store requirement)
- Privacy policy and terms of service pages
- Support request form (public)
- MFA enrollment and verification

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password + magic link + MFA) |
| Storage | Supabase Storage (speaker photos) |
| Theming | next-themes (light/dark mode) |
| PDF | jsPDF |
| Excel | SheetJS (xlsx) |
| QR Codes | qrcode + qrcode.react |
| Image Crop | react-easy-crop |

## Project Structure

```
src/
  app/
    (admin)/           # 17 protected admin pages
    api/               # Backend API routes (attendees, speakers, users, invites)
    auth/              # Auth flow (callback, confirm, setup-password)
    login/             # Login page
    delete-account/    # Account deletion (App Store compliance)
    privacy/           # Privacy policy
    terms/             # Terms of service
    support/           # Public support form
  components/
    layout/            # Header, Sidebar, UserMenu
    ui/                # Reusable card, button components
    events/            # Event picker, branding components
    users/             # User management modals
  contexts/            # EventContext, AuthContext
  lib/
    api/               # Supabase API client functions
    supabase/          # Supabase client config (admin, server, browser)
    badges/            # Badge generation utilities
  types/               # TypeScript type definitions
supabase/
  migrations/          # Database migrations
```

## API Routes

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/attendees` | POST, PATCH, DELETE | Attendee CRUD with group assignments |
| `/api/attendees/leads` | PATCH | Toggle leads access for attendees |
| `/api/speakers` | POST, PATCH, DELETE | Speaker CRUD with attendee linking |
| `/api/speakers/upload` | POST | Speaker photo upload to Supabase Storage |
| `/api/users` | PATCH, DELETE | User management (deactivate/reactivate/delete) |
| `/api/invite` | POST | Invite new admin/organiser users |

## Setup

```bash
npm install
cp .env.example .env.local  # Add Supabase keys
npm run dev                  # http://localhost:3000
```

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Deployment

Hosted on Vercel. Deploy with:

```bash
vercel deploy --prod
```

Live at **convergecapture.com**

## Database

PostgreSQL via Supabase with row-level security. Migrations in `supabase/migrations/` are applied with:

```bash
npx supabase db push
```

## Related

- **[Converge Capture - Mobile App](https://github.com/ckrivan/dermlead)** - Flutter iOS/Android app for attendees and sales reps
