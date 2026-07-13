import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { CameraFeed } from '../features/CameraFeed';
import { DetectedObjectsTable } from '../features/DetectedObjectsTable';
import { LearningPanel } from '../features/LearningPanel';
import { ModelMetrics } from '../features/ModelMetrics';
import { PredictionPanel } from '../features/PredictionPanel';
import { Controls } from '../features/Controls';
import { api, useLiveStream } from '../services/apiService';

export function Dashboard() {
  const [dashData, setDashData] = useState({ stats: null, learningData: null, metrics: null });
  const [loadError, setLoadError] = useState(null);

  // Live data via WebSocket
  const {
    objects,
    misplacedObject,
    mode,
    cameraActive,
    modelStatus,
    stats: liveStats,
    learningData: liveLearning,
    metrics: liveMetrics,
    connected,
  } = useLiveStream();

  // Initial fetch for metrics / learning data (fills in before WS delivers them)
  useEffect(() => {
    api.fetchDashboardData()
      .then(setDashData)
      .catch((err) => setLoadError(err.message));
  }, []);

  // Re-fetch dashboard data whenever model finishes training
  useEffect(() => {
    if (modelStatus === 'Ready') {
      api.fetchDashboardData().then(setDashData).catch(() => {});
    }
  }, [modelStatus]);

  // Prefer live data; fall back to initial HTTP fetch
  const metrics = (liveMetrics && Object.keys(liveMetrics).length) ? liveMetrics : dashData.metrics;
  const learningData = (liveLearning && liveLearning.datasetSize !== undefined) ? liveLearning : dashData.learningData;

  const handleControlAction = useCallback(async (actionId) => {
    try {
      switch (actionId) {
        case 'start_camera':    await api.startCamera(); break;
        case 'stop_camera':     await api.stopCamera();  break;
        case 'learn_mode':      await api.setMode('learn');   break;
        case 'predict_mode':    await api.setMode('predict'); break;
        case 'reset_learning':
          if (window.confirm('Reset all learned rules? This cannot be undone.')) {
            await api.resetLearning();
            api.fetchDashboardData().then(setDashData).catch(() => {});
          }
          break;
        case 'export_data': api.exportDataset(); break;
        default: break;
      }
    } catch (err) {
      console.error(`Action ${actionId} failed:`, err);
    }
  }, []);

  const headerMode     = mode === 'learn' ? 'Learn' : 'Predict';
  const cameraStatus   = (connected && cameraActive) ? 'Connected' : 'Disconnected';
  const streamUrl      = '/api/camera/stream';

  return (
    <DashboardLayout mode={headerMode} cameraStatus={cameraStatus} modelStatus={modelStatus}>
      <div className="flex flex-col gap-4 h-full">

        {/* ── Connection banner ── */}
        {!connected && (
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-orange-500/8 border border-orange-500/15 text-orange-400 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse shrink-0" />
            Backend offline — start{' '}
            <code className="font-mono bg-white/5 px-1.5 py-0.5 rounded">
              uvicorn server:app --port 8000
            </code>
          </div>
        )}

        {loadError && (
          <div className="px-4 py-2.5 rounded-xl bg-red-500/8 border border-red-500/15 text-red-400 text-xs">
            {loadError}
          </div>
        )}

        {/* ── Controls bar ── */}
        <div className="flex items-center gap-4">
          <Controls onAction={handleControlAction} mode={mode} cameraActive={cameraActive} />
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[65%_35%] 2xl:grid-cols-[65%_35%] gap-4 flex-1 min-h-0">

          {/* ════ LEFT COLUMN (65%) ════ */}
          <div className="flex flex-col gap-4 min-h-0">

            {/* 1. Camera feed — largest element */}
            <div className="flex-[3] min-h-[340px] max-h-[550px]">
              <CameraFeed
                isConnected={connected && cameraActive}
                streamUrl={streamUrl}
              />
            </div>

            {/* 2. Misplaced / prediction panel */}
            <div className="shrink-0">
              <PredictionPanel misplacedObject={misplacedObject} cameraActive={cameraActive} connected={connected}/>
            </div>

            {/* 3. Model performance — always visible */}
            <div className="flex-[2] min-h-0 overflow-auto">
              <ModelMetrics metrics={metrics} />
            </div>
          </div>

          {/* ════ RIGHT COLUMN (35%) ════ */}
          <div className="flex flex-col gap-4 min-h-0">

            {/* 1. Detected objects table */}
            <div className="flex-1 min-h-[200px]">
              <DetectedObjectsTable objects={objects} />
            </div>

            {/* 2. Adaptive learning panel */}
            <div className="shrink-0">
              <LearningPanel
                learningData={learningData}
                modelStatus={modelStatus}
              />
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
