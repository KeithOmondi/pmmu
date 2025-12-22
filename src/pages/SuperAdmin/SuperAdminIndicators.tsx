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
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-10">
      {/* Top Header - Optimized for mobile stacking */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs mb-2 uppercase tracking-[0.15em]">
            <Layers className="w-4 h-4" />
            Administration
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">
            Indicator Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">Configure and assign institutional performance metrics.</p>
        </div>

        <button
          onClick={() => { setEditData(null); setShowForm(true); }}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-200 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create Indicator
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 text-slate-400 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            <p className="text-sm font-medium animate-pulse">Synchronizing metrics...</p>
          </div>
        ) : (
          Object.values(groupedIndicators).map((group) => (
            <section key={group.category._id} className="mb-10 md:mb-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-8 bg-indigo-600 rounded-full" />
                <h2 className="text-lg md:text-2xl font-extrabold text-slate-800">
                  {group.category.title}
                </h2>
                <span className="px-2 py-1 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                  {group.category.code ?? "—"}
                </span>
              </div>

              {/* Responsive Container: Table on Desktop, Cards on Mobile */}
              <div className="hidden md:block">
                <IndicatorsTable rows={group.indicators} getUserName={getUserName} />
              </div>
              <div className="md:hidden space-y-4">
                {group.indicators.map(ind => (
                  <IndicatorMobileCard key={ind._id} row={ind} getUserName={getUserName} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Modal Overlay - Fullscreen on mobile, centered on desktop */}
      {showForm && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex justify-center items-end md:items-start pt-0 md:pt-10 z-[100] p-0 md:p-4 overflow-y-auto"
          onClick={() => setShowForm(false)}
        >
          <div 
            className="bg-white w-full max-w-4xl rounded-t-[2.5rem] md:rounded-3xl shadow-2xl mb-0 md:mb-10 overflow-hidden animate-in slide-in-from-bottom md:zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 w-12 bg-slate-200 rounded-full mx-auto mt-4 mb-2 md:hidden" />
            <SuperAdminForm onClose={() => setShowForm(false)} editData={editData} />
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================
    STYLES HELPER
============================================================ */
const getStatusStyles = (status: string) => {
  const styles: Record<string, string> = {
    approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
    pending: "bg-amber-50 text-amber-700 border-amber-100",
    rejected: "bg-rose-50 text-rose-700 border-rose-100",
    overdue: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return styles[status] || styles.pending;
};

/* ============================================================
    SUB-COMPONENT: MOBILE CARD
============================================================ */
const IndicatorMobileCard = ({ row, getUserName }: { row: IIndicator; getUserName: any }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm active:bg-slate-50 transition-colors">
    <div className="flex justify-between items-start mb-3">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {row.level2Category?.title || "No Subcategory"}
      </span>
      <span className={`px-2 py-0.5 text-[9px] font-black rounded-md border ${getStatusStyles(row.status)}`}>
        {row.status.toUpperCase()}
      </span>
    </div>
    
    <h3 className="font-bold text-slate-900 mb-4 leading-snug">
      {row.indicatorTitle}
    </h3>

    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
      <div>
        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Assigned To</p>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          {row.assignedToType === 'individual' ? <User size={12}/> : <Users size={12}/>}
          <span className="truncate">{row.assignedToType === 'individual' ? getUserName(row.assignedTo) : 'Group'}</span>
        </div>
      </div>
      <div>
        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Timeline</p>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
          <Clock size={12}/>
          <span>{row.dueDate ? new Date(row.dueDate).toLocaleDateString() : 'N/A'}</span>
        </div>
      </div>
    </div>
  </div>
);

/* ============================================================
    SUB-COMPONENT: DESKTOP TABLE
============================================================ */
const IndicatorsTable = ({ rows, getUserName }: { rows: IIndicator[]; getUserName: any }) => (
  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50/80 border-b border-slate-200">
          <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Subcategory</th>
          <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Indicator Detail</th>
          <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Unit</th>
          <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
          <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assigned To</th>
          <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Due Date</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((row) => (
          <tr key={row._id} className="group hover:bg-indigo-50/40 transition-colors cursor-pointer">
            <td className="px-6 py-5">
              <span className="text-slate-500 text-xs font-medium bg-slate-100 px-2 py-1 rounded">
                {row.level2Category?.title || "—"}
              </span>
            </td>
            <td className="px-6 py-5">
              <div className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                {row.indicatorTitle}
              </div>
            </td>
            <td className="px-6 py-5">
              <span className="text-slate-600 text-xs font-bold">{row.unitOfMeasure}</span>
            </td>
            <td className="px-6 py-5">
              <span className={`px-3 py-1 text-[10px] font-black rounded-full border ${getStatusStyles(row.status)}`}>
                {row.status.toUpperCase()}
              </span>
            </td>
            <td className="px-6 py-5">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-xs">
                {row.assignedToType === "individual" ? (
                  <><User className="w-3.5 h-3.5 text-indigo-400" /> {getUserName(row.assignedTo)}</>
                ) : (
                  <><Users className="w-3.5 h-3.5 text-indigo-400" /> Group</>
                )}
              </div>
            </td>
            <td className="px-6 py-5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
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