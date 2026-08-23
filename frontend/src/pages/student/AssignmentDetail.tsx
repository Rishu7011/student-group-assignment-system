import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiClient from '../../api/client'
import Sidebar from '../../components/Sidebar'
import SubmissionModal from '../../components/student/SubmissionModal'
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2,
  AlertCircle,
  FileText,
  Send,
} from 'lucide-react'

type SubmissionStatus = 'pending' | 'pending_confirmation' | 'confirmed'

interface Assignment {
  id: number
  title: string
  description: string | null
  due_date: string
  onedrive_link: string
  assigned_to_type: string
  creator_name: string
  created_at: string
  targeted_groups?: Array<{ id: number; name: string }>
}

interface GroupSubmission {
  assignment_id: number
  title: string
  due_date: string
  status: string
  confirmed_at: string | null
  confirmed_by_name: string | null
  file_url: string | null
  review_status?: 'pending' | 'accepted' | 'rejected' | null
  review_feedback?: string | null
  reviewed_at?: string | null
  reviewed_by_name?: string | null
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

  if (diffDays < 0) return { label: 'Overdue', color: '#dc2626', bg: '#fee2e2', icon: <AlertTriangle size={14} /> }
  if (diffDays < 7) return { label: `Due in ${Math.ceil(diffDays)} day${Math.ceil(diffDays) !== 1 ? 's' : ''}`, color: '#d97706', bg: '#fef3c7', icon: <Clock size={14} /> }
  return { label: `Due in ${Math.ceil(diffDays)} days`, color: '#16a34a', bg: '#dcfce7', icon: <CalendarDays size={14} /> }
}

export default function AssignmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [myGroup, setMyGroup] = useState<Group | null>(null)
  const [groupSubs, setGroupSubs] = useState<GroupSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  async function load() {
    try {
      const [assignRes, groupRes] = await Promise.all([
        apiClient.get<{ assignment: Assignment }>(`/assignments/${id}`),
        apiClient.get<{ groups: Group[] }>('/groups/mine'),
      ])
      setAssignment(assignRes.data.assignment)
      const firstGroup = groupRes.data.groups[0] ?? null
      setMyGroup(firstGroup)
      if (firstGroup) {
        const subRes = await apiClient.get<{ assignments: GroupSubmission[] }>(`/submissions/group/${firstGroup.id}`)
        setGroupSubs(subRes.data.assignments)
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('You do not have access to this assignment.')
      } else if (err.response?.status === 404) {
        setError('Assignment not found.')
      } else {
        setError('Failed to load assignment details.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  const thisSubmission = groupSubs.find((s) => s.assignment_id === Number(id))
  const currentStatus = (thisSubmission?.status ?? 'pending') as SubmissionStatus

  function handleStatusChange(newStatus: SubmissionStatus) {
    setGroupSubs((prev) => {
      const existing = prev.find((s) => s.assignment_id === Number(id))
      if (existing) {
        return prev.map((s) => s.assignment_id === Number(id) ? { ...s, status: newStatus } : s)
      }
      return [...prev, { assignment_id: Number(id), title: assignment?.title ?? '', due_date: assignment?.due_date ?? '', status: newStatus, confirmed_at: null, confirmed_by_name: null, file_url: null }]
    })
  }

  const stepPct = currentStatus === 'confirmed' ? 100 : currentStatus === 'pending_confirmation' ? 50 : 0
  const deadline = assignment ? getDeadlineMeta(assignment.due_date) : null

  return (
    <Sidebar>
      <div style={{ padding: '2rem 1.75rem', maxWidth: '800px' }}>
        {/* Back button */}
        <button
          onClick={() => navigate('/student/assignments')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.875rem',
            color: 'var(--color-on-surface-variant)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            marginBottom: '1.5rem',
            padding: 0,
          }}
        >
          <ArrowLeft size={16} /> Back to Assignments
        </button>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
            <Loader2 size={32} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : error ? (
          <div style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: 'var(--color-error-container)', color: 'var(--color-error)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <AlertCircle size={18} /> {error}
          </div>
        ) : assignment ? (
          <>
            {/* Assignment card */}
            <div
              style={{
                backgroundColor: 'var(--color-surface-container-lowest)',
                borderRadius: '1rem',
                border: '1px solid var(--color-outline-variant)',
                overflow: 'hidden',
                marginBottom: '1.5rem',
              }}
            >
              {/* Header gradient */}
              <div
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 100%)',
                  padding: '1.75rem 2rem',
                  color: 'white',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', opacity: 0.75 }}>Assignment</p>
                    <h1 style={{ margin: '0 0 0.75rem', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                      {assignment.title}
                    </h1>
                    {deadline && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          backgroundColor: deadline.bg,
                          color: deadline.color,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        {deadline.icon} {deadline.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div style={{ padding: '1.5rem 2rem' }}>
                {assignment.description && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-on-surface-variant)' }}>
                      Description
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-on-surface)', lineHeight: 1.7 }}>
                      {assignment.description}
                    </p>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-on-surface-variant)' }}>
                      Due Date
                    </p>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-on-surface)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      <CalendarDays size={16} color="var(--color-primary)" />
                      {new Date(assignment.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-on-surface-variant)' }}>
                      Posted By
                    </p>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-on-surface)' }}>
                      {assignment.creator_name}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-on-surface-variant)' }}>
                      Target
                    </p>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-on-surface)', display: 'flex', alignItems: 'center', gap: '0.375rem', textTransform: 'capitalize' }}>
                      <Users size={14} color="var(--color-primary)" />
                      {assignment.assigned_to_type === 'all' ? 'All Groups' : 'Specific Groups'}
                    </p>
                  </div>
                </div>

                {/* OneDrive link button */}
                <a
                  id="btn-onedrive-link"
                  href={assignment.onedrive_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 1.25rem',
                    borderRadius: '0.625rem',
                    backgroundColor: 'var(--color-primary-fixed)',
                    color: 'var(--color-primary)',
                    border: '1px solid var(--color-primary)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary)'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-primary-fixed)'
                    e.currentTarget.style.color = 'var(--color-primary)'
                  }}
                >
                  <FileText size={16} />
                  Open OneDrive Folder
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Submission status card */}
            <div
              style={{
                backgroundColor: 'var(--color-surface-container-lowest)',
                borderRadius: '1rem',
                border: `1px solid ${currentStatus === 'confirmed' ? '#bbf7d0' : 'var(--color-outline-variant)'}`,
                padding: '1.5rem',
              }}
            >
              <h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                Your Group's Submission
                {myGroup && (
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', fontWeight: 500, color: 'var(--color-on-surface-variant)' }}>
                    — {myGroup.name}
                  </span>
                )}
              </h3>

              {/* Progress track */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
                {[
                  { label: 'Not Started', pct: 0 },
                  { label: 'Step 1 Done', pct: 50 },
                  { label: 'Confirmed', pct: 100 },
                ].map((step) => {
                  const active = stepPct === step.pct
                  const done = stepPct > step.pct
                  return (
                    <div key={step.pct} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flex: step.pct < 100 ? 1 : 'none' }}>
                      <div
                        style={{
                          width: '1.5rem',
                          height: '1.5rem',
                          borderRadius: '50%',
                          backgroundColor: done || active ? (step.pct === 100 ? '#22c55e' : 'var(--color-primary)') : 'var(--color-surface-container-high)',
                          border: active && step.pct !== 100 ? '3px solid var(--color-primary)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.3s',
                        }}
                      >
                        {(done || active) && (
                          step.pct === 100 ? <CheckCircle2 size={12} color="white" /> : <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white' }} />
                        )}
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: active ? 700 : 400, color: active ? 'var(--color-on-surface)' : 'var(--color-on-surface-variant)', whiteSpace: 'nowrap' }}>
                        {step.label}
                      </span>
                      {step.pct < 100 && (
                        <div style={{ flex: 1, height: '2px', backgroundColor: stepPct > step.pct ? 'var(--color-primary)' : 'var(--color-outline-variant)', borderRadius: '9999px' }} />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Status summary */}
              {currentStatus === 'confirmed' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {/* Professor Review Verdict */}
                  {thisSubmission?.review_status === 'accepted' ? (
                    <div style={{ padding: '0.875rem 1rem', borderRadius: '0.625rem', backgroundColor: '#dcfce7', border: '1.5px solid #86efac', color: '#15803d' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem' }}>
                        <CheckCircle2 size={18} />
                        Graded: Done / Accepted ✓
                      </div>
                      {thisSubmission.review_feedback && (
                        <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#166534' }}>
                          Professor feedback: "{thisSubmission.review_feedback}"
                        </p>
                      )}
                    </div>
                  ) : thisSubmission?.review_status === 'rejected' ? (
                    <div style={{ padding: '0.875rem 1rem', borderRadius: '0.625rem', backgroundColor: '#fee2e2', border: '1.5px solid #fca5a5', color: '#991b1b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem' }}>
                        <AlertTriangle size={18} />
                        Submission Rejected by Professor
                      </div>
                      <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#7f1d1d' }}>
                        Reason: "{thisSubmission.review_feedback || 'Please review requirements and resubmit'}"
                      </p>
                      <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#991b1b', fontWeight: 600 }}>
                        Your group can upload a revised document below and resubmit.
                      </p>
                    </div>
                  ) : (
                    <div style={{ padding: '0.75rem 1rem', borderRadius: '0.625rem', backgroundColor: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={16} />
                      Submitted & locked — Awaiting professor review
                    </div>
                  )}

                  {/* Submission details */}
                  {thisSubmission?.confirmed_at && (
                    <div style={{ padding: '0.625rem 0.875rem', borderRadius: '0.5rem', backgroundColor: 'var(--color-surface-container)', fontSize: '0.82rem', color: 'var(--color-on-surface-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        Confirmed {new Date(thisSubmission.confirmed_at).toLocaleDateString()}
                        {thisSubmission.confirmed_by_name && ` by ${thisSubmission.confirmed_by_name}`}
                      </div>
                      {thisSubmission.file_url && (
                        <a
                          href={thisSubmission.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'underline' }}
                        >
                          📄 View submitted file
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action button */}
              {!myGroup ? (
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-on-surface-variant)' }}>
                  You must be in a group to submit. <button onClick={() => navigate('/student/groups')} style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Create a group →</button>
                </p>
              ) : currentStatus === 'confirmed' && thisSubmission?.review_status !== 'rejected' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: thisSubmission?.review_status === 'accepted' ? '#15803d' : 'var(--color-on-surface-variant)', fontWeight: 600, fontSize: '0.875rem' }}>
                  <CheckCircle2 size={18} /> {thisSubmission?.review_status === 'accepted' ? 'Assignment marked as completed' : 'Submission locked'}
                </div>
              ) : (
                <button
                  id="btn-start-submission"
                  onClick={() => setShowModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '0.625rem',
                    backgroundColor: thisSubmission?.review_status === 'rejected' ? '#dc2626' : 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
                >
                  <Send size={16} />
                  {thisSubmission?.review_status === 'rejected'
                    ? 'Resubmit Revision (Step 1 & 2)'
                    : currentStatus === 'pending_confirmation'
                    ? 'Continue Submission (Step 2)'
                    : 'Start Submission'}
                </button>
              )}
            </div>
          </>
        ) : null}
      </div>

      {/* Submission Modal */}
      {assignment && myGroup && (
        <SubmissionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          assignmentId={assignment.id}
          assignmentTitle={assignment.title}
          groupId={myGroup.id}
          groupName={myGroup.name}
          currentStatus={currentStatus}
          onStatusChange={handleStatusChange}
        />
      )}
    </Sidebar>
  )
}
