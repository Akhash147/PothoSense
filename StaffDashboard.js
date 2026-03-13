import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslator } from '../utils/AITranslator';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import API from '../utils/api';
import Navbar from '../components/Navbar';

// 
// SIDEBAR
// 
function Sidebar({ activeTab, setActiveTab }) {
  const { t, language, setLanguage } = useTranslator();
  const { logoutStaff, staffUser } = useApp();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const navGroups = [
    {
      label: 'Operations',
      items: [
        { id: 'overview',    label: 'Overview',       abbr: 'OV' },
        { id: 'all-reports', label: 'All Reports',    abbr: 'AR' },
        { id: 'my-work',     label: 'My Work',        abbr: 'MW' },
        { id: 'heatmap',     label: 'Live Map',       abbr: 'MAP' },
      ],
    },
    {
      label: 'Intelligence',
      items: [
        { id: 'predictive',  label: 'Predictive AI',  abbr: 'AI' },
        { id: 'optimizer',   label: 'Route Optimizer',abbr: 'RT' },
        { id: 'sla',         label: 'SLA Monitor',    abbr: 'SLA' },
        { id: 'weather',     label: 'Weather',        abbr: 'WX' },
      ],
    },
    {
      label: 'Management',
      items: [
        { id: 'timeline',    label: 'Activity Log',   abbr: 'LOG' },
        { id: 'analytics',   label: 'Analytics',      abbr: 'ANL' },
        { id: 'users',       label: 'Users',          abbr: 'USR' },
      ],
    },
  ];

  const sidebarWidth = collapsed ? 64 : 220;

  return (
    <aside style={{
      width: sidebarWidth,
      minWidth: sidebarWidth,
      flexShrink: 0,
      background: 'var(--card)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      overflowY: 'auto',
      overflowX: 'hidden',
      transition: 'width 0.2s ease, min-width 0.2s ease',
      zIndex: 10,
    }}>

      {/* Header */}
      <div style={{
        padding: '16px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: 8,
        minHeight: 60,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--primary)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: '0.8rem', flexShrink: 0,
            }}>PS</div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {staffUser?.name || 'Staff'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text3)' }}>Zone {staffUser?.zone || '--'}</div>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text3)', fontSize: '1rem', padding: 4,
            borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? '>' : '<'}
        </button>
      </div>

      {/* Language selector  only when expanded */}
      {!collapsed && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
          <select
            style={{
              width: '100%', padding: '6px 8px', borderRadius: 6,
              border: '1px solid var(--border)', background: 'var(--bg2)',
              color: 'var(--text)', fontSize: '0.8rem', cursor: 'pointer',
            }}
            value={language}
            onChange={e => setLanguage(e.target.value)}
          >
            {[['en','English'],['ta','Tamil'],['hi','Hindi'],['te','Telugu'],['ml','Malayalam'],['kn','Kannada']]
              .map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select>
        </div>
      )}

      {/* Nav groups */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {navGroups.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <div style={{
                padding: '10px 14px 4px',
                fontSize: '0.65rem', fontWeight: 700,
                color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                {group.label}
              </div>
            )}
            {group.items.map(item => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={collapsed ? item.label : ''}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: collapsed ? 0 : 10,
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '10px 0' : '9px 14px',
                    background: active ? 'var(--primary)' : 'none',
                    border: 'none',
                    borderRadius: 0,
                    cursor: 'pointer',
                    color: active ? '#fff' : 'var(--text2)',
                    fontWeight: active ? 700 : 400,
                    fontSize: '0.875rem',
                    textAlign: 'left',
                    transition: 'background 0.15s, color 0.15s',
                    borderLeft: active && !collapsed ? '3px solid rgba(255,255,255,0.5)' : '3px solid transparent',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg3)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'none'; }}
                >
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                    background: active ? 'rgba(255,255,255,0.2)' : 'var(--bg3)',
                    fontSize: '0.6rem', fontWeight: 800, color: active ? '#fff' : 'var(--text3)',
                    letterSpacing: '-0.02em',
                  }}>
                    {item.abbr}
                  </span>
                  {!collapsed && (
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '8px 0' }}>
        <button
          onClick={() => { logoutStaff(); navigate('/staff/login'); }}
          title={collapsed ? 'Logout' : ''}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center',
            gap: collapsed ? 0 : 10,
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '10px 0' : '9px 14px',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#ef4444', fontSize: '0.875rem', fontWeight: 600,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
        >
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 28, height: 28, borderRadius: 6, flexShrink: 0,
            background: '#fef2f2', fontSize: '0.7rem', fontWeight: 800, color: '#ef4444',
          }}>OUT</span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

function ReportCard({ r, onUpdate, showAssign }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [afterFile, setAfterFile] = useState(null);

  const slaExpired = r.sla_deadline && !r.sla_breached && new Date(r.sla_deadline) < new Date();
  const deadline = r.sla_deadline ? new Date(r.sla_deadline).toLocaleString() : null;

  const update = async (status) => {
    setUpdating(true);
    try {
      const fd = new FormData();
      fd.append('status', status);
      if (notes) fd.append('notes', notes);
      if (afterFile) fd.append('after_photo', afterFile);
      await API.put(`/reports/staff/update/${r.id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUpdate();
    } catch (e) { alert('Update failed'); }
    finally { setUpdating(false); }
  };

  const assignToMe = async () => {
    try { await API.put(`/reports/staff/assign/${r.id}`, {}); onUpdate(); }
    catch (e) { alert('Assign failed'); }
  };

  return (
    <div className="card" style={{ marginBottom: 12, border: r.sla_breached ? '1px solid #ef4444' : slaExpired ? '1px solid #f97316' : undefined }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
            <span className={`badge badge-${r.severity}`}>{r.severity}</span>
            <span className={`badge badge-${r.status}`}>{r.status}</span>
            {r.sla_breached && <span className="badge" style={{ background: '#ef4444', color: 'white' }}>(!)SLA Breached</span>}
            {slaExpired && !r.sla_breached && <span className="badge" style={{ background: '#f97316', color: 'white' }}>Clock Overdue</span>}
            {r.detection_type === 'sensor' && <span className="badge" style={{ background: '#8b5cf6', color: 'white' }}> Sensor</span>}
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.address || `${parseFloat(r.latitude).toFixed(4)}, ${parseFloat(r.longitude).toFixed(4)}`}</div>
          {deadline && <div style={{ fontSize: '0.75rem', color: r.sla_breached ? '#ef4444' : 'var(--text3)', marginTop: 2 }}>SLA: {deadline}</div>}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          {r.photo_path && <img src={`/uploads/${r.photo_path}`} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6 }} />}
          <span style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>{expanded ? '^' : 'v'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 12 }}>
          {r.description && <p style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: 12 }}>{r.description}</p>}

          {/* Before / After photos */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            {r.before_photo && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: 4 }}>Before</div>
                <img src={`/uploads/${r.before_photo}`} alt="before" style={{ width: 120, borderRadius: 6 }} />
              </div>
            )}
            {r.after_photo && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: 4 }}>After</div>
                <img src={`/uploads/${r.after_photo}`} alt="after" style={{ width: 120, borderRadius: 6 }} />
              </div>
            )}
          </div>

          {/* Upload after photo */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}> Upload After-Repair Photo</label>
            <input type="file" accept="image/*" onChange={e => setAfterFile(e.target.files[0])}
              style={{ fontSize: '0.8rem' }} />
          </div>

          <textarea
            placeholder="Add notes (optional)..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid var(--border)',
              background: 'var(--bg2)', color: 'var(--text1)', fontSize: '0.85rem', marginBottom: 10, resize: 'vertical', minHeight: 60 }}
          />

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`} target="_blank" rel="noreferrer"
              className="btn btn-secondary btn-sm"> Navigate</a>
            {showAssign && !r.assigned_to && (
              <button className="btn btn-secondary btn-sm" onClick={assignToMe}> Assign to Me</button>
            )}
            {r.status !== 'in_progress' && r.status !== 'resolved' && (
              <button className="btn btn-warning btn-sm" disabled={updating} onClick={() => update('in_progress')}> In Progress</button>
            )}
            {r.status !== 'resolved' && (
              <button className="btn btn-success btn-sm" disabled={updating} onClick={() => update('resolved')}>(OK) Mark Resolved</button>
            )}
            {r.status === 'pending' && (
              <button className="btn btn-sm" style={{ background: '#ef4444', color: 'white' }} disabled={updating} onClick={() => update('rejected')}>(X) Reject</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 
// MAIN DASHBOARD
// 

// 
//  USER MANAGEMENT PANEL
// 
function UserManagementPanel() {
  const [tab, setTab] = React.useState('citizens');
  const [citizens, setCitizens] = React.useState([]);
  const [staffList, setStaffList] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'citizens') {
        const res = await API.get('/auth/admin/citizens');
        setCitizens(Array.isArray(res.data) ? res.data : []);
      } else {
        const res = await API.get('/auth/admin/staff');
        setStaffList(Array.isArray(res.data) ? res.data : []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const deleteCitizen = async (id, username) => {
    if (!window.confirm(`Delete citizen "${username}"? Their reports will be kept but disowned.`)) return;
    try {
      await API.delete(`/auth/admin/citizen/${id}`);
      setCitizens(prev => prev.filter(c => c.id !== id));
      alert('Citizen deleted successfully.');
    } catch (e) { alert('Delete failed: ' + (e.response?.data?.error || e.message)); }
  };

  const deactivateStaff = async (id, name) => {
    if (!window.confirm(`Deactivate staff member "${name}"? They will lose login access.`)) return;
    try {
      await API.delete(`/auth/admin/staff/${id}`);
      setStaffList(prev => prev.map(s => s.id === id ? { ...s, is_active: 0 } : s));
    } catch (e) { alert('Failed: ' + (e.response?.data?.error || e.message)); }
  };

  const reactivateStaff = async (id) => {
    try {
      await API.put(`/auth/admin/staff/${id}/reactivate`);
      setStaffList(prev => prev.map(s => s.id === id ? { ...s, is_active: 1 } : s));
    } catch (e) { alert('Reactivation failed'); }
  };

  const resetPoints = async (id, username) => {
    if (!window.confirm(`Reset points for "${username}" back to 0?`)) return;
    try {
      await API.put(`/auth/admin/citizen/${id}/reset-points`);
      setCitizens(prev => prev.map(c => c.id === id ? { ...c, points: 0, badge: 'newcomer' } : c));
    } catch (e) { alert('Failed'); }
  };

  const filtered = tab === 'citizens'
    ? citizens.filter(c =>
        c.username?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()))
    : staffList.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.employee_id?.toLowerCase().includes(search.toLowerCase()));

  const cardStyle = {
    background: 'var(--card)', borderRadius: 12, padding: '14px 16px',
    marginBottom: 10, border: '1px solid var(--border)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
  };

  const btnBase = { padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700, border: 'none' };

  return (
    <div style={{ maxWidth: 900 }}>
      <h2 style={{ color: 'var(--text)', marginBottom: 16 }}>&#x1F465; User Management</h2>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['citizens', '&#x1F464; Citizens'], ['staff', '&#x1F9D1; Staff']].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setSearch(''); }}
            style={{
              padding: '8px 22px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.9rem',
              background: tab === key ? 'var(--primary)' : 'var(--bg3)',
              color: tab === key ? '#fff' : 'var(--text2)',
            }}
            dangerouslySetInnerHTML={{ __html: label }}
          />
        ))}
      </div>

      {/* Search bar */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={tab === 'citizens' ? 'Search by username or email...' : 'Search by name or employee ID...'}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 8,
          border: '1px solid var(--border)', background: 'var(--bg3)',
          color: 'var(--text)', marginBottom: 12, fontSize: '0.9rem',
          boxSizing: 'border-box',
        }}
      />

      <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: 12 }}>
        {filtered.length} {tab === 'citizens' ? 'citizens' : 'staff'} found
        {tab === 'staff' && (
          <span style={{ marginLeft: 10, color: 'var(--warning)' }}>
            Staff are deactivated (not permanently deleted) to preserve work history
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>No users found</div>
      ) : tab === 'citizens' ? (
        filtered.map(c => (
          <div key={c.id} style={cardStyle}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>{c.username}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text3)', marginBottom: 4 }}>{c.email}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>
                Badge: <b>{c.badge}</b> &nbsp;|&nbsp;
                Points: <b>{c.points}</b> &nbsp;|&nbsp;
                Reports: <b>{c.report_count}</b> &nbsp;|&nbsp;
                Joined: {new Date(c.created_at).toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={() => resetPoints(c.id, c.username)}
                style={{ ...btnBase, background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                Reset Points
              </button>
              <button onClick={() => deleteCitizen(c.id, c.username)}
                style={{ ...btnBase, background: '#dc2626', color: '#fff' }}>
                &#x1F5D1; Delete
              </button>
            </div>
          </div>
        ))
      ) : (
        filtered.map(s => (
          <div key={s.id} style={{ ...cardStyle, opacity: s.is_active ? 1 : 0.55 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
                {s.name}
                {!s.is_active && (
                  <span style={{ marginLeft: 8, fontSize: '0.72rem', background: '#dc262622', color: '#dc2626', padding: '2px 8px', borderRadius: 4 }}>
                    INACTIVE
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>
                ID: <b>{s.employee_id}</b> &nbsp;|&nbsp;
                Zone: <b>{s.zone || 'Unassigned'}</b> &nbsp;|&nbsp;
                Repairs: <b>{s.repairs_completed || 0}</b>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              {s.is_active ? (
                <button onClick={() => deactivateStaff(s.id, s.name)}
                  style={{ ...btnBase, background: '#dc2626', color: '#fff' }}>
                  Deactivate
                </button>
              ) : (
                <button onClick={() => reactivateStaff(s.id)}
                  style={{ ...btnBase, background: '#16a34a', color: '#fff' }}>
                  Reactivate
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}


export default function StaffDashboard() {
  const { staffUser } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [reports, setReports]     = useState([]);
  const [myWork, setMyWork]       = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [summary, setSummary]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatusFilter]   = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [rRes, mRes, aRes, sRes] = await Promise.allSettled([
        API.get('/reports/staff/all'),
        API.get('/reports/staff/mine'),
        API.get('/reports/analytics'),
        API.get('/analytics/summary'),
      ]);
      if (rRes.status === 'fulfilled') setReports(rRes.value.data);
      if (mRes.status === 'fulfilled') setMyWork(mRes.value.data);
      if (aRes.status === 'fulfilled') setAnalytics(aRes.value.data);
      if (sRes.status === 'fulfilled') setSummary(sRes.value.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = reports.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (severityFilter && r.severity !== severityFilter) return false;
    return true;
  });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="spinner" />
    </div>
  );

  return (
    <>
      <Navbar />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)', overflow: 'hidden' }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', minWidth: 0 }}>

          {activeTab === 'overview' && (
            <OverviewTab reports={reports} myWork={myWork} summary={summary} loadData={loadData} setActiveTab={setActiveTab} />
          )}

          {activeTab === 'all-reports' && (
            <AllReportsTab reports={filtered} statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              severityFilter={severityFilter} setSeverityFilter={setSeverityFilter} loadData={loadData} />
          )}

          {activeTab === 'my-work' && (
            <MyWorkTab myWork={myWork} loadData={loadData} />
          )}

          {activeTab === 'heatmap' && (
            <>
              <h2 style={{ marginBottom: 20 }}>Live Pothole Map</h2>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <HeatmapView />
              </div>
            </>
          )}

          {activeTab === 'predictive' && <PredictiveTab />}
          {activeTab === 'optimizer'  && <OptimizerTab />}
          {activeTab === 'sla'        && <SLATab reports={reports} loadData={loadData} />}
          {activeTab === 'timeline'   && <TimelineTab />}
          {activeTab === 'analytics'  && <AnalyticsTab analytics={analytics} summary={summary} />}
          {activeTab === 'weather'    && <WeatherTab />}
          {activeTab === 'users'      && <UserManagementPanel />}

        </main>
      </div>
    </>
  );
}

// 
// OVERVIEW TAB
// 
function OverviewTab({ reports, myWork, summary, loadData, setActiveTab }) {
  const pending   = reports.filter(r => r.status === 'pending').length;
  const inProg    = reports.filter(r => r.status === 'in_progress').length;
  const resolved  = reports.filter(r => r.status === 'resolved').length;
  const severe    = reports.filter(r => r.severity === 'severe' && r.status !== 'resolved').length;
  const breached  = reports.filter(r => r.sla_breached).length;
  const avgHrs    = summary?.totals?.avg_hours_to_resolve;

  const handleAutoAssign = async () => {
    try {
      const res = await API.post('/analytics/auto-assign');
      alert(`Auto-assigned ${res.data.assigned} reports to staff.`);
      loadData();
    } catch { alert('Auto-assign failed. Make sure staff exist.'); }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <h2> Dashboard Overview</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-warning btn-sm" onClick={handleAutoAssign}>[!] Auto-Assign All</button>
          <a href="/api/reports/export" className="btn btn-secondary btn-sm" target="_blank" rel="noreferrer"> Export CSV</a>
          <a href="/api/analytics/export-pdf" className="btn btn-secondary btn-sm" target="_blank" rel="noreferrer"> Export PDF</a>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Reports', value: reports.length,   color: 'var(--primary)' },
          { label: 'Pending',       value: pending,          color: 'var(--warning)' },
          { label: 'In Progress',   value: inProg,           color: '#3b82f6' },
          { label: 'Resolved',      value: resolved,         color: 'var(--success)' },
          { label: 'Severe Active', value: severe,           color: 'var(--danger)' },
          { label: 'SLA Breached',  value: breached,         color: '#ef4444' },
          { label: 'My Open Work',  value: myWork.length,    color: '#8b5cf6' },
          { label: 'Avg Resolve (hrs)', value: avgHrs ? Math.round(avgHrs) : '--', color: 'var(--text2)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-number" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {breached > 0 && (
        <div className="card" style={{ background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>(!)</span>
            <div style={{ flex: 1 }}>
              <strong style={{ color: '#dc2626' }}>{breached} SLA Breach{breached > 1 ? 'es' : ''} Detected</strong>
              <p style={{ margin: '2px 0 0', fontSize: '0.85rem', color: '#991b1b' }}>These reports have exceeded their resolution deadlines.</p>
            </div>
            <button className="btn btn-sm" style={{ background: '#dc2626', color: 'white' }} onClick={() => setActiveTab('sla')}>
              View SLA ->
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 16 }}>[!] Quick Actions</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { icon: '', label: 'Predictive AI',     tab: 'predictive' },
            { icon: '',  label: 'Route Optimizer',   tab: 'optimizer' },
            { icon: '',  label: 'SLA Monitor',       tab: 'sla' },
            { icon: '',  label: 'Weather Report',    tab: 'weather' },
            { icon: '', label: 'Activity Log',      tab: 'timeline' },
            { icon: '', label: 'Analytics',         tab: 'analytics' },
          ].map(a => (
            <button key={a.tab} className="btn btn-secondary" onClick={() => setActiveTab(a.tab)}>
              {a.icon} {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recent severe unresolved */}
      {reports.filter(r => r.severity === 'severe' && r.status !== 'resolved').slice(0, 3).map(r => (
        <ReportCard key={r.id} r={r} onUpdate={loadData} showAssign />
      ))}
    </>
  );
}

// 
// ALL REPORTS TAB
// 
function AllReportsTab({ reports, statusFilter, setStatusFilter, severityFilter, setSeverityFilter, loadData }) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h2> All Reports ({reports.length})</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text1)', fontSize: '0.85rem' }}>
            <option value="">All Status</option>
            {['pending','assigned','in_progress','resolved','rejected'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg2)', color: 'var(--text1)', fontSize: '0.85rem' }}>
            <option value="">All Severity</option>
            {['severe','moderate','minor'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      {reports.length === 0
        ? <div className="empty-state"><div className="empty-icon">(OK)</div><h3>No reports match filters</h3></div>
        : reports.map(r => <ReportCard key={r.id} r={r} onUpdate={loadData} showAssign />)
      }
    </>
  );
}

// 
// MY WORK TAB
// 
function MyWorkTab({ myWork, loadData }) {
  return (
    <>
      <h2 style={{ marginBottom: 20 }}> My Assigned Work ({myWork.length})</h2>
      {myWork.length === 0
        ? <div className="empty-state"><div className="empty-icon">(OK)</div><h3>All clear! No active work assigned.</h3></div>
        : myWork.map(r => <ReportCard key={r.id} r={r} onUpdate={loadData} showAssign={false} />)
      }
    </>
  );
}

// 
// HEATMAP VIEW
// 
function HeatmapView() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (mapInstanceRef.current) return;
    const load = () => {
      if (!mapRef.current || mapInstanceRef.current) return;
      const L = window.L;
      const map = L.map(mapRef.current).setView([11.0168, 76.9558], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '(c) OpenStreetMap' }).addTo(map);
      mapInstanceRef.current = map;
      API.get('/analytics/map-potholes').then(res => {
        res.data.forEach(p => {
          const color = p.severity === 'severe' ? '#ef4444' : p.severity === 'moderate' ? '#f97316' : '#22c55e';
          L.circleMarker([p.latitude, p.longitude], { radius: 8, fillColor: color, color: color, fillOpacity: 0.7, weight: 1 })
            .bindPopup(`<b>${p.severity.toUpperCase()}</b><br>${p.address || ''}<br>Status: ${p.status}`)
            .addTo(map);
        });
      });
    };

    if (window.L) { load(); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = load;
    document.body.appendChild(script);
  }, []);

  return <div ref={mapRef} style={{ height: 520 }} />;
}

// 
// PREDICTIVE AI TAB
// 
function PredictiveTab() {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/analytics/predictive')
      .then(r => setData(r.data))
      .catch(() => setData({ hotspots: [], grid: [] }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" style={{ margin: '60px auto' }} />;

  const riskColor = score => score >= 7 ? '#ef4444' : score >= 4 ? '#f97316' : '#22c55e';
  const riskLabel = score => score >= 7 ? 'HIGH' : score >= 4 ? 'MEDIUM' : 'LOW';

  return (
    <>
      <h2 style={{ marginBottom: 8 }}> Predictive Maintenance AI</h2>
      <p style={{ color: 'var(--text3)', marginBottom: 24, fontSize: '0.9rem' }}>
        Grid-based clustering identifies high-risk zones based on report density and severity patterns.
      </p>

      {(!data?.hotspots || data.hotspots.length === 0) ? (
        <div className="empty-state"><div className="empty-icon"></div><h3>No high-risk zones detected</h3><p>Not enough data yet. More reports will improve predictions.</p></div>
      ) : (
        <>
          <div style={{ marginBottom: 20 }}>
            {data.hotspots.map((h, i) => (
              <div key={i} className="card" style={{ marginBottom: 12, borderLeft: `4px solid ${riskColor(h.risk_score)}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem', color: riskColor(h.risk_score) }}>
                        Risk Score: {h.risk_score}/10
                      </span>
                      <span className="badge" style={{ background: riskColor(h.risk_score), color: 'white' }}>
                        {riskLabel(h.risk_score)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>
                       {parseFloat(h.lat).toFixed(4)}, {parseFloat(h.lng).toFixed(4)}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text2)', marginTop: 4 }}>
                      {h.report_count} reports  {h.severe_count} severe  {h.unresolved_count} unresolved
                    </div>
                    <div style={{ marginTop: 8, padding: '6px 10px', background: 'var(--bg2)', borderRadius: 6, fontSize: '0.82rem', color: 'var(--text2)' }}>
                       {h.recommendation || 'Schedule preventive maintenance in this zone.'}
                    </div>
                  </div>
                  <a href={`https://www.google.com/maps?q=${h.lat},${h.lng}`} target="_blank" rel="noreferrer"
                    className="btn btn-secondary btn-sm"> View on Map</a>
                </div>
                {/* Risk bar */}
                <div style={{ marginTop: 12, background: 'var(--bg3)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${h.risk_score * 10}%`, background: riskColor(h.risk_score), transition: 'width 0.8s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

// 
// ROUTE OPTIMIZER TAB
// 
function OptimizerTab() {
  const [lat, setLat]   = useState('');
  const [lng, setLng]   = useState('');
  const [maxDist, setMaxDist] = useState(10);
  const [limit, setLimit]     = useState(10);
  const [route, setRoute]     = useState(null);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const getCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(pos => {
      setLat(pos.coords.latitude.toFixed(6));
      setLng(pos.coords.longitude.toFixed(6));
    }, () => alert('Could not get location'));
  };

  const optimizeRoute = async () => {
    if (!lat || !lng) { alert('Please enter or detect your location'); return; }
    setLoading(true);
    try {
      const res = await API.post('/analytics/optimize-route', {
        lat: parseFloat(lat), lng: parseFloat(lng),
        max_distance: maxDist, limit
      });
      setRoute(res.data);
      setTimeout(() => renderMap(res.data.route), 300);
    } catch { alert('Route optimization failed'); }
    finally { setLoading(false); }
  };

  const renderMap = (stops) => {
    const L = window.L;
    if (!L || !mapRef.current) return;
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    const map = L.map(mapRef.current).setView([parseFloat(lat), parseFloat(lng)], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '(c) OpenStreetMap' }).addTo(map);
    mapInstanceRef.current = map;
    const latlngs = [[parseFloat(lat), parseFloat(lng)]];
    stops.forEach((s, i) => {
      latlngs.push([s.latitude, s.longitude]);
      const color = s.severity === 'severe' ? '#ef4444' : s.severity === 'moderate' ? '#f97316' : '#22c55e';
      L.circleMarker([s.latitude, s.longitude], { radius: 10, fillColor: color, color: color, fillOpacity: 0.8, weight: 2 })
        .bindPopup(`<b>Stop ${i + 1}</b><br>${s.severity.toUpperCase()}<br>${s.address || ''}`)
        .addTo(map);
      L.marker([parseFloat(lat), parseFloat(lng)])
        .bindPopup('<b>Your Start Location</b>').addTo(map);
    });
    L.polyline(latlngs, { color: '#3b82f6', weight: 3, dashArray: '6 4' }).addTo(map);
  };

  const loadLeaflet = (cb) => {
    if (window.L) { cb(); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = cb;
    document.body.appendChild(script);
  };

  const handleOptimize = () => loadLeaflet(optimizeRoute);

  return (
    <>
      <h2 style={{ marginBottom: 8 }}>Route Optimizer</h2>
      <p style={{ color: 'var(--text3)', marginBottom: 20, fontSize: '0.9rem' }}>
        Calculates the most efficient repair route from your current location using nearest-neighbor algorithm.
      </p>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Your Latitude</label>
            <input className="input" value={lat} onChange={e => setLat(e.target.value)} placeholder="11.0168" />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Your Longitude</label>
            <input className="input" value={lng} onChange={e => setLng(e.target.value)} placeholder="76.9558" />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Max Distance (km)</label>
            <input className="input" type="number" value={maxDist} onChange={e => setMaxDist(e.target.value)} min={1} max={50} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Max Stops</label>
            <input className="input" type="number" value={limit} onChange={e => setLimit(e.target.value)} min={1} max={30} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={getCurrentLocation}> Use My Location</button>
          <button className="btn btn-primary" onClick={handleOptimize} disabled={loading}>
            {loading ? '... Optimizing...' : 'Optimize Route'}
          </button>
        </div>
      </div>

      {route && (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div><strong style={{ color: 'var(--primary)', fontSize: '1.4rem' }}>{route.total_stops}</strong><div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>Total Stops</div></div>
              <div><strong style={{ color: 'var(--warning)', fontSize: '1.4rem' }}>{route.total_distance_km} km</strong><div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>Est. Distance</div></div>
              <div><strong style={{ color: 'var(--success)', fontSize: '1.4rem' }}>{route.estimated_time_hrs} hrs</strong><div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>Est. Time</div></div>
            </div>
          </div>

          <div ref={mapRef} style={{ height: 400, borderRadius: 12, marginBottom: 20 }} />

          <div>
            {route.route.map((s, i) => (
              <div key={s.id} className="card" style={{ marginBottom: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.address || `${parseFloat(s.latitude).toFixed(4)}, ${parseFloat(s.longitude).toFixed(4)}`}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <span className={`badge badge-${s.severity}`}>{s.severity}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{s.dist_km} km away</span>
                  </div>
                </div>
                <a href={`https://www.google.com/maps?q=${s.latitude},${s.longitude}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm"></a>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

// 
// SLA MONITOR TAB
// 
function SLATab({ reports, loadData }) {
  const [running, setRunning] = useState(false);

  const runCheck = async () => {
    setRunning(true);
    try {
      const res = await API.post('/analytics/check-sla');
      alert(`SLA check done. ${res.data.breached} new breaches flagged.`);
      loadData();
    } catch { alert('SLA check failed'); }
    finally { setRunning(false); }
  };

  const breached   = reports.filter(r => r.sla_breached);
  const atRisk     = reports.filter(r => !r.sla_breached && r.sla_deadline && new Date(r.sla_deadline) < new Date(Date.now() + 6 * 3600000) && r.status !== 'resolved');
  const onTrack    = reports.filter(r => !r.sla_breached && r.status !== 'resolved' && (!r.sla_deadline || new Date(r.sla_deadline) >= new Date(Date.now() + 6 * 3600000)));

  const Row = ({ r, badge, color }) => (
    <tr>
      <td style={{ fontSize: '0.8rem' }}><code>{r.tracking_token}</code></td>
      <td style={{ fontSize: '0.85rem' }}>{r.address || `${parseFloat(r.latitude).toFixed(3)}, ${parseFloat(r.longitude).toFixed(3)}`}</td>
      <td><span className={`badge badge-${r.severity}`}>{r.severity}</span></td>
      <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
      <td style={{ fontSize: '0.8rem', color }}>{r.sla_deadline ? new Date(r.sla_deadline).toLocaleString() : '--'}</td>
      <td><span className="badge" style={{ background: color, color: 'white' }}>{badge}</span></td>
    </tr>
  );

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2>SLA Monitor</h2>
        <button className="btn btn-warning" onClick={runCheck} disabled={running}>
          {running ? '... Checking...' : 'Run SLA Check Now'}
        </button>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-number" style={{ color: '#ef4444' }}>{breached.length}</div><div className="stat-label">Breached</div></div>
        <div className="stat-card"><div className="stat-number" style={{ color: '#f97316' }}>{atRisk.length}</div><div className="stat-label">Due in 6hrs</div></div>
        <div className="stat-card"><div className="stat-number" style={{ color: '#22c55e' }}>{onTrack.length}</div><div className="stat-label">On Track</div></div>
        <div className="stat-card"><div className="stat-number" style={{ color: 'var(--text2)' }}>{reports.filter(r => r.status === 'resolved').length}</div><div className="stat-label">Resolved</div></div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12, color: '#ef4444' }}>(!)Breached ({breached.length})</h3>
        {breached.length === 0
          ? <p style={{ color: 'var(--text3)' }}>No breaches -- great work!</p>
          : <div className="table-wrap"><table><thead><tr><th>Token</th><th>Location</th><th>Severity</th><th>Status</th><th>Deadline</th><th>SLA</th></tr></thead>
              <tbody>{breached.map(r => <Row key={r.id} r={r} badge="BREACHED" color="#ef4444" />)}</tbody></table></div>
        }
      </div>

      <div>
        <h3 style={{ marginBottom: 12, color: '#f97316' }}>Clock At Risk -- Due in 6 Hours ({atRisk.length})</h3>
        {atRisk.length === 0
          ? <p style={{ color: 'var(--text3)' }}>No reports at risk.</p>
          : <div className="table-wrap"><table><thead><tr><th>Token</th><th>Location</th><th>Severity</th><th>Status</th><th>Deadline</th><th>SLA</th></tr></thead>
              <tbody>{atRisk.map(r => <Row key={r.id} r={r} badge="AT RISK" color="#f97316" />)}</tbody></table></div>
        }
      </div>
    </>
  );
}

// 
// TIMELINE TAB
// 
function TimelineTab() {
  const [logs, setLogs]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/analytics/timeline')
      .then(r => setLogs(r.data))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  const actionIcon = a => ({ completed: '(OK)', assigned: '', started: '', in_progress: '', rejected: '(X)' }[a] || '');
  const actionColor = a => ({ completed: '#22c55e', assigned: '#3b82f6', started: '#f97316', in_progress: '#f97316', rejected: '#ef4444' }[a] || 'var(--text2)');

  if (loading) return <div className="spinner" style={{ margin: '60px auto' }} />;

  return (
    <>
      <h2 style={{ marginBottom: 20 }}> Activity Log</h2>
      {logs.length === 0
        ? <div className="empty-state"><div className="empty-icon"></div><h3>No activity yet</h3></div>
        : (
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />
            {logs.map((log, i) => (
              <div key={log.id || i} style={{ position: 'relative', marginBottom: 16 }}>
                <div style={{ position: 'absolute', left: -20, top: 4, width: 20, height: 20, borderRadius: '50%',
                  background: actionColor(log.action), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                  {actionIcon(log.action)}
                </div>
                <div className="card" style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>{log.staff_name || 'Staff'}</strong>
                      <span style={{ margin: '0 6px', color: 'var(--text3)' }}></span>
                      <span style={{ color: actionColor(log.action), fontWeight: 600, textTransform: 'uppercase', fontSize: '0.8rem' }}>{log.action}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{new Date(log.logged_at).toLocaleString()}</span>
                  </div>
                  {log.address && <div style={{ fontSize: '0.82rem', color: 'var(--text2)', marginTop: 4 }}> {log.address}</div>}
                  {log.notes && <div style={{ fontSize: '0.82rem', color: 'var(--text3)', marginTop: 4, fontStyle: 'italic' }}>"{log.notes}"</div>}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 4 }}>
                    <span className={`badge badge-${log.severity}`} style={{ fontSize: '0.7rem' }}>{log.severity}</span>
                    {' '}<code style={{ fontSize: '0.7rem' }}>{log.tracking_token}</code>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </>
  );
}

// 
// ANALYTICS TAB
// 
function AnalyticsTab({ analytics, summary }) {
  const data = summary || (analytics ? { totals: analytics.totals, monthly: analytics.monthly } : null);
  if (!data) return <div className="spinner" style={{ margin: '60px auto' }} />;

  const { totals, monthly, trend, zone_breakdown, staff_performance } = data;

  return (
    <>
      <h2 style={{ marginBottom: 20 }}> Analytics</h2>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total',    value: totals.total,    color: 'var(--primary)' },
          { label: 'Resolved', value: totals.resolved, color: 'var(--success)' },
          { label: 'Pending',  value: totals.pending,  color: 'var(--warning)' },
          { label: 'Severe',   value: totals.severe,   color: 'var(--danger)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-number" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Resolution rate bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Resolution Rate</h3>
        <div style={{ background: 'var(--bg3)', borderRadius: 8, height: 24, overflow: 'hidden' }}>
          <div style={{
            height: '100%', background: 'linear-gradient(90deg, var(--success), #22c55e)',
            width: `${totals.total > 0 ? Math.round((totals.resolved / totals.total) * 100) : 0}%`,
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            paddingRight: 8, fontSize: '0.78rem', fontWeight: 700, color: 'white', transition: 'width 0.8s'
          }}>
            {totals.total > 0 ? Math.round((totals.resolved / totals.total) * 100) : 0}%
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text3)', marginTop: 6 }}>
          <span>Avg resolve time: {totals.avg_hours_to_resolve ? Math.round(totals.avg_hours_to_resolve) + ' hrs' : '--'}</span>
          <span>SLA Breached: {totals.sla_breached_count || 0}</span>
        </div>
      </div>

      {/* 7-day trend */}
      {trend && trend.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16 }}>7-Day Trend</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 80 }}>
            {trend.map(d => {
              const max = Math.max(...trend.map(x => x.count), 1);
              return (
                <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: '100%', background: 'var(--primary)', borderRadius: '4px 4px 0 0', height: `${(d.count / max) * 60}px`, minHeight: 4 }} />
                  <span style={{ fontSize: '0.65rem', color: 'var(--text3)' }}>{d.day}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{d.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Zone breakdown */}
      {zone_breakdown && zone_breakdown.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16 }}>Zone Breakdown</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Zone</th><th>Total</th><th>Pending</th><th>Resolved</th><th>Severe</th></tr></thead>
              <tbody>
                {zone_breakdown.map(z => (
                  <tr key={z.zone}>
                    <td><strong>{z.zone || 'Unassigned'}</strong></td>
                    <td>{z.total}</td>
                    <td style={{ color: 'var(--warning)' }}>{z.pending}</td>
                    <td style={{ color: 'var(--success)' }}>{z.resolved}</td>
                    <td style={{ color: 'var(--danger)' }}>{z.severe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff performance */}
      {staff_performance && staff_performance.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 16 }}>Staff Performance</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Staff</th><th>Zone</th><th>Assigned</th><th>Resolved</th><th>Avg Hrs</th><th>Rate</th></tr></thead>
              <tbody>
                {staff_performance.map(s => {
                  const rate = s.assigned > 0 ? Math.round((s.resolved / s.assigned) * 100) : 0;
                  return (
                    <tr key={s.staff_id}>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.zone || '--'}</td>
                      <td>{s.assigned}</td>
                      <td style={{ color: 'var(--success)' }}>{s.resolved}</td>
                      <td>{s.avg_hours ? Math.round(s.avg_hours) : '--'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ background: 'var(--bg3)', borderRadius: 4, height: 8, width: 60, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${rate}%`, background: rate > 70 ? 'var(--success)' : rate > 40 ? 'var(--warning)' : 'var(--danger)' }} />
                          </div>
                          <span style={{ fontSize: '0.82rem' }}>{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly table */}
      {monthly && monthly.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Monthly Breakdown</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Month</th><th>Reported</th><th>Resolved</th><th>Rate</th></tr></thead>
              <tbody>
                {monthly.map(m => {
                  const rate = m.reports_filed > 0 ? Math.round((m.resolved / m.reports_filed) * 100) : 0;
                  return (
                    <tr key={m.month}>
                      <td>{m.month}</td>
                      <td>{m.reports_filed}</td>
                      <td style={{ color: 'var(--success)' }}>{m.resolved}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ background: 'var(--bg3)', borderRadius: 4, height: 8, width: 60, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${rate}%`, background: 'var(--success)' }} />
                          </div>
                          <span style={{ fontSize: '0.82rem' }}>{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// 
// WEATHER TAB
// 
function WeatherTab() {
  const [weather, setWeather] = useState(null);
  const [lat, setLat]   = useState('11.0168');
  const [lng, setLng]   = useState('76.9558');
  const [loading, setLoading] = useState(false);

  const fetchWeather = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/analytics/weather/${lat}/${lng}`);
      setWeather(res.data);
    } catch { alert('Weather fetch failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWeather(); }, []); // eslint-disable-line

  const getIcon = (main) => {
    const m = (main || '').toLowerCase();
    if (m.includes('rain')) return '';
    if (m.includes('cloud')) return '';
    if (m.includes('clear')) return 'Light';
    if (m.includes('thunder')) return '';
    if (m.includes('snow')) return '';
    return '';
  };

  return (
    <>
      <h2 style={{ marginBottom: 20 }}>Weather Conditions</h2>
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Latitude</label>
            <input className="input" value={lat} onChange={e => setLat(e.target.value)} style={{ width: 130 }} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Longitude</label>
            <input className="input" value={lng} onChange={e => setLng(e.target.value)} style={{ width: 130 }} />
          </div>
          <button className="btn btn-primary" onClick={fetchWeather} disabled={loading}>
            {loading ? '...' : 'Refresh'}
          </button>
        </div>
      </div>

      {weather && (
        <>
          <div className="card" style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 64, marginBottom: 8 }}>{getIcon(weather.weather?.[0]?.main || weather.condition)}</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{weather.temp ?? weather.temperature ?? '--'}degC</div>
            <div style={{ fontSize: '1.1rem', color: 'var(--text2)', marginBottom: 8 }}>{weather.weather?.[0]?.description || weather.condition || 'N/A'}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>{weather.name || `${lat}, ${lng}`}</div>
          </div>

          <div className="grid-4" style={{ marginBottom: 20 }}>
            {[
              { label: 'Humidity', value: `${weather.humidity ?? '--'}%`, icon: '' },
              { label: 'Wind Speed', value: `${weather.wind_speed ?? weather.wind?.speed ?? '--'} m/s`, icon: '' },
              { label: 'Visibility', value: `${weather.visibility ? Math.round(weather.visibility / 1000) : '--'} km`, icon: '' },
              { label: 'Feels Like', value: `${weather.feels_like ?? '--'}degC`, icon: '' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ background: 'var(--bg2)' }}>
            <h4 style={{ marginBottom: 10 }}> Road Condition Advisory</h4>
            {(() => {
              const main = (weather.weather?.[0]?.main || weather.condition || '').toLowerCase();
              if (main.includes('rain') || main.includes('thunder')) return (
                <p style={{ color: '#f97316', margin: 0 }}>(!)<strong>Wet conditions detected.</strong> Road surfaces may be slippery. Pothole severity may be underreported due to water coverage. Prioritize drainage-area repairs.</p>
              );
              if (main.includes('clear') || main.includes('sun')) return (
                <p style={{ color: '#22c55e', margin: 0 }}>(OK) <strong>Clear conditions.</strong> Ideal for field inspections and repair work today.</p>
              );
              return <p style={{ color: 'var(--text2)', margin: 0 }}>(i)Standard conditions. Normal repair operations advised.</p>;
            })()}
          </div>
        </>
      )}
    </>
  );
}
