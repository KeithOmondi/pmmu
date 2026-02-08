import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  selectAllIndicators,
  selectIndicatorsLoading,
} from "../../store/slices/indicatorsSlice";
import {
  fetchUsers,
  selectAllUsers,
} from "../../store/slices/userSlice";
import {
  Loader2,
  History,
  User as UserIcon,
  Search,
  Filter,
  Clock,
  FileText,
  MessageSquare,
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const AdminRejectionsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const indicators = useAppSelector(selectAllIndicators);
  const loading = useAppSelector(selectIndicatorsLoading);
  const users = useAppSelector(selectAllUsers);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | "all">("all");

  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
    dispatch(fetchUsers());
  }, [dispatch]);

  // 1. Sidebar Sorting: Users A-Z
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  // 2. Logic: Group and Sort Indicators A-Z
  const rejectedIndicators = useMemo(() => {
    return indicators
      .filter(ind => (ind.evidence || []).some(e => e.isArchived) || ind.rejectionCount > 0)
      .map(ind => {
        // Sort archived files A-Z by name
        const archivedFiles = (ind.evidence || [])
          .filter(e => e.isArchived)
          .sort((a, b) => a.fileName.localeCompare(b.fileName));

        return {
          ...ind,
          archivedFiles,
          latestReason: ind.notes?.[ind.notes.length - 1]?.text || "Refer to audit notes",
          lastRejectedAt: ind.updatedAt
        };
      })
      // Arrangement A-Z by Title
      .sort((a, b) => a.indicatorTitle.localeCompare(b.indicatorTitle));
  }, [indicators]);

  // 3. Filter by Search and User
  const filteredData = useMemo(() => {
    return rejectedIndicators.filter(ind => {
      const matchesSearch = ind.indicatorTitle.toLowerCase().includes(searchTerm.toLowerCase());
      if (selectedUserId === "all") return matchesSearch;
      
      return (ind.assignedTo === selectedUserId || ind.assignedGroup?.includes(selectedUserId)) && matchesSearch;
    });
  }, [rejectedIndicators, searchTerm, selectedUserId]);

  if (loading) return <LoadingState />;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8F9FA]">
      {/* SIDEBAR: Custodian Filter (A-Z) */}
      <aside className="w-full lg:w-80 bg-white border-r border-gray-100 p-6 lg:h-screen lg:sticky lg:top-0">
        <div className="mb-8">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c2a336] mb-4">Rejection Registry</h2>
          <button
            onClick={() => setSelectedUserId("all")}
            className={`w-full flex justify-between items-center p-4 rounded-2xl transition-all ${selectedUserId === "all" ? "bg-[#1a3a32] text-white shadow-lg" : "hover:bg-gray-50 text-gray-600"}`}
          >
            <div className="flex items-center gap-3">
              <Filter size={16} />
              <span className="text-xs font-bold">All Records</span>
            </div>
          </button>
        </div>

        <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-4 mb-2">Custodians A-Z</p>
          {sortedUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => setSelectedUserId(user._id)}
              className={`w-full flex items-center p-3 rounded-xl transition-all ${selectedUserId === user._id ? "bg-rose-50 text-rose-700 border border-rose-100" : "hover:bg-gray-50 text-gray-500"}`}
            >
              <UserIcon size={14} className="mr-3" />
              <span className="text-[11px] font-bold truncate">{user.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 lg:p-12 max-w-5xl mx-auto w-full">
        <header className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <History className="text-[#c2a336]" size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#c2a336]">Audit History</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#1a3a32] mb-6">Resubmission Logs</h1>
          
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input
              type="text"
              placeholder="Search indicators with revision history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm outline-none text-sm focus:ring-2 focus:ring-[#c2a336]/20 transition-all"
            />
          </div>
        </header>

        {filteredData.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {filteredData.map((ind) => (
              <div key={ind._id} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden hover:shadow-xl transition-all">
                {/* Indicator Header */}
                <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                  <div className="flex justify-between items-start mb-4">
                    <div className="px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                      Resubmissions: {ind.rejectionCount}
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-[10px] font-bold uppercase">
                      <Clock size={12} /> Last Rejected: {format(new Date(ind.lastRejectedAt), "MMM dd, yyyy • hh:mm a")}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-[#1a3a32] leading-tight mb-2">{ind.indicatorTitle}</h3>
                </div>

                {/* Content Body */}
                <div className="p-8 grid md:grid-cols-2 gap-8">
                  {/* Left: Archived Files (A-Z) */}
                  <div>
                    <h4 className="text-[9px] font-black uppercase text-gray-400 mb-4 tracking-widest">Superseded Evidence ({ind.archivedFiles.length})</h4>
                    <div className="space-y-2">
                      {ind.archivedFiles.map((file, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <FileText size={16} className="text-gray-400" />
                          <span className="text-xs font-medium text-gray-600 truncate">{file.fileName}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Rejection Context */}
                  <div className="flex flex-col justify-between">
                    <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100/50">
                      <p className="text-[9px] font-black uppercase text-rose-600 mb-2 flex items-center gap-2">
                        <MessageSquare size={12} /> Last Rejection Reason
                      </p>
                      <p className="text-sm text-[#1a3a32] italic leading-relaxed">"{ind.latestReason}"</p>
                    </div>

                    <button
                      onClick={() => navigate(`/admin/indicators/${ind._id}`)}
                      className="mt-6 flex items-center justify-center gap-2 w-full py-4 bg-[#1a3a32] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#c2a336] transition-all"
                    >
                      View Current Submission <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

/* --- Helpers --- */

const LoadingState = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
    <Loader2 className="w-8 h-8 animate-spin text-[#c2a336] mb-4" />
    <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">Synchronizing Audit Logs...</p>
  </div>
);

const EmptyState = () => (
  <div className="py-24 text-center">
    <AlertCircle size={48} className="text-gray-200 mx-auto mb-4" />
    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">No revision history found</h3>
  </div>
);

export default AdminRejectionsPage;