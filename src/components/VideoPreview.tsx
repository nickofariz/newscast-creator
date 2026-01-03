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

export interface EditedClip {
  id: string;
  previewUrl: string;
  type: "video" | "image";
  startTime: number;
  endTime: number;
  effectiveDuration: number;
}

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
  onPlay,
  onPause,
}: VideoPreviewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [internalTime, setInternalTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Use edited clips if available, otherwise fallback to calculated durations
  const hasEditedClips = editedClips.length > 0;

  // Determine which media should be shown based on current time and edited clips
  const activeMediaIndex = useMemo(() => {
    if (mediaFiles.length === 0 && editedClips.length === 0) return 0;
    
    // Use currentTime from audio if playing, otherwise use internalTime
    const time = isAudioPlaying ? currentTime : internalTime;
    
    // Use edited clips if available - this is the primary logic
    if (hasEditedClips) {
      for (let i = 0; i < editedClips.length; i++) {
        if (time >= editedClips[i].startTime && time < editedClips[i].endTime) {
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
  }, [currentTime, internalTime, isAudioPlaying, editedClips, mediaFiles.length, hasEditedClips, audioDuration]);

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
        type: clip.type 
      };
    }
    return mediaFiles[currentMediaIndex] || null;
  }, [hasEditedClips, editedClips, currentMediaIndex, mediaFiles]);

  // Calculate progress within current media segment
  const segmentProgress = useMemo(() => {
    const time = isAudioPlaying ? currentTime : internalTime;
    
    if (hasEditedClips && editedClips[currentMediaIndex]) {
      const clip = editedClips[currentMediaIndex];
      const progress = ((time - clip.startTime) / clip.effectiveDuration) * 100;
      return Math.min(100, Math.max(0, progress));
    }
    
    // Fallback calculation
    const totalDuration = audioDuration > 0 ? audioDuration : mediaFiles.length * DEFAULT_IMAGE_DURATION;
    const durationPerMedia = totalDuration / Math.max(1, mediaFiles.length);
    const start = currentMediaIndex * durationPerMedia;
    const progress = ((time - start) / durationPerMedia) * 100;
    return Math.min(100, Math.max(0, progress));
  }, [currentTime, internalTime, isAudioPlaying, editedClips, currentMediaIndex, hasEditedClips, audioDuration, mediaFiles.length]);

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

  // Sync with audio playback
  useEffect(() => {
    if (isAudioPlaying) {
      setIsPlaying(true);
    }
  }, [isAudioPlaying]);

  // Reset internal time when not playing
  useEffect(() => {
    if (!isPlaying && !isAudioPlaying) {
      setInternalTime(0);
      setCurrentMediaIndex(0);
    }
  }, [isPlaying, isAudioPlaying]);

  // Get active subtitle text based on current time
  const activeSubtitle = useMemo(() => {
    if (!subtitleWords.length || !isAudioPlaying) return null;
    
    const activeWords = subtitleWords.filter(
      (word) => currentTime >= word.start - 0.1 && currentTime <= word.end + 0.5
    );
    
    if (activeWords.length === 0) return null;
    
    const currentIndex = subtitleWords.findIndex(
      (word) => currentTime >= word.start && currentTime <= word.end
    );
    
    if (currentIndex === -1) return activeWords.map(w => w.text).join(" ");
    
    const startIdx = Math.max(0, currentIndex - 2);
    const endIdx = Math.min(subtitleWords.length, currentIndex + 3);
    
    return subtitleWords.slice(startIdx, endIdx).map((w) => {
      const isActive = currentTime >= w.start && currentTime <= w.end;
      return { text: w.text, isActive };
    });
  }, [subtitleWords, currentTime, isAudioPlaying]);

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
      const time = isAudioPlaying ? currentTime : internalTime;
      const currentClip = editedClips[currentMediaIndex];
      if (currentClip) {
        const offsetInClip = time - currentClip.startTime;
        // Only seek if there's a significant difference to avoid stuttering
        if (Math.abs(videoRef.current.currentTime - offsetInClip) > 0.3) {
          videoRef.current.currentTime = Math.max(0, offsetInClip);
        }
      }
    }
  }, [currentTime, internalTime, isAudioPlaying, currentMediaIndex, editedClips, hasEditedClips, currentMedia]);

  // Extract first line as headline
  const lines = newsText.trim().split('\n').filter(line => line.trim());
  const headline = lines[0]?.substring(0, 50) || "Headline Berita";
  const subtitle = lines[1]?.substring(0, 80) || "Subtitle akan muncul di sini...";

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

  const displayTime = isAudioPlaying ? currentTime : internalTime;

  const renderTemplate = () => {
    switch (template) {
      case "headline-top":
        return (
          <>
            <div className="absolute top-8 left-4 right-4">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm font-display font-bold text-foreground leading-tight"
              >
                {headline}
              </motion.div>
            </div>
            <div className="absolute bottom-12 left-4 right-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-background/80 backdrop-blur-sm px-3 py-2 rounded-lg"
              >
                <p className="text-xs text-foreground font-medium leading-relaxed">
                  {subtitle}
                </p>
              </motion.div>
            </div>
          </>
        );

      case "minimal":
        return (
          <div className="absolute bottom-12 left-4 right-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-2"
            >
              <p className="text-xs text-foreground font-bold leading-relaxed text-center drop-shadow-lg">
                {subtitle}
              </p>
            </motion.div>
          </div>
        );

      case "breaking":
        return (
          <>
            <div className="absolute top-6 left-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="gradient-news px-3 py-1 rounded-sm"
              >
                <span className="text-[10px] font-bold text-primary-foreground tracking-wider">
                  BREAKING NEWS
                </span>
              </motion.div>
            </div>
            <div className="absolute top-14 left-4 right-4">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm font-display font-bold text-foreground leading-tight"
              >
                {headline}
              </motion.div>
            </div>
            <div className="absolute bottom-12 left-4 right-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary/20 border-l-2 border-primary px-3 py-2 rounded-r-lg"
              >
                <p className="text-xs text-foreground font-medium leading-relaxed">
                  {subtitle}
                </p>
              </motion.div>
            </div>
          </>
        );
    }
  };

  // Render overlay elements
  const renderOverlays = () => {
    if (!overlaySettings) return null;

    return (
      <>
        {/* Frame Overlay */}
        {overlaySettings.frame?.enabled && (
          <>
            {overlaySettings.frame.style === "border" && (
              <div
                className="absolute inset-0 z-20 pointer-events-none border-4"
                style={{ borderColor: overlaySettings.frame.color }}
              />
            )}
            {overlaySettings.frame.style === "bars" && (
              <>
                <div
                  className="absolute top-0 left-0 right-0 h-3 z-20"
                  style={{ backgroundColor: overlaySettings.frame.color }}
                />
                <div
                  className="absolute bottom-0 left-0 right-0 h-3 z-20"
                  style={{ backgroundColor: overlaySettings.frame.color }}
                />
              </>
            )}
            {overlaySettings.frame.style === "corner" && (
              <>
                <div
                  className="absolute top-2 left-2 w-6 h-6 border-t-3 border-l-3 z-20"
                  style={{ borderColor: overlaySettings.frame.color }}
                />
                <div
                  className="absolute top-2 right-2 w-6 h-6 border-t-3 border-r-3 z-20"
                  style={{ borderColor: overlaySettings.frame.color }}
                />
                <div
                  className="absolute bottom-8 left-2 w-6 h-6 border-b-3 border-l-3 z-20"
                  style={{ borderColor: overlaySettings.frame.color }}
                />
                <div
                  className="absolute bottom-8 right-2 w-6 h-6 border-b-3 border-r-3 z-20"
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
              overlaySettings.logo.position === "top-left" && "top-4 left-3",
              overlaySettings.logo.position === "top-right" && "top-4 right-3",
              overlaySettings.logo.position === "bottom-left" && "bottom-14 left-3",
              overlaySettings.logo.position === "bottom-right" && "bottom-14 right-3"
            )}
            style={{
              width: `${overlaySettings.logo.size || 40}px`,
              height: `${overlaySettings.logo.size || 40}px`,
            }}
          >
            <img
              src={overlaySettings.logo.url}
              alt="Logo"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </motion.div>
        )}

        {/* Headline Box Overlay */}
        {overlaySettings.headline?.enabled && (
          <motion.div
            initial={{ opacity: 0, y: overlaySettings.headline.position === "top" ? -20 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "absolute left-0 right-0 z-25 px-2",
              overlaySettings.headline.position === "top" && "top-6",
              overlaySettings.headline.position === "center" && "top-1/2 -translate-y-1/2",
              overlaySettings.headline.position === "bottom" && "bottom-10"
            )}
          >
            <div
              className={cn(
                "px-3 py-2 rounded-lg",
                overlaySettings.headline.style === "transparent" && "bg-black/60 backdrop-blur-sm"
              )}
              style={{
                backgroundColor: overlaySettings.headline.style === "solid" 
                  ? overlaySettings.headline.color 
                  : undefined,
                background: overlaySettings.headline.style === "gradient"
                  ? `linear-gradient(to top, ${overlaySettings.headline.color}, transparent)`
                  : undefined,
              }}
            >
              <p className="text-white text-[11px] font-bold leading-tight drop-shadow-md">
                {headline}
              </p>
              {overlaySettings.headline.showSubtitle && (
                <p className="text-white/90 text-[9px] font-medium leading-tight mt-0.5 drop-shadow-md">
                  {subtitle}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Credit Text */}
        {overlaySettings.credit?.enabled && (overlaySettings.credit.text || overlaySettings.credit.secondaryText) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "absolute left-2 right-2 z-30 text-center",
              overlaySettings.credit.position === "top" ? "top-4" : "bottom-4"
            )}
          >
            {overlaySettings.credit.text && (
              <p className="text-white text-[8px] font-medium drop-shadow-md">
                {overlaySettings.credit.text}
              </p>
            )}
            {overlaySettings.credit.secondaryText && (
              <p className="text-white/70 text-[7px] drop-shadow-md">
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
            className="absolute top-6 left-0 right-0 z-30"
          >
            <div
              className={cn(
                "mx-2 px-3 py-1.5 text-white text-[10px] font-bold text-center tracking-wider",
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
            className="absolute bottom-20 left-2 right-2 z-30"
          >
            <div
              className={cn(
                "px-2 py-1.5 rounded",
                overlaySettings.lowerThird.style === "modern" && "bg-gradient-to-r from-primary to-primary/80 text-white",
                overlaySettings.lowerThird.style === "classic" && "bg-black/90 text-white border-l-2 border-primary",
                overlaySettings.lowerThird.style === "minimal" && "bg-white/95 text-black"
              )}
            >
              {overlaySettings.lowerThird.title && (
                <p className="text-[10px] font-semibold leading-tight">
                  {overlaySettings.lowerThird.title}
                </p>
              )}
              {overlaySettings.lowerThird.subtitle && (
                <p className={cn(
                  "text-[8px] leading-tight",
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
      <div className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        Preview Video
        {mediaFiles.length > 1 && (
          <span className="text-xs text-muted-foreground">
            ({mediaFiles.length} media)
          </span>
        )}
      </div>

      <div className="video-frame relative mx-auto max-w-[200px] shadow-card">
        {/* Background - Media or Gradient */}
        <AnimatePresence mode="sync">
          {currentMedia ? (
            <motion.div
              key={`${currentMedia.id}-${currentMediaIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0"
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
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
            </motion.div>
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
                <div
                  key={index}
                  className="flex-1 h-1 rounded-full overflow-hidden bg-white/30"
                >
                  <motion.div
                    className="h-full bg-white"
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
                </div>
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

        {/* Subtitle overlay */}
        <AnimatePresence>
          {activeSubtitle && isAudioPlaying && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-16 left-2 right-2 z-10"
            >
              <div className="bg-black/80 backdrop-blur-sm px-3 py-2 rounded-lg text-center">
                <p className="text-xs font-medium leading-relaxed">
                  {Array.isArray(activeSubtitle) ? (
                    activeSubtitle.map((word, i) => (
                      <span
                        key={i}
                        className={`${
                          word.isActive 
                            ? "text-primary font-bold" 
                            : "text-white/90"
                        } transition-colors duration-150`}
                      >
                        {word.text}{" "}
                      </span>
                    ))
                  ) : (
                    <span className="text-white">{activeSubtitle}</span>
                  )}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom controls - Timeline */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white/80">
          <span>{formatTime(displayTime)}</span>
          <div className="flex-1 mx-2 h-1 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white"
              style={{ width: `${(displayTime / totalVideoDuration) * 100}%` }}
            />
          </div>
          <span>{formatTime(totalVideoDuration)}</span>
        </div>

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
