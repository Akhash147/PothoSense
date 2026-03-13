import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import MapView, { Polyline, Circle, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useApp } from '../../context/AppContext';
import { getTheme } from '../../utils/theme';
import AppHeader from '../../components/AppHeader';
import API from '../../utils/api';

const GEOCODE_URL = 'https://nominatim.openstreetmap.org/search';

async function geocode(query) {
  const url = `${GEOCODE_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`;
  const res  = await fetch(url, { headers: { 'User-Agent': 'PothoSense/1.0' } });
  const data = await res.json();
  if (!data.length) throw new Error('Location not found');
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), display: data[0].display_name };
}

function interpolate(start, end, steps = 5) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    pts.push({
      lat: start.lat + (end.lat - start.lat) * (i / steps),
      lng: start.lng + (end.lng - start.lng) * (i / steps),
    });
  }
  return pts;
}

export default function RouteSafetyScreen() {
  const { darkMode } = useApp();
  const theme = getTheme(darkMode);

  const [startText, setStartText] = useState('');
  const [endText, setEndText]     = useState('');
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [startCoord, setStartCoord] = useState(null);
  const [endCoord, setEndCoord]     = useState(null);

  const useCurrentLocation = async (setter) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission denied'); return; }
      const loc = await Location.getCurrentPositionAsync({});
      setter(`${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
    } catch { Alert.alert('Error', 'Could not get location'); }
  };

  const checkRoute = async () => {
    if (!startText.trim() || !endText.trim()) {
      Alert.alert('Fill both fields', 'Enter a start and end location or address.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      let startPt, endPt;
      // Try to parse as coordinates first (lat, lng)
      const coordRe = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/;
      const sm = startText.trim().match(coordRe);
      const em = endText.trim().match(coordRe);
      if (sm) startPt = { lat: parseFloat(sm[1]), lng: parseFloat(sm[2]) };
      else startPt = await geocode(startText);
      if (em) endPt = { lat: parseFloat(em[1]), lng: parseFloat(em[2]) };
      else endPt = await geocode(endText);

      setStartCoord(startPt);
      setEndCoord(endPt);

      const waypoints = interpolate(startPt, endPt, 8);
      const res = await API.post('/analytics/route-safety', { waypoints });
      setResult({ ...res.data, startPt, endPt, waypoints });
    } catch (e) {
      Alert.alert('Error', e.message || 'Route check failed');
    } finally {
      setLoading(false);
    }
  };

  const safetyColor = (score) => score >= 80 ? '#22c55e' : score >= 50 ? '#f97316' : '#ef4444';
  const safetyLabel = (score) => score >= 80 ? 'SAFE' : score >= 50 ? 'MODERATE RISK' : 'HIGH RISK';
  const safetyEmoji = (score) => score >= 80 ? '✅' : score >= 50 ? '⚠️' : '🚨';

  const s = styles(theme, darkMode);

  const mapRegion = result ? {
    latitude: (result.startPt.lat + result.endPt.lat) / 2,
    longitude: (result.startPt.lng + result.endPt.lng) / 2,
    latitudeDelta: Math.abs(result.startPt.lat - result.endPt.lat) * 2 + 0.02,
    longitudeDelta: Math.abs(result.startPt.lng - result.endPt.lng) * 2 + 0.02,
  } : null;

  return (
    <View style={s.container}>
      <AppHeader title="🛣️ Route Safety" />
      <ScrollView contentContainerStyle={s.scroll}>

        <Text style={[s.subtitle, { color: theme.text3 }]}>
          Check how many potholes are on your planned route before you travel.
        </Text>

        {/* Input form */}
        <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[s.label, { color: theme.text2 }]}>Start Location</Text>
          <View style={s.inputRow}>
            <TextInput
              style={[s.input, { backgroundColor: theme.bg2, borderColor: theme.border, color: theme.text1, flex: 1 }]}
              placeholder="Address or coordinates..."
              placeholderTextColor={theme.text3}
              value={startText}
              onChangeText={setStartText}
            />
            <TouchableOpacity style={[s.locBtn, { backgroundColor: theme.primary + '22' }]} onPress={() => useCurrentLocation(setStartText)}>
              <Text>📍</Text>
            </TouchableOpacity>
          </View>

          <Text style={[s.label, { color: theme.text2, marginTop: 10 }]}>End Location</Text>
          <View style={s.inputRow}>
            <TextInput
              style={[s.input, { backgroundColor: theme.bg2, borderColor: theme.border, color: theme.text1, flex: 1 }]}
              placeholder="Address or coordinates..."
              placeholderTextColor={theme.text3}
              value={endText}
              onChangeText={setEndText}
            />
            <TouchableOpacity style={[s.locBtn, { backgroundColor: theme.primary + '22' }]} onPress={() => useCurrentLocation(setEndText)}>
              <Text>📍</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.checkBtn, { backgroundColor: theme.primary }]}
            onPress={checkRoute}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={s.checkBtnText}>🔍 Check Route Safety</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Results */}
        {result && (
          <>
            {/* Score card */}
            <View style={[s.scoreCard, { backgroundColor: safetyColor(result.safety_score) + '18', borderColor: safetyColor(result.safety_score) }]}>
              <Text style={{ fontSize: 40 }}>{safetyEmoji(result.safety_score)}</Text>
              <Text style={[s.scoreNum, { color: safetyColor(result.safety_score) }]}>{result.safety_score}/100</Text>
              <Text style={[s.scoreLabel, { color: safetyColor(result.safety_score) }]}>{safetyLabel(result.safety_score)}</Text>
              <Text style={[s.scoreBody, { color: theme.text2 }]}>{result.recommendation}</Text>
            </View>

            {/* Stats row */}
            <View style={s.statsRow}>
              {[
                { icon: '🕳️', label: 'Potholes Found', value: result.pothole_count },
                { icon: '🚨', label: 'Severe',          value: result.severe_count },
                { icon: '⚠️',  label: 'Moderate',       value: result.moderate_count },
                { icon: '✅', label: 'Minor',           value: result.minor_count },
              ].map(s2 => (
                <View key={s2.label} style={[s.statItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={{ fontSize: 18 }}>{s2.icon}</Text>
                  <Text style={[s.statVal, { color: theme.text1 }]}>{s2.value ?? 0}</Text>
                  <Text style={[s.statLbl, { color: theme.text3 }]}>{s2.label}</Text>
                </View>
              ))}
            </View>

            {/* Map */}
            <MapView
              style={s.map}
              provider={PROVIDER_DEFAULT}
              initialRegion={mapRegion}
            >
              {/* Route line */}
              <Polyline
                coordinates={result.waypoints.map(p => ({ latitude: p.lat, longitude: p.lng }))}
                strokeColor={safetyColor(result.safety_score)}
                strokeWidth={4}
              />
              {/* Potholes on route */}
              {(result.potholes || []).map((p, i) => (
                <Circle
                  key={i}
                  center={{ latitude: parseFloat(p.latitude), longitude: parseFloat(p.longitude) }}
                  radius={18}
                  fillColor={p.severity === 'severe' ? '#ef444488' : p.severity === 'moderate' ? '#f9731688' : '#22c55e88'}
                  strokeColor={p.severity === 'severe' ? '#ef4444' : p.severity === 'moderate' ? '#f97316' : '#22c55e'}
                  strokeWidth={2}
                />
              ))}
            </MapView>

            {/* Pothole list */}
            {result.potholes && result.potholes.length > 0 && (
              <>
                <Text style={[s.listTitle, { color: theme.text2 }]}>Potholes on Your Route</Text>
                {result.potholes.map((p, i) => (
                  <View key={i} style={[s.potholeRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={[s.sevDot, { backgroundColor: p.severity === 'severe' ? '#ef4444' : p.severity === 'moderate' ? '#f97316' : '#22c55e' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[{ fontWeight: '600', fontSize: 13, color: theme.text1 }]} numberOfLines={1}>
                        {p.address || `${parseFloat(p.latitude).toFixed(4)}, ${parseFloat(p.longitude).toFixed(4)}`}
                      </Text>
                      <Text style={[{ fontSize: 11, color: theme.text3 }]}>{p.severity} · {p.status}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = (theme, dark) => StyleSheet.create({
  container:   { flex: 1, backgroundColor: theme.bg1 },
  scroll:      { padding: 16, paddingBottom: 40 },
  subtitle:    { fontSize: 13, marginBottom: 16, lineHeight: 18 },
  card:        { borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16 },
  label:       { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  inputRow:    { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input:       { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 13 },
  locBtn:      { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  checkBtn:    { marginTop: 14, paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  checkBtnText:{ color: 'white', fontWeight: '700', fontSize: 15 },
  scoreCard:   { borderWidth: 2, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, gap: 4 },
  scoreNum:    { fontSize: 36, fontWeight: '900' },
  scoreLabel:  { fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  scoreBody:   { fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  statsRow:    { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statItem:    { flex: 1, borderWidth: 1, borderRadius: 10, padding: 10, alignItems: 'center', gap: 2 },
  statVal:     { fontWeight: '800', fontSize: 18 },
  statLbl:     { fontSize: 10, textAlign: 'center' },
  map:         { height: 260, borderRadius: 12, marginBottom: 16 },
  listTitle:   { fontWeight: '700', fontSize: 14, marginBottom: 10 },
  potholeRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderWidth: 1, borderRadius: 8, marginBottom: 6 },
  sevDot:      { width: 10, height: 10, borderRadius: 5 },
});
