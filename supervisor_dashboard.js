// E:\Pothosense\pothosense-expo\app\supervisor\dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { getTheme } from '../../utils/theme';
import API from '../../utils/api';

const PRIMARY   = '#7c3aed';
const SEV_COLOR = { severe:'#dc2626', moderate:'#f97316', minor:'#f59e0b' };
const SEV_LABEL = { severe:'Large', moderate:'Medium', minor:'Small' };
const AVAIL_COLOR={ available:'#16a34a', busy:'#f97316', off_duty:'#9ca3af' };

function StatCard({ icon, value, label, color }) {
  return (
    <View style={[sc.card, { borderTopColor:color, borderTopWidth:3 }]}>
      <Text style={{ fontSize:20 }}>{icon}</Text>
      <Text style={[sc.val,{color}]}>{value}</Text>
      <Text style={sc.lbl}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  card:{ flex:1, backgroundColor:'#fff', borderRadius:12, padding:12, alignItems:'center', gap:3, shadowColor:'#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.06, shadowRadius:4, elevation:2 },
  val: { fontSize:22, fontWeight:'900' },
  lbl: { fontSize:10, color:'#9ca3af', fontWeight:'600', textTransform:'uppercase', textAlign:'center' },
});

export default function SupervisorDashboard() {
  const { darkMode, supervisorUser, logoutSupervisor } = useApp();
  const theme  = getTheme(darkMode);
  const insets = useSafeAreaInsets();

  const [tab,    setTab]    = useState('overview');
  const [staff,  setStaff]  = useState([]);
  const [pending,setPend]   = useState([]);
  const [asmts,  setAsmts]  = useState([]);
  const [loading,setLoad]   = useState(false);
  const [autoL,  setAutoL]  = useState(false);
  const [refresh,setRefresh]= useState(false);
  const [selStaff,setSel]   = useState({});

  useEffect(() => {
    if (!supervisorUser) { router.replace('/supervisor/login'); return; }
    load();
  }, [supervisorUser]);

  const load = useCallback(async () => {
    setLoad(true);
    try {
      const [s, p, a] = await Promise.all([
        API.get('/auth/supervisor/my-staff'),
        API.get('/assignments/pending'),
        API.get('/assignments/my'),
      ]);
      setStaff(s.data); setPend(p.data); setAsmts(a.data);
    } catch { Alert.alert('Error','Could not load data'); }
    finally { setLoad(false); setRefresh(false); }
  }, []);

  const handleAssign = async (reportId) => {
    const staffId = selStaff[reportId];
    if (!staffId) { Alert.alert('Select staff','Please choose a staff member first'); return; }
    try {
      await API.post('/assignments/assign', { report_id: reportId, staff_id: staffId });
      Alert.alert('Assigned!');
      setSel(p => { const n={...p}; delete n[reportId]; return n; });
      load();
    } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Assignment failed'); }
  };

  const handleAutoAssign = async () => {
    Alert.alert('Auto-Assign', 'Assign all pending reports automatically?', [
      { text:'Cancel', style:'cancel' },
      { text:'Yes, Assign', onPress: async () => {
        setAutoL(true);
        try {
          const res = await API.post('/assignments/auto-assign');
          Alert.alert('Done', res.data.message);
          load();
        } catch (e) { Alert.alert('Error', e.response?.data?.error || 'Failed'); }
        finally { setAutoL(false); }
      }}
    ]);
  };

  if (!supervisorUser) return null;

  const TABS = [
    { key:'overview',  label:'Overview',  icon:'' },
    { key:'pending',   label:'Pending',   icon:'' },
    { key:'team',      label:'My Team',   icon:'' },
  ];

  const available = staff.filter(s => s.availability === 'available').length;
  const resolved  = asmts.filter(a => a.status === 'resolved').length;

  return (
    <View style={{ flex:1, backgroundColor:theme.bg }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: PRIMARY }]}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
          <View>
            <Text style={{ color:'rgba(255,255,255,0.75)', fontSize:12, fontWeight:'600' }}>Supervisor</Text>
            <Text style={{ color:'#fff', fontSize:20, fontWeight:'900' }}>{supervisorUser?.name || 'Supervisor'}</Text>
            <Text style={{ color:'rgba(255,255,255,0.7)', fontSize:11, marginTop:2 }}>Zone: {supervisorUser?.zone || ''}</Text>
          </View>
          <TouchableOpacity onPress={() => { logoutSupervisor(); router.replace('/supervisor/login'); }}
            style={{ backgroundColor:'rgba(255,255,255,0.2)', paddingHorizontal:14, paddingVertical:8, borderRadius:20 }}>
            <Text style={{ color:'#fff', fontWeight:'700', fontSize:12 }}>Logout</Text>
          </TouchableOpacity>
        </View>
        {/* Tabs */}
        <View style={{ flexDirection:'row', gap:8, marginTop:14 }}>
          {TABS.map(({ key, label, icon }) => (
            <TouchableOpacity key={key} onPress={() => setTab(key)}
              style={{ flex:1, paddingVertical:8, borderRadius:10, alignItems:'center', backgroundColor: tab===key?'rgba(255,255,255,0.25)':'transparent' }}>
              <Text style={{ fontSize:16 }}>{icon}</Text>
              <Text style={{ color:'#fff', fontSize:11, fontWeight: tab===key?'800':'500', marginTop:2 }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading && !refresh ? (
        <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}>
          <ActivityIndicator color={PRIMARY} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding:16, paddingBottom:40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); load(); }} tintColor={PRIMARY} />}
        >
          {/*  OVERVIEW  */}
          {tab === 'overview' && (
            <>
              <View style={{ flexDirection:'row', gap:10, marginBottom:16 }}>
                <StatCard icon="" value={staff.length}   label="Team"      color={PRIMARY} />
                <StatCard icon="" value={available}       label="Available" color="#16a34a" />
                <StatCard icon="" value={pending.length} label="Pending"   color="#f59e0b" />
                <StatCard icon="" value={resolved}       label="Resolved"  color="#16a34a" />
              </View>

              {/* Admin key card */}
              <View style={[styles.card, { backgroundColor:theme.card, borderColor: theme.border, marginBottom:14 }]}>
                <Text style={{ fontWeight:'800', color:theme.text, marginBottom:6 }}>Staff Registration Key</Text>
                <Text style={{ fontSize:12, color:theme.text3, marginBottom:10 }}>
                  Share this key with new staff to let them register under you (max 10 staff)
                </Text>
                <View style={{ backgroundColor:'#f3f0ff', borderRadius:10, padding:12, borderWidth:1, borderColor:'#c4b5fd' }}>
                  <Text style={{ fontFamily: Platform.OS==='ios'?'Menlo':'monospace', fontSize:16, fontWeight:'900', color:PRIMARY, letterSpacing:1 }}>
                    {supervisorUser?.admin_key || ''}
                  </Text>
                </View>
              </View>

              {/* Auto-assign button */}
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor:PRIMARY, opacity: pending.length?1:0.4 }]}
                onPress={handleAutoAssign} disabled={!pending.length || autoL}
              >
                {autoL ? <ActivityIndicator color="#fff" /> : (
                  <Text style={styles.primaryBtnTxt}>  Auto-Assign All ({pending.length} pending)</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/*  PENDING  */}
          {tab === 'pending' && (
            <>
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <Text style={{ fontSize:15, fontWeight:'800', color:theme.text }}>Unassigned ({pending.length})</Text>
                <TouchableOpacity onPress={handleAutoAssign} disabled={autoL || !pending.length}
                  style={{ backgroundColor:PRIMARY, paddingHorizontal:14, paddingVertical:8, borderRadius:10, opacity: pending.length?1:0.4 }}>
                  <Text style={{ color:'#fff', fontWeight:'800', fontSize:12 }}> Auto-Assign</Text>
                </TouchableOpacity>
              </View>
              {pending.length === 0 && (
                <View style={[styles.card, { backgroundColor:theme.card, borderColor:theme.border, alignItems:'center' }]}>
                  <Text style={{ fontSize:32, marginBottom:8 }}></Text>
                  <Text style={{ color:theme.text3, fontWeight:'700' }}>No unassigned reports!</Text>
                </View>
              )}
              {pending.map(r => (
                <View key={r.id} style={[styles.card, { backgroundColor:theme.card, borderColor:theme.border, borderLeftColor: SEV_COLOR[r.severity], borderLeftWidth:4 }]}>
                  <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <Text style={{ fontWeight:'800', color:SEV_COLOR[r.severity], fontSize:13 }}>{SEV_LABEL[r.severity]}</Text>
                    <Text style={{ fontSize:11, color:theme.text3 }}>{new Date(r.created_at).toLocaleDateString('en-IN')}</Text>
                  </View>
                  <Text style={{ fontSize:13, color:theme.text, marginBottom:6 }} numberOfLines={2}>
                    {r.address || `${Number(r.latitude).toFixed(4)}, ${Number(r.longitude).toFixed(4)}`}
                  </Text>
                  {/* Staff picker */}
                  <Text style={{ fontSize:12, color:theme.text3, fontWeight:'700', marginBottom:6 }}>Assign to:</Text>
                  <View style={{ gap:6 }}>
                    {staff.filter(s => s.is_active && s.availability !== 'off_duty').map(s => (
                      <TouchableOpacity key={s.id} onPress={() => setSel(p => ({ ...p, [r.id]: s.id }))}
                        style={{ flexDirection:'row', justifyContent:'space-between', padding:10, borderRadius:10,
                          backgroundColor: selStaff[r.id]===s.id ? PRIMARY+'15' : theme.bg,
                          borderWidth:1.5, borderColor: selStaff[r.id]===s.id ? PRIMARY : theme.border }}>
                        <Text style={{ fontWeight:'700', color:theme.text, fontSize:13 }}>{s.name}</Text>
                        <View style={{ flexDirection:'row', gap:8, alignItems:'center' }}>
                          <Text style={{ fontSize:11, color: AVAIL_COLOR[s.availability], fontWeight:'700' }}>{s.availability}</Text>
                          <Text style={{ fontSize:11, color:theme.text3 }}>{Number(s.performance_rating).toFixed(1)}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity onPress={() => handleAssign(r.id)}
                    style={{ marginTop:10, backgroundColor: selStaff[r.id]?PRIMARY:'#9ca3af', borderRadius:10, paddingVertical:11, alignItems:'center' }}>
                    <Text style={{ color:'#fff', fontWeight:'800' }}>Assign</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {/*  TEAM  */}
          {tab === 'team' && (
            <>
              <Text style={{ fontSize:15, fontWeight:'800', color:theme.text, marginBottom:12 }}>
                My Team ({staff.length}/10)
              </Text>
              {staff.length === 0 && (
                <View style={[styles.card, { backgroundColor:theme.card, borderColor:theme.border, alignItems:'center' }]}>
                  <Text style={{ color:theme.text3, fontWeight:'600' }}>No staff yet. Share your registration key.</Text>
                </View>
              )}
              {staff.map(s => (
                <View key={s.id} style={[styles.card, { backgroundColor:theme.card, borderColor:theme.border }]}>
                  <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                    <View>
                      <Text style={{ fontWeight:'800', fontSize:15, color:theme.text }}>{s.name}</Text>
                      <Text style={{ fontSize:12, color:theme.text3 }}>{s.employee_id}</Text>
                    </View>
                    <View style={{ backgroundColor: AVAIL_COLOR[s.availability]+'20', paddingHorizontal:10, paddingVertical:4, borderRadius:20 }}>
                      <Text style={{ color: AVAIL_COLOR[s.availability], fontWeight:'700', fontSize:11 }}>{s.availability}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection:'row', gap:10, marginBottom:10 }}>
                    <View style={{ flex:1, backgroundColor:theme.bg, borderRadius:10, padding:10, alignItems:'center' }}>
                      <Text style={{ fontSize:20, fontWeight:'900', color:PRIMARY }}>{s.active_jobs}</Text>
                      <Text style={{ fontSize:11, color:theme.text3, fontWeight:'600' }}>Active</Text>
                    </View>
                    <View style={{ flex:1, backgroundColor:theme.bg, borderRadius:10, padding:10, alignItems:'center' }}>
                      <Text style={{ fontSize:20, fontWeight:'900', color:'#16a34a' }}>{s.repairs_completed}</Text>
                      <Text style={{ fontSize:11, color:theme.text3, fontWeight:'600' }}>Done</Text>
                    </View>
                    <View style={{ flex:1, backgroundColor:theme.bg, borderRadius:10, padding:10, alignItems:'center' }}>
                      <Text style={{ fontSize:20, fontWeight:'900', color:'#f59e0b' }}>{Number(s.performance_rating).toFixed(1)}</Text>
                      <Text style={{ fontSize:11, color:theme.text3, fontWeight:'600' }}>Rating</Text>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header:      { paddingHorizontal:20, paddingBottom:16 },
  card:        { borderRadius:14, padding:14, marginBottom:12, borderWidth:1 },
  primaryBtn:  { borderRadius:14, paddingVertical:15, alignItems:'center', marginBottom:12 },
  primaryBtnTxt:{ color:'#fff', fontWeight:'900', fontSize:15 },
});
