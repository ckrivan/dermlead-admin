"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { Header } from "@/components/layout/Header";
import { Card, CardBody, Button, Input } from "@/components/ui";
import {
  getAttendeesWithGroups,
  createAttendee,
  searchAttendeeRoster,
  deleteAttendee,
  updateAttendee,
  syncAttendeeToSpeaker,
  checkInAttendee,
  undoCheckIn,
  bulkCreateAttendees,
  BADGE_TYPES,
  AttendeeWithGroups,
  type AttendeeCSVRow,
} from "@/lib/api/attendees";
import { getGroups } from "@/lib/api/groups";
import {
  downloadCSV,
  parseCSV,
  parseExcelFile,
  mapExcelRowToAttendee,
  isExcelFile,
} from "@/lib/utils/csv";
import { useEvent } from "@/contexts/EventContext";
import { createClient } from "@/lib/supabase/client";
import { GroupAssignment } from "@/components/GroupAssignment";
import type { EventGroup } from "@/types/database";
import {
  Plus,
  Users,
  Search,
  Filter,
  Upload,
  Download,
  X,
  MoreVertical,
  Trash2,
  CheckCircle2,
  XCircle,
  Mail,
  Tag,
  FileDown,
  ChevronDown,
  QrCode,
  Clock,
  UserCheck,
  UserX,
  Building2,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Pencil,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { QRCodeSVG } from "qrcode.react";

export default function AttendeesPage() {
  const { selectedEvent } = useEvent();
  const selectedEventId = selectedEvent?.id ?? "";

  const [attendees, setAttendees] = useState<AttendeeWithGroups[]>([]);
  const [groups, setGroups] = useState<EventGroup[]>([]);
  const [companyNames, setCompanyNames] = useState<string[]>([]);
  const [admins, setAdmins] = useState<
    { id: string; full_name: string | null; email: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [importResult, setImportResult] = useState<{
    created: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add attendee modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    specialty: "",
    institution: "",
    badge_type: "attendee",
    credentials: "",
    npi_number: "",
    title: "",
    street_address: "",
    street_address_2: "",
    city: "",
    state: "",
    postal_code: "",
  });

  // Roster search state
  const [rosterQuery, setRosterQuery] = useState("");
  const [rosterResults, setRosterResults] = useState<AttendeeWithGroups[]>([]);
  const [rosterSearching, setRosterSearching] = useState(false);
  const rosterDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter state — initialize from URL ?q= param (global search)
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [selectedRegType, setSelectedRegType] = useState<string>("");
  const [showCheckedIn, setShowCheckedIn] = useState<
    "all" | "checked_in" | "not_checked_in"
  >("all");

  // Column visibility state — persisted to localStorage
  const COLUMNS_STORAGE_KEY = "dermlead_attendee_columns";
  const DEFAULT_COLUMNS = ["type", "groups", "status"];

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set(DEFAULT_COLUMNS);
    try {
      const saved = localStorage.getItem(COLUMNS_STORAGE_KEY);
      if (saved) return new Set(JSON.parse(saved));
    } catch {
      // ignore
    }
    return new Set(DEFAULT_COLUMNS);
  });
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const columnPickerRef = useRef<HTMLDivElement>(null);

  const AVAILABLE_COLUMNS = [
    { key: "type", label: "Type" },
    { key: "institution", label: "Institution / Company" },
    { key: "specialty", label: "Specialty" },
    { key: "phone", label: "Phone" },
    { key: "title", label: "Title" },
    { key: "credentials", label: "Credentials" },
    { key: "city_state", label: "City / State" },
    { key: "address", label: "Street Address" },
    { key: "postal_code", label: "Postal Code" },
    { key: "npi", label: "NPI Number" },
    { key: "groups", label: "Groups" },
    { key: "status", label: "Check-in Status" },
  ];

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  // Close column picker when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        columnPickerRef.current &&
        !columnPickerRef.current.contains(e.target as Node)
      ) {
        setShowColumnPicker(false);
      }
    }
    if (showColumnPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showColumnPicker]);

  // Action state
  const [openMoreMenu, setOpenMoreMenu] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [openMoreMenuRect, setOpenMoreMenuRect] = useState<DOMRect | null>(
    null,
  );
  const [qrAttendee, setQrAttendee] = useState<AttendeeWithGroups | null>(
    null,
  );

  // Edit attendee state
  const [editAttendee, setEditAttendee] = useState<AttendeeWithGroups | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    specialty: "",
    institution: "",
    credentials: "",
    title: "",
    badge_type: "attendee",
    badge_types: [] as string[],
    bio: "",
    npi_number: "",
    street_address: "",
    street_address_2: "",
    city: "",
    state: "",
    postal_code: "",
  });

  // Roster search error state
  const [rosterError, setRosterError] = useState<string | null>(null);

  // Refetch function for real-time updates (stable ref to avoid subscription churn)
  const refetchAttendeesRef = useRef<(() => Promise<void>) | undefined>(undefined);
  refetchAttendeesRef.current = async () => {
    if (!selectedEventId) return;
    try {
      const attendeesData = await getAttendeesWithGroups(selectedEventId);
      setAttendees(attendeesData);
    } catch (error) {
      console.error("Error refetching attendees:", error);
    }
  };

  const refetchAttendees = useCallback(async () => {
    await refetchAttendeesRef.current?.();
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!selectedEventId) {
        setAttendees([]);
        setGroups([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const supabaseForAdmins = createClient();
        const [attendeesData, groupsData, adminsResult, sponsorsResult, exhibitorsResult] = await Promise.all([
          getAttendeesWithGroups(selectedEventId),
          getGroups(selectedEventId),
          supabaseForAdmins
            .from("profiles")
            .select("id, full_name, email")
            .eq("organization_id", selectedEvent?.organization_id || "")
            .eq("role", "admin"),
          supabaseForAdmins
            .from("sponsors")
            .select("company_name")
            .eq("event_id", selectedEventId)
            .order("company_name"),
          supabaseForAdmins
            .from("exhibitors")
            .select("company_name")
            .eq("event_id", selectedEventId)
            .order("company_name"),
        ]);
        setAttendees(attendeesData);
        setGroups(groupsData);
        setAdmins(adminsResult.data || []);
        const names = new Set<string>();
        (sponsorsResult.data || []).forEach((s: { company_name: string }) => names.add(s.company_name));
        (exhibitorsResult.data || []).forEach((e: { company_name: string }) => names.add(e.company_name));
        setCompanyNames([...names].sort());
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Set up real-time subscription for attendees
    if (!selectedEventId) return;

    const supabase = createClient();
    const channelName = `admin-attendees:${selectedEventId}`;
    let debounceTimer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "attendees",
          filter: `event_id=eq.${selectedEventId}`,
        },
        (payload: { eventType: string }) => {
          if (cancelled) return;
          console.log("Attendee change detected:", payload.eventType);
          // Debounce rapid changes (e.g. bulk imports) to avoid hammering the DB
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            if (!cancelled) refetchAttendeesRef.current?.();
          }, 500);
        },
      )
      .subscribe((status: string) => {
        console.log(
          `Real-time subscription status for ${channelName}:`,
          status,
        );
      });

    // Cleanup subscription on unmount or eventId change
    return () => {
      cancelled = true;
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [selectedEventId]);

  // Combine badge_type (primary/printed badge) + badge_types (additional roles), deduplicated
  const getAllBadgeTypes = (attendee: AttendeeWithGroups): string[] => {
    const types = new Set<string>();
    types.add(attendee.badge_type);
    if (attendee.badge_types) attendee.badge_types.forEach((t) => types.add(t));
    return Array.from(types);
  };

  // Filter attendees
  const filteredAttendees = attendees.filter((attendee) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !attendee.full_name.toLowerCase().includes(query) &&
        !attendee.email.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    if (selectedGroup && !attendee.groups.some((g) => g.id === selectedGroup)) {
      return false;
    }
    if (selectedRegType) {
      const allTypes = getAllBadgeTypes(attendee);
      if (!allTypes.includes(selectedRegType)) return false;
    }
    if (showCheckedIn === "checked_in" && !attendee.checked_in_at) {
      return false;
    }
    if (showCheckedIn === "not_checked_in" && attendee.checked_in_at) {
      return false;
    }
    return true;
  });

  // Stats (exclude speakers/leadership from attendee count)
  const nonSpeakerAttendees = attendees.filter((a) => !['speaker', 'leadership'].includes(a.badge_type));
  const totalAttendees = nonSpeakerAttendees.length;
  const checkedInCount = nonSpeakerAttendees.filter((a) => a.checked_in_at).length;
  const notCheckedInCount = totalAttendees - checkedInCount;

  const getBadgeTypeLabel = (type: string) => {
    return BADGE_TYPES.find((t) => t.value === type)?.label || type;
  };

  const getBadgeTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      attendee: "bg-gray-500/20 text-gray-600",
      industry: "bg-indigo-500/20 text-indigo-600",
      speaker: "bg-blue-500/20 text-blue-600",
      exhibitor: "bg-green-500/20 text-green-600",
      sponsor: "bg-amber-500/20 text-amber-600",
      leadership: "bg-purple-500/20 text-purple-600",
      organiser: "bg-cyan-500/20 text-cyan-600",
    };
    return colors[type] || "bg-gray-500/20 text-gray-600";
  };

  const handleDownloadTemplate = () => {
    const template = [
      "first_name,last_name,email,credentials,specialty,institution,npi_number,badge_type,phone,street_address,street_address_2,city,state,postal_code,groups",
      'John,Doe,john@example.com,MD,Dermatology,General Hospital,1234567890,attendee,555-0000,123 Main St,,Boston,MA,02101,"VIP,Speakers"',
      "Jane,Smith,jane@example.com,PA-C,Aesthetics,Skin Care Center,0987654321,attendee,555-0001,456 Oak Ave,Suite 200,Chicago,IL,60601,Sponsors",
    ].join("\n");
    downloadCSV(template, "attendees_template.csv");
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEventId) return;

    setImporting(true);
    setImportResult(null);
    setImportProgress(null);

    try {
      let rows: AttendeeCSVRow[];

      if (isExcelFile(file.name)) {
        // Excel file: parse and map columns
        const rawRows = await parseExcelFile(file);
        if (rawRows.length === 0) {
          setImportResult({ created: 0, errors: ["No data found in file"] });
          return;
        }
        const headers = Object.keys(rawRows[0]);
        // Collect all headers across rows (some rows may have extra keys)
        for (const row of rawRows) {
          for (const key of Object.keys(row)) {
            if (!headers.includes(key)) headers.push(key);
          }
        }
        rows = rawRows.map((row) => mapExcelRowToAttendee(headers, row));
      } else {
        // CSV file: use existing parser
        const text = await file.text();
        rows = parseCSV<AttendeeCSVRow>(text);
      }

      if (rows.length === 0) {
        setImportResult({ created: 0, errors: ["No valid rows found in file"] });
        return;
      }

      const result = await bulkCreateAttendees(selectedEventId, rows, groups, (current, total) => {
        setImportProgress({ current, total });
      }, selectedEvent?.organization_id);
      setImportResult(result);

      // Reload attendees if any were created
      if (result.created > 0) {
        const [attendeesData, groupsData] = await Promise.all([
          getAttendeesWithGroups(selectedEventId),
          getGroups(selectedEventId),
        ]);
        setAttendees(attendeesData);
        setGroups(groupsData);
      }
    } catch (error) {
      console.error("Error importing file:", error);
      setImportResult({ created: 0, errors: ["Failed to parse file"] });
    } finally {
      setImporting(false);
      setImportProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (id: string) => {
    const attendee = attendees.find((a) => a.id === id);
    const hasAccount = !!attendee?.profile_id;

    let deleteAccount = false;
    if (hasAccount) {
      const choice = prompt(
        `Delete "${attendee?.first_name} ${attendee?.last_name}"?\n\n` +
        `This person has a linked account.\n\n` +
        `Type "account" to delete their entire account (they won't be able to sign in).\n` +
        `Type "attendee" to only remove them from this event.`
      );
      if (!choice) return;
      if (choice.toLowerCase() === "account") {
        deleteAccount = true;
      } else if (choice.toLowerCase() !== "attendee") {
        return;
      }
    } else {
      if (!confirm("Delete this attendee record? (No linked account)")) return;
    }

    setDeleting(id);
    try {
      await deleteAttendee(id, deleteAccount);
      setAttendees(attendees.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Error deleting attendee:", error);
    } finally {
      setDeleting(null);
      setOpenMoreMenu(null);
    }
  };

  const handleToggleLeadsAccess = async (id: string, currentValue: boolean) => {
    const newValue = !currentValue;
    try {
      const res = await fetch("/api/attendees/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendeeId: id, leadsAccess: newValue }),
      });
      if (!res.ok) {
        const err = await res.json();
        console.error("Error toggling leads access:", err);
        return;
      }
      setAttendees((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, leads_access: newValue } : a,
        ),
      );
    } catch (error) {
      console.error("Error toggling leads access:", error);
    }
    setOpenMoreMenu(null);
    setOpenMoreMenuRect(null);
  };

  const openEditModal = (attendee: AttendeeWithGroups) => {
    setEditAttendee(attendee);
    setEditForm({
      first_name: attendee.first_name || "",
      last_name: attendee.last_name || "",
      email: attendee.email || "",
      phone: attendee.phone || "",
      specialty: attendee.specialty || "",
      institution: attendee.institution || "",
      credentials: attendee.credentials || "",
      title: attendee.title || "",
      badge_type: attendee.badge_type || "attendee",
      badge_types: attendee.badge_types || [],
      bio: attendee.bio || "",
      npi_number: attendee.npi_number || "",
      street_address: attendee.street_address || "",
      street_address_2: attendee.street_address_2 || "",
      city: attendee.city || "",
      state: attendee.state || "",
      postal_code: attendee.postal_code || "",
    });
    setOpenMoreMenu(null);
    setOpenMoreMenuRect(null);
  };

  const handleEditSave = async () => {
    if (!editAttendee) return;
    setEditSubmitting(true);
    try {
      await updateAttendee(editAttendee.id, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email,
        phone: editForm.phone || null,
        specialty: editForm.specialty || null,
        institution: editForm.institution || null,
        credentials: editForm.credentials || null,
        title: editForm.title || null,
        badge_type: editForm.badge_type,
        badge_types: editForm.badge_types.length > 0 ? editForm.badge_types : null,
        bio: editForm.bio || null,
        npi_number: editForm.npi_number || null,
        street_address: editForm.street_address || null,
        street_address_2: editForm.street_address_2 || null,
        city: editForm.city || null,
        state: editForm.state || null,
        postal_code: editForm.postal_code || null,
      });
      // Auto-create/update linked speaker if badge_types includes 'speaker'
      const badgeTypes = editForm.badge_types.length > 0 ? editForm.badge_types : [];
      if (badgeTypes.includes("speaker") || editForm.badge_type === "speaker") {
        await syncAttendeeToSpeaker(editAttendee.id, {
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          credentials: editForm.credentials || null,
          institution: editForm.institution || null,
          specialty: editForm.specialty || null,
          email: editForm.email,
          bio: editForm.bio || null,
          photo_url: editAttendee.photo_url || null,
          event_id: editAttendee.event_id,
        });
      }
      await refetchAttendees();
      setEditAttendee(null);
    } catch (error) {
      console.error("Error updating attendee:", error);
      alert("Failed to update attendee");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleCheckIn = async (id: string, isCheckedIn: boolean) => {
    setCheckingIn(id);
    try {
      if (isCheckedIn) {
        await undoCheckIn(id);
        setAttendees(
          attendees.map((a) =>
            a.id === id ? { ...a, checked_in_at: null } : a,
          ),
        );
      } else {
        const updated = await checkInAttendee(id);
        setAttendees(
          attendees.map((a) =>
            a.id === id ? { ...a, checked_in_at: updated.checked_in_at } : a,
          ),
        );
      }
    } catch (error) {
      console.error("Error updating check-in:", error);
    } finally {
      setCheckingIn(null);
    }
  };

  const handleRosterSearch = (query: string) => {
    setRosterQuery(query);
    setRosterError(null);
    if (rosterDebounceRef.current) clearTimeout(rosterDebounceRef.current);
    if (!query.trim()) {
      setRosterResults([]);
      return;
    }
    rosterDebounceRef.current = setTimeout(async () => {
      setRosterSearching(true);
      try {
        const results = await searchAttendeeRoster(query);
        setRosterResults(results as unknown as AttendeeWithGroups[]);
      } catch (err) {
        console.error("Roster search error:", err);
        setRosterError("Search failed. Please try again.");
        setRosterResults([]);
      } finally {
        setRosterSearching(false);
      }
    }, 300);
  };

  const handleRosterSelect = (person: AttendeeWithGroups) => {
    setAddForm({
      first_name: person.first_name,
      last_name: person.last_name,
      email: person.email,
      phone: person.phone || "",
      specialty: person.specialty || "",
      institution: person.institution || "",
      badge_type: person.badge_type || "attendee",
      credentials: person.credentials || "",
      npi_number: person.npi_number || "",
      title: person.title || "",
      street_address: person.street_address || "",
      street_address_2: person.street_address_2 || "",
      city: person.city || "",
      state: person.state || "",
      postal_code: person.postal_code || "",
    });
    setRosterQuery("");
    setRosterResults([]);
  };

  const handleAddAttendee = async () => {
    if (
      !selectedEventId ||
      !addForm.first_name.trim() ||
      !addForm.last_name.trim() ||
      !addForm.email.trim()
    )
      return;
    setAddSubmitting(true);
    try {
      await createAttendee({
        event_id: selectedEventId,
        organization_id: selectedEvent?.organization_id || "",
        profile_id: null, // auto-linked by createAttendee via email lookup
        first_name: addForm.first_name.trim(),
        last_name: addForm.last_name.trim(),
        email: addForm.email.trim(),
        phone: addForm.phone.trim() || null,
        specialty: addForm.specialty.trim() || null,
        institution: addForm.institution.trim() || null,
        title: addForm.title.trim() || null,
        credentials: addForm.credentials.trim() || null,
        npi_number: addForm.npi_number.trim() || null,
        street_address: addForm.street_address.trim() || null,
        street_address_2: addForm.street_address_2.trim() || null,
        city: addForm.city.trim() || null,
        state: addForm.state.trim() || null,
        postal_code: addForm.postal_code.trim() || null,
        badge_type: addForm.badge_type || "attendee",
        badge_types: null,
        leads_access: false,
        bio: null,
        photo_url: null,
        badge_generated: false,
        badge_printed: false,
        qr_data: null,
        registered_at: null,
        checked_in: false,
        checked_in_at: null,
        checked_in_by: null,
        updated_at: new Date().toISOString(),
      });
      setShowAddModal(false);
      setAddForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        specialty: "",
        institution: "",
        badge_type: "attendee",
        credentials: "",
        npi_number: "",
        title: "",
        street_address: "",
        street_address_2: "",
        city: "",
        state: "",
        postal_code: "",
      });
      setRosterQuery("");
      setRosterResults([]);
      await refetchAttendees();
    } catch (error) {
      console.error("Error adding attendee:", error);
      alert("Failed to add attendee. Please try again.");
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleExport = () => {
    const csvContent = [
      [
        "First Name",
        "Last Name",
        "Credentials",
        "Email",
        "Phone",
        "Specialty",
        "Institution",
        "NPI",
        "Street Address",
        "Street Address 2",
        "City",
        "State",
        "Postal Code",
        "Badge Type",
        "Groups",
        "Checked In",
      ],
      ...filteredAttendees.map((a) => [
        a.first_name,
        a.last_name,
        a.credentials || "",
        a.email,
        a.phone || "",
        a.specialty || "",
        a.institution || "",
        a.npi_number || "",
        a.street_address || "",
        a.street_address_2 || "",
        a.city || "",
        a.state || "",
        a.postal_code || "",
        a.badge_type,
        a.groups.map((g) => g.name).join(", "),
        a.checked_in_at
          ? format(parseISO(a.checked_in_at), "yyyy-MM-dd HH:mm")
          : "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    downloadCSV(csvContent, "attendees.csv");
  };

  return (
    <>
      <Header
        title="Attendees"
        subtitle="Manage event attendees and registrations"
      />

      <div className="p-4 md:p-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]" />
          </div>
        ) : attendees.length === 0 && selectedEventId ? (
          <Card>
            <CardBody className="text-center py-12">
              <Users
                size={48}
                className="mx-auto text-[var(--foreground-subtle)] mb-4"
              />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                No attendees yet
              </h3>
              <p className="text-[var(--foreground-muted)] mb-4">
                Import attendees from CSV or add them manually.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="secondary"
                  icon={<Upload size={18} />}
                  onClick={() => setShowImportModal(true)}
                >
                  Import from CSV
                </Button>
                <Button
                  icon={<Plus size={18} />}
                  onClick={() => setShowAddModal(true)}
                >
                  Add Attendee
                </Button>
              </div>
            </CardBody>
          </Card>
        ) : (
          <>
            {/* Admins Card */}
            {admins.length > 0 && (
              <Card>
                <CardBody className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-violet-500/10">
                    <Users size={24} className="text-violet-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--foreground-muted)] mb-1">
                      Admins
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {admins.map((admin) => (
                        <div key={admin.id} className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-600">
                            {(admin.full_name ||
                              admin.email ||
                              "?")[0].toUpperCase()}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-[var(--foreground)]">
                              {admin.full_name || "Unknown"}
                            </span>
                            {admin.email && (
                              <span className="text-[var(--foreground-muted)] ml-1">
                                ({admin.email})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardBody className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/10">
                    <Users size={24} className="text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      Total Attendees
                    </p>
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                      {totalAttendees}
                    </p>
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-green-500/10">
                    <UserCheck size={24} className="text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      Checked In
                    </p>
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                      {checkedInCount}
                      <span className="text-sm font-normal text-[var(--foreground-muted)] ml-2">
                        (
                        {totalAttendees > 0
                          ? Math.round((checkedInCount / totalAttendees) * 100)
                          : 0}
                        %)
                      </span>
                    </p>
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-amber-500/10">
                    <UserX size={24} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      Not Checked In
                    </p>
                    <p className="text-2xl font-bold text-[var(--foreground)]">
                      {notCheckedInCount}
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3">
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
                  />
                  <input
                    type="text"
                    placeholder="Search attendees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-[var(--input-focus)] w-64"
                  />
                </div>

                {/* Group Filter */}
                {groups.length > 0 && (
                  <div className="relative">
                    <Tag
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
                    />
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="pl-9 pr-8 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)] appearance-none cursor-pointer"
                    >
                      <option value="">All Groups</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] pointer-events-none"
                    />
                  </div>
                )}

                {/* Badge Type Filter */}
                <div className="relative">
                  <Filter
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
                  />
                  <select
                    value={selectedRegType}
                    onChange={(e) => setSelectedRegType(e.target.value)}
                    className="pl-9 pr-8 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)] appearance-none cursor-pointer"
                  >
                    <option value="">All Types ({attendees.length})</option>
                    {BADGE_TYPES.map((type) => {
                      const count = attendees.filter((a) => a.badge_type === type.value).length;
                      return (
                        <option key={type.value} value={type.value}>
                          {type.label} ({count})
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] pointer-events-none"
                  />
                </div>

                {/* Check-in Status Filter */}
                <div className="flex rounded-lg overflow-hidden border border-[var(--input-border)]">
                  <button
                    onClick={() => setShowCheckedIn("all")}
                    className={`px-3 py-2 text-sm ${
                      showCheckedIn === "all"
                        ? "bg-[var(--accent-primary)] text-white"
                        : "bg-[var(--input-bg)] text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)]"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setShowCheckedIn("checked_in")}
                    className={`px-3 py-2 text-sm border-l border-[var(--input-border)] ${
                      showCheckedIn === "checked_in"
                        ? "bg-green-500 text-white"
                        : "bg-[var(--input-bg)] text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)]"
                    }`}
                  >
                    Checked In
                  </button>
                  <button
                    onClick={() => setShowCheckedIn("not_checked_in")}
                    className={`px-3 py-2 text-sm border-l border-[var(--input-border)] ${
                      showCheckedIn === "not_checked_in"
                        ? "bg-amber-500 text-white"
                        : "bg-[var(--input-bg)] text-[var(--foreground-muted)] hover:bg-[var(--background-tertiary)]"
                    }`}
                  >
                    Not Checked In
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative" ref={columnPickerRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<SlidersHorizontal size={16} />}
                    onClick={() => setShowColumnPicker(!showColumnPicker)}
                  >
                    Columns
                  </Button>
                  {showColumnPicker && (
                    <div className="absolute right-0 top-full mt-1 w-56 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-xl z-50 py-2">
                      <p className="px-3 py-1 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
                        Toggle Columns
                      </p>
                      {AVAILABLE_COLUMNS.map((col) => (
                        <button
                          key={col.key}
                          onClick={() => toggleColumn(col.key)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-colors"
                        >
                          {visibleColumns.has(col.key) ? (
                            <Eye
                              size={14}
                              className="text-[var(--accent-primary)]"
                            />
                          ) : (
                            <EyeOff
                              size={14}
                              className="text-[var(--foreground-muted)]"
                            />
                          )}
                          <span
                            className={
                              visibleColumns.has(col.key)
                                ? ""
                                : "text-[var(--foreground-muted)]"
                            }
                          >
                            {col.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<FileDown size={16} />}
                  onClick={handleExport}
                >
                  Export
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Upload size={16} />}
                  onClick={() => setShowImportModal(true)}
                >
                  Import
                </Button>
                <Button
                  size="sm"
                  icon={<Plus size={16} />}
                  onClick={() => setShowAddModal(true)}
                >
                  Add Attendee
                </Button>
              </div>
            </div>

            {/* Attendees Table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-[var(--card-border)]">
                      <th className="text-left p-4 text-sm font-medium text-[var(--foreground-muted)]">
                        Attendee
                      </th>
                      {visibleColumns.has("type") && (
                        <th className="text-left p-4 text-sm font-medium text-[var(--foreground-muted)]">
                          Type
                        </th>
                      )}
                      {visibleColumns.has("institution") && (
                        <th className="text-left p-4 text-sm font-medium text-[var(--foreground-muted)]">
                          Institution
                        </th>
                      )}
                      {visibleColumns.has("specialty") && (
                        <th className="text-left p-4 text-sm font-medium text-[var(--foreground-muted)]">
                          Specialty
                        </th>
                      )}
                      {visibleColumns.has("title") && (
                        <th className="text-left p-4 text-sm font-medium text-[var(--foreground-muted)]">
                          Title
                        </th>
                      )}
                      {visibleColumns.has("credentials") && (
                        <th className="text-left p-4 text-sm font-medium text-[var(--foreground-muted)]">
                          Credentials
                        </th>
                      )}
                      {visibleColumns.has("phone") && (
                        <th className="text-left p-4 text-sm font-medium text-[var(--foreground-muted)]">
                          Phone
                        </th>
                      )}
                      {visibleColumns.has("city_state") && (
                        <th className="text-left p-4 text-sm font-medium text-[var(--foreground-muted)]">
                          City / State
                        </th>
                      )}
                      {visibleColumns.has("address") && (
                        <th className="text-left p-4 text-sm font-medium text-[var(--foreground-muted)]">
                          Street Address
                        </th>
                      )}
                      {visibleColumns.has("postal_code") && (
                        <th className="text-left p-4 text-sm font-medium text-[var(--foreground-muted)]">
                          Postal Code
                        </th>
                      )}
                      {visibleColumns.has("npi") && (
                        <th className="text-left p-4 text-sm font-medium text-[var(--foreground-muted)]">
                          NPI
                        </th>
                      )}
                      {visibleColumns.has("groups") && (
                        <th className="text-left p-4 text-sm font-medium text-[var(--foreground-muted)]">
                          Groups
                        </th>
                      )}
                      {visibleColumns.has("status") && (
                        <th className="text-left p-4 text-sm font-medium text-[var(--foreground-muted)]">
                          Status
                        </th>
                      )}
                      <th className="text-right p-4 text-sm font-medium text-[var(--foreground-muted)]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendees.length === 0 ? (
                      <tr>
                        <td
                          colSpan={2 + visibleColumns.size}
                          className="p-8 text-center text-[var(--foreground-muted)]"
                        >
                          No attendees found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredAttendees.map((attendee) => (
                        <tr
                          key={attendee.id}
                          className="border-b border-[var(--card-border)] hover:bg-[var(--background-tertiary)] transition-colors"
                        >
                          <td className="p-4">
                            <div>
                              <p className="font-medium text-[var(--foreground)]">
                                {attendee.full_name}
                                {attendee.credentials && (
                                  <span className="text-[var(--foreground-muted)] font-normal">
                                    , {attendee.credentials}
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-[var(--foreground-muted)] flex items-center gap-1">
                                <Mail size={12} />
                                {attendee.email}
                              </p>
                            </div>
                          </td>
                          {visibleColumns.has("type") && (
                            <td className="p-4">
                              <div className="flex flex-wrap gap-1">
                                {getAllBadgeTypes(attendee).map((bt: string) => (
                                  <span
                                    key={bt}
                                    className={`px-2 py-1 rounded text-xs font-medium ${getBadgeTypeColor(bt)}`}
                                  >
                                    {getBadgeTypeLabel(bt)}
                                  </span>
                                ))}
                                {attendee.leads_access && (
                                  <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    Leads
                                  </span>
                                )}
                              </div>
                            </td>
                          )}
                          {visibleColumns.has("institution") && (
                            <td className="p-4 text-sm text-[var(--foreground)]">
                              {attendee.institution || (
                                <span className="text-[var(--foreground-muted)]">
                                  —
                                </span>
                              )}
                            </td>
                          )}
                          {visibleColumns.has("specialty") && (
                            <td className="p-4 text-sm text-[var(--foreground)]">
                              {attendee.specialty || (
                                <span className="text-[var(--foreground-muted)]">
                                  —
                                </span>
                              )}
                            </td>
                          )}
                          {visibleColumns.has("title") && (
                            <td className="p-4 text-sm text-[var(--foreground)]">
                              {attendee.title || (
                                <span className="text-[var(--foreground-muted)]">
                                  —
                                </span>
                              )}
                            </td>
                          )}
                          {visibleColumns.has("credentials") && (
                            <td className="p-4 text-sm text-[var(--foreground)]">
                              {attendee.credentials || (
                                <span className="text-[var(--foreground-muted)]">
                                  —
                                </span>
                              )}
                            </td>
                          )}
                          {visibleColumns.has("phone") && (
                            <td className="p-4 text-sm text-[var(--foreground)]">
                              {attendee.phone || (
                                <span className="text-[var(--foreground-muted)]">
                                  —
                                </span>
                              )}
                            </td>
                          )}
                          {visibleColumns.has("city_state") && (
                            <td className="p-4 text-sm text-[var(--foreground)]">
                              {attendee.city || attendee.state ? (
                                [attendee.city, attendee.state]
                                  .filter(Boolean)
                                  .join(", ")
                              ) : (
                                <span className="text-[var(--foreground-muted)]">
                                  —
                                </span>
                              )}
                            </td>
                          )}
                          {visibleColumns.has("address") && (
                            <td className="p-4 text-sm text-[var(--foreground)]">
                              {attendee.street_address ? (
                                <div>
                                  <div>{attendee.street_address}</div>
                                  {attendee.street_address_2 && (
                                    <div className="text-[var(--foreground-muted)]">{attendee.street_address_2}</div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[var(--foreground-muted)]">—</span>
                              )}
                            </td>
                          )}
                          {visibleColumns.has("postal_code") && (
                            <td className="p-4 text-sm text-[var(--foreground)]">
                              {attendee.postal_code || (
                                <span className="text-[var(--foreground-muted)]">—</span>
                              )}
                            </td>
                          )}
                          {visibleColumns.has("npi") && (
                            <td className="p-4 text-sm text-[var(--foreground)]">
                              {attendee.npi_number || (
                                <span className="text-[var(--foreground-muted)]">
                                  —
                                </span>
                              )}
                            </td>
                          )}
                          {visibleColumns.has("groups") && (
                            <td className="p-4">
                              <GroupAssignment
                                entityType="attendee"
                                entityId={attendee.id}
                                eventId={selectedEventId}
                                availableGroups={groups}
                                initialGroups={attendee.groups || []}
                                onGroupsChange={() => refetchAttendees()}
                                compact={true}
                              />
                            </td>
                          )}
                          {visibleColumns.has("status") && (
                            <td className="p-4">
                              {attendee.checked_in_at ? (
                                <div className="flex items-center gap-2 text-green-500">
                                  <CheckCircle2 size={16} />
                                  <div>
                                    <p className="text-sm font-medium">
                                      Checked In
                                    </p>
                                    <p className="text-xs text-[var(--foreground-muted)]">
                                      {format(
                                        parseISO(attendee.checked_in_at),
                                        "MMM d, h:mm a",
                                      )}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-[var(--foreground-muted)]">
                                  <XCircle size={16} />
                                  <span className="text-sm">
                                    Not checked in
                                  </span>
                                </div>
                              )}
                            </td>
                          )}
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<QrCode size={14} />}
                                onClick={() => setQrAttendee(attendee)}
                                title="View QR Code"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={
                                  attendee.checked_in_at ? (
                                    <XCircle size={14} />
                                  ) : (
                                    <CheckCircle2 size={14} />
                                  )
                                }
                                onClick={() =>
                                  handleCheckIn(
                                    attendee.id,
                                    !!attendee.checked_in_at,
                                  )
                                }
                                disabled={checkingIn === attendee.id}
                                className={
                                  attendee.checked_in_at
                                    ? "text-amber-500"
                                    : "text-green-500"
                                }
                              >
                                {checkingIn === attendee.id
                                  ? "..."
                                  : attendee.checked_in_at
                                    ? "Undo"
                                    : "Check In"}
                              </Button>

                              {/* More Menu */}
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={<MoreVertical size={14} />}
                                onClick={(e) => {
                                  if (openMoreMenu === attendee.id) {
                                    setOpenMoreMenu(null);
                                    setOpenMoreMenuRect(null);
                                  } else {
                                    setOpenMoreMenu(attendee.id);
                                    setOpenMoreMenuRect(
                                      (
                                        e.currentTarget as HTMLElement
                                      ).getBoundingClientRect(),
                                    );
                                  }
                                }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Results count */}
            <p className="text-sm text-[var(--foreground-muted)] text-center">
              Showing {filteredAttendees.length} of {totalAttendees} attendees
            </p>
          </>
        )}
      </div>

      {/* Add Attendee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-4">
          <div className="bg-[var(--card-bg)] rounded-xl shadow-xl w-full max-w-md mx-4 my-auto max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
              <h3 className="font-semibold text-[var(--foreground)]">
                Add Attendee
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setRosterQuery("");
                  setRosterResults([]);
                }}
                className="p-1 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {/* Roster search */}
              <div className="relative">
                <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                  Search existing attendees
                </label>
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)]"
                  />
                  <input
                    type="text"
                    value={rosterQuery}
                    onChange={(e) => handleRosterSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    placeholder="Name or email..."
                  />
                  {rosterSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-3 w-3 rounded-full border-b border-[var(--accent-primary)]" />
                    </div>
                  )}
                </div>
                {rosterResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {rosterResults.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => handleRosterSelect(person)}
                        className="w-full text-left px-3 py-2 hover:bg-[var(--background-tertiary)] transition-colors"
                      >
                        <p className="text-sm font-medium text-[var(--foreground)]">
                          {person.first_name} {person.last_name}
                        </p>
                        <p className="text-xs text-[var(--foreground-muted)]">
                          {person.email}
                          {person.specialty ? ` · ${person.specialty}` : ""}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                {rosterError && (
                  <p className="mt-1 text-xs text-[var(--accent-danger)]">
                    {rosterError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-[var(--foreground-subtle)]">
                <div className="flex-1 h-px bg-[var(--card-border)]" />
                or fill in manually
                <div className="flex-1 h-px bg-[var(--card-border)]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={addForm.first_name}
                    onChange={(e) =>
                      setAddForm({ ...addForm, first_name: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={addForm.last_name}
                    onChange={(e) =>
                      setAddForm({ ...addForm, last_name: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) =>
                    setAddForm({ ...addForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={addForm.phone}
                    onChange={(e) =>
                      setAddForm({ ...addForm, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    placeholder="(555) 000-0000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                    Badge Type
                  </label>
                  <select
                    value={addForm.badge_type}
                    onChange={(e) =>
                      setAddForm({ ...addForm, badge_type: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  >
                    {BADGE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                    Credentials
                  </label>
                  <input
                    type="text"
                    value={addForm.credentials}
                    onChange={(e) =>
                      setAddForm({ ...addForm, credentials: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    placeholder="e.g. PA-C, MD, NP"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={addForm.title}
                    onChange={(e) =>
                      setAddForm({ ...addForm, title: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    placeholder="Job title"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                    Specialty
                  </label>
                  <input
                    type="text"
                    value={addForm.specialty}
                    onChange={(e) =>
                      setAddForm({ ...addForm, specialty: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    placeholder="e.g. Dermatology"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                    NPI Number
                  </label>
                  <input
                    type="text"
                    value={addForm.npi_number}
                    onChange={(e) =>
                      setAddForm({ ...addForm, npi_number: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    placeholder="10-digit NPI"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                  Institution / Company
                </label>
                <input
                  type="text"
                  list="company-names-add"
                  value={addForm.institution}
                  onChange={(e) =>
                    setAddForm({ ...addForm, institution: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  placeholder="Type to search Industry Partners..."
                />
                <datalist id="company-names-add">
                  {companyNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={addForm.street_address}
                  onChange={(e) =>
                    setAddForm({ ...addForm, street_address: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  placeholder="Street address"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={addForm.street_address_2}
                  onChange={(e) =>
                    setAddForm({ ...addForm, street_address_2: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  placeholder="Suite, unit, etc."
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={addForm.city}
                    onChange={(e) =>
                      setAddForm({ ...addForm, city: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={addForm.state}
                    onChange={(e) =>
                      setAddForm({ ...addForm, state: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--foreground-muted)] mb-1">
                    Zip
                  </label>
                  <input
                    type="text"
                    value={addForm.postal_code}
                    onChange={(e) =>
                      setAddForm({ ...addForm, postal_code: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    placeholder="Zip"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-[var(--card-border)]">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowAddModal(false);
                  setRosterQuery("");
                  setRosterResults([]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddAttendee}
                disabled={
                  addSubmitting ||
                  !addForm.first_name.trim() ||
                  !addForm.last_name.trim() ||
                  !addForm.email.trim()
                }
              >
                {addSubmitting ? "Adding..." : "Add Attendee"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
              <h3 className="font-semibold text-[var(--foreground)]">
                Import Attendees
              </h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportResult(null);
                }}
                className="p-1 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-[var(--foreground-muted)] mb-3">
                  Upload a CSV or Excel (.xlsx) file with attendee information.
                  States will be normalized and NPI numbers validated automatically.
                </p>
                <div className="bg-[var(--background-tertiary)] rounded-lg p-3 text-sm">
                  <p className="font-medium text-[var(--foreground)] mb-1">
                    CSV Columns:
                  </p>
                  <ul className="text-[var(--foreground-muted)] space-y-0.5 text-xs">
                    <li>
                      <code className="bg-[var(--input-bg)] px-1 rounded">
                        first_name
                      </code>
                      ,{" "}
                      <code className="bg-[var(--input-bg)] px-1 rounded">
                        last_name
                      </code>
                      ,{" "}
                      <code className="bg-[var(--input-bg)] px-1 rounded">
                        email
                      </code>{" "}
                      - Required
                    </li>
                    <li>
                      <code className="bg-[var(--input-bg)] px-1 rounded">
                        credentials
                      </code>
                      ,{" "}
                      <code className="bg-[var(--input-bg)] px-1 rounded">
                        specialty
                      </code>
                      ,{" "}
                      <code className="bg-[var(--input-bg)] px-1 rounded">
                        institution
                      </code>
                      ,{" "}
                      <code className="bg-[var(--input-bg)] px-1 rounded">
                        npi_number
                      </code>{" "}
                      - Optional
                    </li>
                    <li>
                      <code className="bg-[var(--input-bg)] px-1 rounded">
                        badge_type
                      </code>{" "}
                      - Optional (attendee, industry, speaker, organiser, etc.)
                    </li>
                    <li>
                      <code className="bg-[var(--input-bg)] px-1 rounded">
                        street_address
                      </code>
                      ,{" "}
                      <code className="bg-[var(--input-bg)] px-1 rounded">
                        city
                      </code>
                      ,{" "}
                      <code className="bg-[var(--input-bg)] px-1 rounded">
                        state
                      </code>
                      ,{" "}
                      <code className="bg-[var(--input-bg)] px-1 rounded">
                        postal_code
                      </code>{" "}
                      - Optional
                    </li>
                    <li>
                      <code className="bg-[var(--input-bg)] px-1 rounded">
                        groups
                      </code>{" "}
                      - Optional (comma-separated group names)
                    </li>
                  </ul>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Download size={16} />}
                  onClick={handleDownloadTemplate}
                  className="mt-3"
                >
                  Download Template
                </Button>
              </div>

              <div className="border-2 border-dashed border-[var(--input-border)] rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload-attendees"
                />
                <label
                  htmlFor="csv-upload-attendees"
                  className="cursor-pointer"
                >
                  {importing ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mb-2" />
                      <span className="text-sm text-[var(--foreground-muted)]">
                        {importProgress
                          ? `Importing ${importProgress.current} / ${importProgress.total}...`
                          : "Preparing import..."}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload
                        size={32}
                        className="text-[var(--foreground-subtle)] mb-2"
                      />
                      <span className="text-sm text-[var(--foreground)]">
                        Click to select CSV or Excel file
                      </span>
                      <span className="text-xs text-[var(--foreground-muted)] mt-1">
                        or drag and drop
                      </span>
                    </div>
                  )}
                </label>
              </div>

              {importResult && (
                <div
                  className={`p-3 rounded-lg ${
                    importResult.errors.length > 0
                      ? "bg-yellow-500/10"
                      : "bg-green-500/10"
                  }`}
                >
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {importResult.created} attendee
                    {importResult.created !== 1 ? "s" : ""} imported
                    successfully
                  </p>
                  {importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-[var(--foreground-muted)] mb-1">
                        Warnings:
                      </p>
                      <ul className="text-xs text-[var(--accent-warning)] space-y-0.5 max-h-24 overflow-y-auto">
                        {importResult.errors.map((error, i) => (
                          <li key={i}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end p-4 border-t border-[var(--card-border)]">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowImportModal(false);
                  setImportResult(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Attendee row ⋮ menu — rendered via portal so it's never clipped by overflow-x-auto */}
      {openMoreMenu &&
        openMoreMenuRect &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setOpenMoreMenu(null);
                setOpenMoreMenuRect(null);
              }}
            />
            <div
              className="fixed z-50 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg shadow-lg py-1 min-w-[140px]"
              style={{
                top: openMoreMenuRect.bottom + 4,
                right: window.innerWidth - openMoreMenuRect.right,
              }}
            >
              <button
                onClick={() => {
                  const att = attendees.find((a) => a.id === openMoreMenu);
                  if (att) openEditModal(att);
                }}
                className="w-full px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--background-tertiary)] flex items-center gap-2"
              >
                <Pencil size={14} />
                Edit
              </button>
              {(() => {
                const att = attendees.find((a) => a.id === openMoreMenu);
                if (!att) return null;
                return (
                  <button
                    onClick={() => handleToggleLeadsAccess(openMoreMenu, att.leads_access)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--background-tertiary)] flex items-center gap-2 ${
                      att.leads_access ? 'text-emerald-600' : 'text-[var(--foreground)]'
                    }`}
                  >
                    <Users size={14} />
                    {att.leads_access ? 'Revoke Leads' : 'Grant Leads'}
                  </button>
                );
              })()}
              <button
                onClick={() => {
                  handleDelete(openMoreMenu);
                  setOpenMoreMenu(null);
                  setOpenMoreMenuRect(null);
                }}
                disabled={deleting === openMoreMenu}
                className="w-full px-3 py-2 text-left text-sm text-[var(--accent-danger)] hover:bg-[var(--background-tertiary)] flex items-center gap-2"
              >
                <Trash2 size={14} />
                {deleting === openMoreMenu ? "Deleting..." : "Delete"}
              </button>
            </div>
          </>,
          document.body,
        )}

      {/* QR Code Modal */}
      {qrAttendee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl shadow-xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
              <h3 className="font-semibold text-[var(--foreground)]">
                Badge QR Code
              </h3>
              <button
                onClick={() => setQrAttendee(null)}
                className="p-1 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center gap-4">
              <div className="qr-modal-print bg-white p-4 rounded-lg">
                <QRCodeSVG
                  value={JSON.stringify({ attendeeId: qrAttendee.id })}
                  size={200}
                  level="M"
                />
              </div>

              <div className="text-center">
                <p className="font-semibold text-lg text-[var(--foreground)]">
                  {qrAttendee.first_name} {qrAttendee.last_name}
                  {qrAttendee.credentials && (
                    <span className="text-[var(--foreground-muted)] font-normal">
                      , {qrAttendee.credentials}
                    </span>
                  )}
                </p>
                {qrAttendee.institution && (
                  <p className="text-sm text-[var(--foreground-muted)]">
                    {qrAttendee.institution}
                  </p>
                )}
                {qrAttendee.badge_type && (
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeTypeColor(qrAttendee.badge_type)}`}
                  >
                    {qrAttendee.badge_type}
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-[var(--card-border)]">
              <Button variant="ghost" onClick={() => setQrAttendee(null)}>
                Close
              </Button>
              <Button
                icon={<Download size={16} />}
                onClick={() => {
                  const svg = document.querySelector(".qr-modal-print svg");
                  if (!svg) return;
                  const svgData = new XMLSerializer().serializeToString(svg);
                  const canvas = document.createElement("canvas");
                  canvas.width = 400;
                  canvas.height = 400;
                  const ctx = canvas.getContext("2d");
                  const img = new Image();
                  img.onload = () => {
                    ctx?.drawImage(img, 0, 0, 400, 400);
                    const link = document.createElement("a");
                    link.download = `${qrAttendee.first_name}-${qrAttendee.last_name}-qr.png`;
                    link.href = canvas.toDataURL("image/png");
                    link.click();
                  };
                  img.src =
                    "data:image/svg+xml;base64," + btoa(svgData);
                }}
              >
                Download
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Attendee Modal */}
      {editAttendee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
              <h3 className="font-semibold text-lg text-[var(--foreground)]">
                Edit Attendee
              </h3>
              <button
                onClick={() => setEditAttendee(null)}
                className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Badge Type — prominent selector */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Badge Type
                </label>
                <select
                  value={editForm.badge_type}
                  onChange={(e) =>
                    setEditForm({ ...editForm, badge_type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--foreground)] text-sm focus:ring-2 focus:ring-[var(--accent-primary)]"
                >
                  {BADGE_TYPES.map((bt) => (
                    <option key={bt.value} value={bt.value}>
                      {bt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Additional Badge Types — for people with multiple roles */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Additional Roles
                </label>
                <div className="flex flex-wrap gap-2">
                  {BADGE_TYPES.filter((bt) => bt.value !== editForm.badge_type).map((bt) => (
                    <label
                      key={bt.value}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                        editForm.badge_types.includes(bt.value)
                          ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)]"
                          : "bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--foreground-muted)]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={editForm.badge_types.includes(bt.value)}
                        onChange={(e) => {
                          const types = e.target.checked
                            ? [...editForm.badge_types, bt.value]
                            : editForm.badge_types.filter((t) => t !== bt.value);
                          setEditForm({ ...editForm, badge_types: types });
                        }}
                      />
                      {bt.label}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  Select additional roles beyond the primary badge type
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={editForm.first_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, first_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--foreground)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={editForm.last_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, last_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--foreground)] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--foreground)] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--foreground)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Credentials
                  </label>
                  <input
                    type="text"
                    value={editForm.credentials}
                    onChange={(e) =>
                      setEditForm({ ...editForm, credentials: e.target.value })
                    }
                    placeholder="MD, PA-C, NP..."
                    className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--foreground)] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Specialty
                  </label>
                  <input
                    type="text"
                    value={editForm.specialty}
                    onChange={(e) =>
                      setEditForm({ ...editForm, specialty: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--foreground)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--foreground)] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Institution / Company
                </label>
                <input
                  type="text"
                  list="company-names-edit"
                  value={editForm.institution}
                  onChange={(e) =>
                    setEditForm({ ...editForm, institution: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--foreground)] text-sm"
                  placeholder="Type to search Industry Partners..."
                />
                <datalist id="company-names-edit">
                  {companyNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  NPI Number
                </label>
                <input
                  type="text"
                  value={editForm.npi_number}
                  onChange={(e) =>
                    setEditForm({ ...editForm, npi_number: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--foreground)] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={editForm.street_address}
                  onChange={(e) =>
                    setEditForm({ ...editForm, street_address: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--foreground)] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Street Address 2
                </label>
                <input
                  type="text"
                  value={editForm.street_address_2}
                  onChange={(e) =>
                    setEditForm({ ...editForm, street_address_2: e.target.value })
                  }
                  placeholder="Apt, suite, unit, etc."
                  className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--foreground)] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) =>
                      setEditForm({ ...editForm, city: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--foreground)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={editForm.state}
                    onChange={(e) =>
                      setEditForm({ ...editForm, state: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--foreground)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={editForm.postal_code}
                    onChange={(e) =>
                      setEditForm({ ...editForm, postal_code: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--foreground)] text-sm"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                  Bio
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bio: e.target.value })
                  }
                  rows={3}
                  placeholder="Speaker biography..."
                  className="w-full px-3 py-2 border border-[var(--card-border)] rounded-lg bg-[var(--card-bg)] text-[var(--foreground)] text-sm resize-y"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-[var(--card-border)]">
              <Button variant="ghost" onClick={() => setEditAttendee(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleEditSave}
                disabled={editSubmitting || !editForm.first_name || !editForm.last_name || !editForm.email}
              >
                {editSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
