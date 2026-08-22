import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import Sidebar from '../components/Sidebar'
import {
  BarChart3,
  Users,
  BookOpen,
  ClipboardList,
  TrendingUp,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface AnalyticsOverview {
  totalAssignments: number
  totalGroups: number
  totalStudents: number
  overallCompletionRate: number
  perAssignment: Array<{
    assignmentId: number
    title: string
    totalGroups: number
    confirmedGroups: number
    completionRate: number
  }>
  perGroup: Array<{
    groupId: number
    name: string
    totalAssignments: number
    confirmedAssignments: number
    completionRate: number
  }>
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiClient
      .get<AnalyticsOverview>('/analytics/overview')
      .then((res: { data: AnalyticsOverview }) => setAnalytics(res.data))
      .catch(() => setError('Failed to load analytics data.'))
      .finally(() => setLoading(false))
  }, [])

  const statCards = analytics
    ? [
        { label: 'Total Students', value: analytics.totalStudents, icon: <Users size={20} color="var(--color-primary)" />, bg: 'var(--color-primary-fixed)', id: 'stat-students' },
        { label: 'Active Groups', value: analytics.totalGroups, icon: <ShieldCheck size={20} color="var(--color-secondary)" />, bg: 'var(--color-secondary-container)', id: 'stat-groups' },
        { label: 'Assignments', value: analytics.totalAssignments, icon: <BookOpen size={20} color="#16a34a" />, bg: '#dcfce7', id: 'stat-assignments' },
        { label: 'Completion Rate', value: `${analytics.overallCompletionRate}%`, icon: <TrendingUp size={20} color="#d97706" />, bg: '#fef3c7', id: 'stat-completion' },
      ]
    : []

  return (
    <Sidebar>
      <div style={{ padding: '2rem 1.75rem', maxWidth: '1000px' }}>
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1a1565 0%, var(--color-primary) 100%)',
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
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', opacity: 0.8 }}>Admin Console</p>
            <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
              Welcome, {user?.name ?? 'Admin'} 🛡️
            </h1>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.7 }}>{user?.email}</p>
          </div>
          {analytics && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>{analytics.overallCompletionRate}%</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>Overall Completion</div>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '3rem' }}>
            <Loader2 size={32} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : error ? (
          <div style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: 'var(--color-error-container)', color: 'var(--color-error)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <AlertCircle size={18} /> {error}
          </div>
        ) : analytics ? (
          <>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {statCards.map((s) => (
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
                  <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem', backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                    {s.icon}
                  </div>
                  <p style={{ margin: '0 0 0.25rem', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>{s.value}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-on-surface-variant)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Per-assignment completion */}
            {analytics.perAssignment.length > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--color-surface-container-lowest)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--color-outline-variant)',
                  marginBottom: '1.5rem',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-outline-variant)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={18} color="var(--color-primary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-on-surface)' }}>Completion by Assignment</span>
                </div>
                <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {analytics.perAssignment.map((a) => (
                    <div key={a.assignmentId}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.375rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-on-surface)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.75rem' }}>
                          {a.title}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: a.completionRate === 100 ? '#16a34a' : 'var(--color-primary)', flexShrink: 0 }}>
                          {a.confirmedGroups}/{a.totalGroups} groups · {a.completionRate}%
                        </span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'var(--color-surface-container-high)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${a.completionRate}%`,
                            borderRadius: '9999px',
                            backgroundColor: a.completionRate === 100 ? '#22c55e' : 'var(--color-primary)',
                            transition: 'width 0.6s ease',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Per-group completion */}
            {analytics.perGroup.length > 0 && (
              <div
                style={{
                  backgroundColor: 'var(--color-surface-container-lowest)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--color-outline-variant)',
                  marginBottom: '1.5rem',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-outline-variant)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} color="var(--color-secondary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-on-surface)' }}>Completion by Group</span>
                </div>
                <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {analytics.perGroup.map((g) => (
                    <div key={g.groupId}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.375rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-on-surface)' }}>{g.name}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: g.completionRate === 100 ? '#16a34a' : 'var(--color-secondary)', flexShrink: 0 }}>
                          {g.confirmedAssignments}/{g.totalAssignments} · {g.completionRate}%
                        </span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: 'var(--color-surface-container-high)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${g.completionRate}%`,
                            borderRadius: '9999px',
                            backgroundColor: g.completionRate === 100 ? '#22c55e' : 'var(--color-secondary)',
                            transition: 'width 0.6s ease',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick-nav cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              {[
                { icon: <BookOpen size={22} color="var(--color-primary)" />, title: 'Manage Assignments', desc: 'Create, edit and assign work.', to: '/admin/assignments', id: 'card-admin-assignments' },
                { icon: <ClipboardList size={22} color="#d97706" />, title: 'Submission Tracker', desc: 'Track all submission statuses.', to: '/admin/submissions', id: 'card-admin-submissions' },
                { icon: <Users size={22} color="var(--color-secondary)" />, title: 'Group Directory', desc: 'View all student groups.', to: '/admin/groups', id: 'card-admin-groups' },
              ].map((card) => (
                <div
                  key={card.id}
                  id={card.id}
                  onClick={() => navigate(card.to)}
                  style={{
                    backgroundColor: 'var(--color-surface-container-lowest)',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    border: '1px solid var(--color-outline-variant)',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.15s, transform 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(53,37,205,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem', backgroundColor: 'var(--color-surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.875rem' }}>
                    {card.icon}
                  </div>
                  <h3 style={{ margin: '0 0 0.375rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>{card.title}</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-on-surface-variant)', lineHeight: 1.5 }}>{card.desc}</p>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </Sidebar>
  )
}
