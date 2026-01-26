import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchUserIndicators,
  selectUserIndicators,
  selectIndicatorsLoading,
  type IIndicator,
} from "../../store/slices/indicatorsSlice";
import {
  fetchCategories,
  selectAllCategories,
  type ICategory,
} from "../../store/slices/categoriesSlice";
import {
  Loader2,
  FolderOpen,
  Layers,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Calendar,
  Hash,
  Activity,
} from "lucide-react";

/* --- TYPES & CONSTANTS --- */
interface TreeNode {
  id: string;
  title: string;
  level: number;
  children: Record<string, TreeNode>;
  indicators: IIndicator[];
}

const STATUS_STYLES: Record<string, string> = {
  submitted: "bg-purple-50 text-purple-700 border-purple-100",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  rejected: "bg-rose-50 text-rose-700 border-rose-100",
  ongoing: "bg-blue-50 text-blue-700 border-blue-100",
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  overdue: "bg-red-50 text-red-700 border-red-100",
};

const getLiveStatus = (indicator: IIndicator) => {
  const now = Date.now();
  const startTime = new Date(indicator.startDate).getTime();
  const dueTime = new Date(indicator.dueDate).getTime();

  if (indicator.status === "approved" || indicator.status === "completed")
    return "approved";
  if (indicator.status === "rejected") return "rejected";
  if (indicator.status === "submitted") return "submitted";
  if (now < startTime) return "pending";
  if (now > dueTime && indicator.progress < 100) return "overdue";
  return "ongoing";
};

/* --- MAIN COMPONENT --- */
const UserIndicators: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const indicators = useAppSelector(selectUserIndicators);
  const categories = useAppSelector(selectAllCategories);
  const loading = useAppSelector(selectIndicatorsLoading);

  useEffect(() => {
    dispatch(fetchUserIndicators());
    dispatch(fetchCategories());
  }, [dispatch]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, ICategory>();
    categories.forEach((c) => map.set(c._id, c));
    return map;
  }, [categories]);

  const tree = useMemo<Record<string, TreeNode>>(() => {
    const root: Record<string, TreeNode> = {};
    if (!categories.length || !indicators.length) return root;

    const usedCategoryIds = new Set(
      indicators
        .map((ind) => ind.level2Category?._id)
        .filter(Boolean) as string[],
    );

    const filteredCategories = categories.filter((cat) => {
      let current: ICategory | undefined = cat;
      while (current) {
        if (usedCategoryIds.has(current._id)) return true;
        current = current.parent ? categoryMap.get(current.parent) : undefined;
      }
      return false;
    });

    const ensureNode = (cat: ICategory): TreeNode => {
      if (root[cat._id]) return root[cat._id];
      const node: TreeNode = {
        id: cat._id,
        title: cat.title,
        level: cat.level,
        children: {},
        indicators: [],
      };
      if (!cat.parent) {
        root[cat._id] = node;
        return node;
      }
      const parent = categoryMap.get(cat.parent);
      if (parent) {
        const parentNode = ensureNode(parent);
        parentNode.children[cat._id] = node;
      }
      return node;
    };

    filteredCategories.forEach((c) => ensureNode(c));

    const findDeepestChild = (node: TreeNode): TreeNode => {
      const children = Object.values(node.children);
      if (!children.length) return node;
      return findDeepestChild(children[0]);
    };

    indicators.forEach((ind) => {
      const lvl2Id = ind.level2Category?._id;
      if (!lvl2Id) return;
      const lvl2Category = categoryMap.get(lvl2Id);
      if (!lvl2Category) return;
      const baseNode = ensureNode(lvl2Category);
      const targetNode = findDeepestChild(baseNode);
      targetNode.indicators.push(ind);
    });

    return root;
  }, [categories, indicators, categoryMap]);

  /* --- RECURSIVE RENDERER --- */
  const renderNode = (node: TreeNode, depth = 0) => (
    <div key={node.id} className="mb-10 last:mb-0">
      {/* Table Header / Category Label */}
      <div
        className="flex items-center gap-4 mb-4"
        style={{ paddingLeft: depth * 24 }}
      >
        <div
          className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-all shadow-sm ${
            depth === 0
              ? "bg-[#1a3a32] text-white"
              : "bg-white text-[#1a3a32] border border-gray-100"
          }`}
        >
          <Layers size={14} className="text-[#c2a336]" />
          <h3
            className={`font-black uppercase tracking-[0.2em] ${depth === 0 ? "text-[11px]" : "text-[9px]"}`}
          >
            {node.title}
          </h3>
          <span
            className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
              depth === 0
                ? "bg-white/10 text-white"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {node.indicators.length}
          </span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
      </div>

      {/* Indicator Table */}
      {node.indicators.length > 0 && (
        <div
          className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden mb-8"
          style={{ marginLeft: (depth + 1) * 24 }}
        >
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400">
                  <div className="flex items-center gap-2">
                    <Activity size={12} /> Performance Metric
                  </div>
                </th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 w-32 text-center">
                  Status
                </th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 w-36 text-center">
                  Deadline
                </th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-gray-400 w-48">
                  Audit Progress
                </th>
                <th className="px-6 py-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {node.indicators.map((i) => {
                const status = getLiveStatus(i);
                return (
                  <tr
                    key={i._id}
                    onClick={() => navigate(`/user/indicators/${i._id}`)}
                    className="group hover:bg-gray-50/80 transition-all cursor-pointer"
                  >
                    <td className="px-6 py-5">
                      <p className="font-bold text-[#1a3a32] text-sm leading-snug group-hover:text-[#c2a336] transition-colors">
                        {i.indicatorTitle}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Hash size={10} className="text-gray-300" />
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                          Index-{i._id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${STATUS_STYLES[status]}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[11px] font-black text-[#1a3a32]">
                          {new Date(i.dueDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                        <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                          <Calendar size={10} />{" "}
                          {new Date(i.dueDate).getFullYear()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1a3a32] rounded-full transition-all duration-1000 group-hover:bg-[#c2a336]"
                            style={{ width: `${i.progress}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-black text-[#1a3a32] tabular-nums">
                          {i.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <ChevronRight
                        size={14}
                        className="text-gray-200 group-hover:text-[#c2a336] group-hover:translate-x-1 transition-all"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Recursive Render */}
      {Object.values(node.children).map((child) =>
        renderNode(child, depth + 1),
      )}
    </div>
  );

  if (loading) return <LoadingState />;
  if (!indicators.length) return <EmptyState />;

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6 md:p-10 lg:p-14">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-gray-200 pb-12">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#c2a336] text-[10px] font-black uppercase tracking-[0.3em]">
              <ShieldCheck size={16} /> Centralized Audit Registry
            </div>
            <h1 className="text-4xl font-black text-[#1a3a32] tracking-tighter leading-tight">
              Indicator{" "}
              <span className="text-gray-300 font-light italic">Ledger</span>
            </h1>
          </div>

          <div className="bg-[#1a3a32] text-white p-6 rounded-[2rem] shadow-xl flex items-center gap-8 min-w-[280px] relative overflow-hidden group">
            <TrendingUp className="absolute -right-2 -bottom-2 text-white/5 w-24 h-24" />
            <div className="relative z-10">
              <p className="text-[#c2a336] text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                Total Benchmarks
              </p>
              <p className="text-4xl font-black leading-none">
                {indicators.length}
              </p>
            </div>
            <div className="h-10 w-[1px] bg-white/10 relative z-10" />
            <div className="relative z-10">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                Global Avg
              </p>
              <p className="text-xl font-black text-[#c2a336]">
                {Math.round(
                  indicators.reduce((acc, i) => acc + i.progress, 0) /
                    indicators.length,
                )}
                %
              </p>
            </div>
          </div>
        </header>

        <main className="pb-20">
          {Object.values(tree).map((node) => renderNode(node))}
        </main>
      </div>
    </div>
  );
};

/* --- SUB-COMPONENTS --- */
const LoadingState = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-[#f8f9fa] p-4 text-center">
    <div className="relative">
      <Loader2 className="w-14 h-14 animate-spin text-[#1a3a32]" />
      <ShieldCheck
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#c2a336]"
        size={16}
      />
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#8c94a4] mt-6">
      Decrypting Ledger...
    </p>
  </div>
);

const EmptyState = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-6">
    <div className="max-w-md w-full bg-white p-12 rounded-[3rem] border border-gray-100 shadow-xl text-center">
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
        <FolderOpen className="w-10 h-10 text-gray-200" />
      </div>
      <h3 className="font-black text-[#1a3a32] text-2xl tracking-tight mb-3">
        No Data Found
      </h3>
      <p className="text-[#8c94a4] text-sm leading-relaxed font-medium uppercase tracking-tighter">
        Your indicator registry is currently unassigned.
      </p>
    </div>
  </div>
);

export default UserIndicators;
