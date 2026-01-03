import { motion, AnimatePresence } from "framer-motion";
import { Upload, Film, X, Check, Image, Plus } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface MediaFile {
  id: string;
  file: File;
  type: "video" | "image";
  previewUrl: string;
}

interface FootageUploaderProps {
  onUpload: (files: MediaFile[]) => void;
  uploadedFiles: MediaFile[];
}

const FootageUploader = ({ onUpload, uploadedFiles }: FootageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      uploadedFiles.forEach((media) => {
        URL.revokeObjectURL(media.previewUrl);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Background Media</span>
          <span className="text-xs text-muted-foreground">(opsional)</span>
        </div>
        {uploadedFiles.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-destructive"
            onClick={handleClearAll}
          >
            Hapus Semua
          </Button>
        )}
      </div>

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

      {/* Uploaded Files Preview */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3"
          >
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {uploadedFiles.map((media, index) => (
                  <motion.div
                    key={media.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative flex-shrink-0 group"
                  >
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-background border border-border">
                      {media.type === "video" ? (
                        <video
                          src={media.previewUrl}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={media.previewUrl}
                          alt={media.file.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      
                      {/* Type indicator */}
                      <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1 py-0.5">
                        {media.type === "video" ? (
                          <Film className="w-3 h-3 text-white" />
                        ) : (
                          <Image className="w-3 h-3 text-white" />
                        )}
                      </div>

                      {/* Index indicator */}
                      <div className="absolute top-1 left-1 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                        {index + 1}
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
                  </motion.div>
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
              </div>
            </ScrollArea>

            {/* File count */}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Check className="w-3 h-3 text-emerald-500" />
              <span>
                {uploadedFiles.length} media ({uploadedFiles.filter(m => m.type === "video").length} video, {uploadedFiles.filter(m => m.type === "image").length} gambar)
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FootageUploader;
