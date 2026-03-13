import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useApp } from '../../context/AppContext';
import { getTheme } from '../../utils/theme';
import AppHeader from '../../components/AppHeader';
import API from '../../utils/api';

const BADGE_META = {
  newcomer:       { icon: '🌱', color: '#6b7280', label: 'Newcomer',       threshold: 0 },
  first_reporter: { icon: '📍', color: '#3b82f6', label: 'First Reporter', threshold: 10 },
  active_citizen: { icon: '⭐', color: '#8b5cf6', label: 'Active Citizen', threshold: 50 },
  road_hero:      { icon: '🦸', color: '#f59e0b', label: 'Road Hero',      threshold: 100 },
  legend:         { icon: '👑', color: '#ef4444', label: 'Legend',         threshold: 200 },
};

const RANK_TIERS = [
  { threshold: 200, label: 'Legend',      color: '#ef4444' },
  { threshold: 100, label: 'Road Hero',   color: '#f59e0b' },
  { threshold: 50,  label: 'Active',      color: '#8b5cf6' },
  { threshold: 10,  label: 'Reporter',    color: '#3b82f6' },
  { threshold: 0,   label: 'Newcomer',    color: '#6b7280' },
];

function getRank(points) {
  return RANK_TIERS.find(t => points >= t.threshold) || RANK_TIERS[RANK_TIERS.length - 1];
}

function getNextBadge(points) {
  const order = ['newcomer','first_reporter','active_citizen','road_hero','legend'];
  for (const key of order) {
    if (points < BADGE_META[key].threshold) return BADGE_META[key];
  }
  return null;
}

export default function GamificationScreen() {
  const { darkMode, citizenUser } = useApp();
  const theme = getTheme(darkMode);

  const [tab, setTab]         = useState('leaderboard'); // leaderboard | mystats
  const [board, setBoard]     = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [lRes, sRes] = await Promise.allSettled([
        API.get('/analytics/leaderboard'),
        citizenUser ? API.get('/analytics/my-stats') : Promise.resolve({ data: null }),
      ]);
      if (lRes.status === 'fulfilled') setBoard(lRes.value.data);
      if (sRes.status === 'fulfilled' && sRes.value.data) setMyStats(sRes.value.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const s = styles(theme, darkMode);

  const medalIcon = (rank) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;

  return (
    <View style={s.container}>
      <AppHeader title="🏆 Leaderboard" />

      {/* Tabs */}
      <View style={[s.tabBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        {['leaderboard', 'mystats'].map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, { color: tab === t ? theme.primary : theme.text3 }]}>
              {t === 'leaderboard' ? '🏆 Top Citizens' : '⭐ My Stats'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.loading}><ActivityIndicator size="large" color={theme.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={s.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        >
          {/* ── LEADERBOARD ── */}
          {tab === 'leaderboard' && (
            <>
              <Text style={[s.sectionTitle, { color: theme.text3 }]}>Top 20 Citizens — Helping fix roads 🛣️</Text>
              {board.map((citizen, i) => {
                const badge = BADGE_META[citizen.badge] || BADGE_META.newcomer;
                const rank  = getRank(citizen.points);
                return (
                  <View key={i} style={[s.leaderRow, { backgroundColor: theme.card, borderColor: theme.border },
                    i === 0 && { borderColor: '#fbbf24', borderWidth: 2 }]}>
                    <Text style={[s.rankNum, { color: i < 3 ? '#fbbf24' : theme.text3, fontSize: i < 3 ? 22 : 16 }]}>
                      {medalIcon(i + 1)}
                    </Text>
                    <View style={[s.badgeCircle, { backgroundColor: badge.color + '22', borderColor: badge.color }]}>
                      <Text style={{ fontSize: 18 }}>{badge.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.citizenName, { color: theme.text1 }]}>{citizen.display_name}</Text>
                      <Text style={[s.badgeLabel, { color: badge.color }]}>{badge.label}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[s.pointsText, { color: rank.color }]}>{citizen.points}</Text>
                      <Text style={[s.pointsLabel, { color: theme.text3 }]}>pts</Text>
                    </View>
                  </View>
                );
              })}
              {board.length === 0 && (
                <View style={s.emptyState}>
                  <Text style={{ fontSize: 40 }}>🌱</Text>
                  <Text style={[s.emptyTitle, { color: theme.text1 }]}>No data yet</Text>
                  <Text style={[s.emptyBody, { color: theme.text3 }]}>Start reporting potholes to earn points!</Text>
                </View>
              )}
            </>
          )}

          {/* ── MY STATS ── */}
          {tab === 'mystats' && (
            <>
              {!citizenUser ? (
                <View style={s.emptyState}>
                  <Text style={{ fontSize: 40 }}>🔒</Text>
                  <Text style={[s.emptyTitle, { color: theme.text1 }]}>Login required</Text>
                  <Text style={[s.emptyBody, { color: theme.text3 }]}>Login as a citizen to see your stats</Text>
                </View>
              ) : myStats ? (
                <>
                  {/* Badge card */}
                  {(() => {
                    const badge = BADGE_META[myStats.badge] || BADGE_META.newcomer;
                    const rank  = getRank(myStats.points);
                    const next  = getNextBadge(myStats.points);
                    const prev  = BADGE_META[myStats.badge]?.threshold || 0;
                    const progress = next ? Math.min(100, ((myStats.points - prev) / (next.threshold - prev)) * 100) : 100;
                    return (
                      <View style={[s.badgeCard, { backgroundColor: badge.color + '15', borderColor: badge.color }]}>
                        <Text style={{ fontSize: 52, textAlign: 'center', marginBottom: 6 }}>{badge.icon}</Text>
                        <Text style={[s.badgeCardTitle, { color: badge.color }]}>{badge.label}</Text>
                        <Text style={[s.badgeCardRank, { color: theme.text2 }]}>Rank #{myStats.rank || '—'} worldwide</Text>
                        <Text style={[s.badgeCardPoints, { color: rank.color }]}>{myStats.points} Points</Text>
                        {next && (
                          <>
                            <View style={[s.progressTrack, { backgroundColor: theme.bg3 }]}>
                              <View style={[s.progressFill, { width: `${progress}%`, backgroundColor: badge.color }]} />
                            </View>
                            <Text style={[s.progressLabel, { color: theme.text3 }]}>
                              {next.threshold - myStats.points} pts to {next.label}
                            </Text>
                          </>
                        )}
                      </View>
                    );
                  })()}

                  {/* Stats grid */}
                  <View style={s.statsGrid}>
                    {[
                      { icon: '📍', label: 'Reports Filed', value: myStats.total_reports || 0 },
                      { icon: '✅', label: 'Reports Fixed', value: myStats.resolved_reports || 0 },
                      { icon: '🏆', label: 'Points Earned', value: myStats.points || 0 },
                      { icon: '🌍', label: 'My Rank',       value: myStats.rank ? `#${myStats.rank}` : '—' },
                    ].map(stat => (
                      <View key={stat.label} style={[s.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={{ fontSize: 24, marginBottom: 4 }}>{stat.icon}</Text>
                        <Text style={[s.statValue, { color: theme.text1 }]}>{stat.value}</Text>
                        <Text style={[s.statLabel, { color: theme.text3 }]}>{stat.label}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Points guide */}
                  <View style={[s.guideCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[s.guideTitle, { color: theme.text1 }]}>How to Earn Points</Text>
                    {[
                      { action: 'Submit a report',        pts: '+5 pts' },
                      { action: 'Sensor detection',       pts: '+5 pts' },
                      { action: 'Your report gets fixed', pts: '+10 pts' },
                      { action: 'Verify a repair',        pts: '+2 pts' },
                    ].map(g => (
                      <View key={g.action} style={s.guideRow}>
                        <Text style={[s.guideAction, { color: theme.text2 }]}>• {g.action}</Text>
                        <Text style={[s.guidePts, { color: '#22c55e' }]}>{g.pts}</Text>
                      </View>
                    ))}
                  </View>

                  {/* All badge tiers */}
                  <Text style={[s.sectionTitle, { color: theme.text3, marginTop: 8 }]}>Badge Tiers</Text>
                  {Object.entries(BADGE_META).map(([key, b]) => {
                    const earned = myStats.points >= b.threshold;
                    return (
                      <View key={key} style={[s.tierRow, { backgroundColor: theme.card, borderColor: earned ? b.color : theme.border, opacity: earned ? 1 : 0.5 }]}>
                        <Text style={{ fontSize: 24 }}>{b.icon}</Text>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={[s.tierName, { color: b.color }]}>{b.label}</Text>
                          <Text style={[s.tierReq, { color: theme.text3 }]}>{b.threshold === 0 ? 'Starting badge' : `${b.threshold}+ points`}</Text>
                        </View>
                        <Text style={{ fontSize: 18 }}>{earned ? '✅' : '🔒'}</Text>
                      </View>
                    );
                  })}
                </>
              ) : (
                <View style={s.loading}><ActivityIndicator color={theme.primary} /></View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = (theme, dark) => StyleSheet.create({
  container:      { flex: 1, backgroundColor: theme.bg1 },
  loading:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabBar:         { flexDirection: 'row', borderBottomWidth: 1 },
  tab:            { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:      { borderBottomWidth: 2, borderBottomColor: theme.primary },
  tabText:        { fontWeight: '600', fontSize: 14 },
  scroll:         { padding: 16, paddingBottom: 40 },
  sectionTitle:   { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  leaderRow:      { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8, gap: 10 },
  rankNum:        { width: 30, textAlign: 'center', fontWeight: '700' },
  badgeCircle:    { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  citizenName:    { fontWeight: '600', fontSize: 15 },
  badgeLabel:     { fontSize: 12, fontWeight: '500', marginTop: 1 },
  pointsText:     { fontWeight: '800', fontSize: 18 },
  pointsLabel:    { fontSize: 11 },
  emptyState:     { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle:     { fontSize: 18, fontWeight: '700' },
  emptyBody:      { fontSize: 14, textAlign: 'center' },
  badgeCard:      { borderWidth: 2, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20 },
  badgeCardTitle: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  badgeCardRank:  { fontSize: 14, marginBottom: 4 },
  badgeCardPoints:{ fontSize: 28, fontWeight: '900', marginBottom: 10 },
  progressTrack:  { height: 8, borderRadius: 4, width: '100%', overflow: 'hidden', marginBottom: 6 },
  progressFill:   { height: '100%', borderRadius: 4 },
  progressLabel:  { fontSize: 12 },
  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard:       { flex: 1, minWidth: '44%', padding: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  statValue:      { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel:      { fontSize: 12 },
  guideCard:      { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16 },
  guideTitle:     { fontWeight: '700', fontSize: 15, marginBottom: 10 },
  guideRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  guideAction:    { fontSize: 13 },
  guidePts:       { fontWeight: '700', fontSize: 13 },
  tierRow:        { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1.5, marginBottom: 8 },
  tierName:       { fontWeight: '700', fontSize: 15 },
  tierReq:        { fontSize: 12, marginTop: 2 },
});
