import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ScrubBarProps {
  progress: number; // 0-100
  duration: number;
  onSeek: (time: number) => void;
  className?: string;
  height?: "sm" | "md";
}

const ScrubBar = ({ 
  progress, 
  duration, 
  onSeek, 
  className,
  height = "md" 
}: ScrubBarProps) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);

  const calculateTimeFromPosition = useCallback((clientX: number) => {
    if (!barRef.current || duration <= 0) return 0;
    const rect = barRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    return percentage * duration;
  }, [duration]);

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
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverProgress(null);
  }, []);

  // Handle drag globally
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      const time = calculateTimeFromPosition(e.clientX);
      onSeek(time);
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
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
  );
};

export default ScrubBar;
