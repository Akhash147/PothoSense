// E:\Pothosense\pothosense-expo\app\staff\dashboard.js
// Staff mobile dashboard  view reports, update status, navigate to site

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, RefreshControl, Linking, Alert,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { getTheme } from '../../utils/theme';
import API from '../../utils/api';

const STATUS_COLOR = {
  pending:     '#f59e0b',
  assigned:    '#3b82f6',
  in_progress: '#f97316',
  resolved:    '#16a34a',
  rejected:    '#ef4444',
};
const SEV_COLOR = { severe: '#dc2626', moderate: '#f97316', minor: '#f59e0b' };

function Badge({ label, color }) {
  return (
    <View style={{ backgroundColor: color + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' }}>
      <Text style={{ color, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
}

function ReportCard({ r, onUpdate, theme }) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const s = cardStyles(theme);

  const update = async (status) => {
    setUpdating(true);
    try {
      await API.put(`/reports/staff/update/${r.id}`, { status });
      onUpdate();
    } catch { Alert.alert('Error', 'Update failed'); }
    finally { setUpdating(false); }
  };

  const navigate = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${r.latitude},${r.longitude}`;
    Linking.openURL(url);
  };

  const deadline = r.sla_deadline ? new Date(r.sla_deadline).toLocaleDateString() : null;

  return (
    <View style={[s.card, r.sla_breached && { borderColor: '#ef4444', borderWidth: 1.5 }]}>
      <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
          <Badge label={r.severity} color={SEV_COLOR[r.severity] || '#888'} />
          <Badge label={r.status}   color={STATUS_COLOR[r.status] || '#888'} />
          {r.sla_breached && <Badge label="SLA BREACH" color="#ef4444" />}
        </View>
        <Text style={s.address} numberOfLines={2}>
          {r.address || `${parseFloat(r.latitude).toFixed(4)}, ${parseFloat(r.longitude).toFixed(4)}`}
        </Text>
        {deadline && (
          <Text style={{ fontSize: 11, color: r.sla_breached ? '#ef4444' : theme.text3, marginTop: 2 }}>
            SLA: {deadline}
          </Text>
        )}
        <Text style={{ fontSize: 11, color: theme.text3, marginTop: 2, textAlign: 'right' }}>
          {expanded ? '^ Collapse' : 'v Expand'}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={{ borderTopWidth: 1, borderTopColor: theme.border, marginTop: 10, paddingTop: 10 }}>
          {r.description && (
            <Text style={{ fontSize: 13, color: theme.text2, marginBottom: 10 }}>{r.description}</Text>
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <TouchableOpacity style={s.actionBtn} onPress={navigate}>
              <Text style={s.actionBtnText}>Navigate</Text>
            </TouchableOpacity>
            {r.status !== 'in_progress' && r.status !== 'resolved' && (
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#f97316' }]} onPress={() => update('in_progress')} disabled={updating}>
                <Text style={[s.actionBtnText, { color: '#fff' }]}>In Progress</Text>
              </TouchableOpacity>
            )}
            {r.status !== 'resolved' && (
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#16a34a' }]} onPress={() => update('resolved')} disabled={updating}>
                {updating
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={[s.actionBtnText, { color: '#fff' }]}>Mark Resolved</Text>
                }
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

export default function StaffDashboardScreen() {
  const { darkMode, staffUser, logoutStaff } = useApp();
  const theme = getTheme(darkMode);
  const s = styles(theme);

  const [tab, setTab]               = useState('mine');
  const [reports, setReports]       = useState([]);
  const [myWork, setMyWork]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');
  const [stats, setStats]           = useState(null);

  const load = useCallback(async () => {
    try {
      const [all, mine, sum] = await Promise.allSettled([
        API.get('/reports/staff/all'),
        API.get('/reports/staff/mine'),
        API.get('/analytics/summary'),
      ]);
      if (all.status  === 'fulfilled') setReports(Array.isArray(all.value.data)  ? all.value.data  : []);
      if (mine.status === 'fulfilled') setMyWork( Array.isArray(mine.value.data) ? mine.value.data : []);
      if (sum.status  === 'fulfilled') setStats(sum.value.data?.totals || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const list = (tab === 'mine' ? myWork : reports).filter(r =>
    !search ||
    r.address?.toLowerCase().includes(search.toLowerCase()) ||
    r.tracking_token?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}>
      <ActivityIndicator color={theme.primary} size="large" />
    </View>
  );

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Staff Dashboard</Text>
          <Text style={s.headerSub}>Zone {staffUser?.zone || '--'} | {staffUser?.name}</Text>
        </View>
        <TouchableOpacity onPress={() => { Alert.alert('Logout', 'Are you sure?', [
          { text: 'Cancel' },
          { text: 'Logout', style: 'destructive', onPress: logoutStaff },
        ]); }}>
          <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13 }}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      {stats && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.statsRow}>
          {[
            { label: 'Total',    value: stats.total,    color: theme.primary },
            { label: 'Pending',  value: stats.pending,  color: '#f59e0b' },
            { label: 'Active',   value: stats.in_progress || 0, color: '#f97316' },
            { label: 'Resolved', value: stats.resolved, color: '#16a34a' },
            { label: 'My Work',  value: myWork.length,  color: '#8b5cf6' },
          ].map(stat => (
            <View key={stat.label} style={s.statChip}>
              <Text style={[s.statVal, { color: stat.color }]}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Tab bar */}
      <View style={s.tabBar}>
        {[['mine', `My Work (${myWork.length})`], ['all', `All (${reports.length})`]].map(([key, label]) => (
          <TouchableOpacity key={key} style={[s.tabBtn, tab === key && s.tabBtnActive]} onPress={() => setTab(key)}>
            <Text style={[s.tabBtnText, tab === key && s.tabBtnTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View style={s.searchBox}>
        <TextInput
          style={s.searchInput}
          placeholder="Search by address or token..."
          placeholderTextColor={theme.text3}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Report list */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        {list.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: theme.text3, textAlign: 'center' }}>
              {tab === 'mine' ? 'No assigned work. Use web dashboard to get assignments.' : 'No reports found.'}
            </Text>
          </View>
        ) : (
          list.map(r => <ReportCard key={r.id} r={r} onUpdate={load} theme={theme} />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = (theme) => StyleSheet.create({
  container:       { flex: 1, backgroundColor: theme.bg },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 20, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
  headerTitle:     { fontSize: 18, fontWeight: '800', color: theme.text },
  headerSub:       { fontSize: 12, color: theme.text3, marginTop: 2 },
  statsRow:        { backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border, paddingVertical: 10, paddingHorizontal: 8, flexGrow: 0 },
  statChip:        { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, marginHorizontal: 4, backgroundColor: theme.bg, borderRadius: 8, borderWidth: 1, borderColor: theme.border },
  statVal:         { fontSize: 20, fontWeight: '800' },
  statLabel:       { fontSize: 11, color: theme.text3, marginTop: 1 },
  tabBar:          { flexDirection: 'row', backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
  tabBtn:          { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabBtnActive:    { borderBottomWidth: 2, borderBottomColor: theme.primary },
  tabBtnText:      { fontSize: 13, fontWeight: '600', color: theme.text3 },
  tabBtnTextActive:{ color: theme.primary },
  searchBox:       { padding: 10, backgroundColor: theme.card },
  searchInput:     { backgroundColor: theme.bg, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: theme.border, color: theme.text, fontSize: 14 },
});

const cardStyles = (theme) => StyleSheet.create({
  card:       { backgroundColor: theme.card, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.border },
  address:    { fontSize: 14, fontWeight: '600', color: theme.text, marginTop: 4 },
  actionBtn:  { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: theme.text2 },
});
