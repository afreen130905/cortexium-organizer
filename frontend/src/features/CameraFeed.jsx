import React, { useRef, useCallback } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Maximize2, Minimize2, VideoOff } from 'lucide-react';

export function CameraFeed({ streamUrl, isConnected }) {
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  React.useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  return (
    <GlassCard className="flex flex-col h-full min-h-[360px]" accent="#22c55e">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={isConnected ? 'dot-live' : 'dot-error'} />
          <span className="text-sm font-medium text-slate-200">Live Spatial Feed</span>
          {isConnected && (
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">LIVE</span>
          )}
        </div>
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg bg-white/4 hover:bg-white/8 border border-white/8 text-slate-400 hover:text-white transition-all"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Stream */}
      <div
        ref={containerRef}
        className="relative flex-1 bg-black/40 rounded-xl overflow-hidden flex items-center justify-center"
        style={{ minHeight: 0 }}
      >
        {isConnected ? (
          <img
            src={streamUrl}
            alt="Live YOLO annotated feed"
            className="w-full h-full object-contain"
            style={{ display: 'block' }}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-600">
            <VideoOff className="w-10 h-10 opacity-40" />
            <p className="text-sm">Camera not connected</p>
            <p className="text-xs text-slate-700">Click Start Camera to begin</p>
          </div>
        )}

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Corner brackets */}
        {isConnected && (
          <>
            <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-green-500/40 rounded-tl" />
            <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-green-500/40 rounded-tr" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-green-500/40 rounded-bl" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-green-500/40 rounded-br" />
          </>
        )}
      </div>
    </GlassCard>
  );
}
