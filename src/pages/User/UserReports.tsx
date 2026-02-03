import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchReportHtml,
  downloadReportPdf,
  selectReportsLoading,
  selectLastReportHtml,
  type ReportType,
} from "../../store/slices/reportsSlice";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  Layers,
  Clock,
  ChevronRight,
  Loader2,
  X,
  ShieldCheck,
  FileSearch,
  Award,
} from "lucide-react";
import toast from "react-hot-toast";

const UserReport: React.FC = () => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectReportsLoading);
  const previewHtml = useAppSelector(selectLastReportHtml);

  const [selectedType, setSelectedType] = useState<ReportType>("general");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Trigger PDF Generation & Download
  const handleDownload = async () => {
    try {
      const resultAction = await dispatch(
        downloadReportPdf({ type: selectedType }),
      ).unwrap();
      const url = window.URL.createObjectURL(new Blob([resultAction]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Certified_Performance_Record_${Date.now()}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Official PDF Mandate Exported");
    } catch (err) {
      toast.error("Failed to generate official document.");
    }
  };

  // Trigger HTML Preview
  const handlePreview = async () => {
    try {
      await dispatch(fetchReportHtml({ type: selectedType })).unwrap();
      setIsPreviewOpen(true);
    } catch (err) {
      toast.error("Registry preview unavailable.");
    }
  };

  const reportOptions = [
    {
      id: "general",
      title: "Comprehensive Portfolio",
      desc: "An exhaustive record of all assigned indicators and lifetime progress.",
      icon: <Layers size={20} />,
    },
    {
      id: "monthly",
      title: "Monthly Performance",
      desc: "Consolidated breakdown of milestones achieved this calendar month.",
      icon: <Calendar size={20} />,
    },
    {
      id: "quarterly",
      title: "Quarterly Audit",
      desc: "Executive summary intended for official financial quarter review.",
      icon: <Clock size={20} />,
    },
    {
      id: "weekly",
      title: "Weekly Snapshot",
      desc: "Immediate focus report covering the last 7 days of activity.",
      icon: <FileSearch size={20} />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-12 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Executive Header */}
        <div className="bg-[#1a3a32] p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Award size={180} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-[#c2a336] mb-3 font-bold uppercase tracking-[0.3em] text-[10px]">
              <ShieldCheck size={14} className="animate-pulse" /> Verified User
              Registry
            </div>
            <h1 className="text-4xl font-black tracking-tighter">
              Performance <span className="text-[#c2a336]">Archive.</span>
            </h1>
            <p className="text-white/60 text-sm font-medium mt-2 max-w-xl leading-relaxed">
              Generate, preview, and export your certified performance mandates.
              These documents are formatted for official judicial review and
              departmental audits.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Selection List */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
              <ChevronRight size={14} className="text-[#c2a336]" /> Select
              Document Template
            </h2>
            {reportOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedType(opt.id as ReportType)}
                className={`w-full text-left p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between group ${
                  selectedType === opt.id
                    ? "bg-white border-[#c2a336] shadow-xl shadow-[#c2a336]/10 scale-[1.02]"
                    : "bg-white border-transparent hover:border-slate-200 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-6">
                  <div
                    className={`p-4 rounded-2xl transition-all duration-500 ${
                      selectedType === opt.id
                        ? "bg-[#1a3a32] text-[#c2a336] rotate-[360deg]"
                        : "bg-slate-50 text-slate-400 group-hover:text-[#1a3a32]"
                    }`}
                  >
                    {opt.icon}
                  </div>
                  <div>
                    <h3
                      className={`font-black uppercase tracking-tight text-sm mb-1 ${
                        selectedType === opt.id
                          ? "text-[#1a3a32]"
                          : "text-slate-600"
                      }`}
                    >
                      {opt.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-semibold leading-relaxed max-w-xs">
                      {opt.desc}
                    </p>
                  </div>
                </div>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    selectedType === opt.id
                      ? "bg-[#c2a336] text-[#1a3a32]"
                      : "bg-slate-50 text-slate-200"
                  }`}
                >
                  <ChevronRight size={16} strokeWidth={3} />
                </div>
              </button>
            ))}
          </div>

          {/* Action Sidebar */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm sticky top-10">
              <div className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1a3a32] mb-3">
                  Export Configuration
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">
                      Selected Scope:
                    </span>
                    <span className="text-[11px] font-black text-[#c2a336] uppercase">
                      {selectedType}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">
                      Format:
                    </span>
                    <span className="text-[11px] font-black text-[#1a3a32] uppercase">
                      ISO PDF-A
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  disabled={loading}
                  onClick={handlePreview}
                  className="w-full flex items-center justify-center gap-3 bg-slate-100 hover:bg-slate-200 text-[#1a3a32] py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Eye size={18} />
                  )}
                  Inspect Registry
                </button>

                <button
                  disabled={loading}
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-3 bg-[#c2a336] hover:bg-[#d4b54a] text-[#1a3a32] py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-[#c2a336]/20 active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Download size={18} />
                  )}
                  Generate Official PDF
                </button>
              </div>

              <div className="mt-10 pt-8 border-t border-slate-50">
                <div className="flex items-center gap-3 px-4 py-3 bg-blue-50/50 rounded-xl">
                  <ShieldCheck size={16} className="text-blue-600" />
                  <p className="text-[9px] font-bold text-blue-700 uppercase tracking-tighter">
                    Document will be timestamped with your unique ID for audit
                    traceability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- PREVIEW MODAL --- */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12">
          <div
            className="absolute inset-0 bg-[#1a3a32]/95 backdrop-blur-xl"
            onClick={() => setIsPreviewOpen(false)}
          />

          <div className="relative bg-white w-full max-w-6xl h-full rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 rounded-2xl text-[#c2a336]">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-black text-[#1a3a32] text-xl tracking-tighter uppercase">
                    Audit Mandate Preview
                  </h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    Internal Official Use Only • {selectedType} Report
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-3 bg-[#1a3a32] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#2a5a4d] transition-colors shadow-lg"
                >
                  <Download size={14} /> Export Mandate
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-3 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-12">
              <div className="bg-white mx-auto max-w-5xl min-h-full shadow-2xl rounded-2xl p-12 border border-slate-100">
                {previewHtml ? (
                  <div
                    className="report-preview-container prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-32 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-[#c2a336] mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                      Accessing Secure Records...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserReport;
