import React, { useState, useEffect } from 'react'
import './Profile.css'
import Navbar from './Navbar'
import Footer from './Footer'
import Orders from './Orders'
import TandC from './TandC'
import CustomerCare from './CustomerCare'
import LoginPopup from './LoginPopup'
import SignupPopup from './SignupPopup'
import ReturnsPage from './ReturnsPage'

const DEFAULT_API_BASE = 'http://localhost:5000'
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE
const API_BASE = API_BASE_RAW.replace(/\/+$/, '')

const isValidMobile = (v) => /^[6-9]\d{9}$/.test(String(v || '').trim())

const getSessionOrLocal = (k) => {
  const a = sessionStorage.getItem(k)
  if (a !== null && a !== undefined && a !== '') return a
  const b = localStorage.getItem(k)
  if (b !== null && b !== undefined && b !== '') return b
  return ''
}

const setSessionAndLocal = (k, v) => {
  const val = v == null ? '' : String(v)
  if (val) {
    sessionStorage.setItem(k, val)
    localStorage.setItem(k, val)
  } else {
    sessionStorage.removeItem(k)
    localStorage.removeItem(k)
  }
}

const normalizeAuthPayload = (payload) => {
  if (!payload) return {}
  if (payload.user && typeof payload.user === 'object') {
    return {
      id: payload.user.id,
      email: payload.user.email,
      name: payload.user.name,
      type: payload.user.type || payload.user.user_type || 'B2C',
      token: payload.token
    }
  }
  return {
    id: payload.id,
    email: payload.email,
    name: payload.name,
    type: payload.userType || payload.type || payload.user_type || 'B2C',
    token: payload.token
  }
}

const Profile = () => {
  const [activeSection, setActiveSection] = useState('Profile')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const [showSignupPopup, setShowSignupPopup] = useState(false)
  const [userInfo, setUserInfo] = useState(null)
  const [mobileInput, setMobileInput] = useState('')
  const [mobileMsg, setMobileMsg] = useState('')
  const [savingMobile, setSavingMobile] = useState(false)

  const setToast = (m) => {
    setMobileMsg(m)
    setTimeout(() => setMobileMsg(''), 2200)
  }

  const hydrateUser = async () => {
    const email = getSessionOrLocal('userEmail')
    const uid = getSessionOrLocal('firebaseUid')
    const id = getSessionOrLocal('userId')
    const localName = getSessionOrLocal('userName')
    const localType = getSessionOrLocal('userType')

    if (!email && !id && !uid) {
      setIsLoggedIn(false)
      setUserInfo(null)
      return
    }

    if (!email) {
      setIsLoggedIn(true)
      setUserInfo({
        profilePic: '/images/profile-pic.png',
        name: localName || 'User',
        email: '',
        mobile: ''
      })
      return
    }

    try {
      const res = await fetch(`${API_BASE}/api/user/by-email/${encodeURIComponent(email)}`)
      const data = await res.json()
      const name = data?.name || localName || (email.includes('@') ? email.split('@')[0] : 'User')

      const mobileRaw = data?.mobile
      const mobile = isValidMobile(mobileRaw) ? String(mobileRaw) : ''

      setUserInfo({
        profilePic: '/images/profile.webp',
        name,
        email: data?.email || email,
        mobile
      })

      setIsLoggedIn(!!(data?.email || email))
      if (data?.email || email) {
        setSessionAndLocal('userEmail', data?.email || email)
        setSessionAndLocal('userName', name)
        if (data?.type || localType) setSessionAndLocal('userType', data?.type || localType)
      }
    } catch {
      setIsLoggedIn(!!(email || id || uid))
      setUserInfo({
        profilePic: '/images/profile-pic.png',
        name: localName || (email ? email.split('@')[0] : 'User'),
        email: email || '',
        mobile: ''
      })
    }
  }

  useEffect(() => {
    hydrateUser()
  }, [])

  useEffect(() => {
    const m = userInfo?.mobile && isValidMobile(userInfo.mobile) ? String(userInfo.mobile) : ''
    setMobileInput(m)
  }, [userInfo?.mobile])

  const handleLogout = () => {
    sessionStorage.clear()
    localStorage.removeItem('userId')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userName')
    localStorage.removeItem('userType')
    localStorage.removeItem('firebaseUid')
    localStorage.removeItem('userToken')
    localStorage.removeItem('tk_id_token')
    setUserInfo(null)
    setIsLoggedIn(false)
    window.location.href = '/'
  }

  const handleSaveMobile = async () => {
    const email = getSessionOrLocal('userEmail')
    const uid = getSessionOrLocal('firebaseUid')

    if (!email) {
      setToast('Email not found, please login again')
      return
    }

    const mobile = String(mobileInput || '').replace(/\D/g, '').slice(0, 10)
    if (!isValidMobile(mobile)) {
      setToast('Enter a valid 10 digit mobile number')
      return
    }

    setSavingMobile(true)
    try {
      const r1 = await fetch(`${API_BASE}/api/user/update-mobile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, mobile, uid: uid || undefined })
      })

      if (!r1.ok) {
        const t = await r1.json().catch(() => null)
        setToast(t?.message || 'Unable to save mobile number')
        setSavingMobile(false)
        return
      }

      const out = await r1.json().catch(() => ({}))
      const savedMobile = out?.mobile || mobile

      setUserInfo((prev) => ({
        ...(prev || {}),
        mobile: savedMobile
      }))

      setToast('Mobile number saved')
    } catch {
      setToast('Unable to save mobile number')
    } finally {
      setSavingMobile(false)
    }
  }

  const mobileMissing = isLoggedIn && userInfo && (!userInfo.mobile || !isValidMobile(userInfo.mobile))

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-bg-orbs"></div>
      <main className="profile-container">
        <aside className="profile-left">
          <div className="profile-title">My Account</div>

          {isLoggedIn && userInfo && (
            <div className="mini-card">
              <div className="mini-avatar">
                <img src={userInfo.profilePic} alt="Profile" />
                <span className="mini-ring"></span>
              </div>
              <div className="mini-info">
                <div className="mini-name">{userInfo.name}</div>
                <div className="mini-chip">Signed in</div>
              </div>
            </div>
          )}

          <div className="profile-buttons">
            <button className={`profile-button ${activeSection === 'Profile' ? 'active' : ''}`} onClick={() => setActiveSection('Profile')}>
              <span className="btn-shine"></span>
              Profile
            </button>
            <button className={`profile-button ${activeSection === 'Orders' ? 'active' : ''}`} onClick={() => setActiveSection('Orders')}>
              <span className="btn-shine"></span>
              Orders
            </button>
            {/*<button className={`profile-button ${activeSection === 'Returns' ? 'active' : ''}`} onClick={() => setActiveSection('Returns')}>
              <span className="btn-shine"></span>
              Returns &amp; Refunds
            </button> */}
            <button className={`profile-button ${activeSection === 'Terms' ? 'active' : ''}`} onClick={() => setActiveSection('Terms')}>
              <span className="btn-shine"></span>
              Terms & Conditions
            </button>
            <button className={`profile-button ${activeSection === 'CustomerCare' ? 'active' : ''}`} onClick={() => setActiveSection('CustomerCare')}>
              <span className="btn-shine"></span>
              Customer Care
            </button>
            {isLoggedIn && (
              <button className="profile-button danger" onClick={handleLogout}>
                <span className="btn-shine"></span>
                Logout
              </button>
            )}
          </div>
        </aside>

        <section className="profile-right">
          <div key={activeSection} className="profile-right-inner animate-section">
            {!isLoggedIn ? (
              <div className="login-signup-panel">
                <div className="welcome-hero">
                  <div className="welcome-ring"></div>
                  <h2>Welcome to Sri Swarnakranthi</h2>
                  <p>Sign in to manage your profile, orders, and preferences in one place.</p>
                </div>
                <div className="login-signup-buttons">
                  <button className="login-button" onClick={() => setShowLoginPopup(true)}>
                    Login
                  </button>
                  <button className="signup-button" onClick={() => setShowSignupPopup(true)}>
                    Signup
                  </button>
                </div>
              </div>
            ) : (
              activeSection === 'Profile' &&
              userInfo && (
                <div className="profile-card">
                  <div className="profile-card-header">
                    <div className="avatar-wrap">
                      <img className="profile-pic" src={userInfo.profilePic} alt="Profile" />
                      <span className="avatar-glow"></span>
                    </div>
                    <div className="user-details">
                      <h2>{userInfo.name}</h2>
                      <p className="user-subtitle">Your profile details</p>
                    </div>
                  </div>

                  {mobileMissing && (
                    <div className="mobile-alert">
                      <div className="mobile-alert-title">Add your mobile number</div>
                      <div className="mobile-alert-sub">This helps with order updates, delivery, and support.</div>
                      <div className="mobile-row">
                        <input
                          className="mobile-input"
                          value={mobileInput}
                          onChange={(e) => {
                            const v = String(e.target.value || '').replace(/\D/g, '').slice(0, 10)
                            setMobileInput(v)
                          }}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="Enter 10 digit mobile number"
                          maxLength={10}
                        />
                        <button className={`mobile-save-btn ${savingMobile ? 'disabled' : ''}`} onClick={handleSaveMobile} disabled={savingMobile}>
                          {savingMobile ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                      {mobileMsg && (
                        <div className={`mobile-msg ${mobileMsg.toLowerCase().includes('saved') ? 'ok' : 'err'}`}>{mobileMsg}</div>
                      )}
                    </div>
                  )}

                  <div className="info-grid">
                    <div className="info-item">
                      <div className="info-label">Email</div>
                      <div className="info-value">{userInfo.email || '-'}</div>
                    </div>
                    <div className="info-item">
                      <div className="info-label">Mobile</div>
                      <div className={`info-value ${!userInfo.mobile ? 'muted' : ''}`}>{userInfo.mobile || 'Add the mobile number'}</div>
                    </div>
                  </div>

                  {!mobileMissing && mobileMsg && (
                    <div className={`mobile-msg inline ${mobileMsg.toLowerCase().includes('saved') ? 'ok' : 'err'}`}>{mobileMsg}</div>
                  )}
                </div>
              )
            )}

            {activeSection === 'Orders' && isLoggedIn && (
              <div className="section-card">
                <Orders user={{ email: userInfo?.email, mobile: userInfo?.mobile }} />
              </div>
            )}

            {activeSection === 'Returns' && isLoggedIn && (
              <div className="section-card">
                <ReturnsPage embedded user={{ email: userInfo?.email, mobile: userInfo?.mobile }} />
              </div>
            )}

            {activeSection === 'Terms' && (
              <div className="section-card">
                <TandC />
              </div>
            )}

            {activeSection === 'CustomerCare' && (
              <div className="section-card">
                <CustomerCare />
              </div>
            )}
          </div>
        </section>
      </main>

      {showLoginPopup && (
        <LoginPopup
          onClose={() => setShowLoginPopup(false)}
          onSuccess={(payload) => {
            const u = normalizeAuthPayload(payload)
            if (u?.id) setSessionAndLocal('userId', String(u.id))
            if (u?.email) setSessionAndLocal('userEmail', String(u.email))
            if (u?.name) setSessionAndLocal('userName', String(u.name))
            if (u?.type) setSessionAndLocal('userType', String(u.type))
            if (u?.token) setSessionAndLocal('userToken', String(u.token))
            setShowLoginPopup(false)
            setIsLoggedIn(true)
            hydrateUser()
            setActiveSection('Profile')
          }}
        />
      )}

      {showSignupPopup && (
        <SignupPopup
          onClose={() => setShowSignupPopup(false)}
          onSuccess={(payload) => {
            const u = normalizeAuthPayload(payload)
            if (u?.id) setSessionAndLocal('userId', String(u.id))
            if (u?.email) setSessionAndLocal('userEmail', String(u.email))
            if (u?.name) setSessionAndLocal('userName', String(u.name))
            if (u?.type) setSessionAndLocal('userType', String(u.type))
            if (u?.token) setSessionAndLocal('userToken', String(u.token))
            setShowSignupPopup(false)
            setIsLoggedIn(true)
            hydrateUser()
            setActiveSection('Profile')
          }}
        />
      )}

      <Footer />
    </div>
  )
}

export default Profile
