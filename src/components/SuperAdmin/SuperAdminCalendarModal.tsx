import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import {
  selectAllIndicators,
  fetchAllIndicatorsForAdmin,
  selectIndicatorsLoading,
} from "../../store/slices/indicatorsSlice";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";

const SuperAdminCalendarModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // 1. Switch to selectAllIndicators for Super Admin view
  const activities = useAppSelector(selectAllIndicators);
  const isLoading = useAppSelector(selectIndicatorsLoading);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 2. Fetch all indicators when the modal opens
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchAllIndicatorsForAdmin());
    }
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  const renderDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;

        // Filter indicators that land on this specific day
        const dayActivities = activities.filter((act) =>
          act.dueDate ? isSameDay(new Date(act.dueDate), cloneDay) : false
        );

        const isToday = isSameDay(day, new Date());
        const isCurrentMonth = isSameMonth(day, monthStart);

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[120px] lg:min-h-[150px] border-r border-b border-gray-200 relative group transition-colors hover:bg-gray-50/50 ${
              !isCurrentMonth ? "bg-gray-50/30" : "bg-white"
            }`}
          >
            {/* Day Header */}
            <div className="flex flex-col items-center pt-2 pb-1">
              <span
                className={`text-[11px] font-semibold w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                  isToday
                    ? "bg-[#1a3a32] text-white shadow-md"
                    : "text-gray-500 hover:bg-gray-100"
                } ${!isCurrentMonth ? "opacity-20" : "opacity-100"}`}
              >
                {format(day, "d")}
              </span>
            </div>

            {/* Events Area */}
            <div className="px-1 space-y-1 overflow-hidden">
              {dayActivities.slice(0, 4).map((act) => (
                <button
                  key={act._id}
                  onClick={() => {
                    navigate(`/indicators/${act._id}`);
                    onClose();
                  }}
                  title={act.indicatorTitle}
                  className="w-full text-left text-[10px] px-2 py-1 rounded-md transition-all flex items-center gap-1 group/btn overflow-hidden"
                  style={{
                    backgroundColor: isCurrentMonth ? "#1a3a32" : "#1a3a3280",
                    color: "white",
                  }}
                >
                  <div className="w-1 h-3 bg-[#c2a336] rounded-full shrink-0" />
                  <span className="truncate font-medium tracking-tight">
                    {act.indicatorTitle}
                  </span>
                </button>
              ))}

              {dayActivities.length > 4 && (
                <button className="w-full text-left px-2 py-0.5 text-[10px] font-bold text-gray-400 hover:text-[#1a3a32] rounded transition-colors">
                  + {dayActivities.length - 4} more
                </button>
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 w-full" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="border-l border-t border-gray-200">{rows}</div>;
  };

  return (
    <div className="fixed inset-0 z-[999] h-screen w-screen flex items-center justify-center p-4 md:p-6 pointer-events-auto font-sans">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Main Container */}
      <div className="relative bg-white w-full max-w-7xl h-full max-h-[92vh] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Google Style Header */}
        <header className="shrink-0 px-6 py-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <CalendarIcon size={24} className="text-[#1a3a32]" />
              <h2 className="text-xl font-medium text-gray-700 tracking-tight">
                <span className="text-gray-400 font-bold">Calendar</span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Today
              </button>

              <div className="flex items-center ml-2">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-all"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <h3 className="text-xl font-normal text-gray-700 ml-2 min-w-[150px]">
                {format(currentMonth, "MMMM yyyy")}
              </h3>

              {isLoading && (
                <Loader2
                  size={16}
                  className="animate-spin text-gray-400 ml-2"
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-[#c2a336]/10 px-3 py-1.5 rounded-full border border-[#c2a336]/20">
              <div className="w-2 h-2 rounded-full bg-[#c2a336]" />
              <span className="text-[10px] font-bold text-[#c2a336] uppercase tracking-wider">
                Super Admin View
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </header>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
          {/* Weekday Names */}
          <div className="grid grid-cols-7 border-b border-gray-200 sticky top-0 bg-white z-10">
            {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
              <div
                key={d}
                className="py-2 text-[10px] font-bold text-gray-400 text-center tracking-[0.1em]"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="relative">{renderDays()}</div>
        </div>

        {/* Subtle Google-style Footer */}
        <footer className="shrink-0 px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <p className="text-[11px] text-gray-400 font-medium">
              Administrative Oversight Dashboard
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-semibold text-[#1a3a32] bg-[#1a3a32]/5 px-2 py-1 rounded">
              Total Global Records: {activities.length}
            </span>
            <button
              onClick={() => dispatch(fetchAllIndicatorsForAdmin())}
              className="text-[11px] text-gray-400 hover:text-[#c2a336] flex items-center gap-1 transition-colors"
            >
              <ExternalLink size={12} /> Refresh Data
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SuperAdminCalendarModal;
