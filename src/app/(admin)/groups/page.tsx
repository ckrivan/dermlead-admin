'use client'

import { useEffect, useState, useRef } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, Button } from '@/components/ui'
import { getGroups, createGroup, updateGroup, deleteGroup, initializeDefaultGroups, bulkCreateGroups } from '@/lib/api/groups'
import { getEvents } from '@/lib/api/events'
import { parseCSV, generateGroupTemplate, downloadCSV, GroupCSVRow } from '@/lib/utils/csv'
import type { EventGroup, Event } from '@/types/database'
import { Plus, Users, Edit, Trash2, X, Palette, Upload, Download } from 'lucide-react'

export default function GroupsPage() {
  const [groups, setGroups] = useState<EventGroup[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editingGroup, setEditingGroup] = useState<EventGroup | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
  })

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await getEvents()
        setEvents(data)
        if (data.length > 0) {
          setSelectedEventId(data[0].id)
        }
      } catch (error) {
        console.error('Error loading events:', error)
      }
    }
    loadEvents()
  }, [])

  useEffect(() => {
    async function loadGroups() {
      if (!selectedEventId) {
        setGroups([])
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const data = await getGroups(selectedEventId)
        setGroups(data)
      } catch (error) {
        console.error('Error loading groups:', error)
      } finally {
        setLoading(false)
      }
    }
    loadGroups()
  }, [selectedEventId])

  const handleOpenModal = (group?: EventGroup) => {
    if (group) {
      setEditingGroup(group)
      setFormData({
        name: group.name,
        description: group.description || '',
        color: group.color || '#3b82f6',
      })
    } else {
      setEditingGroup(null)
      setFormData({ name: '', description: '', color: '#3b82f6' })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingGroup(null)
    setFormData({ name: '', description: '', color: '#3b82f6' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEventId || !formData.name.trim()) return

    try {
      if (editingGroup) {
        await updateGroup(editingGroup.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          color: formData.color,
        })
      } else {
        await createGroup({
          event_id: selectedEventId,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          color: formData.color,
        })
      }

      const data = await getGroups(selectedEventId)
      setGroups(data)
      handleCloseModal()
    } catch (error) {
      console.error('Error saving group:', error)
    }
  }

  const handleDelete = async (group: EventGroup) => {
    if (!confirm(`Delete group "${group.name}"? Members will be removed from this group.`)) return

    try {
      await deleteGroup(group.id)
      const data = await getGroups(selectedEventId)
      setGroups(data)
    } catch (error) {
      console.error('Error deleting group:', error)
    }
  }

  const handleInitializeDefaults = async () => {
    if (!selectedEventId) return
    if (!confirm('Create default groups (Admin, Attendee, Sponsor, Speaker, VIP)?')) return

    try {
      await initializeDefaultGroups(selectedEventId)
      const data = await getGroups(selectedEventId)
      setGroups(data)
    } catch (error) {
      console.error('Error initializing default groups:', error)
    }
  }

  const handleDownloadTemplate = () => {
    const template = generateGroupTemplate()
    downloadCSV(template, 'groups_template.csv')
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedEventId) return

    setImporting(true)
    setImportResult(null)

    try {
      const text = await file.text()
      const rows = parseCSV<GroupCSVRow>(text)

      if (rows.length === 0) {
        setImportResult({ created: 0, errors: ['No valid rows found in CSV'] })
        return
      }

      const result = await bulkCreateGroups(selectedEventId, rows)
      setImportResult(result)

      if (result.created > 0) {
        const data = await getGroups(selectedEventId)
        setGroups(data)
      }
    } catch (error) {
      console.error('Error importing CSV:', error)
      setImportResult({ created: 0, errors: ['Failed to parse CSV file'] })
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const colorOptions = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  ]

  return (
    <>
      <Header title="Groups" subtitle="Organize attendees into groups for targeted communications" />

      <div className="p-6 space-y-6">
        {/* Event Selector & Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <label className="text-sm text-[var(--foreground-muted)]">Event:</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
            >
              <option value="">Select an event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {groups.length === 0 && selectedEventId && (
              <Button
                variant="secondary"
                onClick={handleInitializeDefaults}
              >
                Create Default Groups
              </Button>
            )}
            <Button
              variant="secondary"
              icon={<Upload size={18} />}
              onClick={() => setShowImportModal(true)}
              disabled={!selectedEventId}
            >
              Import CSV
            </Button>
            <Button
              icon={<Plus size={18} />}
              onClick={() => handleOpenModal()}
              disabled={!selectedEventId}
            >
              Add Group
            </Button>
          </div>
        </div>

        {/* Groups Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]" />
          </div>
        ) : groups.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <Users size={48} className="mx-auto text-[var(--foreground-subtle)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
                No groups yet
              </h3>
              <p className="text-[var(--foreground-muted)] mb-4">
                {selectedEventId
                  ? 'Create groups to organize attendees and send targeted announcements.'
                  : 'Select an event to manage its groups.'}
              </p>
              {selectedEventId && (
                <div className="flex items-center justify-center gap-3">
                  <Button variant="secondary" onClick={handleInitializeDefaults}>
                    Create Default Groups
                  </Button>
                  <Button icon={<Plus size={18} />} onClick={() => handleOpenModal()}>
                    Add Custom Group
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <Card key={group.id} hover>
                <CardBody>
                  <div className="flex items-start gap-4">
                    {/* Color indicator */}
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: group.color || '#3b82f6' }}
                    >
                      <Users size={24} className="text-white" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--foreground)]">
                        {group.name}
                      </h3>
                      {group.description && (
                        <p className="text-sm text-[var(--foreground-muted)] mt-1 line-clamp-2">
                          {group.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--card-border)]">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit size={16} />}
                      className="flex-1"
                      onClick={() => handleOpenModal(group)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 size={16} />}
                      className="text-[var(--accent-danger)]"
                      onClick={() => handleDelete(group)}
                    >
                      Delete
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Group Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
              <h3 className="font-semibold text-[var(--foreground)]">
                {editingGroup ? 'Edit Group' : 'Add Group'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)]"
                    placeholder="e.g., VIP, Press, Staff"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--foreground)] focus:outline-none focus:border-[var(--input-focus)] resize-none"
                    rows={2}
                    placeholder="Optional description for this group"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    <Palette size={14} className="inline mr-1" />
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-lg transition-transform ${
                          formData.color === color ? 'ring-2 ring-offset-2 ring-[var(--accent-primary)] scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 p-4 border-t border-[var(--card-border)]">
                <Button type="button" variant="ghost" onClick={handleCloseModal}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingGroup ? 'Save Changes' : 'Create Group'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-[var(--card-border)]">
              <h3 className="font-semibold text-[var(--foreground)]">Import Groups from CSV</h3>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  setImportResult(null)
                }}
                className="p-1 rounded hover:bg-[var(--background-tertiary)] text-[var(--foreground-muted)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="text-sm text-[var(--foreground-muted)] mb-3">
                  Upload a CSV file with group information. Download the template to see the required format.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Download size={16} />}
                  onClick={handleDownloadTemplate}
                >
                  Download Template
                </Button>
              </div>

              <div className="border-2 border-dashed border-[var(--input-border)] rounded-lg p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload-groups"
                />
                <label
                  htmlFor="csv-upload-groups"
                  className="cursor-pointer"
                >
                  {importing ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)] mb-2" />
                      <span className="text-sm text-[var(--foreground-muted)]">Importing...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload size={32} className="text-[var(--foreground-subtle)] mb-2" />
                      <span className="text-sm text-[var(--foreground)]">Click to select CSV file</span>
                      <span className="text-xs text-[var(--foreground-muted)] mt-1">or drag and drop</span>
                    </div>
                  )}
                </label>
              </div>

              {importResult && (
                <div className={`p-3 rounded-lg ${importResult.errors.length > 0 ? 'bg-yellow-500/10' : 'bg-green-500/10'}`}>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {importResult.created} group{importResult.created !== 1 ? 's' : ''} imported successfully
                  </p>
                  {importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-[var(--foreground-muted)] mb-1">Warnings:</p>
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
                  setShowImportModal(false)
                  setImportResult(null)
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
