// E:\Pothosense\pothosense-expo\app\citizen\report.js
// Simplified auto-detect: shows jolt level + plain-language severity only
// Manual report: location, severity, description, photo
// Safe area aware (Dynamic Island / notch)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, Image, Platform,
  Animated, Vibration, AppState, SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location   from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp }   from '../../context/AppContext';
import { getTheme } from '../../utils/theme';
import BottomNav    from '../../components/BottomNav';
import API          from '../../utils/api';

//  Detection constants (not shown to user) 
const THRESHOLD_SEVERE   = 30;
const THRESHOLD_MODERATE = 18;
const SPEED_GATE_MS      = 4.17;   // 15 km/h
const COOLDOWN_MS        = 2500;
const BATCH_SIZE         = 5;
const ACCEL_HZ_MS        = 100;

const SEV_COLOR  = { severe: '#dc2626', moderate: '#f97316', minor: '#f59e0b' };
const SEV_LABEL  = { severe: 'Large Pothole', moderate: 'Medium Pothole', minor: 'Small Bump' };
const SEV_EMOJI  = { severe: '', moderate: '', minor: '' };
const SEVERITIES = ['minor', 'moderate', 'severe'];

const mag = ({ x, y, z }) => Math.sqrt(x * x + y * y + z * z);
const sevFromMag = (m) => m > THRESHOLD_SEVERE ? 'severe' : m > THRESHOLD_MODERATE ? 'moderate' : 'minor';

//  Simple detection card 
function HitCard({ det, idx }) {
  const c   = SEV_COLOR[det.severity];
  const lbl = SEV_LABEL[det.severity];
  const em  = SEV_EMOJI[det.severity];
  return (
    <View style={[hc.card, { borderLeftColor: c }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ fontSize: 26 }}>{em}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#1f2937' }}>{lbl}</Text>
          <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            Detected at {det.time}    {det.speed_kmh} km/h
          </Text>
        </View>
        <View style={[hc.badge, { backgroundColor: c + '20' }]}>
          <Text style={{ color: c, fontSize: 11, fontWeight: '800' }}>#{idx + 1}</Text>
        </View>
      </View>
    </View>
  );
}
const hc = StyleSheet.create({
  card:  { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
});

//  Jolt meter  simple bar 
function JoltMeter({ value }) {
  // 0-15 = calm, 15-25 = bumpy, 25+ = pothole
  const pct   = Math.min(100, (value / 35) * 100);
  const color = value > THRESHOLD_SEVERE ? '#dc2626' : value > THRESHOLD_MODERATE ? '#f97316' : value > 8 ? '#f59e0b' : '#16a34a';
  const label = value > THRESHOLD_SEVERE ? 'Large Pothole!' : value > THRESHOLD_MODERATE ? 'Pothole!' : value > 8 ? 'Bumpy Road' : 'Smooth';

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151' }}>Road Smoothness</Text>
        <Text style={{ fontSize: 13, fontWeight: '800', color }}>{label}</Text>
      </View>
      <View style={{ height: 14, backgroundColor: '#f3f4f6', borderRadius: 7, overflow: 'hidden' }}>
        <Animated.View style={{ height: '100%', width: pct + '%', backgroundColor: color, borderRadius: 7 }} />
      </View>
    </View>
  );
}

// 
export default function ReportScreen() {
  const { darkMode } = useApp();
  const theme  = getTheme(darkMode);
  const insets = useSafeAreaInsets();
  const S      = makeStyles(theme);

  const [tab, setTab] = useState('auto');

  // Auto state
  const [running,     setRunning]     = useState(false);
  const [detections,  setDetections]  = useState([]);
  const [liveSpeed,   setLiveSpeed]   = useState(0);
  const [liveMag,     setLiveMag]     = useState(0);
  const [uploading,   setUploading]   = useState(false);
  const [uploadStats, setUploadStats] = useState(null);
  const [permErr,     setPermErr]     = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const accelSub    = useRef(null);
  const locWatch    = useRef(null);
  const posRef      = useRef(null);
  const speedRef    = useRef(0);
  const lastHitTime = useRef(0);
  const bufRef      = useRef([]);

  // Manual state
  const [desc,      setDesc]    = useState('');
  const [severity,  setSev]     = useState('moderate');
  const [photo,     setPhoto]   = useState(null);
  const [locLoad,   setLocLoad] = useState(false);
  const [manualPos, setManPos]  = useState(null);
  const [submitting,setSub]     = useState(false);
  const [succData,  setSucc]    = useState(null);

  useEffect(() => () => _stopAll(), []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background' && accelSub.current) {
        accelSub.current.remove();
        accelSub.current = null;
      }
    });
    return () => sub.remove();
  }, [running]);

  const _pulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.4, duration: 80,  useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,   duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const startDetection = useCallback(async () => {
    setPermErr('');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { setPermErr('Location access is needed to record where potholes are.'); return; }

    locWatch.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.Balanced, timeInterval: 500, distanceInterval: 2 },
      (loc) => {
        posRef.current   = loc.coords;
        const spd        = Math.max(0, loc.coords.speed ?? 0);
        speedRef.current = spd;
        setLiveSpeed(spd);
      }
    );

    Accelerometer.setUpdateInterval(ACCEL_HZ_MS);
    accelSub.current = Accelerometer.addListener((data) => {
      const m = mag(data);
      setLiveMag(m);
      const now = Date.now();
      if (m <= THRESHOLD_MODERATE)               return;
      if (speedRef.current < SPEED_GATE_MS)      return;
      if (now - lastHitTime.current < COOLDOWN_MS) return;
      if (!posRef.current)                        return;

      lastHitTime.current = now;
      const sev = sevFromMag(m);
      const det = {
        id:        now,
        lat:       posRef.current.latitude,
        lng:       posRef.current.longitude,
        severity:  sev,
        magnitude: m.toFixed(1),
        speed_kmh: (speedRef.current * 3.6).toFixed(1),
        time:      new Date().toLocaleTimeString(),
      };
      bufRef.current = [...bufRef.current, det];
      setDetections(prev => [det, ...prev].slice(0, 50));
      _pulse();
      Vibration.vibrate(sev === 'severe' ? [0, 180, 80, 180] : 120);

      if (bufRef.current.length >= BATCH_SIZE) {
        _uploadBatch([...bufRef.current]);
        bufRef.current = [];
      }
    });

    setRunning(true);
    setDetections([]);
    setUploadStats(null);
    bufRef.current      = [];
    lastHitTime.current = 0;
  }, []);

  const _stopAll = useCallback(() => {
    accelSub.current?.remove();
    accelSub.current = null;
    locWatch.current?.remove?.();
    locWatch.current = null;
    if (bufRef.current.length > 0) {
      _uploadBatch([...bufRef.current]);
      bufRef.current = [];
    }
    setRunning(false);
    setLiveSpeed(0);
    setLiveMag(0);
  }, []);

  const _uploadBatch = async (batch) => {
    if (!batch.length) return;
    setUploading(true);
    try {
      const res = await API.post('/reports/sensor-batch', {
        detections: batch.map(d => ({
          latitude:  d.lat, longitude: d.lng,
          severity:  d.severity, magnitude: parseFloat(d.magnitude),
          speed_kmh: parseFloat(d.speed_kmh),
        })),
      });
      setUploadStats(prev => ({
        total:       (prev?.total       || 0) + batch.length,
        new_reports: (prev?.new_reports || 0) + (res.data.new_reports   ?? batch.length),
        points:      (prev?.points      || 0) + (res.data.points_earned ?? 0),
      }));
    } catch (e) {
      console.warn('[PothoSense] Batch upload error:', e?.message);
    } finally { setUploading(false); }
  };

  const getLocation = async () => {
    setLocLoad(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission needed', 'Allow location access to pin the pothole.'); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setManPos({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch { Alert.alert('Error', 'Could not get your location. Try again.'); }
    finally  { setLocLoad(false); }
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.7 });
    if (!r.canceled) setPhoto(r.assets[0]);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.7 });
    if (!r.canceled) setPhoto(r.assets[0]);
  };

  const submitManual = async () => {
    if (!manualPos)   { Alert.alert('Location needed', 'Tap "Pin My Location" first.'); return; }
    if (!desc.trim()) { Alert.alert('Description needed', 'Please describe the pothole briefly.'); return; }
    setSub(true);
    try {
      const fd = new FormData();
      fd.append('latitude',    String(manualPos.lat));
      fd.append('longitude',   String(manualPos.lng));
      fd.append('severity',    severity);
      fd.append('description', desc.trim());
      if (photo) {
        const name = photo.uri.split('/').pop();
        const ext  = name.match(/\.(\w+)$/)?.[1] || 'jpg';
        fd.append('photo', { uri: photo.uri, name, type: 'image/' + ext });
      }
      const res = await API.post('/reports/submit', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSucc(res.data);
      setDesc(''); setPhoto(null); setManPos(null);
    } catch (err) {
      Alert.alert('Submission failed', err.response?.data?.error || 'Please try again.');
    } finally { setSub(false); }
  };

  // Success screen
  if (succData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center', padding: 28 }}>
        <Text style={{ fontSize: 56, marginBottom: 12 }}></Text>
        <Text style={{ fontSize: 22, fontWeight: '900', color: '#166534', textAlign: 'center' }}>Report Submitted!</Text>
        <View style={[S.card, { width: '100%', alignItems: 'center', marginTop: 20 }]}>
          <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Your Tracking Token</Text>
          <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 22, fontWeight: '900', color: '#d4430a', letterSpacing: 3 }}>
            {succData.tracking_token}
          </Text>
          <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 6, textAlign: 'center' }}>
            Save this token to track your report status
          </Text>
          {succData.points_earned > 0 && (
            <View style={{ marginTop: 12, backgroundColor: '#fef9c3', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 }}>
              <Text style={{ color: '#854d0e', fontWeight: '900' }}>+{succData.points_earned} points earned!</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={[S.primaryBtn, { marginTop: 24, width: '100%' }]} onPress={() => setSucc(null)}>
          <Text style={S.primaryBtnTxt}>Report Another Pothole</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const speedKmh = liveSpeed * 3.6;
  const speedOk  = liveSpeed >= SPEED_GATE_MS;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      {/*  Safe header (Dynamic Island aware)  */}
      <View style={[S.header, { paddingTop: insets.top + 8 }]}>
        <Text style={S.headerTitle}>Report a Pothole</Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {[['auto', 'Auto'], ['manual', 'Manual']].map(([k, lbl]) => (
            <TouchableOpacity key={k} style={[S.tabPill, tab === k && S.tabPillActive]} onPress={() => setTab(k)}>
              <Text style={[S.tabPillTxt, tab === k && S.tabPillTxtActive]}>{lbl}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/*  AUTO-DETECT TAB  */}
      {tab === 'auto' && (
        <ScrollView contentContainerStyle={S.scroll} showsVerticalScrollIndicator={false}>

          {/* Big status card */}
          <View style={[S.card, running && { borderColor: '#16a34a', borderWidth: 2 }]}>
            {running ? (
              <>
                {/* Live status */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#16a34a' }}>Scanning Road...</Text>
                    <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      {speedOk
                        ? `Moving at ${speedKmh.toFixed(0)} km/h  active`
                        : 'Drive at 15+ km/h to detect potholes'}
                    </Text>
                  </View>
                  <Animated.View style={[S.liveDot, { transform: [{ scale: pulseAnim }] }]} />
                </View>

                <JoltMeter value={liveMag} />

                {/* Stat row */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={S.statPill}>
                    <Text style={S.statVal}>{detections.length}</Text>
                    <Text style={S.statLbl}>Potholes found</Text>
                  </View>
                  <View style={S.statPill}>
                    <Text style={S.statVal}>{speedKmh.toFixed(0)}</Text>
                    <Text style={S.statLbl}>km/h</Text>
                  </View>
                  <View style={S.statPill}>
                    <Text style={S.statVal}>{bufRef.current.length}</Text>
                    <Text style={S.statLbl}>Pending upload</Text>
                  </View>
                </View>

                {uploading && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
                    <ActivityIndicator size="small" color="#d4430a" />
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>Uploading potholes...</Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text, marginBottom: 8 }}>
                  Auto-Detect Mode
                </Text>
                <Text style={{ fontSize: 13, color: theme.text3, lineHeight: 20, marginBottom: 16 }}>
                  Tap Start, then drive normally. Your phone will automatically detect potholes and report them  no tapping needed.
                </Text>
                <View style={{ gap: 8 }}>
                  {[
                    ['', 'Just drive  app does the rest'],
                    ['', 'GPS pins every pothole automatically'],
                    ['', 'Reports sent automatically to the city'],
                    ['', 'Earn points for every pothole found'],
                  ].map(([icon, txt]) => (
                    <View key={txt} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                      <Text style={{ fontSize: 16 }}>{icon}</Text>
                      <Text style={{ fontSize: 13, color: theme.text2, flex: 1 }}>{txt}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {permErr ? <Text style={S.errTxt}>{permErr}</Text> : null}

            <TouchableOpacity
              style={[S.primaryBtn, running && { backgroundColor: '#dc2626' }, { marginTop: 16 }]}
              onPress={running ? _stopAll : startDetection}
            >
              <Text style={S.primaryBtnTxt}>
                {running ? '  Stop Detecting' : '  Start Auto-Detect'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Upload result */}
          {uploadStats && (
            <View style={[S.card, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 1 }]}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: '#166534', marginBottom: 4 }}>
                 Potholes reported!
              </Text>
              <Text style={{ fontSize: 13, color: '#166534' }}>
                Found {uploadStats.total} potholes{uploadStats.new_reports > 0 ? `  ${uploadStats.new_reports} new reports created` : ''}
              </Text>
              {uploadStats.points > 0 && (
                <Text style={{ color: '#854d0e', fontWeight: '800', marginTop: 6 }}>
                  +{uploadStats.points} points earned!
                </Text>
              )}
            </View>
          )}

          {/* Detection log  simple list */}
          {detections.length > 0 && (
            <>
              <Text style={[S.sectionHead, { color: theme.text }]}>
                Potholes Found ({detections.length})
              </Text>
              {detections.slice(0, 10).map((d, i) => <HitCard key={d.id} det={d} idx={i} />)}
              {detections.length > 10 && (
                <Text style={{ color: theme.text3, textAlign: 'center', fontSize: 12, marginTop: 4 }}>
                  + {detections.length - 10} more
                </Text>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/*  MANUAL REPORT TAB  */}
      {tab === 'manual' && (
        <ScrollView contentContainerStyle={S.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Location */}
          <View style={S.card}>
            <Text style={S.fieldLbl}> Where is the pothole?</Text>
            {manualPos ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 }}>
                <View style={S.locBox}>
                  <Text style={{ fontSize: 12, color: '#166534', fontWeight: '600' }}>
                    Location pinned 
                  </Text>
                  <Text style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                    {manualPos.lat.toFixed(5)}, {manualPos.lng.toFixed(5)}
                  </Text>
                </View>
                <TouchableOpacity onPress={getLocation}>
                  <Text style={{ color: '#d4430a', fontWeight: '700', fontSize: 13 }}>Update</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={[S.outBtn, { marginTop: 10 }]} onPress={getLocation} disabled={locLoad}>
                {locLoad
                  ? <ActivityIndicator color="#d4430a" size="small" />
                  : <Text style={S.outBtnTxt}>  Pin My Location</Text>
                }
              </TouchableOpacity>
            )}
          </View>

          {/* Severity */}
          <View style={S.card}>
            <Text style={S.fieldLbl}>How bad is it?</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              {SEVERITIES.map(sv => (
                <TouchableOpacity key={sv}
                  style={[S.sevChip, severity === sv && { backgroundColor: SEV_COLOR[sv], borderColor: SEV_COLOR[sv] }]}
                  onPress={() => setSev(sv)}>
                  <Text style={{ fontSize: 16 }}>{SEV_EMOJI[sv]}</Text>
                  <Text style={[S.sevChipTxt, severity === sv && { color: '#fff' }]}>
                    {SEV_LABEL[sv]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={S.card}>
            <Text style={S.fieldLbl}>Describe it</Text>
            <TextInput
              style={[S.textArea, { marginTop: 10 }]}
              multiline numberOfLines={3}
              placeholder="e.g. Large pothole near main gate, half the lane is damaged..."
              placeholderTextColor={theme.text3}
              value={desc} onChangeText={setDesc} textAlignVertical="top"
            />
          </View>

          {/* Photo */}
          <View style={S.card}>
            <Text style={S.fieldLbl}>Add a photo (optional)</Text>
            {photo ? (
              <View style={{ marginTop: 10 }}>
                <Image source={{ uri: photo.uri }} style={{ width: '100%', height: 180, borderRadius: 10 }} resizeMode="cover" />
                <TouchableOpacity onPress={() => setPhoto(null)} style={{ alignSelf: 'flex-end', marginTop: 8 }}>
                  <Text style={{ color: '#dc2626', fontWeight: '700' }}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <TouchableOpacity style={[S.outBtn, { flex: 1 }]} onPress={takePhoto}>
                  <Text style={S.outBtnTxt}>  Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[S.outBtn, { flex: 1 }]} onPress={pickPhoto}>
                  <Text style={S.outBtnTxt}>  Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[S.primaryBtn, (!manualPos || !desc.trim() || submitting) && { opacity: 0.4 }]}
            onPress={submitManual}
            disabled={!manualPos || !desc.trim() || submitting}
          >
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={S.primaryBtnTxt}>Submit Report</Text>}
          </TouchableOpacity>
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      <BottomNav />
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    // Header (safe area)
    header:       { backgroundColor: theme.card, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
    headerTitle:  { fontSize: 20, fontWeight: '900', color: theme.text, marginBottom: 10 },
    tabPill:      { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border },
    tabPillActive:{ backgroundColor: '#d4430a', borderColor: '#d4430a' },
    tabPillTxt:   { fontSize: 13, fontWeight: '600', color: theme.text3 },
    tabPillTxtActive:{ color: '#fff', fontWeight: '800' },
    // Content
    scroll:       { padding: 16, paddingBottom: 48 },
    card:         { backgroundColor: theme.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: theme.border },
    sectionHead:  { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
    fieldLbl:     { fontSize: 14, fontWeight: '800', color: theme.text },
    // Live UI
    liveDot:      { width: 12, height: 12, borderRadius: 6, backgroundColor: '#16a34a' },
    statPill:     { flex: 1, backgroundColor: theme.bg, borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.border },
    statVal:      { fontSize: 20, fontWeight: '900', color: theme.text },
    statLbl:      { fontSize: 10, color: theme.text3, marginTop: 2, fontWeight: '600', textAlign: 'center' },
    // Buttons
    primaryBtn:   { backgroundColor: '#d4430a', borderRadius: 14, paddingVertical: 15, alignItems: 'center', shadowColor: '#d4430a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
    primaryBtnTxt:{ color: '#fff', fontWeight: '900', fontSize: 16 },
    outBtn:       { borderWidth: 1.5, borderColor: '#d4430a', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    outBtnTxt:    { color: '#d4430a', fontWeight: '800', fontSize: 13 },
    // Form
    textArea:     { backgroundColor: theme.bg, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: theme.border, color: theme.text, fontSize: 14, minHeight: 90 },
    sevChip:      { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: theme.border, backgroundColor: theme.card },
    sevChipTxt:   { fontSize: 10, fontWeight: '800', color: theme.text2, textAlign: 'center' },
    locBox:       { flex: 1, backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#86efac' },
    errTxt:       { color: '#dc2626', fontSize: 13, marginTop: 8 },
  });
}
