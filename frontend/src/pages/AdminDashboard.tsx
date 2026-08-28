import { useEffect, useState } from 'react'
import apiClient from '../api/client'
import Sidebar from '../components/Sidebar'
import type { Variants } from 'framer-motion'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  Users,
  BookOpen,
  ClipboardList,
  TrendingUp,
  Loader2,
  AlertCircle,
  ShieldCheck,
  GraduationCap,
  Plus,
  X,
  CheckCircle2,
  Clock,
  ChevronRight,
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

interface ProfessorCourse {
  id: number
  title: string
  description: string | null
  enrolledStudents: number
  assignmentCount: number
  created_at: string
}

interface CourseAnalytics {
  courseId: number
  courseTitle: string
  studentCount: number
  completionPct: number
  perAssignment: Array<{
    assignmentId: number
    title: string
    dueDate: string
    enrolledStudents: number
    pending: number
    pendingConfirmation: number
    confirmed: number
    totalGroups: number
  }>
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null)
  const [courses, setCourses] = useState<ProfessorCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Course analytics modal
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics | null>(null)
  const [courseAnalyticsLoading, setCourseAnalyticsLoading] = useState(false)

  // Create course modal
  const [showCreateCourse, setShowCreateCourse] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [creatingCourse, setCreatingCourse] = useState(false)
  const [createCourseError, setCreateCourseError] = useState<string | null>(null)

  async function loadData() {
    try {
      const [analyticsRes, coursesRes] = await Promise.all([
        apiClient.get<AnalyticsOverview>('/analytics/overview'),
        apiClient.get<{ courses: ProfessorCourse[] }>('/courses/mine'),
      ])
      setAnalytics(analyticsRes.data)
      setCourses(coursesRes.data.courses)
    } catch {
      setError('Failed to load analytics and course data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleOpenCourseAnalytics(courseId: number) {
    setSelectedCourseId(courseId)
    setCourseAnalytics(null)
    setCourseAnalyticsLoading(true)
    try {
      const res = await apiClient.get<CourseAnalytics>(`/courses/${courseId}/analytics`)
      setCourseAnalytics(res.data)
    } catch {
      setCourseAnalytics(null)
    } finally {
      setCourseAnalyticsLoading(false)
    }
  }

  async function handleCreateCourse(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) {
      setCreateCourseError('Course title is required.')
      return
    }
    setCreatingCourse(true)
    setCreateCourseError(null)
    try {
      await apiClient.post('/courses', {
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
      })
      setNewTitle('')
      setNewDesc('')
      setShowCreateCourse(false)
      await loadData()
    } catch (err: any) {
      setCreateCourseError(err.response?.data?.error || 'Failed to create course.')
    } finally {
      setCreatingCourse(false)
    }
  }

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
      <div style={{ padding: '1.75rem 1.25rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          style={{
            background: 'linear-gradient(135deg, #1a1565 0%, var(--color-primary) 100%)',
            borderRadius: '1rem',
            padding: '1.75rem 1.5rem',
            marginBottom: '1.75rem',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            boxShadow: '0 8px 24px rgba(26, 21, 101, 0.3)',
          }}
        >
          <div>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', opacity: 0.85 }}>Professor Console</p>
            <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.65rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
              Welcome, {user?.name ?? 'Professor'} 🛡️
            </h1>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.75 }}>{user?.email}</p>
          </div>
          {analytics && (
            <div style={{ textAlign: 'right' }}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1, marginBottom: '0.25rem' }}
              >
                {analytics.overallCompletionRate}%
              </motion.div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Overall Completion</div>
            </div>
          )}
        </motion.div>

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
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
              {statCards.map((s) => (
                <motion.div
                  key={s.id}
                  id={s.id}
                  variants={itemVariants}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  style={{
                    backgroundColor: 'var(--color-surface-container-lowest)',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    border: '1px solid var(--color-outline-variant)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem', backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                    {s.icon}
                  </div>
                  <p style={{ margin: '0 0 0.25rem', fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>{s.value}</p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-on-surface-variant)' }}>{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Courses Overview Section */}
            <motion.div variants={itemVariants} style={{ marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <GraduationCap size={20} color="#7c3aed" />
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-on-surface)', margin: 0 }}>
                    My Courses & Course-Level Analytics
                  </h2>
                </div>
                <button
                  id="btn-create-course"
                  onClick={() => setShowCreateCourse(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.45rem 0.875rem',
                    borderRadius: '0.5rem',
                    backgroundColor: '#7c3aed',
                    color: 'white',
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={15} /> Create Course
                </button>
              </div>

              {courses.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--color-surface-container-lowest)', borderRadius: '0.75rem', border: '1px dashed var(--color-outline-variant)' }}>
                  <GraduationCap size={32} color="var(--color-on-surface-variant)" style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-on-surface-variant)' }}>No courses created yet. Create one to assign course-scoped deliverables.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {courses.map((course) => (
                    <motion.div
                      key={course.id}
                      id={`admin-course-${course.id}`}
                      whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(124, 58, 237, 0.12)' }}
                      onClick={() => handleOpenCourseAnalytics(course.id)}
                      style={{
                        backgroundColor: 'var(--color-surface-container-lowest)',
                        borderRadius: '0.875rem',
                        border: '1px solid var(--color-outline-variant)',
                        padding: '1.25rem',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div>
                          <h3 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                            {course.title}
                          </h3>
                          {course.description && (
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {course.description}
                            </p>
                          )}
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '9999px', backgroundColor: '#ede9fe', color: '#7c3aed', flexShrink: 0 }}>
                          Analytics
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--color-surface-container)' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Users size={13} /> {course.enrolledStudents} student{course.enrolledStudents !== 1 ? 's' : ''}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <BookOpen size={13} /> {course.assignmentCount} assignment{course.assignmentCount !== 1 ? 's' : ''}
                        </span>
                        <ChevronRight size={16} color="#7c3aed" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Per-assignment completion */}
            {analytics.perAssignment.length > 0 && (
              <motion.div
                variants={itemVariants}
                style={{
                  backgroundColor: 'var(--color-surface-container-lowest)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--color-outline-variant)',
                  marginBottom: '1.5rem',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-outline-variant)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={18} color="var(--color-primary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-on-surface)' }}>Platform Completion by Assignment</span>
                </div>
                <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {analytics.perAssignment.map((a) => (
                    <div key={a.assignmentId}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.375rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-on-surface)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '0.75rem' }}>
                          {a.title}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: a.completionRate === 100 ? '#16a34a' : 'var(--color-primary)', flexShrink: 0 }}>
                          {a.confirmedGroups}/{a.totalGroups} groups · {a.completionRate}%
                        </span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'var(--color-surface-container-high)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${a.completionRate}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          style={{
                            height: '100%',
                            borderRadius: '9999px',
                            backgroundColor: a.completionRate === 100 ? '#22c55e' : 'var(--color-primary)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Per-group completion */}
            {analytics.perGroup.length > 0 && (
              <motion.div
                variants={itemVariants}
                style={{
                  backgroundColor: 'var(--color-surface-container-lowest)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--color-outline-variant)',
                  marginBottom: '1.5rem',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-outline-variant)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Users size={18} color="var(--color-secondary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-on-surface)' }}>Completion by Group</span>
                </div>
                <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  {analytics.perGroup.map((g) => (
                    <div key={g.groupId}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.375rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-on-surface)' }}>{g.name}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: g.completionRate === 100 ? '#16a34a' : 'var(--color-secondary)', flexShrink: 0 }}>
                          {g.confirmedAssignments}/{g.totalAssignments} · {g.completionRate}%
                        </span>
                      </div>
                      <div style={{ height: '6px', backgroundColor: 'var(--color-surface-container-high)', borderRadius: '9999px', overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${g.completionRate}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          style={{
                            height: '100%',
                            borderRadius: '9999px',
                            backgroundColor: g.completionRate === 100 ? '#22c55e' : 'var(--color-secondary)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Quick-nav cards */}
            <motion.div
              variants={itemVariants}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}
            >
              {[
                { icon: <BookOpen size={22} color="var(--color-primary)" />, title: 'Manage Assignments', desc: 'Create, edit and assign work.', to: '/admin/assignments', id: 'card-admin-assignments' },
                { icon: <ClipboardList size={22} color="#d97706" />, title: 'Submission Tracker', desc: 'Track all submission statuses.', to: '/admin/submissions', id: 'card-admin-submissions' },
                { icon: <Users size={22} color="var(--color-secondary)" />, title: 'Group Directory', desc: 'View all student groups.', to: '/admin/groups', id: 'card-admin-groups' },
              ].map((card) => (
                <motion.div
                  key={card.id}
                  id={card.id}
                  onClick={() => navigate(card.to)}
                  whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(53,37,205,0.1)', transition: { duration: 0.15 } }}
                  style={{
                    backgroundColor: 'var(--color-surface-container-lowest)',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    border: '1px solid var(--color-outline-variant)',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem', backgroundColor: 'var(--color-surface-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.875rem' }}>
                    {card.icon}
                  </div>
                  <h3 style={{ margin: '0 0 0.375rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>{card.title}</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-on-surface-variant)', lineHeight: 1.5 }}>{card.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        ) : null}
      </div>

      {/* Course Analytics Breakdown Modal */}
      <AnimatePresence>
        {selectedCourseId !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCourseId(null)}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50, backdropFilter: 'blur(4px)' }}
            />
            <div style={{ position: 'fixed', inset: 0, zIndex: 51, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                style={{
                  backgroundColor: 'var(--color-surface-container-lowest)',
                  borderRadius: '1rem',
                  width: '100%',
                  maxWidth: '650px',
                  maxHeight: '90vh',
                  overflowY: 'auto',
                  border: '1px solid var(--color-outline-variant)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                }}
              >
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <GraduationCap size={20} color="#7c3aed" />
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                      Course Analytics Breakdown
                    </h3>
                  </div>
                  <button onClick={() => setSelectedCourseId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)' }}>
                    <X size={20} />
                  </button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                  {courseAnalyticsLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                      <Loader2 size={28} color="#7c3aed" style={{ animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : courseAnalytics ? (
                    <div>
                      <div style={{ marginBottom: '1.25rem' }}>
                        <h4 style={{ margin: '0 0 0.25rem', fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                          {courseAnalytics.courseTitle}
                        </h4>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--color-on-surface-variant)' }}>
                          <span>👥 {courseAnalytics.studentCount} Enrolled Students</span>
                          <span>📊 {courseAnalytics.completionPct}% Overall Completion</span>
                        </div>
                      </div>

                      <h5 style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-on-surface-variant)' }}>
                        Assignments in this Course
                      </h5>

                      {courseAnalytics.perAssignment.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-on-surface-variant)', margin: 0 }}>No assignments attached to this course yet.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                          {courseAnalytics.perAssignment.map((assign) => {
                            const assignPct = assign.totalGroups > 0 ? Math.round((assign.confirmed / assign.totalGroups) * 100) : 0
                            return (
                              <div
                                key={assign.assignmentId}
                                style={{
                                  padding: '1rem',
                                  borderRadius: '0.625rem',
                                  backgroundColor: 'var(--color-surface-container)',
                                  border: '1px solid var(--color-outline-variant)',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.25rem' }}>
                                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-on-surface)' }}>
                                    {assign.title}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: assignPct === 100 ? '#16a34a' : '#7c3aed' }}>
                                    {assign.confirmed}/{assign.totalGroups} Confirmed ({assignPct}%)
                                  </span>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', marginBottom: '0.625rem', flexWrap: 'wrap' }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Clock size={12} color="#d97706" /> Pending: {assign.pending}
                                  </span>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Clock size={12} color="var(--color-primary)" /> Awaiting Confirm: {assign.pendingConfirmation}
                                  </span>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <CheckCircle2 size={12} color="#16a34a" /> Confirmed: {assign.confirmed}
                                  </span>
                                </div>

                                <div style={{ height: '6px', backgroundColor: 'var(--color-surface-container-high)', borderRadius: '9999px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${assignPct}%`, backgroundColor: assignPct === 100 ? '#16a34a' : '#7c3aed', transition: 'width 0.5s' }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--color-error)' }}>Could not load course analytics.</p>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Create Course Modal */}
      <AnimatePresence>
        {showCreateCourse && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateCourse(false)}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 50, backdropFilter: 'blur(4px)' }}
            />
            <div style={{ position: 'fixed', inset: 0, zIndex: 51, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                style={{
                  backgroundColor: 'var(--color-surface-container-lowest)',
                  borderRadius: '1rem',
                  width: '100%',
                  maxWidth: '480px',
                  border: '1px solid var(--color-outline-variant)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                }}
              >
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                    Create New Course
                  </h3>
                  <button onClick={() => setShowCreateCourse(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)' }}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleCreateCourse} style={{ padding: '1.5rem' }}>
                  {createCourseError && (
                    <div style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'var(--color-error-container)', color: 'var(--color-error)', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <AlertCircle size={15} /> {createCourseError}
                    </div>
                  )}

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: '0.375rem' }}>
                      Course Title *
                    </label>
                    <input
                      id="input-course-title"
                      type="text"
                      placeholder="e.g. CS301: Distributed Systems"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.625rem 0.875rem',
                        borderRadius: '0.5rem',
                        border: '1.5px solid var(--color-outline-variant)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-on-surface)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: '0.375rem' }}>
                      Description (Optional)
                    </label>
                    <textarea
                      id="input-course-description"
                      rows={3}
                      placeholder="Brief overview of course topics..."
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.625rem 0.875rem',
                        borderRadius: '0.5rem',
                        border: '1.5px solid var(--color-outline-variant)',
                        backgroundColor: 'var(--color-surface)',
                        color: 'var(--color-on-surface)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowCreateCourse(false)}
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
                      id="btn-submit-course"
                      type="submit"
                      disabled={creatingCourse}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.5rem 1.25rem',
                        borderRadius: '0.5rem',
                        backgroundColor: '#7c3aed',
                        color: 'white',
                        border: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: creatingCourse ? 'not-allowed' : 'pointer',
                        opacity: creatingCourse ? 0.7 : 1,
                      }}
                    >
                      {creatingCourse && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                      Create Course
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </Sidebar>
  )
}
