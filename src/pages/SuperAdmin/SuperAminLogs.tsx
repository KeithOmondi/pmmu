import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchActivityFeed, 
  addNewLog,
  type Log 
} from '../../store/slices/adminSlice';
import type { AppDispatch, RootState } from '../../store/store';
import { getSocket } from '../../utils/socket';

const SuperAdminLogs: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { logs, loading } = useSelector((state: RootState) => state.admin);

  const [isPaused] = useState(false); // unused, so we can remove setIsPaused
  const logEndRef = useRef<HTMLDivElement>(null);

  // Fetch logs & subscribe to socket
  useEffect(() => {
    dispatch(fetchActivityFeed());

    const socket = getSocket();
    const handleNewLog = (log: Log) => {
      if (!isPaused) dispatch(addNewLog(log));
    };

    socket.on("new_log", handleNewLog);

    // FIX: explicitly return a void cleanup
    return () => {
      socket.off("new_log", handleNewLog);
    };
  }, [dispatch, isPaused]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!isPaused && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isPaused]);

  return (
    <div className="min-h-screen bg-[#0a0a0b] p-4 md:p-8 font-mono text-sm text-slate-300">
      <div className="max-w-6xl mx-auto bg-[#000000] border border-slate-800 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/5">
        <div className="h-[65vh] overflow-y-auto p-4 space-y-1 selection:bg-emerald-500/30">
          {loading && (!logs || logs.length === 0) ? (
            <div className="flex items-center justify-center h-full space-x-2">
              <span className="text-slate-500 ml-2 italic">Syncing with Redis...</span>
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-700">
              <p className="text-lg font-semibold italic">Log stream is currently empty</p>
            </div>
          ) : (
            <>
              {logs.map((log: Log, index: number) => (
                <div 
                  key={index} 
                  className="group flex gap-4 py-0.5 px-2 hover:bg-white/[0.03] rounded border-l-2 border-transparent hover:border-emerald-500/50 transition-all"
                >
                  <span className="text-slate-600 shrink-0 select-none w-20">
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { 
                      hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' 
                    }) : '--:--:--'}
                  </span>
                  
                  <span className={`font-bold shrink-0 w-12 text-center rounded text-[10px] py-0.5 ${getLogLevelStyle(log.level)}`}>
                    {(log.level || 'INFO').toUpperCase()}
                  </span>

                  <span className="text-slate-300 break-all leading-relaxed">
                    <span className="text-slate-500 mr-1">›</span>
                    {log.message || 'Empty log message'}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const getLogLevelStyle = (level?: string) => {
  const lvl = (level || 'info').toLowerCase();
  switch (lvl) {
    case 'error':
    case 'fatal':
      return 'bg-red-500/10 text-red-500 border border-red-500/20';
    case 'warn':
    case 'warning':
      return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
    case 'info':
      return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    case 'success':
      return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    default:
      return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
  }
};

export default SuperAdminLogs;
