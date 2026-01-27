import React, { useState, useEffect, useRef } from 'react'
import { FiEye, FiEyeOff, FiX, FiUser, FiMail, FiPhone, FiLock } from 'react-icons/fi'
import './SignupPopup.css'

const DEFAULT_API_BASE = 'https://sri-swarnakranthi-enterprises-backe.vercel.app'

const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE

const API_BASE = String(API_BASE_RAW || DEFAULT_API_BASE).trim().replace(/\/+$/, '')

function persistSession(userLike = {}) {
  const id = userLike.id || userLike.userId || userLike.customerId
  const email = userLike.email || ''
  const name = userLike.name || ''
  const type = userLike.user_type || userLike.type || 'B2C'

  if (id) sessionStorage.setItem('userId', String(id))
  if (email) sessionStorage.setItem('userEmail', String(email))
  if (name) sessionStorage.setItem('userName', String(name))
  if (type) sessionStorage.setItem('userType', String(type))
  if (userLike.token) sessionStorage.setItem('userToken', String(userLike.token))

  return { id, email, name, userType: type }
}

export default function SignupPopup({ onClose, onSuccess }) {
  const popupRef = useRef(null)
  const firstInputRef = useRef(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [showPwd, setShowPwd] = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)

  const validateEmail = (v) => /^\S+@\S+\.\S+$/.test(v)
  const validateMobile = (v) => /^[6-9]\d{9}$/.test(v)

  const pwdScore = (v) => {
    let s = 0
    const vv = String(v || '')
    if (vv.length >= 8) s++
    if (/[A-Z]/.test(vv)) s++
    if (/[a-z]/.test(vv)) s++
    if (/\d/.test(vv)) s++
    if (/[^A-Za-z0-9]/.test(vv)) s++
    return Math.min(s, 4)
  }

  const strength = pwdScore(password)

  const canSubmit =
    fullName.trim().length > 1 &&
    validateEmail(email) &&
    validateMobile(mobile) &&
    strength >= 3 &&
    confirmPassword === password &&
    acceptTerms &&
    !submitting

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose && onClose()
    }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [onClose])

  useEffect(() => {
    if (firstInputRef.current) firstInputRef.current.focus()
  }, [])

  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) onClose && onClose()
  }

  const showMsg = (msg, type = 'error') => {
    if (type === 'error') setError(msg)
    else setSuccess(msg)
    window.setTimeout(() => {
      setError('')
      setSuccess('')
    }, 2500)
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')
    if (!canSubmit) return

    try {
      setSubmitting(true)
      const resp = await fetch(`${API_BASE}/api/user/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim(),
          mobile: String(mobile).trim(),
          password
        })
      })

      let data = null
      try {
        data = await resp.json()
      } catch {
        data = null
      }

      if (!resp.ok) {
        showMsg(data?.message || 'Signup failed', 'error')
        return
      }

      const persisted = persistSession(data || {})
      showMsg('Signup successful', 'success')
      window.setTimeout(() => onSuccess && onSuccess(persisted), 600)
    } catch {
      showMsg('Something went wrong. Please try again', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const openLogin = () => {
    if (typeof onClose === 'function') onClose('login')
    try {
      window.dispatchEvent(new CustomEvent('open-login'))
    } catch {}
  }

  const strengthLabel = ['Too weak', 'Weak', 'Fair', 'Strong', 'Strong'][strength]
  const strengthWidth = ['10%', '30%', '55%', '80%', '100%'][strength]

  return (
    <div className="signup-overlay" onMouseDown={handleOverlayMouseDown}>
      <div className="signup-card" ref={popupRef} role="dialog" aria-modal="true">
        <button className="close-btn" onClick={() => onClose && onClose()} aria-label="Close">
          <FiX />
        </button>

        <div className="signup-head">
          <h2 className="signup-title">Create your account</h2>
          <p className="signup-sub">Sign up to save items and checkout faster</p>
        </div>

        <form className="signup-form" onSubmit={(e) => e.preventDefault()}>
          <div className="input-row">
            <div className="input-wrap">
              <span className="i-icon">
                <FiUser />
              </span>
              <input
                ref={firstInputRef}
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          <div className="input-row">
            <div className={`input-wrap ${email && !validateEmail(email) ? 'has-error' : ''}`}>
              <span className="i-icon">
                <FiMail />
              </span>
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>

          <div className="input-row">
            <div className={`input-wrap ${mobile && !validateMobile(mobile) ? 'has-error' : ''}`}>
              <span className="i-icon">
                <FiPhone />
              </span>
              <input
                type="tel"
                placeholder="Mobile Number"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
              />
            </div>
          </div>

          <div className="input-row">
            <div className={`input-wrap ${password && strength < 3 ? 'warn' : ''}`}>
              <span className="i-icon">
                <FiLock />
              </span>
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="eye" onClick={() => setShowPwd((v) => !v)} aria-label="Toggle password visibility">
                {showPwd ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <div className="strength">
              <div className="track" />
              <div className="bar" style={{ width: strengthWidth }} />
              <span className="s-label">{password ? strengthLabel : ''}</span>
            </div>
          </div>

          <div className="input-row">
            <div className={`input-wrap ${confirmPassword && confirmPassword !== password ? 'has-error' : ''}`}>
              <span className="i-icon">
                <FiLock />
              </span>
              <input
                type={showConfirmPwd ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button type="button" className="eye" onClick={() => setShowConfirmPwd((v) => !v)} aria-label="Toggle confirm password visibility">
                {showConfirmPwd ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <label className="terms">
            <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} />
            <span>I agree to the Terms & Conditions and Privacy Policy</span>
          </label>

          {error && <div className="alert error">{error}</div>}
          {success && <div className="alert success">{success}</div>}

          <button className={`submit ${canSubmit ? '' : 'disabled'}`} onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <div className="switch-row">
          Already have an account?{' '}
          <span className="switch" onClick={openLogin}>
            Login
          </span>
        </div>
      </div>
    </div>
  )
}
