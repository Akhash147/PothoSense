import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import API from '../utils/api';
import Navbar from '../components/Navbar';

const SEVERITY_COLOR = { severe: '#d32f2f', moderate: '#f57c00', minor: '#fbc02d' };

export default function RouteSafety() {
  const [startAddr, setStartAddr] = useState('');
  const [endAddr, setEndAddr]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [error, setError]         = useState('');

  // Simple geocode using Nominatim (free)
  const geocode = async (address) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    const data = await res.json();
    if (!data.length) throw new Error(`Could not find: "${address}"`);
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  };

  const handleCheck = async (e) => {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    try {
      const [start, end] = await Promise.all([geocode(startAddr), geocode(endAddr)]);
      const res = await API.post('/analytics/route-safety', {
        waypoints: [start, end],
      });
      setResult({ ...res.data, start, end });
    } catch (err) {
      setError(err.message || 'Failed to check route');
    } finally { setLoading(false); }
  };

  const riskColors = {
    safe:      { bg: '#e8f5e9', color: '#2e7d32', text: 'Route is Safe ✅' },
    moderate:  { bg: '#fff8e1', color: '#f57f17', text: 'Moderate Risk ⚠️' },
    dangerous: { bg: '#ffebee', color: '#c62828', text: 'High Risk 🚨' },
  };

  return (
    <>
      <Navbar mode="citizen" />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 16px' }}>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🛣️</div>
          <h1 style={{ color: 'var(--text)', margin: 0 }}>Route Safety Checker</h1>
          <p style={{ color: 'var(--text3)', marginTop: 4 }}>
            Check your route for potholes before you travel
          </p>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <form onSubmit={handleCheck}>
            <div className="form-group">
              <label className="form-label">📍 Starting Point</label>
              <input type="text" className="form-input" value={startAddr}
                onChange={e => setStartAddr(e.target.value)}
                placeholder="e.g. Anna Nagar, Chennai" required />
            </div>
            <div className="form-group">
              <label className="form-label">🏁 Destination</label>
              <input type="text" className="form-input" value={endAddr}
                onChange={e => setEndAddr(e.target.value)}
                placeholder="e.g. T. Nagar, Chennai" required />
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? <span className="spinner" /> : '🔍 Check Route Safety'}
            </button>
          </form>
        </div>

        {result && (
          <>
            {/* Score card */}
            <div className="card" style={{ marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: riskColors[result.risk_level]?.color,
                background: riskColors[result.risk_level]?.bg, borderRadius: 12, padding: '14px 20px', marginBottom: 14 }}>
                {riskColors[result.risk_level]?.text}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 32 }}>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)' }}>
                    {result.safety_score}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>Safety Score / 100</div>
                </div>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#d32f2f' }}>
                    {result.pothole_count}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>Potholes Detected</div>
                </div>
              </div>
              <div style={{ marginTop: 14, padding: '10px 16px', background: 'var(--bg3)',
                borderRadius: 10, fontSize: '0.9rem', color: 'var(--text2)' }}>
                💡 {result.recommendation}
              </div>
            </div>

            {/* Map */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 12 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, color: 'var(--text)' }}>
                🗺️ Route Map
              </div>
              <MapContainer
                center={[
                  (result.start.lat + result.end.lat) / 2,
                  (result.start.lng + result.end.lng) / 2,
                ]}
                zoom={13}
                style={{ height: 380, width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                {/* Route line */}
                <Polyline
                  positions={[[result.start.lat, result.start.lng], [result.end.lat, result.end.lng]]}
                  color="#1976d2" weight={4} opacity={0.7} dashArray="8 6"
                />

                {/* Start marker */}
                <CircleMarker center={[result.start.lat, result.start.lng]}
                  radius={10} fillColor="#2e7d32" color="#fff" weight={3} fillOpacity={1}>
                  <Popup><strong>Start</strong><br />{startAddr}</Popup>
                </CircleMarker>

                {/* End marker */}
                <CircleMarker center={[result.end.lat, result.end.lng]}
                  radius={10} fillColor="#1976d2" color="#fff" weight={3} fillOpacity={1}>
                  <Popup><strong>Destination</strong><br />{endAddr}</Popup>
                </CircleMarker>

                {/* Pothole markers */}
                {result.potholes_on_route.map((p, i) => (
                  <CircleMarker key={i}
                    center={[parseFloat(p.latitude), parseFloat(p.longitude)]}
                    radius={8} fillColor={SEVERITY_COLOR[p.severity]} color="#fff"
                    weight={2} fillOpacity={0.9}>
                    <Popup>
                      <strong style={{ color: SEVERITY_COLOR[p.severity] }}>
                        {p.severity.toUpperCase()} Pothole
                      </strong>
                      <br />{p.address || 'Unknown location'}
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>

              {/* Legend */}
              <div style={{ padding: '12px 16px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {Object.entries(SEVERITY_COLOR).map(([sev, color]) => (
                  <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
                    <span style={{ color: 'var(--text3)', textTransform: 'capitalize' }}>{sev}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                  <div style={{ width: 20, height: 3, background: '#1976d2', borderRadius: 2 }} />
                  <span style={{ color: 'var(--text3)' }}>Your Route</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
