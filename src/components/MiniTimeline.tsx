import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { GripVertical, Film } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThumbnailSource {
  id: string;
  previewUrl: string;
  type: "video" | "image";
  startTime: number;
  endTime: number;
}

interface MiniTimelineProps {
  thumbnails: ThumbnailSource[];
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onReorder?: (reorderedIds: string[]) => void;
  className?: string;
}

const MiniTimeline = ({
  thumbnails,
  currentTime,
  duration,
  onSeek,
  onReorder,
  className
}: MiniTimelineProps) => {
  const [activeThumbIndex, setActiveThumbIndex] = useState<number | null>(null);
  const [isDraggingThumb, setIsDraggingThumb] = useState(false);
  const [orderedThumbnails, setOrderedThumbnails] = useState<ThumbnailSource[]>(thumbnails);

  // Sync ordered thumbnails with props
  useMemo(() => {
    setOrderedThumbnails(thumbnails);
  }, [thumbnails]);

  // Find current thumbnail index based on currentTime
  const currentThumbIndex = useMemo(() => {
    if (!orderedThumbnails.length || duration <= 0) return 0;
    for (let i = 0; i < orderedThumbnails.length; i++) {
      if (currentTime >= orderedThumbnails[i].startTime && currentTime < orderedThumbnails[i].endTime) {
        return i;
      }
    }
    return orderedThumbnails.length - 1;
  }, [orderedThumbnails, currentTime, duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleReorder = useCallback((newOrder: ThumbnailSource[]) => {
    setOrderedThumbnails(newOrder);
    if (onReorder) {
      onReorder(newOrder.map(t => t.id));
    }
  }, [onReorder]);

  if (thumbnails.length === 0) {
    return (
      <div className={cn("bg-card/30 rounded-xl p-4 border border-border/30", className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Film className="w-4 h-4" />
          <span className="text-sm">Upload media untuk melihat timeline</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-card/50 rounded-xl p-3 border border-border/30", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-foreground">Quick Timeline</span>
          <span className="text-[10px] text-muted-foreground">({thumbnails.length} clips)</span>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      {/* Thumbnails */}
      <Reorder.Group
        axis="x"
        values={orderedThumbnails}
        onReorder={handleReorder}
        className="flex gap-2"
      >
        {orderedThumbnails.map((thumb, index) => {
          const isActive = index === currentThumbIndex;
          const isHovered = index === activeThumbIndex;
          const clipProgress = duration > 0 && (thumb.endTime - thumb.startTime) > 0
            ? Math.min(100, Math.max(0, ((currentTime - thumb.startTime) / (thumb.endTime - thumb.startTime)) * 100))
            : 0;
          
          return (
            <Reorder.Item
              key={thumb.id}
              value={thumb}
              onDragStart={() => setIsDraggingThumb(true)}
              onDragEnd={() => setIsDraggingThumb(false)}
              className={cn(
                "relative cursor-grab overflow-hidden rounded-lg transition-all flex-1",
                "border-2",
                isActive ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-border/50 hover:border-border",
                isHovered && !isActive && "border-primary/40 shadow-md",
                isDraggingThumb && "cursor-grabbing"
              )}
              style={{ 
                minWidth: '70px',
                maxWidth: '120px'
              }}
              whileDrag={{ 
                scale: 1.05, 
                zIndex: 50,
                boxShadow: "0 15px 40px -10px rgba(0, 0, 0, 0.4)"
              }}
              onMouseEnter={() => setActiveThumbIndex(index)}
              onMouseLeave={() => setActiveThumbIndex(null)}
            >
              {/* Thumbnail image */}
              <div 
                className="aspect-video relative bg-muted cursor-pointer"
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
                
                {/* Active clip overlay */}
                {isActive && (
                  <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                )}
                
                {/* Progress bar for active clip */}
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="h-full bg-primary"
                      style={{ width: `${clipProgress}%` }}
                    />
                  </motion.div>
                )}
                
                {/* Drag handle icon */}
                <motion.div 
                  className={cn(
                    "absolute top-1 right-1 p-1 rounded-md bg-black/60 backdrop-blur-sm transition-opacity",
                    isHovered || isDraggingThumb ? "opacity-100" : "opacity-0"
                  )}
                  animate={{ scale: isDraggingThumb ? 1.1 : 1 }}
                >
                  <GripVertical className="w-3 h-3 text-white" />
                </motion.div>
                
                {/* Clip number badge */}
                <div className={cn(
                  "absolute top-1 left-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold pointer-events-none",
                  isActive ? "bg-primary text-primary-foreground" : "bg-black/70 text-white"
                )}>
                  {index + 1}
                </div>
                
                {/* Duration badge */}
                <div className="absolute bottom-1 left-1 px-1 py-0.5 bg-black/70 rounded text-[8px] text-white font-mono pointer-events-none">
                  {formatTime(thumb.endTime - thumb.startTime)}
                </div>
                
                {/* Start time on hover */}
                <AnimatePresence>
                  {isHovered && !isDraggingThumb && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-primary rounded text-[8px] text-primary-foreground font-mono pointer-events-none"
                    >
                      @{formatTime(thumb.startTime)}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
      
      {/* Hint */}
      <p className="text-center text-[10px] text-muted-foreground mt-2">
        {isDraggingThumb ? "🎯 Lepas untuk menyimpan urutan" : "Drag untuk reorder • Klik untuk navigasi cepat"}
      </p>
    </div>
  );
};

export default MiniTimeline;
