import { useEffect, useState } from 'react'
import apiClient from '../../api/client'
import Sidebar from '../../components/Sidebar'
import {
  ClipboardList,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Check,
  X,
} from 'lucide-react'

interface Assignment {
  id: number
  title: string
  due_date: string
}

interface GroupStatus {
  group_id: number
  group_name: string
  status: string | null
  confirmed_at: string | null
  confirmed_by_name: string | null
  file_url: string | null
  review_status: 'pending' | 'accepted' | 'rejected' | null
  review_feedback: string | null
  reviewed_at: string | null
  reviewed_by_name: string | null
  members: Array<{ id: number; name: string; email: string }> | null
}

type StatusFilter = 'all' | 'pending' | 'pending_confirmation' | 'confirmed' | 'accepted' | 'rejected'

function StatusChip({ status, review_status }: { status: string | null; review_status?: string | null }) {
  const s = status ?? 'pending'
  if (s === 'confirmed') {
    if (review_status === 'accepted') {
      return (
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.2rem 0.6rem', borderRadius: '9999px',
            fontSize: '0.72rem', fontWeight: 700,
            backgroundColor: '#dcfce7', color: '#15803d',
            border: '1px solid #bbf7d0',
          }}
        >
          <CheckCircle2 size={11} /> Done / Accepted ✓
        </span>
      )
    }
    if (review_status === 'rejected') {
      return (
        <span
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.2rem 0.6rem', borderRadius: '9999px',
            fontSize: '0.72rem', fontWeight: 700,
            backgroundColor: '#fee2e2', color: '#b91c1c',
            border: '1px solid #fecaca',
          }}
        >
          <X size={11} /> Rejected ✕
        </span>
      )
    }
    return (
      <span
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          padding: '0.2rem 0.6rem', borderRadius: '9999px',
          fontSize: '0.72rem', fontWeight: 600,
          backgroundColor: '#fef3c7', color: '#b45309',
        }}
      >
        <Clock size={11} /> Submitted (Pending Review)
      </span>
    )
  }

  const meta: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pending: { label: 'Not Started', color: 'var(--color-on-surface-variant)', bg: 'var(--color-surface-container-high)', icon: <Clock size={11} /> },
    pending_confirmation: { label: 'Step 1 Done', color: '#d97706', bg: '#fef3c7', icon: <AlertTriangle size={11} /> },
  }
  const m = meta[s] ?? meta['pending']
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
        padding: '0.2rem 0.6rem', borderRadius: '9999px',
        fontSize: '0.72rem', fontWeight: 600,
        backgroundColor: m.bg, color: m.color,
      }}
    >
      {m.icon} {m.label}
    </span>
  )
}

export default function SubmissionTracker() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [groupStatuses, setGroupStatuses] = useState<GroupStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [trackerLoading, setTrackerLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  // Reject Modal state
  const [rejectModalGroup, setRejectModalGroup] = useState<GroupStatus | null>(null)
  const [rejectFeedback, setRejectFeedback] = useState('')

  useEffect(() => {
    apiClient
      .get<{ assignments: Assignment[] }>('/assignments')
      .then((res) => {
        setAssignments(res.data.assignments)
        if (res.data.assignments.length > 0) {
          setSelectedId(res.data.assignments[0].id)
        }
      })
      .catch(() => setError('Failed to load assignments.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedId) return
    setTrackerLoading(true)
    apiClient
      .get<{ assignment_id: number; groups: GroupStatus[] }>(`/submissions/assignment/${selectedId}`)
      .then((res) => setGroupStatuses(res.data.groups))
      .catch(() => setError('Failed to load submission data.'))
      .finally(() => setTrackerLoading(false))
  }, [selectedId])

  const handleReview = async (groupId: number, reviewStatus: 'accepted' | 'rejected', feedback?: string) => {
    if (!selectedId) return
    setActionLoading(groupId)
    try {
      await apiClient.patch(`/submissions/${selectedId}/groups/${groupId}/review`, {
        review_status: reviewStatus,
        review_feedback: feedback || undefined,
      })

      // Update state locally
      setGroupStatuses((prev) =>
        prev.map((g) =>
          g.group_id === groupId
            ? {
                ...g,
                review_status: reviewStatus,
                review_feedback: feedback || null,
                reviewed_at: new Date().toISOString(),
              }
            : g
        )
      )
      setRejectModalGroup(null)
      setRejectFeedback('')
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update review status')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = groupStatuses.filter((g) => {
    if (filter === 'all') return true
    if (filter === 'accepted') return g.status === 'confirmed' && g.review_status === 'accepted'
    if (filter === 'rejected') return g.status === 'confirmed' && g.review_status === 'rejected'
    const s = g.status ?? 'pending'
    return s === filter
  })

  const selectedAssignment = assignments.find((a) => a.id === selectedId)

  const counts = {
    confirmed: groupStatuses.filter((g) => g.status === 'confirmed').length,
    accepted: groupStatuses.filter((g) => g.status === 'confirmed' && g.review_status === 'accepted').length,
    rejected: groupStatuses.filter((g) => g.status === 'confirmed' && g.review_status === 'rejected').length,
    pending_confirmation: groupStatuses.filter((g) => g.status === 'pending_confirmation').length,
    pending: groupStatuses.filter((g) => !g.status || g.status === 'pending').length,
  }

  return (
    <Sidebar>
      <div style={{ padding: '2rem 1.75rem', maxWidth: '1150px' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-on-surface)', letterSpacing: '-0.01em' }}>
            Submission Tracker & Grading
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-on-surface-variant)' }}>
            Review student uploads, approve submissions (mark as Done), or request revisions
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
            <Loader2 size={32} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : error ? (
          <div style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: 'var(--color-error-container)', color: 'var(--color-error)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <AlertCircle size={18} /> {error}
          </div>
        ) : (
          <>
            {/* Assignment selector */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-on-surface)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select Assignment
              </label>
              <select
                id="select-assignment"
                value={selectedId ?? ''}
                onChange={(e) => setSelectedId(Number(e.target.value))}
                style={{
                  padding: '0.625rem 0.875rem', borderRadius: '0.5rem',
                  border: '1.5px solid var(--color-outline-variant)',
                  fontSize: '0.875rem', color: 'var(--color-on-surface)',
                  backgroundColor: 'var(--color-surface-container-lowest)',
                  minWidth: '320px', cursor: 'pointer', outline: 'none',
                }}
              >
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>

            {/* Summary stats */}
            {groupStatuses.length > 0 && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                {[
                  { label: 'Approved (Done)', count: counts.accepted, color: '#15803d', bg: '#dcfce7' },
                  { label: 'Total Submitted', count: counts.confirmed, color: '#16a34a', bg: '#f0fdf4' },
                  { label: 'Rejected', count: counts.rejected, color: '#b91c1c', bg: '#fee2e2' },
                  { label: 'Step 1 In-Progress', count: counts.pending_confirmation, color: '#d97706', bg: '#fef3c7' },
                  { label: 'Not Started', count: counts.pending, color: 'var(--color-on-surface-variant)', bg: 'var(--color-surface-container)' },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      padding: '0.625rem 1rem', borderRadius: '0.625rem',
                      backgroundColor: s.bg, display: 'flex', alignItems: 'center', gap: '0.5rem',
                    }}
                  >
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, color: s.color }}>{s.count}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 500, color: s.color }}>{s.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Filter */}
            {selectedAssignment && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.375rem', padding: '0.25rem', backgroundColor: 'var(--color-surface-container)', borderRadius: '0.625rem', width: 'fit-content' }}>
                  {(['all', 'confirmed', 'accepted', 'rejected', 'pending_confirmation', 'pending'] as const).map((f) => (
                    <button
                      key={f}
                      id={`filter-status-${f}`}
                      onClick={() => setFilter(f)}
                      style={{
                        padding: '0.35rem 0.875rem', borderRadius: '0.5rem', border: 'none',
                        fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                        backgroundColor: filter === f ? 'var(--color-surface-container-lowest)' : 'transparent',
                        color: filter === f ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                        boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      {f === 'all'
                        ? 'All'
                        : f === 'confirmed'
                        ? 'Submitted'
                        : f === 'accepted'
                        ? 'Approved'
                        : f === 'rejected'
                        ? 'Rejected'
                        : f === 'pending_confirmation'
                        ? 'Step 1'
                        : 'Not Started'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Table */}
            {trackerLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '2rem' }}>
                <Loader2 size={24} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--color-surface-container-lowest)', borderRadius: '0.75rem', border: '1px solid var(--color-outline-variant)' }}>
                <ClipboardList size={32} color="var(--color-on-surface-variant)" style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                <p style={{ color: 'var(--color-on-surface-variant)', margin: 0, fontSize: '0.875rem' }}>
                  {!selectedId ? 'Select an assignment to view submissions.' : 'No groups match this filter.'}
                </p>
              </div>
            ) : (
              <div style={{ backgroundColor: 'var(--color-surface-container-lowest)', borderRadius: '0.75rem', border: '1px solid var(--color-outline-variant)', overflow: 'hidden' }}>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 100px 170px 120px 190px', gap: '1rem', padding: '0.75rem 1.25rem', backgroundColor: 'var(--color-surface-container)', borderBottom: '1px solid var(--color-outline-variant)' }}>
                  {['Group', 'Members', 'Status / Review', 'Attached File', 'Professor Actions'].map((h) => (
                    <span key={h} style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-on-surface-variant)' }}>
                      {h}
                    </span>
                  ))}
                </div>

                {filtered.map((g, i) => (
                  <div
                    key={g.group_id}
                    style={{
                      display: 'grid', gridTemplateColumns: '1.2fr 100px 170px 120px 190px', gap: '1rem',
                      padding: '1rem 1.25rem',
                      borderBottom: i < filtered.length - 1 ? '1px solid var(--color-outline-variant)' : 'none',
                      alignItems: 'center',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-container)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <div>
                      <p style={{ margin: '0 0 0.25rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-on-surface)' }}>{g.group_name}</p>
                      {g.members && g.members.length > 0 && (
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>
                          {g.members.slice(0, 2).map((m) => m.name).join(', ')}{g.members.length > 2 ? ` +${g.members.length - 2}` : ''}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--color-on-surface-variant)' }}>
                      <Users size={13} /> {g.members?.length ?? '—'}
                    </div>
                    <div>
                      <StatusChip status={g.status} review_status={g.review_status} />
                      {g.review_feedback && (
                        <p style={{ margin: '0.35rem 0 0', fontSize: '0.72rem', color: '#b91c1c', fontStyle: 'italic' }}>
                          💬 "{g.review_feedback}"
                        </p>
                      )}
                    </div>
                    <div>
                      {g.file_url ? (
                        <a
                          href={g.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '0.375rem',
                            backgroundColor: 'var(--color-primary-fixed)',
                            color: 'var(--color-primary)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          📄 View PDF
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>—</span>
                      )}
                    </div>

                    {/* Professor Actions */}
                    <div>
                      {g.status === 'confirmed' ? (
                        <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                          {/* Approve Button */}
                          <button
                            onClick={() => handleReview(g.group_id, 'accepted')}
                            disabled={actionLoading === g.group_id}
                            title="Mark as Done / Approved"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.35rem 0.6rem',
                              borderRadius: '0.375rem',
                              border: 'none',
                              backgroundColor: g.review_status === 'accepted' ? '#16a34a' : '#dcfce7',
                              color: g.review_status === 'accepted' ? 'white' : '#15803d',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            <Check size={12} />
                            {g.review_status === 'accepted' ? 'Approved' : 'Approve'}
                          </button>

                          {/* Reject Button */}
                          <button
                            onClick={() => {
                              setRejectModalGroup(g)
                              setRejectFeedback(g.review_feedback || '')
                            }}
                            disabled={actionLoading === g.group_id}
                            title="Reject Submission"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.35rem 0.6rem',
                              borderRadius: '0.375rem',
                              border: 'none',
                              backgroundColor: g.review_status === 'rejected' ? '#dc2626' : '#fee2e2',
                              color: g.review_status === 'rejected' ? 'white' : '#b91c1c',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            <X size={12} />
                            {g.review_status === 'rejected' ? 'Rejected' : 'Reject'}
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>
                          Awaiting submission
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Reject Feedback Modal */}
      {rejectModalGroup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 100,
          }}
          onClick={() => setRejectModalGroup(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface-container-lowest)',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '440px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#b91c1c' }}>
              <AlertTriangle size={20} />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                Reject Submission — {rejectModalGroup.group_name}
              </h3>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--color-on-surface-variant)', marginBottom: '1rem' }}>
              Provide constructive feedback for the students so they know what changes are required before resubmitting:
            </p>

            <textarea
              value={rejectFeedback}
              onChange={(e) => setRejectFeedback(e.target.value)}
              placeholder="e.g. Please re-upload with section 4 completed, or PDF resolution is unreadable..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1.5px solid var(--color-outline-variant)',
                fontSize: '0.85rem',
                color: 'var(--color-on-surface)',
                backgroundColor: 'var(--color-surface-container)',
                marginBottom: '1.25rem',
                outline: 'none',
                resize: 'none',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                onClick={() => setRejectModalGroup(null)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--color-outline-variant)',
                  backgroundColor: 'transparent',
                  color: 'var(--color-on-surface)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleReview(rejectModalGroup.group_id, 'rejected', rejectFeedback)}
                disabled={actionLoading === rejectModalGroup.group_id}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  )
}
