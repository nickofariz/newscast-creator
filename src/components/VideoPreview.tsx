import { motion, AnimatePresence } from "framer-motion";
import { Play, Volume2, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";

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
}

interface VideoPreviewProps {
  newsText: string;
  template: TemplateType;
  isGenerating: boolean;
  mediaFiles?: MediaFile[];
  subtitleWords?: SubtitleWord[];
  currentTime?: number;
  isAudioPlaying?: boolean;
}

const VideoPreview = ({ 
  newsText, 
  template, 
  isGenerating, 
  mediaFiles = [],
  subtitleWords = [],
  currentTime = 0,
  isAudioPlaying = false,
}: VideoPreviewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentMedia = mediaFiles[currentMediaIndex];

  // Get active subtitle text based on current time
  const activeSubtitle = useMemo(() => {
    if (!subtitleWords.length || !isAudioPlaying) return null;
    
    // Find words that are currently being spoken (within a 2 second window for context)
    const activeWords = subtitleWords.filter(
      (word) => currentTime >= word.start - 0.1 && currentTime <= word.end + 0.5
    );
    
    if (activeWords.length === 0) return null;
    
    // Get surrounding words for better readability (show ~5 words at a time)
    const currentIndex = subtitleWords.findIndex(
      (word) => currentTime >= word.start && currentTime <= word.end
    );
    
    if (currentIndex === -1) return activeWords.map(w => w.text).join(" ");
    
    const startIdx = Math.max(0, currentIndex - 2);
    const endIdx = Math.min(subtitleWords.length, currentIndex + 3);
    
    return subtitleWords.slice(startIdx, endIdx).map((w, i) => {
      const isActive = currentTime >= w.start && currentTime <= w.end;
      return { text: w.text, isActive };
    });
  }, [subtitleWords, currentTime, isAudioPlaying]);

  // Reset index when media files change
  useEffect(() => {
    if (currentMediaIndex >= mediaFiles.length) {
      setCurrentMediaIndex(Math.max(0, mediaFiles.length - 1));
    }
  }, [mediaFiles.length, currentMediaIndex]);

  const goToNextMedia = () => {
    if (mediaFiles.length > 1) {
      setCurrentMediaIndex((prev) => (prev + 1) % mediaFiles.length);
    }
  };

  const goToPrevMedia = () => {
    if (mediaFiles.length > 1) {
      setCurrentMediaIndex((prev) => (prev - 1 + mediaFiles.length) % mediaFiles.length);
    }
  };

  // Handle play/pause
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Extract first line as headline
  const lines = newsText.trim().split('\n').filter(line => line.trim());
  const headline = lines[0]?.substring(0, 50) || "Headline Berita";
  const subtitle = lines[1]?.substring(0, 80) || "Subtitle akan muncul di sini...";

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
      </div>

      <div className="video-frame relative mx-auto max-w-[200px] shadow-card">
        {/* Background - Media or Gradient */}
        {currentMedia ? (
          currentMedia.type === "video" ? (
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
          )
        ) : (
          <>
            <div className="absolute inset-0 gradient-dark" />
            <div 
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
                backgroundSize: '20px 20px'
              }}
            />
          </>
        )}
        
        {/* Dark overlay for text readability */}
        {currentMedia && <div className="absolute inset-0 bg-black/40" />}

        {/* Media navigation */}
        {mediaFiles.length > 1 && (
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-20">
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevMedia(); }}
              className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <span className="text-[10px] text-white bg-black/50 px-2 py-0.5 rounded-full">
              {currentMediaIndex + 1}/{mediaFiles.length}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); goToNextMedia(); }}
              className="w-6 h-6 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
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
            {isPlaying ? (
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

        {/* Bottom controls */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>0:00 / 0:30</span>
          <Volume2 className="w-3 h-3" />
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
