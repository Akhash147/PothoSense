import React, { useState } from 'react';
import { useTranslator, LanguageSelector } from '../utils/AITranslator';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import API from '../utils/api';
import Navbar from '../components/Navbar';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: '' },
  { code: 'hi', label: '' },
  { code: 'te', label: '' },
  { code: 'ml', label: '' },
  { code: 'kn', label: '' },
];

// view: 'login' | 'register' | 'forgot' | 'reset'
export default function CitizenAuth() {
  const { t, language, setLanguage } = useTranslator();
  const { loginCitizen, darkMode, setDarkMode } = useApp();
  const navigate = useNavigate();

  const [view, setView] = useState('login');

  // -- Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // -- Register
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // -- Forgot
  const [fpEmail, setFpEmail] = useState('');
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState('');
  const [fpSuccess, setFpSuccess] = useState('');

  // -- Reset
  const [otp, setOtp] = useState(['', '', '', '']);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const go = (v) => {
    setLoginError(''); setRegError(''); setRegSuccess('');
    setFpError(''); setFpSuccess(''); setResetError(''); setResetSuccess('');
    setView(v);
  };

  // -- Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(''); setLoginLoading(true);
    try {
      const res = await API.post('/auth/citizen/login', { email, password });
      loginCitizen(res.data.token, res.data.username);
      navigate('/citizen/report');
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Login failed. Is the backend running?');
    } finally { setLoginLoading(false); }
  };

  // -- Register handler
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError(''); setRegSuccess('');
    if (regPassword.length < 8) { setRegError('Password must be at least 8 characters'); return; }
    setRegLoading(true);
    try {
      await API.post('/auth/citizen/register', { username: regUsername, email: regEmail, password: regPassword });
      setRegSuccess('Account created! You can now login.');
      setTimeout(() => go('login'), 1500);
    } catch (err) {
      setRegError(err.response?.data?.error || 'Registration failed');
    } finally { setRegLoading(false); }
  };

  // -- Forgot: send OTP
  const handleForgot = async (e) => {
    e.preventDefault();
    setFpError(''); setFpSuccess(''); setFpLoading(true);
    try {
      const res = await API.post('/auth/citizen/forgot-password', { email: fpEmail });
      setFpSuccess(res.data.message);
      setOtp(['', '', '', '']); setNewPw(''); setConfirmPw('');
      setTimeout(() => go('reset'), 1500);
    } catch (err) {
      setFpError(err.response?.data?.error || 'Failed to send OTP. Check your email.');
    } finally { setFpLoading(false); }
  };

  // -- OTP box handlers
  const handleOtpChange = (val, idx) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...otp]; next[idx] = v; setOtp(next);
    if (v && idx < 3) document.getElementById(`cotp${idx + 1}`)?.focus();
  };
  const handleOtpKey = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      document.getElementById(`cotp${idx - 1}`)?.focus();
  };

  // -- Reset password
  const handleReset = async (e) => {
    e.preventDefault();
    setResetError(''); setResetSuccess('');
    const otpVal = otp.join('');
    if (otpVal.length < 4) { setResetError('Enter the complete 4-digit OTP'); return; }
    if (newPw !== confirmPw) { setResetError('Passwords do not match'); return; }
    if (newPw.length < 8) { setResetError('Password must be at least 8 characters'); return; }
    setResetLoading(true);
    try {
      const res = await API.post('/auth/citizen/reset-password', {
        email: fpEmail, otp: otpVal, new_password: newPw,
      });
      setResetSuccess(res.data.message);
      setTimeout(() => go('login'), 2000);
    } catch (err) {
      setResetError(err.response?.data?.error || 'Reset failed');
    } finally { setResetLoading(false); }
  };

  // OTP box style
  const otpBox = (val) => ({
    width: 56, height: 64, fontSize: '1.8rem', fontWeight: 900,
    textAlign: 'center', borderRadius: 10, outline: 'none',
    border: `2px solid ${val ? 'var(--primary)' : 'var(--border)'}`,
    background: val ? 'rgba(212,67,10,0.08)' : 'var(--bg3)',
    color: 'var(--text)',
  });

  return (
    <>
      <Navbar mode="citizen" />
      <div className="auth-page">
        <div className="auth-container fade-in">

          {/* Logo */}
          <div className="auth-logo">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, marginBottom:8 }}><span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:48, height:48, borderRadius:'50%', background:'var(--primary)', color:'#fff', fontWeight:900, fontSize:'1.1rem' }}>PS</span></div>
            <h1 style={{ color: 'var(--text)' }}>{"PothoSense"}</h1>
            <p>{"Report road damage. Keep your city safe."}</p>
          </div>

          {/* Lang + Theme */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
            <LanguageSelector style={{ borderRadius: 8, padding: "5px 8px", border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--text)", cursor: "pointer" }} />
            <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? 'Light' : 'Dark'}
            </button>
          </div>

          {/* ========== LOGIN ========== */}
          {view === 'login' && (
            <div className="card">
              <div className="auth-tabs">
                <button className="auth-tab active">{"Login"}</button>
                <button className="auth-tab" onClick={() => go('register')}>{"Register"}</button>
              </div>
              {loginError && <div className="alert alert-error">{loginError}</div>}
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">{"Email"}</label>
                  <input type="email" className="form-input" required placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{"Password"}</label>
                  <input type="password" className="form-input" required placeholder="********"
                    value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                {/*  FORGOT PASSWORD LINK  */}
                <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 16 }}>
                  <span onClick={() => go('forgot')}
                    style={{ fontSize: '0.82rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline' }}>
                    Forgot password?
                  </span>
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loginLoading}>
                  {loginLoading ? <span className="spinner" /> : "Sign In"}
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.85rem', color: 'var(--text3)' }}>
                No account?{' '}
                <span onClick={() => go('register')}
                  style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }}>
                  Register ->
                </span>
              </p>
            </div>
          )}

          {/* ========== REGISTER ========== */}
          {view === 'register' && (
            <div className="card">
              <div className="auth-tabs">
                <button className="auth-tab" onClick={() => go('login')}>{"Login"}</button>
                <button className="auth-tab active">{"Register"}</button>
              </div>
              {regError && <div className="alert alert-error">{regError}</div>}
              {regSuccess && <div className="alert alert-success">{regSuccess}</div>}
              <form onSubmit={handleRegister}>
                <div className="form-group">
                  <label className="form-label">{"Username"}</label>
                  <input type="text" className="form-input" required placeholder="your_name"
                    value={regUsername} onChange={e => setRegUsername(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{"Email"}</label>
                  <input type="email" className="form-input" required placeholder="you@example.com"
                    value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{"Password"}</label>
                  <input type="password" className="form-input" required placeholder="min 8 chars" minLength={8}
                    value={regPassword} onChange={e => setRegPassword(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={regLoading}>
                  {regLoading ? <span className="spinner" /> : "Create Account"}
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.85rem', color: 'var(--text3)' }}>
                Have account?{' '}
                <span onClick={() => go('login')}
                  style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }}>
                  Login ->
                </span>
              </p>
            </div>
          )}

          {/* ========== FORGOT PASSWORD ========== */}
          {view === 'forgot' && (
            <div className="card">
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                
                <h2 style={{ color: 'var(--text)', margin: '0 0 6px' }}>Reset Password</h2>
                <p style={{ color: 'var(--text3)', fontSize: '0.85rem', margin: 0 }}>
                  Enter the email you used when you registered.
                </p>
              </div>
              {fpError && <div className="alert alert-error">{fpError}</div>}
              {fpSuccess && <div className="alert alert-success">{fpSuccess}</div>}
              <form onSubmit={handleForgot}>
                <div className="form-group">
                  <label className="form-label">Registered Email</label>
                  <input type="email" className="form-input" required placeholder="you@example.com"
                    value={fpEmail} onChange={e => setFpEmail(e.target.value)} />
                  <small style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
                    (!) Must be the exact email you registered with
                  </small>
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={fpLoading}>
                  {fpLoading ? <span className="spinner" /> : 'Send OTP to My Email'}
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: 16 }}>
                <span onClick={() => go('login')}
                  style={{ fontSize: '0.85rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                  Back to Login
                </span>
              </p>
            </div>
          )}

          {/* ========== ENTER OTP + NEW PASSWORD ========== */}
          {view === 'reset' && (
            <div className="card">
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                
                <h2 style={{ color: 'var(--text)', margin: '0 0 6px' }}>Enter OTP</h2>
                <p style={{ color: 'var(--text3)', fontSize: '0.85rem', margin: 0 }}>
                  A 4-digit OTP was sent to <strong style={{ color: 'var(--primary)' }}>{fpEmail}</strong>.<br />
                  Valid for 10 minutes.
                </p>
              </div>
              {resetError && <div className="alert alert-error">{resetError}</div>}
              {resetSuccess && <div className="alert alert-success">{resetSuccess}</div>}
              <form onSubmit={handleReset}>
                {/* 4-box OTP input */}
                <div className="form-group">
                  <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>
                    4-Digit OTP
                  </label>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '10px 0 22px' }}>
                    {otp.map((val, idx) => (
                      <input key={idx} id={`cotp${idx}`}
                        type="text" inputMode="numeric" maxLength={1} value={val}
                        onChange={e => handleOtpChange(e.target.value, idx)}
                        onKeyDown={e => handleOtpKey(e, idx)}
                        style={otpBox(val)}
                      />
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-input" required placeholder="min 8 characters"
                    value={newPw} onChange={e => setNewPw(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" className="form-input" required placeholder="repeat new password"
                    value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={resetLoading}>
                  {resetLoading ? <span className="spinner" /> : 'Reset My Password'}
                </button>
              </form>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 16 }}>
                <span onClick={() => go('forgot')}
                  style={{ fontSize: '0.85rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                  &lt;- Resend OTP
                </span>
                <span onClick={() => go('login')}
                  style={{ fontSize: '0.85rem', color: 'var(--text3)', cursor: 'pointer' }}>
                  Back to Login
                </span>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', justifyContent: 'center', gap: 20 }}>
            <a href="/staff/login" style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>Staff Login</a>
            <a href="/supervisor/login" style={{ fontSize: '0.82rem', color: '#7c3aed', fontWeight: 600 }}>Supervisor Login</a>
          </div>
        </div>
      </div>
    </>
  );
}
