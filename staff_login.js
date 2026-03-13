import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { getTheme, C } from '../../utils/theme';
import { Btn, Inp, Card, Alrt } from '../../components/UI';
import AppHeader from '../../components/AppHeader';
import API from '../../utils/api';

// view: 'login' | 'register' | 'forgot' | 'reset'
export default function StaffLogin() {
  const { t } = useTranslation();
  const { darkMode, loginStaff } = useApp();
  const theme = getTheme(darkMode);

  const [view, setView] = useState('login');

  // Login
  const [loginForm, setLoginForm] = useState({ employee_id: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register
  const [regForm, setRegForm] = useState({ name: '', employee_id: '', email: '', password: '', zone: '', admin_key: '' });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Forgot
  const [fpEmail, setFpEmail] = useState('');
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState('');
  const [fpSuccess, setFpSuccess] = useState('');

  // Reset
  const [otp, setOtp] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  const otpRefs = [useRef(), useRef(), useRef(), useRef()];

  const clearAll = () => {
    setLoginError(''); setRegError(''); setRegSuccess('');
    setFpError(''); setFpSuccess(''); setResetError(''); setResetSuccess('');
  };
  const go = (v) => { clearAll(); setView(v); };

  // -- Login
  const handleLogin = async () => {
    if (!loginForm.employee_id || !loginForm.password) { setLoginError('All fields required'); return; }
    setLoginError(''); setLoginLoading(true);
    try {
      const res = await API.post('/auth/staff/login', loginForm);
      await loginStaff(res.data.token, { name: res.data.name, zone: res.data.zone, employee_id: res.data.employee_id });
      router.replace('/staff/dashboard');
    } catch (e) {
      setLoginError(e.response?.data?.error || 'Login failed. Check your credentials.');
    } finally { setLoginLoading(false); }
  };

  // -- Register
  const handleRegister = async () => {
    const { name, employee_id, email, password, zone, admin_key } = regForm;
    if (!name || !employee_id || !email || !password || !zone || !admin_key) { setRegError('All fields required'); return; }
    if (password.length < 8) { setRegError('Password must be at least 8 characters'); return; }
    setRegError(''); setRegLoading(true);
    try {
      await API.post('/auth/staff/register', regForm);
      setRegSuccess('Account created! You can now login.');
      setTimeout(() => go('login'), 2000);
    } catch (e) {
      setRegError(e.response?.data?.error || 'Registration failed');
    } finally { setRegLoading(false); }
  };

  // -- Forgot: send OTP
  const handleForgot = async () => {
    if (!fpEmail) { setFpError('Please enter your email'); return; }
    setFpError(''); setFpSuccess(''); setFpLoading(true);
    try {
      const res = await API.post('/auth/staff/forgot-password', { email: fpEmail });
      setFpSuccess(res.data.message);
      setOtp(['', '', '', '']); setNewPassword(''); setConfirmPassword('');
      setTimeout(() => go('reset'), 1500);
    } catch (e) {
      setFpError(e.response?.data?.error || 'Failed to send OTP');
    } finally { setFpLoading(false); }
  };

  // -- OTP input
  const handleOtpChange = (val, idx) => {
    const v = val.replace(/[^0-9]/g, '').slice(-1);
    const next = [...otp]; next[idx] = v; setOtp(next);
    if (v && idx < 3) otpRefs[idx + 1].current?.focus();
  };
  const handleOtpBackspace = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0)
      otpRefs[idx - 1].current?.focus();
  };

  // -- Reset password
  const handleReset = async () => {
    const otpVal = otp.join('');
    if (otpVal.length < 4) { setResetError('Please enter the complete 4-digit OTP'); return; }
    if (newPassword !== confirmPassword) { setResetError('Passwords do not match'); return; }
    if (newPassword.length < 8) { setResetError('Password must be at least 8 characters'); return; }
    setResetError(''); setResetLoading(true);
    try {
      const res = await API.post('/auth/staff/reset-password', {
        email: fpEmail, otp: otpVal, new_password: newPassword,
      });
      setResetSuccess(res.data.message);
      setTimeout(() => go('login'), 2500);
    } catch (e) {
      setResetError(e.response?.data?.error || 'Reset failed');
    } finally { setResetLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AppHeader />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 16 }}>

          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ fontSize: 52, marginBottom: 6 }}></Text>
            <Text style={{ fontSize: 26, fontWeight: '900', color: theme.text }}>{t('staffLogin')}</Text>
            <Text style={{ fontSize: 13, color: theme.text3, marginTop: 4 }}>PothoSense Staff Portal</Text>
          </View>

          {/* ==== LOGIN / REGISTER ==== */}
          {(view === 'login' || view === 'register') && (
            <>
              <View style={{ flexDirection: 'row', backgroundColor: theme.bg3, borderRadius: 10, padding: 4, marginBottom: 18, gap: 4 }}>
                {['login', 'register'].map(k => (
                  <TouchableOpacity key={k} onPress={() => go(k)}
                    style={{ flex: 1, padding: 10, borderRadius: 8, alignItems: 'center', backgroundColor: view === k ? C.primary : 'transparent' }}>
                    <Text style={{ fontWeight: '700', fontSize: 13, color: view === k ? '#fff' : theme.text2 }}>
                      {k === 'login' ? ' Login' : ' Register'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {view === 'login' && (
                <Card theme={theme}>
                  <Alrt message={loginError} type="error" />
                  <Inp label={t('employeeId')} theme={theme} value={loginForm.employee_id}
                    onChangeText={v => setLoginForm({ ...loginForm, employee_id: v.toUpperCase() })}
                    placeholder="STAFF001" autoCapitalize="characters" />
                  <Inp label={t('password')} theme={theme} value={loginForm.password}
                    onChangeText={v => setLoginForm({ ...loginForm, password: v })}
                    placeholder="********" secureTextEntry />
                  {/* FORGOT PASSWORD LINK */}
                  <TouchableOpacity onPress={() => go('forgot')}
                    style={{ alignSelf: 'flex-end', marginTop: -8, marginBottom: 16 }}>
                    <Text style={{ fontSize: 13, color: C.primary, fontWeight: '600' }}>Forgot password?</Text>
                  </TouchableOpacity>
                  <Btn title={t('loginBtn')} onPress={handleLogin} loading={loginLoading} size="lg" />
                  {/* Demo credentials */}
                  <View style={{ backgroundColor: `${C.accent}15`, borderLeftWidth: 3, borderLeftColor: C.accent, borderRadius: 8, padding: 12, marginTop: 14 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: C.accent, marginBottom: 4 }}>Demo Credentials</Text>
                    <Text style={{ fontSize: 13, color: theme.text2 }}>ID: <Text style={{ fontWeight: '700' }}>STAFF001</Text>  Password: <Text style={{ fontWeight: '700' }}>Staff@123</Text></Text>
                  </View>
                </Card>
              )}

              {view === 'register' && (
                <Card theme={theme}>
                  <Alrt message={regError} type="error" />
                  <Alrt message={regSuccess} type="success" />
                  <Inp label="Full Name" theme={theme} value={regForm.name}
                    onChangeText={v => setRegForm({ ...regForm, name: v })} placeholder="Your full name" />
                  <Inp label="Employee ID" theme={theme} value={regForm.employee_id}
                    onChangeText={v => setRegForm({ ...regForm, employee_id: v.toUpperCase() })}
                    placeholder="e.g. STAFF004" autoCapitalize="characters" />
                  <Inp label="Email" theme={theme} value={regForm.email}
                    onChangeText={v => setRegForm({ ...regForm, email: v })}
                    placeholder="you@municipality.gov" keyboardType="email-address" autoCapitalize="none" />
                  <Inp label="Zone" theme={theme} value={regForm.zone}
                    onChangeText={v => setRegForm({ ...regForm, zone: v })} placeholder="e.g. Zone A" />
                  <Inp label="Password" theme={theme} value={regForm.password}
                    onChangeText={v => setRegForm({ ...regForm, password: v })}
                    placeholder="min 8 characters" secureTextEntry />
                  <Inp label="Admin Secret Key" theme={theme} value={regForm.admin_key}
                    onChangeText={v => setRegForm({ ...regForm, admin_key: v })}
                    placeholder="Get from your administrator" secureTextEntry />
                  <View style={{ backgroundColor: `${C.warning}15`, borderLeftWidth: 3, borderLeftColor: C.warning, borderRadius: 8, padding: 12, marginBottom: 14 }}>
                    <Text style={{ fontSize: 12, color: C.warning, fontWeight: '700', marginBottom: 2 }}>(!) Demo Admin Key</Text>
                    <Text style={{ fontSize: 12, color: theme.text2 }}>Use: <Text style={{ fontWeight: '700', color: C.primary }}>POTHOSENSE_ADMIN_2024</Text></Text>
                  </View>
                  <Btn title="Create Staff Account" onPress={handleRegister} loading={regLoading} size="lg" />
                </Card>
              )}
            </>
          )}

          {/* ==== FORGOT PASSWORD ==== */}
          {view === 'forgot' && (
            <Card theme={theme}>
              <View style={{ alignItems: 'center', marginBottom: 18 }}>
                <Text style={{ fontSize: 40, marginBottom: 6 }}></Text>
                <Text style={{ fontSize: 20, fontWeight: '900', color: theme.text, marginBottom: 4 }}>Reset Password</Text>
                <Text style={{ fontSize: 13, color: theme.text3, textAlign: 'center' }}>
                  Enter the email linked to your staff account
                </Text>
              </View>
              <Alrt message={fpError} type="error" />
              <Alrt message={fpSuccess} type="success" />
              <Inp label="Registered Email" theme={theme} value={fpEmail}
                onChangeText={setFpEmail} placeholder="you@municipality.gov"
                keyboardType="email-address" autoCapitalize="none" />
              <Text style={{ fontSize: 11, color: theme.text3, marginTop: -8, marginBottom: 14 }}>
                (!) Must be the exact email linked to your staff account
              </Text>
              <Btn title=" Send OTP to My Email" onPress={handleForgot} loading={fpLoading} size="lg" />
              <TouchableOpacity onPress={() => go('login')} style={{ marginTop: 16, alignItems: 'center' }}>
                <Text style={{ color: C.primary, fontWeight: '600', fontSize: 14 }}> Back to Login</Text>
              </TouchableOpacity>
            </Card>
          )}

          {/* ==== ENTER OTP + NEW PASSWORD ==== */}
          {view === 'reset' && (
            <Card theme={theme}>
              <View style={{ alignItems: 'center', marginBottom: 18 }}>
                <Text style={{ fontSize: 40, marginBottom: 6 }}></Text>
                <Text style={{ fontSize: 20, fontWeight: '900', color: theme.text, marginBottom: 4 }}>Enter OTP</Text>
                <Text style={{ fontSize: 13, color: theme.text3, textAlign: 'center' }}>
                  A 4-digit OTP was sent to{'\n'}
                  <Text style={{ fontWeight: '700', color: C.primary }}>{fpEmail}</Text>
                  {'\n'}Valid for 10 minutes.
                </Text>
              </View>
              <Alrt message={resetError} type="error" />
              <Alrt message={resetSuccess} type="success" />

              {/* 4-box OTP */}
              <Text style={{ fontSize: 11, fontWeight: '700', color: theme.text3, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, textAlign: 'center' }}>
                4-Digit OTP
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
                {otp.map((val, idx) => (
                  <TextInput key={idx} ref={otpRefs[idx]}
                    value={val}
                    onChangeText={v => handleOtpChange(v, idx)}
                    onKeyPress={e => handleOtpBackspace(e, idx)}
                    keyboardType="number-pad" maxLength={1}
                    style={{
                      width: 58, height: 68, fontSize: 28, fontWeight: '900',
                      textAlign: 'center', borderRadius: 12, borderWidth: 2.5,
                      borderColor: val ? C.primary : theme.border,
                      backgroundColor: val ? `${C.primary}12` : theme.bg3,
                      color: theme.text,
                    }}
                  />
                ))}
              </View>

              <Inp label="New Password" theme={theme} value={newPassword}
                onChangeText={setNewPassword} placeholder="min 8 characters" secureTextEntry />
              <Inp label="Confirm New Password" theme={theme} value={confirmPassword}
                onChangeText={setConfirmPassword} placeholder="repeat new password" secureTextEntry />
              <Btn title=" Reset My Password" onPress={handleReset} loading={resetLoading} size="lg" />

              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 16 }}>
                <TouchableOpacity onPress={() => go('forgot')}>
                  <Text style={{ color: C.primary, fontWeight: '600', fontSize: 13 }}> Resend OTP</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => go('login')}>
                  <Text style={{ color: theme.text3, fontSize: 13 }}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          <TouchableOpacity onPress={() => router.push('/citizen/login')} style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ color: C.primary, fontSize: 13, fontWeight: '600' }}>Citizen? Go to Citizen Login -></Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
