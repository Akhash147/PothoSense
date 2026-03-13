import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import API from '../utils/api';
import Navbar from '../components/Navbar';

export default function VerifyRepairs() {
  const { citizenToken } = useApp();
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!citizenToken) { navigate('/login'); return; }
    fetchPending();
  }, [citizenToken]);

  const fetchPending = async () => {
    try {
      const res = await API.get('/analytics/pending-verifications');
      setPending(res.data.pending);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const handleVerify = async (reportId, isSatisfied, comment = '') => {
    setSubmitting(reportId); setMessage('');
    try {
      const res = await API.post(`/analytics/verify/${reportId}`, {
        is_satisfied: isSatisfied, comment,
      });
      setMessage(res.data.message);
      setPending(prev => prev.filter(r => r.id !== reportId));
    } catch (err) {
      setMessage(err.response?.data?.error || 'Verification failed');
    } finally { setSubmitting(null); }
  };

  const SEVERITY_COLOR = { severe: '#d32f2f', moderate: '#f57c00', minor: '#f9a825' };

  return (
    <>
      <Navbar mode="citizen" />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px' }}>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>✅</div>
          <h1 style={{ color: 'var(--text)', margin: 0 }}>Verify Repairs</h1>
          <p style={{ color: 'var(--text3)', marginTop: 4 }}>
            Check if your reported potholes were properly fixed
          </p>
        </div>

        {message && (
          <div className={`alert ${message.includes('flagged') ? 'alert-warning' : 'alert-success'}`}
            style={{ marginBottom: 16 }}>
            {message}
          </div>
        )}

        {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--text3)' }}>Loading...</div>}

        {!loading && pending.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎉</div>
            <h3 style={{ color: 'var(--text)', margin: '0 0 8px' }}>All caught up!</h3>
            <p style={{ color: 'var(--text3)', margin: 0 }}>
              No repairs to verify right now. Check back when more of your reports are resolved.
            </p>
          </div>
        )}

        {pending.map(report => (
          <VerifyCard
            key={report.id}
            report={report}
            severityColor={SEVERITY_COLOR[report.severity]}
            onVerify={handleVerify}
            isSubmitting={submitting === report.id}
          />
        ))}

        <div className="card" style={{ marginTop: 16, padding: '14px 18px' }}>
          <h4 style={{ color: 'var(--text)', margin: '0 0 10px' }}>ℹ️ How Verification Works</h4>
          <div style={{ fontSize: '0.85rem', color: 'var(--text2)', lineHeight: 1.6 }}>
            Your vote matters. If more than 50% of verifiers say a repair is unsatisfactory
            (with at least 3 votes), the pothole is automatically reopened for re-repair.
            You earn <strong style={{ color: 'var(--primary)' }}>+2 points</strong> for each verification.
          </div>
        </div>
      </div>
    </>
  );
}

function VerifyCard({ report, severityColor, onVerify, isSubmitting }) {
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);

  const resolvedDate = report.resolved_at
    ? new Date(report.resolved_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: 4 }}>
            Token: <strong>{report.tracking_token}</strong> · Resolved {resolvedDate}
          </div>
          <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.95rem' }}>
            📍 {report.address || `${parseFloat(report.latitude).toFixed(4)}, ${parseFloat(report.longitude).toFixed(4)}`}
          </div>
        </div>
        <div style={{
          padding: '4px 10px', borderRadius: 16,
          background: `${severityColor}20`, color: severityColor,
          fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', flexShrink: 0, marginLeft: 10,
        }}>
          {report.severity}
        </div>
      </div>

      {/* After photo */}
      {report.after_photo && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginBottom: 6 }}>After repair photo:</div>
          <img
            src={`http://localhost:5000/uploads/${report.after_photo}`}
            alt="After repair"
            style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8 }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>
      )}

      {/* Optional comment */}
      {showComment && (
        <div className="form-group" style={{ marginBottom: 12 }}>
          <textarea className="form-input" rows={2} value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Add a comment (optional)..."
            style={{ resize: 'vertical', minHeight: 60 }} />
        </div>
      )}

      <div style={{ fontSize: '0.82rem', color: 'var(--text3)', marginBottom: 12 }}>
        Was this pothole properly fixed?{' '}
        <span onClick={() => setShowComment(!showComment)}
          style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}>
          {showComment ? 'Hide comment' : 'Add comment'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => onVerify(report.id, true, comment)}
          disabled={isSubmitting}
          className="btn btn-primary"
          style={{ flex: 1, background: '#2e7d32', borderColor: '#2e7d32' }}>
          {isSubmitting ? <span className="spinner" /> : '👍 Yes, Fixed!'}
        </button>
        <button
          onClick={() => onVerify(report.id, false, comment)}
          disabled={isSubmitting}
          className="btn"
          style={{
            flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)',
            color: '#c62828', fontWeight: 700,
          }}>
          👎 Not Fixed
        </button>
      </div>
    </div>
  );
}
