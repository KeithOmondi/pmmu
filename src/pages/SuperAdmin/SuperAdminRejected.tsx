import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchUsers,
  selectAllUsers,
  type IUser,
} from "../../store/slices/userSlice";
import {
  fetchAllIndicatorsForAdmin,
  selectAllIndicators,
  selectIndicatorsLoading,
  type IIndicator,
} from "../../store/slices/indicatorsSlice";
import {
  Loader2,
  Eye,
  XCircle,
  AlertOctagon,
  History,
  UserX,
  X,
  FileText,
  MessageSquare,
  Calendar,
} from "lucide-react";

const SuperAdminRejected: React.FC = () => {
  const dispatch = useAppDispatch();
  const indicators = useAppSelector(selectAllIndicators);
  const loading = useAppSelector(selectIndicatorsLoading);
  const allUsers = useAppSelector(selectAllUsers) as IUser[];

  const [selectedIndicator, setSelectedIndicator] = useState<IIndicator | null>(
    null
  );

  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
    dispatch(fetchUsers());
  }, [dispatch]);

  const rejectedIndicators = useMemo(
    () => indicators.filter((i) => i.status === "rejected"),
    [indicators]
  );

  // Helper to find name by ID (used for both AssignedTo and ReviewedBy)
  const getNameFromId = (id: string | null) => {
    if (!id) return "System/Unknown";
    const found = allUsers.find((u) => u._id === id);
    return found ? found.name : `ID: ${id.substring(0, 5)}...`;
  };

  if (loading && !indicators.length) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] text-[#1a3a32]">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#c2a336]" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">
          Loading Rejected Protocols...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-10 bg-[#f8f9fa]">
      {/* Header */}
      <div className="mb-6 lg:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-rose-600 mb-2 font-black uppercase tracking-[0.2em] text-[10px]">
            <AlertOctagon size={14} /> Audit Trail: Failed Reviews
          </div>
          <h1 className="text-2xl sm:text-2xl font-black text-[#1a3a32] tracking-tighter leading-tight">
            Rejected Indicators
          </h1>
        </div>

        <div className="bg-white px-6 py-4 rounded-2xl border border-rose-100 shadow-sm flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Rejected Count
            </p>
            <p className="text-xl font-black text-rose-600">
              {rejectedIndicators.length}
            </p>
          </div>
          <XCircle className="text-rose-500" size={28} />
        </div>
      </div>

      {/* Grid List */}
      {!rejectedIndicators.length ? (
        <div className="bg-white rounded-[2rem] border border-gray-100 p-20 text-center shadow-sm">
          <History className="mx-auto text-gray-200 mb-4" size={48} />
          <p className="text-[#1a3a32] font-black italic">
            No rejection history found.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rejectedIndicators.map((i) => (
            <div
              key={i._id}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 group hover:border-rose-200 transition-all"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-black text-[#1a3a32] leading-tight">
                    {i.indicatorTitle}
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                      Owner: {getNameFromId(i.assignedTo)}
                    </p>
                    <span className="text-[10px] text-gray-300">|</span>
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tighter flex items-center gap-1">
                      <UserX size={10} /> Rejected by:{" "}
                      {getNameFromId(i.reviewedBy)}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedIndicator(i)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 text-[#1a3a32] text-[11px] font-black uppercase rounded-xl hover:bg-rose-600 hover:text-white transition-all"
              >
                <Eye size={14} /> View Reason
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedIndicator && (
        <RejectionModal
          indicator={selectedIndicator}
          onClose={() => setSelectedIndicator(null)}
          reviewerName={getNameFromId(selectedIndicator.reviewedBy)}
        />
      )}
    </div>
  );
};

/* --- REJECTION MODAL --- */
const RejectionModal = ({ indicator, onClose, reviewerName }: any) => (
  <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
    <div
      className="absolute inset-0 bg-[#1a3a32]/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    />
    <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
      <div className="bg-rose-600 p-8 text-white flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 text-rose-200 mb-1 font-black uppercase tracking-widest text-[10px]">
            <AlertOctagon size={14} /> Rejection Report
          </div>
          <h3 className="text-2xl font-black leading-tight">
            {indicator.indicatorTitle}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full"
        >
          <X size={24} />
        </button>
      </div>

      <div className="p-8 space-y-6">
        {/* Reviewer Info */}
        <div className="flex items-center justify-between p-4 bg-rose-50 rounded-2xl border border-rose-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-600 flex items-center justify-center text-white">
              <UserX size={18} />
            </div>
            <div>
              <p className="text-[10px] font-black text-rose-400 uppercase">
                Rejected By
              </p>
              <p className="text-sm font-bold text-[#1a3a32]">{reviewerName}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-rose-400 uppercase">
              Review Date
            </p>
            <p className="text-sm font-bold text-[#1a3a32]">
              {indicator.reviewedAt
                ? new Date(indicator.reviewedAt).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>

        {/* Notes/Reason Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <MessageSquare size={14} /> Official Remarks
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 min-h-[100px]">
            {indicator.notes && indicator.notes.length > 0 ? (
              <div className="space-y-4">
                {indicator.notes.map((note: any, idx: number) => (
                  <p
                    key={idx}
                    className="text-sm text-gray-700 leading-relaxed italic"
                  >
                    "
                    {typeof note === "string"
                      ? note
                      : note.text || JSON.stringify(note)}
                    "
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                No specific rejection notes were provided.
              </p>
            )}
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1">
              <Calendar size={10} /> Original Due Date
            </p>
            <p className="text-xs font-bold text-gray-700 mt-1">
              {new Date(indicator.dueDate).toLocaleDateString()}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase">
              Last Progress
            </p>
            <p className="text-xs font-bold text-gray-700 mt-1">
              {indicator.progress}% complete
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
        <button
          onClick={onClose}
          className="px-8 py-3 bg-[#1a3a32] text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-[#c2a336] transition-all"
        >
          Close Dossier
        </button>
      </div>
    </div>
  </div>
);

export default SuperAdminRejected;
