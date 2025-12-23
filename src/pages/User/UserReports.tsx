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
        downloadReportPdf({ type: selectedType })
      ).unwrap();
      const url = window.URL.createObjectURL(new Blob([resultAction]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Judiciary_Report_${selectedType}_${Date.now()}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success("Official PDF Generated Successfully");
    } catch (err) {
      toast.error("Failed to generate PDF mandate.");
    }
  };

  // Trigger HTML Preview
  const handlePreview = async () => {
    try {
      await dispatch(fetchReportHtml({ type: selectedType })).unwrap();
      setIsPreviewOpen(true);
    } catch (err) {
      toast.error("Unable to generate preview.");
    }
  };

  const reportOptions = [
    {
      id: "general",
      title: "Comprehensive Portfolio",
      desc: "Complete overview of all assigned indicators and metrics.",
      icon: <Layers size={20} />,
    },
    {
      id: "monthly",
      title: "Monthly Performance",
      desc: "Detailed breakdown of progress for the current calendar month.",
      icon: <Calendar size={20} />,
    },
    {
      id: "quarterly",
      title: "Quarterly Audit",
      desc: "Executive summary for the current financial quarter.",
      icon: <Clock size={20} />,
    },
    {
      id: "weekly",
      title: "Weekly Snapshot",
      desc: "Fast-track report on immediate upcoming deadlines.",
      icon: <FileSearch size={20} />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6 lg:p-10">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#c2a336] font-black uppercase tracking-[0.3em] text-[10px]">
              <ShieldCheck size={14} /> Intelligence & Reporting
            </div>
            <h1 className="text-4xl font-black text-[#1a3a32] tracking-tighter">
              Performance <span className="text-slate-300">Archive</span>
            </h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest max-w-md">
              Generate and export certified performance records for official
              review.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Selection */}
          <div className="lg:col-span-2 space-y-4">
            {reportOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedType(opt.id as ReportType)}
                className={`w-full text-left p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between group ${
                  selectedType === opt.id
                    ? "bg-white border-[#c2a336] shadow-xl shadow-[#c2a336]/5"
                    : "bg-white border-transparent hover:border-slate-200 shadow-sm"
                }`}
              >
                <div className="flex items-center gap-5">
                  <div
                    className={`p-4 rounded-2xl transition-colors ${
                      selectedType === opt.id
                        ? "bg-[#1a3a32] text-white"
                        : "bg-slate-50 text-slate-400 group-hover:text-[#c2a336]"
                    }`}
                  >
                    {opt.icon}
                  </div>
                  <div>
                    <h3 className="font-black text-[#1a3a32] uppercase tracking-tight text-sm mb-1">
                      {opt.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {opt.desc}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={`transition-transform ${
                    selectedType === opt.id
                      ? "translate-x-1 text-[#c2a336]"
                      : "text-slate-200"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Right Column: Action Card */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a3a32] rounded-[2.5rem] p-8 text-white shadow-2xl shadow-[#1a3a32]/20 sticky top-10">
              <div className="mb-8">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#c2a336] mb-2">
                  Export Mandate
                </h3>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  You are generating a{" "}
                  <span className="text-white font-bold">
                    {selectedType.toUpperCase()}
                  </span>{" "}
                  report. This document will include all verified exhibits.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  disabled={loading}
                  onClick={handlePreview}
                  className="w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/10"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Eye size={18} />
                  )}
                  Inspect Preview
                </button>

                <button
                  disabled={loading}
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-3 bg-[#c2a336] hover:bg-[#d4b44a] text-[#1a3a32] py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Download size={18} />
                  )}
                  Download PDF
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 text-center">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
                  Document generated by judicial AI registry
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- PREVIEW MODAL --- */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-12">
          <div
            className="absolute inset-0 bg-[#1a3a32]/90 backdrop-blur-md"
            onClick={() => setIsPreviewOpen(false)}
          />

          <div className="relative bg-white w-full max-w-5xl h-full rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-50 rounded-2xl text-[#c2a336]">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-black text-[#1a3a32] text-xl tracking-tighter uppercase">
                    Document Preview
                  </h3>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                    Type: {selectedType} Report
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-3 bg-[#1a3a32] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#2a5a4d] transition-colors"
                >
                  <Download size={14} /> Download
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-3 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content - HTML RENDERER */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50 p-10 custom-scrollbar">
              <div className="bg-white mx-auto max-w-4xl min-h-full shadow-sm rounded-xl p-12">
                {previewHtml ? (
                  <div
                    className="report-preview-container prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-[#c2a336] mb-4" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Compiling Records...
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
