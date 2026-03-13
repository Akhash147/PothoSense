// E:\Pothosense\pothosense-expo\app\supervisor\login.js
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { getTheme } from '../../utils/theme';
import API from '../../utils/api';

const PRIMARY = '#7c3aed';

function Input({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, theme }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text3, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>{label}</Text>
      <TextInput style={[S.input, { borderColor: focused ? PRIMARY : theme.border, backgroundColor: theme.bg, color: theme.text }]}
        value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={theme.text3}
        secureTextEntry={secureTextEntry} keyboardType={keyboardType || 'default'} autoCapitalize="none"
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
    </View>
  );
}

export default function SupervisorLoginMobile() {
  const { darkMode, loginSupervisor } = useApp();
  const theme = getTheme(darkMode);
  const [view, setView] = useState('login');
  const [form, setForm] = useState({ employee_id: '', password: '', name: '', email: '', zone: '', admin_key: '' });
  const [fpEmail, setFp] = useState('');
  const [otp, setOtp]   = useState(['','','','']);
  const [newPw, setNewPw]   = useState('');
  const [confPw, setConf]   = useState('');
  const [loading, setLd]    = useState(false);
  const [error, setErr]     = useState('');
  const [success, setOk]    = useState('');
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];

  const go  = (v) => { setErr(''); setOk(''); setView(v); };
  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  const handleLogin = async () => {
    if (!form.employee_id || !form.password) { setErr('All fields required'); return; }
    setErr(''); setLd(true);
    try {
      const res = await API.post('/auth/supervisor/login', { employee_id: form.employee_id, password: form.password });
      await loginSupervisor(res.data.token, { name: res.data.name, zone: res.data.zone, employee_id: res.data.employee_id, admin_key: res.data.admin_key });
      router.replace('/supervisor/dashboard');
    } catch (e) { setErr(e.response?.data?.error || 'Login failed'); }
    finally { setLd(false); }
  };

  const handleRegister = async () => {
    if (!form.name || !form.employee_id || !form.password || !form.admin_key) { setErr('All fields required'); return; }
    setErr(''); setLd(true);
    try {
      await API.post('/auth/supervisor/register', form);
      setOk('Account created! Sign in now.'); setTimeout(() => go('login'), 2000);
    } catch (e) { setErr(e.response?.data?.error || 'Registration failed'); }
    finally { setLd(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={[S.header, { paddingTop: Platform.OS === 'ios' ? 60 : 36 }]}>
        <View style={S.logoRing}><Text style={S.logoText}>PS</Text></View>
        <Text style={S.appName}>PothoSense</Text>
        <Text style={S.tagline}>Supervisor Portal</Text>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {(view==='login'||view==='register') && (
            <View style={[S.segCtrl, { backgroundColor: theme.bg }]}>
              {['login','register'].map(k => (
                <TouchableOpacity key={k} onPress={() => go(k)} style={[S.segBtn, view===k && { backgroundColor: PRIMARY }]}>
                  <Text style={[S.segTxt, view===k && { color:'#fff', fontWeight:'800' }]}>{k==='login'?'Sign In':'Register'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {error   ? <View style={S.errBox}><Text style={{ color:'#dc2626', fontWeight:'600' }}>{error}</Text></View> : null}
          {success ? <View style={S.okBox}><Text style={{ color:'#166534', fontWeight:'600' }}>{success}</Text></View> : null}
          <View style={[S.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {view==='login' && (
              <>
                <Input label="Employee ID" value={form.employee_id} onChangeText={set('employee_id')} placeholder="e.g. SUP001" theme={theme} />
                <Input label="Password" value={form.password} onChangeText={set('password')} placeholder="" secureTextEntry theme={theme} />
                <TouchableOpacity onPress={() => go('forgot')} style={{ alignSelf:'flex-end', marginBottom:14 }}>
                  <Text style={{ color:PRIMARY, fontWeight:'700', fontSize:13 }}>Forgot password?</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[S.btn, { backgroundColor:PRIMARY }]} onPress={handleLogin} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={S.btnTxt}>Sign In</Text>}
                </TouchableOpacity>
              </>
            )}
            {view==='register' && (
              <>
                <Input label="Full Name"        value={form.name}        onChangeText={set('name')}        placeholder="Your name"           theme={theme} />
                <Input label="Employee ID"      value={form.employee_id} onChangeText={set('employee_id')} placeholder="e.g. SUP002"         theme={theme} />
                <Input label="Email (optional)" value={form.email}       onChangeText={set('email')}       placeholder="email@city.gov"      keyboardType="email-address" theme={theme} />
                <Input label="Zone / Area"      value={form.zone}        onChangeText={set('zone')}        placeholder="e.g. North Zone"     theme={theme} />
                <Input label="Password"         value={form.password}    onChangeText={set('password')}    placeholder="Min 8 characters"    secureTextEntry theme={theme} />
                <Input label="Global Admin Key" value={form.admin_key}   onChangeText={set('admin_key')}   placeholder="From your admin"     secureTextEntry theme={theme} />
                <TouchableOpacity style={[S.btn, { backgroundColor:PRIMARY }]} onPress={handleRegister} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={S.btnTxt}>Create Account</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
          <View style={{ marginTop:20, alignItems:'center', gap:10 }}>
            <TouchableOpacity onPress={() => router.push('/citizen/login')}>
              <Text style={{ color:theme.text3, fontSize:13 }}>Citizen? <Text style={{ color:'#d4430a', fontWeight:'700' }}>Citizen Login</Text></Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/staff/login')}>
              <Text style={{ color:theme.text3, fontSize:13 }}>Staff? <Text style={{ color:'#3b82f6', fontWeight:'700' }}>Staff Login</Text></Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const S = StyleSheet.create({
  header:   { backgroundColor:'#7c3aed', alignItems:'center', paddingBottom:28, paddingHorizontal:20 },
  logoRing: { width:60, height:60, borderRadius:30, backgroundColor:'rgba(255,255,255,0.2)', alignItems:'center', justifyContent:'center', marginBottom:10, borderWidth:2, borderColor:'rgba(255,255,255,0.4)' },
  logoText: { fontSize:22, fontWeight:'900', color:'#fff' },
  appName:  { fontSize:26, fontWeight:'900', color:'#fff' },
  tagline:  { fontSize:13, color:'rgba(255,255,255,0.75)', marginTop:2, fontWeight:'600' },
  segCtrl:  { flexDirection:'row', borderRadius:12, padding:4, marginBottom:16, borderWidth:1, borderColor:'#e5e7eb' },
  segBtn:   { flex:1, paddingVertical:11, borderRadius:9, alignItems:'center' },
  segTxt:   { fontSize:14, fontWeight:'600', color:'#9ca3af' },
  card:     { borderRadius:16, padding:20, borderWidth:1, marginBottom:8 },
  input:    { borderWidth:1.5, borderRadius:12, paddingHorizontal:14, paddingVertical:13, fontSize:15 },
  btn:      { borderRadius:12, paddingVertical:15, alignItems:'center', marginTop:4 },
  btnTxt:   { color:'#fff', fontWeight:'900', fontSize:16 },
  otpBox:   { width:60, height:68, fontSize:28, fontWeight:'900', textAlign:'center', borderRadius:14, borderWidth:2 },
  errBox:   { backgroundColor:'#fef2f2', borderRadius:10, padding:12, marginBottom:12, borderLeftWidth:3, borderLeftColor:'#dc2626' },
  okBox:    { backgroundColor:'#f0fdf4', borderRadius:10, padding:12, marginBottom:12, borderLeftWidth:3, borderLeftColor:'#16a34a' },
});
