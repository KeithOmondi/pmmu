// src/pages/SuperAdmin/SuperAdminDashboard.tsx
import React, { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  selectAllIndicators,
  selectIndicatorsLoading,
} from "../../store/slices/indicatorsSlice";
import { fetchCategories } from "../../store/slices/categoriesSlice";
import { fetchUsers } from "../../store/slices/userSlice";
import { Loader2, LayoutDashboard, ShieldCheck, Clock } from "lucide-react";

// Simplified status labels for the UI
const STATUS_LABELS: Record<string, string> = {
  pending: "Not Started",
  submitted: "Under Review",
  approved: "Waiting for Final Seal",
  completed: "Finished & Locked",
  rejected: "Returned",
};

const SuperAdminDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const indicators = useAppSelector(selectAllIndicators);
  const indicatorsLoading = useAppSelector(selectIndicatorsLoading);

  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
    dispatch(fetchCategories());
    dispatch(fetchUsers());
  }, [dispatch]);

  const now = Date.now();

  const metrics = useMemo(() => {
    const upcoming = indicators.filter(
      (i) => new Date(i.startDate).getTime() > now
    );

    // Combined Ongoing and Pending into "Work in Progress"
    const inProgress = indicators.filter(
      (i) =>
        new Date(i.startDate).getTime() <= now &&
        new Date(i.dueDate).getTime() >= now &&
        !["completed", "approved", "rejected"].includes(i.status)
    );

    const readyForSeal = indicators.filter((i) => i.status === "approved");
    const finalized = indicators.filter((i) => i.status === "completed");
    const late = indicators.filter(
      (i) =>
        !["completed", "rejected"].includes(i.status) &&
        new Date(i.dueDate).getTime() < now
    );

    return { upcoming, inProgress, readyForSeal, finalized, late };
  }, [indicators, now]);

  if (indicatorsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white">
        <Loader2 className="w-9 h-9 animate-spin text-[#1a3a32] mb-3" />
        <p className="text-xs font-bold uppercase text-[#8c94a4]">
          Loading Court Records...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] px-4 py-6 md:px-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <LayoutDashboard className="text-[#1a3a32]" size={24} />
              OFFICE OF THE REGISTRAR HIGH COURT
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              Overal Monitoring Dashboard
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-600">
              System Live
            </span>
          </div>
        </header>

        {/* Simple Notice */}
        <div className="bg-[#1a3a32] rounded-2xl p-4 flex items-start gap-4 text-white shadow-lg shadow-[#1a3a32]/10">
          <div className="bg-[#c2a336] p-2 rounded-lg">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm">Action Required</h4>
            <p className="text-xs text-gray-300">
              There are{" "}
              <span className="text-[#c2a336] font-bold">
                {metrics.readyForSeal.length} items
              </span>{" "}
              waiting for your final approval. Once you approve them, they are
              locked and recorded as completed.
            </p>
          </div>
        </div>

        {/* 3 Clear Metric Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active Work */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Active Work
            </p>
            <h3 className="text-3xl font-black text-gray-900">
              {metrics.inProgress.length}
            </h3>
            <p className="text-xs text-gray-500 mt-2">
              Tasks currently being worked on.
            </p>
          </div>

          {/* Needing Your Seal */}
          <div className="bg-white p-6 rounded-[2rem] border-2 border-[#c2a336] shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Clock size={40} />
            </div>
            <p className="text-[10px] font-black text-[#c2a336] uppercase tracking-widest mb-1">
              Needs Your Approval
            </p>
            <h3 className="text-3xl font-black text-[#1a3a32]">
              {metrics.readyForSeal.length}
            </h3>
            <p className="text-xs text-gray-600 mt-2 font-medium">
              Tasks reviewed and ready for final approval.
            </p>
          </div>

          {/* Finished */}
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Completed
            </p>
            <h3 className="text-3xl font-black text-emerald-600">
              {metrics.finalized.length}
            </h3>
            <p className="text-xs text-gray-500 mt-2">
              Tasks completed and locked in the registry.
            </p>
          </div>
        </div>

        {/* Simple Table */}
        <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-8 py-5 border-b border-gray-50 bg-gray-50/50">
            <h2 className="text-sm font-black text-[#1a3a32] uppercase">
              Recent Activity
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                  <th className="px-8 py-4">Task Name</th>
                  <th className="px-8 py-4">Current Status</th>
                  <th className="px-8 py-4 text-right">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...metrics.readyForSeal, ...metrics.inProgress]
                  .slice(0, 5)
                  .map((i) => (
                    <tr
                      key={i._id}
                      className="group hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-gray-800">
                          {i.indicatorTitle}
                        </p>
                        <p className="text-[10px] text-gray-400 uppercase font-medium">
                          {i.category?.title || "General"}
                        </p>
                      </td>
                      <td className="px-8 py-5">
                        <span
                          className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
                            i.status === "approved"
                              ? "bg-amber-50 text-amber-600 border-amber-100"
                              : "bg-gray-50 text-gray-500 border-gray-100"
                          }`}
                        >
                          {STATUS_LABELS[i.status] || i.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <p className="text-xs font-bold text-gray-500">
                          {new Date(i.dueDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
