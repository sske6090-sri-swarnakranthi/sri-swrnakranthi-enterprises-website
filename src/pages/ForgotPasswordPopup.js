import React, { useEffect, useRef, useState } from 'react';
import './ForgotPasswordPopup.css';
import { FiX, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const DEFAULT_API_BASE = 'https://taras-kart-backend.vercel.app';
const API_BASE_RAW =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) ||
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE) ||
  DEFAULT_API_BASE;
const API_BASE = API_BASE_RAW.replace(/\/+$/, '');

const ForgotPasswordPopup = ({ onClose }) => {
  const cardRef = useRef(null);
  const overlayRef = useRef(null);
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [pwd, setPwd] = useState('');
  const [cpwd, setCpwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showCpwd, setShowCpwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const otpValue = otp.join('');

  const focusNext = (idx) => {
    const next = document.querySelector(`#otp-${idx + 1}`);
    if (next) next.focus();
  };

  const focusPrev = (idx) => {
    const prev = document.querySelector(`#otp-${idx - 1}`);
    if (prev) prev.focus();
  };

  const handleOtpInput = (v, idx) => {
    const val = v.replace(/\D/g, '').slice(0, 1);
    const nextArr = [...otp];
    nextArr[idx] = val;
    setOtp(nextArr);
    if (val && idx < 5) focusNext(idx);
  };

  const startFlow = async () => {
    setMsg('');
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setMsg('Enter a valid email');
      return;
    }
    try {
      setLoading(true);
      const check = await fetch(`${API_BASE}/api/auth/${encodeURIComponent(email)}`);
      if (!check.ok) {
        setMsg('You are a new user. Please register');
        setLoading(false);
        return;
      }
      const start = await fetch(`${API_BASE}/api/auth/forgot/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await start.json();
      if (start.ok) {
        setMsg('OTP sent to your email');
        setStep('otp');
      } else {
        setMsg(data.message || 'Failed to send OTP');
      }
    } catch {
      setMsg('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setMsg('');
    if (otpValue.length !== 6) {
      setMsg('Enter 6 digit OTP');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/forgot/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('OTP verified');
        setStep('reset');
      } else {
        setMsg(data.message || 'Invalid OTP');
      }
    } catch {
      setMsg('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setMsg('');
    if (!pwd || pwd !== cpwd) {
      setMsg('Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/forgot/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpValue, newPassword: pwd })
      });
      const data = await res.json();
      if (res.ok) {
        setMsg('Password updated successfully');
        setTimeout(() => onClose(), 1200);
      } else {
        setMsg(data.message || 'Could not update password');
      }
    } catch {
      setMsg('Could not update password');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const onDocMouseDown = (e) => {
      if (!cardRef.current) return;
      if (!cardRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDocMouseDown, { capture: true });
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDocMouseDown, { capture: true });
      document.body.style.overflow = '';
    };
  }, []);

  const stop = (e) => e.stopPropagation();

  return (
    <div className="fp-overlay" ref={overlayRef} onMouseDown={stop} onClick={stop}>
      <div className="fp-card" ref={cardRef} role="dialog" aria-modal="true" onMouseDown={stop} onClick={stop}>
        <button className="fp-close" onClick={onClose}><FiX /></button>
        {step === 'email' && (
          <>
            <h3 className="fp-title">Forgot Password</h3>
            <p className="fp-sub">Enter your registered email to receive an OTP</p>
            <div className="fp-input">
              <span className="fp-icon"><FiMail /></span>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {msg && <div className="fp-msg">{msg}</div>}
            <button className={`fp-btn ${loading ? 'fp-disabled' : ''}`} onClick={startFlow} disabled={loading}>
              {loading ? <span className="fp-spin" /> : 'Send OTP'}
            </button>
          </>
        )}
        {step === 'otp' && (
          <>
            <h3 className="fp-title">Verify OTP</h3>
            <p className="fp-sub">Enter the 6 digit code sent to {email}</p>
            <div className="fp-otp">
              {otp.map((d, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleOtpInput(e.target.value, i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !otp[i] && i > 0) focusPrev(i);
                  }}
                />
              ))}
            </div>
            {msg && <div className="fp-msg">{msg}</div>}
            <div className="fp-row">
              <button className="fp-btn fp-ghost" onClick={() => setStep('email')}>Back</button>
              <button className={`fp-btn ${loading ? 'fp-disabled' : ''}`} onClick={verifyOtp} disabled={loading}>
                {loading ? <span className="fp-spin" /> : 'Verify'}
              </button>
            </div>
          </>
        )}
        {step === 'reset' && (
          <>
            <h3 className="fp-title">Set New Password</h3>
            <p className="fp-sub">Create a new password for your account</p>
            <div className="fp-input">
              <span className="fp-icon"><FiLock /></span>
              <input
                type={showPwd ? 'text' : 'password'}
                placeholder="New Password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
              />
              <button className="fp-eye" type="button" onClick={() => setShowPwd((v) => !v)}>
                {showPwd ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            <div className="fp-input">
              <span className="fp-icon"><FiLock /></span>
              <input
                type={showCpwd ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={cpwd}
                onChange={(e) => setCpwd(e.target.value)}
              />
              <button className="fp-eye" type="button" onClick={() => setShowCpwd((v) => !v)}>
                {showCpwd ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {msg && <div className="fp-msg">{msg}</div>}
            <div className="fp-row">
              <button className="fp-btn fp-ghost" onClick={() => setStep('otp')}>Back</button>
              <button className={`fp-btn ${loading ? 'fp-disabled' : ''}`} onClick={resetPassword} disabled={loading}>
                {loading ? <span className="fp-spin" /> : 'Update Password'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPopup;
