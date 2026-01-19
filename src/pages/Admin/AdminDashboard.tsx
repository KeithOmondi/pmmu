// src/pages/Admin/AdminDashboard.tsx
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  fetchAllIndicatorsForAdmin,
  type IIndicator,
} from "../../store/slices/indicatorsSlice";
import type { AppDispatch, RootState } from "../../store/store";
import { getSocket } from "../../utils/socket";

/* ============================================================
   STATUS HELPERS (MATCH USER DASHBOARD)
============================================================ */

const STATUS_BG_COLORS: Record<string, string> = {
  upcoming: "bg-yellow-100 text-yellow-800 border-yellow-300",
  ongoing: "bg-blue-100 text-blue-800 border-blue-300",
  submitted: "bg-gray-100 text-gray-800 border-gray-300",
  approved: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
  overdue: "bg-red-100 text-red-800 border-red-300",
  completed: "bg-gray-100 text-gray-800 border-gray-300",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
};

/* ============================================================
   COMPONENT
============================================================ */

const AdminDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const allIndicators = useSelector<RootState, IIndicator[]>(
    (state) => state.indicators.allIndicators
  );

  const [indicators, setIndicators] = useState<IIndicator[]>([]);

  /* ================= INIT + SOCKET ================= */

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

  /* ================= STATS ================= */

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
      { label: "Upcoming", key: "upcoming" },
      { label: "Ongoing", key: "ongoing" },
      { label: "Submitted", key: "submitted" },
      { label: "Approved", key: "approved" },
      { label: "Rejected", key: "rejected" },
      { label: "Overdue", key: "overdue" },
      { label: "Completed", key: "completed" },
    ].map((s) => ({ ...s, value: counts[s.key] || 0 }));
  }, [indicators]);

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen bg-[#f5f6f7] p-4 text-gray-900">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div>
          <h1 className="text-lg font-extrabold uppercase text-[#1a3a32]">
            Principal Registry
          </h1>
          <p className="text-sm text-gray-600">
            ORHC Admin Dashboard
          </p>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((s) => (
            <div
              key={s.key}
              className="bg-white border border-gray-300 p-4"
            >
              <p className="text-4xl font-bold text-[#f2c200]">
                {s.value}
              </p>
              <p className="text-xs text-gray-700">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* INDICATORS LIST */}
        <div className="bg-white border border-gray-300">
          <div className="border-b border-gray-300 px-4 py-2 font-bold text-sm">
            ALL FORM 30 APPLICATIONS
          </div>

          <div className="divide-y">
            {indicators.map((item) => (
              <div
                key={item._id}
                onClick={() => navigate(`/admin/indicator/${item._id}`)}
                className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-sm">
                    {item.indicatorTitle}
                  </p>
                  <p className="text-xs text-gray-600">
                    Updated:{" "}
                    {new Date(item.updatedAt).toLocaleDateString("en-GB")}
                  </p>
                </div>

                <span
                  className={`text-[11px] px-2 py-0.5 border ${
                    STATUS_BG_COLORS[item.status]
                  }`}
                >
                  {item.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
