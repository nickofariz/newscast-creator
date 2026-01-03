import { motion, AnimatePresence } from "framer-motion";
import { Play, Volume2, Pause, Maximize2, X, VolumeX, SkipBack, SkipForward, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { OverlaySettings } from "./OverlaySelector";
import { SubtitleStyleSettings, DEFAULT_SUBTITLE_STYLE } from "./SubtitlePreview";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

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
export type KenBurnsType = "none" | "zoom-in" | "zoom-out" | "pan-left" | "pan-right" | "pan-up" | "pan-down" | "random";

export interface EditedClip {
  id: string;
  previewUrl: string;
  type: "video" | "image";
  startTime: number;
  endTime: number;
  effectiveDuration: number;
  transition: TransitionType;
  kenBurns?: KenBurnsType;
}

export type VideoFormatType = "short" | "tv";
export type DurationMode = "longest" | "media" | "audio";

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
  subtitleStyle?: SubtitleStyleSettings;
  durationMode?: DurationMode;
  freezeLastFrame?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
}

const DEFAULT_IMAGE_DURATION = 3;

// Ken Burns effect presets
const KEN_BURNS_EFFECTS: Record<Exclude<KenBurnsType, "none" | "random">, {
  initial: { scale: number; x: string; y: string };
  animate: { scale: number; x: string; y: string };
}> = {
  "zoom-in": {
    initial: { scale: 1, x: "0%", y: "0%" },
    animate: { scale: 1.15, x: "0%", y: "0%" },
  },
  "zoom-out": {
    initial: { scale: 1.15, x: "0%", y: "0%" },
    animate: { scale: 1, x: "0%", y: "0%" },
  },
  "pan-left": {
    initial: { scale: 1.1, x: "5%", y: "0%" },
    animate: { scale: 1.1, x: "-5%", y: "0%" },
  },
  "pan-right": {
    initial: { scale: 1.1, x: "-5%", y: "0%" },
    animate: { scale: 1.1, x: "5%", y: "0%" },
  },
  "pan-up": {
    initial: { scale: 1.1, x: "0%", y: "5%" },
    animate: { scale: 1.1, x: "0%", y: "-5%" },
  },
  "pan-down": {
    initial: { scale: 1.1, x: "0%", y: "-5%" },
    animate: { scale: 1.1, x: "0%", y: "5%" },
  },
};

const getRandomKenBurns = (): Exclude<KenBurnsType, "none" | "random"> => {
  const effects = Object.keys(KEN_BURNS_EFFECTS) as Exclude<KenBurnsType, "none" | "random">[];
  return effects[Math.floor(Math.random() * effects.length)];
};

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
  subtitleStyle = DEFAULT_SUBTITLE_STYLE,
  durationMode = "longest",
  freezeLastFrame = true,
  onPlay,
  onPause,
  onSeek,
}: VideoPreviewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [internalTime, setInternalTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSeekTimeRef = useRef<number>(0);
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Store stable reference to current media to prevent flickering
  const currentMediaRef = useRef<{
    id: string;
    previewUrl: string;
    type: "video" | "image";
    transition: TransitionType;
    kenBurns?: KenBurnsType;
  } | null>(null);

  // Store stable Ken Burns effect per media ID to prevent random changes
  const kenBurnsEffectsRef = useRef<Map<string, Exclude<KenBurnsType, "none" | "random">>>(new Map());

  // Use edited clips if available, otherwise fallback to calculated durations
  const hasEditedClips = editedClips.length > 0;

  // Determine which media should be shown based on current time and edited clips
  // Use refs to prevent unnecessary re-renders that cause flickering
  const prevMediaIdRef = useRef<string>("");
  
  // Check if we're beyond media duration (should show black screen)
  const isMediaEnded = useMemo(() => {
    if (freezeLastFrame) return false; // Never show black if freeze is enabled
    
    const time = currentTime;
    
    if (hasEditedClips && editedClips.length > 0) {
      const lastClipEnd = editedClips[editedClips.length - 1].endTime;
      return time >= lastClipEnd;
    }
    
    if (mediaFiles.length > 0) {
      const totalDur = audioDuration > 0 ? audioDuration : mediaFiles.length * DEFAULT_IMAGE_DURATION;
      const durationPerMedia = totalDur / Math.max(1, mediaFiles.length);
      const totalMediaDur = mediaFiles.length * durationPerMedia;
      return time >= totalMediaDur;
    }
    
    return false;
  }, [currentTime, editedClips, mediaFiles.length, hasEditedClips, audioDuration, freezeLastFrame]);

  const activeMediaIndex = useMemo(() => {
    if (mediaFiles.length === 0 && editedClips.length === 0) return 0;
    
    // If media ended and not freezing, return -1 (will show black)
    if (isMediaEnded) return -1;
    
    const time = currentTime;
    
    // Use edited clips if available - this is the primary logic
    if (hasEditedClips) {
      for (let i = 0; i < editedClips.length; i++) {
        if (time >= editedClips[i].startTime && time < editedClips[i].endTime) {
          return i;
        }
      }
      // If time exceeds all clips, show last (freeze)
      return editedClips.length > 0 ? editedClips.length - 1 : 0;
    }
    
    // Fallback: distribute audio duration evenly
    const totalDur = audioDuration > 0 ? audioDuration : mediaFiles.length * DEFAULT_IMAGE_DURATION;
    const durationPerMedia = totalDur / Math.max(1, mediaFiles.length);
    
    for (let i = 0; i < mediaFiles.length; i++) {
      const start = i * durationPerMedia;
      const end = (i + 1) * durationPerMedia;
      if (time >= start && time < end) {
        return i;
      }
    }
    
    return Math.max(0, mediaFiles.length - 1);
  }, [currentTime, editedClips, mediaFiles.length, hasEditedClips, audioDuration, isMediaEnded]);

  // Get current media - use stable reference to prevent flickering
  const currentMedia = useMemo(() => {
    // Show nothing (black screen) if media ended
    if (isMediaEnded || activeMediaIndex === -1) {
      currentMediaRef.current = null;
      prevMediaIdRef.current = "";
      return null;
    }
    
    let newMedia: typeof currentMediaRef.current = null;
    
    if (hasEditedClips && editedClips[activeMediaIndex]) {
      const clip = editedClips[activeMediaIndex];
      // Validate previewUrl exists and is not empty
      if (clip.previewUrl && clip.previewUrl.trim() !== "") {
        newMedia = { 
          id: clip.id,
          previewUrl: clip.previewUrl, 
          type: clip.type,
          transition: clip.transition || "none",
          kenBurns: clip.kenBurns || "random"
        };
      }
    } else if (mediaFiles[activeMediaIndex]) {
      const file = mediaFiles[activeMediaIndex];
      // Validate previewUrl exists and is not empty
      if (file.previewUrl && file.previewUrl.trim() !== "") {
        newMedia = { 
          id: file.id,
          previewUrl: file.previewUrl,
          type: file.type,
          transition: "none" as TransitionType,
          kenBurns: "random" as KenBurnsType
        };
      }
    }
    
    // Update ref if media ID changed OR if kenBurns changed for same media
    if (newMedia) {
      const idChanged = newMedia.id !== prevMediaIdRef.current;
      const kenBurnsChanged = currentMediaRef.current && 
        newMedia.id === currentMediaRef.current.id && 
        newMedia.kenBurns !== currentMediaRef.current.kenBurns;
      
      if (idChanged || kenBurnsChanged) {
        prevMediaIdRef.current = newMedia.id;
        currentMediaRef.current = newMedia;
      }
    }
    
    return currentMediaRef.current;
  }, [hasEditedClips, editedClips, activeMediaIndex, mediaFiles, isMediaEnded]);

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

  // Get Ken Burns effect - stable per media ID
  const getKenBurnsEffect = useCallback((mediaId: string, kenBurns: KenBurnsType | undefined) => {
    if (!kenBurns || kenBurns === "none") return null;
    
    let effectType: Exclude<KenBurnsType, "none" | "random">;
    
    if (kenBurns === "random") {
      // Check if we already assigned an effect for this media
      if (kenBurnsEffectsRef.current.has(mediaId)) {
        effectType = kenBurnsEffectsRef.current.get(mediaId)!;
      } else {
        effectType = getRandomKenBurns();
        kenBurnsEffectsRef.current.set(mediaId, effectType);
      }
    } else {
      effectType = kenBurns;
    }
    
    return KEN_BURNS_EFFECTS[effectType];
  }, []);

  // Get current clip duration for Ken Burns animation
  const currentClipDuration = useMemo(() => {
    if (hasEditedClips && editedClips[activeMediaIndex]) {
      return editedClips[activeMediaIndex].effectiveDuration;
    }
    const totalDur = audioDuration > 0 ? audioDuration : mediaFiles.length * DEFAULT_IMAGE_DURATION;
    return totalDur / Math.max(1, mediaFiles.length);
  }, [hasEditedClips, editedClips, activeMediaIndex, audioDuration, mediaFiles.length]);
  const segmentProgress = useMemo(() => {
    // Always use currentTime for immediate seek response
    const time = currentTime;
    
    if (hasEditedClips && editedClips[activeMediaIndex]) {
      const clip = editedClips[activeMediaIndex];
      const progress = ((time - clip.startTime) / clip.effectiveDuration) * 100;
      return Math.min(100, Math.max(0, progress));
    }
    
    // Fallback calculation
    const totalDur = audioDuration > 0 ? audioDuration : mediaFiles.length * DEFAULT_IMAGE_DURATION;
    const durationPerMedia = totalDur / Math.max(1, mediaFiles.length);
    const start = activeMediaIndex * durationPerMedia;
    const progress = ((time - start) / durationPerMedia) * 100;
    return Math.min(100, Math.max(0, progress));
  }, [currentTime, audioDuration, editedClips, activeMediaIndex, hasEditedClips, mediaFiles.length]);

  // Calculate total duration based on duration mode
  const mediaDuration = useMemo(() => {
    if (hasEditedClips && editedClips.length > 0) {
      return editedClips[editedClips.length - 1].endTime;
    }
    return mediaFiles.length * DEFAULT_IMAGE_DURATION;
  }, [hasEditedClips, editedClips, mediaFiles.length]);

  const totalDuration = useMemo(() => {
    switch (durationMode) {
      case "media":
        return mediaDuration;
      case "audio":
        return audioDuration > 0 ? audioDuration : mediaDuration;
      case "longest":
      default:
        return Math.max(mediaDuration, audioDuration || 0);
    }
  }, [durationMode, mediaDuration, audioDuration]);

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
      prevMediaIdRef.current = "";
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
      // Always try to play video when media changes to show first frame
      const playVideo = async () => {
        try {
          if (isPlaying || isAudioPlaying) {
            await videoRef.current?.play();
          } else {
            // Play briefly to show first frame, then pause
            await videoRef.current?.play();
            videoRef.current?.pause();
          }
        } catch (error) {
          console.log("Video autoplay prevented:", error);
        }
      };
      playVideo();
    }
  }, [isPlaying, isAudioPlaying, currentMedia]);

  // Seek video to correct position within clip when time changes
  useEffect(() => {
    if (videoRef.current && currentMedia?.type === "video" && hasEditedClips) {
      const currentClip = editedClips[activeMediaIndex];
      if (currentClip) {
        const offsetInClip = currentTime - currentClip.startTime;
        // Direct seek without threshold for immediate response
        videoRef.current.currentTime = Math.max(0, offsetInClip);
      }
    }
  }, [currentTime, activeMediaIndex, editedClips, hasEditedClips, currentMedia]);

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

  // Keyboard shortcuts for fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return;
      
      switch (e.key) {
        case 'Escape':
          setIsFullscreen(false);
          break;
        case ' ':
          e.preventDefault();
          if (isAudioPlaying) {
            onPause?.();
          } else {
            onPlay?.();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (onSeek) {
            const newTime = Math.max(0, currentTime - 5);
            onSeek(newTime);
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (onSeek) {
            const newTime = Math.min(totalVideoDuration, currentTime + 5);
            onSeek(newTime);
          }
          break;
        case 'm':
        case 'M':
          setIsMuted(!isMuted);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, isAudioPlaying, onPlay, onPause, onSeek, currentTime, totalVideoDuration, isMuted]);

  // Handle mouse movement for auto-hide controls
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isAudioPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isAudioPlaying]);

  // Seek handlers
  const handleSeekChange = useCallback((value: number[]) => {
    if (onSeek && totalVideoDuration > 0) {
      const newTime = (value[0] / 100) * totalVideoDuration;
      onSeek(newTime);
    }
  }, [onSeek, totalVideoDuration]);

  const handleSkipBack = useCallback(() => {
    if (onSeek) {
      const newTime = Math.max(0, currentTime - 10);
      onSeek(newTime);
    }
  }, [onSeek, currentTime]);

  const handleSkipForward = useCallback(() => {
    if (onSeek) {
      const newTime = Math.min(totalVideoDuration, currentTime + 10);
      onSeek(newTime);
    }
  }, [onSeek, currentTime, totalVideoDuration]);

  const progress = totalVideoDuration > 0 ? (currentTime / totalVideoDuration) * 100 : 0;

  // Fullscreen preview modal - using inline styles for maximum specificity
  const renderFullscreenPreview = () => (
    <AnimatePresence>
      {isFullscreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999,
            backgroundColor: 'black',
            display: 'flex',
            flexDirection: 'column',
          }}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setShowControls(true)}
        >
          {/* Top bar with close button */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/80 to-transparent cursor-auto"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 bg-black/60 rounded-full">
                  <span className="text-white font-mono text-sm">
                    {formatTime(currentTime)} / {formatTime(totalVideoDuration)}
                  </span>
                </div>
                {mediaFiles.length > 1 && (
                  <div className="px-3 py-1.5 bg-white/10 rounded-full">
                    <span className="text-white/80 text-xs">
                      Media {activeMediaIndex + 1} / {mediaFiles.length}
                    </span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </motion.div>

          {/* Fullscreen video container - FULL SCREEN */}
          <div className="absolute inset-0 z-10">
            {/* Media content - fills entire screen */}
            {currentMedia ? (
              <div className="absolute inset-0">
                <AnimatePresence mode="wait" initial={false}>
                  {(() => {
                    const variants = getTransitionVariants(currentMedia.transition || "none");
                    return (
                      <motion.div
                        key={`fs-${currentMedia.id}`}
                        initial={variants.initial}
                        animate={variants.animate}
                        exit={variants.exit}
                        transition={variants.transition}
                        className="absolute inset-0"
                      >
                        {currentMedia.type === "video" && currentMedia.previewUrl ? (
                          <video
                            key={currentMedia.previewUrl}
                            src={currentMedia.previewUrl}
                            className="w-full h-full object-contain bg-black"
                            loop
                            muted
                            playsInline
                            autoPlay={isAudioPlaying}
                          />
                        ) : currentMedia.type === "image" && currentMedia.previewUrl ? (
                          (() => {
                            const kenBurnsEffect = getKenBurnsEffect(currentMedia.id, currentMedia.kenBurns);
                            return kenBurnsEffect ? (
                              <motion.img
                                src={currentMedia.previewUrl}
                                alt="Background"
                                className="w-full h-full object-contain bg-black"
                                initial={{
                                  scale: kenBurnsEffect.initial.scale,
                                  x: kenBurnsEffect.initial.x,
                                  y: kenBurnsEffect.initial.y,
                                }}
                                animate={{
                                  scale: kenBurnsEffect.animate.scale,
                                  x: kenBurnsEffect.animate.x,
                                  y: kenBurnsEffect.animate.y,
                                }}
                                transition={{
                                  duration: currentClipDuration,
                                  ease: "linear",
                                }}
                              />
                            ) : (
                              <img
                                src={currentMedia.previewUrl}
                                alt="Background"
                                className="w-full h-full object-contain bg-black"
                              />
                            );
                          })()
                        ) : null}
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </div>
            ) : (
              <div className="absolute inset-0 gradient-dark" />
            )}

            {/* Dark overlay */}
            {currentMedia && <div className="absolute inset-0 bg-black/20 pointer-events-none" />}

            {/* Overlays */}
            {renderOverlays()}

            {/* Karaoke Subtitle in fullscreen */}
            {karaokeSubtitle && karaokeSubtitle.length > 0 && (
              <div className={cn(
                "absolute left-4 right-4 z-40 text-center pointer-events-none",
                subtitleStyle.position === "top" ? "top-[15%]" : 
                subtitleStyle.position === "center" ? "top-1/2 -translate-y-1/2" : "bottom-[20%]"
              )}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-block px-6 py-3 rounded-lg"
                  style={{ 
                    backgroundColor: `rgba(0, 0, 0, ${(subtitleStyle.backgroundOpacity || 85) / 100})` 
                  }}
                >
                  <span className="text-2xl md:text-3xl font-bold tracking-wide">
                    {karaokeSubtitle.map((word, idx) => (
                      <span
                        key={`fs-${word.index}-${idx}`}
                        className={cn(
                          "transition-colors duration-100",
                          word.isActive ? "text-primary" : word.isPast ? "text-white/60" : "text-white"
                        )}
                        style={word.isActive ? { color: subtitleStyle.highlightColor } : undefined}
                      >
                        {word.text}{" "}
                      </span>
                    ))}
                  </span>
                </motion.div>
              </div>
            )}

            {/* Center play button - shows when paused */}
            <AnimatePresence>
              {!isAudioPlaying && showControls && onPlay && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute inset-0 flex items-center justify-center z-30 cursor-auto"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onPlay}
                    className="w-20 h-20 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                  >
                    <Play className="w-10 h-10 text-white fill-white" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom controls bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/80 to-transparent cursor-auto"
          >
            {/* Progress bar */}
            {onSeek && (
              <div className="mb-4 px-2">
                <Slider
                  value={[progress]}
                  min={0}
                  max={100}
                  step={0.1}
                  onValueChange={handleSeekChange}
                  className="w-full cursor-pointer [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:bg-white [&>span:first-child]:h-1.5 [&>span:first-child]:bg-white/30 [&>span:first-child>span]:bg-primary"
                />
              </div>
            )}

            {/* Playback controls */}
            <div className="flex items-center justify-between gap-4">
              {/* Left: Play controls */}
              <div className="flex items-center gap-2">
                {onSeek && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSkipBack}
                    className="text-white hover:bg-white/20"
                    title="10 detik mundur"
                  >
                    <SkipBack className="w-5 h-5" />
                  </Button>
                )}
                
                {(onPlay || onPause) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={isAudioPlaying ? onPause : onPlay}
                    className="w-12 h-12 text-white hover:bg-white/20"
                  >
                    {isAudioPlaying ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6 fill-white" />
                    )}
                  </Button>
                )}

                {onSeek && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSkipForward}
                    className="text-white hover:bg-white/20"
                    title="10 detik maju"
                  >
                    <SkipForward className="w-5 h-5" />
                  </Button>
                )}

                <span className="text-white/80 text-sm font-mono ml-2">
                  {formatTime(currentTime)} / {formatTime(totalVideoDuration)}
                </span>
              </div>

              {/* Right: Volume control */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </Button>
                <div className="w-24">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={(value) => {
                      setVolume(value[0]);
                      if (value[0] > 0) setIsMuted(false);
                    }}
                    className="cursor-pointer [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-white [&>span:first-child]:h-1 [&>span:first-child]:bg-white/30 [&>span:first-child>span]:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Keyboard hints */}
            <div className="flex items-center justify-center gap-4 mt-3 text-white/40 text-xs">
              <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">Space</kbd> Play/Pause</span>
              <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">←</kbd><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] ml-0.5">→</kbd> Seek</span>
              <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">Esc</kbd> Keluar</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Render fullscreen using portal to escape any parent constraints
  const fullscreenPortal = typeof document !== 'undefined' && isFullscreen
    ? createPortal(renderFullscreenPreview(), document.body)
    : null;

  return (
    <>
      {fullscreenPortal}
      
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
          <div className="flex items-center gap-2">
            {/* Fullscreen button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(true)}
              className="h-7 w-7"
              title="Fullscreen Preview"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
            
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

        {/* Background - Media or Black Screen with Fade */}
        <div className="absolute inset-0 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {currentMedia ? (
              (() => {
                const variants = getTransitionVariants(currentMedia.transition || "none");
                return (
                  <motion.div
                    key={currentMedia.id}
                    initial={variants.initial}
                    animate={variants.animate}
                    exit={variants.exit}
                    transition={variants.transition}
                    className="absolute inset-0"
                  >
                    {currentMedia.type === "video" && currentMedia.previewUrl ? (
                      <>
                        {isVideoLoading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          </div>
                        )}
                        <video
                          ref={videoRef}
                          key={currentMedia.previewUrl}
                          src={currentMedia.previewUrl}
                          className="absolute inset-0 w-full h-full object-cover"
                          loop
                          muted
                          playsInline
                          autoPlay
                          onLoadStart={() => setIsVideoLoading(true)}
                          onLoadedData={() => setIsVideoLoading(false)}
                          onCanPlay={() => setIsVideoLoading(false)}
                          onError={(e) => {
                            console.error("Video load error:", e);
                            setIsVideoLoading(false);
                          }}
                        />
                      </>
                    ) : (
                      (() => {
                        const kenBurnsEffect = getKenBurnsEffect(currentMedia.id, currentMedia.kenBurns);
                        return kenBurnsEffect ? (
                          <motion.img
                            src={currentMedia.previewUrl}
                            alt="Background"
                            className="absolute inset-0 w-full h-full object-cover"
                            initial={{
                              scale: kenBurnsEffect.initial.scale,
                              x: kenBurnsEffect.initial.x,
                              y: kenBurnsEffect.initial.y,
                            }}
                            animate={{
                              scale: kenBurnsEffect.animate.scale,
                              x: kenBurnsEffect.animate.x,
                              y: kenBurnsEffect.animate.y,
                            }}
                            transition={{
                              duration: currentClipDuration,
                              ease: "linear",
                            }}
                          />
                        ) : (
                          <img
                            src={currentMedia.previewUrl}
                            alt="Background"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        );
                      })()
                    )}
                  </motion.div>
                );
              })()
            ) : (
              <motion.div
                key="black-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0 bg-black"
              />
            )}
          </AnimatePresence>
          
          {/* Fallback gradient when no media at all */}
          {!currentMedia && mediaFiles.length === 0 && (
            <div className="absolute inset-0">
              <div className="absolute inset-0 gradient-dark" />
              <div 
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
                  backgroundSize: '20px 20px'
                }}
              />
            </div>
          )}
        </div>
        
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
                    isSeeking && index === activeMediaIndex && "h-1.5 ring-1 ring-primary shadow-sm"
                  )}
                  animate={{
                    scale: isSeeking && index === activeMediaIndex ? 1.05 : 1
                  }}
                >
                  <motion.div
                    className={cn(
                      "h-full",
                      isSeeking && index === activeMediaIndex ? "bg-primary" : "bg-white"
                    )}
                    initial={{ width: 0 }}
                    animate={{
                      width: index < activeMediaIndex 
                        ? "100%" 
                        : index === activeMediaIndex 
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
          {subtitleStyle.enabled && karaokeSubtitle && karaokeSubtitle.length > 0 && (isAudioPlaying || subtitleWords.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: subtitleStyle.position === "top" ? -10 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: subtitleStyle.position === "top" ? -10 : 10 }}
              className={cn(
                "absolute left-2 right-2 z-10",
                subtitleStyle.position === "top" && "top-8",
                subtitleStyle.position === "center" && "top-1/2 -translate-y-1/2",
                subtitleStyle.position === "bottom" && "bottom-16"
              )}
            >
              <div 
                className="backdrop-blur-md px-4 py-3 rounded-xl text-center shadow-lg"
                style={{ 
                  backgroundColor: `${subtitleStyle.backgroundColor}${Math.round(subtitleStyle.backgroundOpacity * 2.55).toString(16).padStart(2, '0')}`
                }}
              >
                <p className={cn(
                  "font-medium leading-relaxed flex flex-wrap justify-center gap-x-1.5 gap-y-1",
                  subtitleStyle.fontSize === "small" && "text-xs",
                  subtitleStyle.fontSize === "medium" && "text-sm",
                  subtitleStyle.fontSize === "large" && "text-base"
                )}>
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
                        className={cn(
                          "relative z-10 transition-all duration-100",
                          word.isActive && "font-bold",
                          !word.isActive && word.isPast && "text-white/80",
                          !word.isActive && !word.isPast && "text-white/50"
                        )}
                        style={word.isActive ? { 
                          color: subtitleStyle.highlightColor,
                          textShadow: `0 0 8px ${subtitleStyle.highlightColor}80`
                        } : undefined}
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
                          <span 
                            className="font-bold whitespace-nowrap"
                            style={{ 
                              color: subtitleStyle.highlightColor,
                              textShadow: `0 0 12px ${subtitleStyle.highlightColor}`
                            }}
                          >
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
        Format: {videoFormat === "tv" ? "16:9 (1920x1080)" : "9:16 (1080x1920)"}
      </div>
    </motion.div>
    </>
  );
};

export default VideoPreview;
