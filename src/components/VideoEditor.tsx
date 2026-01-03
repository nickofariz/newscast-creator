import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { 
  Scissors, 
  Film, 
  Image, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw,
  Trash2,
  ZoomIn,
  ZoomOut,
  GripVertical,
  Volume2,
  Layers,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { MediaFile } from "./FootageUploader";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface MediaClip extends MediaFile {
  trimStart: number;
  trimEnd: number;
  clipDuration: number;
}

interface VideoEditorProps {
  mediaFiles: MediaFile[];
  onMediaUpdate: (files: MediaFile[]) => void;
  audioDuration: number;
}

const DEFAULT_CLIP_DURATION = 3;
const TIMELINE_PIXELS_PER_SECOND = 60;

const VideoEditor = ({ mediaFiles, onMediaUpdate, audioDuration }: VideoEditorProps) => {
  const [clips, setClips] = useState<MediaClip[]>([]);
  const [selectedClipIndex, setSelectedClipIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isDraggingTrim, setIsDraggingTrim] = useState<{ clipIndex: number; handle: "start" | "end" } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const newClips: MediaClip[] = mediaFiles.map((media) => ({
      ...media,
      trimStart: 0,
      trimEnd: 1,
      clipDuration: DEFAULT_CLIP_DURATION,
    }));
    setClips(newClips);
  }, [mediaFiles]);

  const totalDuration = clips.reduce((acc, clip) => {
    const effectiveDuration = clip.clipDuration * (clip.trimEnd - clip.trimStart);
    return acc + effectiveDuration;
  }, 0);

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

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.05;
        });
      }, 50);
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

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || isDraggingTrim) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + timelineRef.current.scrollLeft;
    const clickedTime = x / (TIMELINE_PIXELS_PER_SECOND * zoom);
    setCurrentTime(Math.max(0, Math.min(totalDuration, clickedTime)));
  };

  const handleTrimDrag = (e: React.MouseEvent, clipIndex: number, handle: "start" | "end") => {
    e.stopPropagation();
    setIsDraggingTrim({ clipIndex, handle });
    setSelectedClipIndex(clipIndex);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!timelineRef.current) return;
      
      const rect = timelineRef.current.getBoundingClientRect();
      const x = moveEvent.clientX - rect.left + timelineRef.current.scrollLeft;
      
      // Calculate clip start position in pixels
      let clipStartPx = 0;
      for (let i = 0; i < clipIndex; i++) {
        clipStartPx += clips[i].clipDuration * (clips[i].trimEnd - clips[i].trimStart) * TIMELINE_PIXELS_PER_SECOND * zoom;
      }
      
      const clipWidthPx = clips[clipIndex].clipDuration * TIMELINE_PIXELS_PER_SECOND * zoom;
      const relativeX = (x - clipStartPx) / clipWidthPx;
      
      setClips((prev) =>
        prev.map((clip, i) => {
          if (i !== clipIndex) return clip;
          
          if (handle === "start") {
            const newStart = Math.max(0, Math.min(clip.trimEnd - 0.1, relativeX));
            return { ...clip, trimStart: newStart };
          } else {
            const newEnd = Math.max(clip.trimStart + 0.1, Math.min(1, relativeX));
            return { ...clip, trimEnd: newEnd };
          }
        })
      );
    };

    const handleMouseUp = () => {
      setIsDraggingTrim(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleClipReorder = (newOrder: MediaClip[]) => {
    setClips(newOrder);
    onMediaUpdate(newOrder);
  };

  const handleDurationChange = (duration: number) => {
    if (selectedClipIndex === null) return;

    setClips((prev) =>
      prev.map((clip, i) =>
        i === selectedClipIndex ? { ...clip, clipDuration: duration } : clip
      )
    );
  };

  const handleDeleteClip = (index: number) => {
    const newClips = clips.filter((_, i) => i !== index);
    setClips(newClips);
    onMediaUpdate(newClips);
    if (selectedClipIndex === index) {
      setSelectedClipIndex(null);
    }
  };

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
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  const getTimelineWidth = () => {
    return Math.max(totalDuration * TIMELINE_PIXELS_PER_SECOND * zoom, 600);
  };

  const renderTimeRuler = () => {
    const width = getTimelineWidth();
    const secondsVisible = width / (TIMELINE_PIXELS_PER_SECOND * zoom);
    const marks = [];
    
    const interval = zoom >= 1.5 ? 0.5 : zoom >= 0.75 ? 1 : 2;
    
    for (let i = 0; i <= secondsVisible; i += interval) {
      marks.push(
        <div
          key={i}
          className="absolute flex flex-col items-center"
          style={{ left: `${i * TIMELINE_PIXELS_PER_SECOND * zoom}px` }}
        >
          <div className="h-2 w-px bg-muted-foreground/40" />
          <span className="text-[9px] text-muted-foreground mt-0.5">{i}s</span>
        </div>
      );
    }
    
    return marks;
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
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Layers className="w-7 h-7 text-muted-foreground" />
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
      className="space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Timeline Editor</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
        </div>
      </div>

      {/* Preview & Controls */}
      <div className="flex gap-4">
        {/* Mini Preview */}
        <div className="relative w-24 aspect-[9/16] rounded-lg overflow-hidden bg-background border border-border flex-shrink-0">
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
        </div>

        {/* Controls */}
        <div className="flex-1 flex flex-col justify-center gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            
            <div className="h-6 w-px bg-border" />
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-[10px] text-muted-foreground">
            Drag handles kiri/kanan pada clip untuk trim • Drag clip untuk reorder
          </p>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="rounded-xl bg-secondary/50 border border-border overflow-hidden">
        {/* Time Ruler */}
        <div className="h-6 bg-card/80 border-b border-border relative overflow-hidden">
          <ScrollArea className="w-full">
            <div 
              className="relative h-6" 
              style={{ width: `${getTimelineWidth()}px` }}
            >
              {renderTimeRuler()}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* Audio Track (if available) */}
        {audioDuration > 0 && (
          <div className="h-8 bg-card/40 border-b border-border px-2 py-1">
            <div className="flex items-center gap-2 h-full">
              <Volume2 className="w-3 h-3 text-primary flex-shrink-0" />
              <div 
                className="h-full rounded bg-primary/20 border border-primary/40 flex items-center px-2"
                style={{ width: `${audioDuration * TIMELINE_PIXELS_PER_SECOND * zoom}px` }}
              >
                <div className="flex-1 h-3 flex items-center gap-px">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-0.5 bg-primary/60 rounded-full"
                      style={{ height: `${20 + Math.random() * 80}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Media Track */}
        <div 
          ref={timelineRef}
          className="relative min-h-[100px] bg-card/20 cursor-pointer"
          onClick={handleTimelineClick}
        >
          <ScrollArea className="w-full">
            <div 
              className="relative py-2 px-2" 
              style={{ width: `${getTimelineWidth()}px`, minHeight: "96px" }}
            >
              {/* Layer Label */}
              <div className="absolute left-2 top-2 flex items-center gap-1 text-[10px] text-muted-foreground bg-card/80 px-1.5 py-0.5 rounded z-10">
                <Layers className="w-3 h-3" />
                Media
              </div>

              {/* Clips Track */}
              <div className="flex items-center pt-6 gap-0.5">
                <Reorder.Group
                  axis="x"
                  values={clips}
                  onReorder={handleClipReorder}
                  className="flex items-center gap-0.5"
                >
                  {clips.map((clip, index) => {
                    const clipWidth = clip.clipDuration * TIMELINE_PIXELS_PER_SECOND * zoom;
                    const trimmedWidth = clipWidth * (clip.trimEnd - clip.trimStart);
                    const isSelected = selectedClipIndex === index;
                    const isCurrent = currentClipInfo?.index === index;

                    return (
                      <Reorder.Item
                        key={clip.id}
                        value={clip}
                        className="relative"
                        style={{ width: `${trimmedWidth}px` }}
                      >
                        <motion.div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClipIndex(index);
                          }}
                          className={`relative h-16 rounded-md overflow-hidden cursor-pointer group ${
                            isSelected
                              ? "ring-2 ring-primary shadow-lg"
                              : isCurrent
                              ? "ring-2 ring-accent"
                              : "ring-1 ring-border hover:ring-muted-foreground"
                          }`}
                          whileTap={{ scale: 0.98 }}
                        >
                          {/* Thumbnail */}
                          <div className="absolute inset-0">
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
                            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
                          </div>

                          {/* Drag Handle */}
                          <div className="absolute top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical className="w-3 h-3 text-white/80" />
                          </div>

                          {/* Type badge */}
                          <div className="absolute top-1 left-1 bg-black/60 rounded p-0.5">
                            {clip.type === "video" ? (
                              <Film className="w-2.5 h-2.5 text-white" />
                            ) : (
                              <Image className="w-2.5 h-2.5 text-white" />
                            )}
                          </div>

                          {/* Index & Duration */}
                          <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
                            <span className="text-[8px] text-white bg-black/60 px-1 rounded">
                              {formatTime(clip.clipDuration * (clip.trimEnd - clip.trimStart))}
                            </span>
                            <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[8px] flex items-center justify-center font-medium">
                              {index + 1}
                            </span>
                          </div>

                          {/* Trim Handles */}
                          <div
                            onMouseDown={(e) => handleTrimDrag(e, index, "start")}
                            className="absolute inset-y-0 left-0 w-2 bg-primary/80 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-primary"
                          >
                            <div className="w-0.5 h-6 bg-white rounded-full" />
                          </div>
                          <div
                            onMouseDown={(e) => handleTrimDrag(e, index, "end")}
                            className="absolute inset-y-0 right-0 w-2 bg-primary/80 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-primary"
                          >
                            <div className="w-0.5 h-6 bg-white rounded-full" />
                          </div>
                        </motion.div>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              </div>

              {/* Playhead */}
              <div
                ref={playheadRef}
                className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none"
                style={{ left: `${currentTime * TIMELINE_PIXELS_PER_SECOND * zoom + 8}px` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full border-2 border-primary-foreground shadow-lg" />
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>

      {/* Clip Properties Panel */}
      <AnimatePresence>
        {selectedClipIndex !== null && clips[selectedClipIndex] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-card border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md overflow-hidden">
                    {clips[selectedClipIndex].type === "video" ? (
                      <video
                        src={clips[selectedClipIndex].previewUrl}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <img
                        src={clips[selectedClipIndex].previewUrl}
                        alt="Selected"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">
                      Clip {selectedClipIndex + 1}
                    </h4>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                      {clips[selectedClipIndex].file.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleResetTrim}
                    title="Reset Trim"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteClip(selectedClipIndex)}
                    title="Delete Clip"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setSelectedClipIndex(null)}
                    title="Close"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Duration */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Durasi
                    </span>
                    <span className="font-mono">{clips[selectedClipIndex].clipDuration}s</span>
                  </div>
                  <Slider
                    value={[clips[selectedClipIndex].clipDuration]}
                    onValueChange={([value]) => handleDurationChange(value)}
                    min={1}
                    max={15}
                    step={0.5}
                    className="w-full"
                  />
                </div>

                {/* Trim Info */}
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">Trim Range</p>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="bg-secondary px-2 py-1 rounded">
                      {Math.round(clips[selectedClipIndex].trimStart * 100)}%
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="bg-secondary px-2 py-1 rounded">
                      {Math.round(clips[selectedClipIndex].trimEnd * 100)}%
                    </span>
                  </div>
                  <p className="text-[10px] text-primary">
                    Durasi efektif: {formatTime(
                      clips[selectedClipIndex].clipDuration *
                        (clips[selectedClipIndex].trimEnd - clips[selectedClipIndex].trimStart)
                    )}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VideoEditor;
