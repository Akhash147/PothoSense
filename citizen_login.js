// E:\Pothosense\pothosense-expo\app\citizen\login.js
// Beautiful citizen login/register/forgot/reset screen

import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput,
  StyleSheet, ActivityIndicator, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { getTheme } from '../../utils/theme';
import API from '../../utils/api';

const PRIMARY = '#d4430a';

function Input({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize, theme }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: theme.text3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>{label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.bg, borderColor: focused ? PRIMARY : theme.border, color: theme.text }]}
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={theme.text3} secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || 'default'}
        autoCapitalize={autoCapitalize || 'none'}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      />
    </View>
  );
}

function ErrorBox({ msg }) {
  if (!msg) return null;
  return <View style={styles.errBox}><Text style={{ color: '#dc2626', fontSize: 13, fontWeight: '600' }}>{msg}</Text></View>;
}

function SuccessBox({ msg }) {
  if (!msg) return null;
  return <View style={styles.succBox}><Text style={{ color: '#166534', fontSize: 13, fontWeight: '600' }}>{msg}</Text></View>;
}

export default function CitizenLogin() {
  const { darkMode, loginCitizen } = useApp();
  const theme = getTheme(darkMode);

  const [view, setView] = useState('login'); // login|register|forgot|reset

  const [loginForm, setLoginForm]   = useState({ email: '', password: '' });
  const [loginLoad, setLoginLoad]   = useState(false);
  const [loginErr,  setLoginErr]    = useState('');

  const [regForm, setRegForm]   = useState({ username: '', email: '', password: '' });
  const [regLoad, setRegLoad]   = useState(false);
  const [regErr,  setRegErr]    = useState('');
  const [regSucc, setRegSucc]   = useState('');

  const [fpEmail, setFpEmail]   = useState('');
  const [fpLoad,  setFpLoad]    = useState(false);
  const [fpErr,   setFpErr]     = useState('');
  const [fpSucc,  setFpSucc]    = useState('');

  const [otp,    setOtp]      = useState(['', '', '', '']);
  const [newPw,  setNewPw]    = useState('');
  const [confPw, setConfPw]   = useState('');
  const [rstLoad, setRstLoad] = useState(false);
  const [rstErr,  setRstErr]  = useState('');
  const [rstSucc, setRstSucc] = useState('');
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];

  const go = (v) => {
    setLoginErr(''); setRegErr(''); setRegSucc('');
    setFpErr(''); setFpSucc(''); setRstErr(''); setRstSucc('');
    setView(v);
  };

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) { setLoginErr('All fields required'); return; }
    setLoginErr(''); setLoginLoad(true);
    try {
      const res = await API.post('/auth/citizen/login', loginForm);
      await loginCitizen(res.data.token, res.data.username);
      router.replace('/');
    } catch (e) { setLoginErr(e.response?.data?.error || 'Login failed'); }
    finally { setLoginLoad(false); }
  };

  const handleRegister = async () => {
    if (!regForm.username || !regForm.email || !regForm.password) { setRegErr('All fields required'); return; }
    if (regForm.password.length < 8) { setRegErr('Password must be 8+ characters'); return; }
    setRegErr(''); setRegLoad(true);
    try {
      await API.post('/auth/citizen/register', regForm);
      setRegSucc('Account created! You can now login.');
      setTimeout(() => go('login'), 2000);
    } catch (e) { setRegErr(e.response?.data?.error || 'Registration failed'); }
    finally { setRegLoad(false); }
  };

  const handleForgot = async () => {
    if (!fpEmail) { setFpErr('Enter your email'); return; }
    setFpErr(''); setFpSucc(''); setFpLoad(true);
    try {
      const res = await API.post('/auth/citizen/forgot-password', { email: fpEmail });
      setFpSucc(res.data.message);
      setTimeout(() => go('reset'), 1500);
    } catch (e) { setFpErr(e.response?.data?.error || 'Failed to send OTP'); }
    finally { setFpLoad(false); }
  };

  const handleOtpChange = (val, idx) => {
    const v = val.replace(/[^0-9]/g, '').slice(-1);
    const next = [...otp]; next[idx] = v; setOtp(next);
    if (v && idx < 3) otpRefs[idx + 1].current?.focus();
  };

  const handleReset = async () => {
    const otpVal = otp.join('');
    if (otpVal.length < 4) { setRstErr('Enter the 4-digit OTP'); return; }
    if (newPw !== confPw)   { setRstErr('Passwords do not match'); return; }
    if (newPw.length < 8)   { setRstErr('Password must be 8+ characters'); return; }
    setRstErr(''); setRstLoad(true);
    try {
      const res = await API.post('/auth/citizen/reset-password', { email: fpEmail, otp: otpVal, new_password: newPw });
      setRstSucc(res.data.message);
      setTimeout(() => go('login'), 2500);
    } catch (e) { setRstErr(e.response?.data?.error || 'Reset failed'); }
    finally { setRstLoad(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/* Gradient header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'ios' ? 60 : 40 }]}>
        <View style={styles.logoRing}>
          <Text style={styles.logoText}>PS</Text>
        </View>
        <Text style={styles.appName}>PothoSense</Text>
        <Text style={styles.appTagline}>Citizen Portal</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.sheet, { backgroundColor: theme.bg }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* LOGIN / REGISTER */}
          {(view === 'login' || view === 'register') && (
            <>
              {/* Segmented control */}
              <View style={[styles.segControl, { backgroundColor: theme.bg2 || theme.bg }]}>
                {['login', 'register'].map(k => (
                  <TouchableOpacity key={k} onPress={() => go(k)}
                    style={[styles.segBtn, view === k && styles.segBtnActive]}>
                    <Text style={[styles.segTxt, view === k && styles.segTxtActive]}>
                      {k === 'login' ? 'Sign In' : 'Create Account'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {view === 'login' && (
                  <>
                    <ErrorBox msg={loginErr} />
                    <Input label="Email" value={loginForm.email} onChangeText={v => setLoginForm({ ...loginForm, email: v })}
                      placeholder="you@example.com" keyboardType="email-address" theme={theme} />
                    <Input label="Password" value={loginForm.password} onChangeText={v => setLoginForm({ ...loginForm, password: v })}
                      placeholder="" secureTextEntry theme={theme} />
                    <TouchableOpacity onPress={() => go('forgot')} style={{ alignSelf: 'flex-end', marginTop: -6, marginBottom: 16 }}>
                      <Text style={{ fontSize: 13, color: PRIMARY, fontWeight: '700' }}>Forgot password?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loginLoad}>
                      {loginLoad ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnTxt}>Sign In</Text>}
                    </TouchableOpacity>
                  </>
                )}

                {view === 'register' && (
                  <>
                    <ErrorBox msg={regErr} />
                    <SuccessBox msg={regSucc} />
                    <Input label="Username" value={regForm.username} onChangeText={v => setRegForm({ ...regForm, username: v })}
                      placeholder="your_name" autoCapitalize="none" theme={theme} />
                    <Input label="Email" value={regForm.email} onChangeText={v => setRegForm({ ...regForm, email: v })}
                      placeholder="you@example.com" keyboardType="email-address" theme={theme} />
                    <Input label="Password (min 8 chars)" value={regForm.password} onChangeText={v => setRegForm({ ...regForm, password: v })}
                      placeholder="" secureTextEntry theme={theme} />
                    <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister} disabled={regLoad}>
                      {regLoad ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnTxt}>Create Account</Text>}
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </>
          )}

          {/* FORGOT */}
          {view === 'forgot' && (
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Reset Password</Text>
              <Text style={{ color: theme.text3, fontSize: 13, marginBottom: 18, lineHeight: 20 }}>
                Enter your registered email and we'll send you a 4-digit OTP.
              </Text>
              <ErrorBox msg={fpErr} />
              <SuccessBox msg={fpSucc} />
              <Input label="Registered Email" value={fpEmail} onChangeText={setFpEmail}
                placeholder="you@example.com" keyboardType="email-address" theme={theme} />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleForgot} disabled={fpLoad}>
                {fpLoad ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnTxt}>Send OTP</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => go('login')} style={{ marginTop: 14, alignItems: 'center' }}>
                <Text style={{ color: PRIMARY, fontWeight: '700', fontSize: 14 }}> Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* RESET / OTP */}
          {view === 'reset' && (
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Enter OTP</Text>
              <Text style={{ color: theme.text3, fontSize: 13, marginBottom: 18, lineHeight: 20 }}>
                A 4-digit code was sent to{'\n'}
                <Text style={{ color: PRIMARY, fontWeight: '700' }}>{fpEmail}</Text>
              </Text>
              <ErrorBox msg={rstErr} />
              <SuccessBox msg={rstSucc} />
              {/* OTP boxes */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
                {otp.map((val, idx) => (
                  <TextInput key={idx} ref={otpRefs[idx]} value={val}
                    onChangeText={v => handleOtpChange(v, idx)}
                    onKeyPress={e => { if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs[idx - 1].current?.focus(); }}
                    keyboardType="number-pad" maxLength={1}
                    style={[styles.otpBox, { borderColor: val ? PRIMARY : theme.border, backgroundColor: val ? PRIMARY + '12' : theme.bg, color: theme.text }]}
                  />
                ))}
              </View>
              <Input label="New Password" value={newPw} onChangeText={setNewPw} placeholder="min 8 characters" secureTextEntry theme={theme} />
              <Input label="Confirm Password" value={confPw} onChangeText={setConfPw} placeholder="repeat password" secureTextEntry theme={theme} />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleReset} disabled={rstLoad}>
                {rstLoad ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnTxt}>Reset Password</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Staff link */}
          <TouchableOpacity onPress={() => router.push('/staff/login')} style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ color: theme.text3, fontSize: 13 }}>
              Staff member? <Text style={{ color: PRIMARY, fontWeight: '700' }}>Staff Login </Text>
            </Text>
          </TouchableOpacity>
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  header:      { backgroundColor: '#d4430a', paddingHorizontal: 24, paddingBottom: 32, alignItems: 'center' },
  logoRing:    { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  logoText:    { fontSize: 24, fontWeight: '900', color: '#fff' },
  appName:     { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  appTagline:  { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontWeight: '600' },
  sheet:       { padding: 20, paddingTop: 24 },
  segControl:  { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 20, borderWidth: 1, borderColor: '#e5e7eb' },
  segBtn:      { flex: 1, paddingVertical: 11, borderRadius: 9, alignItems: 'center' },
  segBtnActive:{ backgroundColor: PRIMARY },
  segTxt:      { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  segTxtActive:{ color: '#fff', fontWeight: '800' },
  card:        { borderRadius: 16, padding: 20, borderWidth: 1, marginBottom: 8 },
  cardTitle:   { fontSize: 20, fontWeight: '900', marginBottom: 6 },
  input:       { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  primaryBtn:  { backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 4, shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  primaryBtnTxt:{ color: '#fff', fontWeight: '900', fontSize: 16 },
  otpBox:      { width: 60, height: 70, fontSize: 28, fontWeight: '900', textAlign: 'center', borderRadius: 14, borderWidth: 2 },
  errBox:      { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 14, borderLeftWidth: 3, borderLeftColor: '#dc2626' },
  succBox:     { backgroundColor: '#f0fdf4', borderRadius: 10, padding: 12, marginBottom: 14, borderLeftWidth: 3, borderLeftColor: '#16a34a' },
});
