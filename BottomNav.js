// E:\Pothosense\pothosense-expo\components\BottomNav.js
// Shared custom bottom navigation bar used by citizen screens
// Import and render at the bottom of any citizen screen

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router, usePathname } from 'expo-router';
import { useApp } from '../context/AppContext';
import { getTheme } from '../utils/theme';

const CITIZEN_TABS = [
  { route: '/',                  icon: '',  label: 'Home'    },
  { route: '/map/index',         icon: '',  label: 'Map'     },
  { route: '/citizen/report',    icon: '',  label: 'Report', accent: true },
  { route: '/citizen/my-reports',icon: '',  label: 'Mine'    },
  { route: '/badges/index',      icon: '',  label: 'Badges'  },
];

export default function BottomNav() {
  const { darkMode } = useApp();
  const theme = getTheme(darkMode);
  const pathname = usePathname();

  return (
    <View style={[styles.bar, {
      backgroundColor: theme.card,
      borderTopColor: theme.border,
      paddingBottom: Platform.OS === 'ios' ? 22 : 8,
    }]}>
      {CITIZEN_TABS.map((tab) => {
        const active = pathname === tab.route ||
          (tab.route === '/' && pathname === '/index') ||
          (tab.route !== '/' && pathname.startsWith(tab.route.replace('/index', '')));

        if (tab.accent) {
          return (
            <TouchableOpacity key={tab.route} onPress={() => router.push(tab.route)} style={styles.tab}>
              <View style={[styles.accentBtn, { backgroundColor: '#d4430a' }]}>
                <Text style={{ fontSize: 22, color: '#fff' }}>{tab.icon}</Text>
              </View>
              <Text style={[styles.label, { color: '#d4430a', fontWeight: '700' }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity key={tab.route} onPress={() => router.push(tab.route)} style={styles.tab}>
            <Text style={{ fontSize: 20, opacity: active ? 1 : 0.45, color: active ? '#d4430a' : theme.text }}>{tab.icon}</Text>
            <Text style={[styles.label, { color: active ? '#d4430a' : theme.text3, fontWeight: active ? '700' : '400' }]}>
              {tab.label}
            </Text>
            {active && <View style={[styles.dot, { backgroundColor: '#d4430a' }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar:       { flexDirection: 'row', borderTopWidth: 1, paddingTop: 8 },
  tab:       { flex: 1, alignItems: 'center', gap: 3 },
  label:     { fontSize: 9, letterSpacing: 0.3 },
  dot:       { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
  accentBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginTop: -18, shadowColor: '#d4430a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
});
