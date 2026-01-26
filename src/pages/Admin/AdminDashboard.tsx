// src/pages/Admin/AdminDashboard.tsx
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  History,
  Activity,
  ChevronRight,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import {
  fetchAllIndicatorsForAdmin,
  type IIndicator,
} from "../../store/slices/indicatorsSlice";
import type { AppDispatch, RootState } from "../../store/store";
import { getSocket } from "../../utils/socket";

/* ============================================================
   JUDICIARY PALETTE & STATUS HELPERS
============================================================ */

const STATUS_THEMES: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  upcoming: {
    bg: "bg-[#F9F4E8]",
    text: "text-[#C69214]",
    border: "border-[#E5D5B0]",
  },
  ongoing: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  submitted: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  approved: {
    bg: "bg-[#E7F3EC]",
    text: "text-[#1E3A2B]",
    border: "border-[#1E3A2B]/20",
  },
  rejected: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  overdue: { bg: "bg-red-100", text: "text-red-900", border: "border-red-300" },
  completed: {
    bg: "bg-[#1E3A2B]",
    text: "text-white",
    border: "border-[#1E3A2B]",
  },
};

/* ============================================================
   COMPONENT
============================================================ */

const AdminDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const allIndicators = useSelector<RootState, IIndicator[]>(
    (state) => state.indicators.allIndicators,
  );

  const [indicators, setIndicators] = useState<IIndicator[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());

    const socket = getSocket();
    socket.on("indicator:update", (updated: IIndicator) => {
      setIndicators((prev) => {
        const exists = prev.find((i) => i._id === updated._id);
        return exists
          ? prev.map((i) => (i._id === updated._id ? updated : i))
          : [updated, ...prev];
      });
    });

    return () => {
      socket.off("indicator:update");
    };
  }, [dispatch]);

  useEffect(() => {
    setIndicators(allIndicators);
  }, [allIndicators]);

  /* ================= FILTERED DATA ================= */

  const filteredIndicators = useMemo(() => {
    return indicators.filter((i) =>
      i.indicatorTitle.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [indicators, searchTerm]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {
      upcoming: 0,
      ongoing: 0,
      submitted: 0,
      approved: 0,
      rejected: 0,
      overdue: 0,
      completed: 0,
    };
    indicators.forEach((i) => {
      counts[i.status] = (counts[i.status] || 0) + 1;
    });

    return [
      {
        label: "Pending initiation",
        key: "upcoming",
        color: "#C69214",
        bg: "bg-[#F9F4E8]",
        icon: <Clock size={18} className="text-[#C69214]" />,
      },
      {
        label: "Ongoing Tasks",
        key: "ongoing",
        color: "#1E3A2B",
        bg: "bg-[#E7F3EC]",
        icon: <Activity size={18} className="text-[#1E3A2B]" />,
      },
      {
        label: "Under Review",
        key: "submitted",
        color: "#B45309",
        bg: "bg-amber-50",
        icon: <AlertCircle size={18} className="text-[#B45309]" />,
      },
      {
        label: "Certified/Closed",
        key: "completed",
        color: "#064E3B",
        bg: "bg-slate-100",
        icon: <CheckCircle size={18} className="text-slate-600" />,
      },
    ].map((s) => ({ ...s, value: counts[s.key] || 0 }));
  }, [indicators]);

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-6 md:p-10 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#E5D5B0] pb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-[#1E3A2B] rounded flex items-center justify-center shadow-lg">
              <FileText className="text-[#C69214]" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1E3A2B] tracking-tight uppercase font-serif">
                Principal Registry
              </h1>
              <p className="text-xs font-bold text-[#C69214] uppercase tracking-widest">
                Office of the Registrar High Court • Operational Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search Registry..."
                className="pl-10 pr-4 py-2 bg-white border border-[#E5D5B0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A2B]/20 w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="p-2 bg-white border border-[#E5D5B0] rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
              <Filter size={20} />
            </button>
          </div>
        </div>

        {/* METRIC BOXES - UPDATED WITH COLORS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s) => (
            <div
              key={s.key}
              className={`${s.bg} border-l-4 p-6 rounded-xl shadow-sm hover:shadow-md transition-all border-[#E5D5B0]`}
              style={{ borderLeftColor: s.color }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  {s.label}
                </p>
                {s.icon}
              </div>
              <p className="text-4xl font-black text-[#1E3A2B]">{s.value}</p>
            </div>
          ))}
        </div>

        {/* REGISTRY LEDGER */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5D5B0] overflow-hidden">
          <div className="bg-[#F9F4E8] px-6 py-4 border-b border-[#E5D5B0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={18} className="text-[#1E3A2B]" />
              <h2 className="font-black text-xs text-[#1E3A2B] uppercase tracking-widest">
                Form 30 Application Ledger
              </h2>
            </div>
            <span className="text-[10px] font-bold text-[#C69214] bg-[#1E3A2B] px-3 py-1 rounded">
              Total Records: {filteredIndicators.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#FDFDFD]">
                <tr className="text-left text-[10px] font-black text-[#1E3A2B]/50 uppercase tracking-widest border-b border-[#F9F4E8]">
                  <th className="px-6 py-4">Ref Indicator Detail</th>
                  <th className="px-6 py-4">Submission Status</th>
                  <th className="px-6 py-4">Last Updated</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredIndicators.map((item) => {
                  const theme =
                    STATUS_THEMES[item.status] || STATUS_THEMES.upcoming;
                  return (
                    <tr
                      key={item._id}
                      onClick={() => navigate(`/admin/indicator/${item._id}`)}
                      className="group hover:bg-[#F9F4E8]/20 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-[#1E3A2B] group-hover:text-[#C69214] transition-colors">
                            {item.indicatorTitle}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            REG ID:{" "}
                            {item._id.toString().slice(-8).toUpperCase()}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`text-[9px] font-black px-3 py-1 border rounded-md shadow-sm inline-block ${theme.bg} ${theme.text} ${theme.border}`}
                        >
                          {item.status.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-xs text-gray-600 font-medium">
                        <div className="flex items-center gap-2">
                          <History size={12} className="text-gray-300" />
                          {new Date(item.updatedAt).toLocaleDateString(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            },
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-5 text-right">
                        <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-50 text-gray-400 group-hover:bg-[#1E3A2B] group-hover:text-white transition-all shadow-inner">
                          <ChevronRight size={18} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredIndicators.length === 0 && (
              <div className="p-20 text-center">
                <p className="text-sm italic text-gray-400">
                  No judicial records found matching your search criteria.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
