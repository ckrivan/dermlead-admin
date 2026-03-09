"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardBody } from "@/components/ui";
import {
  Calendar,
  Users,
  Presentation,
  BarChart3,
  UserCheck,
  Building2,
} from "lucide-react";
import { useEvent } from "@/contexts/EventContext";
import { createClient } from "@/lib/supabase/client";

interface DashboardStats {
  totalEvents: number;
  totalSpeakers: number;
  totalSessions: number;
  totalAttendees: number;
  checkedIn: number;
  industryPartners: number;
}

export default function DashboardPage() {
  const { selectedEvent, events } = useEvent();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      const supabase = createClient();

      const eventId = selectedEvent?.id;

      // Always count all events
      const { count: eventCount } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true });

      if (!eventId) {
        setStats({
          totalEvents: eventCount || 0,
          totalSpeakers: 0,
          totalSessions: 0,
          totalAttendees: 0,
          checkedIn: 0,
          industryPartners: 0,
        });
        setLoading(false);
        return;
      }

      // Fetch counts scoped to selected event
      const [speakers, sessions, attendees, checkedIn, industry] =
        await Promise.all([
          supabase
            .from("speakers")
            .select("*", { count: "exact", head: true })
            .eq("event_id", eventId),
          supabase
            .from("sessions")
            .select("*", { count: "exact", head: true })
            .eq("event_id", eventId),
          supabase
            .from("attendees")
            .select("*", { count: "exact", head: true })
            .eq("event_id", eventId),
          supabase
            .from("attendees")
            .select("*", { count: "exact", head: true })
            .eq("event_id", eventId)
            .eq("checked_in", true),
          supabase
            .from("attendees")
            .select("*", { count: "exact", head: true })
            .eq("event_id", eventId)
            .eq("badge_type", "industry"),
        ]);

      setStats({
        totalEvents: eventCount || 0,
        totalSpeakers: speakers.count || 0,
        totalSessions: sessions.count || 0,
        totalAttendees: attendees.count || 0,
        checkedIn: checkedIn.count || 0,
        industryPartners: industry.count || 0,
      });
      setLoading(false);
    }

    loadStats();
  }, [selectedEvent?.id]);

  const statCards = stats
    ? [
        {
          name: "Total Events",
          value: stats.totalEvents.toString(),
          icon: Calendar,
          color: "text-blue-400",
          bgColor: "bg-blue-400/10",
        },
        {
          name: "Attendees",
          value: stats.totalAttendees.toString(),
          icon: Users,
          color: "text-green-400",
          bgColor: "bg-green-400/10",
        },
        {
          name: "Checked In",
          value: `${stats.checkedIn} / ${stats.totalAttendees}`,
          icon: UserCheck,
          color: "text-emerald-400",
          bgColor: "bg-emerald-400/10",
        },
        {
          name: "Industry Partners",
          value: stats.industryPartners.toString(),
          icon: Building2,
          color: "text-indigo-400",
          bgColor: "bg-indigo-400/10",
        },
        {
          name: "Speakers",
          value: stats.totalSpeakers.toString(),
          icon: BarChart3,
          color: "text-orange-400",
          bgColor: "bg-orange-400/10",
        },
        {
          name: "Sessions",
          value: stats.totalSessions.toString(),
          icon: Presentation,
          color: "text-purple-400",
          bgColor: "bg-purple-400/10",
        },
      ]
    : [];

  return (
    <>
      <Header
        title="Dashboard"
        subtitle={
          selectedEvent
            ? `Overview for ${selectedEvent.name}`
            : "Welcome to Converge Admin"
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardBody className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-[var(--background-tertiary)] animate-pulse w-12 h-12" />
                  <div className="space-y-2">
                    <div className="h-3 w-20 bg-[var(--background-tertiary)] rounded animate-pulse" />
                    <div className="h-6 w-12 bg-[var(--background-tertiary)] rounded animate-pulse" />
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {statCards.map((stat) => (
              <Card key={stat.name}>
                <CardBody className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={stat.color} size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      {stat.name}
                    </p>
                    <p className="text-2xl font-semibold text-[var(--foreground)]">
                      {stat.value}
                    </p>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardBody>
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Quick Actions
              </h2>
              <div className="space-y-2">
                <a
                  href="/speakers/new"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                >
                  <div className="p-2 rounded-lg bg-blue-400/10">
                    <Users className="text-blue-400" size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      Add New Speaker
                    </p>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      Create a speaker profile for your event
                    </p>
                  </div>
                </a>
                <a
                  href="/sessions/new"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                >
                  <div className="p-2 rounded-lg bg-purple-400/10">
                    <Presentation className="text-purple-400" size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      Create Session
                    </p>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      Schedule a new session or workshop
                    </p>
                  </div>
                </a>
                <a
                  href="/events/new"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                >
                  <div className="p-2 rounded-lg bg-green-400/10">
                    <Calendar className="text-green-400" size={18} />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      Create Event
                    </p>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      Set up a new convention or conference
                    </p>
                  </div>
                </a>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Event Details
              </h2>
              {selectedEvent ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      Event Name
                    </p>
                    <p className="font-medium text-[var(--foreground)]">
                      {selectedEvent.name}
                    </p>
                  </div>
                  {selectedEvent.location && (
                    <div>
                      <p className="text-sm text-[var(--foreground-muted)]">
                        Location
                      </p>
                      <p className="font-medium text-[var(--foreground)]">
                        {selectedEvent.location}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      Dates
                    </p>
                    <p className="font-medium text-[var(--foreground)]">
                      {selectedEvent.start_date} — {selectedEvent.end_date}
                    </p>
                  </div>
                  {selectedEvent.description && (
                    <div>
                      <p className="text-sm text-[var(--foreground-muted)]">
                        Description
                      </p>
                      <p className="text-sm text-[var(--foreground)]">
                        {selectedEvent.description}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-[var(--foreground-muted)]">
                  Select an event to see details.
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
