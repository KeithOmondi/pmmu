import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchSubmittedIndicators,
  selectAllIndicators,
  selectIndicatorsLoading,
} from "../../store/slices/indicatorsSlice";
import {
  fetchUsers,
  selectAllUsers,
  selectUsersLoading,
} from "../../store/slices/userSlice";
import {
  User as UserIcon,
  Inbox,
  Clock,
  ChevronRight,
  Search,
  CheckCircle2,
  FileWarning,
  CalendarDays,
  History,
  Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const SubmittedIndicators: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const indicators = useAppSelector(selectAllIndicators);
  const indicatorsLoading = useAppSelector(selectIndicatorsLoading);
  const users = useAppSelector(selectAllUsers);
  const usersLoading = useAppSelector(selectUsersLoading);

  const [selectedUserId, setSelectedUserId] = useState<string | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchSubmittedIndicators());
    dispatch(fetchUsers());
  }, [dispatch]);

  // --- FILTER CORE LOGIC ---
  // 1. Only show items that have evidence AND are NOT approved
  const pendingAuditIndicators = useMemo(() => {
    return indicators.filter(
      (i) => i.evidence && i.evidence.length > 0 && i.status !== "approved"
    );
  }, [indicators]);

  // 2. Map users based only on the "pending audit" list
  const userSubmissionStats = useMemo(() => {
    return users
      .map((user) => {
        const userItems = pendingAuditIndicators.filter(
          (i) =>
            i.assignedTo === user._id ||
            (i.assignedToType === "group" &&
              i.assignedGroup.includes(user._id)),
        );
        return {
          ...user,
          total: userItems.length,
          pending: userItems.filter((i) => i.status === "submitted").length,
        };
      })
      .filter((u) => u.total > 0)
      .sort((a, b) => a.name.localeCompare(b.name)); 
  }, [users, pendingAuditIndicators]);

  // 3. Apply search and user selection filters
  const filteredSubmissions = useMemo(() => {
    const filtered = pendingAuditIndicators.filter((i) => {
      const matchesUser =
        selectedUserId === "all" ||
        i.assignedTo === selectedUserId ||
        (i.assignedToType === "group" &&
          i.assignedGroup.includes(selectedUserId));

      const matchesSearch = i.indicatorTitle
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      
      return matchesUser && matchesSearch;
    });

    // Sort by most recently updated first
    return [...filtered].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [pendingAuditIndicators, selectedUserId, searchTerm]);

  if (indicatorsLoading || usersLoading) return <LoadingState />;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8F9FA]">
      <aside className="w-full lg:w-80 bg-white border-r border-gray-100 lg:h-screen lg:sticky lg:top-0 overflow-y-auto">
        <div className="p-6 border-b border-gray-50 bg-[#1a3a32]">
          <div className="flex items-center gap-3 text-[#c2a336] mb-1">
            <Inbox size={18} />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">
              Audit Inbox
            </h2>
          </div>
          <p className="text-white/60 text-[11px] font-medium">
            Review pending submissions
          </p>
        </div>

        <nav className="p-4 space-y-1">
          <button
            onClick={() => setSelectedUserId("all")}
            className={`w-full flex justify-between items-center p-4 rounded-2xl transition-all ${selectedUserId === "all" ? "bg-gray-100 text-[#1a3a32]" : "hover:bg-gray-50 text-gray-500"}`}
          >
            <span className="text-xs font-bold uppercase tracking-wider">All Pending</span>
            <span className="text-[10px] font-black bg-white px-2 py-1 rounded-lg border">
              {pendingAuditIndicators.length}
            </span>
          </button>

          <div className="pt-6 pb-2 px-4 flex items-center gap-2">
            <Filter size={10} className="text-gray-400" />
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Filter by Official</span>
          </div>

          {userSubmissionStats.map((user) => (
            <button
              key={user._id}
              onClick={() => setSelectedUserId(user._id)}
              className={`w-full group flex items-center justify-between p-3 rounded-xl transition-all ${selectedUserId === user._id ? "bg-emerald-50 border border-emerald-100" : "hover:bg-gray-50"}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${user.pending > 0 ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-400"}`}>
                  <UserIcon size={14} />
                </div>
                <div className="text-left overflow-hidden">
                  <p className={`text-[11px] font-bold truncate ${selectedUserId === user._id ? "text-[#1a3a32]" : "text-gray-600"}`}>
                    {user.name}
                  </p>
                  <p className="text-[9px] text-gray-400 font-medium uppercase">
                    {user.total} Pending
                  </p>
                </div>
              </div>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 lg:p-12 max-w-5xl">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#1a3a32]">
              {selectedUserId === "all" ? "Audit Queue" : `Review: ${users.find((u) => u._id === selectedUserId)?.name}`}
            </h1>
            <p className="text-[10px] font-black text-[#c2a336] uppercase tracking-widest mt-1">
              Showing submissions awaiting approval
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
            <input
              type="text"
              placeholder="Search indicators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-4 text-xs focus:ring-2 focus:ring-[#c2a336] outline-none transition-all shadow-sm"
            />
          </div>
        </header>

        {!filteredSubmissions.length ? (
          <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
            <CheckCircle2 size={48} className="mx-auto text-emerald-100 mb-4" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inbox Zero: No pending reviews</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSubmissions.map((i) => (
              <SubmissionRow key={i._id} indicator={i} navigate={navigate} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

/* --- SUB-COMPONENT --- */

const SubmissionRow = ({ indicator, navigate }: { indicator: any; navigate: any; }) => {
  const isResubmitted = indicator.rejectionCount > 0;
  const lastActivityDate = new Date(indicator.updatedAt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div
      onClick={() => navigate(`/admin/submitted/${indicator._id}`)}
      className="group bg-white p-6 rounded-[2rem] border border-gray-50 hover:border-[#c2a336]/30 hover:shadow-xl hover:shadow-[#1a3a32]/5 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
    >
      <div className="flex items-start gap-5 flex-1">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${indicator.status === "submitted" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"}`}>
          {indicator.status === "submitted" ? <Clock size={24} /> : <FileWarning size={24} />}
        </div>
        
        <div className="overflow-hidden space-y-2">
          <div className="flex items-center gap-3">
             <h3 className="font-bold text-[#1a3a32] text-sm group-hover:text-[#c2a336] transition-colors truncate">
                {indicator.indicatorTitle}
             </h3>
             {isResubmitted && (
               <span className="flex items-center gap-1 bg-orange-100 text-orange-700 text-[8px] font-black px-2 py-1 rounded-md uppercase border border-orange-200">
                 <History size={10} /> Resubmitted
               </span>
             )}
          </div>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
            <span className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1.5">
               <Inbox size={12} className="text-[#c2a336]" /> {indicator.evidence.length} Documents
            </span>
            <div className="w-1 h-1 rounded-full bg-gray-200 hidden sm:block" />
            <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1.5">
               <CalendarDays size={12} className="text-slate-400" /> 
               <span className="font-black text-[9px] uppercase text-slate-400">Activity:</span> 
               {lastActivityDate}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
        <div
          className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all group-hover:bg-[#1a3a32] group-hover:text-white group-hover:border-[#1a3a32] flex items-center gap-2 ${getStatusStyles(indicator.status)}`}
        >
          Begin Audit <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
};

const getStatusStyles = (status: string) => {
  switch (status) {
    case "submitted": return "bg-amber-50 border-amber-100 text-amber-700";
    case "rejected": return "bg-rose-50 border-rose-100 text-rose-700";
    default: return "bg-gray-50 border-gray-200 text-gray-600";
  }
};

const LoadingState = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
    <div className="w-12 h-12 relative">
      <div className="absolute inset-0 border-4 border-[#c2a336]/10 rounded-full" />
      <div className="absolute inset-0 border-4 border-[#c2a336] border-t-transparent rounded-full animate-spin" />
    </div>
    <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Audit Queue...</p>
  </div>
);

export default SubmittedIndicators;