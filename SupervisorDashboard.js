// E:\Pothosense\frontend\src\pages\SupervisorDashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTranslator } from '../utils/AITranslator';
import Navbar from '../components/Navbar';
import API from '../utils/api';

const SEV_COLOR  = { severe: '#dc2626', moderate: '#f97316', minor: '#f59e0b' };
const AVAIL_COLOR= { available: '#16a34a', busy: '#f97316', off_duty: '#9ca3af' };
const STATUS_COLOR={ pending:'#f59e0b', assigned:'#3b82f6', in_progress:'#f97316', resolved:'#16a34a', rejected:'#ef4444' };
const STAR_COLOR = '#f59e0b';

function StarRating({ value }) {
  return (
    <span>
      {[1,2,3,4,5].map(n => (
        <span key={n} style={{ color: n <= Math.round(value) ? STAR_COLOR : '#d1d5db', fontSize: '1rem' }}></span>
      ))}
      <span style={{ fontSize: '0.75rem', color: 'var(--text3)', marginLeft: 4 }}>{Number(value).toFixed(1)}</span>
    </span>
  );
}

function Badge({ label, color }) {
  return <span style={{ backgroundColor: color+'22', color, padding:'2px 10px', borderRadius:20, fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase' }}>{label}</span>;
}

function Card({ children, style={} }) {
  return <div style={{ background:'var(--bg2)', borderRadius:16, border:'1px solid var(--border)', padding:20, ...style }}>{children}</div>;
}

export default function SupervisorDashboard() {
  const { supervisorUser, logoutSupervisor, darkMode, setDarkMode } = useApp();
  const { t } = useTranslator();
  const navigate = useNavigate();

  const [tab,        setTab]    = useState('overview');  // overview | pending | assignments | team
  const [staff,      setStaff]  = useState([]);
  const [pending,    setPending]= useState([]);
  const [assignments,setAsmt]   = useState([]);
  const [loading,    setLoading]= useState(false);
  const [autoLoading,setAutoL]  = useState(false);
  const [toast,      setToast]  = useState('');
  const [selStaff,   setSelSt]  = useState({});  // report_id  staff_id
  const [notes,      setNotes]  = useState({});

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, pendRes, asmtRes] = await Promise.all([
        API.get('/auth/supervisor/my-staff'),
        API.get('/assignments/pending'),
        API.get('/assignments/my'),
      ]);
      setStaff(staffRes.data);
      setPending(pendRes.data);
      setAsmt(asmtRes.data);
    } catch (e) { showToast('Failed to load data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!supervisorUser) { navigate('/supervisor/login'); return; }
    load();
  }, [supervisorUser]);

  const handleAssign = async (reportId) => {
    const staffId = selStaff[reportId];
    if (!staffId) return showToast('Please select a staff member first');
    try {
      await API.post('/assignments/assign', { report_id: reportId, staff_id: staffId, notes: notes[reportId] });
      showToast('Assigned successfully');
      load();
    } catch (e) { showToast(e.response?.data?.error || 'Assignment failed'); }
  };

  const handleAutoAssign = async () => {
    setAutoL(true);
    try {
      const res = await API.post('/assignments/auto-assign');
      showToast(` ${res.data.message}`);
      load();
    } catch (e) { showToast(e.response?.data?.error || 'Auto-assign failed'); }
    finally { setAutoL(false); }
  };

  const updateAvailability = async (staffId, val) => {
    try {
      await API.put(`/auth/supervisor/my-staff/${staffId}`, { availability: val });
      setStaff(prev => prev.map(s => s.id === staffId ? { ...s, availability: val } : s));
      showToast('Updated');
    } catch { showToast('Update failed'); }
  };

  if (!supervisorUser) return null;

  const available = staff.filter(s => s.availability === 'available' && s.is_active).length;
  const busy      = staff.filter(s => s.availability === 'busy').length;
  const resolved  = assignments.filter(a => a.status === 'resolved').length;

  // Tab nav items
  const TABS = [
    { key:'overview',    icon:'', label: "Overview"    },
    { key:'pending',     icon:'', label: "Pending"     },
    { key:'assignments', icon:'', label: "Assignments" },
    { key:'team',        icon:'', label: "My Team"     },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', color:'var(--text)' }}>
      <Navbar mode="supervisor" />

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)', background:'#1f2937', color:'#fff', padding:'12px 24px', borderRadius:12, zIndex:9999, fontWeight:600, fontSize:'0.9rem', boxShadow:'0 4px 20px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 16px' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontSize:'1.6rem', fontWeight:900, color:'var(--primary)', margin:0 }}>
               {supervisorUser?.name || 'Supervisor'}
            </h1>
            <p style={{ margin:'4px 0 0', color:'var(--text3)', fontSize:'0.9rem' }}>
              Zone: {supervisorUser?.zone || ''}  Admin Key: <code style={{ background:'var(--bg3)', padding:'2px 8px', borderRadius:6 }}>{supervisorUser?.admin_key}</code>
            </p>
          </div>
          <button onClick={() => { logoutSupervisor(); navigate('/supervisor/login'); }}
            style={{ background:'none', border:'1px solid var(--border)', cursor:'pointer', color:'var(--text2)', padding:'8px 16px', borderRadius:10, fontWeight:600 }}>
            Logout
          </button>
        </div>

        {/* Tab bar */}
        <div style={{ display:'flex', gap:8, marginBottom:24, borderBottom:'1px solid var(--border)', paddingBottom:8 }}>
          {TABS.map(({ key, icon, label }) => (
            <button key={key} onClick={() => setTab(key)} style={{
              padding:'8px 18px', borderRadius:10, border:'none', cursor:'pointer', fontWeight:700,
              fontSize:'0.88rem', display:'flex', alignItems:'center', gap:6,
              background: tab === key ? 'var(--primary)' : 'transparent',
              color: tab === key ? '#fff' : 'var(--text3)',
            }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {loading && <div style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>Loading</div>}

        {/*  OVERVIEW  */}
        {!loading && tab === 'overview' && (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:14, marginBottom:24 }}>
              {[
                { label: "Team Size",       value: staff.length,       color:'#d4430a', icon:'' },
                { label: "Available",        value: available,          color:'#16a34a', icon:'' },
                { label: "Busy",             value: busy,               color:'#f97316', icon:'' },
                { label: "Pending Reports",  value: pending.length,     color:'#f59e0b', icon:'' },
                { label: "Assigned Today",   value: assignments.length, color:'#3b82f6', icon:'' },
                { label: "Resolved",         value: resolved,           color:'#16a34a', icon:'' },
              ].map(({ label, value, color, icon }) => (
                <Card key={label} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:'2rem', marginBottom:4 }}>{icon}</div>
                  <div style={{ fontSize:'2rem', fontWeight:900, color }}>{value}</div>
                  <div style={{ fontSize:'0.8rem', color:'var(--text3)', fontWeight:600 }}>{label}</div>
                </Card>
              ))}
            </div>
            {/* Quick assign */}
            <Card>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:'1.1rem' }}>{"Auto-Assign All Pending"}</div>
                  <div style={{ color:'var(--text3)', fontSize:'0.85rem', marginTop:4 }}>
                    {"Automatically assigns pending reports to the best available staff based on workload and performance."}
                  </div>
                </div>
                <button onClick={handleAutoAssign} disabled={autoLoading || !pending.length} style={{
                  background: pending.length ? 'var(--primary)' : 'var(--bg3)',
                  color: '#fff', border:'none', cursor: pending.length ? 'pointer' : 'default',
                  padding:'12px 28px', borderRadius:12, fontWeight:800, fontSize:'1rem',
                }}>
                  {autoLoading ? 'Assigning' : ` ${"Auto-Assign"} (${pending.length})`}
                </button>
              </div>
            </Card>
          </>
        )}

        {/*  PENDING  */}
        {!loading && tab === 'pending' && (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h2 style={{ margin:0, fontWeight:800 }}>{"Unassigned Reports"} ({pending.length})</h2>
              <button onClick={handleAutoAssign} disabled={autoLoading} style={{ background:'var(--primary)', color:'#fff', border:'none', cursor:'pointer', padding:'10px 22px', borderRadius:10, fontWeight:700 }}>
                {autoLoading ? '' : ` ${"Auto-Assign All"}`}
              </button>
            </div>
            {pending.length === 0 && <Card><p style={{ color:'var(--text3)', textAlign:'center' }}> {"No unassigned reports!"}</p></Card>}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {pending.map(r => (
                <Card key={r.id}>
                  <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12, alignItems:'flex-start' }}>
                    <div style={{ flex:1, minWidth:200 }}>
                      <div style={{ display:'flex', gap:8, marginBottom:6 }}>
                        <Badge label={r.severity} color={SEV_COLOR[r.severity]} />
                        <Badge label={r.status}   color={STATUS_COLOR[r.status]} />
                      </div>
                      <div style={{ fontWeight:700, marginBottom:4 }}>{r.address || `${Number(r.latitude).toFixed(4)}, ${Number(r.longitude).toFixed(4)}`}</div>
                      <div style={{ fontSize:'0.82rem', color:'var(--text3)' }}>
                        {new Date(r.created_at).toLocaleString('en-IN')}  Token: {r.tracking_token}
                      </div>
                      {r.description && <div style={{ fontSize:'0.85rem', color:'var(--text2)', marginTop:4 }}>{r.description}</div>}
                    </div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                      <select value={selStaff[r.id] || ''} onChange={e => setSelStaff(p => ({ ...p, [r.id]: e.target.value }))}
                        style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)', fontWeight:600, minWidth:160 }}>
                        <option value="">{"Select Staff"}</option>
                        {staff.filter(s => s.is_active && s.availability !== 'off_duty').map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({t(s.availability)})  {Number(s.performance_rating).toFixed(1)}</option>
                        ))}
                      </select>
                      <input placeholder={"Notes (optional)"} value={notes[r.id] || ''} onChange={e => setNotes(p => ({ ...p, [r.id]: e.target.value }))}
                        style={{ padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)', minWidth:160 }} />
                      <button onClick={() => handleAssign(r.id)} style={{ background:'var(--primary)', color:'#fff', border:'none', cursor:'pointer', padding:'9px 22px', borderRadius:10, fontWeight:700 }}>
                        {"Assign"}
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/*  ASSIGNMENTS  */}
        {!loading && tab === 'assignments' && (
          <>
            <h2 style={{ fontWeight:800, marginBottom:16 }}>{"All Assignments"} ({assignments.length})</h2>
            {assignments.length === 0 && <Card><p style={{ color:'var(--text3)', textAlign:'center' }}>{"No assignments yet."}</p></Card>}
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {assignments.map(a => (
                <Card key={a.id} style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                  <div style={{ flex:1, minWidth:200 }}>
                    <div style={{ display:'flex', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                      <Badge label={a.severity} color={SEV_COLOR[a.severity]} />
                      <Badge label={a.status}   color={STATUS_COLOR[a.status]} />
                      {a.auto_assigned ? <Badge label="Auto" color="#8b5cf6" /> : null}
                    </div>
                    <div style={{ fontWeight:700 }}>{a.address || `${Number(a.latitude).toFixed(4)}, ${Number(a.longitude).toFixed(4)}`}</div>
                    <div style={{ fontSize:'0.8rem', color:'var(--text3)', marginTop:4 }}>
                      Assigned to: <strong>{a.staff_name}</strong> ({a.staff_emp_id})  Due: {a.due_by ? new Date(a.due_by).toLocaleDateString('en-IN') : ''}
                    </div>
                    {a.notes && <div style={{ fontSize:'0.82rem', color:'var(--text2)', marginTop:2 }}> {a.notes}</div>}
                  </div>
                  <div style={{ fontSize:'0.82rem', color: AVAIL_COLOR[a.availability] || 'var(--text3)', alignSelf:'center' }}>
                    {a.availability}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/*  TEAM  */}
        {!loading && tab === 'team' && (
          <>
            <h2 style={{ fontWeight:800, marginBottom:16 }}>{"My Team"} ({staff.length}/10)</h2>
            <Card style={{ marginBottom:16, background:'rgba(212,67,10,0.06)', border:'1px solid rgba(212,67,10,0.2)' }}>
              <div style={{ fontWeight:700 }}> {"Staff Registration Key"}</div>
              <div style={{ fontSize:'0.85rem', color:'var(--text3)', marginTop:4 }}>
                {"Share this key with new staff members to let them register under you:"}
              </div>
              <code style={{ display:'block', fontSize:'1.1rem', fontWeight:900, color:'var(--primary)', background:'var(--bg3)', padding:'10px 16px', borderRadius:10, marginTop:8, letterSpacing:1 }}>
                {supervisorUser?.admin_key}
              </code>
            </Card>
            {staff.length === 0 && <Card><p style={{ color:'var(--text3)', textAlign:'center' }}>{"No staff registered yet. Share your admin key."}</p></Card>}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
              {staff.map(s => (
                <Card key={s.id}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <div>
                      <div style={{ fontWeight:800, fontSize:'1.05rem' }}>{s.name}</div>
                      <div style={{ fontSize:'0.82rem', color:'var(--text3)' }}>{s.employee_id}</div>
                    </div>
                    <Badge label={s.availability} color={AVAIL_COLOR[s.availability] || '#9ca3af'} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                    <div style={{ background:'var(--bg3)', borderRadius:8, padding:8, textAlign:'center' }}>
                      <div style={{ fontSize:'1.4rem', fontWeight:900, color:'var(--primary)' }}>{s.active_jobs}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--text3)' }}>{"Active Jobs"}</div>
                    </div>
                    <div style={{ background:'var(--bg3)', borderRadius:8, padding:8, textAlign:'center' }}>
                      <div style={{ fontSize:'1.4rem', fontWeight:900, color:'#16a34a' }}>{s.repairs_completed}</div>
                      <div style={{ fontSize:'0.75rem', color:'var(--text3)' }}>{"Completed"}</div>
                    </div>
                  </div>
                  <div style={{ marginBottom:10 }}>
                    <div style={{ fontSize:'0.8rem', color:'var(--text3)', marginBottom:4 }}>{"Performance"}</div>
                    <StarRating value={s.performance_rating} />
                  </div>
                  <div>
                    <label style={{ fontSize:'0.8rem', color:'var(--text3)', fontWeight:700 }}>{"Availability"}</label>
                    <select value={s.availability} onChange={e => updateAvailability(s.id, e.target.value)}
                      style={{ display:'block', width:'100%', marginTop:4, padding:'7px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)', fontWeight:600 }}>
                      <option value="available">{"Available"}</option>
                      <option value="busy">{"Busy"}</option>
                      <option value="off_duty">{"Off Duty"}</option>
                    </select>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
