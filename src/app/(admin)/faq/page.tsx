'use client'

import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Card, CardBody, Button } from '@/components/ui'
import { getFaqs, createFaq, updateFaq, deleteFaq } from '@/lib/api/faq'
import { useEvent } from '@/contexts/EventContext'
import type { Faq } from '@/types/database'
import { HelpCircle, Plus, Edit, Trash2, ChevronUp, ChevronDown, Save, X } from 'lucide-react'

export default function FaqPage() {
  const { selectedEvent } = useEvent()
  const selectedEventId = selectedEvent?.id ?? ''

  const [faqs, setFaqs] = useState<Faq[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQuestion, setEditQuestion] = useState('')
  const [editAnswer, setEditAnswer] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [newAnswer, setNewAnswer] = useState('')

  async function loadData() {
    if (!selectedEventId) {
      setFaqs([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const data = await getFaqs(selectedEventId)
      setFaqs(data)
    } catch (error) {
      console.error('Error loading FAQs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false // eslint-disable-line prefer-const
    async function fetchData() {
      if (!selectedEventId) {
        setFaqs([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const data = await getFaqs(selectedEventId)
        if (cancelled) return
        setFaqs(data)
      } catch (error) {
        if (cancelled) return
        console.error('Error loading FAQs:', error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [selectedEventId])

  const handleAdd = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return
    try {
      await createFaq(selectedEventId, newQuestion.trim(), newAnswer.trim(), faqs.length)
      setNewQuestion('')
      setNewAnswer('')
      setShowAdd(false)
      await loadData()
    } catch (error) {
      console.error('Error creating FAQ:', error)
    }
  }

  const handleEdit = (faq: Faq) => {
    setEditingId(faq.id)
    setEditQuestion(faq.question)
    setEditAnswer(faq.answer)
  }

  const handleSave = async () => {
    if (!editingId) return
    try {
      await updateFaq(editingId, { question: editQuestion.trim(), answer: editAnswer.trim() })
      setEditingId(null)
      await loadData()
    } catch (error) {
      console.error('Error updating FAQ:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return
    try {
      await deleteFaq(id)
      await loadData()
    } catch (error) {
      console.error('Error deleting FAQ:', error)
    }
  }

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= faqs.length) return
    try {
      await Promise.all([
        updateFaq(faqs[index].id, { sort_order: swapIndex }),
        updateFaq(faqs[swapIndex].id, { sort_order: index }),
      ])
      await loadData()
    } catch (error) {
      console.error('Error reordering:', error)
    }
  }

  return (
    <>
      <Header title="FAQ" subtitle="Manage frequently asked questions" />

      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          {selectedEvent && (
            <p className="text-sm text-[var(--foreground-muted)]">{selectedEvent.name}</p>
          )}
          <Button
            icon={<Plus size={18} />}
            onClick={() => setShowAdd(true)}
            disabled={!selectedEventId}
          >
            Add FAQ
          </Button>
        </div>

        {/* Add form */}
        {showAdd && (
          <Card>
            <CardBody>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Question"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus)]"
                />
                <textarea
                  placeholder="Answer"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus)]"
                />
                <div className="flex gap-2">
                  <Button onClick={handleAdd} icon={<Save size={16} />}>Save</Button>
                  <Button variant="ghost" onClick={() => { setShowAdd(false); setNewQuestion(''); setNewAnswer('') }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-primary)]" />
          </div>
        ) : !selectedEventId ? (
          <Card>
            <CardBody className="text-center py-12">
              <HelpCircle size={48} className="mx-auto text-[var(--foreground-subtle)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No event selected</h3>
              <p className="text-[var(--foreground-muted)]">Select an event to manage FAQs.</p>
            </CardBody>
          </Card>
        ) : faqs.length === 0 && !showAdd ? (
          <Card>
            <CardBody className="text-center py-12">
              <HelpCircle size={48} className="mx-auto text-[var(--foreground-subtle)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No FAQs yet</h3>
              <p className="text-[var(--foreground-muted)] mb-4">Add FAQ items for attendees to see in the app.</p>
              <Button icon={<Plus size={18} />} onClick={() => setShowAdd(true)}>Add First FAQ</Button>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <Card key={faq.id}>
                <CardBody>
                  {editingId === faq.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editQuestion}
                        onChange={(e) => setEditQuestion(e.target.value)}
                        className="w-full px-3 py-2 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus)]"
                      />
                      <textarea
                        value={editAnswer}
                        onChange={(e) => setEditAnswer(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-[var(--input-border)] rounded-lg bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus)]"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSave} icon={<Save size={14} />}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} icon={<X size={14} />}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[var(--foreground)]">{faq.question}</p>
                        <p className="text-sm text-[var(--foreground-muted)] mt-1 whitespace-pre-line">{faq.answer}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="sm" icon={<ChevronUp size={16} />} onClick={() => handleMove(index, 'up')} disabled={index === 0} />
                        <Button variant="ghost" size="sm" icon={<ChevronDown size={16} />} onClick={() => handleMove(index, 'down')} disabled={index === faqs.length - 1} />
                        <Button variant="ghost" size="sm" icon={<Edit size={16} />} onClick={() => handleEdit(faq)} />
                        <Button variant="ghost" size="sm" icon={<Trash2 size={16} />} className="text-[var(--accent-danger)]" onClick={() => handleDelete(faq.id)} />
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
