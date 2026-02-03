import React, { useEffect, useState, useRef } from "react";
import { X, Lock, Loader2, AlertCircle, ShieldAlert } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchEvidencePreviewUrl,
  selectPreviewUrls,
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

  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  const hasFetchedRef = useRef(false);

  const signedUrl = previewUrls[file._id];

  /* =====================================================
      FETCH SECURE PREVIEW URL (ONCE PER OPEN)
  ===================================================== */
  useEffect(() => {
    let isMounted = true;

    const fetchPreview = async () => {
      if (hasFetchedRef.current || signedUrl) {
        setLoading(false);
        return;
      }

      try {
        hasFetchedRef.current = true;
        setLoading(true);

        await dispatch(
          fetchEvidencePreviewUrl({
            indicatorId,
            evidenceId: file._id,
          }),
        ).unwrap();
      } catch (err) {
        console.error("Preview Fetch Error:", err);
        if (isMounted) setFetchError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
    };
  }, [dispatch, indicatorId, file._id, signedUrl]);

  /* =====================================================
      ACCESS DENIED STATE
  ===================================================== */
  if (fetchError || (!loading && !signedUrl)) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-[2.5rem] text-center max-w-sm shadow-2xl border border-rose-100">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} className="text-rose-500" />
          </div>

          <h3 className="font-black text-[#1E3A2B] uppercase text-sm tracking-widest">
            Access Denied
          </h3>

          <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
            Your secure session for this file could not be verified. Access is
            restricted to authorized personnel.
          </p>

          <button
            onClick={onClose}
            className="mt-8 w-full py-4 bg-[#1E3A2B] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* =====================================================
      FILE TYPE CHECKS
  ===================================================== */
  const isImage = file.mimeType?.startsWith("image/");
  const isPdf = file.mimeType === "application/pdf";
  const isVideo = file.mimeType?.startsWith("video/");

  const displayUrl =
    isPdf && signedUrl
      ? `${signedUrl}#toolbar=0&navpanes=0&scrollbar=1`
      : signedUrl;

  /* =====================================================
      RENDER
  ===================================================== */
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1E3A2B]/95 backdrop-blur-xl p-4 lg:p-10"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="relative h-full w-full rounded-[3rem] bg-white shadow-2xl overflow-hidden border border-white/20 flex flex-col">
        {/* HEADER */}
        <div className="h-20 bg-white/95 backdrop-blur-md flex items-center justify-between px-8 z-50 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 p-2.5 rounded-2xl">
              <Lock size={20} className="text-[#1E3A2B]" />
            </div>

            <div>
              <h3 className="text-sm font-black text-[#1E3A2B] truncate max-w-[200px] md:max-w-md uppercase tracking-widest">
                {file.fileName}
              </h3>
              <p className="text-[10px] text-emerald-600 font-bold uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Encrypted Session Active
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-3 bg-slate-50 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all duration-300 group"
          >
            <X
              size={24}
              className="group-hover:rotate-90 transition-transform"
            />
          </button>
        </div>

        {/* CONTENT */}
        <div className="relative flex-1 w-full bg-[#F8F9FA] overflow-hidden flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white">
              <Loader2 className="animate-spin text-[#1E3A2B] mb-3" size={32} />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Decrypting Asset...
              </p>
            </div>
          )}

          {isImage && signedUrl && (
            <img
              src={displayUrl}
              alt={file.fileName}
              draggable={false}
              onLoad={() => setLoading(false)}
              className="max-h-full max-w-full object-contain select-none shadow-2xl rounded-lg animate-in fade-in zoom-in-95 duration-500"
            />
          )}

          {isPdf && signedUrl && (
            <iframe
              src={displayUrl}
              title="Secure PDF Preview"
              onLoad={() => setLoading(false)}
              className="h-full w-full border-none"
            />
          )}

          {isVideo && signedUrl && (
            <video
              src={displayUrl}
              controls
              onLoadedData={() => setLoading(false)}
              controlsList="nodownload noremoteplayback"
              disablePictureInPicture
              className="max-h-full rounded-2xl shadow-2xl"
            />
          )}

          {!isImage && !isPdf && !isVideo && !loading && (
            <div className="flex flex-col items-center justify-center text-center p-10">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                <AlertCircle size={40} className="text-amber-500" />
              </div>

              <p className="text-sm font-black text-[#1E3A2B] uppercase tracking-widest">
                Preview Unavailable
              </p>
              <p className="text-[11px] text-gray-500 mt-2 max-w-xs leading-relaxed">
                Direct browser rendering is not supported for{" "}
                <b>.{file.format}</b> files due to security protocols.
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="h-14 bg-slate-50 border-t flex items-center justify-center px-8">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
            <ShieldAlert size={12} className="text-amber-500" />
            Audit Log ID: {file.publicId.split("/").pop()?.toUpperCase()} •
            No-Persistence Mode
          </p>
        </div>
      </div>
    </div>
  );
};

export default EvidencePreviewModal;
