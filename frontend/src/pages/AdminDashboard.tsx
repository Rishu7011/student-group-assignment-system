import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  GraduationCap,
  BarChart3,
  Users,
  ClipboardList,
  LogOut,
  Bell,
  ShieldCheck,
  BookOpen,
} from 'lucide-react'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-surface-container-low)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Top nav */}
      <header
        style={{
          backgroundColor: 'var(--color-surface-container-lowest)',
          borderBottom: '1px solid var(--color-outline-variant)',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '3.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GraduationCap size={16} color="white" />
          </div>
          <span
            style={{
              fontWeight: 700,
              fontSize: '1.125rem',
              color: 'var(--color-on-surface)',
              letterSpacing: '-0.01em',
            }}
          >
            GroupSync
          </span>
          <span
            style={{
              padding: '0.15rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.7rem',
              fontWeight: 700,
              backgroundColor: 'var(--color-primary-fixed)',
              color: 'var(--color-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Admin
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Bell size={20} color="var(--color-on-surface-variant)" style={{ cursor: 'pointer' }} />
          <div
            style={{
              width: '2.25rem',
              height: '2.25rem',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.875rem',
              color: 'white',
            }}
          >
            {user?.name?.charAt(0).toUpperCase() ?? 'A'}
          </div>
          <button
            id="admin-logout"
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.375rem 0.75rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'var(--color-on-surface-variant)',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-outline-variant)',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-error-container)'
              e.currentTarget.style.color = 'var(--color-error)'
              e.currentTarget.style.borderColor = 'var(--color-error)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--color-on-surface-variant)'
              e.currentTarget.style.borderColor = 'var(--color-outline-variant)'
            }}
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Welcome banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1a1565 0%, var(--color-primary) 100%)',
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem',
            color: 'white',
          }}
        >
          <p style={{ fontSize: '0.875rem', opacity: 0.85, margin: '0 0 0.25rem' }}>
            Admin Console
          </p>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              margin: '0 0 0.5rem',
              letterSpacing: '-0.01em',
            }}
          >
            Welcome, {user?.name ?? 'Admin'} 🛡️
          </h1>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.25rem 0.75rem',
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 500,
            }}
          >
            <ShieldCheck size={14} />
            Administrator
          </div>
        </div>

        {/* Stats Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {[
            { label: 'Total Students', value: '—', color: 'var(--color-primary)' },
            { label: 'Active Groups', value: '—', color: 'var(--color-secondary)' },
            { label: 'Assignments', value: '—', color: 'var(--color-tertiary-container)' },
            { label: 'Submissions', value: '—', color: 'var(--color-outline)' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                backgroundColor: 'var(--color-surface-container-lowest)',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                border: '1px solid var(--color-outline-variant)',
              }}
            >
              <p
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  color: 'var(--color-on-surface-variant)',
                  margin: '0 0 0.375rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {stat.label}
              </p>
              <p
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  color: stat.color,
                  margin: 0,
                }}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Quick-action cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
          }}
        >
          {[
            {
              icon: <BarChart3 size={22} color="var(--color-primary)" />,
              title: 'Analytics Overview',
              desc: 'View cohort statistics and submission rates.',
              id: 'card-analytics',
            },
            {
              icon: <Users size={22} color="var(--color-secondary)" />,
              title: 'Manage Groups',
              desc: 'Create, edit, and assign students to groups.',
              id: 'card-manage-groups',
            },
            {
              icon: <BookOpen size={22} color="var(--color-primary-container)" />,
              title: 'Manage Assignments',
              desc: 'Post new assignments and set deadlines.',
              id: 'card-manage-assignments',
            },
            {
              icon: <ClipboardList size={22} color="var(--color-outline)" />,
              title: 'All Submissions',
              desc: 'Review and grade student submissions.',
              id: 'card-all-submissions',
            },
          ].map((card) => (
            <div
              key={card.id}
              id={card.id}
              style={{
                backgroundColor: 'var(--color-surface-container-lowest)',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                border: '1px solid var(--color-outline-variant)',
                cursor: 'pointer',
                transition: 'box-shadow 0.15s, transform 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  '0 4px 20px rgba(53, 37, 205, 0.12)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div
                style={{
                  width: '2.75rem',
                  height: '2.75rem',
                  borderRadius: '0.625rem',
                  backgroundColor: 'var(--color-surface-container)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                {card.icon}
              </div>
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: 'var(--color-on-surface)',
                  margin: '0 0 0.375rem',
                }}
              >
                {card.title}
              </h3>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--color-on-surface-variant)',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {card.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Phase note */}
        <div
          style={{
            marginTop: '2rem',
            padding: '1rem 1.25rem',
            borderRadius: '0.625rem',
            backgroundColor: 'var(--color-secondary-container)',
            color: 'var(--color-on-secondary-fixed)',
            fontSize: '0.875rem',
            border: '1px solid var(--color-secondary-fixed-dim)',
          }}
        >
          🚧 <strong>Phase 8 coming soon</strong> — Full admin panel with live analytics, group management, and assignment creation tools.
        </div>
      </main>
    </div>
  )
}
