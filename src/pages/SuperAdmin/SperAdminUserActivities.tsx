import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchActivityFeed,
  fetchOnlineUsers,
} from "../../store/slices/adminSlice";
import {  
  Activity, 
  Clock, 
  Monitor, 
  Mail, 
  Globe, 
  RefreshCcw,
  Zap
} from "lucide-react";

const SperAdminUserActivities = () => {
  const dispatch = useAppDispatch();
  const { logs, onlineUsers, loading } = useAppSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchActivityFeed());
    dispatch(fetchOnlineUsers());
    const interval = setInterval(() => dispatch(fetchOnlineUsers()), 15000);
    return () => clearInterval(interval);
  }, [dispatch]);

  if (loading && !logs.length) return <LoadingState />;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-12 bg-[#F8F9FA] min-h-screen">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-end border-b border-gray-200 pb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#1E3A2B] mb-2">System Surveillance</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C69214]">Real-time Network Intelligence</p>
        </div>
        <button 
          onClick={() => { dispatch(fetchActivityFeed()); dispatch(fetchOnlineUsers()); }}
          className="p-3 rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-[#1E3A2B] hover:border-[#1E3A2B] transition-all"
        >
          <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        
        {/* ================= ONLINE USERS (LEFT SIDE) ================= */}
        <section className="xl:col-span-7 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xs font-black uppercase tracking-widest text-[#1E3A2B]">Live Sessions ({onlineUsers.length})</h2>
          </div>

          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            {onlineUsers.length === 0 ? (
              <div className="py-20 text-center text-gray-400 uppercase text-[10px] font-black tracking-widest">No Active Sessions</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Identity</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Access Level</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Metadata</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {onlineUsers.map((user) => (
                      <tr key={user.sessionKey} className="group hover:bg-[#F8F9FA] transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                              {user.email.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#1E3A2B]">{user.email}</p>
                              <p className="text-[10px] text-gray-400 flex items-center gap-1">
                                <Clock size={10} /> {new Date(user.loginAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${
                            user.role === 'admin' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                              <Globe size={10} className="text-[#C69214]" /> {user.ip}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 max-w-[180px] truncate">
                              <Monitor size={10} /> {user.userAgent}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* ================= ACTIVITY LOGS (RIGHT SIDE) ================= */}
        <section className="xl:col-span-5 space-y-6">
          <div className="flex items-center gap-3 px-2">
            <Activity size={16} className="text-[#C69214]" />
            <h2 className="text-xs font-black uppercase tracking-widest text-[#1E3A2B]">Historical Logs</h2>
          </div>

          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
            {logs.length === 0 ? (
              <p className="text-center py-10 text-gray-400 text-xs">Clear history</p>
            ) : (
              logs.map((log, index) => (
                <div 
                  key={index} 
                  className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:border-[#C69214]/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-[#1E3A2B] group-hover:text-white transition-colors">
                        <Zap size={14} />
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-tight text-[#1E3A2B]">
                        {log.type || log.action || "SYSTEM_EVENT"}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-gray-400">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ""}
                    </span>
                  </div>

                  {log.email && (
                    <div className="flex items-center gap-2 mb-2 text-xs font-medium text-gray-600">
                      <Mail size={12} className="text-gray-300" />
                      {log.email}
                      <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 rounded uppercase font-bold text-gray-400">
                        {log.role}
                      </span>
                    </div>
                  )}

                  {log.durationMinutes !== undefined && (
                    <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-lg">
                      <Clock size={10} /> Active for {log.durationMinutes} mins
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

/* --- SUB-COMPONENTS --- */
const LoadingState = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
    <div className="w-12 h-12 border-4 border-[#C69214] border-t-transparent rounded-full animate-spin mb-4" />
    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Decrypting Logs</p>
  </div>
);

export default SperAdminUserActivities;