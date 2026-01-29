import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FiEye, FiEyeOff, FiX, FiUser, FiMail, FiPhone, FiLock } from 'react-icons/fi'
import { FaGoogle } from 'react-icons/fa'
import './SignupPopup.css'
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, updateProfile, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth'

const DEFAULT_API_BASE = 'https://sri-swarnakranthi-enterprises-backe.vercel.app'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = String(API_BASE_RAW || DEFAULT_API_BASE).replace(/\/+$/, '')

const env =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : typeof process !== 'undefined' && process.env
      ? process.env
      : {}

const fallbackFirebase = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  appId: ''
}

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || env.REACT_APP_FIREBASE_API_KEY || fallbackFirebase.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || env.REACT_APP_FIREBASE_AUTH_DOMAIN || fallbackFirebase.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || env.REACT_APP_FIREBASE_PROJECT_ID || fallbackFirebase.projectId,
  appId: env.VITE_FIREBASE_APP_ID || env.REACT_APP_FIREBASE_APP_ID || fallbackFirebase.appId
}

function ensureFirebase() {
  if (!getApps().length) initializeApp(firebaseConfig)
  const auth = getAuth()
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return { auth, provider }
}

function persistSession(payload = {}) {
  const token = payload?.token || payload?.userToken || ''
  const user = payload?.user && typeof payload.user === 'object' ? payload.user : payload

  const id = user?.id || user?.uid || user?.userId || user?.customerId || ''
  const email = user?.email || ''
  const name = user?.name || user?.displayName || ''
  const type = user?.type || user?.user_type || user?.userType || 'B2C'
  const mobile = user?.mobile || ''

  if (id) sessionStorage.setItem('userId', String(id))
  if (email) sessionStorage.setItem('userEmail', String(email))
  if (name) sessionStorage.setItem('userName', String(name))
  if (type) sessionStorage.setItem('userType', String(type))
  if (mobile) sessionStorage.setItem('userMobile', String(mobile))
  if (token) sessionStorage.setItem('userToken', String(token))

  if (id) localStorage.setItem('userId', String(id))
  if (email) localStorage.setItem('userEmail', String(email))
  if (name) localStorage.setItem('userName', String(name))
  if (type) localStorage.setItem('userType', String(type))
  if (mobile) localStorage.setItem('userMobile', String(mobile))
  if (token) localStorage.setItem('userToken', String(token))

  return { id, email, name, userType: type, mobile, token }
}

async function firebaseSync(idToken, firebaseUser, mobile, type) {
  const resp = await fetch(`${API_BASE}/api/user/firebase-sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({
      name: firebaseUser?.displayName || '',
      email: firebaseUser?.email || '',
      mobile: String(mobile || '').trim(),
      type: String(type || 'B2C')
    })
  })
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok) throw new Error(data?.message || 'Signup sync failed')
  return data?.user || data
}

const SignupPopup = ({ onClose, onSuccess }) => {
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

  const validateEmail = useCallback((v) => /^\S+@\S+\.\S+$/.test(v), [])
  const validateMobile = useCallback((number) => /^[6-9]\d{9}$/.test(number), [])

  const pwdScore = useCallback((v) => {
    let s = 0
    const vv = String(v || '')
    if (vv.length >= 8) s++
    if (/[A-Z]/.test(vv)) s++
    if (/[a-z]/.test(vv)) s++
    if (/\d/.test(vv)) s++
    if (/[^A-Za-z0-9]/.test(vv)) s++
    return Math.min(s, 4)
  }, [])

  const strength = useMemo(() => pwdScore(password), [password, pwdScore])
  const strengthLabel = useMemo(() => ['Too weak', 'Weak', 'Fair', 'Strong', 'Strong'][strength], [strength])
  const strengthWidth = useMemo(() => ['10%', '30%', '55%', '80%', '100%'][strength], [strength])

  const canSubmit =
    fullName.trim().length > 1 &&
    validateEmail(email) &&
    validateMobile(mobile) &&
    strength >= 3 &&
    confirmPassword === password &&
    acceptTerms &&
    !submitting

  const showMsg = useCallback((msg, type = 'error') => {
    if (type === 'error') setError(msg)
    else setSuccess(msg)
    window.setTimeout(() => {
      setError('')
      setSuccess('')
    }, 2500)
  }, [])

  const openLogin = useCallback(() => {
    if (typeof onClose === 'function') onClose('login')
    try {
      window.dispatchEvent(new CustomEvent('open-login'))
    } catch {}
  }, [onClose])

  const handleSubmit = useCallback(async () => {
    setError('')
    setSuccess('')
    if (!canSubmit) return

    setSubmitting(true)
    try {
      const { auth } = ensureFirebase()
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password)
      const u = cred.user
      await updateProfile(u, { displayName: fullName.trim() })
      const idToken = await u.getIdToken()

      localStorage.setItem('tk_id_token', idToken)
      sessionStorage.setItem('tk_id_token', idToken)

      const synced = await firebaseSync(idToken, u, mobile, 'B2C')
      const persisted = persistSession({ token: idToken, user: synced })

      showMsg('Signup successful', 'success')
      window.setTimeout(() => onSuccess && onSuccess(persisted), 700)
    } catch (e) {
      showMsg(e?.message || 'Signup failed', 'error')
    } finally {
      setSubmitting(false)
    }
  }, [canSubmit, email, fullName, mobile, onSuccess, password, showMsg])

  const handleGoogleLogin = useCallback(async () => {
    setError('')
    try {
      const { auth, provider } = ensureFirebase()
      let cred
      try {
        cred = await signInWithPopup(auth, provider)
      } catch (popupErr) {
        if (popupErr?.code === 'auth/popup-blocked' || popupErr?.code === 'auth/cancelled-popup-request') {
          await signInWithRedirect(auth, provider)
          return
        }
        throw popupErr
      }

      const u = cred.user
      const idToken = await u.getIdToken()

      localStorage.setItem('tk_id_token', idToken)
      sessionStorage.setItem('tk_id_token', idToken)

      const synced = await firebaseSync(idToken, u, mobile, 'B2C')
      const persisted = persistSession({ token: idToken, user: synced })

      showMsg('Signup successful', 'success')
      window.setTimeout(() => onSuccess && onSuccess(persisted), 700)
    } catch (e) {
      const code = String(e?.code || '').toLowerCase()
      if (code.includes('unauthorized-domain')) showMsg('Domain not authorized in Firebase', 'error')
      else if (code.includes('popup-closed-by-user')) showMsg('Popup closed', 'error')
      else if (code.includes('invalid-api-key')) showMsg('Invalid Firebase API key', 'error')
      else showMsg(e?.message || 'Google login failed', 'error')
    }
  }, [mobile, onSuccess, showMsg])

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
    firstInputRef.current?.focus()
  }, [])

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const { auth } = ensureFirebase()
        const r = await getRedirectResult(auth)
        if (!r?.user) return
        const u = r.user
        const idToken = await u.getIdToken()

        localStorage.setItem('tk_id_token', idToken)
        sessionStorage.setItem('tk_id_token', idToken)

        const synced = await firebaseSync(idToken, u, mobile, 'B2C')
        const persisted = persistSession({ token: idToken, user: synced })
        onSuccess && onSuccess(persisted)
      } catch {}
    }
    checkRedirect()
  }, [mobile, onSuccess])

  const handleOverlayMouseDown = useCallback(
    (e) => {
      if (e.target === e.currentTarget) onClose && onClose()
    },
    [onClose]
  )

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

        <div className="or-row">
          <span className="line" />
          <span className="or">Or</span>
          <span className="line" />
        </div>

        <div className="social-row">
          <button className="soc-btn google" onClick={handleGoogleLogin} disabled={submitting}>
            <FaGoogle /> Continue with Google
          </button>
        </div>

        <div className="switch-row">
          Already have an account?{' '}
          <span className="switch" role="button" tabIndex={0} onClick={openLogin} onKeyDown={(e) => e.key === 'Enter' && openLogin()}>
            Login
          </span>
        </div>
      </div>
    </div>
  )
}

export default SignupPopup
