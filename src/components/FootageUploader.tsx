import { motion } from "framer-motion";
import { Upload, Film, X, Check } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FootageUploaderProps {
  onUpload: (file: File | null) => void;
  uploadedFile: File | null;
}

const FootageUploader = ({ onUpload, uploadedFile }: FootageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast.error("Hanya file video yang diperbolehkan");
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 100MB");
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onUpload(file);
    toast.success("Video berhasil diupload!");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    onUpload(null);
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
      <div className="flex items-center gap-2 mb-3">
        <Film className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Background Video</span>
        <span className="text-xs text-muted-foreground">(opsional)</span>
      </div>

      {!uploadedFile ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
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
            accept="video/*"
            onChange={handleChange}
            className="hidden"
          />
          
          <motion.div
            animate={{ scale: isDragging ? 1.05 : 1 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className={`w-6 h-6 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {isDragging ? "Lepaskan untuk upload" : "Upload footage video"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Drag & drop atau klik untuk memilih • MP4, MOV, WebM • Max 100MB
              </p>
            </div>
          </motion.div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-xl overflow-hidden bg-card border border-border"
        >
          <div className="flex items-center gap-3 p-3">
            {/* Video Preview Thumbnail */}
            <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-background flex-shrink-0">
              {previewUrl && (
                <video
                  src={previewUrl}
                  className="w-full h-full object-cover"
                  muted
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Film className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {uploadedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-emerald-500">
                <Check className="w-3 h-3" />
                <span>Uploaded</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={handleRemove}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default FootageUploader;
