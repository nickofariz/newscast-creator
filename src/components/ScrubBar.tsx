import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { ZoomIn, GripVertical } from "lucide-react";
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
  onReorderThumbnails?: (reorderedIds: string[]) => void;
}

const ScrubBar = ({ 
  progress, 
  duration, 
  onSeek, 
  className,
  height = "md",
  thumbnails = [],
  showThumbnailPreview = true,
  showMiniTimeline = false,
  onReorderThumbnails
}: ScrubBarProps) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number>(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [activeThumbIndex, setActiveThumbIndex] = useState<number | null>(null);
  const [isDraggingThumb, setIsDraggingThumb] = useState(false);
  const [orderedThumbnails, setOrderedThumbnails] = useState<ThumbnailSource[]>(thumbnails);

  // Sync ordered thumbnails with props
  useEffect(() => {
    setOrderedThumbnails(thumbnails);
  }, [thumbnails]);

  // Handle reorder
  const handleReorder = useCallback((newOrder: ThumbnailSource[]) => {
    setOrderedThumbnails(newOrder);
    if (onReorderThumbnails) {
      onReorderThumbnails(newOrder.map(t => t.id));
    }
  }, [onReorderThumbnails]);

  // Find current thumbnail index based on progress
  const currentThumbIndex = useMemo(() => {
    if (!orderedThumbnails.length || duration <= 0) return 0;
    const currentTime = (progress / 100) * duration;
    for (let i = 0; i < orderedThumbnails.length; i++) {
      if (currentTime >= orderedThumbnails[i].startTime && currentTime < orderedThumbnails[i].endTime) {
        return i;
      }
    }
    return orderedThumbnails.length - 1;
  }, [orderedThumbnails, progress, duration]);

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
    <div className={cn("w-full", showMiniTimeline && orderedThumbnails.length > 0 && "space-y-3", className)}>
      {/* Main Scrub Bar */}
      <div
        ref={barRef}
        className={cn(
          "w-full bg-muted rounded-full overflow-visible cursor-pointer group relative",
          heightClass,
          isDragging && "cursor-grabbing"
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
      </div>

      {/* Mini Timeline with all thumbnails - Draggable - Now below the scrub bar */}
      {showMiniTimeline && orderedThumbnails.length > 0 && (
        <div className="w-full bg-card/50 rounded-lg p-2 border border-border/30">
          <Reorder.Group
            axis="x"
            values={orderedThumbnails}
            onReorder={handleReorder}
            className="flex gap-1.5"
          >
            {orderedThumbnails.map((thumb, index) => {
              const isActive = index === currentThumbIndex;
              const isHovered = index === activeThumbIndex;
              
              return (
                <Reorder.Item
                  key={thumb.id}
                  value={thumb}
                  onDragStart={() => setIsDraggingThumb(true)}
                  onDragEnd={() => setIsDraggingThumb(false)}
                  className={cn(
                    "relative cursor-grab overflow-hidden rounded-md transition-all flex-1",
                    "border-2",
                    isActive ? "border-primary shadow-lg ring-2 ring-primary/30" : "border-border/50",
                    isHovered && !isActive && "border-primary/50 shadow-md",
                    isDraggingThumb && "cursor-grabbing"
                  )}
                  style={{ 
                    minWidth: '56px',
                    maxWidth: '100px'
                  }}
                  whileDrag={{ 
                    scale: 1.08, 
                    zIndex: 50,
                    boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.4)"
                  }}
                  onMouseEnter={() => setActiveThumbIndex(index)}
                  onMouseLeave={() => setActiveThumbIndex(null)}
                >
                  {/* Thumbnail image */}
                  <div 
                    className="aspect-video relative bg-muted"
                    onClick={(e) => {
                      if (!isDraggingThumb) {
                        e.stopPropagation();
                        onSeek(thumb.startTime);
                      }
                    }}
                  >
                    {thumb.type === "video" ? (
                      <video
                        src={thumb.previewUrl}
                        className="w-full h-full object-cover pointer-events-none"
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={thumb.previewUrl}
                        alt={`Clip ${index + 1}`}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    )}
                    
                    {/* Progress overlay for active clip */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 bg-primary/10 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          className="absolute bottom-0 left-0 h-1 bg-primary"
                          style={{
                            width: `${
                              duration > 0 && (thumb.endTime - thumb.startTime) > 0
                                ? Math.min(100, Math.max(0, (((progress / 100) * duration - thumb.startTime) / (thumb.endTime - thumb.startTime)) * 100))
                                : 0
                            }%`
                          }}
                        />
                      </motion.div>
                    )}
                    
                    {/* Drag handle icon */}
                    <div className={cn(
                      "absolute top-1 right-1 p-0.5 rounded bg-black/60 transition-opacity",
                      isHovered ? "opacity-100" : "opacity-0"
                    )}>
                      <GripVertical className="w-3 h-3 text-white" />
                    </div>
                    
                    {/* Clip number badge */}
                    <div className={cn(
                      "absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-semibold pointer-events-none",
                      isActive ? "bg-primary text-primary-foreground" : "bg-black/70 text-white"
                    )}>
                      {index + 1}
                    </div>
                    
                    {/* Time badge on hover */}
                    <AnimatePresence>
                      {isHovered && !isDraggingThumb && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded text-[8px] text-white font-mono pointer-events-none"
                        >
                          {formatTime(thumb.startTime)}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
          
          {/* Timeline hint */}
          <p className="text-center text-[10px] text-muted-foreground mt-2">
            {isDraggingThumb ? "🎯 Lepas untuk menyimpan urutan" : "Drag untuk reorder • Klik untuk navigasi"}
          </p>
        </div>
      )}
    </div>
  );
};

export default ScrubBar;
