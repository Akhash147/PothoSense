// E:\Pothosense\pothosense-expo\app\index.js
// Home screen  onboarding if not logged in, dashboard if logged in

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../context/AppContext';
import { getTheme } from '../utils/theme';
import BottomNav from '../components/BottomNav';
import API from '../utils/api';

//  Stats card 
function StatCard({ value, label, color, icon }) {
  return (
    <View style={[SC.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text style={[SC.statVal, { color }]}>{value ?? ''}</Text>
      <Text style={SC.statLbl}>{label}</Text>
    </View>
  );
}

const SC = StyleSheet.create({
  statCard: { flex: 1, backgroundColor: '#ffffff', borderRadius: 14, padding: 14, alignItems: 'center', gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  statVal:  { fontSize: 22, fontWeight: '900' },
  statLbl:  { fontSize: 10, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
});

//  Main 
export default function HomeScreen() {
  const { darkMode, citizenUser, staffUser, loading, logoutCitizen } = useApp();
  const theme = getTheme(darkMode);

  const [stats,     setStats]    = useState(null);
  const [statsLoad, setStatLoad] = useState(false);

  // Staff  redirect immediately
  useEffect(() => {
    if (!loading && staffUser) {
      router.replace('/staff/dashboard');
    }
  }, [staffUser, loading]);

  // Load citizen stats
  useEffect(() => {
    if (citizenUser) {
      setStatLoad(true);
      API.get('/analytics/summary')
        .then(r => setStats(r.data))
        .catch(() => {})
        .finally(() => setStatLoad(false));
    }
  }, [citizenUser]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}>
        <ActivityIndicator size="large" color="#d4430a" />
      </View>
    );
  }

  //  Not logged in: Onboarding 
  if (!citizenUser && !staffUser) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a0a00' }}>
        {/* Hero  gradient replaced with solid + overlay (no expo-linear-gradient needed) */}
        <View style={styles.heroGrad}>
          {/* Simulated gradient with two overlapping views */}
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#d4430a', opacity: 0.9 }]} />
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#ff7c3a', opacity: 0.25 }]} />
          <View style={styles.heroContent}>
            <View style={styles.logoBubble}>
              <Text style={styles.logoPS}>PS</Text>
            </View>
            <Text style={styles.heroTitle}>PothoSense</Text>
            <Text style={styles.heroSub}>Smart roads start with you.{'\n'}Report. Track. Fix.</Text>
          </View>
        </View>

        <View style={[styles.onboardSheet, { backgroundColor: theme.bg }]}>
          <View style={styles.pill} />

          <Text style={[styles.sheetTitle, { color: theme.text }]}>
            Be the change your city needs
          </Text>
          <Text style={[styles.sheetSub, { color: theme.text3 }]}>
            Auto-detect potholes while driving using your phone accelerometer {'\u2014'} or report them manually with a photo.
          </Text>

          {/* Feature pills */}
          <View style={styles.featureRow}>
            {[
              ['\u26A1', 'Auto-Detect',  '#f97316'],
              ['\uD83D\uDCCD', 'GPS Tagging',  '#3b82f6'],
              ['\uD83C\uDFC6', 'Earn Points',  '#16a34a'],
              ['\uD83D\uDD14', 'Track Status', '#8b5cf6'],
            ].map(([icon, lbl, clr]) => (
              <View key={lbl} style={[styles.featurePill, { backgroundColor: clr + '15', borderColor: clr + '40', borderWidth: 1 }]}>
                <Text style={{ fontSize: 14 }}>{icon}</Text>
                <Text style={{ fontSize: 11, color: clr, fontWeight: '700' }}>{lbl}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/citizen/login')}>
            <Text style={styles.primaryBtnTxt}>Get Started as Citizen</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryBtn, { borderColor: theme.border }]} onPress={() => router.push('/staff/login')}>
            <Text style={[styles.secondaryBtnTxt, { color: theme.text2 }]}>I am a Staff Member</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  //  Logged in as citizen: Home dashboard 
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.dashHeader, { backgroundColor: '#d4430a' }]}>
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#ff6b35', opacity: 0.35 }]} />
          <View style={{ padding: 20, paddingTop: Platform.OS === 'ios' ? 54 : 36 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600' }}>Welcome back</Text>
                <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', marginTop: 2 }}>
                  {typeof citizenUser === 'string' ? citizenUser : citizenUser?.username || 'Citizen'}
                </Text>
              </View>
              <TouchableOpacity onPress={logoutCitizen} style={styles.logoutBtn}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ padding: 16 }}>
          {/* Quick actions */}
          <Text style={[styles.sectionHead, { color: theme.text }]}>Quick Actions</Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: '#d4430a' }]}
              onPress={() => router.push('/citizen/report')}
            >
              <Text style={{ fontSize: 28, marginBottom: 6 }}>{'\uD83D\uDEA7'}</Text>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>Auto-Detect</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 2 }}>Drive and detect potholes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }]}
              onPress={() => router.push('/citizen/my-reports')}
            >
              <Text style={{ fontSize: 28, marginBottom: 6 }}>{'\uD83D\uDCCB'}</Text>
              <Text style={{ color: theme.text, fontWeight: '900', fontSize: 15 }}>My Reports</Text>
              <Text style={{ color: theme.text3, fontSize: 11, marginTop: 2 }}>Track your reports</Text>
            </TouchableOpacity>
          </View>

          {/* Stats */}
          <Text style={[styles.sectionHead, { color: theme.text }]}>City Stats</Text>
          {statsLoad ? (
            <ActivityIndicator color="#d4430a" style={{ marginVertical: 20 }} />
          ) : (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
              <StatCard value={stats?.total_reports}    label="Total"   color="#d4430a" icon={'\uD83D\uDDFA\uFE0F'} />
              <StatCard value={stats?.resolved_reports} label="Fixed"   color="#16a34a" icon={'\u2705'} />
              <StatCard value={stats?.pending_reports}  label="Pending" color="#f97316" icon={'\u23F3'} />
            </View>
          )}

          {/* Explore */}
          <Text style={[styles.sectionHead, { color: theme.text }]}>Explore</Text>
          <View style={{ gap: 10 }}>
            {[
              { icon: '\uD83D\uDDFA\uFE0F', title: 'Pothole Map',  sub: 'See all reported potholes in your area',        route: '/map/index' },
              { icon: '\uD83D\uDD0D',       title: 'Track Report', sub: 'Enter your token to check status',               route: '/citizen/track' },
              { icon: '\uD83D\uDEE1\uFE0F', title: 'Route Safety', sub: 'Find the safest route to your destination',      route: '/safety/index' },
              { icon: '\uD83C\uDFC6',       title: 'Leaderboard',  sub: 'See top contributors in your city',              route: '/badges/index' },
            ].map((item) => (
              <TouchableOpacity
                key={item.route}
                style={[styles.exploreCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => router.push(item.route)}
              >
                <Text style={{ fontSize: 24 }}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', fontSize: 14, color: theme.text }}>{item.title}</Text>
                  <Text style={{ fontSize: 12, color: theme.text3, marginTop: 2 }}>{item.sub}</Text>
                </View>
                <Text style={{ color: theme.text3, fontSize: 18 }}>{'\u203A'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  // Onboarding
  heroGrad:       { height: 340, justifyContent: 'flex-end', overflow: 'hidden' },
  heroContent:    { padding: 32, paddingBottom: 40, alignItems: 'center' },
  logoBubble:     { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  logoPS:         { fontSize: 26, fontWeight: '900', color: '#fff' },
  heroTitle:      { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  heroSub:        { fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 8, lineHeight: 22 },
  onboardSheet:   { flex: 1, borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -24, padding: 28 },
  pill:           { width: 36, height: 4, borderRadius: 2, backgroundColor: '#e5e7eb', alignSelf: 'center', marginBottom: 22 },
  sheetTitle:     { fontSize: 22, fontWeight: '900', marginBottom: 8, letterSpacing: -0.3 },
  sheetSub:       { fontSize: 14, lineHeight: 21, marginBottom: 20 },
  featureRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  featurePill:    { flexDirection: 'row', gap: 5, alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  primaryBtn:     { backgroundColor: '#d4430a', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12, shadowColor: '#d4430a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
  primaryBtnTxt:  { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.3 },
  secondaryBtn:   { borderWidth: 1.5, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  secondaryBtnTxt:{ fontWeight: '700', fontSize: 15 },
  // Dashboard
  dashHeader:     { paddingBottom: 24, overflow: 'hidden' },
  logoutBtn:      { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  sectionHead:    { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  actionCard:     { flex: 1, borderRadius: 16, padding: 16 },
  exploreCard:    { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 14, padding: 14, borderWidth: 1 },
});
