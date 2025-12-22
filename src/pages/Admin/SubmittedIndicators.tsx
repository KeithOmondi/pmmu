// src/pages/Admin/SubmittedIndicators.tsx
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
  User as UserIcon,
  Inbox,
  FileCheck,
  Clock,
  Filter,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const SubmittedIndicators: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const indicators = useAppSelector(selectAllIndicators);
  const indicatorsLoading = useAppSelector(selectIndicatorsLoading);
  const users = useAppSelector(selectAllUsers);
  const usersLoading = useAppSelector(selectUsersLoading);

  const isLoading = indicatorsLoading || usersLoading;

  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
    dispatch(fetchUsers());
  }, [dispatch]);

  const submittedIndicators = useMemo(
    () =>
      indicators.filter(
        (i) => i.status === "pending" || i.status === "approved"
      ),
    [indicators]
  );

  const getUserName = (id: string | null) => {
    if (!id) return "-";
    const user = users.find((u) => u._id === id);
    return user ? user.name : "Judiciary Official";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#f8f9fa]">
        <Loader2 className="w-10 h-10 animate-spin text-[#1a3a32] mb-4" />
        <p className="text-[#8c94a4] font-bold uppercase tracking-widest text-[10px]">
          Scanning Submission Inbox...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-10 bg-[#f8f9fa] space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1a3a32] tracking-tight flex items-center gap-3">
            <Inbox className="text-[#c2a336] shrink-0" />
            Submission Inbox
          </h1>
          <p className="text-[#8c94a4] mt-1 font-medium text-xs sm:text-sm">
            Review and verify performance indicator submissions
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-[#1a3a32] shadow-sm hover:bg-gray-50 transition-colors">
            <Filter size={16} />
            Filter
          </button>
          <div className="flex-1 md:flex-none px-4 py-2.5 bg-[#1a3a32] text-[#c2a336] rounded-xl text-xs sm:text-sm font-bold text-center border border-[#c2a336]/20">
            {submittedIndicators.length}{" "}
            <span className="hidden sm:inline">Submissions</span>
            <span className="sm:hidden">Total</span>
          </div>
        </div>
      </div>

      {!submittedIndicators.length ? (
        <div className="bg-white rounded-3xl p-12 sm:p-20 text-center border border-gray-100 shadow-sm">
          <FileCheck className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-[#8c94a4] font-semibold text-lg">
            Your inbox is clear. No pending submissions.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-[1.5rem] sm:rounded-3xl shadow-xl shadow-black/[0.02] border border-gray-100 overflow-hidden">
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[#fcfcfc] text-[#8c94a4] uppercase text-[10px] tracking-[0.15em] border-b border-gray-100">
                  <th className="px-6 py-5 text-left font-black">
                    Indicator / Context
                  </th>
                  <th className="px-6 py-5 text-left font-black">
                    Reporting Official
                  </th>
                  <th className="px-6 py-5 text-left font-black">Timeline</th>
                  <th className="px-6 py-5 text-left font-black">Progress</th>
                  <th className="px-6 py-5 text-center font-black">Status</th>
                  <th className="px-6 py-5 text-center font-black">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submittedIndicators.map((i) => (
                  <tr
                    key={i._id}
                    className="hover:bg-[#f4f0e6]/30 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div className="font-bold text-[#1a3a32] group-hover:text-[#c2a336] transition-colors line-clamp-1">
                        {i.indicatorTitle}
                      </div>
                      <div className="text-[11px] text-[#8c94a4] font-medium mt-0.5 uppercase tracking-tighter">
                        {i.category?.title} &rsaquo;{" "}
                        {i.level2Category?.title ?? "General"}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#1a3a32]/5 flex items-center justify-center text-[#1a3a32] shrink-0">
                          <UserIcon size={14} />
                        </div>
                        <span className="font-bold text-gray-700 text-xs">
                          {i.assignedToType === "individual"
                            ? getUserName(i.assignedTo)
                            : "Group Submission"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-gray-500 font-bold text-xs">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-[#8c94a4]" />
                        {new Date(i.dueDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 h-1.5 rounded-full max-w-[60px] overflow-hidden">
                          <div
                            className="bg-[#1a3a32] h-full rounded-full"
                            style={{ width: `${i.progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-black text-[#1a3a32]">
                          {i.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-center">
                        <span
                          className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyles(
                            i.status
                          )}`}
                        >
                          {i.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => navigate(`/admin/submitted/${i._id}`)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#f4f0e6] text-[#c2a336] rounded-xl text-xs font-bold hover:bg-[#c2a336] hover:text-white transition-all active:scale-95"
                      >
                        <Eye size={14} /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD VIEW */}
          <div className="md:hidden divide-y divide-gray-50">
            {submittedIndicators.map((i) => (
              <div
                key={i._id}
                className="p-5 active:bg-gray-50 transition-colors"
                onClick={() => navigate(`/admin/submitted/${i._id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <span
                    className={`px-3 py-0.5 rounded-lg text-[9px] font-black uppercase border ${getStatusStyles(
                      i.status
                    )}`}
                  >
                    {i.status}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tabular-nums">
                    <Clock size={12} />
                    {new Date(i.dueDate).toLocaleDateString()}
                  </div>
                </div>

                <h4 className="font-bold text-[#1a3a32] text-sm leading-tight mb-1">
                  {i.indicatorTitle}
                </h4>
                <p className="text-[10px] text-[#8c94a4] font-medium uppercase mb-4">
                  {i.level2Category?.title ?? "General Indicator"}
                </p>

                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center border border-gray-100 shadow-sm">
                      <UserIcon size={12} className="text-[#c2a336]" />
                    </div>
                    <span className="text-[11px] font-bold text-[#1a3a32] truncate max-w-[120px]">
                      {i.assignedToType === "individual"
                        ? getUserName(i.assignedTo)
                        : "Group"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-[#1a3a32]">
                      {i.progress}%
                    </span>
                    <div className="w-12 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#1a3a32] h-full"
                        style={{ width: `${i.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-black text-[#c2a336] uppercase tracking-widest bg-[#f4f0e6] py-2.5 rounded-xl border border-[#c2a336]/10">
                  Open Submission <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const getStatusStyles = (status: string) => {
  switch (status) {
    case "approved":
      return "bg-emerald-50 border-emerald-200 text-emerald-700";
    case "pending":
      return "bg-amber-50 border-amber-200 text-amber-700";
    case "rejected":
      return "bg-rose-50 border-rose-200 text-rose-700";
    default:
      return "bg-gray-50 border-gray-200 text-gray-600";
  }
};

export default SubmittedIndicators;
