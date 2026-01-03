import { motion } from "framer-motion";
import { ChevronLeft, Download, History, RefreshCw, Cloud, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import VideoHistory, { VideoItem } from "@/components/VideoHistory";

interface ExportStepProps {
  videos: VideoItem[];
  isLoadingVideos: boolean;
  onDownload: (id: string, url?: string) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  onStartNew: () => void;
  latestVideoUrl?: string;
}

const ExportStep = ({
  videos,
  isLoadingVideos,
  onDownload,
  onDelete,
  onBack,
  onStartNew,
  latestVideoUrl,
}: ExportStepProps) => {
  const latestVideo = videos[0];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Download className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-lg text-foreground">
            Download & Riwayat
          </h2>
          <p className="text-sm text-muted-foreground">
            Download video atau lihat riwayat pembuatan
          </p>
        </div>
      </div>

      {/* Latest Video Download Card */}
      {latestVideo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-xl p-6 border-2 border-green-500/30 bg-green-500/5"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Video Berhasil Dibuat!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {latestVideo.title}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="news"
                  onClick={() => onDownload(latestVideo.id, latestVideo.videoUrl || latestVideo.audioUrl)}
                  disabled={latestVideo.status !== "completed"}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Video
                </Button>
                <Button variant="glass" onClick={onStartNew}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Buat Video Baru
                </Button>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 text-xs">
              <Cloud className="w-3.5 h-3.5" />
              Tersimpan di Cloud
            </div>
          </div>
        </motion.div>
      )}

      {/* Video History */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Riwayat Video
          </h3>
          <span className="text-xs text-muted-foreground px-2 py-1 rounded-full bg-secondary">
            {videos.length} video
          </span>
        </div>

        {isLoadingVideos ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <VideoHistory videos={videos} onDownload={onDownload} onDelete={onDelete} />
        )}
      </div>

      {/* Navigation Button */}
      <div className="pt-4">
        <Button variant="glass" size="lg" onClick={onBack}>
          <ChevronLeft className="w-5 h-5" />
          Kembali ke Editor
        </Button>
      </div>
    </motion.div>
  );
};

export default ExportStep;
