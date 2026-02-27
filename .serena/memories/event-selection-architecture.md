# DermLead Admin - Event Selection Architecture

## Current Pattern Overview

**Status**: NO global event context exists. Each page independently manages event selection.

**Pattern**: Local state `selectedEventId` + lazy-loaded data per page
- Each page loads ALL events: `const data = await getEvents()`
- User selects event from dropdown
- Page loads filtered data for that event
- On event change, refetch data

---

## 1. Admin Layout Structure

### File: `src/app/(admin)/layout.tsx`
```tsx
- AuthProvider wraps all admin routes
- AdminLayout component from `@/components/layout/AdminLayout`
- No event context or provider here
```

### AdminLayout Component: `src/components/layout/AdminLayout.tsx`
```tsx
- Simple wrapper: Sidebar + main content
- No state management
- No event-related logic
```

### Sidebar: `src/components/layout/Sidebar.tsx`
- Static navigation (no event selector)
- 11 menu items: Dashboard, Events, Attendees, Speakers, Sessions, Groups, Exhibitors, Sponsors, Announcements, Branding, Settings
- Each route navigates to `/events`, `/attendees`, `/speakers`, etc.
- Links have NO event_id parameter

---

## 2. Current Event Selection Pattern

Each page implements identical pattern:

```typescript
// 1. Load all events on mount
const [events, setEvents] = useState<Event[]>([])
const [selectedEventId, setSelectedEventId] = useState<string>('')

useEffect(() => {
  async function loadEvents() {
    const data = await getEvents()
    setEvents(data)
    if (data.length > 0) {
      setSelectedEventId(data[0].id)  // Auto-select first event
    }
  }
  loadEvents()
}, [])

// 2. Load filtered data when selectedEventId changes
useEffect(() => {
  if (!selectedEventId) return
  const data = await getSomeDataForEvent(selectedEventId)
  setFilteredData(data)
}, [selectedEventId])

// 3. Render dropdown to change event
<select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}>
  {events.map(e => <option value={e.id}>{e.name}</option>)}
</select>
```

---

## 3. Pages Using This Pattern

### Attendees: `src/app/(admin)/attendees/page.tsx`
```typescript
State:
- selectedEventId
- attendees (filtered by event)
- groups (filtered by event)

Data fetch:
- getEvents() → all events
- getAttendeesWithGroups(selectedEventId) → event-specific
- getGroups(selectedEventId) → event-specific

Realtime: 
- Supabase channel: `admin-attendees:${selectedEventId}`
```

### Sessions: `src/app/(admin)/sessions/page.tsx`
```typescript
State:
- selectedEventId
- sessions (filtered by event)
- speakers (all speakers available)

Data fetch:
- getEvents() → all events
- getSessions(selectedEventId) → event-specific
- getSpeakers() → all (not filtered by event?)
```

### Speakers: `src/app/(admin)/speakers/page.tsx`
```typescript
State:
- selectedEventId
- speakers (filtered by event)
- groups (filtered by event)

Data fetch:
- getEvents() → all events
- getSpeakers(selectedEventId) → event-specific
- getGroups(selectedEventId) → event-specific
```

### Groups: `src/app/(admin)/groups/page.tsx`
```typescript
State:
- selectedEventId
- groups (filtered by event)

Data fetch:
- getEvents() → all events
- getGroups(selectedEventId) → event-specific
```

### Events: `src/app/(admin)/events/page.tsx`
```typescript
State:
- events (all events, no filtering)
- No selectedEventId

Shows all events with stats:
- getEvents() → all events
- getEventStats(eventId) → for each event
```

---

## 4. Events API: `src/lib/api/events.ts`

### Available Functions

**Read Functions:**
- `getEvents()` → Event[] (all events, sorted by start_date DESC)
- `getEvent(id)` → Event | null (single event by ID)
- `getEventStats(eventId)` → { attendeesCount, leadsCount, sessionsCount, speakersCount }

**Write Functions:**
- `createEvent(event)` → Event
- `updateEvent(id, updates)` → Event
- `deleteEvent(id)` → void
- `archiveEvent(id)` → Event (sets archived_at)
- `unarchiveEvent(id)` → Event (clears archived_at)

**Utilities:**
- `generateSlug(name)` → string (kebab-case)
- `generateInviteCode()` → string (6-char random)
- `getEventStatus(event)` → 'upcoming' | 'active' | 'past'

**Storage:**
- `uploadEventBanner(eventId, file)` → string (publicUrl)
- `uploadEventLogo(eventId, file)` → string (publicUrl)

---

## 5. Event Type Definition

### `src/types/database.ts`
```typescript
interface Event {
  id: string
  organization_id: string
  name: string
  slug: string
  location: string | null
  start_date: string          // ISO date
  end_date: string            // ISO date
  invite_code: string | null
  description: string | null
  banner_url: string | null
  tracks: string[] | null
  // Branding fields
  brand_color: string | null
  logo_url: string | null
  show_logo_on_banner: boolean | null
  custom_url_slug: string | null
  created_at: string
  updated_at: string
}
```

---

## 6. Context & Store Status

**NO EVENT CONTEXT EXISTS** ✗
- Only `AuthContext` exists: `src/contexts/AuthContext.tsx`
- Provides: user, profile, organization, session, loading, signOut, refreshProfile

**NO EVENT STORE/ZUSTAND/REDUX** ✗

**NO QUERY LIBRARY** ✗
- No React Query / TanStack Query
- Direct Supabase calls from pages

---

## 7. Architecture Problems

### Current Issues

1. **Data Loading Inefficiency**
   - Each page loads ALL events (N pages = N API calls to getEvents())
   - No caching of events list
   - No prefetching

2. **No Shared Event Selection**
   - If user selects event on /attendees, then navigates to /speakers
   - Speakers page defaults to first event (not user's previous selection)
   - No session persistence of selected event

3. **No Event Persistence**
   - Selected event lost on page refresh
   - No URL params for event_id
   - No localStorage fallback

4. **Inefficient Realtime**
   - Attendees page only listens to filtered event's changes
   - Other pages don't use realtime at all
   - No centralised subscription management

5. **Type Issues**
   - Speaker's don't have event_id filter (getSpeakers() docs unclear)
   - Some APIs might need event_id filtering

---

## 8. Recommended Architecture (Optional Future)

If implementing EventContext, structure would be:

```typescript
// src/contexts/EventContext.tsx
interface EventContextType {
  events: Event[]
  selectedEventId: string
  selectedEvent: Event | null
  setSelectedEventId: (id: string) => void
  loading: boolean
  error: Error | null
  stats: EventStats | null
}

// Usage in pages:
const { selectedEventId, events } = useEvent()

// Persist to localStorage/URL
// useEffect(() => {
//   const stored = localStorage.getItem('selected-event-id')
//   if (stored) setSelectedEventId(stored)
// }, [])
```

But current architecture works fine without it—just needs optimization.

---

## Summary Table

| Aspect | Status | Details |
|--------|--------|---------|
| Global Event Context | ❌ No | Each page has local state |
| Event Persistence | ❌ No | Lost on navigation/refresh |
| URL Params | ❌ No | No ?eventId=... in URLs |
| Events API Exists | ✅ Yes | Full CRUD + stats |
| Event Type Defined | ✅ Yes | Complete schema |
| Sidebar Event Selector | ❌ No | Static nav only |
| Realtime Subscriptions | ⚠️ Partial | Attendees only |
| Caching | ❌ No | Fresh load each time |
