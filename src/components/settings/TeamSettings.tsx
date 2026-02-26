'use client'

import { useState, useEffect } from 'react'
import { Card, CardBody, Button } from '@/components/ui'
import { UserPlus, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { UserTable, InviteUserModal, EditUserModal } from '@/components/users'
import { getOrganizationUsers, UserWithEmail } from '@/lib/api/users'

export function TeamSettings() {
  const { user, organization } = useAuth()
  const [users, setUsers] = useState<UserWithEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithEmail | null>(null)

  const loadUsers = async () => {
    if (!organization?.id) return

    setLoading(true)
    try {
      const data = await getOrganizationUsers(organization.id)
      setUsers(data)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [organization?.id])

  if (loading) {
    return (
      <Card>
        <CardBody className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-[var(--background-tertiary)] rounded w-1/4"></div>
            <div className="h-20 bg-[var(--background-tertiary)] rounded"></div>
            <div className="h-20 bg-[var(--background-tertiary)] rounded"></div>
          </div>
        </CardBody>
      </Card>
    )
  }

  if (!organization) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <Users size={48} className="mx-auto text-[var(--foreground-subtle)] mb-4" />
          <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
            No Organization Found
          </h3>
          <p className="text-[var(--foreground-muted)]">
            You must be part of an organization to manage team members.
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                Team Members
              </h3>
              <p className="text-sm text-[var(--foreground-muted)]">
                Manage your organization's team members and their roles
              </p>
            </div>
            <Button onClick={() => setInviteModalOpen(true)}>
              <UserPlus size={18} className="mr-2" />
              Invite User
            </Button>
          </div>

          <UserTable
            users={users}
            currentUserId={user?.id}
            onEditUser={(u) => setEditingUser(u)}
            onRefresh={loadUsers}
          />
        </CardBody>
      </Card>

      <InviteUserModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        organizationId={organization.id}
        onSuccess={loadUsers}
      />

      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onSuccess={loadUsers}
      />
    </div>
  )
}
