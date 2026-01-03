import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Loader2, CheckCircle, AlertCircle, Film, ImageIcon } from "lucide-react";
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
  status: "idle" | "preparing" | "rendering" | "encoding" | "converting" | "complete" | "error";
  progress: number;
  message: string;
  estimatedTimeRemaining?: number;
}

interface MediaPreview {
  previewUrl: string;
  type: "video" | "image";
}

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportProgress: ExportProgress;
  exportedVideoUrl: string | null;
  isExporting: boolean;
  onStartExport: (quality: "720p" | "1080p", format: "webm" | "mp4") => void;
  onCancel: () => void;
  onDownload: () => void;
  onReset: () => void;
  hasSubtitles: boolean;
  hasAudio: boolean;
  hasMedia: boolean;
  mediaPreviews?: MediaPreview[];
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
  mediaPreviews = [],
}: ExportDialogProps) => {
  const [quality, setQuality] = useState<"720p" | "1080p">("720p");
  const [format, setFormat] = useState<"webm" | "mp4">("mp4");
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate thumbnails from media previews
  useEffect(() => {
    if (!open || mediaPreviews.length === 0) {
      setThumbnails([]);
      return;
    }

    const generateThumbnails = async () => {
      const thumbs: string[] = [];
      const maxThumbs = Math.min(4, mediaPreviews.length);

      for (let i = 0; i < maxThumbs; i++) {
        const media = mediaPreviews[i];
        
        if (media.type === "image") {
          thumbs.push(media.previewUrl);
        } else if (media.type === "video") {
          // Generate thumbnail from video
          try {
            const video = document.createElement("video");
            video.src = media.previewUrl;
            video.crossOrigin = "anonymous";
            video.muted = true;
            video.preload = "metadata";
            
            await new Promise<void>((resolve) => {
              video.onloadeddata = () => {
                video.currentTime = 0.1;
              };
              video.onseeked = () => {
                const canvas = document.createElement("canvas");
                canvas.width = 160;
                canvas.height = 90;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  thumbs.push(canvas.toDataURL("image/jpeg", 0.7));
                }
                resolve();
              };
              video.onerror = () => resolve();
            });
          } catch {
            // Skip failed thumbnails
          }
        }
      }
      
      setThumbnails(thumbs);
    };

    generateThumbnails();
  }, [open, mediaPreviews]);

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
      case "converting":
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
                  <label className="text-sm font-medium">Format Video</label>
                  <Select value={format} onValueChange={(v) => setFormat(v as "webm" | "mp4")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mp4">MP4 (Kompatibel luas)</SelectItem>
                      <SelectItem value="webm">WebM (Lebih cepat)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Thumbnail Preview */}
                {thumbnails.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      <label className="text-sm font-medium">Preview Media</label>
                    </div>
                    <div className="grid grid-cols-4 gap-2 p-3 bg-muted/30 rounded-lg">
                      {thumbnails.map((thumb, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="aspect-video rounded-md overflow-hidden border border-border bg-black"
                        >
                          <img
                            src={thumb}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </motion.div>
                      ))}
                      {mediaPreviews.length > 4 && (
                        <div className="aspect-video rounded-md overflow-hidden border border-border bg-muted flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">+{mediaPreviews.length - 4}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                    {format === "mp4" && " Konversi ke MP4 memerlukan waktu tambahan."}
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
                Mulai Export
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
