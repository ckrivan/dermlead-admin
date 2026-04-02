import { createClient } from "@/lib/supabase/client";
import type {
  Attendee,
  AttendeeGroup,
  AttendeeGroupMember,
} from "@/types/database";

export interface AttendeeWithGroups extends Attendee {
  full_name: string; // Computed from first_name + last_name
  groups: AttendeeGroup[];
}

export async function searchAttendeeRoster(query: string): Promise<Attendee[]> {
  if (!query.trim()) return [];
  const supabase = createClient();

  // Search both attendees and profiles in parallel
  const [attendeeResult, profileResult] = await Promise.all([
    supabase
      .from("attendees")
      .select("*")
      .or(
        `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`,
      )
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(20),
  ]);

  if (attendeeResult.error) throw attendeeResult.error;

  if (profileResult.error) {
    console.warn(
      "[searchAttendeeRoster] profile search failed:",
      profileResult.error.message,
    );
  }

  // Deduplicate by email — attendee records take priority (richer data)
  const seen = new Set<string>();
  const results: Attendee[] = [];

  for (const a of attendeeResult.data || []) {
    const emailKey = a.email.toLowerCase();
    if (!seen.has(emailKey)) {
      seen.add(emailKey);
      results.push(a);
    }
  }

  // Add profile-only results (people who have an account but were never an attendee)
  for (const p of profileResult.data || []) {
    if (!p.email) continue;
    const emailKey = p.email.toLowerCase();
    if (seen.has(emailKey)) continue;
    seen.add(emailKey);

    // Split full_name into first_name / last_name
    const nameParts = (p.full_name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    results.push({
      id: p.id,
      event_id: "",
      organization_id: "",
      profile_id: p.id,
      first_name: firstName,
      last_name: lastName,
      email: p.email,
      phone: null,
      specialty: null,
      institution: null,
      title: null,
      credentials: null,
      npi_number: null,
      street_address: null,
      street_address_2: null,
      city: null,
      state: null,
      postal_code: null,
      badge_type: "attendee",
      badge_generated: false,
      badge_printed: false,
      qr_data: null,
      registered_at: null,
      checked_in: false,
      checked_in_at: null,
      checked_in_by: null,
      created_at: "",
      updated_at: "",
    } as Attendee);
  }

  return results;
}

export async function getAttendees(eventId: string): Promise<Attendee[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("attendees")
    .select("*")
    .eq("event_id", eventId)
    .order("first_name");

  if (error) {
    console.error("Error fetching attendees:", error);
    throw error;
  }

  return data || [];
}

export async function getAttendeesWithGroups(
  eventId: string,
): Promise<AttendeeWithGroups[]> {
  const supabase = createClient();

  // Get all attendees for the event
  const { data: attendees, error: attendeesError } = await supabase
    .from("attendees")
    .select("*")
    .eq("event_id", eventId)
    .order("first_name");

  if (attendeesError) {
    console.error("Error fetching attendees:", attendeesError);
    throw attendeesError;
  }

  if (!attendees || attendees.length === 0) {
    return [];
  }

  // Get all groups for the event
  const { data: groups, error: groupsError } = await supabase
    .from("event_groups")
    .select("*")
    .eq("event_id", eventId);

  if (groupsError) {
    console.error("Error fetching groups:", groupsError);
  }

  // Get all group memberships
  const attendeeIds = attendees.map((a: Attendee) => a.id);
  const { data: memberships, error: membershipsError } = await supabase
    .from("group_members")
    .select("*")
    .in("entity_id", attendeeIds);

  if (membershipsError) {
    console.error("Error fetching memberships:", membershipsError);
  }

  // Create a map of group_id to group
  const groupMap = new Map<string, AttendeeGroup>();
  (groups || []).forEach((g: AttendeeGroup) => groupMap.set(g.id, g));

  // Create a map of entity_id (attendee) to groups
  const attendeeGroups = new Map<string, AttendeeGroup[]>();
  (memberships || []).forEach((m: AttendeeGroupMember) => {
    const group = groupMap.get(m.group_id);
    if (group) {
      if (!attendeeGroups.has(m.entity_id)) {
        attendeeGroups.set(m.entity_id, []);
      }
      attendeeGroups.get(m.entity_id)!.push(group);
    }
  });

  return (attendees as Attendee[]).map((attendee) => ({
    ...attendee,
    full_name: `${attendee.first_name} ${attendee.last_name}`.trim(),
    groups: attendeeGroups.get(attendee.id) || [],
  }));
}

export async function getAttendee(
  id: string,
): Promise<AttendeeWithGroups | null> {
  const supabase = createClient();

  const { data: attendee, error } = await supabase
    .from("attendees")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching attendee:", error);
    return null;
  }

  // Get groups for this attendee
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, event_groups(*)")
    .eq("entity_id", id);

  const groups = (memberships || [])
    .map(
      (m: { event_groups: unknown }) =>
        m.event_groups as unknown as AttendeeGroup,
    )
    .filter(Boolean);

  return {
    ...attendee,
    full_name: `${attendee.first_name} ${attendee.last_name}`.trim(),
    groups,
  };
}

// Look up a profile by email to auto-link attendees to app users.
// Returns profile id if found, null otherwise (graceful fallback if RLS blocks it).
async function lookupProfileByEmail(email: string): Promise<string | null> {
  try {
    const supabase = createClient();
    const normalizedEmail = email.toLowerCase().trim();
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", normalizedEmail)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("[lookupProfileByEmail] query failed:", error.message);
      return null;
    }
    return data?.id ?? null;
  } catch (err) {
    console.warn("[lookupProfileByEmail] unexpected error:", err);
    return null;
  }
}

export async function createAttendee(
  attendee: Omit<Attendee, "id" | "created_at">,
  groupIds?: string[],
): Promise<Attendee> {
  const res = await fetch("/api/attendees", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attendee, groupIds }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create attendee");
  }

  return await res.json();
}

/**
 * Auto-create or update a linked speakers record for an attendee-speaker.
 * The attendee record is the source of truth; the speakers record is synced infrastructure
 * so the attendee can be assigned to sessions (session_speakers FK requires speakers.id).
 */
export async function syncAttendeeToSpeaker(
  attendeeId: string,
  attendee: {
    first_name?: string | null;
    last_name?: string | null;
    credentials?: string | null;
    institution?: string | null;
    specialty?: string | null;
    email?: string | null;
    bio?: string | null;
    photo_url?: string | null;
    event_id?: string | null;
  },
): Promise<void> {
  const supabase = createClient();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    // Check if linked speaker already exists
    const { data: existing, error: lookupError } = await supabase
      .from("speakers")
      .select("id")
      .eq("attendee_id", attendeeId)
      .abortSignal(controller.signal)
      .maybeSingle();

    if (lookupError) {
      console.error("Error looking up linked speaker:", lookupError);
      throw lookupError;
    }

    const speakerData = {
      full_name: `${attendee.first_name || ""} ${attendee.last_name || ""}`.trim(),
      credentials: attendee.credentials || null,
      institution: attendee.institution || null,
      specialty: attendee.specialty || null,
      email: attendee.email || null,
      bio: attendee.bio || null,
      photo_url: attendee.photo_url || null,
      event_id: attendee.event_id || null,
      attendee_id: attendeeId,
      role: ["faculty"],
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await supabase
        .from("speakers")
        .update(speakerData)
        .eq("id", existing.id)
        .abortSignal(controller.signal)
        .select()
        .single();
      if (error) {
        console.error("Error syncing attendee to speaker:", error);
        throw error;
      }
    } else {
      const { error } = await supabase
        .from("speakers")
        .insert(speakerData)
        .abortSignal(controller.signal)
        .select()
        .single();
      if (error) {
        console.error("Error creating linked speaker:", error);
        throw error;
      }
    }
  } finally {
    clearTimeout(timeout);
  }
}

export async function updateAttendee(
  id: string,
  updates: Partial<Omit<Attendee, "id" | "created_at">>,
  groupIds?: string[],
): Promise<Attendee> {
  const res = await fetch("/api/attendees", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, updates, groupIds }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("Error updating attendee:", err);
    throw new Error(err.error || "Failed to update attendee");
  }

  return await res.json();
}

export async function deleteAttendee(id: string, deleteAccount = false): Promise<void> {
  const res = await fetch("/api/attendees", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, deleteAccount }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("Error deleting attendee:", err);
    throw new Error(err.error || "Failed to delete attendee");
  }
}

export async function checkInAttendee(id: string): Promise<Attendee> {
  return updateAttendee(id, { checked_in_at: new Date().toISOString() });
}

export async function undoCheckIn(id: string): Promise<Attendee> {
  return updateAttendee(id, { checked_in_at: null });
}

// Groups API
export async function getGroups(eventId: string): Promise<AttendeeGroup[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("event_groups")
    .select("*")
    .eq("event_id", eventId)
    .order("name");

  if (error) {
    console.error("Error fetching groups:", error);
    throw error;
  }

  return data || [];
}

export async function createGroup(
  group: Omit<AttendeeGroup, "id" | "created_at">,
): Promise<AttendeeGroup> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("event_groups")
    .insert(group)
    .select()
    .single();

  if (error) {
    console.error("Error creating group:", error);
    throw error;
  }

  return data;
}

export async function deleteGroup(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("event_groups").delete().eq("id", id);

  if (error) {
    console.error("Error deleting group:", error);
    throw error;
  }
}

// Bulk import
export interface AttendeeCSVRow {
  full_name?: string; // Will be split into first_name/last_name
  first_name?: string;
  last_name?: string;
  email: string;
  badge_type?: string; // was registration_type
  groups?: string; // comma-separated group names
  credentials?: string;
  npi_number?: string;
  specialty?: string;
  institution?: string;
  phone?: string;
  title?: string;
  street_address?: string;
  street_address_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

export async function bulkCreateAttendees(
  eventId: string,
  attendees: AttendeeCSVRow[],
  existingGroups: AttendeeGroup[],
  onProgress?: (current: number, total: number) => void,
  organizationId?: string,
): Promise<{ created: number; errors: string[] }> {
  const supabase = createClient();
  const errors: string[] = [];
  let created = 0;

  // Resolve organization_id if not provided — look it up from the event
  let resolvedOrgId = organizationId;
  if (!resolvedOrgId) {
    const { data: eventData } = await supabase
      .from("events")
      .select("organization_id")
      .eq("id", eventId)
      .single();
    resolvedOrgId = eventData?.organization_id || undefined;
  }

  // ── Batch pre-fetch: existing attendees & profiles ──────────────────
  // Collect all emails up front so we can query in bulk (2 queries instead of N*2)
  const emailSet = new Set<string>();
  for (const row of attendees) {
    if (row.email?.trim()) emailSet.add(row.email.trim().toLowerCase());
  }
  const allEmails = [...emailSet];

  // Fetch all existing attendees for this event in one query
  const existingAttendeeMap = new Map<string, {
    id: string; credentials: string | null; specialty: string | null;
    institution: string | null; npi_number: string | null; street_address: string | null;
    city: string | null; state: string | null; postal_code: string | null;
    phone: string | null; title: string | null;
  }>();
  if (allEmails.length > 0) {
    // Supabase .in() has a limit, so chunk into batches of 200
    for (let i = 0; i < allEmails.length; i += 200) {
      const chunk = allEmails.slice(i, i + 200);
      const { data: existingRows } = await supabase
        .from("attendees")
        .select("id,email,credentials,specialty,institution,npi_number,street_address,city,state,postal_code,phone,title")
        .eq("event_id", eventId)
        .in("email", chunk);
      for (const row of existingRows || []) {
        existingAttendeeMap.set((row.email as string).toLowerCase(), row);
      }
    }
  }

  // Batch fetch profile IDs by email
  const profileMap = new Map<string, string>();
  if (allEmails.length > 0) {
    for (let i = 0; i < allEmails.length; i += 200) {
      const chunk = allEmails.slice(i, i + 200);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,email")
        .in("email", chunk);
      for (const p of profiles || []) {
        if (p.email) profileMap.set(p.email.toLowerCase(), p.id);
      }
    }
  }

  // Create a lookup map for groups by name (case-insensitive)
  const groupMap = new Map<string, string>();
  existingGroups.forEach((g) => {
    groupMap.set(g.name.toLowerCase().trim(), g.id);
  });

  // Track new groups that need to be created
  const newGroups = new Map<string, string>(); // name -> id

  // Pre-fetch existing exhibitors AND sponsors for auto-linking industry reps
  // Maps lowercase name → canonical (DB) name for normalization
  // Checks both tables to avoid creating exhibitor duplicates of sponsors
  const companyCanonicalName = new Map<string, string>();
  {
    const [{ data: exhibitors }, { data: sponsors }] = await Promise.all([
      supabase.from("exhibitors").select("company_name").eq("event_id", eventId),
      supabase.from("sponsors").select("company_name").eq("event_id", eventId),
    ]);
    for (const ex of exhibitors || []) {
      const name = ex.company_name as string;
      companyCanonicalName.set(name.toLowerCase().trim(), name);
    }
    // Sponsors take precedence — if a company is both, use sponsor name
    for (const sp of sponsors || []) {
      const name = sp.company_name as string;
      companyCanonicalName.set(name.toLowerCase().trim(), name);
    }
  }
  // Track exhibitors created during this import
  const createdExhibitors = new Map<string, string>(); // lowercase → canonical

  const total = attendees.length;

  for (let idx = 0; idx < attendees.length; idx++) {
    const row = attendees[idx];

    // Report progress every row
    if (onProgress) onProgress(idx + 1, total);

    // Handle name - support both full_name and first_name/last_name
    let firstName = row.first_name?.trim() || "";
    let lastName = row.last_name?.trim() || "";

    if (!firstName && !lastName && row.full_name?.trim()) {
      // Split full_name into first and last
      const nameParts = row.full_name.trim().split(/\s+/);
      firstName = nameParts[0] || "";
      lastName = nameParts.slice(1).join(" ") || "";
    }

    if (!firstName) {
      errors.push("Skipped row: missing name");
      continue;
    }
    if (!row.email?.trim()) {
      errors.push(`Skipped "${firstName} ${lastName}": missing email`);
      continue;
    }

    const attendeeEmail = row.email.trim().toLowerCase();

    // Check pre-fetched existing attendee map (no network call)
    const existing = existingAttendeeMap.get(attendeeEmail);

    if (existing) {
      // Normalize institution to canonical exhibitor name
      const rawInst = row.institution?.trim();
      let canonicalInst: string | undefined;
      if (rawInst) {
        const instKey = rawInst.toLowerCase().trim();
        canonicalInst = companyCanonicalName.get(instKey)
          || createdExhibitors.get(instKey)
          || [...companyCanonicalName.entries()].find(([k]) => k.includes(instKey) || instKey.includes(k))?.[1]
          || [...createdExhibitors.entries()].find(([k]) => k.includes(instKey) || instKey.includes(k))?.[1]
          || rawInst;
      }

      // Fill in blank fields from the import data (don't overwrite existing values)
      const fillFields: Record<string, string> = {};
      const fieldMap: Record<string, string | undefined> = {
        credentials: row.credentials?.trim(),
        specialty: row.specialty?.trim(),
        institution: canonicalInst,
        npi_number: row.npi_number?.trim(),
        street_address: row.street_address?.trim(),
        city: row.city?.trim(),
        state: row.state?.trim(),
        postal_code: row.postal_code?.trim(),
        phone: row.phone?.trim(),
        title: row.title?.trim(),
      };
      for (const [field, newVal] of Object.entries(fieldMap)) {
        if (newVal && !existing[field as keyof typeof existing]) {
          fillFields[field] = newVal;
        }
      }

      // Also normalize institution if it exists but doesn't match canonical name
      if (canonicalInst && existing.institution && existing.institution !== canonicalInst) {
        fillFields.institution = canonicalInst;
      }

      if (Object.keys(fillFields).length > 0) {
        await supabase.from("attendees").update(fillFields).eq("id", existing.id);
        errors.push(`Updated "${firstName} ${lastName}": filled ${Object.keys(fillFields).join(", ")}`);
      } else {
        errors.push(`Skipped "${firstName} ${lastName}": already exists for this event`);
      }
      continue;
    }

    // Use pre-fetched profile ID (no network call)
    const profileId = profileMap.get(attendeeEmail) ?? null;

    // Normalize institution to canonical exhibitor name if possible
    const rawInstitution = row.institution?.trim() || null;
    let normalizedInstitution = rawInstitution;
    if (rawInstitution) {
      const key = rawInstitution.toLowerCase().trim();
      // Exact match first, then check if any exhibitor name contains this or vice versa
      const canonical = companyCanonicalName.get(key)
        || createdExhibitors.get(key)
        || [...companyCanonicalName.entries()].find(([k, _]) => k.includes(key) || key.includes(k))?.[1]
        || [...createdExhibitors.entries()].find(([k, _]) => k.includes(key) || key.includes(k))?.[1];
      if (canonical) normalizedInstitution = canonical;
    }

    // Create the attendee
    const { data: createdAttendee, error: attendeeError } = await supabase
      .from("attendees")
      .insert({
        event_id: eventId,
        organization_id: resolvedOrgId || "",
        first_name: firstName,
        last_name: lastName,
        email: attendeeEmail,
        badge_type: row.badge_type?.trim() || "attendee",
        qr_data: null,
        profile_id: profileId,
        checked_in: false,
        checked_in_at: null,
        credentials: row.credentials?.trim() || null,
        npi_number: row.npi_number?.trim() || null,
        specialty: row.specialty?.trim() || null,
        institution: normalizedInstitution,
        phone: row.phone?.trim() || null,
        title: row.title?.trim() || null,
        street_address: row.street_address?.trim() || null,
        street_address_2: row.street_address_2?.trim() || null,
        city: row.city?.trim() || null,
        state: row.state?.trim() || null,
        postal_code: row.postal_code?.trim() || null,
      })
      .select()
      .single();

    if (attendeeError) {
      if (attendeeError.code === "23505") {
        errors.push(`Skipped "${firstName} ${lastName}": duplicate email`);
      } else {
        errors.push(
          `Failed to create "${firstName} ${lastName}": ${attendeeError.message}`,
        );
      }
      continue;
    }

    // Update QR data with UUID-only payload (privacy: no PII in QR codes)
    await supabase
      .from("attendees")
      .update({ qr_data: { attendeeId: createdAttendee.id } })
      .eq("id", createdAttendee.id);

    // Auto-create speaker/faculty record for speaker and leadership badge types
    const badgeType = row.badge_type?.trim() || "attendee";
    if (badgeType === "speaker" || badgeType === "leadership") {
      const speakerRole =
        badgeType === "leadership" ? ["leader"] : ["faculty"];
      // Check if speaker record already exists for this attendee
      const { data: existingSpeaker } = await supabase
        .from("speakers")
        .select("id")
        .eq("event_id", eventId)
        .eq("attendee_id", createdAttendee.id)
        .maybeSingle();

      if (!existingSpeaker) {
        await supabase.from("speakers").insert({
          event_id: eventId,
          attendee_id: createdAttendee.id,
          full_name: `${firstName} ${lastName}`.trim(),
          credentials: row.credentials?.trim() || null,
          specialty: row.specialty?.trim() || null,
          institution: row.institution?.trim() || null,
          email: attendeeEmail,
          city: row.city?.trim() || null,
          state: row.state?.trim() || null,
          role: speakerRole,
        });
      }
    }

    // Auto-create exhibitor record for industry reps if company doesn't exist yet
    // Uses fuzzy matching (contains) to avoid duplicates like "Leo Pharma" vs "LEO Pharma"
    if (badgeType === "industry" && normalizedInstitution) {
      const companyKey = normalizedInstitution.toLowerCase().trim();
      const alreadyExists = companyCanonicalName.has(companyKey)
        || createdExhibitors.has(companyKey)
        || [...companyCanonicalName.keys()].some((k) => k.includes(companyKey) || companyKey.includes(k))
        || [...createdExhibitors.keys()].some((k) => k.includes(companyKey) || companyKey.includes(k));
      if (!alreadyExists) {
        const { error: exError } = await supabase.from("exhibitors").insert({
          event_id: eventId,
          company_name: normalizedInstitution,
          contact_name: `${firstName} ${lastName}`.trim(),
          contact_email: attendeeEmail,
          contact_phone: row.phone?.trim() || null,
        });
        if (!exError) {
          createdExhibitors.set(companyKey, normalizedInstitution);
          companyCanonicalName.set(companyKey, normalizedInstitution);
        }
      }
    }

    created++;

    // Handle group assignments
    if (row.groups?.trim()) {
      const groupNames = row.groups
        .split(",")
        .map((n) => n.trim())
        .filter(Boolean);

      for (const groupName of groupNames) {
        let groupId = groupMap.get(groupName.toLowerCase());

        // If group doesn't exist, create it
        if (!groupId) {
          // Check if we already created this group in this import
          groupId = newGroups.get(groupName.toLowerCase());

          if (!groupId) {
            // Create the new group
            const { data: newGroup, error: groupError } = await supabase
              .from("event_groups")
              .insert({
                event_id: eventId,
                name: groupName,
                color: "#3b82f6",
              })
              .select()
              .single();

            if (groupError || !newGroup) {
              errors.push(
                `Failed to create group "${groupName}": ${groupError?.message || "Unknown error"}`,
              );
              continue;
            }

            groupId = newGroup.id;
            newGroups.set(groupName.toLowerCase(), newGroup.id);
            groupMap.set(groupName.toLowerCase(), newGroup.id);
          }
        }

        // Assign attendee to group
        if (groupId) {
          await supabase.from("group_members").insert({
            entity_id: createdAttendee.id,
            entity_type: "attendee",
            group_id: groupId,
          });
        }
      }
    }
  }

  return { created, errors };
}

export const BADGE_TYPES = [
  { value: "attendee", label: "Attendee" },
  { value: "industry", label: "Industry" },
  { value: "speaker", label: "Speaker" },
  { value: "exhibitor", label: "Exhibitor" },
  { value: "sponsor", label: "Sponsor" },
  { value: "leadership", label: "Leadership" },
  { value: "organiser", label: "Organizer" },
];

// Alias for backward compatibility
export const REGISTRATION_TYPES = BADGE_TYPES;

export async function uploadAttendeePhoto(
  attendeeId: string,
  file: File,
): Promise<string> {
  const supabase = createClient();

  const fileExt = file.name.split(".").pop();
  const fileName = `${attendeeId}.${fileExt}`;
  const filePath = `attendees/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("speakers")
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error("Error uploading attendee photo:", uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage.from("speakers").getPublicUrl(filePath);

  return data.publicUrl;
}
