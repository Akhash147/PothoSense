// E:\Pothosense\frontend\src\pages\SupervisorLogin.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LanguageSelector } from '../utils/AITranslator';
import API from '../utils/api';

const PURPLE = '#7c3aed';

function Input({ label, value, onChange, type, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: 'block', fontWeight: 700, fontSize: '0.8rem',
        color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6,
      }}>{label}</label>
      <input
        type={type || 'text'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder || ''} autoCapitalize="none"
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', padding: '12px 14px', borderRadius: 10, fontSize: '1rem',
          border: `1.5px solid ${focused ? PURPLE : 'var(--border)'}`,
          background: 'var(--bg)', color: 'var(--text)', boxSizing: 'border-box', outline: 'none',
        }}
      />
    </div>
  );
}

export default function SupervisorLogin() {
  const { loginSupervisor, darkMode, setDarkMode } = useApp();
  const navigate = useNavigate();

  const [view,   setView]   = useState('login');
  const [form,   setForm]   = useState({ employee_id: '', password: '', name: '', email: '', zone: '', admin_key: '' });
  const [fpEmail, setFp]    = useState('');
  const [otp,    setOtp]    = useState(['', '', '', '']);
  const [newPw,  setNewPw]  = useState('');
  const [confPw, setConf]   = useState('');
  const [loading, setLd]    = useState(false);
  const [error,   setErr]   = useState('');
  const [success, setOk]    = useState('');

  const go  = (v) => { setErr(''); setOk(''); setView(v); };
  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  const handleOtp = (val, i) => {
    const next = [...otp]; next[i] = val.replace(/\D/, '').slice(-1); setOtp(next);
    if (val && i < 3) document.getElementById(`supotp${i + 1}`)?.focus();
  };
  const handleOtpKey = (e, i) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) document.getElementById(`supotp${i - 1}`)?.focus();
  };

  const handleLogin = async () => {
    if (!form.employee_id || !form.password) { setErr('All fields required'); return; }
    setErr(''); setLd(true);
    try {
      const res = await API.post('/auth/supervisor/login', { employee_id: form.employee_id, password: form.password });
      loginSupervisor(res.data.token, { name: res.data.name, zone: res.data.zone, employee_id: res.data.employee_id, admin_key: res.data.admin_key });
      navigate('/supervisor/dashboard');
    } catch (e) { setErr(e.response?.data?.error || 'Login failed. Check your credentials.'); }
    finally { setLd(false); }
  };

  const handleRegister = async () => {
    if (!form.name || !form.employee_id || !form.password || !form.admin_key) { setErr('All fields required'); return; }
    if (form.password.length < 8) { setErr('Password must be at least 8 characters'); return; }
    setErr(''); setLd(true);
    try {
      await API.post('/auth/supervisor/register', form);
      setOk('Account created! You can now sign in.');
      setTimeout(() => go('login'), 2000);
    } catch (e) { setErr(e.response?.data?.error || 'Registration failed'); }
    finally { setLd(false); }
  };

  const handleForgot = async () => {
    if (!fpEmail) { setErr('Enter your email'); return; }
    setErr(''); setLd(true);
    try {
      await API.post('/auth/supervisor/forgot-password', { email: fpEmail });
      setOk('OTP sent to your email.');
      setTimeout(() => go('reset'), 1500);
    } catch (e) { setErr(e.response?.data?.error || 'Failed to send OTP'); }
    finally { setLd(false); }
  };

  const handleReset = async () => {
    if (otp.join('').length < 4) { setErr('Enter the complete 4-digit OTP'); return; }
    if (newPw !== confPw) { setErr('Passwords do not match'); return; }
    if (newPw.length < 8) { setErr('Password must be at least 8 characters'); return; }
    setErr(''); setLd(true);
    try {
      await API.post('/auth/supervisor/reset-password', { email: fpEmail, otp: otp.join(''), new_password: newPw });
      setOk('Password reset successfully!');
      setTimeout(() => go('login'), 2000);
    } catch (e) { setErr(e.response?.data?.error || 'Reset failed'); }
    finally { setLd(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{
        background: PURPLE, padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', color: '#fff',
            fontWeight: 900, fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>PS</div>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem' }}>PothoSense</span>
          <span style={{
            background: 'rgba(255,255,255,0.2)', color: '#fff',
            fontSize: '0.7rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20,
          }}>SUPERVISOR</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <LanguageSelector />
          <button onClick={() => setDarkMode(!darkMode)} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer',
            color: '#fff', padding: '4px 12px', borderRadius: 8, fontWeight: 600, fontSize: '0.78rem',
          }}>
            {darkMode ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 440 }}>

          {/* Logo block */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', background: PURPLE,
              color: '#fff', fontSize: '1.5rem', fontWeight: 900,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px',
            }}>PS</div>
            <h1 style={{ margin: '0 0 4px', fontWeight: 900, fontSize: '1.6rem', color: PURPLE }}>Supervisor Portal</h1>
            <p style={{ margin: 0, color: 'var(--text3)', fontSize: '0.88rem' }}>PothoSense Administration</p>
          </div>

          {/* Card */}
          <div style={{ background: 'var(--bg2)', borderRadius: 16, border: '1px solid var(--border)', padding: 28 }}>

            {/* Tab switcher */}
            {(view === 'login' || view === 'register') && (
              <div style={{ display: 'flex', gap: 4, background: 'var(--bg3)', borderRadius: 12, padding: 4, marginBottom: 22 }}>
                {['login', 'register'].map(k => (
                  <button key={k} onClick={() => go(k)} style={{
                    flex: 1, padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: '0.9rem',
                    background: view === k ? PURPLE : 'transparent',
                    color: view === k ? '#fff' : 'var(--text3)',
                  }}>
                    {k === 'login' ? 'Sign In' : 'Register'}
                  </button>
                ))}
              </div>
            )}

            {error   && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontWeight: 600, fontSize: '0.88rem' }}>{error}</div>}
            {success && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontWeight: 600, fontSize: '0.88rem' }}>{success}</div>}

            {/* LOGIN */}
            {view === 'login' && (
              <>
                <Input label="Employee ID" value={form.employee_id} onChange={set('employee_id')} placeholder="e.g. SUP001" />
                <Input label="Password" value={form.password} onChange={set('password')} type="password" placeholder="Your password" />
                <div style={{ textAlign: 'right', marginBottom: 18, marginTop: -6 }}>
                  <span onClick={() => go('forgot')} style={{ fontSize: '0.82rem', color: PURPLE, cursor: 'pointer', fontWeight: 700 }}>
                    Forgot password?
                  </span>
                </div>
                <button onClick={handleLogin} disabled={loading} style={{
                  width: '100%', padding: '14px', background: loading ? '#9ca3af' : PURPLE,
                  color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  borderRadius: 12, fontWeight: 900, fontSize: '1rem',
                }}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
                <div style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 10, padding: '10px 14px', marginTop: 16, fontSize: '0.82rem', color: '#5b21b6' }}>
                  <strong>Default login:</strong> SUP001 / Supervisor@123
                </div>
              </>
            )}

            {/* REGISTER */}
            {view === 'register' && (
              <>
                <Input label="Full Name"        value={form.name}        onChange={set('name')}        placeholder="Your full name" />
                <Input label="Employee ID"      value={form.employee_id} onChange={set('employee_id')} placeholder="e.g. SUP002" />
                <Input label="Email (optional)" value={form.email}       onChange={set('email')}       placeholder="email@city.gov" type="email" />
                <Input label="Zone / Area"      value={form.zone}        onChange={set('zone')}        placeholder="e.g. North Zone" />
                <Input label="Password"         value={form.password}    onChange={set('password')}    type="password" placeholder="Min 8 characters" />
                <Input label="Global Admin Key" value={form.admin_key}   onChange={set('admin_key')}   type="password" placeholder="Get this from your administrator" />
                <button onClick={handleRegister} disabled={loading} style={{
                  width: '100%', padding: '14px', background: loading ? '#9ca3af' : PURPLE,
                  color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  borderRadius: 12, fontWeight: 900, fontSize: '1rem',
                }}>
                  {loading ? 'Creating account...' : 'Create Supervisor Account'}
                </button>
              </>
            )}

            {/* FORGOT PASSWORD */}
            {view === 'forgot' && (
              <>
                <h3 style={{ margin: '0 0 6px', fontWeight: 800, color: 'var(--text)' }}>Reset Password</h3>
                <p style={{ margin: '0 0 18px', color: 'var(--text3)', fontSize: '0.85rem' }}>
                  Enter the email linked to your supervisor account.
                </p>
                <Input label="Registered Email" value={fpEmail} onChange={setFp} placeholder="your@email.com" type="email" />
                <button onClick={handleForgot} disabled={loading} style={{
                  width: '100%', padding: '13px', background: loading ? '#9ca3af' : PURPLE,
                  color: '#fff', border: 'none', cursor: 'pointer', borderRadius: 12, fontWeight: 800,
                }}>
                  {loading ? 'Sending...' : 'Send OTP to My Email'}
                </button>
                <button onClick={() => go('login')} style={{
                  width: '100%', padding: '10px', background: 'none', border: 'none',
                  cursor: 'pointer', color: PURPLE, fontWeight: 700, marginTop: 10, fontSize: '0.9rem',
                }}>Back to Sign In</button>
              </>
            )}

            {/* RESET PASSWORD */}
            {view === 'reset' && (
              <>
                <h3 style={{ margin: '0 0 6px', fontWeight: 800, color: 'var(--text)' }}>Enter OTP</h3>
                <p style={{ margin: '0 0 18px', color: 'var(--text3)', fontSize: '0.85rem' }}>
                  A 4-digit OTP was sent to <strong style={{ color: PURPLE }}>{fpEmail}</strong>. Valid for 10 minutes.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
                  {otp.map((v, i) => (
                    <input key={i} id={`supotp${i}`} type="text" inputMode="numeric" maxLength={1} value={v}
                      onChange={e => handleOtp(e.target.value, i)} onKeyDown={e => handleOtpKey(e, i)}
                      style={{
                        width: 58, height: 66, fontSize: '1.8rem', fontWeight: 900, textAlign: 'center',
                        borderRadius: 12, outline: 'none',
                        border: `2px solid ${v ? PURPLE : 'var(--border)'}`,
                        background: v ? '#f5f3ff' : 'var(--bg3)', color: 'var(--text)',
                      }} />
                  ))}
                </div>
                <Input label="New Password"     value={newPw}  onChange={setNewPw} type="password" placeholder="Min 8 characters" />
                <Input label="Confirm Password" value={confPw} onChange={setConf}  type="password" placeholder="Repeat new password" />
                <button onClick={handleReset} disabled={loading} style={{
                  width: '100%', padding: '13px', background: loading ? '#9ca3af' : PURPLE,
                  color: '#fff', border: 'none', cursor: 'pointer', borderRadius: 12, fontWeight: 800,
                }}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 14 }}>
                  <span onClick={() => go('forgot')} style={{ fontSize: '0.85rem', color: PURPLE, cursor: 'pointer', fontWeight: 600 }}>Resend OTP</span>
                  <span onClick={() => go('login')} style={{ fontSize: '0.85rem', color: 'var(--text3)', cursor: 'pointer' }}>Back to Login</span>
                </div>
              </>
            )}
          </div>

          {/* Links to other portals */}
          <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', justifyContent: 'center', gap: 24 }}>
            <a href="/login" style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Citizen Login</a>
            <a href="/staff/login" style={{ fontSize: '0.82rem', color: '#1d4ed8', fontWeight: 600, textDecoration: 'none' }}>Staff Login</a>
          </div>
        </div>
      </div>
    </div>
  );
}
