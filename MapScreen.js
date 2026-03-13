import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Platform } from 'react-native';
import MapView, { Circle, Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useApp } from '../../context/AppContext';
import { getTheme } from '../../utils/theme';
import AppHeader from '../../components/AppHeader';
import API from '../../utils/api';

const SEVERITY_COLORS = { severe: '#ef4444', moderate: '#f97316', minor: '#22c55e' };

export default function MapScreen() {
  const { darkMode } = useApp();
  const theme = getTheme(darkMode);

  const [potholes, setPotholes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all'); // all | severe | moderate | minor
  const [userLoc, setUserLoc]   = useState(null);
  const [selected, setSelected] = useState(null);
  const [stats, setStats]       = useState({ total: 0, severe: 0, moderate: 0, minor: 0 });
  const mapRef = useRef(null);

  useEffect(() => { loadPotholes(); getUserLocation(); }, []);

  const loadPotholes = async () => {
    setLoading(true);
    try {
      const res = await API.get('/analytics/map-potholes');
      const data = res.data || [];
      setPotholes(data);
      setStats({
        total:    data.length,
        severe:   data.filter(p => p.severity === 'severe').length,
        moderate: data.filter(p => p.severity === 'moderate').length,
        minor:    data.filter(p => p.severity === 'minor').length,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLoc({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    } catch {}
  };

  const centerOnUser = () => {
    if (userLoc && mapRef.current) {
      mapRef.current.animateToRegion({ ...userLoc, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 600);
    }
  };

  const filtered = filter === 'all' ? potholes : potholes.filter(p => p.severity === filter);

  const initialRegion = userLoc
    ? { latitude: userLoc.latitude, longitude: userLoc.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : { latitude: 11.0168, longitude: 76.9558, latitudeDelta: 0.1, longitudeDelta: 0.1 };

  const s = styles(theme, darkMode);

  return (
    <View style={s.container}>
      <AppHeader title="🗺️ Pothole Map" />

      {/* Stats row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.statsScroll} contentContainerStyle={s.statsRow}>
        {[
          { key: 'all',      label: 'All',      count: stats.total,    color: theme.primary },
          { key: 'severe',   label: 'Severe',   count: stats.severe,   color: '#ef4444' },
          { key: 'moderate', label: 'Moderate', count: stats.moderate, color: '#f97316' },
          { key: 'minor',    label: 'Minor',    count: stats.minor,    color: '#22c55e' },
        ].map(f => (
          <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)}
            style={[s.filterChip, filter === f.key && { borderColor: f.color, backgroundColor: f.color + '22' }]}>
            <Text style={[s.filterCount, { color: f.color }]}>{f.count}</Text>
            <Text style={s.filterLabel}>{f.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={loadPotholes} style={s.refreshBtn}>
          <Text style={{ color: theme.primary, fontSize: 18 }}>🔄</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Map */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <View style={s.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[s.loadingText, { color: theme.text2 }]}>Loading potholes...</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            provider={PROVIDER_DEFAULT}
            initialRegion={initialRegion}
            showsUserLocation
            showsMyLocationButton={false}
          >
            {filtered.map(p => (
              <React.Fragment key={p.id}>
                <Circle
                  center={{ latitude: parseFloat(p.latitude), longitude: parseFloat(p.longitude) }}
                  radius={p.severity === 'severe' ? 20 : p.severity === 'moderate' ? 14 : 9}
                  fillColor={SEVERITY_COLORS[p.severity] + '55'}
                  strokeColor={SEVERITY_COLORS[p.severity]}
                  strokeWidth={2}
                />
                <Marker
                  coordinate={{ latitude: parseFloat(p.latitude), longitude: parseFloat(p.longitude) }}
                  pinColor={SEVERITY_COLORS[p.severity]}
                  onPress={() => setSelected(p)}
                >
                  <Callout tooltip>
                    <View style={s.callout}>
                      <Text style={s.calloutSeverity}>{p.severity?.toUpperCase()}</Text>
                      <Text style={s.calloutAddress} numberOfLines={2}>{p.address || 'Tap for details'}</Text>
                      <Text style={s.calloutStatus}>Status: {p.status}</Text>
                    </View>
                  </Callout>
                </Marker>
              </React.Fragment>
            ))}
          </MapView>
        )}

        {/* Center on user button */}
        <TouchableOpacity style={s.locBtn} onPress={centerOnUser}>
          <Text style={{ fontSize: 20 }}>📍</Text>
        </TouchableOpacity>
      </View>

      {/* Selected pothole detail sheet */}
      {selected && (
        <View style={s.sheet}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
                <View style={[s.badge, { backgroundColor: SEVERITY_COLORS[selected.severity] }]}>
                  <Text style={s.badgeText}>{selected.severity?.toUpperCase()}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: '#6b7280' }]}>
                  <Text style={s.badgeText}>{selected.status}</Text>
                </View>
              </View>
              <Text style={[s.sheetAddr, { color: theme.text1 }]} numberOfLines={2}>
                {selected.address || `${parseFloat(selected.latitude).toFixed(5)}, ${parseFloat(selected.longitude).toFixed(5)}`}
              </Text>
              <Text style={[s.sheetDate, { color: theme.text3 }]}>
                Reported: {new Date(selected.created_at).toLocaleDateString()}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelected(null)} style={s.closeBtn}>
              <Text style={{ color: theme.text2, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Legend */}
      <View style={[s.legend, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        {Object.entries(SEVERITY_COLORS).map(([key, color]) => (
          <View key={key} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: color }]} />
            <Text style={[s.legendText, { color: theme.text2 }]}>{key}</Text>
          </View>
        ))}
        <Text style={[s.legendCount, { color: theme.text3 }]}>{filtered.length} shown</Text>
      </View>
    </View>
  );
}

const styles = (theme, dark) => StyleSheet.create({
  container:       { flex: 1, backgroundColor: theme.bg1 },
  statsScroll:     { maxHeight: 72, borderBottomWidth: 1, borderBottomColor: theme.border },
  statsRow:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  filterChip:      { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: theme.border, backgroundColor: theme.card },
  filterCount:     { fontSize: 16, fontWeight: '700' },
  filterLabel:     { fontSize: 11, color: theme.text3, marginTop: 1 },
  refreshBtn:      { paddingHorizontal: 12, paddingVertical: 6 },
  loadingContainer:{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:     { fontSize: 14 },
  locBtn:          { position: 'absolute', bottom: 20, right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: theme.card, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6 },
  callout:         { backgroundColor: dark ? '#1e293b' : 'white', borderRadius: 10, padding: 10, maxWidth: 180, borderWidth: 1, borderColor: theme.border },
  calloutSeverity: { fontWeight: '700', fontSize: 12, color: '#ef4444', marginBottom: 2 },
  calloutAddress:  { fontSize: 12, color: theme.text1, marginBottom: 2 },
  calloutStatus:   { fontSize: 11, color: theme.text3 },
  sheet:           { backgroundColor: theme.card, borderTopWidth: 1, borderTopColor: theme.border, padding: 16 },
  sheetAddr:       { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  sheetDate:       { fontSize: 12 },
  badge:           { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText:       { color: 'white', fontSize: 11, fontWeight: '700' },
  closeBtn:        { padding: 4 },
  legend:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, gap: 16 },
  legendItem:      { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:       { width: 10, height: 10, borderRadius: 5 },
  legendText:      { fontSize: 12 },
  legendCount:     { marginLeft: 'auto', fontSize: 12 },
});
