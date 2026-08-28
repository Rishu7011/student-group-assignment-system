import { useState, useEffect } from 'react'
import apiClient from '../../api/client'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { CheckCircle2, Upload, AlertTriangle, X, Loader2, Check, Lock, FileText, Paperclip } from 'lucide-react'

type SubmissionStatus = 'pending' | 'pending_confirmation' | 'confirmed'

interface SubmissionModalProps {
  isOpen: boolean
  onClose: () => void
  assignmentId: number
  assignmentTitle: string
  groupId: number
  groupName: string
  isLeader?: boolean
  leaderName?: string
  currentStatus: SubmissionStatus
  onStatusChange: (newStatus: SubmissionStatus) => void
}

export default function SubmissionModal({
  isOpen,
  onClose,
  assignmentId,
  assignmentTitle,
  groupId,
  groupName,
  isLeader = true,
  leaderName = 'Leader',
  currentStatus,
  onStatusChange,
}: SubmissionModalProps) {
  const [loading, setLoading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadConfirmed, setUploadConfirmed] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ filename: string; file_url: string; size: number } | null>(null)
  const [finalChecks, setFinalChecks] = useState({
    correct_file: false,
    team_reviewed: false,
    no_more_changes: false,
  })

  const step = currentStatus === 'pending' ? 1 : currentStatus === 'pending_confirmation' ? 2 : 3

  useEffect(() => {
    if (step === 3 && isOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#22c55e', '#3b82f6', '#fbbf24'],
        })
      } catch {
        // Safe fallback if canvas-confetti fails
      }
    }
  }, [step, isOpen])

  const allFinalChecked = Object.values(finalChecks).every(Boolean)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    setError(null)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await apiClient.post<{ file_url: string; filename: string; size: number }>(
        '/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      setUploadedFile({
        filename: res.data.filename,
        file_url: res.data.file_url,
        size: res.data.size,
      })
      setUploadConfirmed(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload file. Please try again.')
    } finally {
      setUploadingFile(false)
    }
  }

  const handleStep1 = async () => {
    setLoading(true)
    setError(null)
    try {
      await apiClient.post(`/submissions/${assignmentId}/step1`, {
        group_id: groupId,
        file_url: uploadedFile?.file_url,
      })
      onStatusChange('pending_confirmation')
    } catch (err: any) {
      const msg = err.response?.data?.error ?? 'Failed to confirm upload. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleStep2 = async () => {
    setLoading(true)
    setError(null)
    try {
      await apiClient.post(`/submissions/${assignmentId}/step2`, {
        group_id: groupId,
        file_url: uploadedFile?.file_url,
      })
      onStatusChange('confirmed')
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.55 },
          colors: ['#4f46e5', '#22c55e', '#3b82f6', '#fbbf24', '#ec4899'],
        })
      } catch {
        // Safe fallback
      }
    } catch (err: any) {
      const msg = err.response?.data?.error ?? 'Final submission failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(5px)',
              zIndex: 50,
            }}
          />

          {/* Modal Container */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 51,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                backgroundColor: 'var(--color-surface-container-lowest)',
                borderRadius: '1rem',
                width: '100%',
                maxWidth: '480px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 100%)',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', marginBottom: '0.25rem' }}>
                    Submission for
                  </p>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: 'white',
                      maxWidth: '340px',
                      lineHeight: 1.3,
                    }}
                  >
                    {assignmentTitle}
                  </h2>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)' }}>
                    {groupName}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    padding: '0.375rem',
                    display: 'flex',
                    color: 'white',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)' }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Step progress indicator */}
              <div
                style={{
                  padding: '0.875rem 1.5rem',
                  backgroundColor: 'var(--color-surface-container)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0',
                }}
              >
                {[
                  { label: 'Upload Confirm', num: 1 },
                  { label: 'Final Confirm', num: 2 },
                  { label: 'Submitted', num: 3 },
                ].map((s, i) => {
                  const done = step > s.num
                  const active = step === s.num
                  return (
                    <div key={s.num} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                        <div
                          style={{
                            width: '1.75rem',
                            height: '1.75rem',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: done ? '#22c55e' : active ? 'var(--color-primary)' : 'var(--color-surface-container-high)',
                            color: done || active ? 'white' : 'var(--color-on-surface-variant)',
                            transition: 'all 0.3s',
                          }}
                        >
                          {done ? <Check size={12} /> : s.num}
                        </div>
                        <span style={{ fontSize: '0.65rem', color: active ? 'var(--color-primary)' : 'var(--color-on-surface-variant)', fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>
                          {s.label}
                        </span>
                      </div>
                      {i < 2 && (
                        <div
                          style={{
                            flex: 1,
                            height: '2px',
                            backgroundColor: done ? '#22c55e' : 'var(--color-outline-variant)',
                            margin: '0 0.25rem',
                            marginBottom: '1.25rem',
                            transition: 'background-color 0.3s',
                          }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Body */}
              <div style={{ padding: '1.5rem' }}>
                {error && (
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      backgroundColor: 'var(--color-error-container)',
                      color: 'var(--color-error)',
                      fontSize: '0.875rem',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <AlertTriangle size={16} />
                    {error}
                  </div>
                )}

                {/* STEP 1 */}
                {step === 1 && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ padding: '0.625rem', borderRadius: '0.625rem', backgroundColor: 'var(--color-primary-fixed)' }}>
                        <Upload size={20} color="var(--color-primary)" />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                          Upload & Confirm Submission
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-on-surface-variant)' }}>
                          Step 1 of 2
                        </p>
                      </div>
                    </div>

                    {/* File Upload Box */}
                    <div
                      style={{
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        border: '2px dashed var(--color-outline-variant)',
                        backgroundColor: 'var(--color-surface-container)',
                        textAlign: 'center',
                        marginBottom: '1rem',
                      }}
                    >
                      <input
                        type="file"
                        id="submission-file-input"
                        accept=".pdf,.doc,.docx,image/*"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                      />

                      {uploadingFile ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem 0', color: 'var(--color-primary)' }}>
                          <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Uploading document...</span>
                        </div>
                      ) : uploadedFile ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0', padding: '0.625rem 0.875rem', borderRadius: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                            <FileText size={18} color="#16a34a" />
                            <div style={{ textAlign: 'left', overflow: 'hidden' }}>
                              <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: '#15803d', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '240px' }}>
                                {uploadedFile.filename}
                              </p>
                              <p style={{ margin: 0, fontSize: '0.7rem', color: '#16a34a' }}>
                                {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to submit
                              </p>
                            </div>
                          </div>
                          <label
                            htmlFor="submission-file-input"
                            style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
                          >
                            Change
                          </label>
                        </div>
                      ) : (
                        <div>
                          <label
                            htmlFor="submission-file-input"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              padding: '0.5rem 1rem',
                              borderRadius: '0.5rem',
                              backgroundColor: 'var(--color-surface-container-lowest)',
                              border: '1px solid var(--color-outline-variant)',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              color: 'var(--color-primary)',
                              cursor: 'pointer',
                              marginBottom: '0.35rem',
                            }}
                          >
                            <Paperclip size={15} /> Choose PDF / Document
                          </label>
                          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--color-on-surface-variant)' }}>
                            Supports PDF, DOC, DOCX, PNG, JPG (up to 15MB)
                          </p>
                        </div>
                      )}
                    </div>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.625rem',
                        border: `2px solid ${uploadConfirmed ? 'var(--color-primary)' : 'var(--color-outline-variant)'}`,
                        backgroundColor: uploadConfirmed ? 'var(--color-primary-fixed)' : 'var(--color-surface-container)',
                        cursor: 'pointer',
                        marginBottom: '1.25rem',
                        transition: 'all 0.2s',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={uploadConfirmed}
                        onChange={(e) => setUploadConfirmed(e.target.checked)}
                        style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.82rem', color: 'var(--color-on-surface)', lineHeight: 1.5 }}>
                        I confirm that our group's submission file is ready and uploaded to OneDrive / in-app.
                      </span>
                    </label>

                    <button
                      id="btn-step1-confirm"
                      onClick={handleStep1}
                      disabled={!uploadConfirmed || loading || uploadingFile}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.625rem',
                        border: 'none',
                        backgroundColor: !uploadConfirmed || loading || uploadingFile ? 'var(--color-surface-container-high)' : 'var(--color-primary)',
                        color: !uploadConfirmed || loading || uploadingFile ? 'var(--color-on-surface-variant)' : 'white',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: !uploadConfirmed || loading || uploadingFile ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s',
                      }}
                    >
                      {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={18} />}
                      {loading ? 'Confirming…' : 'Confirm Upload — Proceed to Step 2'}
                    </button>
                  </motion.div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ padding: '0.625rem', borderRadius: '0.625rem', backgroundColor: '#fef3c7' }}>
                        <AlertTriangle size={20} color="#d97706" />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                          Final Submission Confirmation
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-on-surface-variant)' }}>
                          Step 2 of 2 — This action is irreversible
                        </p>
                      </div>
                    </div>

                    {uploadedFile && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-surface-container)', borderRadius: '0.5rem', marginBottom: '0.75rem', fontSize: '0.78rem', color: 'var(--color-on-surface)' }}>
                        <FileText size={14} color="var(--color-primary)" />
                        <span style={{ fontWeight: 600 }}>Attached file:</span> {uploadedFile.filename}
                      </div>
                    )}

                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '0.625rem',
                        backgroundColor: '#fef3c7',
                        border: '1px solid #fcd34d',
                        fontSize: '0.8rem',
                        color: '#92400e',
                        marginBottom: '1rem',
                        lineHeight: 1.6,
                      }}
                    >
                      ⚠️ Once confirmed, your submission will be <strong>locked</strong>. Confirm all items below before proceeding.
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.25rem' }}>
                      {[
                        { key: 'correct_file', label: 'The correct and final version of our work is attached and uploaded.' },
                        { key: 'team_reviewed', label: 'All team members have reviewed the submission.' },
                        { key: 'no_more_changes', label: 'We understand this submission cannot be changed after confirmation.' },
                      ].map(({ key, label }) => {
                        const checked = finalChecks[key as keyof typeof finalChecks]
                        return (
                          <label
                            key={key}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.75rem',
                              padding: '0.75rem',
                              borderRadius: '0.5rem',
                              border: `1.5px solid ${checked ? '#22c55e' : 'var(--color-outline-variant)'}`,
                              backgroundColor: checked ? '#f0fdf4' : 'var(--color-surface-container)',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setFinalChecks((prev) => ({ ...prev, [key]: e.target.checked }))
                              }
                              style={{ width: '15px', height: '15px', marginTop: '2px', accentColor: '#22c55e', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-on-surface)', lineHeight: 1.5 }}>
                              {label}
                            </span>
                          </label>
                        )
                      })}
                    </div>

                    {!isLeader ? (
                      <div
                        style={{
                          padding: '1rem',
                          borderRadius: '0.625rem',
                          backgroundColor: '#ede9fe',
                          border: '1.5px solid #c4b5fd',
                          marginBottom: '1rem',
                          textAlign: 'center',
                        }}
                      >
                        <p style={{ margin: '0 0 0.25rem', fontWeight: 700, color: '#5b21b6', fontSize: '0.875rem' }}>
                          👑 Group Leader Action Required
                        </p>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#6d28d9', lineHeight: 1.5 }}>
                          Step 1 has been recorded! Only <strong>{leaderName}</strong> (Group Leader) can execute the final Step 2 confirmation on behalf of the group.
                        </p>
                      </div>
                    ) : null}

                    <button
                      id="btn-step2-confirm"
                      onClick={handleStep2}
                      disabled={!allFinalChecked || loading || !isLeader}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '0.625rem',
                        border: 'none',
                        backgroundColor: !allFinalChecked || loading || !isLeader ? 'var(--color-surface-container-high)' : '#16a34a',
                        color: !allFinalChecked || loading || !isLeader ? 'var(--color-on-surface-variant)' : 'white',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: !allFinalChecked || loading || !isLeader ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s',
                      }}
                    >
                      {loading ? (
                        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : !isLeader ? (
                        <Lock size={18} />
                      ) : (
                        <Lock size={18} />
                      )}
                      {loading
                        ? 'Submitting…'
                        : !isLeader
                        ? `Waiting for ${leaderName} to Confirm`
                        : 'Lock In Final Submission'}
                    </button>
                  </motion.div>
                )}

                {/* STEP 3 — Confirmed */}
                {step === 3 && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    style={{ textAlign: 'center', padding: '1rem 0' }}
                  >
                    <div
                      style={{
                        width: '4.5rem',
                        height: '4.5rem',
                        borderRadius: '50%',
                        backgroundColor: '#dcfce7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.25rem',
                        boxShadow: '0 8px 24px rgba(34, 197, 94, 0.25)',
                      }}
                    >
                      <CheckCircle2 size={40} color="#16a34a" />
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', fontWeight: 700, color: '#15803d' }}>
                      Submission Confirmed!
                    </h3>
                    <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', lineHeight: 1.6 }}>
                      Your group's submission for <strong>{assignmentTitle}</strong> has been successfully locked in.
                    </p>

                    {uploadedFile && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'var(--color-surface-container)', borderRadius: '0.5rem', marginBottom: '1.25rem' }}>
                        <FileText size={16} color="var(--color-primary)" />
                        <a
                          href={uploadedFile.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}
                        >
                          View Submitted File ({uploadedFile.filename})
                        </a>
                      </div>
                    )}

                    <div>
                      <button
                        onClick={onClose}
                        style={{
                          padding: '0.625rem 1.75rem',
                          borderRadius: '0.625rem',
                          border: 'none',
                          backgroundColor: 'var(--color-primary)',
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(53, 37, 205, 0.25)',
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
