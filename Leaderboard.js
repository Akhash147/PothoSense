import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import API from '../utils/api';
import Navbar from '../components/Navbar';

const BADGE_COLORS = {
  newcomer:       { bg: '#e8f5e9', color: '#2e7d32', emoji: '🌱' },
  first_reporter: { bg: '#e3f2fd', color: '#1565c0', emoji: '📍' },
  active_citizen: { bg: '#fff8e1', color: '#f57f17', emoji: '⭐' },
  road_hero:      { bg: '#fce4ec', color: '#c62828', emoji: '🦸' },
  legend:         { bg: '#ede7f6', color: '#4527a0', emoji: '🏆' },
};

export default function Leaderboard() {
  const { citizenToken } = useApp();
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('leaderboard');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const lbRes = await API.get('/analytics/leaderboard');
      setLeaderboard(Array.isArray(lbRes.data) ? lbRes.data : (lbRes.data.leaderboard || []));

      if (citizenToken) {
        const statsRes = await API.get('/analytics/my-stats');
        setMyStats(statsRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const RankBadge = ({ rank }) => {
    if (rank === 1) return <span style={{ fontSize: '1.5rem' }}>🥇</span>;
    if (rank === 2) return <span style={{ fontSize: '1.5rem' }}>🥈</span>;
    if (rank === 3) return <span style={{ fontSize: '1.5rem' }}>🥉</span>;
    return <span style={{ fontWeight: 800, color: 'var(--text3)', fontSize: '1rem' }}>#{rank}</span>;
  };

  return (
    <>
      <Navbar mode="citizen" />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px' }}>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🏆</div>
          <h1 style={{ color: 'var(--text)', margin: 0 }}>Community Leaderboard</h1>
          <p style={{ color: 'var(--text3)', marginTop: 4 }}>Top citizens making roads safer</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--bg3)', borderRadius: 10, padding: 4 }}>
          {[['leaderboard', '🏅 Leaderboard'], ['my-stats', '📊 My Stats']].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.9rem',
              background: tab === k ? 'var(--primary)' : 'transparent',
              color: tab === k ? '#fff' : 'var(--text2)',
            }}>{label}</button>
          ))}
        </div>

        {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Loading...</div>}

        {/* LEADERBOARD TAB */}
        {!loading && tab === 'leaderboard' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {leaderboard.map((citizen, i) => {
              const badge = BADGE_COLORS[citizen.badge] || BADGE_COLORS.newcomer;
              return (
                <div key={citizen.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px',
                  borderBottom: i < leaderboard.length - 1 ? '1px solid var(--border)' : 'none',
                  background: i < 3 ? `${badge.bg}40` : 'transparent',
                }}>
                  <div style={{ width: 36, textAlign: 'center' }}>
                    <RankBadge rank={citizen.rank} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '0.95rem' }}>
                      {citizen.display_name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: 2 }}>
                      {citizen.total_reports} reports · {citizen.resolved_count} resolved
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                      background: badge.bg, color: badge.color, fontSize: '0.75rem', fontWeight: 700,
                      marginBottom: 4,
                    }}>
                      {badge.emoji} {citizen.badge_meta?.label}
                    </div>
                    <div style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.1rem' }}>
                      {citizen.points} pts
                    </div>
                  </div>
                </div>
              );
            })}
            {leaderboard.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>
                No data yet. Be the first to report!
              </div>
            )}
          </div>
        )}

        {/* MY STATS TAB */}
        {!loading && tab === 'my-stats' && (
          <>
            {!citizenToken ? (
              <div className="card" style={{ textAlign: 'center', padding: 32 }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔒</div>
                <p style={{ color: 'var(--text3)' }}>Login to see your stats</p>
                <button onClick={() => navigate('/login')} className="btn btn-primary">Login</button>
              </div>
            ) : myStats ? (
              <>
                {/* Badge card */}
                <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: 8 }}>
                    {BADGE_COLORS[myStats.badge]?.emoji || '🌱'}
                  </div>
                  <h2 style={{ color: 'var(--text)', margin: '0 0 4px' }}>{myStats.username}</h2>
                  <div style={{
                    display: 'inline-block', padding: '5px 16px', borderRadius: 20,
                    background: BADGE_COLORS[myStats.badge]?.bg,
                    color: BADGE_COLORS[myStats.badge]?.color,
                    fontWeight: 700, marginBottom: 12,
                  }}>
                    {myStats.badge_meta?.label}
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>
                    {myStats.points} pts
                  </div>
                  <div style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>
                    Rank #{myStats.rank} in community
                  </div>
                  {myStats.next_badge && (
                    <div style={{
                      marginTop: 14, padding: '10px 16px', background: 'var(--bg3)',
                      borderRadius: 10, fontSize: '0.85rem', color: 'var(--text2)',
                    }}>
                      Next badge: <strong>{myStats.next_badge.emoji} {myStats.next_badge.label}</strong>
                      {' '}at {myStats.next_badge.minPoints} pts
                      {' '}· <strong style={{ color: 'var(--primary)' }}>
                        {myStats.next_badge.minPoints - myStats.points} pts to go
                      </strong>
                    </div>
                  )}
                </div>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Total Reports', value: myStats.stats.total, color: '#1976d2' },
                    { label: 'Resolved', value: myStats.stats.resolved, color: '#2e7d32' },
                    { label: 'In Progress', value: myStats.stats.in_progress, color: '#f57c00' },
                    { label: 'Pending', value: myStats.stats.pending, color: '#c62828' },
                  ].map(s => (
                    <div key={s.label} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: 4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Points guide */}
                <div className="card">
                  <h3 style={{ color: 'var(--text)', marginTop: 0, marginBottom: 14 }}>🎯 How to Earn Points</h3>
                  {[
                    { action: 'Manual Report', pts: '+5 pts' },
                    { action: 'Sensor Detection', pts: '+5 pts' },
                    { action: 'Your Report Resolved', pts: '+10 pts' },
                    { action: 'Verify a Repair', pts: '+2 pts' },
                  ].map(item => (
                    <div key={item.action} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '8px 0', borderBottom: '1px solid var(--border)',
                      fontSize: '0.9rem',
                    }}>
                      <span style={{ color: 'var(--text2)' }}>{item.action}</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{item.pts}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </>
  );
}
