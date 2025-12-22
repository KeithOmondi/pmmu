import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { 
  Loader2,  
  Plus, 
  User, 
  Users, 
  Clock, 
  Layers,
} from "lucide-react";

import {
  fetchAllIndicatorsForAdmin,
  selectAllIndicators,
  selectIndicatorsLoading,
  selectIndicatorsError,
  clearMessages,
  type IIndicator,
} from "../../store/slices/indicatorsSlice";

import {
  fetchCategories,
  selectAllCategories,
  selectCategoriesLoading,
} from "../../store/slices/categoriesSlice";

import {
  fetchUsers,
  selectAllUsers,
  selectUsersLoading,
} from "../../store/slices/userSlice";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import SuperAdminForm from "./SuperAdminForm";

interface GroupedIndicators {
  category: {
    _id: string;
    title: string;
    code?: string;
  };
  indicators: IIndicator[];
}

const SuperAdminIndicators: React.FC = () => {
  const dispatch = useAppDispatch();
  const [showForm, setShowForm] = useState(false);
  const [editData, setEditData] = useState<IIndicator | null>(null);

  const indicators = useAppSelector(selectAllIndicators);
  const indicatorsLoading = useAppSelector(selectIndicatorsLoading);
  const indicatorsError = useAppSelector(selectIndicatorsError);
  const categories = useAppSelector(selectAllCategories);
  const categoriesLoading = useAppSelector(selectCategoriesLoading);
  const users = useAppSelector(selectAllUsers);
  const usersLoading = useAppSelector(selectUsersLoading);

  const isLoading = indicatorsLoading || categoriesLoading || usersLoading;

  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
    dispatch(fetchCategories());
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (indicatorsError) {
      toast.error(indicatorsError);
      dispatch(clearMessages());
    }
  }, [indicatorsError, dispatch]);

  const groupedIndicators = useMemo<Record<string, GroupedIndicators>>(() => {
    const result: Record<string, GroupedIndicators> = {};
    indicators.forEach((ind) => {
      const category = ind.category ?? null;
      const level1Category = category && categories.some((c) => c._id === category._id)
        ? category
        : { _id: "uncategorized", title: "Uncategorized", code: "N/A" };

      if (!result[level1Category._id]) {
        result[level1Category._id] = { category: level1Category, indicators: [] };
      }
      result[level1Category._id].indicators.push(ind);
    });
    return result;
  }, [indicators, categories]);

  const getUserName = (userId?: string | null) => {
    if (!userId) return "N/A";
    const user = users.find((u) => u._id === userId);
    return user ? user.name : "Unknown User";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      {/* Institutional Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 text-[#c2a336] font-black text-[10px] mb-2 uppercase tracking-[0.2em]">
            <Layers className="w-3 h-3" />
            Registry Management
          </div>
          <h1 className="text-3xl font-black text-[#1a3a32] tracking-tight">
            Institutional Indicators
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">Configure and assign institutional performance metrics.</p>
        </div>

        <button
          onClick={() => { setEditData(null); setShowForm(true); }}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1a3a32] hover:bg-[#142d26] text-white rounded-xl font-bold transition-all shadow-xl shadow-[#1a3a32]/10 active:scale-95 text-sm uppercase tracking-widest"
        >
          <Plus className="w-4 h-4 text-[#c2a336]" />
          Create Indicator
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 text-slate-400 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#c2a336]" />
            <p className="text-[10px] font-black uppercase tracking-widest animate-pulse text-[#1a3a32]">Synchronizing registry...</p>
          </div>
        ) : (
          Object.values(groupedIndicators).map((group) => (
            <section key={group.category._id} className="mb-12">
              <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#1a3a32] rounded-xl flex items-center justify-center text-[#c2a336] shadow-lg">
                        <span className="font-black text-xs">{group.category.code || "ID"}</span>
                    </div>
                    <h2 className="text-xl font-black text-[#1a3a32] uppercase tracking-tight">
                    {group.category.title}
                    </h2>
                </div>
                <span className="px-3 py-1 bg-white border border-slate-200 text-slate-400 rounded-full text-[10px] font-black">
                  {group.indicators.length} ITEMS
                </span>
              </div>

              {/* Responsive Container */}
              <div className="hidden lg:block">
                <IndicatorsTable rows={group.indicators} getUserName={getUserName} />
              </div>
              <div className="lg:hidden space-y-4">
                {group.indicators.map(ind => (
                  <IndicatorMobileCard key={ind._id} row={ind} getUserName={getUserName} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Form Modal */}
      {showForm && (
        <div 
          className="fixed inset-0 bg-[#1a3a32]/40 backdrop-blur-sm flex justify-center items-center z-[100] p-4"
          onClick={() => setShowForm(false)}
        >
          <div 
            className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <SuperAdminForm onClose={() => setShowForm(false)} editData={editData} />
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================
    STATUS STYLING (Judiciary Palette)
============================================================ */
const getStatusStyles = (status: string) => {
  const styles: Record<string, string> = {
    approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
    pending: "bg-[#c2a336]/10 text-[#a88a2d] border-[#c2a336]/20",
    rejected: "bg-rose-50 text-rose-700 border-rose-100",
    overdue: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return styles[status] || styles.pending;
};

/* ============================================================
    SUB-COMPONENT: MOBILE CARD
============================================================ */
const IndicatorMobileCard = ({ row, getUserName }: { row: IIndicator; getUserName: any }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-[#c2a336]/50 transition-all">
    <div className="flex justify-between items-start mb-4">
      <span className="px-2 py-1 bg-slate-50 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest border border-slate-100">
        {row.level2Category?.title || "Standard"}
      </span>
      <span className={`px-2 py-0.5 text-[9px] font-black rounded border uppercase tracking-widest ${getStatusStyles(row.status)}`}>
        {row.status}
      </span>
    </div>
    
    <h3 className="font-bold text-[#1a3a32] mb-5 leading-snug">
      {row.indicatorTitle}
    </h3>

    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
      <div>
        <p className="text-[9px] text-slate-400 uppercase font-black tracking-tighter mb-1">Assigned Personnel</p>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <User size={12} className="text-[#c2a336]"/>
          <span className="truncate">{row.assignedToType === 'individual' ? getUserName(row.assignedTo) : 'Registry Group'}</span>
        </div>
      </div>
      <div>
        <p className="text-[9px] text-slate-400 uppercase font-black tracking-tighter mb-1">Due Date</p>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Clock size={12} className="text-[#c2a336]"/>
          <span className="tabular-nums">{row.dueDate ? new Date(row.dueDate).toLocaleDateString() : 'N/A'}</span>
        </div>
      </div>
    </div>
  </div>
);

/* ============================================================
    SUB-COMPONENT: DESKTOP TABLE
============================================================ */
const IndicatorsTable = ({ rows, getUserName }: { rows: IIndicator[]; getUserName: any }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200">
          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Hierarchy</th>
          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Indicator Metric</th>
          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">UOM</th>
          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Assignee</th>
          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Deadline</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((row) => (
          <tr key={row._id} className="group hover:bg-[#1a3a32]/[0.02] transition-colors cursor-pointer">
            <td className="px-6 py-5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                {row.level2Category?.title || "—"}
              </span>
            </td>
            <td className="px-6 py-5">
              <div className="font-bold text-[#1a3a32] group-hover:text-[#c2a336] transition-colors leading-tight max-w-xs">
                {row.indicatorTitle}
              </div>
            </td>
            <td className="px-6 py-5">
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-tighter">{row.unitOfMeasure}</span>
            </td>
            <td className="px-6 py-5">
              <span className={`px-2.5 py-1 text-[9px] font-black rounded-full border uppercase tracking-widest ${getStatusStyles(row.status)}`}>
                {row.status}
              </span>
            </td>
            <td className="px-6 py-5">
              <div className="flex items-center gap-2 text-[#1a3a32] font-bold text-xs">
                {row.assignedToType === "individual" ? (
                  <><User className="w-3.5 h-3.5 text-[#c2a336]" /> {getUserName(row.assignedTo)}</>
                ) : (
                  <><Users className="w-3.5 h-3.5 text-[#c2a336]" /> Registry Group</>
                )}
              </div>
            </td>
            <td className="px-6 py-5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-slate-300" />
                {row.dueDate ? new Date(row.dueDate).toLocaleDateString() : 'N/A'}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default SuperAdminIndicators;