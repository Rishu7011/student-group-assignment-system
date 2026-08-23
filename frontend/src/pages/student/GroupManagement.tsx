import { useEffect, useState, useRef } from 'react'
import apiClient from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../../components/Sidebar'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Plus,
  X,
  UserPlus,
  UserMinus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Crown,
} from 'lucide-react'

interface Member {
  id: number
  name: string
  email: string
  role: string
  joined_at: string
}

interface Group {
  id: number
  name: string
  created_by: number
  created_at: string
  members: Member[]
}

type Modal = 'none' | 'create' | 'add-member'

export default function GroupManagement() {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<Modal>('none')
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null)

  // Form refs & status
  const groupNameRef = useRef<HTMLInputElement>(null)
  const memberEmailRef = useRef<HTMLInputElement>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  // Delete group confirm
  const [deleteGroupTarget, setDeleteGroupTarget] = useState<Group | null>(null)
  const [deleteGroupLoading, setDeleteGroupLoading] = useState(false)
  const [deleteGroupError, setDeleteGroupError] = useState<string | null>(null)

  // Remove member inline
  const [removingMember, setRemovingMember] = useState<{ groupId: number; userId: number } | null>(null)
  const [removeMemberError, setRemoveMemberError] = useState<string | null>(null)

  async function loadGroups() {
    try {
      const res = await apiClient.get<{ groups: Group[] }>('/groups/mine')
      setGroups(res.data.groups)
    } catch {
      setError('Failed to load groups.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadGroups() }, [])

  function openModal(type: Modal, groupId?: number) {
    setModal(type)
    setSelectedGroupId(groupId ?? null)
    setFormError(null)
    setFormSuccess(null)
  }

  function closeModal() {
    setModal('none')
    setFormError(null)
    setFormSuccess(null)
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault()
    const nameVal = groupNameRef.current?.value.trim() ?? ''
    if (!nameVal) { setFormError('Group name is required.'); return }
    setFormLoading(true)
    setFormError(null)
    try {
      await apiClient.post('/groups', { name: nameVal })
      setFormSuccess('Group created successfully!')
      await loadGroups()
      setTimeout(() => { closeModal() }, 1200)
    } catch (err: any) {
      setFormError(err.response?.data?.error ?? 'Failed to create group.')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    const emailVal = memberEmailRef.current?.value.trim() ?? ''
    if (!emailVal || !selectedGroupId) { setFormError('Email is required.'); return }
    setFormLoading(true)
    setFormError(null)
    try {
      const res = await apiClient.post<{ message: string }>(`/groups/${selectedGroupId}/members`, { email: emailVal })
      setFormSuccess(res.data.message)
      await loadGroups()
      setTimeout(() => { closeModal() }, 1200)
    } catch (err: any) {
      setFormError(err.response?.data?.error ?? 'Failed to add member.')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleRemoveMember(groupId: number, userId: number) {
    setRemovingMember({ groupId, userId })
    setRemoveMemberError(null)
    try {
      await apiClient.delete(`/groups/${groupId}/members/${userId}`)
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, members: g.members.filter((m) => m.id !== userId) }
            : g
        )
      )
    } catch (err: any) {
      setRemoveMemberError(err.response?.data?.error ?? 'Failed to remove member.')
    } finally {
      setRemovingMember(null)
    }
  }

  async function handleDeleteGroup() {
    if (!deleteGroupTarget) return
    setDeleteGroupLoading(true)
    setDeleteGroupError(null)
    try {
      await apiClient.delete(`/groups/${deleteGroupTarget.id}`)
      setGroups((prev) => prev.filter((g) => g.id !== deleteGroupTarget.id))
      if (expandedGroup === deleteGroupTarget.id) setExpandedGroup(null)
      setDeleteGroupTarget(null)
    } catch (err: any) {
      setDeleteGroupError(err.response?.data?.error ?? 'Failed to delete group.')
    } finally {
      setDeleteGroupLoading(false)
    }
  }

  const modalOpen = modal !== 'none'

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    borderRadius: '0.5rem',
    border: '1.5px solid var(--color-outline-variant)',
    fontSize: '0.9rem',
    color: 'var(--color-on-surface)',
    backgroundColor: 'var(--color-surface-container)',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '1.25rem',
  }

  return (
    <Sidebar>
      <div style={{ padding: '1.75rem 1.25rem', maxWidth: '960px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-on-surface)', letterSpacing: '-0.01em' }}>
              My Groups
            </h1>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-on-surface-variant)' }}>
              Manage your study groups and collaborators
            </p>
          </div>
          <button
            id="btn-create-group"
            onClick={() => openModal('create')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.625rem 1.125rem', borderRadius: '0.625rem',
              backgroundColor: 'var(--color-primary)', color: 'white',
              border: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(53,37,205,0.25)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            <Plus size={16} /> New Group
          </button>
        </div>

        {/* Remove member error banner */}
        {removeMemberError && (
          <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: 'var(--color-error-container)', color: 'var(--color-error)', fontSize: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <AlertCircle size={16} /> {removeMemberError}
            <button onClick={() => setRemoveMemberError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex' }}><X size={14} /></button>
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
            <Loader2 size={32} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        ) : error ? (
          <div style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: 'var(--color-error-container)', color: 'var(--color-error)', display: 'flex', gap: '0.5rem' }}>
            <AlertCircle size={18} /> {error}
          </div>
        ) : groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'var(--color-surface-container-lowest)', borderRadius: '1rem', border: '2px dashed var(--color-outline-variant)' }}>
            <Users size={48} color="var(--color-on-surface-variant)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-on-surface)' }}>No Groups Yet</h3>
            <p style={{ margin: '0 0 1.5rem', color: 'var(--color-on-surface-variant)', fontSize: '0.875rem' }}>Create your first study group to get started with assignments.</p>
            <button
              onClick={() => openModal('create')}
              style={{ padding: '0.625rem 1.5rem', borderRadius: '0.625rem', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Create Your First Group
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {groups.map((group) => {
              const isOwner = group.created_by === user?.id
              const isExpanded = expandedGroup === group.id
              return (
                <motion.div
                  key={group.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ backgroundColor: 'var(--color-surface-container-lowest)', borderRadius: '0.75rem', border: '1px solid var(--color-outline-variant)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
                >
                  {/* Group header */}
                  <div
                    style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', flexWrap: 'wrap' }}
                    onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                  >
                    <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.625rem', backgroundColor: 'var(--color-primary-fixed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.125rem', color: 'var(--color-primary)', flexShrink: 0 }}>
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: '160px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>{group.name}</h3>
                        {isOwner && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.1rem 0.4rem', borderRadius: '9999px', backgroundColor: 'var(--color-primary-fixed)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            <Crown size={10} /> Creator
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-on-surface-variant)' }}>
                        {group.members.length} member{group.members.length !== 1 ? 's' : ''} · Created {new Date(group.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        id={`btn-add-member-${group.id}`}
                        onClick={() => openModal('add-member', group.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.625rem', borderRadius: '0.5rem', border: '1px solid var(--color-primary)', backgroundColor: 'var(--color-primary-fixed)', color: 'var(--color-primary)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-primary)'; e.currentTarget.style.color = 'white' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-primary-fixed)'; e.currentTarget.style.color = 'var(--color-primary)' }}
                      >
                        <UserPlus size={13} /> Add
                      </button>
                      {isOwner && (
                        <button
                          id={`btn-delete-group-${group.id}`}
                          onClick={() => { setDeleteGroupTarget(group); setDeleteGroupError(null) }}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.625rem', borderRadius: '0.5rem', border: '1px solid var(--color-outline-variant)', backgroundColor: 'transparent', color: 'var(--color-on-surface-variant)', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-error-container)'; e.currentTarget.style.color = 'var(--color-error)'; e.currentTarget.style.borderColor = 'var(--color-error)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-on-surface-variant)'; e.currentTarget.style.borderColor = 'var(--color-outline-variant)' }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      )}
                      {isExpanded ? <ChevronUp size={18} color="var(--color-on-surface-variant)" /> : <ChevronDown size={18} color="var(--color-on-surface-variant)" />}
                    </div>
                  </div>

                  {/* Expanded member list */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden', borderTop: '1px solid var(--color-outline-variant)', backgroundColor: 'var(--color-surface-container)' }}
                      >
                        <div style={{ padding: '1rem 1.5rem' }}>
                          <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-on-surface-variant)' }}>
                            Members
                          </p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {group.members.map((m) => {
                              const isBeingRemoved = removingMember?.groupId === group.id && removingMember?.userId === m.id
                              const isMemberCreator = m.id === group.created_by
                              const canRemove = isOwner && !isMemberCreator
                              return (
                                <div
                                  key={m.id}
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.875rem', borderRadius: '0.5rem', backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', opacity: isBeingRemoved ? 0.5 : 1, transition: 'opacity 0.2s', flexWrap: 'wrap' }}
                                >
                                  <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', backgroundColor: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                                    {m.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div style={{ flex: 1, minWidth: '140px' }}>
                                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-on-surface)' }}>{m.name}</p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>{m.email}</p>
                                  </div>
                                  {isMemberCreator && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                                      <Crown size={12} /> Creator
                                    </span>
                                  )}
                                  {canRemove && (
                                    <button
                                      id={`btn-remove-member-${group.id}-${m.id}`}
                                      onClick={() => handleRemoveMember(group.id, m.id)}
                                      disabled={isBeingRemoved}
                                      style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.6rem', borderRadius: '0.375rem', border: '1px solid var(--color-outline-variant)', backgroundColor: 'transparent', color: 'var(--color-on-surface-variant)', fontSize: '0.75rem', fontWeight: 500, cursor: isBeingRemoved ? 'not-allowed' : 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
                                      onMouseEnter={(e) => { if (!isBeingRemoved) { e.currentTarget.style.backgroundColor = 'var(--color-error-container)'; e.currentTarget.style.color = 'var(--color-error)'; e.currentTarget.style.borderColor = 'var(--color-error)' } }}
                                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-on-surface-variant)'; e.currentTarget.style.borderColor = 'var(--color-outline-variant)' }}
                                    >
                                      {isBeingRemoved ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <UserMinus size={12} />}
                                      Remove
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Create / Add-Member Modal ──────────────────────────────────────────── */}
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
            <div style={{ position: 'fixed', inset: 0, zIndex: 51, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <motion.div
                initial={{ scale: 0.93, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.93, opacity: 0, y: 15 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                style={{ backgroundColor: 'var(--color-surface-container-lowest)', borderRadius: '1rem', width: '100%', maxWidth: '440px', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}
              >
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    {modal === 'create' ? <Plus size={18} color="var(--color-primary)" /> : <UserPlus size={18} color="var(--color-primary)" />}
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                      {modal === 'create' ? 'Create New Group' : 'Add Member'}
                    </h2>
                  </div>
                  <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)', display: 'flex' }}>
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={modal === 'create' ? handleCreateGroup : handleAddMember} style={{ padding: '1.5rem' }}>
                  {formError && (
                    <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: 'var(--color-error-container)', color: 'var(--color-error)', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <AlertCircle size={16} /> {formError}
                    </div>
                  )}
                  {formSuccess && (
                    <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.875rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <CheckCircle2 size={16} /> {formSuccess}
                    </div>
                  )}

                  {modal === 'create' ? (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: '0.5rem' }}>Group Name</label>
                      <input
                        ref={groupNameRef}
                        id="input-group-name"
                        placeholder="e.g. Team Alpha"
                        autoFocus
                        style={inputStyle}
                        onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }}
                        onBlur={(e) => { e.target.style.borderColor = 'var(--color-outline-variant)' }}
                      />
                    </div>
                  ) : (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: '0.5rem' }}>Student Email Address</label>
                      <input
                        ref={memberEmailRef}
                        id="input-member-email"
                        type="email"
                        placeholder="student@example.com"
                        autoFocus
                        style={inputStyle}
                        onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }}
                        onBlur={(e) => { e.target.style.borderColor = 'var(--color-outline-variant)' }}
                      />
                      <p style={{ margin: '-0.75rem 0 1.25rem', fontSize: '0.8rem', color: 'var(--color-on-surface-variant)' }}>
                        The student must already have a GroupSync account.
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={formLoading}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.625rem', border: 'none', backgroundColor: 'var(--color-primary)', color: 'white', fontSize: '0.9rem', fontWeight: 600, cursor: formLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: formLoading ? 0.7 : 1 }}
                  >
                    {formLoading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                    {modal === 'create' ? 'Create Group' : 'Add Member'}
                  </button>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── Delete Group Confirm Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteGroupTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteGroupTarget(null)}
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
                    <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>Delete Group</h2>
                  </div>
                  <button onClick={() => setDeleteGroupTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-on-surface-variant)', display: 'flex' }}>
                    <X size={20} />
                  </button>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--color-on-surface)' }}>
                    Are you sure you want to delete <strong>&#34;{deleteGroupTarget.name}&#34;</strong>?
                  </p>
                  <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: 'var(--color-on-surface-variant)' }}>
                    This will remove all {deleteGroupTarget.members.length} member{deleteGroupTarget.members.length !== 1 ? 's' : ''} and all related submissions. This action cannot be undone.
                  </p>
                  {deleteGroupError && (
                    <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: 'var(--color-error-container)', color: 'var(--color-error)', fontSize: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                      <AlertCircle size={16} /> {deleteGroupError}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setDeleteGroupTarget(null)}
                      style={{ padding: '0.5rem 1.125rem', borderRadius: '0.5rem', border: '1px solid var(--color-outline-variant)', backgroundColor: 'transparent', color: 'var(--color-on-surface-variant)', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      id="btn-confirm-delete-group"
                      onClick={handleDeleteGroup}
                      disabled={deleteGroupLoading}
                      style={{ padding: '0.5rem 1.125rem', borderRadius: '0.5rem', border: 'none', backgroundColor: 'var(--color-error)', color: 'white', fontSize: '0.875rem', fontWeight: 600, cursor: deleteGroupLoading ? 'not-allowed' : 'pointer', opacity: deleteGroupLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                    >
                      {deleteGroupLoading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                      {deleteGroupLoading ? 'Deleting…' : 'Delete Group'}
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
