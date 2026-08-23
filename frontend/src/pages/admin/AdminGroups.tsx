import { useEffect, useState } from 'react'
import apiClient from '../../api/client'
import Sidebar from '../../components/Sidebar'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  TrendingUp,
} from 'lucide-react'

interface GroupSummary {
  id: number
  name: string
  created_at: string
  member_count: number
}

interface GroupDetail {
  id: number
  name: string
  created_at: string
  members: Array<{ id: number; name: string; email: string; role: string; joined_at: string }>
  progress: {
    total_assignments: number
    confirmed_count: number
    completion_rate: number
  }
}

export default function AdminGroups() {
  const [groups, setGroups] = useState<GroupSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [details, setDetails] = useState<Record<number, GroupDetail>>({})
  const [detailLoading, setDetailLoading] = useState<number | null>(null)

  useEffect(() => {
    apiClient
      .get<{ groups: GroupSummary[] }>('/groups/all')
      .then((res) => setGroups(res.data.groups))
      .catch(() => setError('Failed to load groups.'))
      .finally(() => setLoading(false))
  }, [])

  async function toggleExpand(groupId: number) {
    if (expandedId === groupId) {
      setExpandedId(null)
      return
    }
    setExpandedId(groupId)
    if (!details[groupId]) {
      setDetailLoading(groupId)
      try {
        const res = await apiClient.get<{ group: GroupDetail }>(`/groups/${groupId}`)
        setDetails((prev) => ({ ...prev, [groupId]: res.data.group }))
      } catch {
        // silently fail, keep expanded with basic info
      } finally {
        setDetailLoading(null)
      }
    }
  }

  return (
    <Sidebar>
      <div style={{ padding: '2rem 1.75rem', maxWidth: '900px' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-on-surface)', letterSpacing: '-0.01em' }}>
            Group Directory
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-on-surface-variant)' }}>
            All student groups with member rosters and submission progress
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
        ) : groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--color-surface-container-lowest)', borderRadius: '1rem', border: '2px dashed var(--color-outline-variant)' }}>
            <Users size={40} style={{ marginBottom: '1rem', opacity: 0.5, color: 'var(--color-on-surface-variant)' }} />
            <p style={{ color: 'var(--color-on-surface-variant)', margin: 0, fontSize: '0.9rem' }}>No groups have been created yet.</p>
          </div>
        ) : (
          <>
            {/* Summary chips */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <div style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem', backgroundColor: 'var(--color-primary-fixed)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={15} color="var(--color-primary)" />
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-primary)' }}>{groups.length}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>Total Groups</span>
              </div>
              <div style={{ padding: '0.5rem 1rem', borderRadius: '0.625rem', backgroundColor: 'var(--color-secondary-container)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={15} color="var(--color-secondary)" />
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-secondary)' }}>
                  {groups.reduce((sum, g) => sum + g.member_count, 0)}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-secondary)' }}>Enrolled Members</span>
              </div>
            </div>

            {/* Group list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {groups.map((group) => {
                const isExpanded = expandedId === group.id
                const detail = details[group.id]
                const isDetailLoading = detailLoading === group.id
                const completionRate = detail?.progress.completion_rate ?? null

                return (
                  <div
                    key={group.id}
                    style={{
                      backgroundColor: 'var(--color-surface-container-lowest)',
                      borderRadius: '0.75rem',
                      border: '1px solid var(--color-outline-variant)',
                      overflow: 'hidden',
                      transition: 'box-shadow 0.15s',
                    }}
                  >
                    {/* Group header */}
                    <div
                      id={`group-row-${group.id}`}
                      onClick={() => toggleExpand(group.id)}
                      style={{
                        padding: '1.125rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-container)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      {/* Avatar */}
                      <div
                        style={{
                          width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem',
                          backgroundColor: 'var(--color-primary-fixed)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary)', flexShrink: 0,
                        }}
                      >
                        {group.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Name + meta */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{ margin: '0 0 0.2rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                          {group.name}
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Users size={12} /> {group.member_count} member{group.member_count !== 1 ? 's' : ''}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CalendarDays size={12} /> {new Date(group.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Completion rate + chevron */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                        {completionRate !== null && (
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: completionRate === 100 ? '#16a34a' : 'var(--color-primary)' }}>
                              {completionRate}%
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--color-on-surface-variant)' }}>complete</div>
                          </div>
                        )}
                        {isDetailLoading ? (
                          <Loader2 size={18} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
                        ) : isExpanded ? (
                          <ChevronUp size={18} color="var(--color-on-surface-variant)" />
                        ) : (
                          <ChevronDown size={18} color="var(--color-on-surface-variant)" />
                        )}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {isExpanded && detail && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          style={{ overflow: 'hidden', borderTop: '1px solid var(--color-outline-variant)', backgroundColor: 'var(--color-surface-container)' }}
                        >
                          {/* Progress bar */}
                          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-outline-variant)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                                Submission Progress
                              </span>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: detail.progress.completion_rate === 100 ? '#16a34a' : 'var(--color-primary)' }}>
                                {detail.progress.confirmed_count}/{detail.progress.total_assignments} assignments
                              </span>
                            </div>
                            <div style={{ height: '6px', backgroundColor: 'var(--color-surface-container-high)', borderRadius: '9999px', overflow: 'hidden' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${detail.progress.completion_rate}%` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                style={{ height: '100%', backgroundColor: detail.progress.completion_rate === 100 ? '#22c55e' : 'var(--color-primary)', borderRadius: '9999px' }}
                              />
                            </div>
                          </div>

                          {/* Member list */}
                          <div style={{ padding: '1rem 1.5rem' }}>
                            <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-on-surface-variant)' }}>
                              Members ({detail.members.length})
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.5rem' }}>
                              {detail.members.map((m) => (
                                <div
                                  key={m.id}
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                                    padding: '0.5rem 0.75rem', borderRadius: '0.5rem',
                                    backgroundColor: 'var(--color-surface-container-lowest)',
                                    border: '1px solid var(--color-outline-variant)',
                                  }}
                                >
                                  <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                                    {m.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div style={{ minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</p>
                                    <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-on-surface-variant)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </Sidebar>
  )
}
