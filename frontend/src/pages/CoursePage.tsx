import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiClient from '../api/client'
import Sidebar from '../components/Sidebar'
import { motion, type Variants } from 'framer-motion'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Loader2,
  AlertCircle,
  Users,
} from 'lucide-react'

interface CourseDetail {
  id: number
  title: string
  description: string | null
  professor_name: string
  enrolledStudents: number
  assignments: Assignment[]
}

interface Assignment {
  id: number
  title: string
  description: string | null
  due_date: string
  onedrive_link: string
  assigned_to_type: string
  course_id: number | null
  creator_name: string
  created_at: string
}

function getDeadlineBadge(dueDate: string) {
  const now = new Date()
  const due = new Date(dueDate)
  const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (diffDays < 0) return { label: 'Overdue', color: '#dc2626', bg: '#fee2e2' }
  if (diffDays < 7) return { label: 'Due Soon', color: '#d97706', bg: '#fef3c7' }
  return { label: 'Upcoming', color: '#16a34a', bg: '#dcfce7' }
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: 'easeOut' } },
}

export default function CoursePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    async function load() {
      try {
        const res = await apiClient.get<{ course: CourseDetail }>(`/courses/${id}`)
        setCourse(res.data.course)
      } catch {
        setError('Failed to load course. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  return (
    <Sidebar>
      <div style={{ padding: '1.75rem 1.25rem', maxWidth: '960px', margin: '0 auto', width: '100%' }}>
        {/* Back button */}
        <button
          id="btn-back-dashboard"
          onClick={() => navigate('/student/dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--color-primary)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '1.25rem',
            padding: '0.25rem 0',
          }}
        >
          <ChevronLeft size={16} />
          Back to Dashboard
        </button>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
            <Loader2 size={32} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : error ? (
          <div style={{
            padding: '1rem 1.25rem', borderRadius: '0.75rem',
            backgroundColor: 'var(--color-error-container)', color: 'var(--color-error)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <AlertCircle size={18} /> {error}
          </div>
        ) : course ? (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {/* Course header */}
            <motion.div
              variants={itemVariants}
              style={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 100%)',
                borderRadius: '1rem',
                padding: '1.75rem 1.5rem',
                marginBottom: '1.75rem',
                color: 'white',
                boxShadow: '0 8px 24px rgba(53, 37, 205, 0.22)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
                <BookOpen size={22} />
                <span style={{ fontSize: '0.8rem', opacity: 0.85, fontWeight: 500 }}>Course</span>
              </div>
              <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                {course.title}
              </h1>
              {course.description && (
                <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', opacity: 0.85, lineHeight: 1.5 }}>
                  {course.description}
                </p>
              )}
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', opacity: 0.9 }}>
                  <Users size={14} />
                  {course.enrolledStudents} student{course.enrolledStudents !== 1 ? 's' : ''} enrolled
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', opacity: 0.9 }}>
                  <BookOpen size={14} />
                  {course.assignments.length} assignment{course.assignments.length !== 1 ? 's' : ''}
                </div>
              </div>
            </motion.div>

            {/* Assignments */}
            <motion.div variants={itemVariants}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-on-surface)', margin: '0 0 1rem' }}>
                Assignments
              </h2>

              {course.assignments.length === 0 ? (
                <div style={{
                  backgroundColor: 'var(--color-surface-container)',
                  borderRadius: '0.75rem',
                  padding: '2.5rem',
                  textAlign: 'center',
                  border: '1px dashed var(--color-outline-variant)',
                }}>
                  <BookOpen size={32} color="var(--color-on-surface-variant)" style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                  <p style={{ margin: 0, color: 'var(--color-on-surface-variant)', fontSize: '0.875rem' }}>
                    No assignments in this course yet.
                  </p>
                </div>
              ) : (
                <div style={{
                  backgroundColor: 'var(--color-surface-container-lowest)',
                  borderRadius: '0.75rem',
                  border: '1px solid var(--color-outline-variant)',
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}>
                  {course.assignments.map((a, i) => {
                    const badge = getDeadlineBadge(a.due_date)
                    return (
                      <motion.div
                        key={a.id}
                        id={`course-assignment-${a.id}`}
                        whileHover={{ backgroundColor: 'var(--color-surface-container)' }}
                        transition={{ duration: 0.12 }}
                        onClick={() => navigate(`/student/assignments/${a.id}`)}
                        style={{
                          padding: '1.1rem 1.25rem',
                          borderBottom: i < course.assignments.length - 1 ? '1px solid var(--color-outline-variant)' : 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                            <span style={{
                              padding: '0.15rem 0.5rem',
                              borderRadius: '9999px',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              backgroundColor: badge.bg,
                              color: badge.color,
                            }}>
                              {badge.label}
                            </span>
                          </div>
                          <p style={{
                            margin: '0 0 0.2rem', fontWeight: 600, fontSize: '0.9rem',
                            color: 'var(--color-on-surface)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {a.title}
                          </p>
                          <p style={{
                            margin: 0, fontSize: '0.75rem', color: 'var(--color-on-surface-variant)',
                            display: 'flex', alignItems: 'center', gap: '0.25rem',
                          }}>
                            <CalendarDays size={12} />
                            Due {new Date(a.due_date).toLocaleDateString()}
                          </p>
                        </div>
                        <ChevronRight size={18} color="var(--color-on-surface-variant)" style={{ flexShrink: 0 }} />
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </div>
    </Sidebar>
  )
}
