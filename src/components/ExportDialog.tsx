import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Loader2, CheckCircle, AlertCircle, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportProgress: ExportProgress;
  exportedVideoUrl: string | null;
  isExporting: boolean;
  onStartExport: (quality: "720p" | "1080p", format: "mp4" | "webm") => void;
  onCancel: () => void;
  onDownload: () => void;
  onReset: () => void;
  hasSubtitles: boolean;
  hasAudio: boolean;
  hasMedia: boolean;
}

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
  hasSubtitles,
  hasAudio,
  hasMedia,
}: ExportDialogProps) => {
  const [quality, setQuality] = useState<"720p" | "1080p">("720p");
  const [format, setFormat] = useState<"mp4" | "webm">("mp4");

  const handleClose = () => {
    if (isExporting) {
      onCancel();
    }
    onReset();
    onOpenChange(false);
  };

  const canExport = hasMedia && (hasSubtitles || hasAudio);

  const getStatusIcon = () => {
    switch (exportProgress.status) {
      case "preparing":
      case "rendering":
      case "encoding":
        return <Loader2 className="w-8 h-8 text-primary animate-spin" />;
      case "complete":
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case "error":
        return <AlertCircle className="w-8 h-8 text-destructive" />;
      default:
        return <Film className="w-8 h-8 text-primary" />;
    }
  };

  const getStatusColor = () => {
    switch (exportProgress.status) {
      case "complete":
        return "bg-green-500";
      case "error":
        return "bg-destructive";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Film className="w-5 h-5" />
            Export Video dengan Subtitle
          </DialogTitle>
          <DialogDescription>
            Render video dengan subtitle yang sudah di-burn langsung ke dalam file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Display */}
          <AnimatePresence mode="wait">
            {exportProgress.status === "idle" ? (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Quality Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kualitas Video</label>
                  <Select value={quality} onValueChange={(v) => setQuality(v as "720p" | "1080p")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="720p">720p HD (Lebih cepat)</SelectItem>
                      <SelectItem value="1080p">1080p Full HD (Lebih lama)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Format Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Format Output</label>
                  <Select value={format} onValueChange={(v) => setFormat(v as "mp4" | "webm")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp4">MP4 (Kompatibel semua device)</SelectItem>
                      <SelectItem value="webm">WebM (Lebih cepat, lebih kecil)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Checklist */}
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Status:</p>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${hasMedia ? "bg-green-500" : "bg-muted-foreground"}`} />
                    <span className={hasMedia ? "text-foreground" : "text-muted-foreground"}>
                      Media {hasMedia ? "✓" : "(belum ada)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${hasAudio ? "bg-green-500" : "bg-muted-foreground"}`} />
                    <span className={hasAudio ? "text-foreground" : "text-muted-foreground"}>
                      Audio {hasAudio ? "✓" : "(opsional)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${hasSubtitles ? "bg-green-500" : "bg-muted-foreground"}`} />
                    <span className={hasSubtitles ? "text-foreground" : "text-muted-foreground"}>
                      Subtitle {hasSubtitles ? "✓" : "(belum ada)"}
                    </span>
                  </div>
                </div>

                {!canExport && (
                  <p className="text-sm text-muted-foreground">
                    Tambahkan media dan subtitle terlebih dahulu untuk export.
                  </p>
                )}

                {/* Info */}
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Catatan:</strong> Proses render berjalan real-time. 
                    Video 30 detik membutuhkan sekitar 30 detik untuk di-render.
                    {format === "mp4" && " Konversi ke MP4 membutuhkan waktu tambahan."}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="progress"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Status Icon */}
                <div className="flex flex-col items-center gap-3 py-4">
                  {getStatusIcon()}
                  <p className="text-sm font-medium text-center">{exportProgress.message}</p>
                </div>

                {/* Progress Bar */}
                {(isExporting || exportProgress.status === "complete") && (
                  <Progress value={exportProgress.progress} className={getStatusColor()} />
                )}

                {/* Video Preview */}
                {exportProgress.status === "complete" && exportedVideoUrl && (
                  <div className="rounded-lg overflow-hidden border border-border">
                    <video
                      src={exportedVideoUrl}
                      controls
                      className="w-full max-h-[300px] object-contain bg-black"
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          {exportProgress.status === "idle" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Batal
              </Button>
              <Button onClick={() => onStartExport(quality, format)} disabled={!canExport}>
                <Film className="w-4 h-4 mr-2" />
                Export ke {format.toUpperCase()}
              </Button>
            </>
          )}

          {isExporting && (
            <Button variant="destructive" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Batalkan
            </Button>
          )}

          {exportProgress.status === "complete" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Tutup
              </Button>
              <Button onClick={onDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download Video
              </Button>
            </>
          )}

          {exportProgress.status === "error" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Tutup
              </Button>
              <Button onClick={onReset}>
                Coba Lagi
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;