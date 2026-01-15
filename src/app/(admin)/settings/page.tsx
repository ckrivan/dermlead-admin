'use client'

import { Header } from '@/components/layout/Header'
import { Card, CardBody } from '@/components/ui'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <>
      <Header title="Settings" subtitle="Configure your admin preferences" />

      <div className="p-6 space-y-6">
        <Card>
          <CardBody className="text-center py-12">
            <Settings
              size={48}
              className="mx-auto text-[var(--foreground-subtle)] mb-4"
            />
            <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
              Settings Coming Soon
            </h3>
            <p className="text-[var(--foreground-muted)]">
              Configure organization settings, user permissions, and more.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  )
}
