import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { GraduationCap, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  function handleGoHome() {
    if (isAuthenticated && user) {
      navigate(`/${user.role}/dashboard`, { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-surface-container-low)',
        fontFamily: 'var(--font-sans)',
        padding: '2rem',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '480px' }}>
        {/* Logo */}
        <div
          style={{
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '1rem',
            backgroundColor: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}
        >
          <GraduationCap size={24} color="white" />
        </div>

        {/* 404 headline */}
        <h1
          style={{
            fontSize: '6rem',
            fontWeight: 800,
            color: 'var(--color-primary)',
            margin: 0,
            lineHeight: 1,
            letterSpacing: '-0.04em',
          }}
        >
          404
        </h1>
        <h2
          style={{
            fontSize: '1.375rem',
            fontWeight: 700,
            color: 'var(--color-on-surface)',
            margin: '0.75rem 0 0.5rem',
            letterSpacing: '-0.01em',
          }}
        >
          Page Not Found
        </h2>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--color-on-surface-variant)',
            margin: '0 0 2rem',
            lineHeight: 1.6,
          }}
        >
          The page you're looking for doesn't exist or has been moved. Check the URL and try again.
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            id="btn-go-back"
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.625rem 1.25rem',
              borderRadius: '0.625rem',
              border: '1.5px solid var(--color-outline-variant)',
              backgroundColor: 'transparent',
              color: 'var(--color-on-surface-variant)',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-container)'
              e.currentTarget.style.color = 'var(--color-on-surface)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = 'var(--color-on-surface-variant)'
            }}
          >
            <ArrowLeft size={15} /> Go Back
          </button>
          <button
            id="btn-go-home"
            onClick={handleGoHome}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              padding: '0.625rem 1.25rem',
              borderRadius: '0.625rem',
              border: 'none',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
          >
            <Home size={15} />
            {isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
          </button>
        </div>
      </div>
    </div>
  )
}
