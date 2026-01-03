import { motion, AnimatePresence } from "framer-motion";
import { Play, Volume2, Pause } from "lucide-react";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";

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
  duration?: number; // Duration in seconds for this media segment
}

interface VideoPreviewProps {
  newsText: string;
  template: TemplateType;
  isGenerating: boolean;
  mediaFiles?: MediaFile[];
  subtitleWords?: SubtitleWord[];
  currentTime?: number;
  isAudioPlaying?: boolean;
  audioDuration?: number;
}

const DEFAULT_IMAGE_DURATION = 3; // 3 seconds per image

const VideoPreview = ({ 
  newsText, 
  template, 
  isGenerating, 
  mediaFiles = [],
  subtitleWords = [],
  currentTime = 0,
  isAudioPlaying = false,
  audioDuration = 0,
}: VideoPreviewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [internalTime, setInternalTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate duration for each media segment based on total audio duration
  const mediaDurations = useMemo(() => {
    if (mediaFiles.length === 0) return [];
    
    // If audio is playing, distribute audio duration across media
    const totalDuration = audioDuration > 0 ? audioDuration : mediaFiles.length * DEFAULT_IMAGE_DURATION;
    const durationPerMedia = totalDuration / mediaFiles.length;
    
    return mediaFiles.map((_, index) => ({
      start: index * durationPerMedia,
      end: (index + 1) * durationPerMedia,
      duration: durationPerMedia,
    }));
  }, [mediaFiles.length, audioDuration]);

  // Determine which media should be shown based on current time
  const activeMediaIndex = useMemo(() => {
    if (mediaFiles.length === 0) return 0;
    
    const time = isAudioPlaying ? currentTime : internalTime;
    
    for (let i = 0; i < mediaDurations.length; i++) {
      if (time >= mediaDurations[i].start && time < mediaDurations[i].end) {
        return i;
      }
    }
    
    // If time exceeds all durations, loop back or show last
    return mediaFiles.length - 1;
  }, [currentTime, internalTime, mediaDurations, mediaFiles.length, isAudioPlaying]);

  // Update current media index when active index changes
  useEffect(() => {
    setCurrentMediaIndex(activeMediaIndex);
  }, [activeMediaIndex]);

  const currentMedia = mediaFiles[currentMediaIndex];

  // Calculate progress within current media segment
  const segmentProgress = useMemo(() => {
    if (mediaDurations.length === 0 || !mediaDurations[currentMediaIndex]) return 0;
    
    const time = isAudioPlaying ? currentTime : internalTime;
    const segment = mediaDurations[currentMediaIndex];
    const progress = ((time - segment.start) / segment.duration) * 100;
    return Math.min(100, Math.max(0, progress));
  }, [currentTime, internalTime, mediaDurations, currentMediaIndex, isAudioPlaying]);

  // Internal timer for preview playback when audio is not playing
  useEffect(() => {
    if (isPlaying && !isAudioPlaying && mediaFiles.length > 0) {
      timerRef.current = setInterval(() => {
        setInternalTime((prev) => {
          const totalDuration = mediaDurations.length > 0 
            ? mediaDurations[mediaDurations.length - 1].end 
            : mediaFiles.length * DEFAULT_IMAGE_DURATION;
          
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
  }, [isPlaying, isAudioPlaying, mediaFiles.length, mediaDurations]);

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

  // Handle play/pause for video elements
  useEffect(() => {
    if (videoRef.current && currentMedia?.type === "video") {
      if (isPlaying || isAudioPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, isAudioPlaying, currentMedia]);

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
        <AnimatePresence mode="wait">
          {currentMedia ? (
            <motion.div
              key={currentMedia.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
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
            onClick={() => setIsPlaying(!isPlaying)}
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
