import React, { useEffect } from "react";
import { X, Lock, Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchEvidencePreviewUrl, selectStream, clearPreview } from "../../store/slices/streamSlice";
import { type IEvidence } from "../../store/slices/indicatorsSlice";

interface Props {
  file: IEvidence;
  indicatorId: string;
  onClose: () => void;
}

const EvidencePreviewModal: React.FC<Props> = ({ file, indicatorId, onClose }) => {
  const dispatch = useAppDispatch();
  const { previewUrl, loading, error } = useAppSelector(selectStream);

  const isPdf = file.mimeType === "application/pdf" || file.fileName.toLowerCase().endsWith(".pdf");
  const isImage = file.mimeType.startsWith("image/") || ["jpg", "jpeg", "png"].includes(file.format?.toLowerCase());

  useEffect(() => {
    dispatch(fetchEvidencePreviewUrl({ indicatorId, publicId: file.publicId }));
    
    return () => {
      dispatch(clearPreview());
    };
  }, [dispatch, indicatorId, file.publicId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F172A]/90 backdrop-blur-md p-4">
      <div className="relative h-[90vh] w-full max-w-6xl rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col">
        
        {/* HEADER */}
        <div className="h-16 bg-white flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1E3A2B] rounded-lg flex items-center justify-center text-emerald-400 shadow-inner">
              <Lock size={16} />
            </div>
            <h3 className="text-[10px] font-black text-[#1E3A2B] uppercase tracking-wider truncate max-w-[400px]">
              {file.fileName}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
          >
            <X size={20} className="text-slate-400 group-hover:text-slate-600" />
          </button>
        </div>

        {/* VIEWER AREA */}
        <div className="flex-1 bg-slate-50 flex items-center justify-center relative">
          {loading ? (
            <div className="text-center">
              <Loader2 className="animate-spin text-emerald-600 mb-2 mx-auto" size={32} />
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Opening Secure Stream...</p>
            </div>
          ) : error ? (
            <div className="text-center p-6">
              <p className="text-red-500 text-xs font-bold uppercase mb-2">Error Loading Document</p>
              <p className="text-slate-500 text-[10px]">{error}</p>
            </div>
          ) : isPdf && previewUrl ? (
            /* Standard iFrame: Browser handles the PDF controls natively */
            <iframe
              src={`${previewUrl}#toolbar=1&view=FitH`}
              className="w-full h-full border-none bg-white"
              title="PDF Preview"
            />
          ) : isImage && previewUrl ? (
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain p-4 drop-shadow-2xl" 
            />
          ) : (
            <div className="text-center">
               <p className="text-slate-400 text-xs uppercase font-bold">No Preview Available</p>
               {previewUrl && (
                 <a href={previewUrl} download className="text-emerald-600 text-[10px] font-bold mt-2 block hover:underline">
                   DOWNLOAD TO VIEW
                 </a>
               )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="h-12 bg-slate-50 border-t flex items-center px-6">
            <p className="text-[8px] font-mono text-slate-400 uppercase tracking-tighter">
              Secure Stream Active • {file.mimeType}
            </p>
        </div>
      </div>
    </div>
  );
};

export default EvidencePreviewModal;