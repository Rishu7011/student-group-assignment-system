import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
  id: string
}

interface SidebarProps {
  children: React.ReactNode
}

const STUDENT_NAV: NavItem[] = [
  { to: '/student/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard', id: 'nav-student-dashboard' },
  { to: '/student/groups', icon: <Users size={18} />, label: 'My Groups', id: 'nav-student-groups' },
  { to: '/student/assignments', icon: <BookOpen size={18} />, label: 'Assignments', id: 'nav-student-assignments' },
]

const ADMIN_NAV: NavItem[] = [
  { to: '/admin/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard', id: 'nav-admin-dashboard' },
  { to: '/admin/assignments', icon: <BookOpen size={18} />, label: 'Assignments', id: 'nav-admin-assignments' },
  { to: '/admin/submissions', icon: <ClipboardList size={18} />, label: 'Submission Tracker', id: 'nav-admin-submissions' },
  { to: '/admin/groups', icon: <Users size={18} />, label: 'Groups', id: 'nav-admin-groups' },
]

export default function Sidebar({ children }: SidebarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = user?.role === 'admin' ? ADMIN_NAV : STUDENT_NAV

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: 'var(--color-surface-container-low)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        style={{
          width: '240px',
          minHeight: '100vh',
          backgroundColor: 'var(--color-surface-container-lowest)',
          borderRight: '1px solid var(--color-outline-variant)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: '1.25rem 1rem',
            borderBottom: '1px solid var(--color-outline-variant)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
          }}
        >
          <div
            style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <GraduationCap size={16} color="white" />
          </div>
          <div>
            <span
              style={{
                fontWeight: 700,
                fontSize: '1rem',
                color: 'var(--color-on-surface)',
                letterSpacing: '-0.01em',
                display: 'block',
                lineHeight: 1.2,
              }}
            >
              GroupSync
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'var(--color-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {user?.role === 'admin' ? 'Admin' : 'Student'}
            </span>
          </div>
        </div>

        {/* Role badge */}
        {user?.role === 'admin' && (
          <div
            style={{
              margin: '0.75rem 1rem 0',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--color-primary-fixed)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--color-primary)',
            }}
          >
            <ShieldCheck size={14} />
            Administrator
          </div>
        )}

        {/* Nav items */}
        <nav style={{ padding: '0.75rem 0.75rem', flex: 1 }}>
          <p
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--color-on-surface-variant)',
              padding: '0 0.25rem',
              marginBottom: '0.5rem',
            }}
          >
            {user?.role === 'admin' ? 'Management' : 'Navigation'}
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              id={item.id}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.625rem 0.75rem',
                borderRadius: '0.5rem',
                marginBottom: '0.125rem',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--color-primary)' : 'var(--color-on-surface-variant)',
                backgroundColor: isActive ? 'var(--color-primary-fixed)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              })}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                if (!el.getAttribute('aria-current')) {
                  el.style.backgroundColor = 'var(--color-surface-container)'
                  el.style.color = 'var(--color-on-surface)'
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                const isActive = el.getAttribute('aria-current') === 'page'
                if (!isActive) {
                  el.style.backgroundColor = 'transparent'
                  el.style.color = 'var(--color-on-surface-variant)'
                }
              }}
            >
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              <ChevronRight size={14} style={{ opacity: 0.4 }} />
            </NavLink>
          ))}

        </nav>

        {/* User profile + logout */}
        <div
          style={{
            padding: '1rem',
            borderTop: '1px solid var(--color-outline-variant)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              marginBottom: '0.75rem',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              backgroundColor: 'var(--color-surface-container)',
            }}
          >
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                backgroundColor: user?.role === 'admin' ? 'var(--color-primary)' : 'var(--color-primary-fixed)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.8rem',
                color: user?.role === 'admin' ? 'white' : 'var(--color-primary)',
                flexShrink: 0,
              }}
            >
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--color-on-surface)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.name}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.7rem',
                  color: 'var(--color-on-surface-variant)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.email}
              </p>
            </div>
          </div>
          <button
            id="sidebar-logout"
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
              padding: '0.5rem',
              fontSize: '0.8rem',
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
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Page content ─────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {children}
      </main>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
