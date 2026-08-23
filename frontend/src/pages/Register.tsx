import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  User as UserIcon,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  GraduationCap,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const inputBaseStyle: React.CSSProperties = {
  width: '100%',
  paddingLeft: '2.5rem',
  paddingRight: '0.875rem',
  paddingTop: '0.625rem',
  paddingBottom: '0.625rem',
  fontSize: '0.9375rem',
  border: '1.5px solid var(--color-outline-variant)',
  borderRadius: '0.5rem',
  backgroundColor: 'var(--color-surface)',
  color: 'var(--color-on-surface)',
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box' as const,
}

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const validate = (nameVal: string, emailVal: string, passwordVal: string) => {
    const errs: Record<string, string> = {}
    if (!nameVal.trim()) errs.name = 'Full name is required.'
    if (!emailVal.trim()) errs.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal.trim()))
      errs.email = 'Enter a valid email address.'
    if (!passwordVal) errs.password = 'Password is required.'
    else if (passwordVal.length < 6)
      errs.password = 'Password must be at least 6 characters.'
    return errs
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    const nameVal = nameRef.current?.value.trim() ?? ''
    const emailVal = emailRef.current?.value.trim() ?? ''
    const passwordVal = passwordRef.current?.value ?? ''

    const errs = validate(nameVal, emailVal, passwordVal)
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return

    setIsLoading(true)
    try {
      await register(nameVal, emailVal, passwordVal)
      navigate('/student/dashboard', { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? 'Registration failed. Please try again.'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'var(--color-primary)'
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(53, 37, 205, 0.12)'
  }
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'var(--color-outline-variant)'
    e.currentTarget.style.boxShadow = 'none'
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--color-surface-container-low)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: '440px' }}
      >
        {/* Logo & Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '1rem',
              backgroundColor: 'var(--color-primary)',
              marginBottom: '1rem',
              boxShadow: '0 4px 14px rgba(53, 37, 205, 0.35)',
            }}
          >
            <GraduationCap size={28} color="white" />
          </div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: 'var(--color-on-background)',
              margin: '0 0 0.25rem',
              letterSpacing: '-0.01em',
            }}
          >
            GroupSync
          </h1>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-on-surface-variant)',
              margin: 0,
            }}
          >
            Academic Management System
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            backgroundColor: 'var(--color-surface-container-lowest)',
            borderRadius: '1rem',
            padding: '2rem',
            boxShadow:
              '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
            border: '1px solid var(--color-outline-variant)',
          }}
        >
          <h2
            style={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: 'var(--color-on-surface)',
              margin: '0 0 0.25rem',
            }}
          >
            Create your account
          </h2>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-on-surface-variant)',
              margin: '0 0 1.5rem',
            }}
          >
            Join GroupSync to manage your academic assignments.
          </p>

          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                backgroundColor: 'var(--color-error-container)',
                color: 'var(--color-on-error-container)',
                fontSize: '0.875rem',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="reg-name"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--color-on-surface)',
                  marginBottom: '0.375rem',
                }}
              >
                Full name
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-on-surface-variant)',
                    pointerEvents: 'none',
                  }}
                >
                  <UserIcon size={16} />
                </div>
                <input
                  ref={nameRef}
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Alex Johnson"
                  disabled={isLoading}
                  style={{
                    ...inputBaseStyle,
                    borderColor: fieldErrors.name
                      ? 'var(--color-error)'
                      : 'var(--color-outline-variant)',
                  }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
              {fieldErrors.name && (
                <p style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  {fieldErrors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="reg-email"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--color-on-surface)',
                  marginBottom: '0.375rem',
                }}
              >
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-on-surface-variant)',
                    pointerEvents: 'none',
                  }}
                >
                  <Mail size={16} />
                </div>
                <input
                  ref={emailRef}
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@university.edu"
                  disabled={isLoading}
                  style={{
                    ...inputBaseStyle,
                    borderColor: fieldErrors.email
                      ? 'var(--color-error)'
                      : 'var(--color-outline-variant)',
                  }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
              {fieldErrors.email && (
                <p style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="reg-password"
                style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--color-on-surface)',
                  marginBottom: '0.375rem',
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--color-on-surface-variant)',
                    pointerEvents: 'none',
                  }}
                >
                  <Lock size={16} />
                </div>
                <input
                  ref={passwordRef}
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  disabled={isLoading}
                  style={{
                    ...inputBaseStyle,
                    borderColor: fieldErrors.password
                      ? 'var(--color-error)'
                      : 'var(--color-outline-variant)',
                  }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
              {fieldErrors.password && (
                <p style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: 'var(--color-on-primary)',
                backgroundColor: isLoading
                  ? 'var(--color-primary-container)'
                  : 'var(--color-primary)',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s',
                boxShadow: isLoading
                  ? 'none'
                  : '0 2px 8px rgba(53, 37, 205, 0.3)',
              }}
              onMouseEnter={(e) => {
                if (!isLoading)
                  e.currentTarget.style.backgroundColor =
                    'var(--color-on-primary-fixed-variant)'
              }}
              onMouseLeave={(e) => {
                if (!isLoading)
                  e.currentTarget.style.backgroundColor = 'var(--color-primary)'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 0.75s linear infinite' }} />
                  Creating account…
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p
          style={{
            textAlign: 'center',
            marginTop: '1.25rem',
            fontSize: '0.875rem',
            color: 'var(--color-on-surface-variant)',
          }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--color-primary)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Sign in
          </Link>
        </p>
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: var(--color-outline); opacity: 1; }
      `}</style>
    </div>
  )
}
