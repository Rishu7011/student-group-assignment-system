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
  CalendarDays,
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
  members: Array<{ id: number; name: string; email: string }> | null
}

type StatusFilter = 'all' | 'pending' | 'pending_confirmation' | 'confirmed'

function StatusChip({ status }: { status: string | null }) {
  const s = status ?? 'pending'
  const meta: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pending: { label: 'Not Started', color: 'var(--color-on-surface-variant)', bg: 'var(--color-surface-container-high)', icon: <Clock size={11} /> },
    pending_confirmation: { label: 'Step 1 Done', color: '#d97706', bg: '#fef3c7', icon: <AlertTriangle size={11} /> },
    confirmed: { label: 'Confirmed', color: '#16a34a', bg: '#dcfce7', icon: <CheckCircle2 size={11} /> },
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

  const filtered = groupStatuses.filter((g) => {
    if (filter === 'all') return true
    const s = g.status ?? 'pending'
    return s === filter
  })

  const selectedAssignment = assignments.find((a) => a.id === selectedId)

  const counts = {
    confirmed: groupStatuses.filter((g) => g.status === 'confirmed').length,
    pending_confirmation: groupStatuses.filter((g) => g.status === 'pending_confirmation').length,
    pending: groupStatuses.filter((g) => !g.status || g.status === 'pending').length,
  }

  return (
    <Sidebar>
      <div style={{ padding: '2rem 1.75rem', maxWidth: '1100px' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-on-surface)', letterSpacing: '-0.01em' }}>
            Submission Tracker
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-on-surface-variant)' }}>
            Live status of all group submissions per assignment
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
                  { label: 'Confirmed', count: counts.confirmed, color: '#16a34a', bg: '#dcfce7' },
                  { label: 'Step 1 Done', count: counts.pending_confirmation, color: '#d97706', bg: '#fef3c7' },
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
                <div style={{ flex: 1, minWidth: '200px', padding: '0.625rem 1rem', borderRadius: '0.625rem', backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--color-surface-container-high)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${groupStatuses.length > 0 ? Math.round((counts.confirmed / groupStatuses.length) * 100) : 0}%`, backgroundColor: '#22c55e', borderRadius: '9999px', transition: 'width 0.6s' }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#16a34a', flexShrink: 0 }}>
                    {groupStatuses.length > 0 ? Math.round((counts.confirmed / groupStatuses.length) * 100) : 0}%
                  </span>
                </div>
              </div>
            )}

            {/* Filter */}
            {selectedAssignment && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.375rem', padding: '0.25rem', backgroundColor: 'var(--color-surface-container)', borderRadius: '0.625rem', width: 'fit-content' }}>
                  {(['all', 'confirmed', 'pending_confirmation', 'pending'] as const).map((f) => (
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
                      {f === 'all' ? 'All' : f === 'confirmed' ? 'Confirmed' : f === 'pending_confirmation' ? 'Step 1 Done' : 'Not Started'}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px 200px', gap: '1rem', padding: '0.75rem 1.25rem', backgroundColor: 'var(--color-surface-container)', borderBottom: '1px solid var(--color-outline-variant)' }}>
                  {['Group', 'Members', 'Status', 'Confirmed At'].map((h) => (
                    <span key={h} style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-on-surface-variant)' }}>
                      {h}
                    </span>
                  ))}
                </div>

                {filtered.map((g, i) => (
                  <div
                    key={g.group_id}
                    style={{
                      display: 'grid', gridTemplateColumns: '1fr 140px 140px 200px', gap: '1rem',
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
                      <StatusChip status={g.status} />
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-on-surface-variant)' }}>
                      {g.confirmed_at ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#16a34a', fontWeight: 600 }}>
                            <CalendarDays size={12} />
                            {new Date(g.confirmed_at).toLocaleDateString()}
                          </div>
                          {g.confirmed_by_name && <div style={{ fontSize: '0.72rem' }}>by {g.confirmed_by_name}</div>}
                        </div>
                      ) : '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Sidebar>
  )
}
