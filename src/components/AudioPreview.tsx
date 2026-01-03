import { motion } from "framer-motion";
import { Play, Pause, Volume2, Loader2, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioPreviewProps {
  isGenerating: boolean;
  audioUrl: string | null;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  onPlay: () => void;
  onPause: () => void;
  onGenerate: () => void;
  disabled: boolean;
}

const AudioPreview = ({
  isGenerating,
  audioUrl,
  isPlaying,
  duration,
  currentTime,
  onPlay,
  onPause,
  onGenerate,
  disabled,
}: AudioPreviewProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2 mb-3">
        <Mic className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Voice Over AI</span>
      </div>

      <div className="p-4 rounded-xl bg-card/50 border border-border/50">
        {!audioUrl ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Volume2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Klik "Preview Audio" untuk mendengar voice over
            </p>
            <Button
              variant="newsOutline"
              size="sm"
              onClick={onGenerate}
              disabled={disabled || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4" />
                  Preview Audio
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Waveform visualization placeholder */}
            <div className="h-12 bg-background/50 rounded-lg overflow-hidden relative">
              <motion.div
                className="absolute inset-y-0 left-0 bg-primary/20"
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
              <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                {Array.from({ length: 40 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-primary/40 rounded-full"
                    animate={{
                      height: isPlaying
                        ? [8, 24, 8, 16, 8]
                        : 8,
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: isPlaying ? Infinity : 0,
                      delay: i * 0.02,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="glass"
                  size="icon"
                  className="h-10 w-10"
                  onClick={isPlaying ? onPause : onPlay}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 ml-0.5" />
                  )}
                </Button>
                <span className="text-xs text-muted-foreground font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={onGenerate}
                disabled={isGenerating}
                className="text-xs"
              >
                {isGenerating ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : null}
                Regenerate
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AudioPreview;
