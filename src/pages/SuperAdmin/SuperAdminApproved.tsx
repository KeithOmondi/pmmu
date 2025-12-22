// src/pages/SuperAdmin/SuperAdminApproved.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAllIndicatorsForAdmin,
  selectAllIndicators,
  selectIndicatorsLoading,
  updateIndicator,
  type IIndicator,
} from "../../store/slices/indicatorsSlice";
import {
  Loader2,
  Eye,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Gavel,
  Calendar,
  Users,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";

const SuperAdminApproved: React.FC = () => {
  const dispatch = useAppDispatch();
  const indicators = useAppSelector(selectAllIndicators);
  const loading = useAppSelector(selectIndicatorsLoading);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
  }, [dispatch]);

  const pendingReviewIndicators = useMemo(
    () => indicators.filter((i) => i.status === "approved"),
    [indicators]
  );

  const handleReview = async (indicator: IIndicator, approve: boolean) => {
    try {
      setProcessingId(indicator._id);
      await dispatch(
        updateIndicator({
          id: indicator._id,
          updates: { status: approve ? "approved" : "rejected" } as any,
        })
      ).unwrap();
      toast.success(
        `Indicator finalized: ${approve ? "Ratified" : "Returned to Review"}`
      );
    } catch (err) {
      toast.error("Protocol Error: Failed to update status");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] text-[#1a3a32]">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#c2a336]" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">
          Syncing Master Registry...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-10 bg-[#f8f9fa]">
      {/* Header Section */}
      <div className="mb-6 lg:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-[#c2a336] mb-2 font-black uppercase tracking-[0.2em] text-[10px]">
            <Gavel size={14} />
            SuperAdmin Command
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1a3a32] tracking-tighter leading-tight">
            Pending Ratification
          </h1>
          <p className="text-sm text-gray-500 mt-1 max-w-xl">
            Final review of indicators approved by department administrators.
          </p>
        </div>

        <div className="bg-white px-6 py-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between md:justify-end gap-4">
          <div className="text-left md:text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Awaiting Decision
            </p>
            <p className="text-xl font-black text-[#1a3a32]">
              {pendingReviewIndicators.length}
            </p>
          </div>
          <div className="h-10 w-[1px] bg-gray-100" />
          <ShieldCheck className="text-[#c2a336]" size={28} />
        </div>
      </div>

      {/* Content Section */}
      {!pendingReviewIndicators.length ? (
        <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 p-10 sm:p-20 text-center shadow-sm">
          <CheckCircle2 className="mx-auto text-emerald-100 mb-4" size={48} />
          <p className="text-[#1a3a32] font-black italic tracking-tight">
            The registry is currently clear. No pending ratifications found.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (Hidden on Mobile) */}
          <div className="hidden xl:block bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-black/[0.02] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1a3a32] text-white">
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest border-b border-white/10 text-center">
                      Actions
                    </th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest border-b border-white/10">
                      Indicator Dossier
                    </th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest border-b border-white/10">
                      Architecture
                    </th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest border-b border-white/10">
                      Assignment
                    </th>
                    <th className="p-5 text-[10px] font-black uppercase tracking-widest border-b border-white/10">
                      Timeline
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pendingReviewIndicators.map((i) => (
                    <IndicatorRow
                      key={i._id}
                      indicator={i}
                      processingId={processingId}
                      onReview={handleReview}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View (Hidden on Desktop) */}
          <div className="xl:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingReviewIndicators.map((i) => (
              <IndicatorCard
                key={i._id}
                indicator={i}
                processingId={processingId}
                onReview={handleReview}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* --- Sub-Components for Cleanliness --- */

const IndicatorRow = ({
  indicator,
  processingId,
  onReview,
}: {
  indicator: IIndicator;
  processingId: string | null;
  onReview: any;
}) => (
  <tr className="hover:bg-[#f8f9fa] transition-colors group">
    <td className="p-5">
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() =>
            (window.location.href = `/indicators/${indicator._id}`)
          }
          className="p-2 text-gray-400 hover:text-[#1a3a32] bg-gray-50 hover:bg-white rounded-lg transition-all border border-gray-100"
          title="View Details"
        >
          <Eye size={18} />
        </button>
        <div className="h-6 w-[1px] bg-gray-100 mx-1" />
        <button
          disabled={processingId === indicator._id}
          onClick={() => onReview(indicator, true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all"
        >
          {processingId === indicator._id ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <CheckCircle2 size={14} />
          )}{" "}
          Ratify
        </button>
        <button
          disabled={processingId === indicator._id}
          onClick={() => onReview(indicator, false)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-xl text-[10px] font-black uppercase border border-rose-100 hover:bg-rose-600 hover:text-white transition-all"
        >
          <XCircle size={14} /> Reject
        </button>
      </div>
    </td>
    <td className="p-5">
      <div className="font-black text-[#1a3a32] text-sm group-hover:text-[#c2a336] transition-colors line-clamp-2">
        {indicator.indicatorTitle}
      </div>
      <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase">
        Unit: {indicator.unitOfMeasure}
      </div>
    </td>
    <td className="p-5">
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-black text-gray-700">
          {indicator.category?.title}
        </span>
        <span className="text-[10px] font-bold text-gray-400 italic">
          {indicator.level2Category?.title}
        </span>
      </div>
    </td>
    <td className="p-5">
      <div className="flex items-center gap-2 text-[11px] font-bold text-gray-600 truncate max-w-[150px]">
        <Users size={12} className="text-[#c2a336] shrink-0" />
        {indicator.assignedToType === "individual"
          ? indicator.assignedTo
          : indicator.assignedGroup?.join(", ")}
      </div>
    </td>
    <td className="p-5 text-[11px] font-bold text-gray-600 whitespace-nowrap">
      <div className="flex items-center gap-1.5 mb-1">
        <Calendar size={12} className="text-emerald-500" /> Start:{" "}
        {new Date(indicator.startDate).toLocaleDateString()}
      </div>
      <div className="flex items-center gap-1.5 text-rose-500">
        <Calendar size={12} /> Due:{" "}
        {new Date(indicator.dueDate).toLocaleDateString()}
      </div>
    </td>
  </tr>
);

const IndicatorCard = ({
  indicator,
  processingId,
  onReview,
}: {
  indicator: IIndicator;
  processingId: string | null;
  onReview: any;
}) => (
  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
    <div className="flex justify-between items-start gap-4">
      <div>
        <h3 className="font-black text-[#1a3a32] leading-tight text-lg mb-1">
          {indicator.indicatorTitle}
        </h3>
        <p className="text-[10px] font-bold text-gray-400 uppercase">
          Unit: {indicator.unitOfMeasure}
        </p>
      </div>
      <button
        onClick={() => (window.location.href = `/indicators/${indicator._id}`)}
        className="p-3 text-gray-400 hover:text-[#1a3a32] bg-gray-50 rounded-2xl border border-gray-100 shadow-sm"
      >
        <Eye size={20} />
      </button>
    </div>

    <div className="space-y-3 py-4 border-y border-gray-50">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-[#f4f0e6] rounded-lg text-[#c2a336]">
          <Info size={14} />
        </div>
        <div>
          <p className="text-[11px] font-black text-gray-700 leading-none">
            {indicator.category?.title}
          </p>
          <p className="text-[10px] font-bold text-gray-400 italic">
            {indicator.level2Category?.title}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="p-2 bg-[#f4f0e6] rounded-lg text-[#c2a336]">
          <Users size={14} />
        </div>
        <p className="text-[11px] font-bold text-gray-600">
          {indicator.assignedToType === "individual"
            ? indicator.assignedTo
            : `Group: ${indicator.assignedGroup?.join(", ")}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
          <Calendar size={14} />
        </div>
        <p className="text-[11px] font-bold text-gray-600">
          Due: {new Date(indicator.dueDate).toLocaleDateString()}
        </p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3 mt-2">
      <button
        disabled={processingId === indicator._id}
        onClick={() => onReview(indicator, true)}
        className="flex flex-1 items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
      >
        {processingId === indicator._id ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <CheckCircle2 size={16} />
        )}
        Ratify
      </button>
      <button
        disabled={processingId === indicator._id}
        onClick={() => onReview(indicator, false)}
        className="flex flex-1 items-center justify-center gap-2 py-3 bg-rose-50 text-rose-700 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-100 active:scale-95 transition-all disabled:opacity-50"
      >
        <XCircle size={16} />
        Reject
      </button>
    </div>
  </div>
);

export default SuperAdminApproved;
