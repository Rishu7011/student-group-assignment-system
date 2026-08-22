import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../../api/client'
import Sidebar from '../../components/Sidebar'
import {
  BookOpen,
  CalendarDays,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'

interface Assignment {
  id: number
  title: string
  description: string | null
  due_date: string
  onedrive_link: string
  assigned_to_type: string
  creator_name: string
  created_at: string
}

interface GroupSub {
  assignment_id: number
  status: string
}

interface Group {
  id: number
  name: string
}

function getDeadlineMeta(dueDate: string) {
  const now = new Date()
  const due = new Date(dueDate)
  const diffMs = due.getTime() - now.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays < 0) return { label: 'Overdue', color: '#dc2626', bg: '#fee2e2', icon: <AlertTriangle size={12} /> }
  if (diffDays < 7) return { label: 'Due Soon', color: '#d97706', bg: '#fef3c7', icon: <Clock size={12} /> }
  return { label: 'Upcoming', color: '#16a34a', bg: '#dcfce7', icon: <CalendarDays size={12} /> }
}

function getStatusMeta(status: string | undefined) {
  if (!status || status === 'pending') return { label: 'Not Started', color: 'var(--color-on-surface-variant)', bg: 'var(--color-surface-container-high)' }
  if (status === 'pending_confirmation') return { label: 'Step 1 Done', color: '#d97706', bg: '#fef3c7' }
  if (status === 'confirmed') return { label: 'Submitted', color: '#16a34a', bg: '#dcfce7' }
  return { label: status, color: 'var(--color-on-surface-variant)', bg: 'var(--color-surface-container)' }
}

export default function AssignmentList() {
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [groupSubs, setGroupSubs] = useState<GroupSub[]>([])
  const [myGroup, setMyGroup] = useState<Group | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all')

  useEffect(() => {
    async function load() {
      try {
        const [assignRes, groupRes] = await Promise.all([
          apiClient.get<{ assignments: Assignment[] }>('/assignments'),
          apiClient.get<{ groups: Group[] }>('/groups/mine'),
        ])
        setAssignments(assignRes.data.assignments)
        const firstGroup = groupRes.data.groups[0] ?? null
        setMyGroup(firstGroup)
        if (firstGroup) {
          const subRes = await apiClient.get<{ assignments: GroupSub[] }>(`/submissions/group/${firstGroup.id}`)
          setGroupSubs(subRes.data.assignments)
        }
      } catch {
        setError('Failed to load assignments.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = assignments.filter((a) => {
    if (filter === 'all') return true
    const sub = groupSubs.find((s) => s.assignment_id === a.id)
    if (filter === 'submitted') return sub?.status === 'confirmed'
    return !sub || sub.status !== 'confirmed'
  })

  return (
    <Sidebar>
      <div style={{ padding: '2rem 1.75rem', maxWidth: '900px' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-on-surface)', letterSpacing: '-0.01em' }}>
            Assignments
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-on-surface-variant)' }}>
            All assignments targeted at your group
            {myGroup && <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}> — {myGroup.name}</span>}
          </p>
        </div>

        {/* Filter tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.375rem',
            padding: '0.25rem',
            backgroundColor: 'var(--color-surface-container)',
            borderRadius: '0.625rem',
            marginBottom: '1.5rem',
            width: 'fit-content',
          }}
        >
          {(['all', 'pending', 'submitted'] as const).map((f) => (
            <button
              key={f}
              id={`filter-${f}`}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: filter === f ? 'var(--color-surface-container-lowest)' : 'transparent',
                color: filter === f ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
                textTransform: 'capitalize',
              }}
            >
              {f === 'all' ? 'All' : f === 'pending' ? 'In Progress' : 'Submitted'}
            </button>
          ))}
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
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--color-surface-container-lowest)', borderRadius: '1rem', border: '2px dashed var(--color-outline-variant)' }}>
            <BookOpen size={40} color="var(--color-on-surface-variant)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p style={{ color: 'var(--color-on-surface-variant)', fontSize: '0.9rem', margin: 0 }}>
              {filter === 'all' ? 'No assignments found.' : `No ${filter === 'pending' ? 'in-progress' : 'submitted'} assignments.`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map((a) => {
              const deadline = getDeadlineMeta(a.due_date)
              const sub = groupSubs.find((s) => s.assignment_id === a.id)
              const statusMeta = getStatusMeta(sub?.status)
              const isConfirmed = sub?.status === 'confirmed'

              return (
                <div
                  key={a.id}
                  id={`assignment-${a.id}`}
                  onClick={() => navigate(`/student/assignments/${a.id}`)}
                  style={{
                    backgroundColor: 'var(--color-surface-container-lowest)',
                    borderRadius: '0.75rem',
                    border: `1px solid ${isConfirmed ? '#bbf7d0' : 'var(--color-outline-variant)'}`,
                    padding: '1.25rem 1.5rem',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s, transform 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(53,37,205,0.1)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  {/* Status icon */}
                  <div
                    style={{
                      width: '2.75rem',
                      height: '2.75rem',
                      borderRadius: '0.625rem',
                      backgroundColor: isConfirmed ? '#dcfce7' : 'var(--color-primary-fixed)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isConfirmed ? (
                      <CheckCircle2 size={22} color="#16a34a" />
                    ) : (
                      <BookOpen size={22} color="var(--color-primary)" />
                    )}
                  </div>

                  {/* Main info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                      <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {a.title}
                      </h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor: deadline.bg,
                          color: deadline.color,
                        }}
                      >
                        {deadline.icon} {deadline.label}
                      </span>
                      <span
                        style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor: statusMeta.bg,
                          color: statusMeta.color,
                        }}
                      >
                        {statusMeta.label}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>
                        <CalendarDays size={12} />
                        {new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Progress bar */}
                    {!myGroup ? null : (
                      <div style={{ marginTop: '0.625rem' }}>
                        <div style={{ height: '4px', backgroundColor: 'var(--color-surface-container-high)', borderRadius: '9999px', overflow: 'hidden', width: '200px' }}>
                          <div
                            style={{
                              height: '100%',
                              width: isConfirmed ? '100%' : sub?.status === 'pending_confirmation' ? '50%' : '0%',
                              backgroundColor: isConfirmed ? '#22c55e' : 'var(--color-primary)',
                              borderRadius: '9999px',
                              transition: 'width 0.5s ease',
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* OneDrive link + arrow */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexShrink: 0 }}>
                    <a
                      href={a.onedrive_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title="Open OneDrive folder"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '0.5rem',
                        backgroundColor: 'var(--color-surface-container)',
                        color: 'var(--color-on-surface-variant)',
                        border: '1px solid var(--color-outline-variant)',
                        textDecoration: 'none',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-primary-fixed)'
                        e.currentTarget.style.color = 'var(--color-primary)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-surface-container)'
                        e.currentTarget.style.color = 'var(--color-on-surface-variant)'
                      }}
                    >
                      <ExternalLink size={14} />
                    </a>
                    <ChevronRight size={18} color="var(--color-on-surface-variant)" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Sidebar>
  )
}
