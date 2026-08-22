import { useEffect, useState } from 'react'
import apiClient from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../../components/Sidebar'
import {
  Users,
  Plus,
  X,
  UserPlus,
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

  // Form states
  const [groupName, setGroupName] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

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
    setGroupName('')
    setMemberEmail('')
  }

  function closeModal() {
    setModal('none')
    setFormError(null)
    setFormSuccess(null)
  }

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault()
    if (!groupName.trim()) { setFormError('Group name is required.'); return }
    setFormLoading(true)
    setFormError(null)
    try {
      await apiClient.post('/groups', { name: groupName.trim() })
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
    if (!memberEmail.trim() || !selectedGroupId) { setFormError('Email is required.'); return }
    setFormLoading(true)
    setFormError(null)
    try {
      const res = await apiClient.post<{ message: string }>(`/groups/${selectedGroupId}/members`, { email: memberEmail.trim() })
      setFormSuccess(res.data.message)
      await loadGroups()
      setTimeout(() => { closeModal() }, 1200)
    } catch (err: any) {
      setFormError(err.response?.data?.error ?? 'Failed to add member.')
    } finally {
      setFormLoading(false)
    }
  }

  const modalOpen = modal !== 'none'

  return (
    <Sidebar>
      <div style={{ padding: '2rem 1.75rem', maxWidth: '900px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
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
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.125rem',
              borderRadius: '0.625rem',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            <Plus size={16} />
            New Group
          </button>
        </div>

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
          <div
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              backgroundColor: 'var(--color-surface-container-lowest)',
              borderRadius: '1rem',
              border: '2px dashed var(--color-outline-variant)',
            }}
          >
            <Users size={48} color="var(--color-on-surface-variant)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-on-surface)' }}>
              No Groups Yet
            </h3>
            <p style={{ margin: '0 0 1.5rem', color: 'var(--color-on-surface-variant)', fontSize: '0.875rem' }}>
              Create your first study group to get started with assignments.
            </p>
            <button
              onClick={() => openModal('create')}
              style={{
                padding: '0.625rem 1.5rem',
                borderRadius: '0.625rem',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
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
                    style={{
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      cursor: 'pointer',
                    }}
                    onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                  >
                    <div
                      style={{
                        width: '2.75rem',
                        height: '2.75rem',
                        borderRadius: '0.625rem',
                        backgroundColor: 'var(--color-primary-fixed)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1.125rem',
                        color: 'var(--color-primary)',
                        flexShrink: 0,
                      }}
                    >
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-on-surface)' }}>
                          {group.name}
                        </h3>
                        {isOwner && (
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '9999px',
                              backgroundColor: 'var(--color-primary-fixed)',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              color: 'var(--color-primary)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}
                          >
                            <Crown size={10} /> Creator
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-on-surface-variant)' }}>
                        {group.members.length} member{group.members.length !== 1 ? 's' : ''} · Created {new Date(group.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <button
                        id={`btn-add-member-${group.id}`}
                        onClick={(e) => { e.stopPropagation(); openModal('add-member', group.id) }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.375rem',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '0.5rem',
                          border: '1px solid var(--color-primary)',
                          backgroundColor: 'var(--color-primary-fixed)',
                          color: 'var(--color-primary)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <UserPlus size={14} /> Add Member
                      </button>
                      {isExpanded ? <ChevronUp size={18} color="var(--color-on-surface-variant)" /> : <ChevronDown size={18} color="var(--color-on-surface-variant)" />}
                    </div>
                  </div>

                  {/* Expanded member list */}
                  {isExpanded && (
                    <div
                      style={{
                        borderTop: '1px solid var(--color-outline-variant)',
                        padding: '1rem 1.5rem',
                        backgroundColor: 'var(--color-surface-container)',
                      }}
                    >
                      <p style={{ margin: '0 0 0.75rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-on-surface-variant)' }}>
                        Members
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {group.members.map((m) => (
                          <div
                            key={m.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              padding: '0.625rem 0.875rem',
                              borderRadius: '0.5rem',
                              backgroundColor: 'var(--color-surface-container-lowest)',
                              border: '1px solid var(--color-outline-variant)',
                            }}
                          >
                            <div
                              style={{
                                width: '2rem',
                                height: '2rem',
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-on-surface)' }}>{m.name}</p>
                              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-on-surface-variant)' }}>{m.email}</p>
                            </div>
                            {m.id === group.created_by && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                                <Crown size={12} /> Creator
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────────── */}
      {modalOpen && (
        <>
          <div
            onClick={closeModal}
            style={{
              position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)', zIndex: 50,
            }}
          />
          <div style={{ position: 'fixed', inset: 0, zIndex: 51, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: 'var(--color-surface-container-lowest)',
                borderRadius: '1rem',
                width: '100%',
                maxWidth: '440px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
                overflow: 'hidden',
              }}
            >
              {/* Modal header */}
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid var(--color-outline-variant)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
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

              {/* Modal body */}
              <form
                onSubmit={modal === 'create' ? handleCreateGroup : handleAddMember}
                style={{ padding: '1.5rem' }}
              >
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
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: '0.5rem' }}>
                      Group Name
                    </label>
                    <input
                      id="input-group-name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="e.g. Team Alpha"
                      autoFocus
                      style={{
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
                      }}
                      onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }}
                      onBlur={(e) => { e.target.style.borderColor = 'var(--color-outline-variant)' }}
                    />
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-on-surface)', marginBottom: '0.5rem' }}>
                      Student Email Address
                    </label>
                    <input
                      id="input-member-email"
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="student@example.com"
                      autoFocus
                      style={{
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
                      }}
                      onFocus={(e) => { e.target.style.borderColor = 'var(--color-primary)' }}
                      onBlur={(e) => { e.target.style.borderColor = 'var(--color-outline-variant)' }}
                    />
                    <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: 'var(--color-on-surface-variant)' }}>
                      The student must already have a GroupSync account.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formLoading}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '0.625rem',
                    border: 'none',
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: formLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    opacity: formLoading ? 0.7 : 1,
                  }}
                >
                  {formLoading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                  {modal === 'create' ? 'Create Group' : 'Add Member'}
                </button>
              </form>
            </div>
          </div>
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </Sidebar>
  )
}
