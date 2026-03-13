import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import API from '../utils/api';
import Navbar from '../components/Navbar';

const SEV_COLOR = { severe: '#d32f2f', moderate: '#f57c00', minor: '#fbc02d' };
const SEV_RADIUS = { severe: 14, moderate: 10, minor: 7 };

export default function PotholeMap() {
  const [potholes, setPotholes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [stats, setStats]       = useState({ severe: 0, moderate: 0, minor: 0, total: 0 });

  useEffect(() => { fetchPotholes(); }, []);

  const fetchPotholes = async () => {
    try {
      const res = await API.get('/analytics/map-potholes');
      const data = res.data;
      setPotholes(data);
      setStats({
        total: data.length,
        severe: data.filter(p => p.severity === 'severe').length,
        moderate: data.filter(p => p.severity === 'moderate').length,
        minor: data.filter(p => p.severity === 'minor').length,
      });
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const filtered = filter === 'all' ? potholes : potholes.filter(p => p.severity === filter);

  const statusLabel = {
    pending: { text: 'Pending', color: '#c62828' },
    assigned: { text: 'Assigned', color: '#f57c00' },
    in_progress: { text: 'In Progress', color: '#1565c0' },
    resolved: { text: 'Resolved', color: '#2e7d32' },
  };

  // Center on India (Chennai default)
  const center = potholes.length > 0
    ? [parseFloat(potholes[0].latitude), parseFloat(potholes[0].longitude)]
    : [13.0827, 80.2707];

  return (
    <>
      <Navbar mode="citizen" />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px' }}>

        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <h1 style={{ color: 'var(--text)', margin: '0 0 4px' }}>🗺️ Pothole Map</h1>
          <p style={{ color: 'var(--text3)', margin: 0 }}>Live view of reported potholes in your area</p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: stats.total, color: 'var(--primary)' },
            { label: '🔴 Severe', value: stats.severe, color: '#d32f2f' },
            { label: '🟠 Moderate', value: stats.moderate, color: '#f57c00' },
            { label: '🟡 Minor', value: stats.minor, color: '#f9a825' },
          ].map(s => (
            <div key={s.label} style={{
              flex: '1 1 80px', textAlign: 'center', padding: '10px 8px',
              background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {['all', 'severe', 'moderate', 'minor'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.82rem',
                background: filter === f ? SEV_COLOR[f] || 'var(--primary)' : 'var(--bg3)',
                color: filter === f ? '#fff' : 'var(--text2)',
              }}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && ` (${stats[f]})`}
            </button>
          ))}
          <button onClick={fetchPotholes} style={{
            marginLeft: 'auto', padding: '6px 14px', borderRadius: 20,
            border: '1px solid var(--border)', background: 'var(--bg3)',
            color: 'var(--text2)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem',
          }}>
            🔄 Refresh
          </button>
        </div>

        {/* Map */}
        <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 14 }}>
          {loading ? (
            <div style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg2)', color: 'var(--text3)' }}>
              Loading map...
            </div>
          ) : (
            <MapContainer center={center} zoom={13} style={{ height: 500, width: '100%' }} scrollWheelZoom>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© OpenStreetMap contributors' />
              {filtered.map(p => (
                <CircleMarker
                  key={p.id}
                  center={[parseFloat(p.latitude), parseFloat(p.longitude)]}
                  radius={SEV_RADIUS[p.severity] || 8}
                  fillColor={SEV_COLOR[p.severity] || '#999'}
                  color="#fff" weight={2} fillOpacity={0.85}
                >
                  <Popup>
                    <div style={{ minWidth: 180 }}>
                      <div style={{
                        fontWeight: 800, color: SEV_COLOR[p.severity],
                        textTransform: 'uppercase', fontSize: '0.8rem', marginBottom: 6,
                      }}>
                        {p.severity} Pothole
                      </div>
                      <div style={{ fontSize: '0.82rem', marginBottom: 4 }}>
                        📍 {p.address || 'Location data unavailable'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: 4 }}>
                        Status:{' '}
                        <span style={{ fontWeight: 700, color: statusLabel[p.status]?.color }}>
                          {statusLabel[p.status]?.text || p.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#999' }}>
                        Reported: {new Date(p.created_at).toLocaleDateString('en-IN')}
                      </div>
                      {p.photo_path && (
                        <img
                          src={`http://localhost:5000/uploads/${p.photo_path}`}
                          alt="Pothole"
                          style={{ width: '100%', marginTop: 8, borderRadius: 6 }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          )}
        </div>

        {/* Legend */}
        <div className="card" style={{ padding: '12px 16px' }}>
          <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 10, fontSize: '0.9rem' }}>Map Legend</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {Object.entries(SEV_COLOR).map(([sev, color]) => (
              <div key={sev} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: SEV_RADIUS[sev] * 2, height: SEV_RADIUS[sev] * 2,
                  borderRadius: '50%', background: color, border: '2px solid white',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                }} />
                <span style={{ fontSize: '0.82rem', color: 'var(--text2)', textTransform: 'capitalize' }}>
                  {sev}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
