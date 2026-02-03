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
  FileCheck,
  Clock,
  ChevronRight,
  Search,
  CheckCircle2,
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

  // 1. Sidebar Stats: Count submissions per user
  const userSubmissionStats = useMemo(() => {
    return users
      .map((user) => {
        const userItems = indicators.filter(
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
      .filter((u) => u.total > 0) // Only show users who actually have submissions
      .sort((a, b) => b.pending - a.pending); // Prioritize users with pending items
  }, [users, indicators]);

  // 2. Filter Main Content
  const filteredSubmissions = useMemo(() => {
    return indicators.filter((i) => {
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
  }, [indicators, selectedUserId, searchTerm]);

  if (indicatorsLoading || usersLoading) return <LoadingState />;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8F9FA]">
      {/* SIDEBAR: QUEUE MANAGEMENT */}
      <aside className="w-full lg:w-80 bg-white border-r border-gray-100 lg:h-screen lg:sticky lg:top-0 overflow-y-auto">
        <div className="p-6 border-b border-gray-50 bg-[#1a3a32]">
          <div className="flex items-center gap-3 text-[#c2a336] mb-1">
            <Inbox size={18} />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">
              Submission Inbox
            </h2>
          </div>
          <p className="text-white/60 text-[11px] font-medium">
            Clear the verification backlog
          </p>
        </div>

        <nav className="p-4 space-y-1">
          <button
            onClick={() => setSelectedUserId("all")}
            className={`w-full flex justify-between items-center p-4 rounded-2xl transition-all ${selectedUserId === "all" ? "bg-gray-100 text-[#1a3a32]" : "hover:bg-gray-50 text-gray-500"}`}
          >
            <span className="text-xs font-bold uppercase tracking-wider">
              All Submissions
            </span>
            <span className="text-[10px] font-black bg-white px-2 py-1 rounded-lg border">
              {indicators.length}
            </span>
          </button>

          <div className="pt-6 pb-2 px-4">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
              Pending by Official
            </span>
          </div>

          {userSubmissionStats.map((user) => (
            <button
              key={user._id}
              onClick={() => setSelectedUserId(user._id)}
              className={`w-full group flex items-center justify-between p-3 rounded-xl transition-all ${selectedUserId === user._id ? "bg-emerald-50 border border-emerald-100" : "hover:bg-gray-50"}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${user.pending > 0 ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-400"}`}
                >
                  <UserIcon size={14} />
                </div>
                <div className="text-left overflow-hidden">
                  <p
                    className={`text-[11px] font-bold truncate ${selectedUserId === user._id ? "text-[#1a3a32]" : "text-gray-600"}`}
                  >
                    {user.name}
                  </p>
                  <p className="text-[9px] text-gray-400 font-medium uppercase">
                    {user.pending} Actionable
                  </p>
                </div>
              </div>
              {user.pending > 0 && (
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 lg:p-12 max-w-5xl">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#1a3a32]">
              {selectedUserId === "all"
                ? "Verification Queue"
                : `Review: ${users.find((u) => u._id === selectedUserId)?.name}`}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-[10px] font-black text-[#c2a336] uppercase tracking-widest bg-[#c2a336]/10 px-2 py-0.5 rounded">
                {filteredSubmissions.length} Documents
              </span>
            </div>
          </div>

          <div className="relative w-full md:w-72">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
              size={16}
            />
            <input
              type="text"
              placeholder="Filter by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-2xl py-3 pl-12 pr-4 text-xs focus:ring-2 focus:ring-[#c2a336] outline-none transition-all shadow-sm"
            />
          </div>
        </header>

        {!filteredSubmissions.length ? (
          <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
            <FileCheck size={48} className="mx-auto text-gray-100 mb-4" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              No matching submissions
            </p>
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

/* --- SUB-COMPONENTS --- */

const SubmissionRow = ({
  indicator,
  navigate,
}: {
  indicator: any;
  navigate: any;
}) => (
  <div
    onClick={() => navigate(`/admin/submitted/${indicator._id}`)}
    className="group bg-white p-5 rounded-[1.5rem] border border-gray-50 hover:border-[#c2a336]/30 hover:shadow-xl hover:shadow-[#1a3a32]/5 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
  >
    <div className="flex items-start gap-4 flex-1">
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${indicator.status === "submitted" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}
      >
        {indicator.status === "submitted" ? (
          <Clock size={20} />
        ) : (
          <CheckCircle2 size={20} />
        )}
      </div>
      <div className="overflow-hidden">
        <h3 className="font-bold text-[#1a3a32] text-sm group-hover:text-[#c2a336] transition-colors truncate">
          {indicator.indicatorTitle}
        </h3>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
            {indicator.category?.title}
          </span>
          <div className="w-1 h-1 rounded-full bg-gray-200" />
          <span className="text-[9px] font-bold text-[#c2a336] uppercase">
            Due {new Date(indicator.dueDate).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>

    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-gray-50">
      <div className="text-right hidden sm:block">
        <p className="text-[10px] font-black text-[#1a3a32] mb-1">
          {indicator.progress}% Complete
        </p>
        <div className="w-20 bg-gray-100 h-1 rounded-full overflow-hidden">
          <div
            className="bg-[#1a3a32] h-full"
            style={{ width: `${indicator.progress}%` }}
          />
        </div>
      </div>

      <div
        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all group-hover:bg-[#1a3a32] group-hover:text-white group-hover:border-[#1a3a32] flex items-center gap-2 ${getStatusStyles(indicator.status)}`}
      >
        Review <ChevronRight size={14} />
      </div>
    </div>
  </div>
);

const getStatusStyles = (status: string) => {
  switch (status) {
    case "approved":
      return "bg-emerald-50 border-emerald-100 text-emerald-700";
    case "submitted":
      return "bg-amber-50 border-amber-100 text-amber-700";
    case "rejected":
      return "bg-rose-50 border-rose-100 text-rose-700";
    default:
      return "bg-gray-50 border-gray-200 text-gray-600";
  }
};

const LoadingState = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
    <div className="w-12 h-12 relative">
      <div className="absolute inset-0 border-4 border-[#c2a336]/10 rounded-full" />
      <div className="absolute inset-0 border-4 border-[#c2a336] border-t-transparent rounded-full animate-spin" />
    </div>
    <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
      Loading Submissions...
    </p>
  </div>
);

export default SubmittedIndicators;
