import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Upload, Film, X, Check, Image, Plus, GripVertical, Clock, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { useRef, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface MediaFile {
  id: string;
  file: File;
  type: "video" | "image";
  previewUrl: string;
  duration?: number; // Duration in seconds
}

interface FootageUploaderProps {
  onUpload: (files: MediaFile[]) => void;
  uploadedFiles: MediaFile[];
}

const DEFAULT_IMAGE_DURATION = 3; // seconds per image

const FootageUploader = ({ onUpload, uploadedFiles }: FootageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0);
  const [previewMedia, setPreviewMedia] = useState<MediaFile | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  // Calculate total duration whenever files change
  useEffect(() => {
    let duration = 0;
    let pendingVideos = 0;
    
    uploadedFiles.forEach((media) => {
      if (media.type === "image") {
        duration += DEFAULT_IMAGE_DURATION;
      } else if (media.type === "video") {
        if (media.duration) {
          duration += media.duration;
        } else {
          pendingVideos++;
          // Get video duration
          const video = document.createElement('video');
          video.preload = 'metadata';
          video.onloadedmetadata = () => {
            const updatedFiles = uploadedFiles.map(f => 
              f.id === media.id ? { ...f, duration: video.duration } : f
            );
            onUpload(updatedFiles);
            URL.revokeObjectURL(video.src);
          };
          video.src = media.previewUrl;
        }
      }
    });
    
    setTotalDuration(duration);
  }, [uploadedFiles]);

  // Get current preview index
  const currentPreviewIndex = previewMedia 
    ? uploadedFiles.findIndex(m => m.id === previewMedia.id) 
    : -1;

  const goToPrevMedia = useCallback(() => {
    if (currentPreviewIndex > 0) {
      setPreviewMedia(uploadedFiles[currentPreviewIndex - 1]);
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
    }
  }, [currentPreviewIndex, uploadedFiles]);

  const goToNextMedia = useCallback(() => {
    if (currentPreviewIndex < uploadedFiles.length - 1) {
      setPreviewMedia(uploadedFiles[currentPreviewIndex + 1]);
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
    }
  }, [currentPreviewIndex, uploadedFiles]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.5, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) setPanPosition({ x: 0, y: 0 });
      return newZoom;
    });
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  }, [zoomLevel, panPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && zoomLevel > 1) {
      setPanPosition({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  }, [isPanning, zoomLevel, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  }, [handleZoomIn, handleZoomOut]);

  const handleDoubleClick = useCallback(() => {
    if (zoomLevel === 1) {
      setZoomLevel(4);
    } else {
      setZoomLevel(1);
      setPanPosition({ x: 0, y: 0 });
    }
  }, [zoomLevel]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!previewMedia) return;
      
      if (e.key === 'Escape') {
        setPreviewMedia(null);
      } else if (e.key === 'ArrowLeft') {
        goToPrevMedia();
      } else if (e.key === 'ArrowRight') {
        goToNextMedia();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewMedia, goToPrevMedia, goToNextMedia]);

  // Cleanup preview URLs on unmount - capture files in ref to avoid stale closure
  const uploadedFilesRef = useRef<MediaFile[]>([]);
  uploadedFilesRef.current = uploadedFiles;
  
  useEffect(() => {
    return () => {
      // Only revoke on actual unmount, not on re-renders
      uploadedFilesRef.current.forEach((media) => {
        if (media.previewUrl && media.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(media.previewUrl);
        }
      });
    };
  }, []);

  const handleFiles = (fileList: FileList) => {
    const newFiles: MediaFile[] = [];

    Array.from(fileList).forEach((file) => {
      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");

      if (!isVideo && !isImage) {
        toast.error(`${file.name}: Hanya file video atau gambar yang diperbolehkan`);
        return;
      }

      // Validate file size (max 100MB for video, 20MB for image)
      const maxSize = isVideo ? 100 * 1024 * 1024 : 20 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`${file.name}: Ukuran file maksimal ${isVideo ? "100MB" : "20MB"}`);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      newFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        type: isVideo ? "video" : "image",
        previewUrl,
      });
    });

    if (newFiles.length > 0) {
      const updated = [...uploadedFiles, ...newFiles];
      onUpload(updated);
      toast.success(`${newFiles.length} media berhasil diupload!`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // Reset input value to allow re-uploading same file
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemove = (id: string) => {
    const media = uploadedFiles.find((m) => m.id === id);
    if (media) {
      URL.revokeObjectURL(media.previewUrl);
    }
    const updated = uploadedFiles.filter((m) => m.id !== id);
    onUpload(updated);
  };

  const handleClearAll = () => {
    uploadedFiles.forEach((media) => {
      URL.revokeObjectURL(media.previewUrl);
    });
    onUpload([]);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleReorder = (newOrder: MediaFile[]) => {
    onUpload(newOrder);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
    >
      {uploadedFiles.length > 0 && (
        <div className="flex justify-end mb-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-destructive"
            onClick={handleClearAll}
          >
            Hapus Semua
          </Button>
        </div>
      )}

      {/* Upload Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer
          transition-all duration-300
          ${isDragging 
            ? "border-primary bg-primary/10" 
            : "border-border hover:border-primary/50 hover:bg-card/50"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*,image/*"
          onChange={handleChange}
          multiple
          className="hidden"
        />
        
        <motion.div
          animate={{ scale: isDragging ? 1.05 : 1 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className={`w-5 h-5 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {isDragging ? "Lepaskan untuk upload" : "Upload video atau gambar"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Drag & drop atau klik • MP4, MOV, JPG, PNG • Multiple files
            </p>
          </div>
        </motion.div>
      </div>

      {/* Uploaded Files Preview with Reorder */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3"
          >
            {/* Drag hint */}
            <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
              <GripVertical className="w-3 h-3" />
              Drag untuk mengatur urutan
            </p>

            <div className="overflow-x-auto pb-2">
              <Reorder.Group
                axis="x"
                values={uploadedFiles}
                onReorder={handleReorder}
                className="flex gap-2"
              >
                {uploadedFiles.map((media, index) => (
                  <Reorder.Item
                    key={media.id}
                    value={media}
                    className="relative flex-shrink-0 group cursor-grab active:cursor-grabbing"
                    whileDrag={{ scale: 1.05, zIndex: 50 }}
                  >
                    <div 
                      className="relative w-20 h-20 rounded-lg overflow-hidden bg-background border border-border transition-all hover:border-primary/50 cursor-pointer"
                      onClick={() => setPreviewMedia(media)}
                      onMouseEnter={(e) => {
                        if (media.type === "video") {
                          const video = e.currentTarget.querySelector('video');
                          const progressBar = e.currentTarget.querySelector('[data-progress-bar]') as HTMLElement;
                          if (video) {
                            video.currentTime = 0;
                            video.play().catch(() => {});
                            // Update progress bar
                            const updateProgress = () => {
                              if (progressBar && video.duration) {
                                const progress = (video.currentTime / video.duration) * 100;
                                progressBar.style.width = `${progress}%`;
                              }
                              if (!video.paused) {
                                requestAnimationFrame(updateProgress);
                              }
                            };
                            requestAnimationFrame(updateProgress);
                          }
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (media.type === "video") {
                          const video = e.currentTarget.querySelector('video');
                          const progressBar = e.currentTarget.querySelector('[data-progress-bar]') as HTMLElement;
                          if (video) {
                            video.pause();
                            video.currentTime = 0;
                          }
                          if (progressBar) {
                            progressBar.style.width = '0%';
                          }
                        }
                      }}
                    >
                      {media.type === "video" ? (
                        <video
                          src={media.previewUrl}
                          className="w-full h-full object-cover pointer-events-none"
                          muted
                          loop
                          playsInline
                        />
                      ) : (
                        <img
                          src={media.previewUrl}
                          alt={media.file.name}
                          className="w-full h-full object-cover pointer-events-none"
                          draggable={false}
                        />
                      )}
                      
                      {/* Video progress bar */}
                      {media.type === "video" && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div 
                            data-progress-bar
                            className="h-full bg-primary transition-none"
                            style={{ width: '0%' }}
                          />
                        </div>
                      )}
                      
                      {/* Play indicator for video - hide when playing */}
                      {media.type === "video" && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center shadow-lg animate-pulse">
                            <div className="w-0 h-0 border-l-[8px] border-l-primary border-y-[5px] border-y-transparent ml-0.5" />
                          </div>
                        </div>
                      )}
                      
                      {/* Drag handle overlay */}
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                        <GripVertical className="w-5 h-5 text-white opacity-0 group-hover:opacity-70 transition-opacity drop-shadow-lg" />
                      </div>
                      
                      {/* Index indicator */}
                      <div className="absolute top-1 left-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>

                      {/* Duration indicator - top right */}
                      <div className="absolute top-1 right-1 bg-black/60 rounded px-1 py-0.5 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5 text-white/80" />
                        <span className="text-[9px] text-white font-mono">
                          {media.type === "video" 
                            ? (media.duration ? formatDuration(media.duration) : "...") 
                            : `${DEFAULT_IMAGE_DURATION}s`
                          }
                        </span>
                      </div>
                      
                      {/* Type indicator - bottom left */}
                      <div className="absolute bottom-1.5 left-1 bg-black/60 rounded px-1 py-0.5">
                        {media.type === "video" ? (
                          <Film className="w-3 h-3 text-white" />
                        ) : (
                          <Image className="w-3 h-3 text-white" />
                        )}
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(media.id);
                        }}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </Reorder.Item>
                ))}

                {/* Add more button */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => inputRef.current?.click()}
                  className="flex-shrink-0 w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Tambah</span>
                </motion.button>
              </Reorder.Group>
            </div>

            {/* File count and duration */}
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Check className="w-3 h-3 text-emerald-500" />
                <span>
                  {uploadedFiles.length} media ({uploadedFiles.filter(m => m.type === "video").length} video, {uploadedFiles.filter(m => m.type === "image").length} gambar)
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(totalDuration)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Preview Modal */}
      <AnimatePresence>
        {previewMedia && createPortal(
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setPreviewMedia(null)}
          >
            {/* Close button */}
            <button
              onClick={() => setPreviewMedia(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Media info */}
            <div className="absolute top-4 left-4 flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5">
                {previewMedia.type === "video" ? (
                  <Film className="w-4 h-4 text-white" />
                ) : (
                  <Image className="w-4 h-4 text-white" />
                )}
                <span className="text-white text-sm font-medium">
                  {previewMedia.file.name}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5">
                <Clock className="w-4 h-4 text-white/80" />
                <span className="text-white text-sm font-mono">
                  {previewMedia.type === "video" 
                    ? (previewMedia.duration ? formatDuration(previewMedia.duration) : "...") 
                    : `${DEFAULT_IMAGE_DURATION}s`
                  }
                </span>
              </div>
            </div>

            {/* Prev button */}
            {currentPreviewIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevMedia();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="w-8 h-8 text-white" />
              </button>
            )}

            {/* Next button */}
            {currentPreviewIndex < uploadedFiles.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goToNextMedia();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="w-8 h-8 text-white" />
              </button>
            )}

            {/* Zoom controls for images */}
            {previewMedia.type === "image" && (
              <div className="absolute top-4 right-16 flex items-center gap-2 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomOut();
                  }}
                  disabled={zoomLevel <= 1}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ZoomOut className="w-5 h-5 text-white" />
                </button>
                <span className="text-white text-sm font-medium min-w-[3rem] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomIn();
                  }}
                  disabled={zoomLevel >= 4}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ZoomIn className="w-5 h-5 text-white" />
                </button>
                {zoomLevel > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResetZoom();
                    }}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors ml-1"
                  >
                    <RotateCcw className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>
            )}

            {/* Media content */}
            <motion.div
              key={previewMedia.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-[90vw] max-h-[80vh] rounded-xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {previewMedia.type === "video" ? (
                <video
                  src={previewMedia.previewUrl}
                  className="max-w-full max-h-[80vh] object-contain"
                  controls
                  autoPlay
                  loop
                />
              ) : (
                <div
                  className={`overflow-hidden ${zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onWheel={handleWheel}
                  onDoubleClick={handleDoubleClick}
                >
                  <img
                    src={previewMedia.previewUrl}
                    alt={previewMedia.file.name}
                    className="max-w-full max-h-[80vh] object-contain transition-transform duration-200 select-none"
                    style={{
                      transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                    }}
                    draggable={false}
                  />
                </div>
              )}
            </motion.div>

            {/* Navigation hint & counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
              <div className="bg-white/10 rounded-full px-4 py-1.5 text-white text-sm font-medium">
                {currentPreviewIndex + 1} / {uploadedFiles.length}
              </div>
              <span className="text-white/50 text-xs">
                {previewMedia.type === "image" 
                  ? "Scroll untuk zoom • Drag untuk geser • ← → navigasi • ESC tutup"
                  : "← → untuk navigasi • ESC untuk menutup"
                }
              </span>
            </div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Helper function to format duration
const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default FootageUploader;
