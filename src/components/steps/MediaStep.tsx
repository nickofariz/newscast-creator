import { motion } from "framer-motion";
import { ChevronRight, Image, Smartphone, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import FootageUploader, { MediaFile } from "@/components/FootageUploader";
import { cn } from "@/lib/utils";

export type VideoFormatType = "short" | "tv";

interface MediaStepProps {
  uploadedMedia: MediaFile[];
  onUploadMedia: (files: MediaFile[]) => void;
  videoFormat: VideoFormatType;
  onVideoFormatChange: (format: VideoFormatType) => void;
  onNext: () => void;
}

const formatOptions = [
  {
    id: "short" as VideoFormatType,
    name: "Short Video",
    description: "Format vertikal untuk TikTok, Reels, Shorts",
    ratio: "9:16",
    resolution: "1080 × 1920",
    icon: Smartphone,
  },
  {
    id: "tv" as VideoFormatType,
    name: "TV / Landscape",
    description: "Format horizontal untuk YouTube, TV",
    ratio: "16:9",
    resolution: "1920 × 1080",
    icon: Monitor,
  },
];

const MediaStep = ({
  uploadedMedia,
  onUploadMedia,
  videoFormat,
  onVideoFormatChange,
  onNext,
}: MediaStepProps) => {
  const canProceed = uploadedMedia.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Image className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-lg text-foreground">
            Upload Media
          </h2>
          <p className="text-sm text-muted-foreground">
            Pilih format video dan upload media untuk konten Anda
          </p>
        </div>
      </div>

      {/* Video Format Selector */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-medium text-foreground mb-3">Format Video</h3>
        <div className="grid grid-cols-2 gap-3">
          {formatOptions.map((format) => {
            const Icon = format.icon;
            const isSelected = videoFormat === format.id;
            return (
              <button
                key={format.id}
                onClick={() => onVideoFormatChange(format.id)}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all text-left group",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50 bg-card/50"
                )}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  {/* Format preview */}
                  <div className={cn(
                    "flex-shrink-0 bg-muted/50 rounded-lg flex items-center justify-center",
                    format.id === "short" ? "w-8 h-14" : "w-14 h-8"
                  )}>
                    <Icon className={cn(
                      "text-muted-foreground",
                      isSelected && "text-primary"
                    )} size={16} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium text-sm",
                      isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {format.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                        {format.ratio}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {format.resolution}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Media Uploader */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-medium text-foreground mb-3">Upload Media</h3>
        <FootageUploader onUpload={onUploadMedia} uploadedFiles={uploadedMedia} />
      </div>

      {/* Next Button */}
      <div className="pt-4">
        <Button
          variant="news"
          size="xl"
          className="w-full"
          onClick={onNext}
          disabled={!canProceed}
        >
          {canProceed ? (
            <>
              Lanjut ke Voice Over
              <ChevronRight className="w-5 h-5" />
            </>
          ) : (
            <>
              Upload Media Terlebih Dahulu
            </>
          )}
        </Button>
        {!canProceed && (
          <p className="text-center text-xs text-muted-foreground mt-2">
            Upload minimal 1 media untuk melanjutkan
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default MediaStep;
