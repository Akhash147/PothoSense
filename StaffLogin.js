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

// views: 'login' | 'register' | 'forgot' | 'reset'
export default function StaffLogin() {
  const { t, language, setLanguage } = useTranslator();
  const { loginStaff, darkMode, setDarkMode } = useApp();
  const navigate = useNavigate();

  const [view, setView] = useState('login');

  // -- Login state
  const [loginForm, setLoginForm] = useState({ employee_id: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // -- Register state
  const [regForm, setRegForm] = useState({ name: '', employee_id: '', email: '', password: '', zone: '', admin_key: '' });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // -- Forgot state
  const [fpEmail, setFpEmail] = useState('');
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState('');
  const [fpSuccess, setFpSuccess] = useState('');

  // -- Reset state
  const [otp, setOtp] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const clearAll = () => {
    setLoginError(''); setRegError(''); setRegSuccess('');
    setFpError(''); setFpSuccess(''); setResetError(''); setResetSuccess('');
  };
  const go = (v) => { clearAll(); setView(v); };

  // -- Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(''); setLoginLoading(true);
    try {
      const res = await API.post('/auth/staff/login', loginForm);
      loginStaff(res.data.token, { name: res.data.name, zone: res.data.zone, employee_id: res.data.employee_id });
      navigate('/staff/dashboard');
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally { setLoginLoading(false); }
  };

  // -- Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegError(''); setRegSuccess('');
    if (regForm.password.length < 8) { setRegError('Password must be at least 8 characters'); return; }
    setRegLoading(true);
    try {
      await API.post('/auth/staff/register', regForm);
      setRegSuccess('Account created! Redirecting to login...');
      setTimeout(() => go('login'), 2500);
    } catch (err) {
      setRegError(err.response?.data?.error || 'Registration failed');
    } finally { setRegLoading(false); }
  };

  // -- Forgot: send OTP (only if email is registered)
  const handleForgot = async (e) => {
    e.preventDefault();
    setFpError(''); setFpSuccess(''); setFpLoading(true);
    try {
      const res = await API.post('/auth/staff/forgot-password', { email: fpEmail });
      setFpSuccess(res.data.message);
      setOtp(['', '', '', '']);
      setNewPassword(''); setConfirmPassword('');
      setTimeout(() => go('reset'), 1500);
    } catch (err) {
      // Shows "No staff account found with this email" if not registered
      setFpError(err.response?.data?.error || 'Failed to send OTP');
    } finally { setFpLoading(false); }
  };

  // -- OTP box input (auto-advance between boxes)
  const handleOtpChange = (val, idx) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = v;
    setOtp(next);
    if (v && idx < 3) document.getElementById(`otp-s-${idx + 1}`)?.focus();
  };
  const handleOtpKey = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0)
      document.getElementById(`otp-s-${idx - 1}`)?.focus();
  };

  // -- Reset: verify OTP + new password
  const handleReset = async (e) => {
    e.preventDefault();
    setResetError(''); setResetSuccess('');
    const otpVal = otp.join('');
    if (otpVal.length < 4) { setResetError('Please enter the complete 4-digit OTP'); return; }
    if (newPassword !== confirmPassword) { setResetError('Passwords do not match'); return; }
    if (newPassword.length < 8) { setResetError('Password must be at least 8 characters'); return; }
    setResetLoading(true);
    try {
      const res = await API.post('/auth/staff/reset-password', {
        email: fpEmail, otp: otpVal, new_password: newPassword,
      });
      setResetSuccess(res.data.message);
      setTimeout(() => go('login'), 2500);
    } catch (err) {
      setResetError(err.response?.data?.error || 'Reset failed');
    } finally { setResetLoading(false); }
  };

  return (
    <>
      <Navbar mode="staff" />
      <div className="auth-page">
        <div className="auth-container fade-in">

          {/* Logo */}
          <div className="auth-logo">
            
            <h1 style={{ color: 'var(--text)' }}>{"Staff Portal"}</h1>
            <p>{"PothoSense"} -- Staff Portal</p>
          </div>

          {/* Lang + Dark Mode */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, justifyContent: 'center' }}>
            <LanguageSelector style={{ borderRadius: 8, padding: "5px 8px", border: "1px solid var(--border)", background: "var(--bg2)", color: "var(--text)", cursor: "pointer" }} />
            <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? 'Light' : 'Dark'}
            </button>
          </div>

          {/* ==== LOGIN / REGISTER ==== */}
          {(view === 'login' || view === 'register') && (
            <>
              <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg3)', borderRadius: 10, padding: 4 }}>
                {['login', 'register'].map(k => (
                  <button key={k} onClick={() => go(k)} style={{
                    flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: '0.9rem',
                    background: view === k ? 'var(--primary)' : 'transparent',
                    color: view === k ? '#fff' : 'var(--text2)',
                  }}>
                    {k === 'login' ? 'Login' : 'Register'}
                  </button>
                ))}
              </div>

              {view === 'login' && (
                <div className="card">
                  {loginError && <div className="alert alert-error">{loginError}</div>}
                  <form onSubmit={handleLogin}>
                    <div className="form-group">
                      <label className="form-label">{"Employee ID"}</label>
                      <input type="text" className="form-input" required placeholder="STAFF001"
                        value={loginForm.employee_id}
                        onChange={e => setLoginForm({ ...loginForm, employee_id: e.target.value.toUpperCase() })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{"Password"}</label>
                      <input type="password" className="form-input" required placeholder="********"
                        value={loginForm.password}
                        onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
                    </div>
                    <div style={{ textAlign: 'right', marginTop: -10, marginBottom: 16 }}>
                      <span onClick={() => go('forgot')}
                        style={{ fontSize: '0.82rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                        Forgot password?
                      </span>
                    </div>
                    <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loginLoading}>
                      {loginLoading ? <span className="spinner" /> : "Sign In"}
                    </button>
                  </form>
                  <div className="alert alert-info" style={{ marginTop: 16 }}>
                    <strong>Demo credentials:</strong><br />
                    Employee ID: <code>STAFF001</code> &nbsp;|&nbsp; Password: <code>Staff@123</code>
                  </div>
                </div>
              )}

              {view === 'register' && (
                <div className="card">
                  {regError && <div className="alert alert-error">{regError}</div>}
                  {regSuccess && <div className="alert alert-success">{regSuccess}</div>}
                  <form onSubmit={handleRegister}>
                    {[
                      { label: 'Full Name', key: 'name', type: 'text', ph: 'Your full name' },
                      { label: 'Employee ID', key: 'employee_id', type: 'text', ph: 'e.g. STAFF004', up: true },
                      { label: 'Email', key: 'email', type: 'email', ph: 'you@municipality.gov' },
                      { label: 'Zone', key: 'zone', type: 'text', ph: 'e.g. Zone A' },
                      { label: 'Password', key: 'password', type: 'password', ph: 'min 8 characters' },
                      { label: 'Admin Secret Key', key: 'admin_key', type: 'password', ph: 'Get from your administrator' },
                    ].map(f => (
                      <div className="form-group" key={f.key}>
                        <label className="form-label">{f.label}</label>
                        <input type={f.type} className="form-input" required placeholder={f.ph}
                          value={regForm[f.key]}
                          onChange={e => setRegForm({ ...regForm, [f.key]: f.up ? e.target.value.toUpperCase() : e.target.value })} />
                      </div>
                    ))}
                    <div className="alert alert-warning" style={{ marginBottom: 16 }}>
                      <strong>(!) Demo Admin Key:</strong> <code>POTHOSENSE_ADMIN_2024</code>
                    </div>
                    <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={regLoading}>
                      {regLoading ? <span className="spinner" /> : 'Create Staff Account'}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}

          {/* ==== FORGOT PASSWORD ==== */}
          {view === 'forgot' && (
            <div className="card">
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                
                <h2 style={{ color: 'var(--text)', margin: '0 0 6px' }}>Reset Password</h2>
                <p style={{ color: 'var(--text3)', fontSize: '0.85rem', margin: 0 }}>
                  Enter the email you used when your account was created.
                </p>
              </div>
              {fpError && <div className="alert alert-error">{fpError}</div>}
              {fpSuccess && <div className="alert alert-success">{fpSuccess}</div>}
              <form onSubmit={handleForgot}>
                <div className="form-group">
                  <label className="form-label">Registered Email</label>
                  <input type="email" className="form-input" required placeholder="you@municipality.gov"
                    value={fpEmail} onChange={e => setFpEmail(e.target.value)} />
                  <small style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: 4, display: 'block' }}>
                    (!) Must be the email linked to your staff account
                  </small>
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={fpLoading}>
                  {fpLoading ? <span className="spinner" /> : 'Send OTP to My Email'}
                </button>
              </form>
              <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.85rem' }}>
                <span onClick={() => go('login')} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                  Back to Login
                </span>
              </p>
            </div>
          )}

          {/* ==== ENTER OTP + RESET ==== */}
          {view === 'reset' && (
            <div className="card">
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                
                <h2 style={{ color: 'var(--text)', margin: '0 0 6px' }}>Enter OTP</h2>
                <p style={{ color: 'var(--text3)', fontSize: '0.85rem', margin: 0 }}>
                  A 4-digit OTP was sent to <strong>{fpEmail}</strong>.<br />
                  Valid for 10 minutes.
                </p>
              </div>
              {resetError && <div className="alert alert-error">{resetError}</div>}
              {resetSuccess && <div className="alert alert-success">{resetSuccess}</div>}
              <form onSubmit={handleReset}>
                {/* 4-box OTP */}
                <div className="form-group">
                  <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>
                    4-Digit OTP
                  </label>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '8px 0 20px' }}>
                    {otp.map((val, idx) => (
                      <input
                        key={idx}
                        id={`otp-s-${idx}`}
                        type="text" inputMode="numeric" maxLength={1}
                        value={val}
                        onChange={e => handleOtpChange(e.target.value, idx)}
                        onKeyDown={e => handleOtpKey(e, idx)}
                        style={{
                          width: 56, height: 64, fontSize: '1.8rem', fontWeight: 900,
                          textAlign: 'center', borderRadius: 10,
                          border: `2px solid ${val ? 'var(--primary)' : 'var(--border)'}`,
                          background: val ? 'rgba(212,67,10,0.08)' : 'var(--bg3)',
                          color: 'var(--text)', outline: 'none',
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-input" required placeholder="min 8 characters"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" className="form-input" required placeholder="repeat new password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={resetLoading}>
                  {resetLoading ? <span className="spinner" /> : 'Reset My Password'}
                </button>
              </form>
              <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', justifyContent: 'center', gap: 20 }}>
                <span onClick={() => go('forgot')} style={{ fontSize: '0.85rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                  &lt;- Resend OTP
                </span>
                <span onClick={() => go('login')} style={{ fontSize: '0.85rem', color: 'var(--text3)', cursor: 'pointer' }}>
                  Back to Login
                </span>
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', justifyContent: 'center', gap: 20 }}>
            <a href="/login" style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600 }}>Citizen Login</a>
            <a href="/supervisor/login" style={{ fontSize: '0.82rem', color: '#7c3aed', fontWeight: 600 }}>Supervisor Login</a>
          </div>
        </div>
      </div>
    </>
  );
}
