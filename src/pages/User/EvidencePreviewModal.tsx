import React, { useEffect, useState, useRef } from "react";
import {
  X,
  Lock,
  Loader2,
  AlertCircle,
  ShieldAlert,
  FileText,
  Download,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchEvidencePreviewUrl,
  selectPreviewUrls,
  removeSpecificPreviewUrl,
  type IEvidence,
} from "../../store/slices/indicatorsSlice";

interface Props {
  file: IEvidence;
  indicatorId: string;
  onClose: () => void;
}

const EvidencePreviewModal: React.FC<Props> = ({
  file,
  indicatorId,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const previewUrls = useAppSelector(selectPreviewUrls);
  const signedUrl = previewUrls[file.publicId];

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current || signedUrl) return;
    hasFetchedRef.current = true;
    setLoading(true);
    setFetchError(false);

    dispatch(fetchEvidencePreviewUrl({ indicatorId, publicId: file.publicId }))
      .unwrap()
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false));
  }, [dispatch, indicatorId, file.publicId, signedUrl]);

  const isImage = file.mimeType?.startsWith("image/");
  const isPdf =
    file.mimeType === "application/pdf" ||
    file.fileName?.toLowerCase().endsWith(".pdf");
  const isVideo = file.mimeType?.startsWith("video/");
  const isConvertedPdf =
    isPdf && (signedUrl?.includes(".jpg") || signedUrl?.includes("f_jpg"));
  const displayUrl = signedUrl || null;

  const handleClose = () => {
    dispatch(removeSpecificPreviewUrl(file.publicId));
    onClose();
  };

  if (fetchError && !loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F172A]/90 backdrop-blur-md p-6">
        <div className="bg-white p-10 rounded-[3rem] text-center max-w-sm shadow-2xl border border-rose-100 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={40} className="text-rose-500" />
          </div>
          <h3 className="font-black text-[#1E3A2B] uppercase text-sm tracking-[0.2em]">
            Session Expired
          </h3>
          <p className="text-[11px] text-slate-500 mt-4 leading-relaxed font-medium">
            The secure link for this asset has expired. Please refresh the page
            to generate a new encrypted token.
          </p>
          <button
            onClick={handleClose}
            className="mt-8 w-full py-4 bg-[#1E3A2B] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20 active:scale-95 transition-all"
          >
            Close Preview
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F172A]/95 backdrop-blur-xl p-4 md:p-8 lg:p-12"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="relative h-full w-full max-w-6xl rounded-[3.5rem] bg-white shadow-[0_0_100px_rgba(0,0,0,0.4)] overflow-hidden border border-white/20 flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-500">
        {/* HEADER: Sticky Glassmorphism */}
        <div className="h-24 bg-white/80 backdrop-blur-md flex items-center justify-between px-10 z-50 border-b border-slate-100">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-[#1E3A2B] rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/20">
              <Lock size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#1E3A2B] truncate max-w-[180px] md:max-w-md uppercase tracking-widest">
                {file.fileName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">
                  {isConvertedPdf
                    ? "Internal Doc Preview"
                    : "Encrypted Media Stream"}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="group p-4 bg-slate-50 hover:bg-rose-50 rounded-2xl transition-all duration-300"
          >
            <X
              size={22}
              className="text-slate-400 group-hover:text-rose-500 group-hover:rotate-90 transition-all duration-300"
            />
          </button>
        </div>

        {/* VIEWER AREA: Updated with Scroll Logic */}
        <div className="relative flex-1 w-full bg-[#F1F5F9] overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-white/90 backdrop-blur-sm">
              <Loader2 className="animate-spin text-[#1E3A2B] mb-4" size={40} />
              <p className="text-[10px] font-black text-[#1E3A2B]/40 uppercase tracking-[0.3em]">
                Decrypting Asset...
              </p>
            </div>
          )}

          {/* SCROLLABLE CONTAINER */}
          <div className="h-full w-full overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-200/50">
            <div className="min-h-full w-full flex items-center justify-center p-8 md:p-12">
              {/* IMAGE / CONVERTED PDF */}
              {(isImage || isConvertedPdf) && displayUrl && (
                <div className="relative group max-w-5xl w-full">
                  <img
                    src={displayUrl}
                    alt={file.fileName}
                    draggable={false}
                    onLoad={() => setLoading(false)}
                    className="w-full h-auto object-contain select-none shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-3xl animate-in fade-in zoom-in-95 duration-700"
                  />
                  {isConvertedPdf && (
                    <div className="absolute top-6 right-6 bg-[#1E3A2B]/90 backdrop-blur-xl text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border border-white/10 shadow-2xl">
                      <FileText size={14} className="text-emerald-400" />
                      Standard Page 1 Preview
                    </div>
                  )}
                </div>
              )}

              {/* VIDEO */}
              {isVideo && displayUrl && (
                <div className="w-full max-w-4xl aspect-video rounded-[2.5rem] overflow-hidden shadow-2xl bg-black">
                  <video
                    src={displayUrl}
                    controls
                    controlsList="nodownload"
                    onLoadedData={() => setLoading(false)}
                    className="w-full h-full"
                  />
                </div>
              )}

              {/* RAW PDF (IFRAME) */}
              {isPdf && !isConvertedPdf && displayUrl && (
                <div className="w-full h-[80vh] rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
                  <iframe
                    src={displayUrl}
                    title={file.fileName}
                    onLoad={() => setLoading(false)}
                    className="w-full h-full bg-white"
                  />
                </div>
              )}

              {/* UNSUPPORTED */}
              {!isImage && !isPdf && !isVideo && !loading && (
                <div className="bg-white p-16 rounded-[3rem] shadow-xl text-center max-w-md">
                  <AlertCircle
                    size={48}
                    className="text-amber-500 mx-auto mb-6"
                  />
                  <p className="text-sm font-black text-[#1E3A2B] uppercase tracking-widest">
                    Format Restricted
                  </p>
                  <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
                    Previewing .{file.format} files is disabled for security
                    reasons.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER: Fixed Bottom */}
        <div className="h-24 bg-white border-t border-slate-100 flex items-center justify-between px-12 z-50">
          <div className="hidden md:flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
              <ShieldAlert size={16} className="text-amber-500" />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Security Audit ID
              </p>
              <p className="text-[10px] font-bold text-[#1E3A2B]">
                {file.publicId.split("/").pop()?.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            {isPdf && (
              <a
                href={displayUrl?.replace("f_jpg", "f_auto") || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-[#1E3A2B] text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#2a503b] transition-all shadow-xl shadow-emerald-900/10 active:scale-95"
              >
                <Download size={16} />
                Access Original Document
              </a>
            )}
            {!isPdf && isImage && (
              <a
                href={displayUrl || "#"}
                download
                className="flex-1 md:flex-none flex items-center justify-center gap-3 border-2 border-slate-100 text-[#1E3A2B] px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all active:scale-95"
              >
                <Download size={16} />
                Save Copy
              </a>
            )}
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: #CBD5E1; 
          border-radius: 20px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
      `,
        }}
      />
    </div>
  );
};

export default EvidencePreviewModal;
