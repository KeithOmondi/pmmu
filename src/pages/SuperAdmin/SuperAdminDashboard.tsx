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
import {
  Loader2,
  LayoutDashboard,
  ShieldCheck,
  Clock,
  Award,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending Initiation",
  submitted: "Under Review",
  approved: "Awaiting Final Seal",
  completed: "Certified & Locked",
  rejected: "Returned for Correction",
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
      (i) => new Date(i.startDate).getTime() > now,
    );
    const inProgress = indicators.filter(
      (i) =>
        new Date(i.startDate).getTime() <= now &&
        new Date(i.dueDate).getTime() >= now &&
        !["completed", "approved", "rejected"].includes(i.status),
    );
    const readyForSeal = indicators.filter((i) => i.status === "approved");
    const finalized = indicators.filter((i) => i.status === "completed");
    const late = indicators.filter(
      (i) =>
        !["completed", "rejected"].includes(i.status) &&
        new Date(i.dueDate).getTime() < now,
    );

    return { upcoming, inProgress, readyForSeal, finalized, late };
  }, [indicators, now]);

  if (indicatorsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#FDFDFD]">
        <Loader2 className="w-12 h-12 animate-spin text-[#1E3A2B] mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#C69214]">
          Accessing Judicial Archives...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] px-4 py-8 md:px-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* EXECUTIVE HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-[#C69214] pb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#1E3A2B] rounded-lg">
                <LayoutDashboard className="text-[#C69214]" size={28} />
              </div>
              <h1 className="text-3xl font-black text-[#1E3A2B] tracking-tight font-serif uppercase">
                Office of the Registrar High Court
              </h1>
            </div>
            <p className="text-[#C69214] font-bold text-sm tracking-[0.15em] uppercase ml-14">
              Performance Management & Measurement Dashboard
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#1E3A2B] px-6 py-3 rounded shadow-lg border-l-4 border-[#C69214]">
            <div className="w-2.5 h-2.5 rounded-full bg-[#C69214] animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-white">
              Secured Registry Active
            </span>
          </div>
        </header>

        {/* URGENT NOTICE BAR */}
        {metrics.readyForSeal.length > 0 && (
          <div className="bg-[#1E3A2B] rounded-xl p-5 flex items-center gap-5 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-32 bg-[#C69214]/10 skew-x-[-20deg] translate-x-10 group-hover:translate-x-5 transition-transform" />
            <div className="bg-[#C69214] p-3 rounded-full text-[#1E3A2B] z-10">
              <ShieldCheck size={24} />
            </div>
            <div className="z-10">
              <h4 className="font-black text-base uppercase tracking-tight">
                Executive Action Required
              </h4>
              <p className="text-sm text-gray-300">
                There are{" "}
                <span className="text-[#C69214] font-black underline decoration-2 underline-offset-4">
                  {metrics.readyForSeal.length} performance records
                </span>{" "}
                awaiting your final certification.
              </p>
            </div>
          </div>
        )}

        {/* 3 CORE EXECUTIVE METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* WIP Card */}
          <div className="bg-white p-8 rounded-2xl border-t-4 border-[#1E3A2B] shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Live Registry Work
              </p>
              <Clock className="text-gray-300" size={20} />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-5xl font-black text-[#1E3A2B]">
                {metrics.inProgress.length}
              </h3>
              <span className="text-xs font-bold text-gray-400 uppercase">
                Active
              </span>
            </div>
            <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#1E3A2B]" style={{ width: "65%" }} />
            </div>
          </div>

          {/* Certification Card */}
          <div className="bg-[#F9F4E8] p-8 rounded-2xl border-2 border-[#C69214] shadow-xl relative transform hover:-translate-y-1 transition-all">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[11px] font-black text-[#C69214] uppercase tracking-[0.2em]">
                Pending Certification
              </p>
              <Award className="text-[#C69214]" size={24} />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-5xl font-black text-[#1E3A2B]">
                {metrics.readyForSeal.length}
              </h3>
              <span className="text-xs font-bold text-[#C69214] uppercase">
                To Seal
              </span>
            </div>
            <p className="text-[10px] text-[#1E3A2B]/60 mt-4 font-bold uppercase italic">
              Requires High Court Registrar Signature
            </p>
          </div>

          {/* Completed Card */}
          <div className="bg-white p-8 rounded-2xl border-t-4 border-emerald-600 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Annual Archives
              </p>
              <CheckCircle2 className="text-emerald-500" size={20} />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-5xl font-black text-emerald-700">
                {metrics.finalized.length}
              </h3>
              <span className="text-xs font-bold text-gray-400 uppercase">
                Closed
              </span>
            </div>
            <div className="mt-4 flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-1 flex-1 bg-emerald-100 rounded-full"
                />
              ))}
            </div>
          </div>
        </div>

        {/* RECENT ACTIVITY TABLE */}
        <div className="bg-white rounded-2xl border border-[#E5D5B0] overflow-hidden shadow-sm">
          <div className="px-8 py-6 border-b border-[#F9F4E8] bg-[#F9F4E8]/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-[#1E3A2B]" />
              <h2 className="text-xs font-black text-[#1E3A2B] uppercase tracking-widest">
                Registry Activity Log
              </h2>
            </div>
            <button className="text-[10px] font-black text-[#C69214] hover:text-[#1E3A2B] uppercase transition-colors">
              View All Records →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-[#1E3A2B]/40 uppercase tracking-[0.15em] border-b border-[#F9F4E8] bg-white">
                  <th className="px-8 py-5">Judicial Task Detail</th>
                  <th className="px-8 py-5 text-center">
                    Certification Status
                  </th>
                  <th className="px-8 py-5 text-right">Statutory Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[...metrics.readyForSeal, ...metrics.inProgress]
                  .slice(0, 6)
                  .map((i) => (
                    <tr
                      key={i._id}
                      className="group hover:bg-[#F9F4E8]/20 transition-colors"
                    >
                      <td className="px-8 py-6">
                        <p className="text-sm font-black text-[#1E3A2B] group-hover:text-[#C69214] transition-colors mb-1">
                          {i.indicatorTitle}
                        </p>
                        <span className="px-2 py-0.5 bg-gray-100 text-[9px] font-bold text-gray-500 uppercase rounded">
                          {i.category?.title || "General Registry"}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span
                          className={`text-[9px] font-black uppercase px-4 py-2 rounded border-2 shadow-sm ${
                            i.status === "approved"
                              ? "bg-[#FFF9E6] text-[#C69214] border-[#C69214]"
                              : "bg-white text-gray-400 border-gray-100"
                          }`}
                        >
                          {STATUS_LABELS[i.status] || i.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <p className="text-xs font-black text-[#1E3A2B] font-mono">
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
