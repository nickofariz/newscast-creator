import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Scissors, 
  Film, 
  Image, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Trash2,
  GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { MediaFile } from "./FootageUploader";

interface MediaClip extends MediaFile {
  trimStart: number; // 0-1 percentage
  trimEnd: number; // 0-1 percentage
  clipDuration: number; // Effective duration in seconds
}

interface VideoEditorProps {
  mediaFiles: MediaFile[];
  onMediaUpdate: (files: MediaFile[]) => void;
  audioDuration: number;
}

const DEFAULT_CLIP_DURATION = 3; // seconds

const VideoEditor = ({ mediaFiles, onMediaUpdate, audioDuration }: VideoEditorProps) => {
  const [clips, setClips] = useState<MediaClip[]>([]);
  const [selectedClipIndex, setSelectedClipIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize clips from media files
  useEffect(() => {
    const newClips: MediaClip[] = mediaFiles.map((media) => ({
      ...media,
      trimStart: 0,
      trimEnd: 1,
      clipDuration: DEFAULT_CLIP_DURATION,
    }));
    setClips(newClips);
  }, [mediaFiles]);

  // Calculate total timeline duration
  const totalDuration = clips.reduce((acc, clip) => {
    const effectiveDuration = clip.clipDuration * (clip.trimEnd - clip.trimStart);
    return acc + effectiveDuration;
  }, 0);

  // Get current clip based on playback time
  const getCurrentClipInfo = useCallback(() => {
    let accumulatedTime = 0;
    for (let i = 0; i < clips.length; i++) {
      const clipEffectiveDuration = clips[i].clipDuration * (clips[i].trimEnd - clips[i].trimStart);
      if (currentTime >= accumulatedTime && currentTime < accumulatedTime + clipEffectiveDuration) {
        return {
          index: i,
          clip: clips[i],
          clipTime: currentTime - accumulatedTime,
          clipProgress: (currentTime - accumulatedTime) / clipEffectiveDuration,
        };
      }
      accumulatedTime += clipEffectiveDuration;
    }
    return null;
  }, [clips, currentTime]);

  const currentClipInfo = getCurrentClipInfo();

  // Playback timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, totalDuration]);

  // Handle trim change for selected clip
  const handleTrimChange = (type: "start" | "end", value: number) => {
    if (selectedClipIndex === null) return;

    setClips((prev) =>
      prev.map((clip, i) => {
        if (i !== selectedClipIndex) return clip;
        
        if (type === "start") {
          return { ...clip, trimStart: Math.min(value, clip.trimEnd - 0.1) };
        } else {
          return { ...clip, trimEnd: Math.max(value, clip.trimStart + 0.1) };
        }
      })
    );
  };

  // Handle duration change
  const handleDurationChange = (duration: number) => {
    if (selectedClipIndex === null) return;

    setClips((prev) =>
      prev.map((clip, i) =>
        i === selectedClipIndex ? { ...clip, clipDuration: duration } : clip
      )
    );
  };

  // Delete clip
  const handleDeleteClip = (index: number) => {
    const newClips = clips.filter((_, i) => i !== index);
    setClips(newClips);
    onMediaUpdate(newClips);
    if (selectedClipIndex === index) {
      setSelectedClipIndex(null);
    }
  };

  // Reset trim
  const handleResetTrim = () => {
    if (selectedClipIndex === null) return;

    setClips((prev) =>
      prev.map((clip, i) =>
        i === selectedClipIndex ? { ...clip, trimStart: 0, trimEnd: 1 } : clip
      )
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`;
  };

  if (mediaFiles.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-card/50 border border-border/50"
      >
        <div className="flex items-center gap-2 mb-3">
          <Scissors className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Video Editor</span>
        </div>
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Film className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Upload media untuk memulai editing
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Video Editor</span>
        </div>
        <span className="text-xs text-muted-foreground">
          Total: {formatTime(totalDuration)}
        </span>
      </div>

      {/* Preview Area */}
      <div className="relative aspect-[9/16] max-w-[180px] mx-auto rounded-xl overflow-hidden bg-background border border-border">
        {currentClipInfo ? (
          currentClipInfo.clip.type === "video" ? (
            <video
              ref={videoRef}
              src={currentClipInfo.clip.previewUrl}
              className="w-full h-full object-cover"
              muted
              playsInline
            />
          ) : (
            <img
              src={currentClipInfo.clip.previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          )
        ) : clips[0] ? (
          clips[0].type === "video" ? (
            <video
              src={clips[0].previewUrl}
              className="w-full h-full object-cover"
              muted
            />
          ) : (
            <img
              src={clips[0].previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          )
        ) : (
          <div className="w-full h-full gradient-dark" />
        )}

        {/* Playback controls overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </motion.button>
        </div>

        {/* Time indicator */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 text-[10px] text-white">
          <span className="bg-black/50 px-1.5 py-0.5 rounded">
            {formatTime(currentTime)}
          </span>
          <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(currentTime / totalDuration) * 100}%` }}
            />
          </div>
          <span className="bg-black/50 px-1.5 py-0.5 rounded">
            {formatTime(totalDuration)}
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-3 rounded-xl bg-card/50 border border-border/50">
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <GripVertical className="w-3 h-3" />
          Klik clip untuk edit trim
        </p>
        
        <div className="flex gap-1 overflow-x-auto pb-2">
          {clips.map((clip, index) => {
            const clipEffectiveDuration = clip.clipDuration * (clip.trimEnd - clip.trimStart);
            const widthPercent = (clipEffectiveDuration / totalDuration) * 100;
            const isSelected = selectedClipIndex === index;
            const isCurrent = currentClipInfo?.index === index;

            return (
              <motion.div
                key={clip.id}
                onClick={() => setSelectedClipIndex(index)}
                className={`relative flex-shrink-0 h-16 rounded-lg overflow-hidden cursor-pointer transition-all ${
                  isSelected
                    ? "ring-2 ring-primary"
                    : isCurrent
                    ? "ring-2 ring-accent"
                    : "ring-1 ring-border"
                }`}
                style={{ width: `${Math.max(60, widthPercent * 3)}px` }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Thumbnail */}
                {clip.type === "video" ? (
                  <video
                    src={clip.previewUrl}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={clip.previewUrl}
                    alt={clip.file.name}
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Trim overlay */}
                <div
                  className="absolute inset-y-0 left-0 bg-black/60"
                  style={{ width: `${clip.trimStart * 100}%` }}
                />
                <div
                  className="absolute inset-y-0 right-0 bg-black/60"
                  style={{ width: `${(1 - clip.trimEnd) * 100}%` }}
                />

                {/* Type badge */}
                <div className="absolute top-1 left-1 bg-black/60 rounded p-0.5">
                  {clip.type === "video" ? (
                    <Film className="w-2.5 h-2.5 text-white" />
                  ) : (
                    <Image className="w-2.5 h-2.5 text-white" />
                  )}
                </div>

                {/* Duration */}
                <div className="absolute bottom-1 left-1 text-[8px] text-white bg-black/60 px-1 rounded">
                  {formatTime(clipEffectiveDuration)}
                </div>

                {/* Index */}
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[8px] flex items-center justify-center font-medium">
                  {index + 1}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Trim Controls */}
      <AnimatePresence>
        {selectedClipIndex !== null && clips[selectedClipIndex] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-card border border-border space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">
                Clip {selectedClipIndex + 1} - Trim
              </h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleResetTrim}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteClip(selectedClipIndex)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Clip Duration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Durasi Clip
                </span>
                <span className="font-mono">{clips[selectedClipIndex].clipDuration}s</span>
              </div>
              <Slider
                value={[clips[selectedClipIndex].clipDuration]}
                onValueChange={([value]) => handleDurationChange(value)}
                min={1}
                max={10}
                step={0.5}
                className="w-full"
              />
            </div>

            {/* Trim Start */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <ChevronLeft className="w-3 h-3" />
                  Trim Start
                </span>
                <span className="font-mono">{Math.round(clips[selectedClipIndex].trimStart * 100)}%</span>
              </div>
              <Slider
                value={[clips[selectedClipIndex].trimStart]}
                onValueChange={([value]) => handleTrimChange("start", value)}
                min={0}
                max={0.9}
                step={0.01}
                className="w-full"
              />
            </div>

            {/* Trim End */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <ChevronRight className="w-3 h-3" />
                  Trim End
                </span>
                <span className="font-mono">{Math.round(clips[selectedClipIndex].trimEnd * 100)}%</span>
              </div>
              <Slider
                value={[clips[selectedClipIndex].trimEnd]}
                onValueChange={([value]) => handleTrimChange("end", value)}
                min={0.1}
                max={1}
                step={0.01}
                className="w-full"
              />
            </div>

            {/* Effective Duration */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Durasi Efektif</span>
                <span className="font-medium text-primary">
                  {formatTime(
                    clips[selectedClipIndex].clipDuration *
                      (clips[selectedClipIndex].trimEnd - clips[selectedClipIndex].trimStart)
                  )}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VideoEditor;
