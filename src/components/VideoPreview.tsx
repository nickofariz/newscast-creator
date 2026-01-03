import { motion, AnimatePresence } from "framer-motion";
import { Play, Volume2, Pause } from "lucide-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { OverlaySettings } from "./OverlaySelector";
import { cn } from "@/lib/utils";

type TemplateType = "headline-top" | "minimal" | "breaking";

interface SubtitleWord {
  text: string;
  start: number;
  end: number;
}

interface MediaFile {
  id: string;
  file: File;
  type: "video" | "image";
  previewUrl: string;
  duration?: number;
}

export type TransitionType = "none" | "fade" | "slide" | "zoom" | "blur";

export interface EditedClip {
  id: string;
  previewUrl: string;
  type: "video" | "image";
  startTime: number;
  endTime: number;
  effectiveDuration: number;
  transition: TransitionType;
}

export type VideoFormatType = "short" | "tv";

interface VideoPreviewProps {
  newsText: string;
  template: TemplateType;
  isGenerating: boolean;
  mediaFiles?: MediaFile[];
  editedClips?: EditedClip[];
  subtitleWords?: SubtitleWord[];
  currentTime?: number;
  isAudioPlaying?: boolean;
  audioDuration?: number;
  overlaySettings?: OverlaySettings;
  videoFormat?: VideoFormatType;
  onPlay?: () => void;
  onPause?: () => void;
}

const DEFAULT_IMAGE_DURATION = 3;

const VideoPreview = ({ 
  newsText, 
  template, 
  isGenerating, 
  mediaFiles = [],
  editedClips = [],
  subtitleWords = [],
  currentTime = 0,
  isAudioPlaying = false,
  audioDuration = 0,
  overlaySettings,
  videoFormat = "short",
  onPlay,
  onPause,
}: VideoPreviewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [internalTime, setInternalTime] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSeekTimeRef = useRef<number>(0);
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use edited clips if available, otherwise fallback to calculated durations
  const hasEditedClips = editedClips.length > 0;

  // Determine which media should be shown based on current time and edited clips
  const activeMediaIndex = useMemo(() => {
    if (mediaFiles.length === 0 && editedClips.length === 0) return 0;
    
    // Always use currentTime for seeking - this ensures immediate response
    const time = currentTime;
    console.log("VideoPreview activeMediaIndex - currentTime:", time, "editedClips:", editedClips.length);
    
    // Use edited clips if available - this is the primary logic
    if (hasEditedClips) {
      for (let i = 0; i < editedClips.length; i++) {
        if (time >= editedClips[i].startTime && time < editedClips[i].endTime) {
          console.log("VideoPreview - found clip index:", i, "for time:", time);
          return i;
        }
      }
      // If time exceeds all clips, show last
      return editedClips.length > 0 ? editedClips.length - 1 : 0;
    }
    
    // Fallback: distribute audio duration evenly
    const totalDuration = audioDuration > 0 ? audioDuration : mediaFiles.length * DEFAULT_IMAGE_DURATION;
    const durationPerMedia = totalDuration / Math.max(1, mediaFiles.length);
    
    for (let i = 0; i < mediaFiles.length; i++) {
      const start = i * durationPerMedia;
      const end = (i + 1) * durationPerMedia;
      if (time >= start && time < end) {
        return i;
      }
    }
    
    return Math.max(0, mediaFiles.length - 1);
  }, [currentTime, editedClips, mediaFiles.length, hasEditedClips, audioDuration]);

  // Update current media index when active index changes
  useEffect(() => {
    setCurrentMediaIndex(activeMediaIndex);
  }, [activeMediaIndex]);

  // Get current media - use editedClips source if available
  const currentMedia = useMemo(() => {
    if (hasEditedClips && editedClips[currentMediaIndex]) {
      const clip = editedClips[currentMediaIndex];
      return { 
        id: clip.id,
        previewUrl: clip.previewUrl, 
        type: clip.type,
        transition: clip.transition || "none"
      };
    }
    return mediaFiles[currentMediaIndex] ? { 
      ...mediaFiles[currentMediaIndex], 
      transition: "none" as TransitionType 
    } : null;
  }, [hasEditedClips, editedClips, currentMediaIndex, mediaFiles]);

  // Get transition animation variants based on transition type
  const getTransitionVariants = (transition: TransitionType) => {
    switch (transition) {
      case "fade":
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }
        };
      case "slide":
        return {
          initial: { opacity: 0, x: 50 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -50 },
          transition: { duration: 0.35, ease: [0, 0, 0.2, 1] as const }
        };
      case "zoom":
        return {
          initial: { opacity: 0, scale: 1.15 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.9 },
          transition: { duration: 0.4, ease: [0, 0, 0.2, 1] as const }
        };
      case "blur":
        return {
          initial: { opacity: 0, filter: "blur(10px)" },
          animate: { opacity: 1, filter: "blur(0px)" },
          exit: { opacity: 0, filter: "blur(10px)" },
          transition: { duration: 0.35, ease: [0, 0, 0.2, 1] as const }
        };
      case "none":
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: 0.15 }
        };
    }
  };

  // Calculate progress within current media segment
  const segmentProgress = useMemo(() => {
    // Always use currentTime for immediate seek response
    const time = currentTime;
    
    if (hasEditedClips && editedClips[currentMediaIndex]) {
      const clip = editedClips[currentMediaIndex];
      const progress = ((time - clip.startTime) / clip.effectiveDuration) * 100;
      return Math.min(100, Math.max(0, progress));
    }
    
    // Fallback calculation
    const totalDur = audioDuration > 0 ? audioDuration : mediaFiles.length * DEFAULT_IMAGE_DURATION;
    const durationPerMedia = totalDur / Math.max(1, mediaFiles.length);
    const start = currentMediaIndex * durationPerMedia;
    const progress = ((time - start) / durationPerMedia) * 100;
    return Math.min(100, Math.max(0, progress));
  }, [currentTime, audioDuration, editedClips, currentMediaIndex, hasEditedClips, mediaFiles.length]);

  // Calculate total duration for internal timer
  const totalDuration = useMemo(() => {
    if (hasEditedClips && editedClips.length > 0) {
      return editedClips[editedClips.length - 1].endTime;
    }
    return audioDuration > 0 ? audioDuration : mediaFiles.length * DEFAULT_IMAGE_DURATION;
  }, [hasEditedClips, editedClips, audioDuration, mediaFiles.length]);

  // Internal timer for preview playback when audio is not playing
  useEffect(() => {
    if (isPlaying && !isAudioPlaying && (mediaFiles.length > 0 || editedClips.length > 0)) {
      timerRef.current = setInterval(() => {
        setInternalTime((prev) => {
          const newTime = prev + 0.1;
          if (newTime >= totalDuration) {
            return 0; // Loop
          }
          return newTime;
        });
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, isAudioPlaying, mediaFiles.length, editedClips.length, totalDuration]);

  // Sync with audio playback - update internal time when audio is seeking
  useEffect(() => {
    if (isAudioPlaying) {
      setIsPlaying(true);
    }
  }, [isAudioPlaying]);

  // Sync internal time with external currentTime and detect seeking
  useEffect(() => {
    const now = Date.now();
    const timeDiff = Math.abs(currentTime - internalTime);
    
    // Detect seek: large time jump OR rapid updates when not playing
    if (timeDiff > 0.5 || (!isAudioPlaying && now - lastSeekTimeRef.current < 200 && timeDiff > 0.05)) {
      setIsSeeking(true);
      lastSeekTimeRef.current = now;
      
      // Clear existing timeout
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
      
      // Reset seeking state after a short delay
      seekTimeoutRef.current = setTimeout(() => {
        setIsSeeking(false);
      }, 300);
    }
    
    setInternalTime(currentTime);
    
    return () => {
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current);
      }
    };
  }, [currentTime, internalTime, isAudioPlaying]);

  // Reset internal time when not playing
  useEffect(() => {
    if (!isPlaying && !isAudioPlaying && currentTime === 0) {
      setInternalTime(0);
      setCurrentMediaIndex(0);
    }
  }, [isPlaying, isAudioPlaying, currentTime]);

  // Get active subtitle words for karaoke-style display
  const karaokeSubtitle = useMemo(() => {
    if (!subtitleWords.length) return null;
    
    // Find current word index
    const currentIndex = subtitleWords.findIndex(
      (word) => currentTime >= word.start && currentTime <= word.end
    );
    
    // Show words around the current position (context window)
    const contextSize = 4;
    let startIdx: number;
    let endIdx: number;
    
    if (currentIndex === -1) {
      // Find the closest upcoming word
      const nextWordIndex = subtitleWords.findIndex((word) => word.start > currentTime);
      if (nextWordIndex === -1) {
        // All words have passed, show last few
        startIdx = Math.max(0, subtitleWords.length - contextSize);
        endIdx = subtitleWords.length;
      } else if (nextWordIndex === 0) {
        // Before first word, show first few
        startIdx = 0;
        endIdx = Math.min(subtitleWords.length, contextSize);
      } else {
        // Between words, show context around previous word
        startIdx = Math.max(0, nextWordIndex - 2);
        endIdx = Math.min(subtitleWords.length, nextWordIndex + contextSize - 2);
      }
    } else {
      // Active word found, center context around it
      startIdx = Math.max(0, currentIndex - 2);
      endIdx = Math.min(subtitleWords.length, currentIndex + contextSize);
    }
    
    return subtitleWords.slice(startIdx, endIdx).map((w, idx) => {
      const isActive = currentTime >= w.start && currentTime <= w.end;
      const isPast = currentTime > w.end;
      const progress = isActive 
        ? Math.min(1, (currentTime - w.start) / (w.end - w.start))
        : isPast ? 1 : 0;
      
      return { 
        text: w.text, 
        isActive, 
        isPast,
        progress,
        index: startIdx + idx
      };
    });
  }, [subtitleWords, currentTime]);

  // Handle play/pause and seeking for video elements
  useEffect(() => {
    if (videoRef.current && currentMedia?.type === "video") {
      if (isPlaying || isAudioPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, isAudioPlaying, currentMedia]);

  // Seek video to correct position within clip when time changes
  useEffect(() => {
    if (videoRef.current && currentMedia?.type === "video" && hasEditedClips) {
      const currentClip = editedClips[currentMediaIndex];
      if (currentClip) {
        const offsetInClip = currentTime - currentClip.startTime;
        // Direct seek without threshold for immediate response
        videoRef.current.currentTime = Math.max(0, offsetInClip);
      }
    }
  }, [currentTime, currentMediaIndex, editedClips, hasEditedClips, currentMedia]);

  // We no longer show newsText as headline/subtitle - only auto-generated subtitles are shown
  const showTextOverlay = false; // Disabled - only show auto subtitle

  // Calculate total video duration
  const totalVideoDuration = useMemo(() => {
    if (audioDuration > 0) return audioDuration;
    return mediaFiles.length * DEFAULT_IMAGE_DURATION;
  }, [audioDuration, mediaFiles.length]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const displayTime = currentTime;

  // Size classes based on video format
  const isTV = videoFormat === "tv";
  const textSizes = {
    headline: isTV ? "text-base" : "text-sm",
    subtitle: isTV ? "text-sm" : "text-xs",
    breaking: isTV ? "text-xs" : "text-[10px]",
    tiny: isTV ? "text-[10px]" : "text-[8px]",
  };
  const spacing = {
    padding: isTV ? "px-4 py-3" : "px-3 py-2",
    paddingSmall: isTV ? "px-3 py-1.5" : "px-3 py-1",
    top: isTV ? "top-4" : "top-8",
    topBreaking: isTV ? "top-3" : "top-6",
    topHeadline: isTV ? "top-10" : "top-14",
    bottom: isTV ? "bottom-8" : "bottom-12",
    inset: isTV ? "left-6 right-6" : "left-4 right-4",
  };

  // Template rendering disabled - only auto-generated subtitles are shown
  const renderTemplate = () => null;

  // Render overlay elements
  const renderOverlays = () => {
    if (!overlaySettings) return null;

    const logoSize = isTV ? (overlaySettings.logo?.size || 40) * 1.3 : (overlaySettings.logo?.size || 40);
    const cornerSize = isTV ? "w-8 h-8" : "w-6 h-6";
    const barHeight = isTV ? "h-4" : "h-3";

    return (
      <>
        {/* Frame Overlay */}
        {overlaySettings.frame?.enabled && (
          <>
            {overlaySettings.frame.style === "border" && (
              <div
                className={cn("absolute inset-0 z-20 pointer-events-none", isTV ? "border-[6px]" : "border-4")}
                style={{ borderColor: overlaySettings.frame.color }}
              />
            )}
            {overlaySettings.frame.style === "bars" && (
              <>
                <div
                  className={cn("absolute top-0 left-0 right-0 z-20", barHeight)}
                  style={{ backgroundColor: overlaySettings.frame.color }}
                />
                <div
                  className={cn("absolute bottom-0 left-0 right-0 z-20", barHeight)}
                  style={{ backgroundColor: overlaySettings.frame.color }}
                />
              </>
            )}
            {overlaySettings.frame.style === "corner" && (
              <>
                <div
                  className={cn("absolute top-2 left-2 border-t-3 border-l-3 z-20", cornerSize)}
                  style={{ borderColor: overlaySettings.frame.color }}
                />
                <div
                  className={cn("absolute top-2 right-2 border-t-3 border-r-3 z-20", cornerSize)}
                  style={{ borderColor: overlaySettings.frame.color }}
                />
                <div
                  className={cn("absolute left-2 border-b-3 border-l-3 z-20", cornerSize, isTV ? "bottom-6" : "bottom-8")}
                  style={{ borderColor: overlaySettings.frame.color }}
                />
                <div
                  className={cn("absolute right-2 border-b-3 border-r-3 z-20", cornerSize, isTV ? "bottom-6" : "bottom-8")}
                  style={{ borderColor: overlaySettings.frame.color }}
                />
              </>
            )}
          </>
        )}

        {/* Logo Overlay */}
        {overlaySettings.logo?.enabled && overlaySettings.logo.url && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "absolute z-30",
              overlaySettings.logo.position === "top-left" && (isTV ? "top-3 left-4" : "top-4 left-3"),
              overlaySettings.logo.position === "top-right" && (isTV ? "top-3 right-4" : "top-4 right-3"),
              overlaySettings.logo.position === "bottom-left" && (isTV ? "bottom-10 left-4" : "bottom-14 left-3"),
              overlaySettings.logo.position === "bottom-right" && (isTV ? "bottom-10 right-4" : "bottom-14 right-3")
            )}
            style={{
              width: `${logoSize}px`,
              height: `${logoSize}px`,
            }}
          >
            <img
              src={overlaySettings.logo.url}
              alt="Logo"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </motion.div>
        )}

        {/* Headline Box Overlay - Disabled, only auto subtitle is shown */}

        {/* Credit Text */}
        {overlaySettings.credit?.enabled && (overlaySettings.credit.text || overlaySettings.credit.secondaryText) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "absolute z-30 text-center",
              isTV ? "left-4 right-4" : "left-2 right-2",
              overlaySettings.credit.position === "top" ? (isTV ? "top-3" : "top-4") : (isTV ? "bottom-3" : "bottom-4")
            )}
          >
            {overlaySettings.credit.text && (
              <p className={cn("text-white font-medium drop-shadow-md", isTV ? "text-[10px]" : "text-[8px]")}>
                {overlaySettings.credit.text}
              </p>
            )}
            {overlaySettings.credit.secondaryText && (
              <p className={cn("text-white/70 drop-shadow-md", isTV ? "text-[9px]" : "text-[7px]")}>
                {overlaySettings.credit.secondaryText}
              </p>
            )}
          </motion.div>
        )}

        {/* Breaking News Banner (legacy support) */}
        {overlaySettings.breakingNews?.enabled && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn("absolute left-0 right-0 z-30", isTV ? "top-4" : "top-6")}
          >
            <div
              className={cn(
                "text-white font-bold text-center tracking-wider",
                isTV ? "mx-4 px-4 py-2 text-xs" : "mx-2 px-3 py-1.5 text-[10px]",
                overlaySettings.breakingNews.style === "red" && "bg-red-600",
                overlaySettings.breakingNews.style === "blue" && "bg-blue-600",
                overlaySettings.breakingNews.style === "orange" && "bg-orange-500"
              )}
            >
              <motion.span
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {overlaySettings.breakingNews.text}
              </motion.span>
            </div>
          </motion.div>
        )}

        {/* Lower Third (legacy support) */}
        {overlaySettings.lowerThird?.enabled && (overlaySettings.lowerThird.title || overlaySettings.lowerThird.subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("absolute z-30", isTV ? "bottom-14 left-4 right-4" : "bottom-20 left-2 right-2")}
          >
            <div
              className={cn(
                "rounded",
                isTV ? "px-3 py-2" : "px-2 py-1.5",
                overlaySettings.lowerThird.style === "modern" && "bg-gradient-to-r from-primary to-primary/80 text-white",
                overlaySettings.lowerThird.style === "classic" && "bg-black/90 text-white border-l-2 border-primary",
                overlaySettings.lowerThird.style === "minimal" && "bg-white/95 text-black"
              )}
            >
              {overlaySettings.lowerThird.title && (
                <p className={cn("font-semibold leading-tight", isTV ? "text-xs" : "text-[10px]")}>
                  {overlaySettings.lowerThird.title}
                </p>
              )}
              {overlaySettings.lowerThird.subtitle && (
                <p className={cn(
                  "leading-tight",
                  isTV ? "text-[10px]" : "text-[8px]",
                  overlaySettings.lowerThird.style === "minimal" ? "text-black/70" : "text-white/80"
                )}>
                  {overlaySettings.lowerThird.subtitle}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative"
    >
      <div className="text-sm font-medium text-foreground mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Preview Video
          {mediaFiles.length > 1 && (
            <span className="text-xs text-muted-foreground">
              ({mediaFiles.length} media)
            </span>
          )}
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium",
          "bg-primary/10 text-primary border border-primary/20"
        )}>
          {videoFormat === "short" ? (
            <>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="7" y="2" width="10" height="20" rx="2" />
              </svg>
              <span>9:16</span>
            </>
          ) : (
            <>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
              </svg>
              <span>16:9</span>
            </>
          )}
        </div>
      </div>

      <div 
        className={cn(
          "video-frame relative mx-auto shadow-card",
          videoFormat === "short" ? "max-w-[200px] aspect-[9/16]" : "max-w-[320px] aspect-video"
        )}
      >
        {/* Seeking indicator overlay */}
        <AnimatePresence>
          {isSeeking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 z-50 pointer-events-none"
            >
              {/* Pulsing border */}
              <div className="absolute inset-0 border-2 border-primary animate-pulse rounded-lg" />
              
              {/* Time indicator badge */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="px-3 py-1.5 bg-primary/90 backdrop-blur-sm rounded-full shadow-lg"
                >
                  <span className="text-primary-foreground font-mono text-sm font-medium">
                    {formatTime(currentTime)}
                  </span>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Background - Media or Gradient */}
        <AnimatePresence mode="sync">
          {currentMedia ? (
            (() => {
              const variants = getTransitionVariants(currentMedia.transition);
              return (
                <motion.div
                  key={`${currentMedia.id}-${currentMediaIndex}`}
                  initial={variants.initial}
                  animate={variants.animate}
                  exit={variants.exit}
                  transition={variants.transition}
                  className={cn(
                    "absolute inset-0 overflow-hidden",
                    isSeeking && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  {currentMedia.type === "video" ? (
                    <video
                      ref={videoRef}
                      src={currentMedia.previewUrl}
                      className="absolute inset-0 w-full h-full object-cover"
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={currentMedia.previewUrl}
                      alt="Background"
                      className={cn(
                        "absolute inset-0 w-full h-full object-cover transition-transform duration-150",
                        isSeeking && "scale-[1.02]"
                      )}
                    />
                  )}
                </motion.div>
              );
            })()
          ) : (
            <motion.div
              key="placeholder"
              className="absolute inset-0"
            >
              <div className="absolute inset-0 gradient-dark" />
              <div 
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
                  backgroundSize: '20px 20px'
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Dark overlay for text readability */}
        {currentMedia && <div className="absolute inset-0 bg-black/40" />}

        {/* Media segment indicator */}
        {mediaFiles.length > 1 && (
          <div className="absolute top-2 left-2 right-2 z-20">
            <div className="flex gap-1">
              {mediaFiles.map((_, index) => (
                <motion.div
                  key={index}
                  className={cn(
                    "flex-1 h-1 rounded-full overflow-hidden bg-white/30 transition-all duration-150",
                    isSeeking && index === currentMediaIndex && "h-1.5 ring-1 ring-primary shadow-sm"
                  )}
                  animate={{
                    scale: isSeeking && index === currentMediaIndex ? 1.05 : 1
                  }}
                >
                  <motion.div
                    className={cn(
                      "h-full",
                      isSeeking && index === currentMediaIndex ? "bg-primary" : "bg-white"
                    )}
                    initial={{ width: 0 }}
                    animate={{
                      width: index < currentMediaIndex 
                        ? "100%" 
                        : index === currentMediaIndex 
                        ? `${segmentProgress}%` 
                        : "0%"
                    }}
                    transition={{ duration: 0.1 }}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Overlay elements */}
        {renderOverlays()}

        {/* Template content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={template}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            {renderTemplate()}
          </motion.div>
        </AnimatePresence>

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (isAudioPlaying) {
                onPause?.();
              } else if (onPlay) {
                onPlay();
              } else {
                setIsPlaying(!isPlaying);
              }
            }}
            className="w-14 h-14 rounded-full gradient-news flex items-center justify-center shadow-glow opacity-80 hover:opacity-100 transition-opacity"
          >
            {isPlaying || isAudioPlaying ? (
              <Pause className="w-6 h-6 text-primary-foreground" />
            ) : (
              <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
            )}
          </motion.button>
        </div>

        {/* Karaoke-style Subtitle overlay */}
        <AnimatePresence>
          {karaokeSubtitle && karaokeSubtitle.length > 0 && (isAudioPlaying || subtitleWords.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-16 left-2 right-2 z-10"
            >
              <div className="bg-black/85 backdrop-blur-md px-4 py-3 rounded-xl text-center shadow-lg">
                <p className="text-sm font-medium leading-relaxed flex flex-wrap justify-center gap-x-1.5 gap-y-1">
                  {karaokeSubtitle.map((word, i) => (
                    <motion.span
                      key={word.index}
                      initial={{ opacity: 0.6, scale: 0.95 }}
                      animate={{ 
                        opacity: word.isActive ? 1 : word.isPast ? 0.7 : 0.5,
                        scale: word.isActive ? 1.1 : 1,
                        y: word.isActive ? -2 : 0
                      }}
                      transition={{ 
                        duration: 0.15, 
                        ease: "easeOut" 
                      }}
                      className="relative inline-block"
                    >
                      {/* Background text (unfilled) */}
                      <span 
                        className={`
                          relative z-10 transition-all duration-100
                          ${word.isActive 
                            ? "text-primary font-bold drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]" 
                            : word.isPast 
                              ? "text-white/80" 
                              : "text-white/50"
                          }
                        `}
                      >
                        {word.text}
                      </span>
                      
                      {/* Karaoke fill effect for active word */}
                      {word.isActive && (
                        <motion.span
                          className="absolute inset-0 overflow-hidden z-20 pointer-events-none"
                          initial={{ width: "0%" }}
                          animate={{ width: `${word.progress * 100}%` }}
                          transition={{ duration: 0.05, ease: "linear" }}
                        >
                          <span className="text-primary font-bold whitespace-nowrap drop-shadow-[0_0_12px_hsl(var(--primary))]">
                            {word.text}
                          </span>
                        </motion.span>
                      )}
                    </motion.span>
                  ))}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Generating overlay */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3"
            >
              <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-xs text-muted-foreground">Generating...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-3 text-center text-xs text-muted-foreground">
        Format: 9:16 (1080x1920)
      </div>
    </motion.div>
  );
};

export default VideoPreview;
