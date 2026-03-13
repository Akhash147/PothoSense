// E:\Pothosense\frontend\src\components\Navbar.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { LanguageSelector } from '../utils/AITranslator';
import API from '../utils/api';

export default function Navbar({ mode }) {
  const {
    citizenUser, staffUser, supervisorUser,
    logoutCitizen, logoutStaff, logoutSupervisor,
    darkMode, setDarkMode,
  } = useApp();
  const navigate = useNavigate();

  const [menuOpen,  setMenuOpen]  = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread,    setUnread]    = useState(0);
  const [notifs,    setNotifs]    = useState([]);

  const currentUser =
    mode === 'citizen'    ? citizenUser :
    mode === 'staff'      ? staffUser?.name?.split(' ')[0] :
    mode === 'supervisor' ? supervisorUser?.name?.split(' ')[0] : null;

  const isLoggedIn = !!currentUser;

  useEffect(() => {
    if (!isLoggedIn || mode === 'supervisor') return;
    fetchNotifications();
    const id = setInterval(fetchNotifications, 60000);
    return () => clearInterval(id);
  }, [isLoggedIn]);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/analytics/notifications');
      setUnread(res.data.unread || 0);
      setNotifs(res.data.notifications || []);
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await API.put('/analytics/notifications/read-all');
      setUnread(0);
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleLogout = () => {
    if (mode === 'citizen')    { logoutCitizen();    navigate('/login'); }
    if (mode === 'staff')      { logoutStaff();      navigate('/staff/login'); }
    if (mode === 'supervisor') { logoutSupervisor(); navigate('/supervisor/login'); }
    setMenuOpen(false);
  };

  const notifColor = { success: '#2e7d32', warning: '#f57c00', alert: '#c62828', info: '#1565c0' };

  // Supervisor gets a distinct purple accent
  const accentColor = mode === 'supervisor' ? '#7c3aed' : 'var(--primary)';

  return (
    <nav style={{
      background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
    }}>
      <div style={{
        maxWidth: 1100, margin: '0 auto', padding: '0 16px',
        display: 'flex', alignItems: 'center', height: 58,
      }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, marginRight: 24 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: '50%',
            background: accentColor, color: '#fff', fontWeight: 900, fontSize: '0.9rem', flexShrink: 0,
          }}>PS</span>
          <span style={{ fontWeight: 900, fontSize: '1.1rem', color: accentColor }}>PothoSense</span>
          {mode === 'supervisor' && (
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, color: '#7c3aed',
              background: '#f3f0ff', padding: '2px 8px', borderRadius: 20, marginLeft: 4,
            }}>SUPERVISOR</span>
          )}
          {mode === 'staff' && (
            <span style={{
              fontSize: '0.7rem', fontWeight: 700, color: '#1d4ed8',
              background: '#eff6ff', padding: '2px 8px', borderRadius: 20, marginLeft: 4,
            }}>STAFF</span>
          )}
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 4, flex: 1, alignItems: 'center' }}>
          {mode === 'citizen' && (
            <>
              <NavLink to="/map">Map</NavLink>
              <NavLink to="/route-safety">Route Safety</NavLink>
              <NavLink to="/leaderboard">Leaderboard</NavLink>
              {isLoggedIn && (
                <>
                  <NavLink to="/citizen/report">Report</NavLink>
                  <NavLink to="/citizen/my-reports">My Reports</NavLink>
                  <NavLink to="/citizen/verify">Verify</NavLink>
                </>
              )}
            </>
          )}
          {mode === 'staff' && isLoggedIn && (
            <NavLink to="/staff/dashboard">Dashboard</NavLink>
          )}
          {mode === 'supervisor' && isLoggedIn && (
            <NavLink to="/supervisor/dashboard" color="#7c3aed">Dashboard</NavLink>
          )}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

          <LanguageSelector />

          {/* Dark mode toggle */}
          <button onClick={() => setDarkMode(!darkMode)} style={{
            background: 'none', border: '1px solid var(--border)', cursor: 'pointer',
            fontSize: '0.78rem', padding: '4px 10px', borderRadius: 8, color: 'var(--text2)', fontWeight: 600,
          }}>
            {darkMode ? 'Light' : 'Dark'}
          </button>

          {/* Notifications - citizen and staff only */}
          {isLoggedIn && mode !== 'supervisor' && (
            <div style={{ position: 'relative' }}>
              <button onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen && unread > 0) markAllRead(); }}
                style={{
                  background: 'none', border: '1px solid var(--border)', cursor: 'pointer',
                  padding: '4px 10px', borderRadius: 8, fontSize: '0.78rem',
                  fontWeight: 600, color: 'var(--text2)', position: 'relative',
                }}>
                Alerts
                {unread > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4,
                    width: 16, height: 16, background: '#d32f2f', color: '#fff',
                    borderRadius: '50%', fontSize: '0.6rem', fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '110%', width: 300, maxHeight: 360,
                  overflowY: 'auto', background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 200,
                }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontWeight: 700, color: 'var(--text)', fontSize: '0.85rem' }}>
                    Notifications
                  </div>
                  {notifs.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: '0.85rem' }}>
                      No notifications yet
                    </div>
                  ) : notifs.map(n => (
                    <div key={n.id} style={{
                      padding: '10px 14px', borderBottom: '1px solid var(--border)',
                      background: n.is_read ? 'transparent' : 'rgba(212,67,10,0.04)',
                    }}>
                      <div style={{ fontWeight: 700, color: notifColor[n.type] || 'var(--text)', fontSize: '0.82rem', marginBottom: 2 }}>{n.title}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text2)', marginBottom: 3 }}>{n.message}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text3)' }}>{new Date(n.created_at).toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* User menu / login button */}
          {isLoggedIn ? (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setMenuOpen(!menuOpen)} style={{
                background: accentColor, border: 'none', cursor: 'pointer',
                color: '#fff', padding: '6px 14px', borderRadius: 20, fontWeight: 700, fontSize: '0.82rem',
              }}>
                {currentUser} &nbsp;&#9660;
              </button>
              {menuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: '110%',
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', minWidth: 140, zIndex: 200,
                }}>
                  <button onClick={handleLogout} style={{
                    width: '100%', padding: '12px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', color: '#c62828', fontWeight: 700, textAlign: 'left', fontSize: '0.88rem',
                  }}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <Link to={mode === 'staff' ? '/staff/login' : mode === 'supervisor' ? '/supervisor/login' : '/login'}
                style={{
                  background: accentColor, color: '#fff', padding: '6px 16px',
                  borderRadius: 20, textDecoration: 'none', fontWeight: 700, fontSize: '0.82rem',
                }}>
                Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, children, color }) {
  return (
    <Link to={to} style={{
      textDecoration: 'none', color: color || 'var(--text2)',
      fontWeight: 600, fontSize: '0.85rem',
      padding: '6px 10px', borderRadius: 8, whiteSpace: 'nowrap',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      {children}
    </Link>
  );
}
