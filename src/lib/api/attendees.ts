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
  const supabase = createClient();

  // Auto-link to profile if email matches
  if (!attendee.profile_id && attendee.email) {
    const profileId = await lookupProfileByEmail(attendee.email);
    if (profileId) {
      attendee = { ...attendee, profile_id: profileId };
    }
  }

  const { data, error } = await supabase
    .from("attendees")
    .insert(attendee)
    .select()
    .single();

  if (error) {
    console.error("Error creating attendee:", error);
    throw error;
  }

  // Add group memberships
  if (groupIds && groupIds.length > 0) {
    const memberships = groupIds.map((groupId) => ({
      entity_id: data.id,
      entity_type: "attendee",
      group_id: groupId,
    }));

    await supabase.from("group_members").insert(memberships);
  }

  return data;
}

export async function updateAttendee(
  id: string,
  updates: Partial<Omit<Attendee, "id" | "created_at">>,
  groupIds?: string[],
): Promise<Attendee> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("attendees")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating attendee:", error);
    throw error;
  }

  // Update group memberships if provided
  if (groupIds !== undefined) {
    // Remove existing memberships
    await supabase.from("group_members").delete().eq("entity_id", id);

    // Add new memberships
    if (groupIds.length > 0) {
      const memberships = groupIds.map((groupId) => ({
        entity_id: id,
        entity_type: "attendee",
        group_id: groupId,
      }));

      await supabase.from("group_members").insert(memberships);
    }
  }

  return data;
}

export async function deleteAttendee(id: string): Promise<void> {
  const supabase = createClient();

  // Delete group memberships first
  await supabase.from("group_members").delete().eq("entity_id", id);

  const { error } = await supabase.from("attendees").delete().eq("id", id);

  if (error) {
    console.error("Error deleting attendee:", error);
    throw error;
  }
}

export async function checkInAttendee(id: string): Promise<Attendee> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("attendees")
    .update({ checked_in_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error checking in attendee:", error);
    throw error;
  }

  return data;
}

export async function undoCheckIn(id: string): Promise<Attendee> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("attendees")
    .update({ checked_in_at: null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error undoing check-in:", error);
    throw error;
  }

  return data;
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
): Promise<{ created: number; errors: string[] }> {
  const supabase = createClient();
  const errors: string[] = [];
  let created = 0;

  // Create a lookup map for groups by name (case-insensitive)
  const groupMap = new Map<string, string>();
  existingGroups.forEach((g) => {
    groupMap.set(g.name.toLowerCase().trim(), g.id);
  });

  // Track new groups that need to be created
  const newGroups = new Map<string, string>(); // name -> id

  for (const row of attendees) {
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

    // Generate QR data (JSON object)
    const qrData = {
      firstName,
      lastName,
      email: row.email.trim().toLowerCase(),
    };

    // Auto-link to profile if email matches
    const attendeeEmail = row.email.trim().toLowerCase();
    const profileId = await lookupProfileByEmail(attendeeEmail);

    // Create the attendee
    const { data: createdAttendee, error: attendeeError } = await supabase
      .from("attendees")
      .insert({
        event_id: eventId,
        first_name: firstName,
        last_name: lastName,
        email: attendeeEmail,
        badge_type: row.badge_type?.trim() || "attendee",
        qr_data: qrData,
        profile_id: profileId,
        checked_in: false,
        checked_in_at: null,
        credentials: row.credentials?.trim() || null,
        npi_number: row.npi_number?.trim() || null,
        specialty: row.specialty?.trim() || null,
        institution: row.institution?.trim() || null,
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
  { value: "staff", label: "Staff" },
  { value: "vip", label: "VIP" },
  { value: "press", label: "Press" },
];

// Alias for backward compatibility
export const REGISTRATION_TYPES = BADGE_TYPES;
