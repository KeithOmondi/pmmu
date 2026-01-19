// src/pages/User/UserIndicators.tsx
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
  Calendar,
  ChevronRight,
  TrendingUp,
  Target,
} from "lucide-react";

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

  // Final statuses prioritized
  if (indicator.status === "approved" || indicator.status === "completed")
    return "approved";
  if (indicator.status === "rejected") return "rejected";
  if (indicator.status === "submitted") return "submitted";

  // Logical time-based statuses
  if (now < startTime) return "pending";
  if (now > dueTime && indicator.progress < 100) return "overdue";

  return "ongoing";
};

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
        .filter(Boolean) as string[]
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

  const renderNode = (node: TreeNode, depth = 0) => (
    <div key={node.id} className="mb-10 last:mb-0">
      <div
        className="flex items-center gap-4 mb-6"
        style={{ paddingLeft: depth * 24 }}
      >
        <div
          className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl ${
            depth === 0
              ? "bg-[#1a3a32] text-white shadow-xl shadow-[#1a3a32]/10"
              : "bg-white text-[#1a3a32] border border-gray-100 shadow-sm"
          }`}
        >
          <Layers
            size={depth === 0 ? 18 : 14}
            className={depth === 0 ? "text-[#c2a336]" : "text-[#c2a336]"}
          />
          <h3
            className={`font-black uppercase tracking-widest ${
              depth === 0 ? "text-xs" : "text-[10px]"
            }`}
          >
            {node.title}
          </h3>
          <span
            className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
              depth === 0
                ? "bg-white/10 text-white"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {node.indicators.length}
          </span>
        </div>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
      </div>

      {node.indicators.length > 0 && (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          style={{ marginLeft: (depth + 1) * 24 }}
        >
          {node.indicators.map((i) => {
            const status = getLiveStatus(i);
            return (
              <div
                key={i._id}
                onClick={() => navigate(`/user/indicators/${i._id}`)}
                className="group relative bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-[#1a3a32]/5 transition-all cursor-pointer overflow-hidden"
              >
                {/* Background Decoration */}
                <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                  <Target size={120} />
                </div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${STATUS_STYLES[status]}`}
                    >
                      {status}
                    </span>
                    <ChevronRight
                      size={16}
                      className="text-gray-300 group-hover:text-[#c2a336] transition-colors"
                    />
                  </div>

                  <h4 className="font-black text-[#1a3a32] text-sm leading-snug mb-4 min-h-[40px] line-clamp-2 group-hover:text-[#c2a336] transition-colors">
                    {i.indicatorTitle}
                  </h4>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter flex items-center gap-1">
                          <Calendar size={10} /> Deadline
                        </p>
                        <p className="text-[10px] font-bold text-[#1a3a32]">
                          {new Date(i.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                          Current Audit
                        </p>
                        <p className="text-sm font-black text-[#1a3a32]">
                          {i.progress}%
                        </p>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                      <div
                        className="h-full bg-[#1a3a32] rounded-full transition-all duration-1000 group-hover:bg-[#c2a336]"
                        style={{ width: `${i.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {Object.values(node.children).map((child) =>
        renderNode(child, depth + 1)
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
              <ShieldCheck size={16} /> Secure Personnel Access
            </div>
            <h1 className="text-4xl font-black text-[#1a3a32] tracking-tighter leading-tight">
              Indicator <span className="text-gray-300">Registry</span>
            </h1>
          </div>
          <div className="bg-[#1a3a32] text-white p-6 rounded-[2.5rem] shadow-2xl shadow-[#1a3a32]/20 flex items-center gap-8 min-w-[240px]">
            <div>
              <p className="text-[#c2a336] text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                Active Metrics
              </p>
              <p className="text-3xl font-black leading-none">
                {indicators.length}
              </p>
            </div>
            <div className="h-10 w-[1px] bg-white/10" />
            <TrendingUp size={24} className="text-[#c2a336]" />
          </div>
        </header>

        <main>{Object.values(tree).map((node) => renderNode(node))}</main>
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
      Decrypting Portfolio...
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
        Void Registry
      </h3>
      <p className="text-[#8c94a4] text-sm leading-relaxed font-medium">
        No performance indicators have been assigned to this terminal.
      </p>
    </div>
  </div>
);

export default UserIndicators;
