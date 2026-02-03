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
  selectUsersLoading,
} from "../../store/slices/userSlice";
import {
  Loader2,
  FolderOpen,
  User as UserIcon,
  Users as GroupIcon,
  Search,
  ShieldCheck,
  Filter,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminIndicators: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const indicators = useAppSelector(selectAllIndicators);
  const loading = useAppSelector(selectIndicatorsLoading);
  const users = useAppSelector(selectAllUsers);
  const usersLoading = useAppSelector(selectUsersLoading);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | "all">("all");

  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
    dispatch(fetchUsers());
  }, [dispatch]);

  // 1. Filter indicators by Selected User + Search Term
  const filteredIndicators = useMemo(() => {
    return indicators.filter((ind) => {
      const matchesSearch = ind.indicatorTitle
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      if (selectedUserId === "all") return matchesSearch;

      const matchesUser =
        ind.assignedTo === selectedUserId ||
        (ind.assignedToType === "group" &&
          ind.assignedGroup.includes(selectedUserId));

      return matchesUser && matchesSearch;
    });
  }, [indicators, searchTerm, selectedUserId]);

  // 2. Group the filtered results by Category
  const groupedIndicators = useMemo(() => {
    const result: Record<
      string,
      { category: { _id: string; title: string }; indicators: any[] }
    > = {};

    filteredIndicators.forEach((ind) => {
      const category = ind.category ?? {
        _id: "uncategorized",
        title: "General Indicators",
      };
      if (!result[category._id])
        result[category._id] = { category, indicators: [] };
      result[category._id].indicators.push(ind);
    });
    return result;
  }, [filteredIndicators]);

  // 3. Stats for the Sidebar
  const userStats = useMemo(() => {
    return users
      .map((u) => ({
        ...u,
        count: indicators.filter(
          (i) =>
            i.assignedTo === u._id ||
            (i.assignedToType === "group" && i.assignedGroup.includes(u._id)),
        ).length,
      }))
      .sort((a, b) => b.count - a.count);
  }, [users, indicators]);

  if (loading || usersLoading) return <LoadingState />;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F8F9FA]">
      {/* SIDEBAR: User Selection */}
      <aside className="w-full lg:w-80 bg-white border-r border-gray-100 p-6 lg:h-screen lg:sticky lg:top-0 overflow-y-auto">
        <div className="mb-8">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c2a336] mb-4">
            Official Registry
          </h2>
          <button
            onClick={() => setSelectedUserId("all")}
            className={`w-full flex justify-between items-center p-4 rounded-2xl transition-all mb-2 ${selectedUserId === "all" ? "bg-[#1a3a32] text-white shadow-lg" : "hover:bg-gray-50 text-gray-600"}`}
          >
            <div className="flex items-center gap-3">
              <Filter size={16} />
              <span className="text-xs font-bold">All Indicators</span>
            </div>
            <span className="text-[10px] opacity-60 font-black">
              {indicators.length}
            </span>
          </button>
        </div>

        <nav className="space-y-1">
          <p className="px-4 text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Filter by Custodian
          </p>
          {userStats.map((user) => (
            <button
              key={user._id}
              onClick={() => setSelectedUserId(user._id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${selectedUserId === user._id ? "bg-emerald-50 text-[#1a3a32] border border-emerald-100" : "hover:bg-gray-50"}`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedUserId === user._id ? "bg-[#1a3a32] text-white" : "bg-gray-100 text-gray-400 group-hover:bg-white"}`}
                >
                  <UserIcon size={14} />
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-[11px] font-bold truncate">{user.name}</p>
                  <p className="text-[9px] text-gray-400 truncate uppercase">
                    {user.role}
                  </p>
                </div>
              </div>
              {user.count > 0 && (
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-md ${selectedUserId === user._id ? "bg-[#1a3a32] text-white" : "bg-gray-100 text-gray-500"}`}
                >
                  {user.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 lg:p-12 max-w-6xl mx-auto w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-6 bg-[#c2a336]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#c2a336]">
                Performance Audit
              </span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-[#1a3a32]">
              {selectedUserId === "all"
                ? "Global Indicator Feed"
                : users.find((u) => u._id === selectedUserId)?.name}
            </h1>
          </div>

          <div className="relative w-full md:w-80 group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#c2a336] transition-colors"
              size={18}
            />
            <input
              type="text"
              placeholder="Search specific record..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border-0 rounded-[1.5rem] shadow-sm focus:ring-2 focus:ring-[#c2a336] outline-none transition-all text-sm"
            />
          </div>
        </header>

        {filteredIndicators.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-16">
            {Object.values(groupedIndicators).map((group) => (
              <section key={group.category._id}>
                <div className="flex items-center gap-4 mb-8">
                  <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-400">
                    {group.category.title}
                  </h2>
                  <div className="h-px flex-1 bg-gray-200/60" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {group.indicators.map((i: any) => (
                    <IndicatorCard
                      key={i._id}
                      indicator={i}
                      navigate={navigate}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

/* --- SUB-COMPONENTS --- */

const IndicatorCard = ({
  indicator,
  navigate,
}: {
  indicator: any;
  navigate: any;
}) => (
  <div
    onClick={() => navigate(`/admin/indicators/${indicator._id}`)}
    className="group bg-white rounded-[2rem] p-6 border border-transparent hover:border-emerald-100 hover:shadow-2xl hover:shadow-emerald-900/5 transition-all cursor-pointer relative overflow-hidden"
  >
    <div className="flex justify-between items-start mb-6">
      <StatusBadge status={indicator.status} />
      <div className="flex -space-x-2">
        <div className="w-8 h-8 rounded-full bg-gray-50 border-2 border-white flex items-center justify-center text-[#c2a336]">
          {indicator.assignedToType === "group" ? (
            <GroupIcon size={12} />
          ) : (
            <UserIcon size={12} />
          )}
        </div>
      </div>
    </div>

    <h3 className="text-lg font-bold text-[#1a3a32] mb-2 leading-tight group-hover:text-[#c2a336] transition-colors line-clamp-2">
      {indicator.indicatorTitle}
    </h3>

    <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold uppercase mb-6">
      <span className="flex items-center gap-1">
        <Clock size={12} /> {new Date(indicator.dueDate).toLocaleDateString()}
      </span>
      <span className="flex items-center gap-1">
        <ShieldCheck size={12} /> {indicator.progress}%
      </span>
    </div>

    <div className="w-full bg-gray-50 rounded-full h-1.5 overflow-hidden">
      <div
        className="bg-[#1a3a32] h-full transition-all duration-700"
        style={{ width: `${indicator.progress}%` }}
      />
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    approved: "bg-emerald-50 text-emerald-700",
    completed: "bg-[#1a3a32] text-white",
    pending: "bg-amber-50 text-amber-700",
    submitted: "bg-blue-50 text-blue-700",
    rejected: "bg-rose-50 text-rose-700",
  };
  return (
    <span
      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${colors[status] || "bg-gray-100"}`}
    >
      {status}
    </span>
  );
};

const LoadingState = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
    <Loader2 className="w-8 h-8 animate-spin text-[#c2a336] mb-4" />
    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
      Filtering Registry...
    </p>
  </div>
);

const EmptyState = () => (
  <div className="py-24 text-center">
    <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
      <FolderOpen size={32} className="text-gray-200" />
    </div>
    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
      No matching records found
    </h3>
  </div>
);

export default AdminIndicators;
