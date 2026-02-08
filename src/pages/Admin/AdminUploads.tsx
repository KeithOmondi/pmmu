import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  CloudUpload, Search, FileText, ShieldCheck, 
  Trash2, Loader2, CheckCircle2,  Type
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { 
  fetchAllIndicatorsForAdmin, 
  selectAllIndicators, 
  adminSubmitIndicatorEvidence,
  selectSubmittingEvidence 
} from "../../store/slices/indicatorsSlice";
import { addNotification } from "../../store/slices/notificationsSlice";

interface UploadSlot {
  file: File;
  description: string;
}

const AdminUploadsPage = () => {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const allIndicators = useAppSelector(selectAllIndicators);
  const uploading = useAppSelector(selectSubmittingEvidence);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadSlots, setUploadSlots] = useState<UploadSlot[]>([]);

  useEffect(() => {
    dispatch(fetchAllIndicatorsForAdmin());
  }, [dispatch]);

  const filteredIndicators = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return allIndicators.filter(i => 
      i.indicatorTitle.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 5);
  }, [allIndicators, searchTerm]);

  const selectedIndicator = allIndicators.find(i => i._id === selectedId);

  const notify = (title: string, message: string) => {
    dispatch(addNotification({
      _id: `manual-${Date.now()}`,
      title,
      message,
      read: false,
      createdAt: new Date().toISOString()
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (uploadSlots.length + newFiles.length > 10) {
        notify("Limit Exceeded", "Maximum 10 files allowed.");
        return;
      }
      const newSlots = newFiles.map(file => ({ file, description: "" }));
      setUploadSlots(prev => [...prev, ...newSlots]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    // DEBUG: If you see nothing in network tab, check this console log first
    console.log("Submitting with:", { selectedId, fileCount: uploadSlots.length });

    if (!selectedId || uploadSlots.length === 0) {
      notify("Input Required", "Please select an indicator and attach files.");
      return;
    }

    try {
      const files = uploadSlots.map(s => s.file);
      const descriptions = uploadSlots.map(s => s.description.trim() || "Admin Verified Evidence");

      // FIX: Key must be 'indicatorId' to match the Thunk definition
      await dispatch(adminSubmitIndicatorEvidence({ 
        indicatorId: selectedId, 
        files, 
        descriptions 
      })).unwrap();

      // SUCCESS RESET
      setUploadSlots([]);
      setSelectedId(null);
      setSearchTerm("");
      notify("Success", "Evidence submitted and metric updated.");

    } catch (err: any) {
      console.error("Submission error details:", err);
      // The slice handles the global error state, but we log here for dev
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 md:p-12 font-sans text-[#1a3a32]">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center gap-3 text-[#c2a336] text-[10px] font-black uppercase tracking-[0.3em] mb-4">
            <CloudUpload size={18} /> Evidence Submission Portal
          </div>
          <h1 className="text-4xl font-black tracking-tighter">
            Admin <span className="text-gray-300 font-light italic">Uploader</span>
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* SEARCH SECTION */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                1. Search Target Indicator
              </label>
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input 
                  type="text"
                  placeholder="Type metric name..."
                  className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-[#1a3a32]/10 transition-all outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="space-y-2 max-h-[250px] overflow-y-auto no-scrollbar">
                {searchTerm && filteredIndicators.map(i => (
                  <button
                    key={i._id}
                    onClick={() => { setSelectedId(i._id); setSearchTerm(""); }}
                    className={`w-full text-left p-4 rounded-2xl text-xs font-bold transition-all border ${
                        selectedId === i._id ? "bg-[#1a3a32] text-white" : "bg-white text-gray-600 border-gray-100"
                    }`}
                  >
                    {i.indicatorTitle}
                  </button>
                ))}
              </div>
              {selectedIndicator && (
                <div className="mt-6 p-5 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="text-emerald-500 mt-1" size={16} />
                    <div>
                      <p className="text-[10px] font-black text-emerald-800 uppercase">Active Target</p>
                      <p className="text-xs font-bold text-emerald-700 mt-1">{selectedIndicator.indicatorTitle}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* UPLOAD SECTION */}
          <div className="lg:col-span-7">
            <div className={`bg-white p-10 rounded-[3rem] shadow-xl border-2 border-dashed h-full flex flex-col transition-colors ${
              uploadSlots.length > 0 ? "border-emerald-200" : "border-gray-200"
            }`}>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">
                2. Audit Evidence Files
              </label>

              <div className="relative group min-h-[160px] mb-6">
                <input 
                  type="file" multiple ref={fileInputRef} onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                <div className="h-full border-2 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center group-hover:bg-slate-50 transition-all py-8">
                  <CloudUpload className="text-gray-300 group-hover:text-[#1a3a32] mb-4" size={28} />
                  <p className="font-black uppercase text-[10px] tracking-widest">Select Evidence Files</p>
                </div>
              </div>

              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 no-scrollbar">
                {uploadSlots.map((slot, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className="text-[#1a3a32]" />
                        <span className="text-xs font-bold truncate max-w-[150px]">{slot.file.name}</span>
                      </div>
                      <button onClick={() => setUploadSlots(s => s.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-rose-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="relative">
                      <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={12} />
                      <input 
                        type="text" placeholder="Add remark..." value={slot.description}
                        onChange={(e) => setUploadSlots(prev => prev.map((s, i) => i === idx ? {...s, description: e.target.value} : s))}
                        className="w-full bg-white border-none rounded-xl py-2 pl-9 pr-4 text-[11px] font-medium shadow-sm outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-10">
                <button
                  type="button"
                  disabled={!selectedId || uploadSlots.length === 0 || uploading}
                  onClick={handleSubmit}
                  className="w-full py-5 bg-[#1a3a32] disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-3"
                >
                  {uploading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                  {uploading ? "Uploading..." : "Seal Audit Evidence"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUploadsPage;