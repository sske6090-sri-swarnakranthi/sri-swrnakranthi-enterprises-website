import React, { useCallback, useEffect, useRef, useState } from 'react'
import { FaGoogle } from 'react-icons/fa'
import { FiX, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import './LoginPopup.css'
import ForgotPasswordPopup from './ForgotPasswordPopup'
import SignupPopup from './SignupPopup'
import { auth, googleProvider } from '../firebase'
import { signInWithPopup } from 'firebase/auth'

const DEFAULT_API_BASE = 'https://sri-swarnakranthi-enterprises-backe.vercel.app'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = String(API_BASE_RAW || DEFAULT_API_BASE).replace(/\/+$/, '')

const LoginPopup = ({ onClose, onSuccess }) => {
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

  const validEmail = useCallback((v) => /^\S+@\S+\.\S+$/.test(String(v || '')), [])
  const canSubmit = validEmail(email) && !!password && !loading

  const setMsg = useCallback((m) => {
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current)
    setPopupMessage(String(m || ''))
    msgTimerRef.current = setTimeout(() => setPopupMessage(''), 2200)
  }, [])

  const clearUserIdIfInvalid = useCallback(() => {
    const sid = sessionStorage.getItem('userId')
    const lid = localStorage.getItem('userId')
    if (sid && !Number.isInteger(Number(sid))) sessionStorage.removeItem('userId')
    if (lid && !Number.isInteger(Number(lid))) localStorage.removeItem('userId')
  }, [])

  const persistUser = useCallback(
    (user, token) => {
      const u = user || {}
      const id = u?.id || u?.userId || u?.customerId || u?.uid || ''
      const em = u?.email || ''
      const nm = u?.name || u?.displayName || (em ? em.split('@')[0] : '') || 'User'
      const tp = u?.type || u?.userType || 'B2C'
      const pic = u?.photoURL || u?.profilePic || '/images/profile-pic.png'

      if (id) {
        localStorage.setItem('userId', String(id))
        sessionStorage.setItem('userId', String(id))
      }
      if (em) {
        localStorage.setItem('userEmail', String(em))
        sessionStorage.setItem('userEmail', String(em))
      }
      if (nm) {
        localStorage.setItem('userName', String(nm))
        sessionStorage.setItem('userName', String(nm))
      }
      if (tp) {
        localStorage.setItem('userType', String(tp))
        sessionStorage.setItem('userType', String(tp))
      }
      if (pic) {
        localStorage.setItem('userProfilePic', String(pic))
        sessionStorage.setItem('userProfilePic', String(pic))
      }

      if (token) {
        localStorage.setItem('userToken', String(token))
        sessionStorage.setItem('userToken', String(token))
        localStorage.setItem('tk_id_token', String(token))
        sessionStorage.setItem('tk_id_token', String(token))
      }

      clearUserIdIfInvalid()
      return { id, name: nm, email: em, profilePic: pic, userType: tp, token: token || '' }
    },
    [clearUserIdIfInvalid]
  )

  const backendLogin = useCallback(async () => {
    const resp = await fetch(`${API_BASE}/api/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password })
    })
    const data = await resp.json().catch(() => ({}))
    if (!resp.ok) throw new Error(data?.message || 'Login failed')
    return data
  }, [email, password])

  const backendFirebaseSync = useCallback(async (firebaseUser, idToken) => {
    const resp = await fetch(`${API_BASE}/api/user/firebase-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({
        name: firebaseUser?.displayName || '',
        email: firebaseUser?.email || '',
        mobile: sessionStorage.getItem('userMobile') || '',
        type: sessionStorage.getItem('userType') || 'B2C'
      })
    })
    const data = await resp.json().catch(() => ({}))
    if (!resp.ok) throw new Error(data?.message || 'Login failed')
    return data?.user || data
  }, [])

  const handleLogin = useCallback(async () => {
    if (!canSubmit) return
    setLoading(true)
    try {
      const data = await backendLogin()
      const token = data?.token || ''
      const user = data?.user || data

      setPopupMessage('Successfully Logged In!')
      const shaped = persistUser(user, token)
      setTimeout(() => {
        onSuccess && onSuccess(shaped)
        setPopupMessage('')
      }, 900)
    } catch (e) {
      setMsg(e?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }, [backendLogin, canSubmit, onSuccess, persistUser, setMsg])

  const handleLoginRef = useRef(handleLogin)
  useEffect(() => {
    handleLoginRef.current = handleLogin
  }, [handleLogin])

  const loginWithGoogle = useCallback(async () => {
    if (loading) return
    setLoading(true)
    try {
      const cred = await signInWithPopup(auth, googleProvider)
      const u = cred.user
      const idToken = await u.getIdToken()

      const syncedUser = await backendFirebaseSync(u, idToken)

      setPopupMessage('Successfully Logged In!')
      const shaped = persistUser(
        {
          ...syncedUser,
          email: syncedUser?.email || u.email,
          name: syncedUser?.name || u.displayName,
          photoURL: u.photoURL
        },
        idToken
      )

      setTimeout(() => {
        onSuccess && onSuccess(shaped)
        setPopupMessage('')
      }, 900)
    } catch (e) {
      const code = String(e?.code || '').toLowerCase()
      if (code.includes('popup-closed-by-user')) setMsg('Popup closed')
      else if (code.includes('unauthorized-domain')) setMsg('Domain not authorized in Firebase')
      else if (code.includes('invalid-api-key')) setMsg('Invalid Firebase API key')
      else setMsg(e?.message || 'Google sign-in failed')
    } finally {
      setLoading(false)
    }
  }, [backendFirebaseSync, loading, onSuccess, persistUser, setMsg])

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

  return (
    <>
      <div className="popup-overlay-login">
        <div className="form-container-login" ref={popupRef} role="dialog" aria-modal="true">
          <button className="close-login" onClick={onClose} aria-label="Close">
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
            <button className="btn-google-login" onClick={loginWithGoogle} type="button" disabled={loading}>
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

export default LoginPopup
