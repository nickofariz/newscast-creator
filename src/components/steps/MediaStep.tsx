import { motion } from "framer-motion";
import { ChevronRight, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import FootageUploader, { MediaFile } from "@/components/FootageUploader";

interface MediaStepProps {
  uploadedMedia: MediaFile[];
  onUploadMedia: (files: MediaFile[]) => void;
  onNext: () => void;
}

const MediaStep = ({
  uploadedMedia,
  onUploadMedia,
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
            Upload video atau gambar untuk konten Anda (wajib)
          </p>
        </div>
      </div>

      {/* Media Uploader */}
      <div className="glass-card rounded-xl p-5">
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
