import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import apiClient from '../api/client'
import Sidebar from '../components/Sidebar'
import gsap from 'gsap'
import confetti from 'canvas-confetti'
import {
  Users,
  ChevronRight,
  Loader2,
  AlertCircle,
  Clock,
  CalendarDays,
  GraduationCap,
  Crown,
  Home,
  FileText,
  Sparkles,
  Plus,
  X,
  Check,
  BookOpen,
} from 'lucide-react'

interface Group {
  id: number
  name: string
  created_by: number
  leader_id?: number
  members: Array<{ id: number; name: string; email: string; role: string }>
  created_at: string
}

interface Course {
  id: number
  title: string
  description: string | null
  assignmentCount: number
  created_at: string
}

interface CatalogCourse {
  id: number
  title: string
  description: string | null
  professor_name: string | null
  enrolledStudents: number
  assignmentCount: number
  isEnrolled: boolean
}

interface Assignment {
  id: number
  title: string
  description: string | null
  due_date: string
  onedrive_link: string
  assigned_to_type: string
  course_id?: number | null
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
  const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (diffDays < 0) return { label: 'Overdue', class: 'tag-red' }
  if (diffDays < 7) return { label: `Due in ${Math.ceil(diffDays)}d`, class: 'tag-amber' }
  return { label: `Due in ${Math.ceil(diffDays)}d`, class: 'tag-green' }
}

export default function StudentDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [groups, setGroups] = useState<Group[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [groupSubmissions, setGroupSubmissions] = useState<GroupSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Course Catalog Modal State
  const [catalogOpen, setCatalogOpen] = useState(false)
  const [catalog, setCatalog] = useState<CatalogCourse[]>([])
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [enrollingId, setEnrollingId] = useState<number | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  const loadData = useCallback(async () => {
    try {
      const [groupsRes, assignmentsRes, coursesRes] = await Promise.all([
        apiClient.get<{ groups: Group[] }>('/groups/mine'),
        apiClient.get<{ assignments: Assignment[] }>('/assignments'),
        apiClient.get<{ courses: Course[] }>('/courses/mine'),
      ])
      setGroups(groupsRes.data.groups)
      setAssignments(assignmentsRes.data.assignments)
      setCourses(coursesRes.data.courses)

      if (groupsRes.data.groups.length > 0) {
        const subRes = await apiClient.get<{ assignments: GroupSubmission[] }>(
          `/submissions/group/${groupsRes.data.groups[0].id}`
        )
        setGroupSubmissions(subRes.data.assignments)
      }
    } catch {
      setError('Failed to load workspace data. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // GSAP Entrance Animation
  useEffect(() => {
    if (!loading && containerRef.current) {
      const ctx = gsap.context(() => {
        gsap.from('.gsap-fade-in', {
          opacity: 0,
          y: 18,
          duration: 0.55,
          stagger: 0.08,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        })
      }, containerRef)
      return () => ctx.revert()
    }
  }, [loading])

  const confirmedCount = groupSubmissions.filter((s) => s.status === 'confirmed').length
  const totalCount = groupSubmissions.length
  const progressPct = totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0

  // GSAP Progress Bar Animation
  useEffect(() => {
    if (progressRef.current) {
      gsap.to(progressRef.current, {
        width: `${progressPct}%`,
        duration: 0.9,
        ease: 'power2.out',
      })
    }
  }, [progressPct])

  const openCatalog = async () => {
    setCatalogOpen(true)
    setCatalogLoading(true)
    try {
      const res = await apiClient.get<{ courses: CatalogCourse[] }>('/courses/catalog')
      setCatalog(res.data.courses)
    } catch {
      // ignore
    } finally {
      setCatalogLoading(false)
    }
  }

  const handleSelfEnroll = async (courseId: number) => {
    setEnrollingId(courseId)
    try {
      await apiClient.post(`/courses/${courseId}/self-enroll`)
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } })
      // Update catalog state
      setCatalog((prev) =>
        prev.map((c) => (c.id === courseId ? { ...c, isEnrolled: true, enrolledStudents: c.enrolledStudents + 1 } : c))
      )
      // Refresh dashboard courses
      await loadData()
    } catch {
      // ignore
    } finally {
      setEnrollingId(null)
    }
  }

  const pendingAssignments = assignments.filter((a) => {
    const sub = groupSubmissions.find((s) => s.assignment_id === a.id)
    return !sub || sub.status !== 'confirmed'
  })

  const activeGroup = groups[0] ?? null
  const leaderMember = activeGroup?.members.find(
    (m) => m.id === (activeGroup.leader_id ?? activeGroup.created_by)
  )

  return (
    <Sidebar>
      <div
        ref={containerRef}
        style={{
          padding: '2rem 1.5rem',
          maxWidth: '960px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {/* Breadcrumb Header */}
        <div className="gsap-fade-in" style={{ marginBottom: '1.75rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.8rem',
              color: 'var(--color-on-surface-variant)',
              marginBottom: '0.75rem',
            }}
          >
            <Home size={14} />
            <span>Workspace</span>
            <span>/</span>
            <span style={{ color: 'var(--color-on-surface)', fontWeight: 500 }}>Student Portal</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
            <div style={{ fontSize: '2.5rem', lineHeight: 1 }}>🎓</div>
            <div>
              <h1
                style={{
                  margin: '0 0 0.25rem',
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: 'var(--color-on-surface)',
                }}
              >
                My Academic Workspace
              </h1>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  color: 'var(--color-on-surface-variant)',
                }}
              >
                Welcome back, {user?.name ?? 'Student'}. Manage enrolled courses, team assignments, and final lock-ins.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px' }}>
            <Loader2 size={32} color="#191919" style={{ animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : error ? (
          <div
            className="notion-callout"
            style={{
              backgroundColor: 'var(--color-error-container)',
              borderColor: 'var(--color-error)',
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
            {/* Notion KPI Banner */}
            <div
              className="gsap-fade-in"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
                marginBottom: '2rem',
              }}
            >
              <div className="notion-callout hover-lift">
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: '0.25rem' }}>
                  Courses
                </span>
                <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-on-surface)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <GraduationCap size={16} color="#6b21a8" /> {courses.length} Enrolled
                </div>
              </div>

              <div className="notion-callout hover-lift">
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: '0.25rem' }}>
                  Active Team
                </span>
                <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Users size={16} color="#0369a1" /> {activeGroup ? activeGroup.name : 'No team yet'}
                </div>
              </div>

              <div className="notion-callout hover-lift">
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-on-surface-variant)', display: 'block', marginBottom: '0.25rem' }}>
                  To-Do
                </span>
                <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-on-surface)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Clock size={16} color="#d97706" /> {pendingAssignments.length} Deliverable{pendingAssignments.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="notion-callout hover-lift">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-on-surface-variant)' }}>
                    Progress
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: progressPct === 100 ? '#15803d' : '#191919' }}>
                    {progressPct}%
                  </span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#e5e5e0', borderRadius: '9999px', overflow: 'hidden', marginTop: '0.35rem' }}>
                  <div
                    ref={progressRef}
                    style={{
                      height: '100%',
                      width: '0%',
                      backgroundColor: progressPct === 100 ? '#15803d' : '#191919',
                      borderRadius: '9999px',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Layout Grid: 2 Col Main, 1 Col Side */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem', alignItems: 'start' }}>
              {/* Left Column: Enrolled Courses Gallery */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                {/* Courses Section */}
                <div className="gsap-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e5e5e0', paddingBottom: '0.5rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-on-surface)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <GraduationCap size={18} /> Enrolled Courses
                    </h2>
                    <button
                      id="btn-browse-courses"
                      onClick={openCatalog}
                      style={{
                        background: '#f1f1ef',
                        border: '1px solid #e5e5e0',
                        color: '#191919',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e5e5e0')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f1f1ef')}
                    >
                      <Plus size={14} /> Browse Catalog
                    </button>
                  </div>

                  {courses.length === 0 ? (
                    <div className="notion-callout" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: '#f1f1ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOpen size={20} color="#6b6b66" />
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 700, color: '#191919' }}>
                          You are not enrolled in any courses yet
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b6b66' }}>
                          Browse available department courses to view assignments and collaborate with your team.
                        </p>
                      </div>
                      <button
                        id="btn-empty-browse-courses"
                        onClick={openCatalog}
                        className="hover-lift"
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.5rem 1.1rem',
                          borderRadius: '0.375rem',
                          backgroundColor: '#191919',
                          color: 'white',
                          border: 'none',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                        }}
                      >
                        <Plus size={15} /> Browse & Enroll in Courses
                      </button>
                    </div>
                  ) : (
                    <div id="course-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.875rem' }}>
                      {courses.map((course) => (
                        <div
                          key={course.id}
                          id={`course-card-${course.id}`}
                          className="notion-callout hover-lift"
                          onClick={() => navigate(`/student/courses/${course.id}`)}
                          style={{
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.625rem',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                              💻 {course.title}
                            </h3>
                            <ChevronRight size={15} color="#9e9e98" />
                          </div>

                          {course.description && (
                            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-on-surface-variant)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {course.description}
                            </p>
                          )}

                          <div style={{ marginTop: 'auto', paddingTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                            <span className="tag-purple" style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                              {course.assignmentCount} Assignment{course.assignmentCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Deliverables / Assignments */}
                <div className="gsap-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e5e5e0', paddingBottom: '0.5rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-on-surface)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={18} /> Active Deliverables
                    </h2>
                    <button
                      onClick={() => navigate('/student/assignments')}
                      style={{ background: 'none', border: 'none', color: '#6b21a8', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      View All <ChevronRight size={14} />
                    </button>
                  </div>

                  {assignments.length === 0 ? (
                    <div className="notion-callout" style={{ textAlign: 'center', padding: '2rem' }}>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-on-surface-variant)' }}>
                        No assignments available right now.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {assignments.slice(0, 4).map((a) => {
                        const badge = getDeadlineBadge(a.due_date)
                        const sub = groupSubmissions.find((s) => s.assignment_id === a.id)
                        const isConfirmed = sub?.status === 'confirmed'

                        return (
                          <div
                            key={a.id}
                            id={`dashboard-assignment-${a.id}`}
                            className="notion-callout hover-lift"
                            onClick={() => navigate(`/student/assignments/${a.id}`)}
                            style={{
                              cursor: 'pointer',
                              padding: '0.875rem 1.1rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.75rem',
                            }}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                <span className={badge.class} style={{ fontSize: '0.68rem', fontWeight: 600, padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                                  {badge.label}
                                </span>
                                {isConfirmed && (
                                  <span className="tag-green" style={{ fontSize: '0.68rem', fontWeight: 600, padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                                    ✓ Confirmed
                                  </span>
                                )}
                              </div>
                              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {a.title}
                              </p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <CalendarDays size={13} /> {new Date(a.due_date).toLocaleDateString()}
                              </span>
                              <ChevronRight size={15} color="#9e9e98" />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Project Team & Roster Hub */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="gsap-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e5e5e0', paddingBottom: '0.5rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-on-surface)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Users size={18} /> Project Team
                    </h2>
                    <button
                      onClick={() => navigate('/student/groups')}
                      style={{ background: 'none', border: 'none', color: '#6b21a8', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      Manage <ChevronRight size={14} />
                    </button>
                  </div>

                  {activeGroup ? (
                    <div className="notion-callout hover-lift">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div>
                          <h3 style={{ margin: '0 0 0.15rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                            👥 {activeGroup.name}
                          </h3>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>
                            {activeGroup.members.length} active member{activeGroup.members.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      {leaderMember && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.875rem' }}>
                          <span className="tag-purple" style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Crown size={12} color="#eab308" /> Leader: {leaderMember.name}
                          </span>
                        </div>
                      )}

                      {/* Member roster stack */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        {activeGroup.members.map((m) => {
                          const isLeader = m.id === (activeGroup.leader_id ?? activeGroup.created_by)
                          return (
                            <div
                              key={m.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.4rem 0.5rem',
                                borderRadius: '4px',
                                backgroundColor: isLeader ? '#f5f3ff' : '#f7f7f5',
                                border: isLeader ? '1px solid #e9d5ff' : '1px solid #e5e5e0',
                              }}
                            >
                              <div
                                style={{
                                  width: '1.5rem',
                                  height: '1.5rem',
                                  borderRadius: '50%',
                                  backgroundColor: isLeader ? '#6b21a8' : '#191919',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  flexShrink: 0,
                                }}
                              >
                                {m.name.charAt(0).toUpperCase()}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-on-surface)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {m.name}
                                </p>
                              </div>
                              {isLeader && <Crown size={12} color="#eab308" />}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="notion-callout" style={{ textAlign: 'center', padding: '1.5rem' }}>
                      <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'var(--color-on-surface-variant)' }}>
                        You haven&apos;t joined a group yet.
                      </p>
                      <button
                        onClick={() => navigate('/student/groups')}
                        style={{
                          padding: '0.4rem 0.875rem',
                          borderRadius: '4px',
                          backgroundColor: '#191919',
                          color: 'white',
                          border: 'none',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Create / Join Team
                      </button>
                    </div>
                  )}
                </div>

                {/* Notion Style Quick Tip Callout */}
                <div className="gsap-fade-in notion-callout" style={{ backgroundColor: '#fcfbf9', borderLeft: '3px solid #6b21a8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 700, fontSize: '0.82rem', color: '#6b21a8', marginBottom: '0.25rem' }}>
                    <Sparkles size={14} /> Leader Lock-In Rule
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-on-surface-variant)', lineHeight: 1.5 }}>
                    Any teammate can complete Step 1 upload verification. Final Step 2 lock-in is executed exclusively by your designated Group Leader.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Browse Course Catalog Modal ── */}
      {catalogOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={() => setCatalogOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.75rem',
              border: '1px solid #e5e5e0',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e5e5e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <GraduationCap size={20} color="#6b21a8" />
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#191919' }}>
                  Available University Courses
                </h2>
              </div>
              <button
                onClick={() => setCatalogOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b6b66', display: 'flex' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {catalogLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
                  <Loader2 size={28} color="#191919" style={{ animation: 'spin 1s linear infinite' }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                </div>
              ) : catalog.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6b6b66', fontSize: '0.9rem' }}>
                  No courses are currently available in the catalog.
                </p>
              ) : (
                catalog.map((c) => (
                  <div
                    key={c.id}
                    className="notion-callout"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      padding: '1rem 1.25rem',
                      borderColor: c.isEnrolled ? '#bbf7d0' : '#e5e5e0',
                      backgroundColor: c.isEnrolled ? '#f0fdf4' : '#ffffff',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.92rem', fontWeight: 700, color: '#191919' }}>
                        💻 {c.title}
                      </h4>
                      {c.description && (
                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.78rem', color: '#6b6b66', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {c.description}
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span className="tag-purple" style={{ fontSize: '0.68rem', fontWeight: 600, padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                          {c.assignmentCount} Assignment{c.assignmentCount !== 1 ? 's' : ''}
                        </span>
                        <span className="tag-gray" style={{ fontSize: '0.68rem', fontWeight: 500, padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                          {c.enrolledStudents} Student{c.enrolledStudents !== 1 ? 's' : ''} Enrolled
                        </span>
                      </div>
                    </div>

                    <div style={{ flexShrink: 0 }}>
                      {c.isEnrolled ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', fontWeight: 700, color: '#15803d', padding: '0.35rem 0.75rem', borderRadius: '0.375rem', backgroundColor: '#dcfce7' }}>
                          <Check size={14} /> Enrolled
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSelfEnroll(c.id)}
                          disabled={enrollingId === c.id}
                          className="hover-lift"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            color: 'white',
                            backgroundColor: '#191919',
                            padding: '0.4rem 0.875rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            cursor: enrollingId === c.id ? 'not-allowed' : 'pointer',
                            opacity: enrollingId === c.id ? 0.7 : 1,
                          }}
                        >
                          {enrollingId === c.id ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={14} />}
                          Enroll Now
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </Sidebar>
  )
}
