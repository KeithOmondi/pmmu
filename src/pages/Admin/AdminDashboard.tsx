import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ChevronRight,
  Search,
  Clock,
  AlertCircle,
  ShieldCheck,
  Briefcase,
  RefreshCw,
  CheckCircle2, // New icon for Completed
} from "lucide-react";

import {
  fetchAllIndicatorsForAdmin,
  selectAllIndicators,
  selectIndicatorsLoading,
} from "../../store/slices/indicatorsSlice";
import type { AppDispatch } from "../../store/store";

/* --- JUDICIARY THEMES --- */
const STATUS_THEMES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  pending: {
    bg: "bg-gray-50",
    text: "text-gray-600",
    border: "border-gray-200",
  },
  submitted: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  approved: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  rejected: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  overdue: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  completed: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  }, // Added theme
};

const AdminDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const indicators = useSelector(selectAllIndicators);
  const isLoading = useSelector(selectIndicatorsLoading);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
    const heartbeat = setInterval(() => {
      dispatch(fetchAllIndicatorsForAdmin());
    }, 30000);
    return () => clearInterval(heartbeat);
  }, [dispatch]);

  const filteredIndicators = useMemo(() => {
    return indicators.filter((i) =>
      i.indicatorTitle.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [indicators, searchTerm]);

  const stats = useMemo(() => {
    const counts = indicators.reduce((acc: any, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {});

    return [
      {
        label: "Awaiting Review",
        value: counts["submitted"] || 0,
        color: "#C69214",
        bg: "bg-[#F9F4E8]",
        icon: <Clock size={18} className="text-[#C69214]" />,
      },
      {
        label: "Approved",
        value: counts["approved"] || 0,
        color: "#1E3A2B",
        bg: "bg-[#E7F3EC]",
        icon: <ShieldCheck size={18} className="text-[#1E3A2B]" />,
      },
      {
        label: "Completed", // NEW: Completed Box
        value: counts["completed"] || 0,
        color: "#1D4ED8",
        bg: "bg-blue-50",
        icon: <CheckCircle2 size={18} className="text-blue-600" />,
      },
      {
        label: "In Progress",
        value: (counts["pending"] || 0) + (counts["rejected"] || 0),
        color: "#B45309",
        bg: "bg-amber-50",
        icon: <Activity size={18} className="text-[#B45309]" />,
      },
      {
        label: "Overdue",
        value: counts["overdue"] || 0,
        color: "#BE123C",
        bg: "bg-rose-50",
        icon: <AlertCircle size={18} className="text-rose-600" />,
      },
    ];
  }, [indicators]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-6 md:p-12 font-sans text-[#1E3A2B]">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* HEADER */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-gray-100 pb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-[1px] w-8 bg-[#C69214]" />
              <span className="text-[10px] font-black text-[#C69214] uppercase tracking-[0.3em]">
                System Administrator
              </span>
            </div>
            <h1 className="text-4xl font-serif font-bold tracking-tight">
              Principal <span className="text-[#C69214]">Registry</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={14}
              />
              <input
                type="text"
                placeholder="Search case files..."
                className="pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#C69214]/20 w-72 shadow-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        {/* METRICS SECTION - Updated to grid-cols-5 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {stats.map((s, idx) => (
            <div
              key={idx}
              className={`${s.bg} p-6 rounded-[1.5rem] border border-white shadow-sm hover:shadow-md transition-all group`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:scale-110 transition-transform">
                  {s.icon}
                </div>
                <span
                  className="text-2xl font-serif font-bold"
                  style={{ color: s.color }}
                >
                  {s.value}
                </span>
              </div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest leading-tight">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* LEDGER TABLE */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between bg-[#FDFDFD]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#1E3A2B] rounded-xl flex items-center justify-center text-[#C69214]">
                <Briefcase size={20} />
              </div>
              <h2 className="font-serif font-bold text-lg">
                Indicator Oversight Ledger
              </h2>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100">
              {isLoading ? (
                <RefreshCw className="w-3 h-3 text-[#C69214] animate-spin" />
              ) : (
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              )}
              <span className="text-[10px] font-black uppercase tracking-tighter text-gray-500">
                {isLoading
                  ? "Syncing..."
                  : `Live Registry: ${filteredIndicators.length} Entries`}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50">
                  <th className="px-10 py-6">Reference Detail</th>
                  <th className="px-10 py-6">Audit Status</th>
                  <th className="px-10 py-6">Registry Timestamp</th>
                  <th className="px-10 py-6 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredIndicators.map((item) => {
                  const theme =
                    STATUS_THEMES[item.status] || STATUS_THEMES.pending;
                  return (
                    <tr
                      key={item._id}
                      onClick={() => navigate(`/admin/indicators/${item._id}`)}
                      className="group hover:bg-[#F8F9FA] cursor-pointer transition-colors"
                    >
                      <td className="px-10 py-6">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-sm group-hover:text-[#C69214] transition-colors">
                            {item.indicatorTitle}
                          </span>
                          <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">
                            ID: {item._id.slice(-12).toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span
                          className={`text-[9px] font-black px-3 py-1.5 rounded-full border uppercase tracking-tighter ${theme.bg} ${theme.text} ${theme.border}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-[11px] font-bold text-gray-400">
                        {new Date(item.updatedAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-10 py-6 text-right">
                        <button className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-[#1E3A2B] transition-all">
                          Manage Case <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
