// E:\Pothosense\pothosense-expo\app\_layout.js
// Replace your existing _layout.js with this file
// Adds: Map, Gamification, VerifyRepairs, RouteSafety, Notifications tabs

import '../i18n/i18n'; // MUST be first — initializes i18next
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Stack, Tabs, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from '../context/AppContext';
import { getTheme } from '../utils/theme';
import API from '../utils/api';

// ── Notification badge (polls every 60s) ─────────────────────────────────────
function useNotifCount() {
  const { citizenUser, staffUser } = useApp();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!citizenUser && !staffUser) { setCount(0); return; }
    const fetch = async () => {
      try {
        const res = await API.get('/analytics/notifications');
        setCount(res.data.unread || 0);
      } catch {}
    };
    fetch();
    const id = setInterval(fetch, 60000);
    return () => clearInterval(id);
  }, [citizenUser, staffUser]);

  return count;
}

// ── Tab bar icon with optional badge ─────────────────────────────────────────
function TabIcon({ icon, label, active, badgeCount, color }) {
  return (
    <View style={tabIconStyles.container}>
      <Text style={{ fontSize: active ? 22 : 20, opacity: active ? 1 : 0.6 }}>{icon}</Text>
      {badgeCount > 0 && (
        <View style={tabIconStyles.badge}>
          <Text style={tabIconStyles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
        </View>
      )}
      <Text style={[tabIconStyles.label, { color: active ? color : '#9ca3af', fontWeight: active ? '700' : '400' }]}>
        {label}
      </Text>
    </View>
  );
}

const tabIconStyles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
  label:     { fontSize: 10, marginTop: 2 },
  badge:     { position: 'absolute', top: -2, right: -8, backgroundColor: '#ef4444', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: 'white', fontSize: 9, fontWeight: '700' },
});

// ── Root layout with tabs ─────────────────────────────────────────────────────
function RootLayout() {
  const { darkMode, citizenUser, staffUser } = useApp();
  const theme = getTheme(darkMode);
  const notifCount = useNotifCount();

  const isLoggedIn = !!(citizenUser || staffUser);

  const tabs = [
    { name: 'index',          icon: '🏠', label: 'Home' },
    { name: 'map/index',      icon: '🗺️',  label: 'Map' },
    { name: 'citizen/report', icon: '📍', label: 'Report', citizenOnly: true },
    { name: 'citizen/my-reports', icon: '📋', label: 'My Reports', citizenOnly: true },
    { name: 'verify/index',   icon: '✅', label: 'Verify',     citizenOnly: true },
    { name: 'safety/index',   icon: '🛣️',  label: 'Safety' },
    { name: 'badges/index',   icon: '🏆', label: 'Badges' },
    { name: 'notifs/index',   icon: '🔔', label: 'Alerts',     badge: true },
  ];

  return (
    <>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 82 : 62,
            paddingBottom: Platform.OS === 'ios' ? 20 : 6,
          },
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: '#9ca3af',
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen name="index" options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Home" active={focused} color={theme.primary} />,
        }} />

        <Tabs.Screen name="map/index" options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🗺️" label="Map" active={focused} color={theme.primary} />,
        }} />

        <Tabs.Screen name="citizen/report" options={{
          href: isLoggedIn && citizenUser ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon icon="📍" label="Report" active={focused} color={theme.primary} />,
        }} />

        <Tabs.Screen name="citizen/my-reports" options={{
          href: isLoggedIn && citizenUser ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon icon="📋" label="Reports" active={focused} color={theme.primary} />,
        }} />

        <Tabs.Screen name="verify/index" options={{
          href: isLoggedIn && citizenUser ? undefined : null,
          tabBarIcon: ({ focused }) => <TabIcon icon="✅" label="Verify" active={focused} color={theme.primary} />,
        }} />

        <Tabs.Screen name="safety/index" options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🛣️" label="Safety" active={focused} color={theme.primary} />,
        }} />

        <Tabs.Screen name="badges/index" options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🏆" label="Badges" active={focused} color={theme.primary} />,
        }} />

        <Tabs.Screen name="notifs/index" options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🔔" label="Alerts" active={focused} color={theme.primary} badgeCount={notifCount} />,
        }} />

        {/* Staff screens — hidden from tab bar */}
        <Tabs.Screen name="staff/login"   options={{ href: null }} />
        <Tabs.Screen name="staff/dashboard" options={{ href: null }} />
        <Tabs.Screen name="citizen/track"    options={{ href: null }} />
        <Tabs.Screen name="citizen/login"    options={{ href: null }} />
        <Tabs.Screen name="staff/register"   options={{ href: null }} />
      </Tabs>
    </>
  );
}

export default function Layout() {
  return (
    <AppProvider>
      <RootLayout />
    </AppProvider>
  );
}
