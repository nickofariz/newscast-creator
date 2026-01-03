import { useState, useRef, useEffect, useCallback } from "react";
import { motion, Reorder } from "framer-motion";
import { 
  Film, 
  Image, 
  Play, 
  Pause, 
  Volume2,
  Type,
  ImageIcon,
  ZoomIn,
  ZoomOut,
  Trash2,
  GripVertical,
  Clock,
  GripHorizontal,
  RotateCcw,
  Keyboard,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MediaFile } from "./FootageUploader";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import AudioWaveform from "./AudioWaveform";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MediaClip extends MediaFile {
  trimStart: number;
  trimEnd: number;
  clipDuration: number;
}

interface LayerTiming {
  startTime: number;
  duration: number;
}

export interface EditedClip {
  id: string;
  previewUrl: string;
  type: "video" | "image";
  startTime: number;
  endTime: number;
  effectiveDuration: number;
}

interface VideoEditorProps {
  mediaFiles: MediaFile[];
  onMediaUpdate: (files: MediaFile[]) => void;
  audioDuration: number;
  audioUrl?: string | null;
  overlayText?: string;
  overlayImage?: string | null;
  currentTime: number;
  isPlaying: boolean;
  onSeek?: (time: number) => void;
  onClipsChange?: (clips: EditedClip[]) => void;
}

const DEFAULT_CLIP_DURATION = 3;
const TIMELINE_PIXELS_PER_SECOND = 50;
const MIN_DURATION = 0.5;

const VideoEditor = ({ 
  mediaFiles, 
  onMediaUpdate, 
  audioDuration,
  audioUrl,
  overlayText,
  overlayImage,
  currentTime,
  isPlaying,
  onSeek,
  onClipsChange
}: VideoEditorProps) => {
  const [clips, setClips] = useState<MediaClip[]>([]);
  const [selectedClipIndex, setSelectedClipIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [textTiming, setTextTiming] = useState<LayerTiming>({ startTime: 0, duration: 10 });
  const [imageTiming, setImageTiming] = useState<LayerTiming>({ startTime: 0, duration: 10 });
  const [isDragging, setIsDragging] = useState<{
    type: 'media-trim-start' | 'media-trim-end' | 'media-end' | 'text-start' | 'text-end' | 'text-move' | 'image-start' | 'image-end' | 'image-move';
    index?: number;
    startX: number;
    originalValue: number;
    originalStart?: number;
    originalTrimStart?: number;
    originalTrimEnd?: number;
  } | null>(null);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  
  const timelineRef = useRef<HTMLDivElement>(null);

  // Auto-fit clips to audio duration
  useEffect(() => {
    if (mediaFiles.length === 0) {
      setClips([]);
      return;
    }

    // Calculate duration per clip based on audio duration
    const targetDuration = audioDuration > 0 ? audioDuration : mediaFiles.length * DEFAULT_CLIP_DURATION;
    const durationPerClip = targetDuration / mediaFiles.length;

    const newClips: MediaClip[] = mediaFiles.map((media) => ({
      ...media,
      trimStart: 0,
      trimEnd: 1,
      clipDuration: durationPerClip,
    }));
    setClips(newClips);
  }, [mediaFiles, audioDuration]);

  const mediaDuration = clips.reduce((acc, clip) => {
    const effectiveDuration = clip.clipDuration * (clip.trimEnd - clip.trimStart);
    return acc + effectiveDuration;
  }, 0);

  const totalDuration = Math.max(mediaDuration, audioDuration || 0, textTiming.startTime + textTiming.duration, imageTiming.startTime + imageTiming.duration);

  // Calculate and expose edited clips data for VideoPreview
  useEffect(() => {
    if (!onClipsChange) return;
    
    let accumulatedTime = 0;
    const editedClips: EditedClip[] = clips.map((clip) => {
      const effectiveDuration = clip.clipDuration * (clip.trimEnd - clip.trimStart);
      const startTime = accumulatedTime;
      const endTime = accumulatedTime + effectiveDuration;
      accumulatedTime = endTime;
      
      return {
        id: clip.id,
        previewUrl: clip.previewUrl,
        type: clip.type,
        startTime,
        endTime,
        effectiveDuration,
      };
    });
    
    onClipsChange(editedClips);
  }, [clips, onClipsChange]);

  // Update layer timings when total duration changes
  useEffect(() => {
    if (totalDuration > 0) {
      setTextTiming(prev => ({ ...prev, duration: Math.max(prev.duration, totalDuration) }));
      setImageTiming(prev => ({ ...prev, duration: Math.max(prev.duration, totalDuration) }));
    }
  }, [totalDuration]);

  // Keyboard shortcuts for timeline editor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const selectedClip = selectedClipIndex !== null ? clips[selectedClipIndex] : null;

      // Space - play/pause (handled by parent, but we prevent default)
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        // Play/pause is handled by parent component
      }

      // Escape - deselect clip
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedClipIndex(null);
      }

      // Left/Right arrow - move playhead
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const step = e.shiftKey ? 1 : 0.1;
        onSeek?.(Math.max(0, currentTime - step));
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const step = e.shiftKey ? 1 : 0.1;
        onSeek?.(Math.min(totalDuration, currentTime + step));
      }

      // +/- or =/- for zoom
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        setZoom(prev => Math.min(2, prev + 0.25));
      }
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom(prev => Math.max(0.5, prev - 0.25));
      }

      // Home - go to start
      if (e.key === 'Home') {
        e.preventDefault();
        onSeek?.(0);
      }

      // End - go to end
      if (e.key === 'End') {
        e.preventDefault();
        onSeek?.(totalDuration);
      }

      // Shortcuts that require selected clip
      if (selectedClipIndex !== null && selectedClip) {
        // Delete key - remove selected clip
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          handleDeleteClip(selectedClipIndex);
        }

        // R key - reset trim
        if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          if (selectedClip.trimStart > 0 || selectedClip.trimEnd < 1) {
            setClips(prev => prev.map((c, i) => 
              i === selectedClipIndex ? { ...c, trimStart: 0, trimEnd: 1 } : c
            ));
          }
        }

        // [ key - select previous clip
        if (e.key === '[') {
          e.preventDefault();
          if (selectedClipIndex > 0) {
            setSelectedClipIndex(selectedClipIndex - 1);
          }
        }

        // ] key - select next clip
        if (e.key === ']') {
          e.preventDefault();
          if (selectedClipIndex < clips.length - 1) {
            setSelectedClipIndex(selectedClipIndex + 1);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipIndex, clips, currentTime, totalDuration, onSeek]);

  // Note: currentTime and isPlaying now come from props (controlled by parent)

  // Handle drag events
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - isDragging.startX;
      const deltaTime = deltaX / (TIMELINE_PIXELS_PER_SECOND * zoom);

      if (isDragging.type === 'media-trim-start' && isDragging.index !== undefined) {
        // Trim dari awal video - geser trimStart (0-1 range)
        const clip = clips[isDragging.index];
        const originalTrimStart = isDragging.originalTrimStart ?? 0;
        const trimDelta = deltaTime / clip.clipDuration;
        const newTrimStart = Math.max(0, Math.min(clip.trimEnd - 0.1, originalTrimStart + trimDelta));
        setClips(prev => prev.map((c, i) => 
          i === isDragging.index ? { ...c, trimStart: newTrimStart } : c
        ));
      } else if (isDragging.type === 'media-trim-end' && isDragging.index !== undefined) {
        // Trim dari akhir video - geser trimEnd (0-1 range)
        const clip = clips[isDragging.index];
        const originalTrimEnd = isDragging.originalTrimEnd ?? 1;
        const trimDelta = deltaTime / clip.clipDuration;
        const newTrimEnd = Math.max(clip.trimStart + 0.1, Math.min(1, originalTrimEnd + trimDelta));
        setClips(prev => prev.map((c, i) => 
          i === isDragging.index ? { ...c, trimEnd: newTrimEnd } : c
        ));
      } else if (isDragging.type === 'media-end' && isDragging.index !== undefined) {
        const newDuration = Math.max(MIN_DURATION, isDragging.originalValue + deltaTime);
        setClips(prev => prev.map((clip, i) => 
          i === isDragging.index ? { ...clip, clipDuration: newDuration } : clip
        ));
      } else if (isDragging.type === 'text-end') {
        const newDuration = Math.max(MIN_DURATION, isDragging.originalValue + deltaTime);
        setTextTiming(prev => ({ ...prev, duration: newDuration }));
      } else if (isDragging.type === 'text-start') {
        const newStart = Math.max(0, isDragging.originalValue + deltaTime);
        setTextTiming(prev => ({ ...prev, startTime: newStart }));
      } else if (isDragging.type === 'text-move') {
        const newStart = Math.max(0, isDragging.originalStart! + deltaTime);
        setTextTiming(prev => ({ ...prev, startTime: newStart }));
      } else if (isDragging.type === 'image-end') {
        const newDuration = Math.max(MIN_DURATION, isDragging.originalValue + deltaTime);
        setImageTiming(prev => ({ ...prev, duration: newDuration }));
      } else if (isDragging.type === 'image-start') {
        const newStart = Math.max(0, isDragging.originalValue + deltaTime);
        setImageTiming(prev => ({ ...prev, startTime: newStart }));
      } else if (isDragging.type === 'image-move') {
        const newStart = Math.max(0, isDragging.originalStart! + deltaTime);
        setImageTiming(prev => ({ ...prev, startTime: newStart }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, zoom]);

  // Handle playhead drag
  useEffect(() => {
    if (!isDraggingPlayhead) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - 80; // 80 = label width
      const newTime = Math.max(0, Math.min(totalDuration, x / (TIMELINE_PIXELS_PER_SECOND * zoom)));
      onSeek?.(newTime);
    };

    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPlayhead, totalDuration, zoom, onSeek]);

  const handlePlayheadMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingPlayhead(true);
  };

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingPlayhead || isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedTime = Math.max(0, Math.min(totalDuration, x / (TIMELINE_PIXELS_PER_SECOND * zoom)));
    onSeek?.(clickedTime);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || isDragging || isDraggingPlayhead) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 80; // 80 = label width
    const clickedTime = Math.max(0, Math.min(totalDuration, x / (TIMELINE_PIXELS_PER_SECOND * zoom)));
    onSeek?.(clickedTime);
  };

  const handleClipReorder = (newOrder: MediaClip[]) => {
    setClips(newOrder);
    onMediaUpdate(newOrder);
  };

  const handleDeleteClip = (index: number) => {
    const newClips = clips.filter((_, i) => i !== index);
    setClips(newClips);
    onMediaUpdate(newClips);
    if (selectedClipIndex === index) {
      setSelectedClipIndex(null);
    }
  };

  const startDrag = (
    e: React.MouseEvent,
    type: typeof isDragging extends null ? never : NonNullable<typeof isDragging>['type'],
    originalValue: number,
    index?: number,
    originalStart?: number,
    originalTrimStart?: number,
    originalTrimEnd?: number
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDragging({ type, index, startX: e.clientX, originalValue, originalStart, originalTrimStart, originalTrimEnd });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimelineWidth = () => {
    return Math.max(totalDuration * TIMELINE_PIXELS_PER_SECOND * zoom, 400);
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
          <div className="h-2 w-px bg-muted-foreground/30" />
          <span className="text-[8px] text-muted-foreground">{i}s</span>
        </div>
      );
    }
    return marks;
  };

  // Resize handle component
  const ResizeHandle = ({ 
    side, 
    onMouseDown,
    color
  }: { 
    side: 'left' | 'right';
    onMouseDown: (e: React.MouseEvent) => void;
    color: string;
  }) => (
    <div
      onMouseDown={onMouseDown}
      className={`absolute top-0 bottom-0 w-2 cursor-ew-resize z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
        side === 'left' ? 'left-0' : 'right-0'
      } ${color}`}
    >
      <div className="w-0.5 h-4 bg-current rounded-full" />
    </div>
  );

  // Layer component
  const LayerRow = ({ 
    icon: Icon, 
    label, 
    color, 
    children,
    isEmpty = false
  }: { 
    icon: React.ElementType; 
    label: string; 
    color: string;
    children?: React.ReactNode;
    isEmpty?: boolean;
  }) => (
    <div className="flex border-b border-border/50 last:border-b-0">
      <div className="w-20 flex-shrink-0 p-2 bg-card/50 border-r border-border/50 flex items-center gap-1.5">
        <Icon className={`w-3 h-3 ${color}`} />
        <span className="text-[10px] font-medium text-muted-foreground truncate">{label}</span>
      </div>
      <div className="flex-1 min-h-[40px] relative">
        {isEmpty ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] text-muted-foreground/50">Kosong</span>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );

  if (mediaFiles.length === 0 && !audioDuration) {
    return (
      <div className="p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-2">
          <Film className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Upload media untuk memulai editing
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Controls - time display only, play/pause controlled by parent */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 p-0 flex items-center justify-center rounded-md border ${isPlaying ? 'bg-primary/10 border-primary' : 'bg-muted/50 border-border'}`}>
            {isPlaying ? (
              <Pause className="w-4 h-4 text-primary" />
            ) : (
              <Play className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
          >
            <ZoomOut className="w-3 h-3" />
          </Button>
          <span className="text-[10px] text-muted-foreground w-8 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setZoom(Math.min(2, zoom + 0.25))}
          >
            <ZoomIn className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Drag hint */}
      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        <GripHorizontal className="w-3 h-3" />
        Drag tepi clip untuk trim video/gambar, drag layer overlay untuk atur durasi
      </p>

      {/* Multi-Layer Timeline */}
      <div className="rounded-lg border border-border overflow-hidden bg-card/30">
        {/* Time Ruler */}
        <div className="flex border-b border-border">
          <div className="w-20 flex-shrink-0 p-1 bg-card/50 border-r border-border/50">
            <Clock className="w-3 h-3 text-muted-foreground mx-auto" />
          </div>
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="w-full">
              <div 
                className="h-5 relative cursor-pointer"
                style={{ width: `${getTimelineWidth()}px` }}
                onClick={handleRulerClick}
              >
                {renderTimeRuler()}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>

        {/* Layers Container */}
        <div 
          ref={timelineRef}
          onClick={handleTimelineClick}
          className="relative cursor-crosshair"
        >
          {/* Layer 1: Media (Video/Photo) */}
          <LayerRow icon={Film} label="Media" color="text-blue-500" isEmpty={clips.length === 0}>
            <ScrollArea className="w-full h-full">
              <div 
                className="flex items-center gap-0.5 p-1 min-h-[38px]"
                style={{ width: `${getTimelineWidth()}px` }}
              >
                <Reorder.Group
                  axis="x"
                  values={clips}
                  onReorder={handleClipReorder}
                  className="flex items-center gap-0.5"
                >
                  {clips.map((clip, index) => {
                    const clipWidth = clip.clipDuration * (clip.trimEnd - clip.trimStart) * TIMELINE_PIXELS_PER_SECOND * zoom;
                    const isSelected = selectedClipIndex === index;

                    return (
                      <Reorder.Item
                        key={clip.id}
                        value={clip}
                        className="relative"
                        style={{ width: `${clipWidth}px` }}
                      >
                        <motion.div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClipIndex(isSelected ? null : index);
                          }}
                          className={`relative h-[30px] rounded overflow-hidden cursor-pointer group ${
                            isSelected
                              ? "ring-2 ring-primary"
                              : "ring-1 ring-border hover:ring-primary/50"
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
                            <div className="absolute inset-0 bg-black/20" />
                          </div>

                          {/* Drag Handle */}
                          <div className="absolute top-0.5 left-0.5 opacity-0 group-hover:opacity-100">
                            <GripVertical className="w-2 h-2 text-white/80" />
                          </div>

                          {/* Type & Duration */}
                          <div className="absolute bottom-0.5 left-0.5 right-0.5 flex items-center justify-between">
                            <div className="bg-black/60 rounded p-0.5">
                              {clip.type === "video" ? (
                                <Film className="w-2 h-2 text-white" />
                              ) : (
                                <Image className="w-2 h-2 text-white" />
                              )}
                            </div>
                            <span className="text-[7px] text-white bg-black/60 px-0.5 rounded">
                              {formatTime(clip.clipDuration * (clip.trimEnd - clip.trimStart))}
                            </span>
                          </div>

                          {/* Trim Indicator */}
                          {(clip.trimStart > 0 || clip.trimEnd < 1) && (
                            <div className="absolute top-0.5 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white text-[7px] px-1 rounded-sm font-medium shadow-sm">
                              {Math.round(clip.trimStart * 100)}% - {Math.round(clip.trimEnd * 100)}%
                            </div>
                          )}

                          {/* Trim visual overlay - show trimmed areas */}
                          {clip.trimStart > 0 && (
                            <div 
                              className="absolute top-0 bottom-0 left-0 bg-black/50 pointer-events-none"
                              style={{ width: `${clip.trimStart * 100}%` }}
                            >
                              <div className="absolute inset-0 bg-stripes opacity-30" />
                            </div>
                          )}
                          {clip.trimEnd < 1 && (
                            <div 
                              className="absolute top-0 bottom-0 right-0 bg-black/50 pointer-events-none"
                              style={{ width: `${(1 - clip.trimEnd) * 100}%` }}
                            >
                              <div className="absolute inset-0 bg-stripes opacity-30" />
                            </div>
                          )}

                          {/* Trim handle - left side (trim start) */}
                          <ResizeHandle
                            side="left"
                            color="text-blue-400"
                            onMouseDown={(e) => startDrag(e, 'media-trim-start', clip.clipDuration, index, undefined, clip.trimStart, clip.trimEnd)}
                          />
                          
                          {/* Trim handle - right side (trim end) */}
                          <ResizeHandle
                            side="right"
                            color="text-blue-400"
                            onMouseDown={(e) => startDrag(e, 'media-trim-end', clip.clipDuration, index, undefined, clip.trimStart, clip.trimEnd)}
                          />

                          {/* Action buttons on hover/select */}
                          {isSelected && (
                            <div className="absolute top-0.5 right-0.5 flex items-center gap-0.5">
                              {/* Reset trim button - only show if trimmed */}
                              {(clip.trimStart > 0 || clip.trimEnd < 1) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setClips(prev => prev.map((c, i) => 
                                      i === index ? { ...c, trimStart: 0, trimEnd: 1 } : c
                                    ));
                                  }}
                                  className="bg-blue-600 rounded p-0.5"
                                  title="Reset trim"
                                >
                                  <RotateCcw className="w-2 h-2 text-white" />
                                </button>
                              )}
                              {/* Delete button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClip(index);
                                }}
                                className="bg-destructive rounded p-0.5"
                                title="Hapus clip"
                              >
                                <Trash2 className="w-2 h-2 text-white" />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </LayerRow>

          {/* Layer 2: Audio (Voice Over) - Fixed duration from TTS */}
          <LayerRow icon={Volume2} label="Audio" color="text-green-500" isEmpty={!audioDuration}>
            {audioDuration > 0 && (
              <ScrollArea className="w-full h-full">
                <div 
                  className="p-1 min-h-[38px]"
                  style={{ width: `${getTimelineWidth()}px` }}
                >
                  <div 
                    className="h-[30px] rounded bg-green-500/20 border border-green-500/40 flex items-center px-1.5 group relative overflow-hidden"
                    style={{ width: `${audioDuration * TIMELINE_PIXELS_PER_SECOND * zoom}px` }}
                  >
                    {audioUrl ? (
                      <AudioWaveform
                        audioUrl={audioUrl}
                        width={Math.max(50, audioDuration * TIMELINE_PIXELS_PER_SECOND * zoom - 40)}
                        height={24}
                        barWidth={2}
                        barGap={1}
                        barColor="rgb(34 197 94 / 0.7)"
                      />
                    ) : (
                      <div className="flex-1 h-4 flex items-center gap-px overflow-hidden">
                        {Array.from({ length: Math.min(50, Math.floor(audioDuration * 5)) }).map((_, i) => (
                          <div
                            key={i}
                            className="w-0.5 bg-green-500/60 rounded-full flex-shrink-0"
                            style={{ height: `${30 + Math.random() * 70}%` }}
                          />
                        ))}
                      </div>
                    )}
                    <span className="text-[8px] text-green-600 ml-1 bg-green-500/20 px-1 rounded flex-shrink-0">{formatTime(audioDuration)}</span>
                  </div>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </LayerRow>

          {/* Layer 3: Text Overlay - Draggable */}
          <LayerRow icon={Type} label="Text" color="text-yellow-500" isEmpty={!overlayText}>
            {overlayText && (
              <ScrollArea className="w-full h-full">
                <div 
                  className="p-1 min-h-[38px] relative"
                  style={{ width: `${getTimelineWidth()}px` }}
                >
                  <div 
                    className="h-[30px] rounded bg-yellow-500/20 border border-yellow-500/40 flex items-center px-2 group relative cursor-move"
                    style={{ 
                      width: `${textTiming.duration * TIMELINE_PIXELS_PER_SECOND * zoom}px`,
                      marginLeft: `${textTiming.startTime * TIMELINE_PIXELS_PER_SECOND * zoom}px`
                    }}
                    onMouseDown={(e) => startDrag(e, 'text-move', textTiming.duration, undefined, textTiming.startTime)}
                  >
                    {/* Left resize handle */}
                    <ResizeHandle
                      side="left"
                      color="text-yellow-400"
                      onMouseDown={(e) => startDrag(e, 'text-start', textTiming.startTime)}
                    />
                    
                    <GripHorizontal className="w-3 h-3 text-yellow-600/50 mr-1 flex-shrink-0" />
                    <Type className="w-3 h-3 text-yellow-600 mr-1 flex-shrink-0" />
                    <span className="text-[9px] text-yellow-700 truncate flex-1">{overlayText.substring(0, 20)}...</span>
                    <span className="text-[8px] text-yellow-600 bg-yellow-500/20 px-1 rounded">{formatTime(textTiming.duration)}</span>
                    
                    {/* Right resize handle */}
                    <ResizeHandle
                      side="right"
                      color="text-yellow-400"
                      onMouseDown={(e) => startDrag(e, 'text-end', textTiming.duration)}
                    />
                  </div>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </LayerRow>

          {/* Layer 4: Image Overlay (Logo/Watermark) - Draggable */}
          <LayerRow icon={ImageIcon} label="Image" color="text-purple-500" isEmpty={!overlayImage}>
            {overlayImage && (
              <ScrollArea className="w-full h-full">
                <div 
                  className="p-1 min-h-[38px] relative"
                  style={{ width: `${getTimelineWidth()}px` }}
                >
                  <div 
                    className="h-[30px] rounded bg-purple-500/20 border border-purple-500/40 flex items-center px-2 group relative cursor-move"
                    style={{ 
                      width: `${imageTiming.duration * TIMELINE_PIXELS_PER_SECOND * zoom}px`,
                      marginLeft: `${imageTiming.startTime * TIMELINE_PIXELS_PER_SECOND * zoom}px`
                    }}
                    onMouseDown={(e) => startDrag(e, 'image-move', imageTiming.duration, undefined, imageTiming.startTime)}
                  >
                    {/* Left resize handle */}
                    <ResizeHandle
                      side="left"
                      color="text-purple-400"
                      onMouseDown={(e) => startDrag(e, 'image-start', imageTiming.startTime)}
                    />
                    
                    <GripHorizontal className="w-3 h-3 text-purple-600/50 mr-1 flex-shrink-0" />
                    <img 
                      src={overlayImage} 
                      alt="Overlay" 
                      className="h-5 w-5 object-contain rounded mr-1 pointer-events-none"
                    />
                    <span className="text-[9px] text-purple-600 flex-1">Logo</span>
                    <span className="text-[8px] text-purple-600 bg-purple-500/20 px-1 rounded">{formatTime(imageTiming.duration)}</span>
                    
                    {/* Right resize handle */}
                    <ResizeHandle
                      side="right"
                      color="text-purple-400"
                      onMouseDown={(e) => startDrag(e, 'image-end', imageTiming.duration)}
                    />
                  </div>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            )}
          </LayerRow>

          {/* Playhead - Draggable */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-primary z-20 cursor-ew-resize hover:w-1.5 transition-all group/playhead"
            style={{ left: `${80 + currentTime * TIMELINE_PIXELS_PER_SECOND * zoom}px` }}
            onMouseDown={handlePlayheadMouseDown}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full cursor-grab group-hover/playhead:scale-110 transition-transform shadow-md" />
          </div>
        </div>
      </div>

      {/* Layer Legend & Keyboard Shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-muted-foreground">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Media</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Audio (fixed)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>Text (drag)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Image (drag)</span>
          </div>
        </div>

        {/* Keyboard Shortcuts with Tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-help px-2 py-1 rounded bg-muted/50 hover:bg-muted transition-colors">
                <Keyboard className="w-3 h-3" />
                <span>Shortcuts</span>
                <Info className="w-2.5 h-2.5 opacity-60" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="p-3 max-w-sm">
              <div className="space-y-2">
                <p className="font-medium text-xs">Keyboard Shortcuts</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Hapus clip</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Delete</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Reset trim</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">R</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Mundur 0.1s</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">←</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Maju 0.1s</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">→</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Mundur 1s</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Shift+←</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Maju 1s</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Shift+→</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Zoom in</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">+</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Zoom out</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">-</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Ke awal</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Home</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Ke akhir</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">End</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Clip sebelum</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">[</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Clip berikut</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">]</kbd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Batal pilih</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Esc</kbd>
                  </div>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Shortcuts Info Bar */}
      <div className="flex flex-wrap items-center gap-3 px-3 py-2 rounded-md bg-muted/30 border border-border/50 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Keyboard className="w-3 h-3 text-primary/70" />
          <span className="font-medium">Shortcuts:</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">Del</kbd>
          <span>Hapus</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">R</kbd>
          <span>Reset</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">←→</kbd>
          <span>Seek</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">+-</kbd>
          <span>Zoom</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">[]</kbd>
          <span>Clip</span>
        </div>
        <div className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-mono">Esc</kbd>
          <span>Batal</span>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
