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
} from "lucide-react";

/* =========================
   TYPES
========================= */
interface TreeNode {
  id: string;
  title: string;
  level: number;
  children: Record<string, TreeNode>;
  indicators: IIndicator[];
}

/* =========================
   COMPONENT
========================= */
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f8f9fa] p-4 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#1a3a32] mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8c94a4]">
          Syncing Records...
        </p>
      </div>
    );
  }

  if (!indicators.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-6 md:p-10">
        <div className="max-w-md w-full bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-xl shadow-black/5 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-[#f8f9fa] rounded-full flex items-center justify-center mx-auto mb-6">
            <FolderOpen className="w-8 h-8 md:w-10 md:h-10 text-gray-200" />
          </div>
          <h3 className="font-black text-[#1a3a32] text-xl md:text-2xl tracking-tight mb-2">
            Registry Clear
          </h3>
          <p className="text-[#8c94a4] text-sm leading-relaxed">
            No performance indicators have been assigned to your profile.
          </p>
        </div>
      </div>
    );
  }

  const renderNode = (node: TreeNode, depth = 0) => (
    <div key={node.id} className="mb-6 last:mb-0">
      {/* Category Header */}
      <div
        className="flex items-center gap-3 md:gap-4 mb-4"
        style={{
          paddingLeft:
            typeof window !== "undefined" && window.innerWidth < 768
              ? 0
              : depth * 20,
        }}
      >
        <div
          className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 rounded-xl md:rounded-2xl ${
            depth === 0
              ? "bg-[#1a3a32] text-white shadow-lg"
              : "bg-white text-[#1a3a32] border border-gray-100"
          }`}
        >
          <Layers
            size={depth === 0 ? 16 : 14}
            className={depth === 0 ? "text-[#c2a336]" : "text-gray-400"}
          />
          <h3
            className={`font-black uppercase tracking-widest ${
              depth === 0
                ? "text-[10px] md:text-xs"
                : "text-[9px] md:text-[10px]"
            }`}
          >
            {node.title}
          </h3>
          <span
            className={`text-[8px] md:text-[9px] font-black px-1.5 py-0.5 rounded-full ${
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

      {/* Indicators Container */}
      {node.indicators.length > 0 && (
        <div
          className="mb-8"
          style={{
            marginLeft:
              typeof window !== "undefined" && window.innerWidth < 768
                ? 0
                : depth * 20 + 20,
          }}
        >
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
            <table className="w-full text-left">
              <thead className="bg-[#fcfcfc] border-b border-gray-50">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Indicator Dossier
                  </th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Timeline
                  </th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Completion
                  </th>
                  <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Audit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {node.indicators.map((i) => (
                  <tr
                    key={i._id}
                    className="group hover:bg-[#fcfcfc] transition-colors"
                  >
                    <td className="px-8 py-5">
                      <p className="font-black text-[#1a3a32] text-sm group-hover:text-[#c2a336] transition-colors">
                        {i.indicatorTitle}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">
                        Target: {i.unitOfMeasure}
                      </p>
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-[#c2a336]" />
                        <span>
                          {new Date(i.dueDate).toLocaleDateString("en-GB", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-24 lg:w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1a3a32] rounded-full transition-all duration-1000"
                            style={{ width: `${i.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-[#1a3a32]">
                          {i.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button
                        onClick={() => navigate(`/user/indicators/${i._id}`)}
                        className="inline-flex items-center gap-2 px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl bg-white border border-gray-100 text-[#1a3a32] hover:bg-[#1a3a32] hover:text-white hover:border-[#1a3a32] transition-all shadow-sm"
                      >
                        Inspect
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {node.indicators.map((i) => (
              <div
                key={i._id}
                className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform"
                onClick={() => navigate(`/user/indicators/${i._id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-[#1a3a32] text-sm leading-tight mb-1">
                      {i.indicatorTitle}
                    </h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                      Unit: {i.unitOfMeasure}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-gray-300" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <div className="flex items-center gap-2 text-gray-500">
                      <Calendar size={12} className="text-[#c2a336]" />
                      <span>{new Date(i.dueDate).toLocaleDateString()}</span>
                    </div>
                    <span className="text-[#1a3a32]">{i.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1a3a32] rounded-full"
                      style={{ width: `${i.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.values(node.children).map((child) =>
        renderNode(child, depth + 1)
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-8 lg:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8 md:pb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#c2a336] text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">
              <ShieldCheck size={14} />
              Performance Portfolio
            </div>
            <h1 className="text-3xl md:text-3xl font-black text-[#1a3a32] tracking-tighter leading-tight">
              Personnel Records
            </h1>
          </div>
          <div className="flex gap-4">
            <div className="bg-[#1a3a32] text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl md:rounded-[2rem] shadow-xl shadow-[#1a3a32]/10 flex-1 md:flex-none md:min-w-[160px]">
              <div className="flex items-center gap-2 text-[#c2a336] text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 md:mb-1">
                <TrendingUp size={12} />
                Task(s)
              </div>
              <p className="text-2xl md:text-3xl font-black">
                {indicators.length}
              </p>
            </div>
          </div>
        </header>

        <main className="space-y-8 md:space-y-10">
          {Object.values(tree).map((node) => renderNode(node))}
        </main>
      </div>
    </div>
  );
};

export default UserIndicators;
