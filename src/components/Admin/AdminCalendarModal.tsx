import React from "react";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
} from "lucide-react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  eachDayOfInterval 
} from "date-fns";
import { useAppSelector } from "../../store/hooks";
import { selectAllIndicators } from "../../store/slices/indicatorsSlice";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AdminCalendarModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const indicators = useAppSelector(selectAllIndicators);

  if (!isOpen) return null;

  // Logic to get indicators due on specific days
  const getIndicatorsForDay = (day: Date) => {
    return indicators.filter(ind => isSameDay(new Date(ind.dueDate), day));
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[#1a3a32] rounded-2xl flex items-center justify-center text-[#c2a336] shadow-lg shadow-[#1a3a32]/20">
          <CalendarIcon size={24} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-[#1a3a32] tracking-tighter leading-none">
            Registry Timeline
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
            Institutional Deadlines • {format(currentMonth, "MMMM yyyy")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
        <button 
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-[#1a3a32]"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          onClick={() => setCurrentMonth(new Date())}
          className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#1a3a32] hover:bg-white rounded-xl transition-all"
        >
          Today
        </button>
        <button 
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-[#1a3a32]"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
        <X size={24} />
      </button>
    </div>
  );

  const renderDays = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return (
      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
        {days.map(day => (
          <div key={day} className="py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="grid grid-cols-7 flex-1 overflow-y-auto">
        {calendarDays.map((day, idx) => {
          const dayIndicators = getIndicatorsForDay(day);
          const isSelected = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, monthStart);

          return (
            <div 
              key={idx}
              className={`min-h-[120px] p-3 border-r border-b border-slate-50 transition-colors hover:bg-slate-50/80 group ${
                !isCurrentMonth ? "bg-slate-50/30 opacity-40" : "bg-white"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-black ${
                  isSelected 
                    ? "bg-[#c2a336] text-white w-7 h-7 flex items-center justify-center rounded-lg shadow-md shadow-[#c2a336]/20" 
                    : "text-slate-400 group-hover:text-[#1a3a32]"
                }`}>
                  {format(day, "d")}
                </span>
                {dayIndicators.length > 0 && (
                  <span className="text-[9px] font-black text-[#c2a336] bg-[#f4f0e6] px-1.5 py-0.5 rounded uppercase">
                    {dayIndicators.length} Tasks
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {dayIndicators.slice(0, 3).map((ind, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className={`w-1 h-1 rounded-full ${
                      ind.status === 'approved' ? 'bg-emerald-500' : 'bg-[#c2a336]'
                    }`} />
                    <p className="text-[9px] font-bold text-slate-600 truncate leading-tight">
                      {ind.indicatorTitle}
                    </p>
                  </div>
                ))}
                {dayIndicators.length > 3 && (
                  <p className="text-[8px] font-black text-slate-400 uppercase mt-1">
                    + {dayIndicators.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 md:p-8">
      <div className="absolute inset-0 bg-[#1a3a32]/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {renderHeader()}
        <div className="flex-1 flex flex-col min-h-0">
          {renderDays()}
          {renderCells()}
        </div>

        {/* Legend Footer */}
        <footer className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Approved
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
              <div className="w-2.5 h-2.5 rounded-full bg-[#c2a336]" /> Pending 
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-400 italic">
            All times synced with Master Registry Server
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AdminCalendarModal;