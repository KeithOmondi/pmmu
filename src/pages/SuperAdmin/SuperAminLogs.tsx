import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchActivityFeed, 
  clearActivityFeedAction, 
  addNewLog 
} from '../../store/slices/adminSlice';
import { Trash2, Terminal, Pause, Play, ShieldAlert, Activity } from 'lucide-react';
import type { AppDispatch, RootState } from '../../store/store';
import { getSocket } from '../../utils/socket';

const SuperAdminLogs: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { logs, loading } = useSelector((state: RootState) => state.admin);
  
  const [isPaused, setIsPaused] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Initial Fetch of the last 100 logs from Redis
    dispatch(fetchActivityFeed());

    // 2. Initialize Socket and Listen
    const socket = getSocket();

    const handleNewLog = (log: any) => {
      // If the admin has paused the feed, we don't update the UI state
      if (!isPaused) {
        dispatch(addNewLog(log));
      }
    };

    socket.on("new_log", handleNewLog);

    // 3. Cleanup listener on unmount
    return () => {
      socket.off("new_log", handleNewLog);
    };
  }, [dispatch, isPaused]);

  // 4. Auto-scroll to bottom when logs array updates (unless paused)
  useEffect(() => {
    if (!isPaused && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isPaused]);

  const handleClear = () => {
    if (window.confirm("This will permanently delete the log history from Redis. Continue?")) {
      dispatch(clearActivityFeedAction());
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] p-4 md:p-8 font-mono text-sm text-slate-300">
      {/* Header Section */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-lg">
            <Activity className="text-emerald-400" size={24} />
          </div>
          <div>
            <h1 className="text-white text-2xl font-bold flex items-center gap-2">
              System Live Feed
            </h1>
            <p className="text-slate-500 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              User logs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition border ${
              isPaused 
                ? "bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20" 
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
            }`}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
            {isPaused ? "Resume Feed" : "Pause Feed"}
          </button>

          <button
            onClick={handleClear}
            className="flex items-center gap-2 bg-red-500/10 text-red-500 border border-red-500/30 px-4 py-2 rounded-md hover:bg-red-500 hover:text-white transition"
          >
            <Trash2 size={16} />
            Clear Logs
          </button>
        </div>
      </div>

      {/* Terminal UI Container */}
      <div className="max-w-6xl mx-auto bg-[#000000] border border-slate-800 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/5">
        {/* Terminal Header/Title Bar */}
        <div className="bg-slate-900/50 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
            <span className="text-slate-500 text-xs flex items-center gap-2 px-3 py-1 bg-black/30 rounded-full border border-white/5">
              <Terminal size={12} />
              system_logs --tail 100
            </span>
          </div>
          <span className="text-[10px] text-slate-600 uppercase tracking-widest font-sans">
            Buffer: {logs.length} / 100
          </span>
        </div>

        {/* Log Stream Content */}
        <div className="h-[65vh] overflow-y-auto p-4 space-y-1 selection:bg-emerald-500/30">
          {loading && logs.length === 0 ? (
            <div className="flex items-center justify-center h-full space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
              <span className="text-slate-500 ml-2 italic">Syncing with Redis...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-700">
              <ShieldAlert size={40} className="mb-3 opacity-20" />
              <p className="text-lg font-semibold italic">Log stream is currently empty</p>
              <p className="text-sm">Waiting for system events...</p>
            </div>
          ) : (
            <>
              {logs.map((log, index) => (
                <div 
                  key={index} 
                  className="group flex gap-4 py-0.5 px-2 hover:bg-white/[0.03] rounded border-l-2 border-transparent hover:border-emerald-500/50 transition-all"
                >
                  <span className="text-slate-600 shrink-0 select-none w-20">
                    {new Date(log.timestamp).toLocaleTimeString([], { 
                      hour12: false, 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      second: '2-digit' 
                    })}
                  </span>
                  <span className={`font-bold shrink-0 w-12 text-center rounded text-[10px] py-0.5 ${getLogLevelStyle(log.level)}`}>
                    {log.level.toUpperCase()}
                  </span>
                  <span className="text-slate-300 break-all leading-relaxed">
                    <span className="text-slate-500 mr-1">›</span>
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </>
          )}
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="max-w-6xl mx-auto mt-4 px-2 flex justify-between text-[10px] text-slate-600 uppercase tracking-[0.2em] font-sans">
        <div className="flex gap-4">
          <span>Status: <span className="text-emerald-500">Live</span></span>
          <span>Role: <span className="text-amber-500">SuperAdmin</span></span>
        </div>
        <span>Last updated: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

/**
 * Maps log levels to specific Tailwind CSS classes for the terminal UI
 */
const getLogLevelStyle = (level: string) => {
  const lvl = level.toLowerCase();
  if (lvl === 'error' || lvl === 'fatal') return 'bg-red-500/10 text-red-500 border border-red-500/20';
  if (lvl === 'warn' || lvl === 'warning') return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
  if (lvl === 'info') return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  if (lvl === 'success') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
};

export default SuperAdminLogs;