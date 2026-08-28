import { useState, useEffect } from 'react'
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
  Menu,
  ChevronLeft,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from './ui/sheet'

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

  // Collapsed state stored in localStorage
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sgas_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem('sgas_sidebar_collapsed', String(collapsed))
    } catch {
      // ignore
    }
  }, [collapsed])

  const navItems = user?.role === 'admin' ? ADMIN_NAV : STUDENT_NAV

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const renderNavContent = (isDrawer = false) => {
    const isIconOnly = collapsed && !isDrawer

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
        {/* Brand Header */}
        <div
          style={{
            padding: isIconOnly ? '1rem 0' : '1.15rem 1rem',
            borderBottom: '1px solid #e5e5e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isIconOnly ? 'center' : 'space-between',
            minHeight: '64px',
          }}
        >
          {isIconOnly ? (
            /* Collapsed Header: Centered Toggle Logo Button */
            <button
              id="btn-expand-sidebar"
              title="Click to expand sidebar"
              aria-label="Click to expand sidebar"
              onClick={() => setCollapsed(false)}
              className="hover-lift"
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '0.375rem',
                backgroundColor: '#191919',
                color: 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <GraduationCap size={17} color="white" />
            </button>
          ) : (
            /* Expanded Header: Brand Title + Clean Collapse Icon */
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
                <div
                  style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '0.375rem',
                    backgroundColor: '#191919',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <GraduationCap size={16} color="white" />
                </div>
                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: '#191919',
                      letterSpacing: '-0.01em',
                      display: 'block',
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    GroupSync
                  </span>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      color: '#6b6b66',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Academic Hub
                  </span>
                </div>
              </div>

              {!isDrawer && (
                <button
                  id="btn-collapse-sidebar"
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                  onClick={() => setCollapsed(true)}
                  style={{
                    background: '#f1f1ef',
                    border: '1px solid #e5e5e0',
                    color: '#6b6b66',
                    cursor: 'pointer',
                    width: '1.75rem',
                    height: '1.75rem',
                    borderRadius: '0.375rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#e5e5e0'
                    e.currentTarget.style.color = '#191919'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f1ef'
                    e.currentTarget.style.color = '#6b6b66'
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
              )}
            </>
          )}
        </div>

        {/* Role badge */}
        {user?.role === 'admin' && (
          <div
            style={{
              margin: isIconOnly ? '0.75rem 0.5rem 0' : '0.75rem 0.875rem 0',
              padding: isIconOnly ? '0.45rem 0' : '0.4rem 0.625rem',
              borderRadius: '0.375rem',
              backgroundColor: '#f1f1ef',
              border: '1px solid #e5e5e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: isIconOnly ? 'center' : 'flex-start',
              gap: '0.5rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#191919',
            }}
            title={isIconOnly ? 'Administrator / Professor' : undefined}
          >
            <ShieldCheck size={14} color="#6b21a8" />
            {!isIconOnly && <span>Administrator / Professor</span>}
          </div>
        )}

        {/* Navigation list */}
        <nav style={{ padding: isIconOnly ? '0.75rem 0.5rem' : '0.75rem 0.75rem', flex: 1, overflowY: 'auto' }}>
          {!isIconOnly && (
            <p
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#6b6b66',
                padding: '0 0.25rem',
                marginBottom: '0.5rem',
              }}
            >
              {user?.role === 'admin' ? 'Management' : 'Navigation'}
            </p>
          )}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              id={item.id}
              onClick={() => isDrawer && setMobileOpen(false)}
              title={isIconOnly ? item.label : undefined}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: isIconOnly ? 'center' : 'flex-start',
                gap: '0.625rem',
                padding: isIconOnly ? '0.65rem 0' : '0.55rem 0.75rem',
                borderRadius: '0.375rem',
                marginBottom: '0.25rem',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#191919' : '#6b6b66',
                backgroundColor: isActive ? '#f1f1ef' : 'transparent',
                border: isActive ? '1px solid #e5e5e0' : '1px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.15s',
              })}
              onMouseEnter={(e) => {
                const el = e.currentTarget
                if (!el.getAttribute('aria-current')) {
                  el.style.backgroundColor = '#f7f7f5'
                  el.style.color = '#191919'
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget
                const isActive = el.getAttribute('aria-current') === 'page'
                if (!isActive) {
                  el.style.backgroundColor = 'transparent'
                  el.style.color = '#6b6b66'
                }
              }}
            >
              {item.icon}
              {!isIconOnly && <span style={{ flex: 1 }}>{item.label}</span>}
              {!isIconOnly && <ChevronRight size={14} style={{ opacity: 0.3 }} />}
            </NavLink>
          ))}
        </nav>

        {/* User profile + sign out footer */}
        <div
          style={{
            padding: isIconOnly ? '0.75rem 0.5rem' : '0.875rem',
            borderTop: '1px solid #e5e5e0',
            backgroundColor: '#fcfcfb',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isIconOnly ? 'center' : 'stretch',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isIconOnly ? 'center' : 'flex-start',
              gap: '0.625rem',
              marginBottom: '0.75rem',
              padding: isIconOnly ? '0' : '0.4rem',
              borderRadius: '0.375rem',
            }}
            title={isIconOnly ? `${user?.name} (${user?.email})` : undefined}
          >
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                backgroundColor: user?.role === 'admin' ? '#191919' : '#6b21a8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.8rem',
                color: 'white',
                flexShrink: 0,
              }}
            >
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
            {!isIconOnly && (
              <div style={{ overflow: 'hidden' }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#191919',
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
                    fontSize: '0.68rem',
                    color: '#6b6b66',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.email}
                </p>
              </div>
            )}
          </div>

          <button
            id="sidebar-logout"
            onClick={handleLogout}
            title="Sign Out"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
              padding: isIconOnly ? '0.5rem 0' : '0.45rem',
              fontSize: '0.78rem',
              fontWeight: 500,
              color: '#6b6b66',
              backgroundColor: 'transparent',
              border: '1px solid #e5e5e0',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2'
              e.currentTarget.style.color = '#991b1b'
              e.currentTarget.style.borderColor = '#fca5a5'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#6b6b66'
              e.currentTarget.style.borderColor = '#e5e5e0'
            }}
          >
            <LogOut size={14} />
            {!isIconOnly && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f7f7f5',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* ── Mobile Header Bar (< 768px for Phone & Compact Tablets) ── */}
      <header
        className="sgas-mobile-header"
        style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e5e0',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '1.75rem',
              height: '1.75rem',
              borderRadius: '0.375rem',
              backgroundColor: '#191919',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <GraduationCap size={14} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#191919' }}>
            GroupSync
          </span>
          <span
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '0.1rem 0.4rem',
              borderRadius: '9999px',
              backgroundColor: '#f1f1ef',
              color: '#191919',
              textTransform: 'uppercase',
            }}
          >
            {user?.role}
          </span>
        </div>

        <button
          id="btn-mobile-menu-toggle"
          aria-label="Toggle navigation menu"
          onClick={() => setMobileOpen(true)}
          style={{
            background: 'none',
            border: '1px solid #e5e5e0',
            borderRadius: '0.375rem',
            padding: '0.4rem',
            color: '#191919',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Menu size={18} />
        </button>
      </header>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
        {/* ── Desktop & iPad Sidebar (>= 768px) ── */}
        <aside
          className="sgas-desktop-sidebar"
          style={{
            width: collapsed ? '64px' : '240px',
            minHeight: '100vh',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e5e5e0',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            alignSelf: 'flex-start',
            height: '100vh',
            overflowY: 'auto',
            transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {renderNavContent(false)}
        </aside>

        {/* ── Mobile shadcn Sheet Drawer ── */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="p-0 w-72 max-w-[85vw] bg-white">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            {renderNavContent(true)}
          </SheetContent>
        </Sheet>

        {/* ── Main Page Content ── */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: 'auto',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 767px) {
          .sgas-desktop-sidebar {
            display: none !important;
          }
          .sgas-mobile-header {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  )
}
