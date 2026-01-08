import { motion, AnimatePresence } from "framer-motion";
import { Download, Clock, Trash2, Play, Cloud } from "lucide-react";
import { Button } from "./ui/button";

export interface VideoItem {
  id: string;
  title: string;
  createdAt: Date;
  duration: number;
  status: "completed" | "processing" | "failed";
  videoUrl?: string;
  audioUrl?: string;
}

interface VideoHistoryProps {
  videos: VideoItem[];
  onDownload: (id: string, url?: string) => void;
  onDelete: (id: string) => void;
}

const VideoHistory = ({ videos, onDownload, onDelete }: VideoHistoryProps) => {
  if (videos.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-sm">Belum ada video yang dibuat</p>
        <p className="text-muted-foreground/60 text-xs mt-1">
          Video yang Anda buat akan muncul di sini
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {videos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ delay: index * 0.05 }}
            className="group p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              {/* Thumbnail */}
              <div className="w-16 h-28 rounded-lg bg-secondary flex-shrink-0 flex items-center justify-center overflow-hidden">
                <div className="w-full h-full gradient-dark flex items-center justify-center">
                  <Play className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground truncate text-sm">
                  {video.title}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{video.duration}s</span>
                  <span>•</span>
                  <span>
                    {video.createdAt.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {/* Status */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {video.status === "completed" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Selesai
                    </span>
                  )}
                  {video.status === "processing" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      Memproses
                    </span>
                  )}
                  {video.status === "failed" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                      Gagal
                    </span>
                  )}
                  {/* Show if it's a proper MP4 video vs just audio */}
                  {video.videoUrl && video.videoUrl.includes(".mp4") ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                      <Cloud className="w-3 h-3" />
                      Video MP4
                    </span>
                  ) : video.audioUrl ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs">
                      Audio Only
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {video.status === "completed" && (
                  <Button
                    variant="glass"
                    size="icon"
                    onClick={() => onDownload(video.id, video.videoUrl || video.audioUrl)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(video.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default VideoHistory;
