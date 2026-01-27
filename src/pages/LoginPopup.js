import React, { useState, useRef, useEffect, useCallback } from 'react'
import { FaGoogle } from 'react-icons/fa'
import { FiX, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import './LoginPopup.css'
import ForgotPasswordPopup from './ForgotPasswordPopup'
import SignupPopup from './SignupPopup'

const DEFAULT_API_BASE = 'https://sri-swarnakranthi-enterprises-backe.vercel.app'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = String(API_BASE_RAW || DEFAULT_API_BASE).replace(/\/+$/, '')

function persistSession(payload = {}) {
  const token = payload?.token || payload?.userToken || ''
  const user = payload?.user && typeof payload.user === 'object' ? payload.user : payload

  const id = user?.id || user?.userId || user?.customerId || ''
  const email = user?.email || ''
  const name = user?.name || ''
  const type = user?.type || user?.user_type || user?.userType || 'B2C'

  if (id) sessionStorage.setItem('userId', String(id))
  if (email) sessionStorage.setItem('userEmail', String(email))
  if (name) sessionStorage.setItem('userName', String(name))
  if (type) sessionStorage.setItem('userType', String(type))
  if (token) sessionStorage.setItem('userToken', String(token))

  return { id, email, name, userType: type, token }
}

export default function LoginPopup({ onClose, onSuccess }) {
  const popupRef = useRef(null)
  const emailRef = useRef(null)
  const passwordRef = useRef(null)
  const msgTimerRef = useRef(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [popupMessage, setPopupMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [showSignup, setShowSignup] = useState(false)

  const validEmail = useCallback((v) => /^\S+@\S+\.\S+$/.test(v), [])

  const setMsg = useCallback((m) => {
    setPopupMessage(m)
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current)
    msgTimerRef.current = setTimeout(() => setPopupMessage(''), 2200)
  }, [])

  const handleLogin = useCallback(async () => {
    const emailOk = validEmail(email)
    const canSubmitNow = emailOk && !!password && !loading
    if (!canSubmitNow) return

    setLoading(true)
    try {
      const resp = await fetch(`${API_BASE}/api/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      })

      const data = await resp.json().catch(() => ({}))

      if (!resp.ok) {
        setMsg(data?.message || 'Invalid email or password')
        return
      }

      const persisted = persistSession(data)
      setPopupMessage('Successfully Logged In!')
      setTimeout(() => {
        onSuccess && onSuccess(persisted)
        setPopupMessage('')
      }, 900)
    } catch {
      setMsg('Server error')
    } finally {
      setLoading(false)
    }
  }, [email, password, loading, validEmail, setMsg, onSuccess])

  const handleLoginRef = useRef(handleLogin)
  useEffect(() => {
    handleLoginRef.current = handleLogin
  }, [handleLogin])

  const loginWithGoogle = useCallback(() => {
    setMsg('Google login will be added later')
  }, [setMsg])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    emailRef.current?.focus()

    return () => {
      document.body.style.overflow = ''
      if (msgTimerRef.current) clearTimeout(msgTimerRef.current)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showForgot || showSignup) return
      if (popupRef.current && !popupRef.current.contains(e.target)) onClose && onClose()
    }

    const onKey = (e) => {
      if (showForgot || showSignup) return
      if (e.key === 'Escape') onClose && onClose()
      if (e.key === 'Enter') handleLoginRef.current && handleLoginRef.current()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [showForgot, showSignup, onClose])

  const onEmailKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      passwordRef.current?.focus()
    }
  }

  const onPasswordKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleLoginRef.current && handleLoginRef.current()
    }
  }

  const canSubmit = validEmail(email) && password && !loading

  return (
    <>
      <div className="popup-overlay-login">
        <div className="form-container-login" ref={popupRef} role="dialog" aria-modal="true">
          <button className="close-login" onClick={() => onClose && onClose()} aria-label="Close">
            <FiX />
          </button>

          <div className="head-login">
            <p className="title-login">Welcome back</p>
            <p className="sub-login">Sign in to continue</p>
          </div>

          <form className="form-login" onSubmit={(e) => e.preventDefault()}>
            <div className={`input-wrap-login ${email && !validEmail(email) ? 'has-error' : ''}`}>
              <span className="i-login">
                <FiMail />
              </span>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={onEmailKeyDown}
                placeholder="Email"
                autoComplete="email"
                inputMode="email"
              />
            </div>

            <div className="input-wrap-login">
              <span className="i-login">
                <FiLock />
              </span>
              <input
                ref={passwordRef}
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={onPasswordKeyDown}
                placeholder="Password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="eye-login"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowPwd((v) => !v)}
                aria-label="Toggle password visibility"
              >
                {showPwd ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <div className="row-login">
              <button type="button" className="forgot-login-btn" onClick={() => setShowForgot(true)}>
                Forgot Password?
              </button>
            </div>

            <button className={`sign-login ${canSubmit ? '' : 'disabled'}`} onClick={handleLogin} disabled={!canSubmit}>
              {loading ? <span className="spinner-login" /> : 'Sign In'}
            </button>

            {popupMessage && (
              <div className={`popup-msg-login ${popupMessage.toLowerCase().includes('success') ? 'ok' : 'err'}`}>
                {popupMessage}
              </div>
            )}
          </form>

          <div className="social-message-login">
            <div className="line-login"></div>
            <p className="message-login">Or continue with</p>
            <div className="line-login"></div>
          </div>

          <div className="social-grid-login">
            <button className="btn-google-login" onClick={loginWithGoogle} type="button">
              <FaGoogle /> Google
            </button>
          </div>

          <p className="signup-login">
            Don’t have an account{' '}
            <button className="signup-link-login" onClick={() => setShowSignup(true)} type="button">
              Sign up
            </button>
          </p>
        </div>
      </div>

      {showForgot && <ForgotPasswordPopup onClose={() => setShowForgot(false)} />}
      {showSignup && <SignupPopup onClose={() => setShowSignup(false)} />}
    </>
  )
}
