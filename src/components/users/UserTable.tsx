'use client'

import { useState } from 'react'
import { MoreHorizontal, Shield, User, UserX, UserCheck, Pencil } from 'lucide-react'
import { UserWithEmail, deactivateUser, reactivateUser } from '@/lib/api/users'
import { Badge } from '@/components/ui'

interface UserTableProps {
  users: UserWithEmail[]
  currentUserId?: string
  onEditUser: (user: UserWithEmail) => void
  onRefresh: () => void
}

export function UserTable({ users, currentUserId, onEditUser, onRefresh }: UserTableProps) {
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const handleDeactivate = async (userId: string) => {
    setLoading(userId)
    try {
      await deactivateUser(userId)
      onRefresh()
    } catch (error) {
      console.error('Failed to deactivate user:', error)
    } finally {
      setLoading(null)
      setActionMenuId(null)
    }
  }

  const handleReactivate = async (userId: string) => {
    setLoading(userId)
    try {
      await reactivateUser(userId)
      onRefresh()
    } catch (error) {
      console.error('Failed to reactivate user:', error)
    } finally {
      setLoading(null)
      setActionMenuId(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--card-border)]">
            <th className="text-left py-3 px-4 text-sm font-medium text-[var(--foreground-muted)]">
              User
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[var(--foreground-muted)]">
              Role
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[var(--foreground-muted)]">
              Status
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-[var(--foreground-muted)]">
              Last Login
            </th>
            <th className="text-right py-3 px-4 text-sm font-medium text-[var(--foreground-muted)]">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-[var(--card-border)] hover:bg-[var(--background-secondary)] transition-colors"
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || ''}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center">
                      <User size={20} className="text-[var(--accent-primary)]" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      {user.full_name || 'Unnamed User'}
                      {user.id === currentUserId && (
                        <span className="ml-2 text-xs text-[var(--foreground-muted)]">(you)</span>
                      )}
                    </p>
                    <p className="text-sm text-[var(--foreground-muted)]">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 px-4">
                <Badge
                  variant={user.role === 'admin' ? 'primary' : 'secondary'}
                  className="inline-flex items-center gap-1"
                >
                  {user.role === 'admin' ? <Shield size={12} /> : <User size={12} />}
                  {user.role}
                </Badge>
              </td>
              <td className="py-3 px-4">
                {user.is_active ? (
                  <Badge variant="success">Active</Badge>
                ) : user.invited_at && !user.last_login_at ? (
                  <Badge variant="warning">Pending</Badge>
                ) : (
                  <Badge variant="danger">Inactive</Badge>
                )}
              </td>
              <td className="py-3 px-4 text-sm text-[var(--foreground-muted)]">
                {formatDate(user.last_login_at)}
              </td>
              <td className="py-3 px-4 text-right">
                <div className="relative inline-block">
                  <button
                    onClick={() => setActionMenuId(actionMenuId === user.id ? null : user.id)}
                    disabled={loading === user.id || user.id === currentUserId}
                    className="p-2 rounded-lg hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <MoreHorizontal size={18} />
                  </button>

                  {actionMenuId === user.id && (
                    <div className="absolute right-0 mt-1 w-48 rounded-lg bg-[var(--card-bg)] border border-[var(--card-border)] shadow-lg py-1 z-50">
                      <button
                        onClick={() => {
                          onEditUser(user)
                          setActionMenuId(null)
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--background-tertiary)] transition-colors"
                      >
                        <Pencil size={16} />
                        Edit User
                      </button>
                      {user.is_active ? (
                        <button
                          onClick={() => handleDeactivate(user.id)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10 transition-colors"
                        >
                          <UserX size={16} />
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivate(user.id)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--accent-success)] hover:bg-[var(--accent-success)]/10 transition-colors"
                        >
                          <UserCheck size={16} />
                          Reactivate
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <div className="text-center py-12 text-[var(--foreground-muted)]">
          No users found
        </div>
      )}
    </div>
  )
}
