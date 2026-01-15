'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Check } from 'lucide-react'
import type { EventGroup, EntityType } from '@/types/database'
import { getEntityGroups, setEntityGroups } from '@/lib/api/groups'

interface GroupAssignmentProps {
  entityType: EntityType
  entityId: string
  eventId: string
  availableGroups: EventGroup[]
  onGroupsChange?: (groups: EventGroup[]) => void
  compact?: boolean // For table view - shows only badges, click to edit
}

export function GroupAssignment({
  entityType,
  entityId,
  eventId,
  availableGroups,
  onGroupsChange,
  compact = true,
}: GroupAssignmentProps) {
  const [assignedGroups, setAssignedGroups] = useState<EventGroup[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Fetch assigned groups on mount
  useEffect(() => {
    async function fetchGroups() {
      try {
        const groups = await getEntityGroups(entityType, entityId)
        setAssignedGroups(groups)
      } catch (error) {
        console.error('Error fetching entity groups:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchGroups()
  }, [entityType, entityId])

  const toggleGroup = async (group: EventGroup) => {
    const isAssigned = assignedGroups.some((g) => g.id === group.id)
    const newGroups = isAssigned
      ? assignedGroups.filter((g) => g.id !== group.id)
      : [...assignedGroups, group]

    setAssignedGroups(newGroups)

    // Save immediately
    setSaving(true)
    try {
      await setEntityGroups(
        entityType,
        entityId,
        newGroups.map((g) => g.id)
      )
      onGroupsChange?.(newGroups)
    } catch (error) {
      console.error('Error saving groups:', error)
      // Revert on error
      setAssignedGroups(assignedGroups)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <span className="text-[var(--foreground-muted)] text-sm">...</span>
  }

  // Compact view: badges only
  if (compact && !isOpen) {
    return (
      <div className="flex flex-wrap gap-1 items-center">
        {assignedGroups.length === 0 ? (
          <button
            onClick={() => setIsOpen(true)}
            className="text-[var(--foreground-muted)] text-xs hover:text-[var(--foreground)] flex items-center gap-1"
          >
            <Plus size={12} />
            Add group
          </button>
        ) : (
          <>
            {assignedGroups.map((group) => (
              <span
                key={group.id}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white cursor-pointer hover:opacity-80"
                style={{ backgroundColor: group.color || '#3b82f6' }}
                onClick={() => setIsOpen(true)}
              >
                {group.name}
              </span>
            ))}
            <button
              onClick={() => setIsOpen(true)}
              className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] p-0.5"
            >
              <Plus size={14} />
            </button>
          </>
        )}
      </div>
    )
  }

  // Expanded view: dropdown with checkboxes
  return (
    <div className="relative">
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Trigger */}
      <div className="flex flex-wrap gap-1 items-center">
        {assignedGroups.length === 0 ? (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-[var(--foreground-muted)] text-xs hover:text-[var(--foreground)] flex items-center gap-1"
          >
            <Plus size={12} />
            Add group
          </button>
        ) : (
          <>
            {assignedGroups.map((group) => (
              <span
                key={group.id}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: group.color || '#3b82f6' }}
              >
                {group.name}
                <button
                  onClick={() => toggleGroup(group)}
                  className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                  disabled={saving}
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] p-0.5"
            >
              <Plus size={14} />
            </button>
          </>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-56 bg-[var(--background-secondary)] border border-[var(--border-default)] rounded-lg shadow-lg py-1">
          <div className="px-3 py-2 border-b border-[var(--border-default)]">
            <span className="text-xs font-medium text-[var(--foreground-muted)]">
              Assign to groups
            </span>
          </div>
          {availableGroups.length === 0 ? (
            <div className="px-3 py-4 text-center text-[var(--foreground-muted)] text-sm">
              No groups available
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {availableGroups.map((group) => {
                const isAssigned = assignedGroups.some((g) => g.id === group.id)
                return (
                  <button
                    key={group.id}
                    onClick={() => toggleGroup(group)}
                    disabled={saving}
                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-[var(--background-tertiary)] disabled:opacity-50"
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isAssigned
                          ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]'
                          : 'border-[var(--border-default)]'
                      }`}
                    >
                      {isAssigned && <Check size={12} className="text-white" />}
                    </div>
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: group.color || '#3b82f6' }}
                    />
                    <span className="text-sm text-[var(--foreground)]">{group.name}</span>
                  </button>
                )
              })}
            </div>
          )}
          <div className="px-3 py-2 border-t border-[var(--border-default)]">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-center text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Simple badge display component (read-only)
export function GroupBadges({ groups }: { groups: EventGroup[] }) {
  if (groups.length === 0) {
    return <span className="text-[var(--foreground-muted)] text-xs">None</span>
  }

  return (
    <div className="flex flex-wrap gap-1">
      {groups.map((group) => (
        <span
          key={group.id}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: group.color || '#3b82f6' }}
        >
          {group.name}
        </span>
      ))}
    </div>
  )
}
