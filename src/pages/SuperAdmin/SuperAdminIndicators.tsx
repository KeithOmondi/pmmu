import React, { useEffect, useMemo, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Loader2, Plus, User, Layers, Edit3, Trash2 } from "lucide-react";

import {
  fetchAllIndicatorsForAdmin,
  selectAllIndicators,
  selectIndicatorsLoading,
  selectIndicatorsError,
  clearMessages,
  deleteIndicator,
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
import EditIndicatorModal from "./EditIndicatorModal";

/* --- Logic Utilities --- */
const getEffectiveStatus = (row: IIndicator) => {
  const now = Date.now();
  const dueTime = row.dueDate ? new Date(row.dueDate).getTime() : Infinity;
  if (row.status === "approved" || row.status === "completed")
    return row.status;
  if (dueTime < now) return "overdue";
  return row.status;
};

const getStatusStyles = (status: string) => {
  const styles: Record<string, string> = {
    approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
    completed: "bg-green-50 text-green-700 border-green-200",
    pending: "bg-[#c2a336]/10 text-[#a88a2d] border-[#c2a336]/20",
    rejected: "bg-rose-50 text-rose-700 border-rose-100",
    overdue: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return styles[status] || styles.pending;
};

const SuperAdminIndicators: React.FC = () => {
  const dispatch = useAppDispatch();
  const [showForm, setShowForm] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState<IIndicator | null>(
    null,
  );

  const indicators = useAppSelector(selectAllIndicators);
  const indicatorsLoading = useAppSelector(selectIndicatorsLoading);
  const indicatorsError = useAppSelector(selectIndicatorsError);
  const categories = useAppSelector(selectAllCategories);
  const categoriesLoading = useAppSelector(selectCategoriesLoading);
  const users = useAppSelector(selectAllUsers);
  const usersLoading = useAppSelector(selectUsersLoading);

  const isLoading = indicatorsLoading || categoriesLoading || usersLoading;

  // Memoized load function to prevent re-renders and allow calling after mutations
  const loadData = useCallback(() => {
    dispatch(fetchAllIndicatorsForAdmin());
    dispatch(fetchCategories());
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (indicatorsError) {
      toast.error(indicatorsError);
      dispatch(clearMessages());
    }
  }, [indicatorsError, dispatch]);

  const handleEdit = (indicator: IIndicator) => {
    setSelectedIndicator(indicator);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Purge "${title}" from the registry?`)) {
      try {
        await dispatch(deleteIndicator(id)).unwrap();
        toast.success("Indicator removed.");
        loadData(); // Re-fetch after delete
      } catch (err: any) {
        toast.error(err || "Deletion failed.");
      }
    }
  };

  const groupedIndicators = useMemo(() => {
    const result: Record<string, { category: any; indicators: IIndicator[] }> = {};

    indicators.forEach((ind) => {
      const category = ind.category ?? null;
      
      // 1. Determine the category object
      const level1Category =
        category && categories.some((c) => c._id === (category._id || category))
          ? category
          : { _id: "uncategorized", title: "Uncategorized", code: "N/A" };

      // 2. Ensure catId is strictly a string to satisfy the Index Type requirement
      const catId: string = typeof level1Category === 'string' 
        ? level1Category 
        : level1Category._id;

      // 3. Grouping logic
      if (!result[catId]) {
        result[catId] = { category: level1Category, indicators: [] };
      }
      result[catId].indicators.push(ind);
    });

    return result;
  }, [indicators, categories]);

  const getUserName = (row: IIndicator): string => {
    if (row.assignedToType === "individual") {
      if (!row.assignedTo) return "N/A";
      const userId = (row.assignedTo as any)._id || row.assignedTo;
      const user = users.find((u) => u._id === userId);
      return user ? user.name : "Unknown User";
    }
    if (row.assignedToType === "group") {
      if (!row.assignedGroup || row.assignedGroup.length === 0) return "N/A";
      return row.assignedGroup
        .map((g: any) => {
          const id = g._id || g;
          return users.find((u) => u._id === id)?.name || "Unknown";
        })
        .join(", ");
    }
    return "N/A";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 text-[#c2a336] font-black text-[10px] mb-2 uppercase tracking-[0.2em]">
            <Layers className="w-3 h-3" /> Registry Management (
            {categories.length})
          </div>
          <h1 className="text-3xl font-black text-[#1a3a32] tracking-tight">
            Indicators
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            View all Assigned Indicators
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-[#1a3a32] hover:bg-[#142d26] text-white rounded-xl font-bold transition-all shadow-xl shadow-[#1a3a32]/10 active:scale-95 text-sm uppercase tracking-widest"
        >
          <Plus className="w-4 h-4 text-[#c2a336]" /> Create Indicator
        </button>
      </header>

      <main className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 text-slate-400 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#c2a336]" />
            <p className="text-[10px] font-black uppercase tracking-widest animate-pulse text-[#1a3a32]">
              Synchronizing registry...
            </p>
          </div>
        ) : (
          Object.values(groupedIndicators).map((group) => (
            <section
              key={group.category._id || group.category}
              className="mb-12"
            >
              <div className="flex items-center justify-between mb-6 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#1a3a32] rounded-xl flex items-center justify-center text-[#c2a336] shadow-lg">
                    <span className="font-black text-xs">
                      {group.category.code || "ID"}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-[#1a3a32] uppercase tracking-tight">
                    {group.category.title}
                  </h2>
                </div>
                <span className="px-3 py-1 bg-white border border-slate-200 text-slate-400 rounded-full text-[10px] font-black">
                  {group.indicators.length} ITEMS
                </span>
              </div>

              <div className="hidden lg:block">
                <IndicatorsTable
                  rows={group.indicators}
                  getUserName={getUserName}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
              <div className="lg:hidden space-y-4">
                {group.indicators.map((ind) => (
                  <IndicatorMobileCard
                    key={ind._id}
                    row={ind}
                    getUserName={getUserName}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {showForm && (
        <div
          className="fixed inset-0 bg-[#1a3a32]/40 backdrop-blur-sm flex justify-center items-center z-[100] p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <SuperAdminForm
              onClose={() => {
                setShowForm(false);
                loadData();
              }}
              editData={null}
            />
          </div>
        </div>
      )}

      {selectedIndicator && (
        <EditIndicatorModal
          indicator={selectedIndicator}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedIndicator(null);
          }}
          onSuccess={loadData} // Triggers refresh after edit success
        />
      )}
    </div>
  );
};

/* --- Sub-Components --- */

const IndicatorMobileCard: React.FC<{
  row: IIndicator;
  getUserName: (row: IIndicator) => string;
  onEdit: (row: IIndicator) => void;
  onDelete: (id: string, title: string) => void;
}> = ({ row, getUserName, onEdit, onDelete }) => {
  const status = getEffectiveStatus(row);
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-[#c2a336]/50 transition-all">
      <div className="flex justify-between items-start mb-4">
        <span className="px-2 py-1 bg-slate-50 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest border border-slate-100">
          {(row.level2Category as any)?.title || "Standard"}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(row)}
            className="p-1 text-slate-400 hover:text-[#1a3a32]"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => onDelete(row._id, row.indicatorTitle)}
            className="p-1 text-slate-400 hover:text-rose-500"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <h3 className="font-bold text-[#1a3a32] mb-5 leading-snug">
        {row.indicatorTitle}
      </h3>
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
        <div>
          <p className="text-[9px] text-slate-400 uppercase font-black mb-1">
            Assigned
          </p>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 truncate">
            <User size={12} className="text-[#c2a336]" /> {getUserName(row)}
          </div>
        </div>
        <div>
          <p className="text-[9px] text-slate-400 uppercase font-black mb-1">
            Status
          </p>
          <span
            className={`px-2 py-0.5 text-[8px] font-black rounded border uppercase tracking-widest ${getStatusStyles(status)}`}
          >
            {status}
          </span>
        </div>
      </div>
    </div>
  );
};

const IndicatorsTable: React.FC<{
  rows: IIndicator[];
  getUserName: (row: IIndicator) => string;
  onEdit: (row: IIndicator) => void;
  onDelete: (id: string, title: string) => void;
}> = ({ rows, getUserName, onEdit, onDelete }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200">
          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Hierarchy
          </th>
          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Indicator Metric
          </th>
          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
            UOM
          </th>
          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Status
          </th>
          <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Assignee
          </th>
          <th className="px-6 py-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((row) => {
          const status = getEffectiveStatus(row);
          return (
            <tr
              key={row._id}
              className="group hover:bg-[#1a3a32]/[0.02] transition-colors"
            >
              <td className="px-6 py-5">
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  {(row.level2Category as any)?.title || "—"}
                </span>
              </td>
              <td className="px-6 py-5 font-bold text-[#1a3a32] group-hover:text-[#c2a336] max-w-xs truncate">
                {row.indicatorTitle}
              </td>
              <td className="px-6 py-5 text-slate-500 text-[10px] font-black">
                {row.unitOfMeasure}
              </td>
              <td className="px-6 py-5">
                <span
                  className={`px-2.5 py-1 text-[9px] font-black rounded-full border uppercase tracking-widest ${getStatusStyles(status)}`}
                >
                  {status}
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-2 text-[#1a3a32] font-bold text-xs">
                  <User className="w-3.5 h-3.5 text-[#c2a336]" />{" "}
                  {getUserName(row)}
                </div>
              </td>
              <td className="px-6 py-5">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => onEdit(row)}
                    className="p-2 text-slate-300 hover:text-[#1a3a32] transition-all"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(row._id, row.indicatorTitle)}
                    className="p-2 text-slate-300 hover:text-rose-600 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default SuperAdminIndicators;
