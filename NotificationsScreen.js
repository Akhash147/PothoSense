import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useApp } from '../../context/AppContext';
import { getTheme } from '../../utils/theme';
import AppHeader from '../../components/AppHeader';
import API from '../../utils/api';

const TYPE_META = {
  success: { icon: '✅', color: '#22c55e', bg: '#22c55e18' },
  warning: { icon: '⚠️',  color: '#f97316', bg: '#f9731618' },
  alert:   { icon: '🚨', color: '#ef4444', bg: '#ef444418' },
  info:    { icon: 'ℹ️',  color: '#3b82f6', bg: '#3b82f618' },
};

export default function NotificationsScreen() {
  const { darkMode, citizenUser, staffUser } = useApp();
  const theme = getTheme(darkMode);

  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const isLoggedIn = citizenUser || staffUser;

  const loadNotifications = useCallback(async () => {
    if (!isLoggedIn) { setLoading(false); return; }
    try {
      const res = await API.get('/analytics/notifications');
      setNotifications(res.data.notifications || []);
      setUnread(res.data.unread || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [isLoggedIn]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await API.put('/analytics/notifications/read-all');
      setNotifications(n => n.map(x => ({ ...x, is_read: true })));
      setUnread(0);
    } catch {} finally { setMarkingAll(false); }
  };

  const groupByDate = (list) => {
    const groups = {};
    list.forEach(n => {
      const d = new Date(n.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      let key;
      if (d.toDateString() === today.toDateString()) key = 'Today';
      else if (d.toDateString() === yesterday.toDateString()) key = 'Yesterday';
      else key = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    });
    return groups;
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const s = styles(theme, darkMode);

  if (!isLoggedIn) {
    return (
      <View style={s.container}>
        <AppHeader title="🔔 Notifications" />
        <View style={s.center}>
          <Text style={{ fontSize: 40 }}>🔒</Text>
          <Text style={[s.emptyTitle, { color: theme.text1 }]}>Login required</Text>
          <Text style={[s.emptyBody, { color: theme.text3 }]}>Login to see your notifications</Text>
        </View>
      </View>
    );
  }

  const groups = groupByDate(notifications);

  return (
    <View style={s.container}>
      <AppHeader
        title="🔔 Notifications"
        right={
          unread > 0 && (
            <TouchableOpacity onPress={markAllRead} disabled={markingAll}>
              <Text style={[s.markAllText, { color: theme.primary }]}>
                {markingAll ? '...' : 'Mark all read'}
              </Text>
            </TouchableOpacity>
          )
        }
      />

      {/* Unread badge */}
      {unread > 0 && (
        <View style={[s.unreadBanner, { backgroundColor: theme.primary + '18', borderBottomColor: theme.primary + '44' }]}>
          <Text style={[s.unreadText, { color: theme.primary }]}>
            🔵 {unread} unread notification{unread > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={theme.primary} /></View>
      ) : notifications.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48 }}>🔔</Text>
          <Text style={[s.emptyTitle, { color: theme.text1 }]}>No notifications yet</Text>
          <Text style={[s.emptyBody, { color: theme.text3 }]}>You'll get notified when your reported potholes are fixed or when SLA deadlines are breached.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotifications(); }} tintColor={theme.primary} />}
        >
          {Object.entries(groups).map(([date, items]) => (
            <View key={date}>
              <Text style={[s.dateHeader, { color: theme.text3 }]}>{date}</Text>
              {items.map(n => {
                const meta = TYPE_META[n.type] || TYPE_META.info;
                return (
                  <View key={n.id} style={[s.notifCard, {
                    backgroundColor: n.is_read ? theme.card : meta.bg,
                    borderColor: n.is_read ? theme.border : meta.color + '55',
                    borderLeftColor: meta.color,
                  }]}>
                    <View style={s.notifRow}>
                      <View style={[s.iconCircle, { backgroundColor: meta.bg }]}>
                        <Text style={{ fontSize: 18 }}>{meta.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Text style={[s.notifTitle, { color: n.is_read ? theme.text1 : meta.color, flex: 1 }]} numberOfLines={1}>
                            {n.title}
                          </Text>
                          <Text style={[s.timeAgo, { color: theme.text3 }]}>{timeAgo(n.created_at)}</Text>
                        </View>
                        <Text style={[s.notifMsg, { color: theme.text2 }]} numberOfLines={3}>{n.message}</Text>
                        {!n.is_read && (
                          <View style={[s.unreadDot, { backgroundColor: meta.color }]} />
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = (theme, dark) => StyleSheet.create({
  container:     { flex: 1, backgroundColor: theme.bg1 },
  center:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  scroll:        { padding: 16, paddingBottom: 40 },
  markAllText:   { fontSize: 13, fontWeight: '600' },
  unreadBanner:  { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  unreadText:    { fontSize: 13, fontWeight: '600' },
  emptyTitle:    { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptyBody:     { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  dateHeader:    { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },
  notifCard:     { borderWidth: 1, borderLeftWidth: 4, borderRadius: 12, padding: 12, marginBottom: 8 },
  notifRow:      { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  iconCircle:    { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifTitle:    { fontWeight: '700', fontSize: 14, marginBottom: 3 },
  notifMsg:      { fontSize: 13, lineHeight: 18 },
  timeAgo:       { fontSize: 11, flexShrink: 0, marginLeft: 6 },
  unreadDot:     { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4 },
});
