import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiClient from '../../api/client'
import Sidebar from '../../components/Sidebar'
import SubmissionModal from '../../components/student/SubmissionModal'
import gsap from 'gsap'
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
  Crown,
  GraduationCap,
  RotateCcw,
} from 'lucide-react'

type SubmissionStatus = 'pending' | 'pending_confirmation' | 'confirmed'

interface Assignment {
  id: number
  title: string
  description: string | null
  due_date: string
  onedrive_link: string
  assigned_to_type: string
  course_id?: number | null
  course_title?: string
  creator_name: string
  created_at: string
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

  if (diffDays < 0) return { label: 'Overdue', class: 'tag-red', icon: <AlertTriangle size={13} /> }
  if (diffDays < 7) return { label: `Due in ${Math.ceil(diffDays)} days`, class: 'tag-amber', icon: <Clock size={13} /> }
  return { label: `Due in ${Math.ceil(diffDays)} days`, class: 'tag-green', icon: <CalendarDays size={13} /> }
}

export default function AssignmentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [myGroup, setMyGroup] = useState<Group | null>(null)
  const [groupSubs, setGroupSubs] = useState<GroupSubmission[]>([])
  const [isLeader, setIsLeader] = useState(true)
  const [leaderName, setLeaderName] = useState<string>('Leader')
  const [loading, setLoading] = useState(true)
  const [unsubmitting, setUnsubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)

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
        const [subRes, groupDetailRes] = await Promise.all([
          apiClient.get<{ assignments: GroupSubmission[] }>(`/submissions/group/${firstGroup.id}`),
          apiClient.get<{ group: { id: number; name: string; isLeader?: boolean; leader_id?: number; members: Array<{ id: number; name: string; isLeader?: boolean }> } }>(`/groups/${firstGroup.id}`).catch(() => null),
        ])
        setGroupSubs(subRes.data.assignments)
        if (groupDetailRes?.data?.group) {
          const g = groupDetailRes.data.group
          setIsLeader(g.isLeader ?? false)
          const leaderMember = g.members.find((m) => m.isLeader || m.id === g.leader_id)
          if (leaderMember) setLeaderName(leaderMember.name)
        }
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

  // GSAP Entrance
  useEffect(() => {
    if (!loading && contentRef.current) {
      gsap.from('.gsap-assignment-fade', {
        opacity: 0,
        y: 16,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      })
    }
  }, [loading])

  const thisSubmission = groupSubs.find((s) => s.assignment_id === Number(id))
  const currentStatus = (thisSubmission?.status ?? 'pending') as SubmissionStatus

  async function handleUnsubmit() {
    if (!myGroup || !assignment) return
    if (!window.confirm('Retract this submission? Your team will be able to edit, replace files, and re-confirm.')) return

    setUnsubmitting(true)
    try {
      await apiClient.post(`/submissions/${id}/unsubmit`, { group_id: myGroup.id })
      handleStatusChange('pending_confirmation')
      await load()
    } catch (err: any) {
      alert(err.response?.data?.error ?? 'Failed to retract submission.')
    } finally {
      setUnsubmitting(false)
    }
  }

  function handleStatusChange(newStatus: SubmissionStatus) {
    setGroupSubs((prev) => {
      const existing = prev.find((s) => s.assignment_id === Number(id))
      if (existing) {
        return prev.map((s) => s.assignment_id === Number(id) ? { ...s, status: newStatus } : s)
      }
      return [...prev, { assignment_id: Number(id), title: assignment?.title ?? '', due_date: assignment?.due_date ?? '', status: newStatus, confirmed_at: null, confirmed_by_name: null, file_url: null }]
    })
  }

  const deadline = assignment ? getDeadlineMeta(assignment.due_date) : null

  return (
    <Sidebar>
      <div ref={contentRef} style={{ padding: '2rem 1.5rem', maxWidth: '880px', margin: '0 auto', width: '100%' }}>
        {/* Back navigation & breadcrumb */}
        <div className="gsap-assignment-fade" style={{ marginBottom: '1.25rem' }}>
          <button
            onClick={() => navigate('/student/assignments')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.82rem',
              color: 'var(--color-on-surface-variant)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              marginBottom: '0.5rem',
            }}
          >
            <ArrowLeft size={14} /> Back to Assignments
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
            <Loader2 size={32} color="#191919" style={{ animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : error ? (
          <div className="notion-callout" style={{ backgroundColor: 'var(--color-error-container)', color: 'var(--color-error)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <AlertCircle size={18} /> {error}
          </div>
        ) : assignment ? (
          <>
            {/* Notion Style Page Header & Properties Table */}
            <div className="gsap-assignment-fade notion-callout" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '2rem', lineHeight: 1 }}>📄</span>
                <div>
                  <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-on-surface)' }}>
                    {assignment.title}
                  </h1>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-on-surface-variant)' }}>
                    Created by {assignment.creator_name} · Posted on {new Date(assignment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Notion 2-Column Properties Matrix */}
              <div style={{ borderTop: '1px solid #e5e5e0', paddingTop: '1rem', display: 'grid', gridTemplateColumns: '140px 1fr', gap: '0.625rem 1rem', fontSize: '0.85rem', alignItems: 'center' }}>
                <div style={{ color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <GraduationCap size={15} /> Scope
                </div>
                <div>
                  <span className="tag-purple" style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    {assignment.course_title || 'Academic Deliverable'}
                  </span>
                </div>

                <div style={{ color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <CalendarDays size={15} /> Deadline
                </div>
                <div>
                  {deadline && (
                    <span className={deadline.class} style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      {deadline.icon} {new Date(assignment.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} ({deadline.label})
                    </span>
                  )}
                </div>

                <div style={{ color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Users size={15} /> Target
                </div>
                <div>
                  <span className="tag-gray" style={{ fontSize: '0.75rem', fontWeight: 500, padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'capitalize' }}>
                    {assignment.assigned_to_type === 'all' ? 'All Enrolled Groups' : 'Specific Groups'}
                  </span>
                </div>

                <div style={{ color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <FileText size={15} /> Repository
                </div>
                <div>
                  <a
                    id="btn-onedrive-link"
                    href={assignment.onedrive_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover-lift"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.25rem 0.625rem',
                      borderRadius: '4px',
                      backgroundColor: '#f1f1ef',
                      color: '#191919',
                      border: '1px solid #e5e5e0',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Open OneDrive Folder <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>

            {/* Assignment Instructions */}
            {assignment.description && (
              <div className="gsap-assignment-fade notion-callout" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-on-surface-variant)' }}>
                  Instructions & Specifications
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-on-surface)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {assignment.description}
                </p>
              </div>
            )}

            {/* Submission Section */}
            <div
              className="gsap-assignment-fade"
              style={{
                backgroundColor: 'var(--color-surface-container-lowest)',
                borderRadius: '0.75rem',
                border: '1px solid var(--color-outline-variant)',
                padding: '1.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-on-surface)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} color="var(--color-primary)" />
                  Group Deliverable Status
                </h3>
                {myGroup && (
                  <span className="tag-purple" style={{ fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '9999px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Crown size={12} color="#eab308" /> Group Leader: {leaderName}
                  </span>
                )}
              </div>

              {/* Status Banner */}
              {currentStatus === 'confirmed' ? (
                <div style={{ padding: '1rem', borderRadius: '0.5rem', backgroundColor: thisSubmission?.review_status === 'rejected' ? '#fee2e2' : '#dcfce7', border: `1px solid ${thisSubmission?.review_status === 'rejected' ? '#fca5a5' : '#bbf7d0'}`, marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem', color: thisSubmission?.review_status === 'rejected' ? '#991b1b' : '#15803d' }}>
                    {thisSubmission?.review_status === 'rejected' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                    {thisSubmission?.review_status === 'accepted'
                      ? 'Grade: Accepted / Done ✓'
                      : thisSubmission?.review_status === 'rejected'
                      ? 'Submission Rejected by Professor'
                      : 'Confirmed & Submitted — Awaiting Professor Review'}
                  </div>
                  {thisSubmission?.review_feedback && (
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.82rem', color: thisSubmission.review_status === 'rejected' ? '#7f1d1d' : '#166534' }}>
                      Professor Feedback: &ldquo;{thisSubmission.review_feedback}&rdquo;
                    </p>
                  )}
                </div>
              ) : currentStatus === 'pending_confirmation' ? (
                <div style={{ padding: '0.875rem 1rem', borderRadius: '0.5rem', backgroundColor: '#f5f3ff', border: '1px solid #e9d5ff', color: '#6b21a8', marginBottom: '1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} />
                  Step 1 Completed. Ready for Step 2 final confirmation by <strong>{leaderName}</strong> (Group Leader).
                </div>
              ) : null}

              {/* Action Buttons */}
              {!myGroup ? (
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-on-surface-variant)' }}>
                  You must be part of a team to submit deliverables.{' '}
                  <button onClick={() => navigate('/student/groups')} style={{ color: '#6b21a8', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    Create/Join a group →
                  </button>
                </p>
              ) : currentStatus === 'confirmed' && thisSubmission?.review_status !== 'rejected' ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803d', fontWeight: 600, fontSize: '0.875rem' }}>
                    <CheckCircle2 size={18} /> Final submission confirmed on {thisSubmission?.confirmed_at ? new Date(thisSubmission.confirmed_at).toLocaleDateString() : 'file'}.
                  </div>
                  {thisSubmission?.review_status !== 'accepted' && isLeader && (
                    <button
                      id="btn-unsubmit"
                      onClick={handleUnsubmit}
                      disabled={unsubmitting}
                      className="hover-lift"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.375rem',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.375rem',
                        backgroundColor: '#fee2e2',
                        color: '#b91c1c',
                        border: '1px solid #fca5a5',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: unsubmitting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <RotateCcw size={14} />
                      {unsubmitting ? 'Retracting…' : 'Retract & Edit Deliverable'}
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    id="btn-start-submission"
                    onClick={() => setShowModal(true)}
                    className="hover-lift"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      padding: '0.55rem 1.2rem',
                      borderRadius: '0.375rem',
                      backgroundColor: thisSubmission?.review_status === 'rejected' ? '#dc2626' : '#191919',
                      color: 'white',
                      border: 'none',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Send size={15} />
                    {thisSubmission?.review_status === 'rejected'
                      ? 'Resubmit Revision'
                      : currentStatus === 'pending_confirmation'
                      ? isLeader
                        ? 'Step 2: Confirm Final Submission'
                        : `Step 2: View Status (Leader: ${leaderName})`
                      : 'Start Submission (Step 1 & 2)'}
                  </button>
                </div>
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
          isLeader={isLeader}
          leaderName={leaderName}
          currentStatus={currentStatus}
          onStatusChange={handleStatusChange}
        />
      )}
    </Sidebar>
  )
}
