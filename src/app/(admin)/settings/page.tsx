'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Building2, Users, User, Key } from 'lucide-react'
import { OrganizationSettings, TeamSettings, ProfileSettings } from '@/components/settings'
import { LeadAccessSettings } from '@/components/settings/LeadAccessSettings'

type Tab = 'organization' | 'team' | 'profile' | 'lead-access'

const tabs = [
  { id: 'organization' as Tab, label: 'Organization', icon: Building2 },
  { id: 'team' as Tab, label: 'Team', icon: Users },
  { id: 'profile' as Tab, label: 'Profile', icon: User },
  { id: 'lead-access' as Tab, label: 'Lead Access', icon: Key },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('organization')

  return (
    <>
      <Header title="Settings" subtitle="Configure your admin preferences" />

      <div className="p-4 md:p-6">
        {/* Tabs */}
        <div className="flex gap-1 p-1 mb-6 bg-[var(--background-secondary)] rounded-lg w-fit overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'organization' && <OrganizationSettings />}
        {activeTab === 'team' && <TeamSettings />}
        {activeTab === 'profile' && <ProfileSettings />}
        {activeTab === 'lead-access' && <LeadAccessSettings />}
      </div>
    </>
  )
}
