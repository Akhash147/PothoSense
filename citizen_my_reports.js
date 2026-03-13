import BottomNav from '../../components/BottomNav';
// E:\Pothosense\pothosense-expo\app\citizen\my-reports.js
// Shows citizen's own submitted reports with tracking status

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { getTheme } from '../../utils/theme';
import API from '../../utils/api';

const STATUS_COLOR = { pending:'#f59e0b', assigned:'#3b82f6', in_progress:'#f97316', resolved:'#16a34a', rejected:'#ef4444' };
const SEV_COLOR    = { severe:'#dc2626', moderate:'#f97316', minor:'#f59e0b' };

export default function MyReportsScreen() {
  const { darkMode } = useApp();
  const theme = getTheme(darkMode);
  const s = styles(theme);
  const [reports, setReports]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await API.get('/reports/citizen/mine');
      setReports(Array.isArray(res.data) ? res.data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={[s.container,{justifyContent:'center',alignItems:'center'}]}><ActivityIndicator color={theme.primary} size="large" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={theme.primary} />}>
      <Text style={s.heading}>My Reports ({reports.length})</Text>
      {reports.length === 0
        ? <Text style={{ color: theme.text3, textAlign:'center', marginTop: 40 }}>No reports yet. Go report a pothole!</Text>
        : reports.map(r => (
          <TouchableOpacity key={r.id} style={s.card} onPress={() => router.push({ pathname: '/citizen/track', params: { token: r.tracking_token } })}>
            <View style={{ flexDirection:'row', gap:6, marginBottom:6, flexWrap:'wrap' }}>
              <View style={[s.badge, { backgroundColor: SEV_COLOR[r.severity]+'22' }]}>
                <Text style={[s.badgeText, { color: SEV_COLOR[r.severity] }]}>{r.severity}</Text>
              </View>
              <View style={[s.badge, { backgroundColor: STATUS_COLOR[r.status]+'22' }]}>
                <Text style={[s.badgeText, { color: STATUS_COLOR[r.status] }]}>{r.status?.replace('_',' ')}</Text>
              </View>
            </View>
            <Text style={s.address} numberOfLines={2}>{r.address || `${parseFloat(r.latitude).toFixed(4)}, ${parseFloat(r.longitude).toFixed(4)}`}</Text>
            <Text style={{ fontSize:12, color: theme.text3, marginTop:4 }}>Token: {r.tracking_token}</Text>
            <Text style={{ fontSize:12, color: theme.text3 }}>{new Date(r.created_at).toLocaleDateString()}</Text>
          </TouchableOpacity>
        ))
      }
    </ScrollView>
    <BottomNav />
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  container: { flex:1, backgroundColor: theme.bg },
  heading:   { fontSize:20, fontWeight:'800', color: theme.text, marginBottom:16 },
  card:      { backgroundColor: theme.card, borderRadius:12, padding:14, marginBottom:10, borderWidth:1, borderColor: theme.border },
  address:   { fontSize:14, fontWeight:'600', color: theme.text },
  badge:     { paddingHorizontal:8, paddingVertical:3, borderRadius:6 },
  badgeText: { fontSize:11, fontWeight:'700', textTransform:'uppercase' },
});
