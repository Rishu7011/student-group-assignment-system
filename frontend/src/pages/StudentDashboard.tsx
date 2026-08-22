import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import apiClient from '../api/client'
import Sidebar from '../components/Sidebar'
import {
  Users,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  ChevronRight,
  Loader2,
  AlertCircle,
  Clock,
  CalendarDays,
} from 'lucide-react'

interface Group {
  id: number
  name: string
  members: Array<{ id: number; name: string; email: string; role: string }>
  created_at: string
}

interface Assignment {
  id: number
  title: string
  description: string | null
  due_date: string
  onedrive_link: string
  assigned_to_type: string
  created_at: string
}

interface GroupSubmission {
  assignment_id: number
  title: string
  due_date: string
  status: string
}

function getDeadlineBadge(dueDate: string) {
  const now = new Date()
  const due = new Date(dueDate)
  const diffMs = due.getTime() - now.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffDays < 0) return { label: 'Overdue', color: '#dc2626', bg: '#fee2e2' }
  if (diffDays < 7) return { label: 'Due Soon', color: '#d97706', bg: '#fef3c7' }
  return { label: 'Upcoming', color: '#16a34a', bg: '#dcfce7' }
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [groups, setGroups] = useState<Group[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [groupSubmissions, setGroupSubmissions] = useState<GroupSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [groupsRes, assignmentsRes] = await Promise.all([
          apiClient.get<{ groups: Group[] }>('/groups/mine'),
          apiClient.get<{ assignments: Assignment[] }>('/assignments'),
        ])
        setGroups(groupsRes.data.groups)
        setAssignments(assignmentsRes.data.assignments)

        // Load submission status for first group
        if (groupsRes.data.groups.length > 0) {
          const subRes = await apiClient.get<{ assignments: GroupSubmission[] }>(
            `/submissions/group/${groupsRes.data.groups[0].id}`
          )
          setGroupSubmissions(subRes.data.assignments)
        }
      } catch {
        setError('Failed to load dashboard data. Please refresh.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const confirmedCount = groupSubmissions.filter((s) => s.status === 'confirmed').length
  const totalCount = groupSubmissions.length
  const progressPct = totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0

  const pendingAssignments = assignments.filter((a) => {
    const sub = groupSubmissions.find((s) => s.assignment_id === a.id)
    return !sub || sub.status !== 'confirmed'
  })

  const recentAssignments = assignments.slice(0, 3)

  return (
    <Sidebar>
      <div style={{ padding: '2rem 1.75rem', maxWidth: '900px' }}>
        {/* Welcome banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 100%)',
            borderRadius: '1rem',
            padding: '1.75rem 2rem',
            marginBottom: '2rem',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <p style={{ fontSize: '0.875rem', opacity: 0.8, margin: '0 0 0.25rem' }}>Welcome back,</p>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.375rem', letterSpacing: '-0.01em' }}>
              {user?.name ?? 'Student'} 👋
            </h1>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.75 }}>{user?.email}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '2.5rem',
                fontWeight: 800,
                lineHeight: 1,
                marginBottom: '0.25rem',
              }}
            >
              {progressPct}%
            </div>
            <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>Overall Progress</div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <Loader2 size={32} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : error ? (
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '0.75rem',
              backgroundColor: 'var(--color-error-container)',
              color: 'var(--color-error)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={18} />
            {error}
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem',
              }}
            >
              {[
                {
                  icon: <Users size={20} color="var(--color-primary)" />,
                  label: 'Active Groups',
                  value: groups.length,
                  bg: 'var(--color-primary-fixed)',
                  id: 'stat-groups',
                },
                {
                  icon: <Clock size={20} color="#d97706" />,
                  label: 'Pending Assignments',
                  value: pendingAssignments.length,
                  bg: '#fef3c7',
                  id: 'stat-pending',
                },
                {
                  icon: <CheckCircle2 size={20} color="#16a34a" />,
                  label: 'Completed',
                  value: confirmedCount,
                  bg: '#dcfce7',
                  id: 'stat-completed',
                },
                {
                  icon: <TrendingUp size={20} color="var(--color-secondary)" />,
                  label: 'Total Assignments',
                  value: assignments.length,
                  bg: 'var(--color-secondary-container)',
                  id: 'stat-total',
                },
              ].map((s) => (
                <div
                  key={s.id}
                  id={s.id}
                  style={{
                    backgroundColor: 'var(--color-surface-container-lowest)',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    border: '1px solid var(--color-outline-variant)',
                  }}
                >
                  <div
                    style={{
                      width: '2.25rem',
                      height: '2.25rem',
                      borderRadius: '0.5rem',
                      backgroundColor: s.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '0.75rem',
                    }}
                  >
                    {s.icon}
                  </div>
                  <p style={{ margin: '0 0 0.25rem', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                    {s.value}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-on-surface-variant)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            {totalCount > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--color-surface-container-lowest)',
                  borderRadius: '0.75rem',
                  padding: '1.25rem 1.5rem',
                  border: '1px solid var(--color-outline-variant)',
                  marginBottom: '2rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                    Overall Submission Progress
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    {confirmedCount} / {totalCount}
                  </span>
                </div>
                <div style={{ height: '8px', backgroundColor: 'var(--color-surface-container-high)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${progressPct}%`,
                      borderRadius: '9999px',
                      backgroundColor: progressPct === 100 ? '#16a34a' : 'var(--color-primary)',
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Group summary */}
            {groups.length > 0 ? (
              <div
                style={{
                  backgroundColor: 'var(--color-surface-container-lowest)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--color-outline-variant)',
                  marginBottom: '2rem',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid var(--color-outline-variant)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={18} color="var(--color-primary)" />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-on-surface)' }}>
                      My Active Group
                    </span>
                  </div>
                  <button
                    onClick={() => navigate('/student/groups')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.8rem',
                      color: 'var(--color-primary)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    View All <ChevronRight size={14} />
                  </button>
                </div>
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                        {groups[0].name}
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-on-surface-variant)' }}>
                        {groups[0].members.length} member{groups[0].members.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {groups[0].members.map((m) => (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.25rem 0.625rem',
                          borderRadius: '9999px',
                          backgroundColor: 'var(--color-surface-container)',
                          fontSize: '0.8rem',
                          color: 'var(--color-on-surface)',
                        }}
                      >
                        <div
                          style={{
                            width: '1.25rem',
                            height: '1.25rem',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.6rem',
                            fontWeight: 700,
                          }}
                        >
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        {m.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  backgroundColor: 'var(--color-surface-container)',
                  borderRadius: '0.75rem',
                  padding: '2rem',
                  textAlign: 'center',
                  marginBottom: '2rem',
                  border: '1px dashed var(--color-outline-variant)',
                }}
              >
                <Users size={32} color="var(--color-on-surface-variant)" style={{ marginBottom: '0.75rem' }} />
                <p style={{ margin: '0 0 1rem', color: 'var(--color-on-surface-variant)', fontSize: '0.875rem' }}>
                  You're not in any group yet.
                </p>
                <button
                  id="btn-create-group"
                  onClick={() => navigate('/student/groups')}
                  style={{
                    padding: '0.5rem 1.25rem',
                    borderRadius: '0.5rem',
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Create a Group
                </button>
              </div>
            )}

            {/* Assignment preview */}
            {recentAssignments.length > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--color-surface-container-lowest)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--color-outline-variant)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid var(--color-outline-variant)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={18} color="var(--color-primary)" />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-on-surface)' }}>
                      Recent Assignments
                    </span>
                  </div>
                  <button
                    onClick={() => navigate('/student/assignments')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      fontSize: '0.8rem',
                      color: 'var(--color-primary)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    View All <ChevronRight size={14} />
                  </button>
                </div>
                {recentAssignments.map((a, i) => {
                  const badge = getDeadlineBadge(a.due_date)
                  const sub = groupSubmissions.find((s) => s.assignment_id === a.id)
                  return (
                    <div
                      key={a.id}
                      id={`dashboard-assignment-${a.id}`}
                      onClick={() => navigate(`/student/assignments/${a.id}`)}
                      style={{
                        padding: '1rem 1.25rem',
                        borderBottom: i < recentAssignments.length - 1 ? '1px solid var(--color-outline-variant)' : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-container)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span
                            style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              backgroundColor: badge.bg,
                              color: badge.color,
                            }}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p style={{ margin: '0 0 0.125rem', fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {a.title}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CalendarDays size={12} />
                          Due {new Date(a.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ marginLeft: '1rem', flexShrink: 0 }}>
                        {sub?.status === 'confirmed' ? (
                          <CheckCircle2 size={20} color="#16a34a" />
                        ) : (
                          <ChevronRight size={18} color="var(--color-on-surface-variant)" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </Sidebar>
  )
}
