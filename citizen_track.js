// E:\Pothosense\pothosense-expo\app\citizen\track.js
// Track a specific report by token

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { getTheme } from '../../utils/theme';
import API from '../../utils/api';

const STATUS_COLOR = { pending:'#f59e0b', assigned:'#3b82f6', in_progress:'#f97316', resolved:'#16a34a', rejected:'#ef4444' };

export default function TrackScreen() {
  const { darkMode } = useApp();
  const theme = getTheme(darkMode);
  const s = styles(theme);
  const params = useLocalSearchParams();
  const [token, setToken]   = useState(params?.token || '');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => { if (params?.token) fetchReport(params.token); }, []);

  const fetchReport = async (t) => {
    const tk = (t || token).trim().toUpperCase();
    if (!tk) { setError('Enter a tracking token'); return; }
    setLoading(true); setError(''); setReport(null);
    try {
      const res = await API.get(`/reports/track/${tk}`);
      setReport(res.data);
    } catch (e) {
      setError(e.response?.data?.error || 'Report not found');
    } finally { setLoading(false); }
  };

  const statusSteps = ['pending', 'assigned', 'in_progress', 'resolved'];
  const stepIdx = report ? statusSteps.indexOf(report.status) : -1;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding:16, paddingBottom:40 }}>
      <Text style={s.heading}>Track Report</Text>
      <View style={s.card}>
        <Text style={s.label}>Tracking Token</Text>
        <View style={{ flexDirection:'row', gap:8, marginTop:8 }}>
          <TextInput style={[s.input,{flex:1}]} value={token} onChangeText={t => setToken(t.toUpperCase())}
            placeholder="e.g. PS-ABC123" placeholderTextColor={theme.text3} autoCapitalize="characters" />
          <TouchableOpacity style={s.btn} onPress={() => fetchReport(token)} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Track</Text>}
          </TouchableOpacity>
        </View>
        {error ? <Text style={{ color:'#ef4444', marginTop:8, fontSize:13 }}>{error}</Text> : null}
      </View>

      {report && (
        <>
          <View style={s.card}>
            <View style={[s.badge, { backgroundColor: STATUS_COLOR[report.status]+'22', alignSelf:'flex-start', marginBottom:10 }]}>
              <Text style={[s.badgeText, { color: STATUS_COLOR[report.status] }]}>{report.status?.replace('_',' ').toUpperCase()}</Text>
            </View>
            <Text style={s.address}>{report.address || `${parseFloat(report.latitude).toFixed(4)}, ${parseFloat(report.longitude).toFixed(4)}`}</Text>
            <Text style={{ color: theme.text3, fontSize:12, marginTop:6 }}>Reported: {new Date(report.created_at).toLocaleString()}</Text>
            {report.resolved_at && <Text style={{ color:'#16a34a', fontSize:12, marginTop:2 }}>Resolved: {new Date(report.resolved_at).toLocaleString()}</Text>}
          </View>

          <View style={s.card}>
            <Text style={[s.label,{marginBottom:16}]}>Progress</Text>
            {statusSteps.map((step, i) => (
              <View key={step} style={{ flexDirection:'row', alignItems:'flex-start', marginBottom:12 }}>
                <View style={{ alignItems:'center', marginRight:12 }}>
                  <View style={{
                    width:24, height:24, borderRadius:12,
                    backgroundColor: i <= stepIdx ? STATUS_COLOR[step]||theme.primary : theme.border,
                    justifyContent:'center', alignItems:'center',
                  }}>
                    <Text style={{ color:'#fff', fontSize:10, fontWeight:'700' }}>{i <= stepIdx ? 'OK' : String(i+1)}</Text>
                  </View>
                  {i < statusSteps.length-1 && (
                    <View style={{ width:2, height:24, backgroundColor: i < stepIdx ? theme.primary : theme.border, marginTop:2 }} />
                  )}
                </View>
                <Text style={{ color: i <= stepIdx ? theme.text : theme.text3, fontWeight: i <= stepIdx ? '700' : '400', fontSize:14, paddingTop:2 }}>
                  {step.replace('_',' ').replace(/\b\w/g, c => c.toUpperCase())}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = (theme) => StyleSheet.create({
  container:  { flex:1, backgroundColor: theme.bg },
  heading:    { fontSize:20, fontWeight:'800', color: theme.text, marginBottom:16 },
  card:       { backgroundColor: theme.card, borderRadius:12, padding:14, marginBottom:14, borderWidth:1, borderColor: theme.border },
  label:      { fontSize:12, fontWeight:'700', color: theme.text3, textTransform:'uppercase', letterSpacing:0.5 },
  address:    { fontSize:15, fontWeight:'600', color: theme.text },
  input:      { backgroundColor: theme.bg, borderRadius:8, padding:10, borderWidth:1, borderColor: theme.border, color: theme.text, fontSize:14 },
  btn:        { backgroundColor: theme.primary, borderRadius:8, paddingHorizontal:16, paddingVertical:10, justifyContent:'center' },
  btnText:    { color:'#fff', fontWeight:'700', fontSize:13 },
  badge:      { paddingHorizontal:10, paddingVertical:4, borderRadius:8 },
  badgeText:  { fontSize:12, fontWeight:'700' },
});
