import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useApp } from '../../context/AppContext';
import { getTheme } from '../../utils/theme';
import AppHeader from '../../components/AppHeader';
import API from '../../utils/api';

export default function VerifyRepairsScreen() {
  const { darkMode, citizenUser } = useApp();
  const theme = getTheme(darkMode);

  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState({});
  const [comments, setComments]     = useState({});
  const [votes, setVotes]           = useState({});   // reportId -> true/false
  const [done, setDone]             = useState({});   // reportId -> true after submit

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await API.get('/analytics/pending-verifications');
      setReports(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleVote = (reportId, isSatisfied) => {
    setVotes(v => ({ ...v, [reportId]: isSatisfied }));
  };

  const handleSubmit = async (reportId) => {
    if (votes[reportId] === undefined) {
      Alert.alert('Please rate the repair', 'Tap 👍 or 👎 first.');
      return;
    }
    setSubmitting(s => ({ ...s, [reportId]: true }));
    try {
      await API.post(`/analytics/verify/${reportId}`, {
        is_satisfied: votes[reportId],
        comment: comments[reportId] || '',
      });
      setDone(d => ({ ...d, [reportId]: true }));
    } catch (e) {
      Alert.alert('Error', 'Submission failed. Please try again.');
    } finally {
      setSubmitting(s => ({ ...s, [reportId]: false }));
    }
  };

  const s = styles(theme, darkMode);

  if (!citizenUser) {
    return (
      <View style={s.container}>
        <AppHeader title="✅ Verify Repairs" />
        <View style={s.center}>
          <Text style={{ fontSize: 40 }}>🔒</Text>
          <Text style={[s.emptyTitle, { color: theme.text1 }]}>Login required</Text>
          <Text style={[s.emptyBody, { color: theme.text3 }]}>Login as a citizen to verify your repaired potholes</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <AppHeader title="✅ Verify Repairs" />

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={theme.primary} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={s.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadReports(); }} tintColor={theme.primary} />}
        >
          <View style={[s.infoBox, { backgroundColor: theme.primary + '18', borderColor: theme.primary + '55' }]}>
            <Text style={[s.infoText, { color: theme.text2 }]}>
              These potholes were marked resolved. Let us know if the repair was done properly.
              If less than 50% of citizens are satisfied, the report will be reopened automatically. +2 pts for verifying!
            </Text>
          </View>

          {reports.length === 0 ? (
            <View style={s.center}>
              <Text style={{ fontSize: 48 }}>🎉</Text>
              <Text style={[s.emptyTitle, { color: theme.text1 }]}>Nothing to verify!</Text>
              <Text style={[s.emptyBody, { color: theme.text3 }]}>Your resolved reports are all verified. Keep reporting!</Text>
            </View>
          ) : (
            reports.map(r => {
              const isDone = done[r.id];
              const myVote = votes[r.id];
              return (
                <View key={r.id} style={[s.card, { backgroundColor: theme.card, borderColor: isDone ? '#22c55e' : theme.border }]}>
                  {/* Header */}
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                    <View style={[s.badge, { backgroundColor: r.severity === 'severe' ? '#ef4444' : r.severity === 'moderate' ? '#f97316' : '#22c55e' }]}>
                      <Text style={s.badgeText}>{r.severity?.toUpperCase()}</Text>
                    </View>
                    <View style={[s.badge, { backgroundColor: '#22c55e' }]}>
                      <Text style={s.badgeText}>RESOLVED</Text>
                    </View>
                  </View>

                  <Text style={[s.address, { color: theme.text1 }]} numberOfLines={2}>
                    {r.address || `${parseFloat(r.latitude).toFixed(4)}, ${parseFloat(r.longitude).toFixed(4)}`}
                  </Text>
                  <Text style={[s.meta, { color: theme.text3 }]}>
                    Reported: {new Date(r.created_at).toLocaleDateString()} · Resolved: {r.resolved_at ? new Date(r.resolved_at).toLocaleDateString() : '—'}
                  </Text>
                  <Text style={[s.token, { color: theme.text3 }]}>🔖 {r.tracking_token}</Text>

                  {isDone ? (
                    <View style={[s.doneBox, { backgroundColor: '#22c55e22', borderColor: '#22c55e' }]}>
                      <Text style={{ fontSize: 28 }}>{votes[r.id] ? '👍' : '👎'}</Text>
                      <View>
                        <Text style={[s.doneTitle, { color: '#22c55e' }]}>Verification submitted!</Text>
                        <Text style={[s.doneBody, { color: theme.text3 }]}>+2 points added to your account</Text>
                      </View>
                    </View>
                  ) : (
                    <>
                      {/* Vote buttons */}
                      <Text style={[s.votePrompt, { color: theme.text2 }]}>Was the repair done properly?</Text>
                      <View style={s.voteRow}>
                        <TouchableOpacity
                          style={[s.voteBtn, { borderColor: myVote === true ? '#22c55e' : theme.border, backgroundColor: myVote === true ? '#22c55e22' : theme.bg2 }]}
                          onPress={() => handleVote(r.id, true)}>
                          <Text style={{ fontSize: 28 }}>👍</Text>
                          <Text style={[s.voteBtnText, { color: myVote === true ? '#22c55e' : theme.text2 }]}>Yes, fixed!</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[s.voteBtn, { borderColor: myVote === false ? '#ef4444' : theme.border, backgroundColor: myVote === false ? '#ef444422' : theme.bg2 }]}
                          onPress={() => handleVote(r.id, false)}>
                          <Text style={{ fontSize: 28 }}>👎</Text>
                          <Text style={[s.voteBtnText, { color: myVote === false ? '#ef4444' : theme.text2 }]}>Still bad</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Comment */}
                      <TextInput
                        style={[s.commentInput, { backgroundColor: theme.bg2, borderColor: theme.border, color: theme.text1 }]}
                        placeholder="Add a comment (optional)..."
                        placeholderTextColor={theme.text3}
                        value={comments[r.id] || ''}
                        onChangeText={t => setComments(c => ({ ...c, [r.id]: t }))}
                        multiline
                        numberOfLines={2}
                      />

                      <TouchableOpacity
                        style={[s.submitBtn, { backgroundColor: myVote !== undefined ? theme.primary : theme.border }]}
                        onPress={() => handleSubmit(r.id)}
                        disabled={submitting[r.id] || myVote === undefined}
                      >
                        {submitting[r.id]
                          ? <ActivityIndicator color="white" />
                          : <Text style={s.submitText}>Submit Verification</Text>
                        }
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = (theme, dark) => StyleSheet.create({
  container:    { flex: 1, backgroundColor: theme.bg1 },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  scroll:       { padding: 16, paddingBottom: 40 },
  infoBox:      { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 16 },
  infoText:     { fontSize: 13, lineHeight: 19 },
  emptyTitle:   { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  emptyBody:    { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  card:         { borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 14 },
  badge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText:    { color: 'white', fontWeight: '700', fontSize: 11 },
  address:      { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  meta:         { fontSize: 12, marginBottom: 2 },
  token:        { fontSize: 11, fontFamily: 'monospace', marginBottom: 12 },
  votePrompt:   { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  voteRow:      { flexDirection: 'row', gap: 10, marginBottom: 12 },
  voteBtn:      { flex: 1, borderWidth: 2, borderRadius: 12, paddingVertical: 12, alignItems: 'center', gap: 4 },
  voteBtnText:  { fontSize: 13, fontWeight: '600' },
  commentInput: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 13, marginBottom: 12, minHeight: 56, textAlignVertical: 'top' },
  submitBtn:    { paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  submitText:   { color: 'white', fontWeight: '700', fontSize: 15 },
  doneBox:      { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 10, padding: 12 },
  doneTitle:    { fontWeight: '700', fontSize: 14 },
  doneBody:     { fontSize: 12, marginTop: 2 },
});
