// src/pages/Admin/AdminIndicators.tsx
import React, { useEffect, useMemo } from "react";
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
  Eye,
  FolderOpen,
  User as UserIcon,
  Calendar,
  Layers,
  Search,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminIndicators: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const indicators = useAppSelector(selectAllIndicators);
  const loading = useAppSelector(selectIndicatorsLoading);
  const users = useAppSelector(selectAllUsers);
  const usersLoading = useAppSelector(selectUsersLoading);

  const isLoading = loading || usersLoading;

  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
    dispatch(fetchUsers());
  }, [dispatch]);

  const groupedIndicators = useMemo(() => {
    const result: Record<
      string,
      { category: { _id: string; title: string }; indicators: any[] }
    > = {};
    indicators.forEach((ind) => {
      const category = ind.category ?? {
        _id: "uncategorized",
        title: "General Indicators",
      };
      if (!result[category._id])
        result[category._id] = { category, indicators: [] };
      result[category._id].indicators.push(ind);
    });
    return result;
  }, [indicators]);

  const getUserName = (id: string | null) => {
    if (!id) return "-";
    const user = users.find((u) => u._id === id);
    return user ? user.name : "Unknown Official";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#f8f9fa]">
        <Loader2 className="w-10 h-10 animate-spin text-[#1a3a32] mb-4" />
        <p className="text-[#8c94a4] font-bold uppercase tracking-widest text-[10px]">
          Accessing National Registry...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-10 bg-[#f8f9fa] space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 pb-6">
        <div className="w-full md:w-auto">
          <h1 className="text-2xl sm:text-3xl font-black text-[#1a3a32] tracking-tight flex items-center gap-3">
            <Layers className="text-[#c2a336] shrink-0" size={28} />
            Performance Indicators
          </h1>
          <p className="text-[#8c94a4] mt-1 font-medium text-xs sm:text-sm">
            Judiciary Unified Oversight Registry
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c94a4]"
            size={18}
          />
          <input
            type="text"
            placeholder="Search registry..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#c2a336] focus:border-transparent outline-none transition-all text-sm shadow-sm"
          />
        </div>
      </div>

      {!indicators.length ? (
        <div className="bg-white rounded-[2rem] p-12 sm:p-20 text-center border border-dashed border-gray-200">
          <FolderOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-[#8c94a4] font-bold">
            No records found in current session.
          </p>
        </div>
      ) : (
        <div className="space-y-10 sm:space-y-12">
          {Object.values(groupedIndicators).map((group) => (
            <section
              key={group.category._id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-1 bg-[#c2a336] rounded-full" />
                  <h2 className="text-sm sm:text-lg font-black text-[#1a3a32] uppercase tracking-wider">
                    {group.category.title}
                  </h2>
                </div>
                <span className="bg-[#1a3a32] text-[#c2a336] px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                  {group.indicators.length} Items
                </span>
              </div>

              {/* Responsive Table/Card Wrapper */}
              <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-xl shadow-black/[0.02] border border-gray-100 overflow-hidden">
                {/* DESKTOP TABLE VIEW (Visible on sm+) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-[#fcfcfc] text-[#8c94a4] uppercase text-[10px] tracking-[0.15em] border-b border-gray-100">
                        <th className="px-6 py-5 text-left font-black">
                          Indicator
                        </th>
                        <th className="px-6 py-5 text-left font-black">
                          Official
                        </th>
                        <th className="px-6 py-5 text-left font-black">
                          Timeline
                        </th>
                        <th className="px-6 py-5 text-left font-black">
                          Progress
                        </th>
                        <th className="px-6 py-5 text-center font-black">
                          Status
                        </th>
                        <th className="px-6 py-5 text-center font-black">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {group.indicators.map((i) => (
                        <tr
                          key={i._id}
                          className="hover:bg-gray-50/50 transition-colors group"
                        >
                          <td className="px-6 py-5">
                            <div className="font-bold text-[#1a3a32] leading-tight mb-1">
                              {i.indicatorTitle}
                            </div>
                            <div className="text-[10px] text-[#c2a336] font-black uppercase tracking-widest">
                              {i.level2Category?.title ?? "Standard"}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <UserIcon size={14} className="text-[#8c94a4]" />
                              <span className="text-[#1a3a32] font-bold text-xs">
                                {i.assignedToType === "individual"
                                  ? getUserName(i.assignedTo)
                                  : "Group"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold">
                              <Calendar size={12} />
                              {new Date(i.dueDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="w-24 bg-gray-100 rounded-full h-1.5 mb-1">
                              <div
                                className="bg-[#1a3a32] h-1.5 rounded-full"
                                style={{ width: `${i.progress}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-black text-[#1a3a32]">
                              {i.progress}%
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <StatusBadge status={i.status} />
                          </td>
                          <td className="px-6 py-5 text-center">
                            <button
                              onClick={() =>
                                navigate(`/admin/indicators/${i._id}`)
                              }
                              className="p-2 text-[#c2a336] hover:bg-[#1a3a32] hover:text-white rounded-xl transition-all"
                            >
                              <Eye size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE CARD VIEW (Visible only on < sm) */}
                <div className="sm:hidden divide-y divide-gray-50">
                  {group.indicators.map((i) => (
                    <div
                      key={i._id}
                      className="p-5 active:bg-gray-50 transition-colors"
                      onClick={() => navigate(`/admin/indicators/${i._id}`)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <StatusBadge status={i.status} />
                        <ChevronRight size={18} className="text-gray-300" />
                      </div>
                      <h4 className="font-bold text-[#1a3a32] leading-snug mb-2">
                        {i.indicatorTitle}
                      </h4>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest mb-1">
                            Official
                          </p>
                          <p className="text-xs font-bold text-[#1a3a32] truncate">
                            {i.assignedToType === "individual"
                              ? getUserName(i.assignedTo)
                              : "Group"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase font-black text-gray-400 tracking-widest mb-1">
                            Deadline
                          </p>
                          <p className="text-xs font-bold text-[#1a3a32]">
                            {new Date(i.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-50">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-black uppercase text-gray-400">
                            Progress
                          </span>
                          <span className="text-[10px] font-black text-[#1a3a32]">
                            {i.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-[#1a3a32] h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${i.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

/* --- Refactored Sub-Components --- */

const StatusBadge = ({ status }: { status: string }) => {
  const styles =
    {
      approved: "bg-emerald-50 border-emerald-100 text-emerald-700",
      pending: "bg-amber-50 border-amber-100 text-amber-700",
      rejected: "bg-rose-50 border-rose-100 text-rose-700",
    }[status] || "bg-gray-50 text-gray-600";

  return (
    <span
      className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border ${styles}`}
    >
      {status}
    </span>
  );
};

export default AdminIndicators;
