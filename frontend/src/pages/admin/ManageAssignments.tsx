import { useEffect, useState, useCallback, useRef } from 'react'
import apiClient from '../../api/client'
import Sidebar from '../../components/Sidebar'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  CalendarDays,
  ExternalLink,
  Users,
} from 'lucide-react'

interface Assignment {
  id: number
  title: string
  description: string | null
  due_date: string
  onedrive_link: string
  assigned_to_type: 'all' | 'group'
  creator_name: string
  created_at: string
}

interface Group {
  id: number
  name: string
  member_count: number
}

export default function ManageAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Assignment | null>(null)

  // Form input refs
  const titleRef = useRef<HTMLInputElement>(null)
  const descRef = useRef<HTMLTextAreaElement>(null)
  const dueDateRef = useRef<HTMLInputElement>(null)
  const onedriveRef = useRef<HTMLInputElement>(null)
  const [assignedType, setAssignedType] = useState<'all' | 'group'>('all')
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([])

  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 8

  const load = useCallback(async () => {
    try {
      const [aRes, gRes] = await Promise.all([
        apiClient.get<{ assignments: Assignment[] }>('/assignments'),
        apiClient.get<{ groups: Group[] }>('/groups/all'),
      ])
      setAssignments(aRes.data.assignments)
      setGroups(gRes.data.groups)
      setPage(1)
    } catch {
      setError('Failed to load data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setEditing(null)
    setAssignedType('all')
    setSelectedGroupIds([])
    setFormError(null)
    setFormSuccess(null)
    setModalOpen(true)
  }

  function openEdit(a: Assignment) {
    setEditing(a)
    setAssignedType(a.assigned_to_type)
    setSelectedGroupIds([])
    setFormError(null)
    setFormSuccess(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setFormError(null)
    setFormSuccess(null)
  }

  function openDelete(a: Assignment) {
    setDeleteTarget(a)
    setDeleteError(null)
  }

  function closeDelete() {
    setDeleteTarget(null)
    setDeleteError(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      await apiClient.delete(`/assignments/${deleteTarget.id}`)
      setAssignments((prev) => prev.filter((a) => a.id !== deleteTarget.id))
      closeDelete()
    } catch (err: any) {
      setDeleteError(err.response?.data?.error ?? 'Failed to delete assignment.')
    } finally {
      setDeleteLoading(false)
    }
  }

  function toggleGroupId(id: number) {
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const titleVal = titleRef.current?.value.trim() ?? ''
    const descVal = descRef.current?.value.trim() ?? ''
    const dueDateVal = dueDateRef.current?.value ?? ''
    const onedriveVal = onedriveRef.current?.value.trim() ?? ''

    if (!titleVal || !dueDateVal || !onedriveVal) {
      setFormError('Title, due date, and OneDrive link are required.')
      return
    }
    if (assignedType === 'group' && selectedGroupIds.length === 0) {
      setFormError('Select at least one group.')
      return
    }

    setFormLoading(true)
    setFormError(null)

    const payload = {
      title: titleVal,
      description: descVal || undefined,
      due_date: dueDateVal,
      onedrive_link: onedriveVal,
      assigned_to_type: assignedType,
      group_ids: assignedType === 'group' ? selectedGroupIds : undefined,
    }

    try {
      if (editing) {
        await apiClient.put(`/assignments/${editing.id}`, payload)
        setFormSuccess('Assignment updated successfully!')
      } else {
        await apiClient.post('/assignments', payload)
        setFormSuccess('Assignment created successfully!')
      }
      await load()
      setTimeout(() => { closeModal() }, 1200)
    } catch (err: any) {
      setFormError(err.response?.data?.error ?? 'Operation failed.')
    } finally {
      setFormLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    borderRadius: '0.5rem',
    border: '1.5px solid var(--color-outline-variant)',
    fontSize: '0.875rem',
    color: 'var(--color-on-surface)',
    backgroundColor: 'var(--color-surface-container)',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <Sidebar>
      <div style={{ padding: '2rem 1.75rem', maxWidth: '1000px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-on-surface)', letterSpacing: '-0.01em' }}>
              Manage Assignments
            </h1>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-on-surface-variant)' }}>
              Create and edit assignments for student groups
            </p>
          </div>
          <button
            id="btn-new-assignment"
            onClick={openCreate}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.625rem 1.125rem', borderRadius: '0.625rem',
              backgroundColor: 'var(--color-primary)', color: 'white',
              border: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={16} /> New Assignment
          </button>
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
        ) : assignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--color-surface-container-lowest)', borderRadius: '1rem', border: '2px dashed var(--color-outline-variant)' }}>
            <BookOpen size={40} style={{ marginBottom: '1rem', opacity: 0.5, color: 'var(--color-on-surface-variant)' }} />
            <p style={{ color: 'var(--color-on-surface-variant)', margin: '0 0 1.25rem', fontSize: '0.9rem' }}>No assignments created yet.</p>
            <button onClick={openCreate} style={{ padding: '0.625rem 1.5rem', borderRadius: '0.625rem', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}>
              Create First Assignment
            </button>
          </div>
        ) : (
          (() => {
            const totalPages = Math.max(1, Math.ceil(assignments.length / PAGE_SIZE))
            const paged = assignments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {paged.map((a) => {
              const due = new Date(a.due_date)
              const isOverdue = due < new Date()
              return (
                <div
                  key={a.id}
                  style={{
                    backgroundColor: 'var(--color-surface-container-lowest)',
                    borderRadius: '0.75rem',
                    border: '1px solid var(--color-outline-variant)',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem', backgroundColor: 'var(--color-primary-fixed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BookOpen size={20} color="var(--color-primary)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>{a.title}</h3>
                      <span style={{ padding: '0.1rem 0.5rem', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 600, backgroundColor: a.assigned_to_type === 'all' ? 'var(--color-secondary-container)' : 'var(--color-primary-fixed)', color: a.assigned_to_type === 'all' ? 'var(--color-secondary)' : 'var(--color-primary)', textTransform: 'capitalize' }}>
                        {a.assigned_to_type === 'all' ? 'All Groups' : 'Selected Groups'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', color: isOverdue ? '#dc2626' : 'var(--color-on-surface-variant)', fontWeight: isOverdue ? 600 : 400 }}>
                        <CalendarDays size={13} /> {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {isOverdue && ' (Overdue)'}
                      </span>
                      <a href={a.onedrive_link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.78rem', color: 'var(--color-primary)', textDecoration: 'none' }}>
                        <ExternalLink size={12} /> OneDrive
                      </a>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-on-surface-variant)' }}>By {a.creator_name}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                      id={`btn-edit-assignment-${a.id}`}
                      onClick={() => openEdit(a)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        padding: '0.375rem 0.75rem', borderRadius: '0.5rem',
                        border: '1px solid var(--color-outline-variant)',
                        backgroundColor: 'transparent', color: 'var(--color-on-surface-variant)',
                        fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-primary-fixed)'; e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-on-surface-variant)'; e.currentTarget.style.borderColor = 'var(--color-outline-variant)' }}
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button
                      id={`btn-delete-assignment-${a.id}`}
                      onClick={() => openDelete(a)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        padding: '0.375rem 0.75rem', borderRadius: '0.5rem',
                        border: '1px solid var(--color-outline-variant)',
                        backgroundColor: 'transparent', color: 'var(--color-on-surface-variant)',
                        fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-error-container)'; e.currentTarget.style.color = 'var(--color-error)'; e.currentTarget.style.borderColor = 'var(--color-error)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-on-surface-variant)'; e.currentTarget.style.borderColor = 'var(--color-outline-variant)' }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              )
                })}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', padding: '0.75rem 1rem', backgroundColor: 'var(--color-surface-container-lowest)', borderRadius: '0.75rem', border: '1px solid var(--color-outline-variant)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-on-surface-variant)' }}>
                      Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, assignments.length)} of {assignments.length}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button id="btn-prev-page" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '0.375rem 0.875rem', borderRadius: '0.5rem', border: '1px solid var(--color-outline-variant)', backgroundColor: 'transparent', color: 'var(--color-on-surface)', fontSize: '0.8rem', fontWeight: 500, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>← Prev</button>
                      <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)', padding: '0 0.5rem' }}>{page} / {totalPages}</span>
                      <button id="btn-next-page" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '0.375rem 0.875rem', borderRadius: '0.5rem', border: '1px solid var(--color-outline-variant)', backgroundColor: 'transparent', color: 'var(--color-on-surface)', fontSize: '0.8rem', fontWeight: 500, cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.5 : 1 }}>Next →</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })()
        )}
      </div>

      {/* ── Create/Edit Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 50 }}
            />
            <div style={{ position: 'fixed', inset: 0, zIndex: 51, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}>
              <motion.div
                initial={{ scale: 0.93, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.93, opacity: 0, y: 15 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                style={{ backgroundColor: 'var(--color-surface-container-lowest)', borderRadius: '1rem', width: '100%', maxWidth: '540px', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', overflow: 'hidden', margin: 'auto' }}
              >
                {/* Modal header */}
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    {editing ? <Edit2 size={18} color="var(--color-primary)" /> : <Plus size={18} color="var(--color-primary)" />}
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                      {editing ? 'Edit Assignment' : 'Create Assignment'}
                    </h2>
                  </div>
                  <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)', display: 'flex' }}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {formError && (
                    <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: 'var(--color-error-container)', color: 'var(--color-error)', fontSize: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <AlertCircle size={16} /> {formError}
                    </div>
                  )}
                  {formSuccess && (
                    <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <CheckCircle2 size={16} /> {formSuccess}
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: '0.375rem' }}>Title *</label>
                    <input ref={titleRef} id="input-title" defaultValue={editing?.title ?? ''} placeholder="Assignment title" style={inputStyle} onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }} onBlur={(e) => { e.target.style.borderColor = 'var(--color-outline-variant)' }} />
                  </div>

                  {/* Description */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: '0.375rem' }}>Description</label>
                    <textarea ref={descRef} id="input-description" defaultValue={editing?.description ?? ''} placeholder="Optional description..." rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'var(--font-sans)' }} onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }} onBlur={(e) => { e.target.style.borderColor = 'var(--color-outline-variant)' }} />
                  </div>

                  {/* Due date + OneDrive side by side */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: '0.375rem' }}>Due Date *</label>
                      <input ref={dueDateRef} id="input-due-date" type="date" defaultValue={editing ? editing.due_date.split('T')[0] : ''} style={inputStyle} onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }} onBlur={(e) => { e.target.style.borderColor = 'var(--color-outline-variant)' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: '0.375rem' }}>Assign To *</label>
                      <select id="input-assign-type" value={assignedType} onChange={(e) => { setAssignedType(e.target.value as 'all' | 'group'); setSelectedGroupIds([]) }} style={{ ...inputStyle, cursor: 'pointer' }}>
                        <option value="all">All Groups</option>
                        <option value="group">Specific Groups</option>
                      </select>
                    </div>
                  </div>

                  {/* OneDrive link */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: '0.375rem' }}>OneDrive Link *</label>
                    <input ref={onedriveRef} id="input-onedrive" type="url" defaultValue={editing?.onedrive_link ?? ''} placeholder="https://onedrive.live.com/..." style={inputStyle} onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }} onBlur={(e) => { e.target.style.borderColor = 'var(--color-outline-variant)' }} />
                  </div>

                  {/* Group multi-select */}
                  {assignedType === 'group' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: '0.5rem' }}>
                        Select Groups * <span style={{ fontWeight: 400, color: 'var(--color-on-surface-variant)' }}>({selectedGroupIds.length} selected)</span>
                      </label>
                      <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.375rem', padding: '0.5rem', backgroundColor: 'var(--color-surface-container)', borderRadius: '0.5rem', border: '1.5px solid var(--color-outline-variant)' }}>
                        {groups.length === 0 ? (
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-on-surface-variant)', textAlign: 'center', padding: '1rem' }}>No groups found</p>
                        ) : groups.map((g) => {
                          const selected = selectedGroupIds.includes(g.id)
                          return (
                            <label
                              key={g.id}
                              style={{
                                display: 'flex', alignItems: 'center', gap: '0.625rem',
                                padding: '0.5rem 0.625rem', borderRadius: '0.375rem',
                                cursor: 'pointer',
                                backgroundColor: selected ? 'var(--color-primary-fixed)' : 'transparent',
                                transition: 'background 0.15s',
                              }}
                            >
                              <input type="checkbox" checked={selected} onChange={() => toggleGroupId(g.id)} style={{ accentColor: 'var(--color-primary)', cursor: 'pointer' }} />
                              <span style={{ fontSize: '0.85rem', fontWeight: selected ? 600 : 400, color: selected ? 'var(--color-primary)' : 'var(--color-on-surface)' }}>
                                {g.name}
                              </span>
                              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--color-on-surface-variant)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <Users size={12} /> {g.member_count}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={formLoading} style={{ padding: '0.75rem', borderRadius: '0.625rem', border: 'none', backgroundColor: 'var(--color-primary)', color: 'white', fontSize: '0.9rem', fontWeight: 600, cursor: formLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: formLoading ? 0.7 : 1, marginTop: '0.25rem' }}>
                    {formLoading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                    {editing ? 'Update Assignment' : 'Create Assignment'}
                  </button>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDelete}
              style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 50 }}
            />
            <div style={{ position: 'fixed', inset: 0, zIndex: 51, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <motion.div
                initial={{ scale: 0.93, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.93, opacity: 0, y: 15 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                style={{ backgroundColor: 'var(--color-surface-container-lowest)', borderRadius: '1rem', width: '100%', maxWidth: '420px', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}
              >
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <Trash2 size={18} color="var(--color-error)" />
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>Delete Assignment</h2>
                  </div>
                  <button onClick={closeDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)', display: 'flex' }}>
                    <X size={20} />
                  </button>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--color-on-surface)' }}>
                    Are you sure you want to delete <strong>&#34;{deleteTarget.title}&#34;</strong>?
                  </p>
                  <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: 'var(--color-on-surface-variant)' }}>
                    This will permanently remove the assignment and all related submissions. This action cannot be undone.
                  </p>
                  {deleteError && (
                    <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: 'var(--color-error-container)', color: 'var(--color-error)', fontSize: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                      <AlertCircle size={16} /> {deleteError}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={closeDelete}
                      style={{ padding: '0.5rem 1.125rem', borderRadius: '0.5rem', border: '1px solid var(--color-outline-variant)', backgroundColor: 'transparent', color: 'var(--color-on-surface-variant)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-confirm-delete"
                      onClick={handleDelete}
                      disabled={deleteLoading}
                      style={{ padding: '0.5rem 1.125rem', borderRadius: '0.5rem', border: 'none', backgroundColor: 'var(--color-error)', color: 'white', fontSize: '0.875rem', fontWeight: 600, cursor: deleteLoading ? 'not-allowed' : 'pointer', opacity: deleteLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                    >
                      {deleteLoading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                      {deleteLoading ? 'Deleting…' : 'Delete Assignment'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </Sidebar>
  )
}
