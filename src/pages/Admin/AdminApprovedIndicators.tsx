import React, { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchSubmittedIndicators,
  selectAllIndicators,
  selectIndicatorsLoading,
} from "../../store/slices/indicatorsSlice";
import {
  fetchUsers,
  selectAllUsers,
} from "../../store/slices/userSlice";
import {
  CheckCircle2,
  Search,
  FileText,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Eye,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminApprovedIndicatorsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const indicators = useAppSelector(selectAllIndicators);
  const loading = useAppSelector(selectIndicatorsLoading);
  const users = useAppSelector(selectAllUsers);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchSubmittedIndicators());
    dispatch(fetchUsers());
  }, [dispatch]);

  const approvedIndicators = useMemo(() => {
    return indicators.filter((i) => i.status === "approved");
  }, [indicators]);

  const filtered = useMemo(() => {
    return approvedIndicators.filter((i) =>
      i.indicatorTitle.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [approvedIndicators, searchTerm]);

  if (loading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <div className="bg-[#1a3a32] pt-16 pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <div className="flex items-center gap-3 text-[#c2a336] mb-4">
                <ShieldCheck size={24} />
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">
                  Compliance Archive
                </h2>
              </div>
              <h1 className="text-4xl font-serif font-bold text-white">
                Approved Records
              </h1>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-xs focus:bg-white/20 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            label="Total Approved" 
            value={approvedIndicators.length} 
            icon={<CheckCircle2 className="text-emerald-500" />} 
          />
          <StatCard 
            label="Verified Evidence" 
            value={approvedIndicators.reduce((acc, i) => acc + i.evidence.length, 0)} 
            icon={<FileText className="text-[#c2a336]" />} 
          />
          <StatCard 
            label="Security Status" 
            value="Encrypted" 
            icon={<ShieldCheck className="text-blue-500" />} 
          />
        </div>

        <div className="mt-12 space-y-4">
          {!filtered.length ? (
            <div className="py-32 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                No archived records found
              </p>
            </div>
          ) : (
            filtered.map((i) => (
              <ApprovedRow 
                key={i._id} 
                indicator={i} 
                navigate={navigate} 
                assigneeName={users.find(u => u._id === i.assignedTo)?.name || "Internal Group"}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/* --- SUB-COMPONENTS --- */

const ApprovedRow = ({ indicator, navigate, assigneeName }: any) => {
  // Format: "Oct 24, 2023 • 02:30 PM"
  const approvalDateTime = new Date(indicator.updatedAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div 
      className="group bg-white p-6 rounded-[2.5rem] border border-gray-100 hover:border-emerald-500/30 transition-all flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm hover:shadow-md"
    >
      <div className="flex items-center gap-6 flex-1">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0">
          <CheckCircle2 size={24} className="text-emerald-600" />
        </div>
        
        <div className="space-y-1.5">
          <h3 className="font-bold text-[#1a3a32] text-sm leading-tight group-hover:text-emerald-700 transition-colors">
            {indicator.indicatorTitle}
          </h3>
          <div className="flex flex-wrap items-center gap-y-2 gap-x-5">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase">
              <Clock size={12} className="text-[#c2a336]" /> Approved: {approvalDateTime}
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase">
              <UserCheck size={12} /> {assigneeName}
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
              <FileText size={12} /> {indicator.evidence.length} Files
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate(`/admin/submitted/${indicator._id}`)}
          className="flex items-center gap-2 bg-[#1a3a32] text-white px-7 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#c2a336] transition-all shadow-lg shadow-[#1a3a32]/10"
        >
          <Eye size={14} /> Preview Documents <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon }: any) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between">
    <div>
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-bold text-[#1a3a32]">{value}</p>
    </div>
    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
      {icon}
    </div>
  </div>
);

const LoadingState = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
    <div className="w-10 h-10 border-4 border-[#1a3a32] border-t-transparent animate-spin rounded-full mb-4" />
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verifying Certificates...</p>
  </div>
);

export default AdminApprovedIndicatorsPage;