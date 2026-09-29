import React, { useState, useEffect } from 'react';
import {
  Video,
  Camera as CameraIcon,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  RefreshCw,
  Building,
} from 'lucide-react';
import { Camera } from '../../types';
import { cameraApi } from '../../services/apiClient';
import { CctvVideoPlayer } from './CctvVideoPlayer';

interface CctvEvidenceModalProps {
  ngoId: string;
  ngoName: string;
  inspectionId: string;
  onClose: () => void;
  onEvidenceCaptured: (evidence: any) => void;
}

export const CctvEvidenceModal: React.FC<CctvEvidenceModalProps> = ({
  ngoId,
  ngoName,
  inspectionId,
  onClose,
  onEvidenceCaptured,
}) => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [capturedFrames, setCapturedFrames] = useState<any[]>([]);

  useEffect(() => {
    const fetchNgoCameras = async () => {
      try {
        setIsLoading(true);
        const res = await cameraApi.list();
        const ngoCams = (res.cameras || []).filter((c) => c.ngo_id === ngoId);
        setCameras(ngoCams);
        if (ngoCams.length > 0) {
          setSelectedCamera(ngoCams[0]);
        }
      } catch (err) {
        console.error('Failed to fetch NGO cameras:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNgoCameras();
  }, [ngoId]);

  const handleSnapshot = (evidence: any) => {
    setCapturedFrames((prev) => [evidence, ...prev]);
    onEvidenceCaptured(evidence);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <CameraIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Certified CCTV Inspection Evidence Capture
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                  STATUTORY SHELF
                </span>
              </h3>
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" />
                <span>{ngoName}</span>
                <span>•</span>
                <span>Inspection ID: {inspectionId}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
              <p className="text-xs text-slate-400">Loading facility cameras...</p>
            </div>
          ) : cameras.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800 p-8">
              <Video className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-200 mb-1">
                No Registered Cameras for this Facility
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
                This NGO facility does not currently have authorized CCTV cameras linked in the national registry. Use physical mobile camera capture instead.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Camera Selector Tabs if multiple cameras */}
              {cameras.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {cameras.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCamera(c)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                        selectedCamera?.id === c.id
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5" />
                      {c.name} ({c.location})
                    </button>
                  ))}
                </div>
              )}

              {/* Active Camera Viewport */}
              {selectedCamera && (
                <div className="bg-black rounded-2xl overflow-hidden border border-slate-800">
                  <CctvVideoPlayer
                    camera={selectedCamera}
                    autoPlay={true}
                    muted={true}
                    showControls={true}
                    onSnapshotCapture={handleSnapshot}
                    inspectionId={inspectionId}
                  />
                </div>
              )}

              {/* Captured Evidence Shelf */}
              {capturedFrames.length > 0 && (
                <div className="pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Captured Evidence Frames in Current Session ({capturedFrames.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {capturedFrames.map((frame, idx) => (
                      <div key={idx} className="bg-slate-900 rounded-xl p-2 border border-slate-800">
                        <img
                          src={frame.imageUrl}
                          alt="CCTV Evidence"
                          className="w-full aspect-video object-cover rounded-lg mb-1.5"
                        />
                        <div className="text-[10px] font-mono text-slate-400 truncate">
                          SHA: {frame.fileHash.slice(0, 12)}...
                        </div>
                        <div className="text-[9px] text-slate-500">
                          {new Date(frame.timestamp).toLocaleTimeString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span>Cryptographic Watermark & SHA-256 Hashes Embedded Automatically</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-colors"
          >
            Finished Capturing
          </button>
        </div>
      </div>
    </div>
  );
};
