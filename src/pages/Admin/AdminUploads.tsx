import React, { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchUserIndicators,
  adminSubmitIndicatorEvidence,
  // Assuming you have a delete action in your slice:
  // deleteIndicatorEvidence, 
  selectUserIndicators,
  selectSubmittingEvidence,
} from "../../store/slices/indicatorsSlice";
import {
  FolderIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  XMarkIcon,
  DocumentIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  TrashIcon, // Added TrashIcon
} from "@heroicons/react/24/outline";
import EvidencePreviewModal from "../User/EvidencePreviewModal";

const AdminDashboard = () => {
  const dispatch = useAppDispatch();
  const indicators = useAppSelector(selectUserIndicators) || [];
  const isSubmitting = useAppSelector(selectSubmittingEvidence);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeIndicator, setActiveIndicator] = useState<any>(null);

  const [previewFile, setPreviewFile] = useState<any>(null);
  const [previewIndicatorId, setPreviewIndicatorId] = useState<string | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [descriptions, setDescriptions] = useState<string[]>([]);

  useEffect(() => {
    dispatch(fetchUserIndicators());
  }, [dispatch]);

  const groupedData = useMemo(() => {
    if (!indicators) return {};
    return indicators.reduce((acc: any, curr) => {
      const catId = curr.category?._id || "misc";
      const catTitle = curr.category?.title || "General Indicators";

      if (!acc[catId]) {
        acc[catId] = {
          id: catId,
          title: catTitle,
          count: 0,
          approved: 0,
          items: [],
        };
      }
      acc[catId].count += 1;
      if (curr.status === "approved" || curr.status === "completed")
        acc[catId].approved += 1;
      acc[catId].items.push(curr);
      return acc;
    }, {});
  }, [indicators]);

  const selectedCategory = selectedCategoryId ? groupedData[selectedCategoryId] : null;

  const handleOpenModal = (ind: any) => {
    setActiveIndicator(ind);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFiles([]);
    setDescriptions([]);
    setActiveIndicator(null);
  };

  const handlePreview = (file: any, indicatorId: string) => {
    setPreviewFile(file);
    setPreviewIndicatorId(indicatorId);
  };

  // Logic to handle deletion of existing evidence
  const handleDeleteEvidence = async (indicatorId: string, evidenceId: string) => {
    if (window.confirm("Are you sure you want to remove this artifact?")) {
      // Logic for dispatching a delete action would go here
      console.log(`Deleting ${evidenceId} from ${indicatorId}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIndicator || files.length === 0) return;

    const allDescribed = descriptions.every((d) => d.trim().length > 0);
    if (!allDescribed) {
      alert("Please provide a description for all evidence files.");
      return;
    }

    await dispatch(
      adminSubmitIndicatorEvidence({
        indicatorId: activeIndicator._id,
        files,
        descriptions,
      })
    );
    
    // Success: Just close the modal, don't redirect
    handleCloseModal();
    // Optional: Re-fetch indicators to show the new data in the current view
    dispatch(fetchUserIndicators());
  };

  /* =====================================================
      VIEW: CATEGORY GRID
  ===================================================== */
  if (!selectedCategoryId) {
    return (
      <div className="p-8 max-w-[1400px] mx-auto space-y-12 animate-in fade-in duration-700">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 w-12 bg-[#C69214]" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#C69214]">Global Metrics</span>
            </div>
            <h1 className="text-4xl font-serif font-bold text-[#1E3A2B] tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1 uppercase tracking-widest font-medium">Compliance Oversight</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Object.values(groupedData).map((cat: any) => {
            const progress = Math.round((cat.approved / cat.count) * 100);
            return (
              <div key={cat.id} className="group relative bg-white rounded-[2.5rem] border border-gray-100 p-8 flex flex-col hover:shadow-2xl hover:shadow-[#1E3A2B]/10 transition-all duration-500">
                <div className="flex justify-between items-start mb-8">
                  <div className="p-4 bg-[#1E3A2B] rounded-2xl text-[#C69214]"><FolderIcon className="h-6 w-6" strokeWidth={2} /></div>
                  <div className="relative h-14 w-14 flex items-center justify-center">
                    <svg className="h-full w-full transform -rotate-90">
                      <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-100" />
                      <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={150.8} strokeDashoffset={150.8 - (150.8 * progress) / 100} className="text-[#C69214] transition-all duration-1000" />
                    </svg>
                    <span className="absolute text-[10px] font-black text-[#1E3A2B]">{progress}%</span>
                  </div>
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#1E3A2B] mb-2">{cat.title}</h3>
                <button onClick={() => setSelectedCategoryId(cat.id)} className="mt-auto group/btn flex items-center justify-between w-full bg-gray-50 border border-gray-100 p-2 rounded-2xl hover:bg-[#1E3A2B] transition-all duration-300">
                  <span className="ml-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#1E3A2B] group-hover/btn:text-white">Enter Sector</span>
                  <div className="p-3 bg-white rounded-xl shadow-sm group-hover/btn:bg-[#C69214] transition-colors"><ChevronRightIcon className="h-4 w-4 text-[#1E3A2B]" /></div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* =====================================================
      VIEW: INDICATOR LIST
  ===================================================== */
  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <button onClick={() => setSelectedCategoryId(null)} className="group flex items-center gap-3 text-gray-400 hover:text-[#C69214] transition-all">
        <div className="p-2 rounded-full border border-gray-200 group-hover:border-[#C69214]"><ArrowLeftIcon className="h-4 w-4" /></div>
        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Return to Matrix</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#1E3A2B] p-10 rounded-[3rem] shadow-xl">
        <div>
          <h2 className="text-3xl font-serif font-bold text-white mb-2">{selectedCategory?.title || "Metric Details"}</h2>
          <p className="text-[#C69214] text-[10px] font-black uppercase tracking-[0.4em]">Sector Detail Oversight</p>
        </div>
      </div>

      <div className="grid gap-6">
        {selectedCategory?.items?.map((ind: any) => (
          <div key={ind._id} className="group bg-white p-7 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-6 hover:border-[#C69214]/50 transition-all duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <StatusBadge status={ind.status} />
                  <h4 className="font-bold text-[#1E3A2B] text-xl tracking-tight">{ind.indicatorTitle}</h4>
                </div>
                <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#C69214]" /> Level 2: <b className="text-gray-900">{ind.level2Category?.title || "N/A"}</b></span>
                </div>
              </div>
              <button onClick={() => handleOpenModal(ind)} className="w-full md:w-auto bg-[#1E3A2B] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#0F1A13] flex items-center justify-center gap-3 active:scale-95 transition-all">
                <ArrowUpTrayIcon className="h-4 w-4 text-[#C69214]" /> Bypass Protocol
              </button>
            </div>

            {ind.evidence && ind.evidence.length > 0 && (
              <div className="border-t border-gray-50 pt-6">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Logged Artifacts ({ind.evidence.length})</p>
                <div className="flex flex-wrap gap-3">
                  {ind.evidence.map((ev: any) => (
                    <div key={ev._id} className="group/file flex items-center gap-3 bg-gray-50 hover:bg-[#1E3A2B] p-2 pr-2 rounded-xl border border-gray-100 transition-all">
                      <div className="p-2 bg-white rounded-lg group-hover/file:bg-[#C69214] transition-colors"><DocumentIcon className="h-4 w-4 text-[#1E3A2B]" /></div>
                      <div className="max-w-[150px]">
                        <p className="text-[10px] font-bold text-[#1E3A2B] group-hover/file:text-white truncate">{ev.fileName}</p>
                        <p className="text-[8px] text-gray-400 group-hover/file:text-white/50 uppercase truncate">{ev.description || "No description"}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handlePreview(ev, ind._id)} className="p-1.5 bg-white rounded-md text-[#1E3A2B] hover:text-[#C69214] hover:scale-110 transition-all shadow-sm">
                          <EyeIcon className="h-3.5 w-3.5" />
                        </button>
                        {/* DELETE BUTTON */}
                        <button onClick={() => handleDeleteEvidence(ind._id, ev._id)} className="p-1.5 bg-white rounded-md text-gray-400 hover:text-red-500 hover:scale-110 transition-all shadow-sm">
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {previewFile && previewIndicatorId && (
        <EvidencePreviewModal file={previewFile} indicatorId={previewIndicatorId} onClose={() => { setPreviewFile(null); setPreviewIndicatorId(null); }} />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E3A2B]/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold text-[#1E3A2B]">Evidence Submission</h3>
              <button onClick={handleCloseModal} className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-red-500 transition-all"><XMarkIcon className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="bg-[#1E3A2B] p-6 rounded-[2rem] border border-[#C69214]/30">
                <p className="text-[9px] font-black text-[#C69214] uppercase tracking-[0.3em] mb-1">Target Indicator</p>
                <p className="text-lg font-bold text-white tracking-tight">{activeIndicator?.indicatorTitle}</p>
              </div>

              <div className="group relative border-2 border-dashed border-gray-100 rounded-[2rem] p-8 text-center hover:border-[#C69214] transition-colors">
                <input type="file" multiple className="hidden" id="modal-file" onChange={(e) => {
                  const newFiles = Array.from(e.target.files || []);
                  setFiles([...files, ...newFiles]);
                  setDescriptions([...descriptions, ...newFiles.map(() => "")]);
                }} />
                <label htmlFor="modal-file" className="cursor-pointer flex flex-col items-center">
                  <div className="p-4 bg-gray-50 rounded-2xl mb-2 group-hover:bg-[#C69214] group-hover:text-white transition-all"><DocumentIcon className="h-8 w-8" /></div>
                  <span className="text-[#1E3A2B] font-bold">Select Artifacts</span>
                  <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">PDF, Excel, Images</span>
                </label>
              </div>

              <div className="max-h-52 overflow-y-auto space-y-4 pr-2 scrollbar-thin">
                {files.map((file, idx) => (
                  <div key={`${file.name}-${idx}`} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 animate-in slide-in-from-right-2">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[11px] font-bold text-[#1E3A2B] truncate max-w-[80%]">{file.name}</span>
                      <button type="button" onClick={() => {
                        setFiles(files.filter((_, i) => i !== idx));
                        setDescriptions(descriptions.filter((_, i) => i !== idx));
                      }} className="text-gray-300 hover:text-red-500"><XMarkIcon className="h-4 w-4" /></button>
                    </div>
                    <input required type="text" placeholder="Type file description..." value={descriptions[idx]} onChange={(e) => {
                      const newDescs = [...descriptions];
                      newDescs[idx] = e.target.value;
                      setDescriptions(newDescs);
                    }} className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2 text-xs text-[#1E3A2B] focus:ring-1 focus:ring-[#C69214] outline-none placeholder:text-gray-300 font-medium" />
                  </div>
                ))}
              </div>

              <button type="submit" disabled={isSubmitting || files.length === 0} className="w-full py-5 bg-[#C69214] text-[#1E3A2B] rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-[#C69214]/20 hover:scale-[1.02] active:scale-95 transition-all">
                {isSubmitting ? "Transmitting..." : "Commit To Database"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: any = {
    pending: "bg-gray-100 text-gray-500 border-gray-200",
    submitted: "bg-amber-50 text-amber-600 border-amber-100",
    approved: "bg-[#1E3A2B] text-[#C69214] border-[#C69214]/30",
    rejected: "bg-rose-50 text-rose-600 border-rose-100",
    overdue: "bg-red-50 text-red-600 border-red-200",
    completed: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };
  return (
    <span className={`text-[9px] font-black uppercase px-3 py-1 tracking-widest rounded-lg border shadow-sm ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
};

export default AdminDashboard;