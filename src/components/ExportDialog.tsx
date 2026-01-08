import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, CheckCircle, AlertCircle, Video, Cloud, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExportProgress {
  status: "idle" | "preparing" | "rendering" | "encoding" | "complete" | "error";
  progress: number;
  message: string;
  eta?: string;
  method?: "webcodecs" | "mediarecorder";
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportProgress: ExportProgress;
  exportedVideoUrl: string | null;
  isExporting: boolean;
  onStartExport: (quality: "720p" | "1080p", bitrate: "low" | "medium" | "high") => void;
  onCancel: () => void;
  onDownload: () => void;
  onReset: () => void;
  onSaveToCloud?: () => void;
  isSavingToCloud?: boolean;
  hasSubtitles: boolean;
  hasAudio: boolean;
  hasMedia: boolean;
}

// Animated progress ring component
const ProgressRing = ({ progress, status }: { progress: number; status: string }) => {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  const getColor = () => {
    if (status === "complete") return "stroke-green-500";
    if (status === "error") return "stroke-destructive";
    return "stroke-primary";
  };

  return (
    <div className="relative w-28 h-28">
      {/* Background ring */}
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          className="fill-none stroke-muted/30"
          strokeWidth="6"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          className={`fill-none ${getColor()}`}
          strokeWidth="6"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {status === "complete" ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <CheckCircle className="w-10 h-10 text-green-500" />
          </motion.div>
        ) : status === "error" ? (
          <AlertCircle className="w-10 h-10 text-destructive" />
        ) : (
          <motion.span 
            className="text-2xl font-bold tabular-nums"
            key={Math.floor(progress)}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            {Math.round(progress)}%
          </motion.span>
        )}
      </div>
    </div>
  );
};

// Status step indicator
const ExportSteps = ({ status }: { status: string }) => {
  const steps = [
    { id: "preparing", label: "Prepare", icon: "⚙️" },
    { id: "rendering", label: "Render", icon: "🎬" },
    { id: "encoding", label: "Encode", icon: "📦" },
    { id: "complete", label: "Done", icon: "✓" },
  ];

  const getStepState = (stepId: string) => {
    const statusOrder = ["preparing", "rendering", "encoding", "complete"];
    const currentIndex = statusOrder.indexOf(status);
    const stepIndex = statusOrder.indexOf(stepId);
    
    if (status === "error") return "error";
    if (stepIndex < currentIndex) return "complete";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  return (
    <div className="flex justify-between w-full px-2">
      {steps.map((step, index) => {
        const state = getStepState(step.id);
        return (
          <div key={step.id} className="flex flex-col items-center gap-1">
            <motion.div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                state === "complete" ? "bg-green-500/20 text-green-500" :
                state === "active" ? "bg-primary/20 text-primary" :
                state === "error" ? "bg-destructive/20 text-destructive" :
                "bg-muted/50 text-muted-foreground"
              }`}
              animate={state === "active" ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: state === "active" ? Infinity : 0, duration: 1.5 }}
            >
              {state === "complete" ? "✓" : step.icon}
            </motion.div>
            <span className={`text-[10px] ${
              state === "active" ? "text-primary font-medium" :
              state === "complete" ? "text-green-500" :
              "text-muted-foreground"
            }`}>
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div className="hidden" /> // Connector handled by parent layout
            )}
          </div>
        );
      })}
    </div>
  );
};

const ExportDialog = ({
  open,
  onOpenChange,
  exportProgress,
  exportedVideoUrl,
  isExporting,
  onStartExport,
  onCancel,
  onDownload,
  onReset,
  onSaveToCloud,
  isSavingToCloud = false,
  hasSubtitles,
  hasAudio,
  hasMedia,
}: ExportDialogProps) => {
  const [quality, setQuality] = useState<"720p" | "1080p">("720p");
  const [bitrate, setBitrate] = useState<"low" | "medium" | "high">("medium");
  const [displayProgress, setDisplayProgress] = useState(0);

  // Smooth progress animation
  useEffect(() => {
    const target = exportProgress.progress;
    const step = (target - displayProgress) * 0.1;
    
    if (Math.abs(target - displayProgress) > 0.5) {
      const timer = requestAnimationFrame(() => {
        setDisplayProgress(prev => prev + step);
      });
      return () => cancelAnimationFrame(timer);
    } else {
      setDisplayProgress(target);
    }
  }, [exportProgress.progress, displayProgress]);

  // Reset display progress when dialog opens
  useEffect(() => {
    if (open && exportProgress.status === "idle") {
      setDisplayProgress(0);
    }
  }, [open, exportProgress.status]);

  const handleClose = () => {
    if (isExporting) {
      onCancel();
    }
    onReset();
    setDisplayProgress(0);
    onOpenChange(false);
  };

  const canExport = hasMedia && (hasSubtitles || hasAudio);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Export Video
          </DialogTitle>
          <DialogDescription>
            Render video dengan subtitle burned-in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <AnimatePresence mode="wait">
            {exportProgress.status === "idle" ? (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Quick preset buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={quality === "720p" && bitrate === "low" ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setQuality("720p"); setBitrate("low"); }}
                    className="h-auto py-3 flex flex-col gap-1"
                  >
                    <Zap className="w-4 h-4" />
                    <span className="text-xs font-medium">Fast</span>
                    <span className="text-[10px] text-muted-foreground">720p Low</span>
                  </Button>
                  <Button
                    variant={quality === "1080p" && bitrate === "high" ? "default" : "outline"}
                    size="sm"
                    onClick={() => { setQuality("1080p"); setBitrate("high"); }}
                    className="h-auto py-3 flex flex-col gap-1"
                  >
                    <Video className="w-4 h-4" />
                    <span className="text-xs font-medium">Quality</span>
                    <span className="text-[10px] text-muted-foreground">1080p High</span>
                  </Button>
                </div>

                {/* Advanced options */}
                <details className="group">
                  <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    Advanced options
                  </summary>
                  <div className="mt-3 space-y-3 pl-2 border-l-2 border-border">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Resolution</label>
                      <Select value={quality} onValueChange={(v) => setQuality(v as "720p" | "1080p")}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="720p">720p HD</SelectItem>
                          <SelectItem value="1080p">1080p Full HD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Bitrate</label>
                      <Select value={bitrate} onValueChange={(v) => setBitrate(v as "low" | "medium" | "high")}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low (fastest)</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High (best quality)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </details>

                {/* Status indicators */}
                <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${hasMedia ? "bg-green-500" : "bg-muted-foreground/50"}`} />
                    <span className="text-xs">Media</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${hasAudio ? "bg-green-500" : "bg-muted-foreground/50"}`} />
                    <span className="text-xs">Audio</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${hasSubtitles ? "bg-green-500" : "bg-muted-foreground/50"}`} />
                    <span className="text-xs">Subtitle</span>
                  </div>
                </div>

                {/* Export method info */}
                <div className="text-[10px] text-muted-foreground text-center">
                  <Zap className="w-3 h-3 inline mr-1" />
                  Export menggunakan Native Browser API (tanpa download tambahan)
                </div>

                {!canExport && (
                  <p className="text-xs text-muted-foreground text-center">
                    Add media and subtitle/audio first.
                  </p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="progress"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Progress Ring */}
                <div className="flex justify-center">
                  <ProgressRing progress={displayProgress} status={exportProgress.status} />
                </div>

                {/* Status message */}
                <div className="text-center space-y-1">
                  <motion.p 
                    className="text-sm font-medium"
                    key={exportProgress.message}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {exportProgress.message}
                  </motion.p>
                  {exportProgress.eta && exportProgress.status !== "complete" && (
                    <p className="text-xs text-muted-foreground">{exportProgress.eta}</p>
                  )}
                </div>

                {/* Step indicators */}
                {isExporting && <ExportSteps status={exportProgress.status} />}

                {/* Export method badge */}
                {exportProgress.method && exportProgress.status !== "complete" && (
                  <div className="flex justify-center">
                    <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      {exportProgress.method === "webcodecs" ? "⚡ WebCodecs (Hardware)" : "🎬 MediaRecorder"}
                    </span>
                  </div>
                )}

                {/* Video Preview */}
                {exportProgress.status === "complete" && exportedVideoUrl && (
                  <motion.div 
                    className="rounded-lg overflow-hidden border border-border"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <video
                      src={exportedVideoUrl}
                      controls
                      className="w-full max-h-[250px] object-contain bg-black"
                    />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          {exportProgress.status === "idle" && (
            <>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => onStartExport(quality, bitrate)} disabled={!canExport}>
                <Video className="w-4 h-4 mr-1.5" />
                Export
              </Button>
            </>
          )}

          {isExporting && (
            <Button variant="destructive" size="sm" onClick={onCancel}>
              <X className="w-4 h-4 mr-1.5" />
              Cancel
            </Button>
          )}

          {exportProgress.status === "complete" && (
            <>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Close
              </Button>
              {onSaveToCloud && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onSaveToCloud}
                  disabled={isSavingToCloud}
                >
                  {isSavingToCloud ? (
                    <div className="w-4 h-4 mr-1.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Cloud className="w-4 h-4 mr-1.5" />
                  )}
                  Save to Cloud
                </Button>
              )}
              <Button size="sm" onClick={onDownload}>
                <Download className="w-4 h-4 mr-1.5" />
                Download
              </Button>
            </>
          )}

          {exportProgress.status === "error" && (
            <>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Close
              </Button>
              <Button size="sm" onClick={onReset}>
                Retry
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
