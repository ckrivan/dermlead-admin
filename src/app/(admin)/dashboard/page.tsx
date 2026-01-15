'use client'

import { Header } from '@/components/layout/Header'
import { Card, CardBody } from '@/components/ui'
import { Calendar, Users, Presentation, BarChart3 } from 'lucide-react'

const stats = [
  {
    name: 'Total Events',
    value: '3',
    icon: Calendar,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
  },
  {
    name: 'Total Speakers',
    value: '24',
    icon: Users,
    color: 'text-green-400',
    bgColor: 'bg-green-400/10',
  },
  {
    name: 'Total Sessions',
    value: '48',
    icon: Presentation,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
  },
  {
    name: 'Total Attendees',
    value: '156',
    icon: BarChart3,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/10',
  },
]

export default function DashboardPage() {
  return (
    <>
      <Header title="Dashboard" subtitle="Welcome to Converge Admin" />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.name}>
              <CardBody className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-lg ${stat.bgColor}`}
                >
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
                Recent Activity
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-400" />
                  <div>
                    <p className="text-sm text-[var(--foreground)]">
                      New speaker added: Dr. Sarah Johnson
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      2 hours ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-400" />
                  <div>
                    <p className="text-sm text-[var(--foreground)]">
                      Session &quot;Advanced Techniques&quot; updated
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      5 hours ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-purple-400" />
                  <div>
                    <p className="text-sm text-[var(--foreground)]">
                      Event &quot;Derm Conference 2026&quot; created
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      1 day ago
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  )
}
