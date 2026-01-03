import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThumbnailSource {
  id: string;
  previewUrl: string;
  type: "video" | "image";
  startTime: number;
  endTime: number;
}

interface ScrubBarProps {
  progress: number; // 0-100
  duration: number;
  onSeek: (time: number) => void;
  className?: string;
  height?: "sm" | "md";
  thumbnails?: ThumbnailSource[];
  showThumbnailPreview?: boolean;
  showMiniTimeline?: boolean;
}

const ScrubBar = ({ 
  progress, 
  duration, 
  onSeek, 
  className,
  height = "md",
  thumbnails = [],
  showThumbnailPreview = true,
  showMiniTimeline = false
}: ScrubBarProps) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number>(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [activeThumbIndex, setActiveThumbIndex] = useState<number | null>(null);

  // Find current thumbnail index based on progress
  const currentThumbIndex = useMemo(() => {
    if (!thumbnails.length || duration <= 0) return 0;
    const currentTime = (progress / 100) * duration;
    for (let i = 0; i < thumbnails.length; i++) {
      if (currentTime >= thumbnails[i].startTime && currentTime < thumbnails[i].endTime) {
        return i;
      }
    }
    return thumbnails.length - 1;
  }, [thumbnails, progress, duration]);

  const calculateTimeFromPosition = useCallback((clientX: number) => {
    if (!barRef.current || duration <= 0) return 0;
    const rect = barRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    return percentage * duration;
  }, [duration]);

  // Find thumbnail for the hovered time
  const hoveredThumbnail = useMemo(() => {
    if (!thumbnails.length || hoverProgress === null) return null;
    
    for (const thumb of thumbnails) {
      if (hoverTime >= thumb.startTime && hoverTime < thumb.endTime) {
        return thumb;
      }
    }
    // Return last thumbnail if time exceeds all
    return thumbnails[thumbnails.length - 1] || null;
  }, [thumbnails, hoverTime, hoverProgress]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const time = calculateTimeFromPosition(e.clientX);
    onSeek(time);
  }, [calculateTimeFromPosition, onSeek]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setHoverProgress(percentage);
    setHoverTime((percentage / 100) * duration);
  }, [duration]);

  const handleMouseLeave = useCallback(() => {
    setHoverProgress(null);
    setIsZoomed(false);
  }, []);

  // Handle drag globally with throttling to reduce seek spam
  useEffect(() => {
    if (!isDragging) return;

    let rafId: number | null = null;
    let lastSeekTime = 0;
    const THROTTLE_MS = 50;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastSeekTime < THROTTLE_MS) return;
      
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const time = calculateTimeFromPosition(e.clientX);
        lastSeekTime = Date.now();
        onSeek(time);
      });
    };

    const handleGlobalMouseUp = () => {
      if (rafId) cancelAnimationFrame(rafId);
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, calculateTimeFromPosition, onSeek]);

  const heightClass = height === "sm" ? "h-1.5" : "h-2";
  const thumbSize = height === "sm" ? "w-2.5 h-2.5" : "w-3 h-3";

  return (
    <div
      ref={barRef}
      className={cn(
        "w-full bg-muted rounded-full overflow-visible cursor-pointer group relative",
        heightClass,
        isDragging && "cursor-grabbing",
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Thumbnail preview popup */}
      <AnimatePresence>
        {showThumbnailPreview && hoverProgress !== null && !isDragging && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 pointer-events-auto z-50"
            style={{ 
              left: `${hoverProgress}%`,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="flex flex-col items-center">
              {/* Thumbnail container with zoom capability */}
              {hoveredThumbnail ? (
                <motion.div 
                  className="relative rounded-lg overflow-hidden shadow-lg border border-border/50 bg-card cursor-zoom-in"
                  animate={{
                    width: isZoomed ? 160 : 80,
                    height: isZoomed ? 112 : 56
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  onMouseEnter={() => setIsZoomed(true)}
                  onMouseLeave={() => setIsZoomed(false)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsZoomed(!isZoomed);
                  }}
                >
                  {hoveredThumbnail.type === "video" ? (
                    <video
                      src={hoveredThumbnail.previewUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <motion.img
                      src={hoveredThumbnail.previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      animate={{
                        scale: isZoomed ? 1 : 1
                      }}
                    />
                  )}
                  
                  {/* Clip number badge */}
                  <motion.div 
                    className="absolute top-0.5 left-0.5 px-1 py-0.5 bg-black/60 rounded font-medium text-white"
                    animate={{
                      fontSize: isZoomed ? "10px" : "8px"
                    }}
                  >
                    #{thumbnails.indexOf(hoveredThumbnail) + 1}
                  </motion.div>
                  
                  {/* Zoom indicator */}
                  <motion.div
                    className="absolute bottom-0.5 right-0.5 p-0.5 bg-black/60 rounded"
                    animate={{
                      opacity: isZoomed ? 0 : 0.8
                    }}
                  >
                    <ZoomIn className="w-3 h-3 text-white" />
                  </motion.div>
                  
                  {/* Zoomed label */}
                  <AnimatePresence>
                    {isZoomed && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-0.5 right-0.5 px-1 py-0.5 bg-primary/80 rounded text-[8px] text-primary-foreground font-medium"
                      >
                        2x
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="w-20 h-14 bg-muted rounded-lg flex items-center justify-center border border-border/50">
                  <span className="text-[10px] text-muted-foreground">No preview</span>
                </div>
              )}
              
              {/* Time badge */}
              <motion.div 
                className="mt-1 px-2 py-0.5 bg-primary rounded-full shadow-md"
                animate={{
                  scale: isZoomed ? 1.1 : 1
                }}
              >
                <span className={cn(
                  "font-mono font-medium text-primary-foreground transition-all",
                  isZoomed ? "text-xs" : "text-[10px]"
                )}>
                  {formatTime(hoverTime)}
                </span>
              </motion.div>
              
              {/* Arrow pointer */}
              <div className="w-2 h-2 bg-primary rotate-45 -mt-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover preview line */}
      {hoverProgress !== null && !isDragging && (
        <div 
          className="absolute top-0 bottom-0 w-px bg-primary/40 pointer-events-none z-10"
          style={{ left: `${hoverProgress}%` }}
        />
      )}
      
      {/* Progress fill */}
      <div 
        className={cn(
          "h-full bg-primary rounded-full transition-all",
          !isDragging && "duration-100",
          "group-hover:bg-primary/90"
        )}
        style={{ width: `${progress}%` }}
      />
      
      {/* Draggable thumb */}
      <div 
        className={cn(
          "absolute top-1/2 -translate-y-1/2 bg-primary rounded-full shadow-md pointer-events-none transition-transform",
          thumbSize,
          "opacity-0 group-hover:opacity-100",
          isDragging && "opacity-100 scale-110"
        )}
        style={{ left: `calc(${progress}% - ${height === "sm" ? "5px" : "6px"})` }} 
      />

      {/* Mini Timeline with all thumbnails */}
      {showMiniTimeline && thumbnails.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0">
          <div className="flex gap-1 justify-center">
            {thumbnails.map((thumb, index) => {
              const isActive = index === currentThumbIndex;
              const isHovered = index === activeThumbIndex;
              const thumbProgress = duration > 0 
                ? ((thumb.endTime - thumb.startTime) / duration) * 100 
                : 100 / thumbnails.length;
              
              return (
                <motion.div
                  key={thumb.id}
                  className={cn(
                    "relative cursor-pointer overflow-hidden rounded transition-all",
                    "border-2",
                    isActive ? "border-primary shadow-md" : "border-transparent",
                    isHovered && !isActive && "border-primary/50"
                  )}
                  style={{ 
                    flex: `${thumbProgress} 1 0%`,
                    minWidth: '32px',
                    maxWidth: '80px'
                  }}
                  animate={{
                    scale: isHovered ? 1.05 : 1,
                    y: isHovered ? -2 : 0
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onMouseEnter={() => setActiveThumbIndex(index)}
                  onMouseLeave={() => setActiveThumbIndex(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Seek to the start of this clip
                    onSeek(thumb.startTime);
                  }}
                >
                  {/* Thumbnail image */}
                  <div className="aspect-video relative bg-muted">
                    {thumb.type === "video" ? (
                      <video
                        src={thumb.previewUrl}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={thumb.previewUrl}
                        alt={`Clip ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {/* Progress overlay for active clip */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 bg-primary/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          className="absolute bottom-0 left-0 h-0.5 bg-primary"
                          style={{
                            width: `${
                              duration > 0 && (thumb.endTime - thumb.startTime) > 0
                                ? (((progress / 100) * duration - thumb.startTime) / (thumb.endTime - thumb.startTime)) * 100
                                : 0
                            }%`
                          }}
                        />
                      </motion.div>
                    )}
                    
                    {/* Clip number */}
                    <div className={cn(
                      "absolute top-0.5 left-0.5 px-1 py-0.5 rounded text-[8px] font-medium",
                      isActive ? "bg-primary text-primary-foreground" : "bg-black/60 text-white"
                    )}>
                      {index + 1}
                    </div>
                    
                    {/* Duration badge on hover */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute bottom-0.5 right-0.5 px-1 py-0.5 bg-black/70 rounded text-[7px] text-white font-mono"
                        >
                          {formatTime(thumb.startTime)}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {/* Timeline hint */}
          <p className="text-center text-[9px] text-muted-foreground mt-1">
            Klik thumbnail untuk navigasi cepat
          </p>
        </div>
      )}
    </div>
  );
};

export default ScrubBar;
