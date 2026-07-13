/**
 * apiService.js — Cortexium XR API & WebSocket service
 */
import React from 'react';

const BASE = '/api';

// ─────────────────────────────────────────────
// HTTP API
// ─────────────────────────────────────────────
export const api = {
  fetchDashboardData: async () => {
    const res = await fetch(`${BASE}/dashboard`);
    if (!res.ok) throw new Error(`Dashboard fetch failed: ${res.status}`);
    return res.json();
  },
  startCamera:   () => fetch(`${BASE}/camera/start`, { method: 'POST' }).then(r => r.json()),
  stopCamera:    () => fetch(`${BASE}/camera/stop`,  { method: 'POST' }).then(r => r.json()),
  setMode: (mode) => fetch(`${BASE}/mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  }).then(r => r.json()),
  retrainModel:  () => fetch(`${BASE}/retrain`, { method: 'POST' }).then(r => r.json()),
  resetLearning: () => fetch(`${BASE}/reset`,   { method: 'POST' }).then(r => r.json()),
  exportDataset: () => window.open(`${BASE}/export/dataset`, '_blank'),
  downloadMetrics: () => window.open(`${BASE}/metrics`, '_blank'),
};

// ─────────────────────────────────────────────
// WebSocket hook
// ─────────────────────────────────────────────
const DEFAULT_STATE = {
  objects:        [],
  events:         [],
  misplacedObject: null,
  mode:           'predict',
  cameraActive:   false,
  modelStatus:    'Ready',
  stats: {
    totalObjects: 0, totalSurfaces: 0, correctlyPlaced: 0,
    misplaced: 0, fps: 0, inferenceTime: 0, avgConfidence: 0,
  },
  // These come from the backend snapshot (added below in server.py)
  learningData: null,
  metrics:      null,
};

export function useLiveStream() {
  const [data, setData]      = React.useState(DEFAULT_STATE);
  const [connected, setConn] = React.useState(false);
  const wsRef   = React.useRef(null);
  const retryRef = React.useRef(null);

  const connect = React.useCallback(() => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConn(true);
      clearTimeout(retryRef.current);
    };

    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        setData({
          objects:         d.objects         ?? [],
          events:          d.events          ?? [],
          misplacedObject: d.misplacedObject ?? null,
          mode:            d.mode            ?? 'predict',
          cameraActive:    d.cameraActive    ?? false,
          modelStatus:     d.modelStatus     ?? 'Ready',
          stats:           d.stats           ?? DEFAULT_STATE.stats,
          learningData:    d.learningData    ?? null,
          metrics:         d.metrics         ?? null,
        });
      } catch { /* ignore */ }
    };

    ws.onclose = () => {
      setConn(false);
      retryRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, []);

  React.useEffect(() => {
    connect();
    return () => {
      clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { ...data, connected };
}
