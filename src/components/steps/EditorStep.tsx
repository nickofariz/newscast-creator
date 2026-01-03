import { motion } from "framer-motion";
import { ChevronRight, ChevronLeft, Film, Sparkles, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import VideoEditor from "@/components/VideoEditor";
import VideoPreview from "@/components/VideoPreview";
import { MediaFile } from "@/components/FootageUploader";
import { OverlaySettings } from "@/components/OverlaySelector";
import OverlaySelector from "@/components/OverlaySelector";
import OverlayTemplateManager from "@/components/OverlayTemplateManager";
import TemplateSelector from "@/components/TemplateSelector";

interface SubtitleWord {
  text: string;
  start: number;
  end: number;
}

type TemplateType = "headline-top" | "minimal" | "breaking";

interface EditorStepProps {
  mediaFiles: MediaFile[];
  onMediaUpdate: (files: MediaFile[]) => void;
  audioDuration: number;
  newsText: string;
  selectedTemplate: TemplateType;
  onSelectTemplate: (template: TemplateType) => void;
  subtitleWords: SubtitleWord[];
  currentTime: number;
  isPlaying: boolean;
  isGenerating: boolean;
  overlaySettings: OverlaySettings;
  onOverlaySettingsChange: (settings: OverlaySettings) => void;
  onGenerate: () => void;
  onNext: () => void;
  onBack: () => void;
}

const EditorStep = ({
  mediaFiles,
  onMediaUpdate,
  audioDuration,
  newsText,
  selectedTemplate,
  onSelectTemplate,
  subtitleWords,
  currentTime,
  isPlaying,
  isGenerating,
  overlaySettings,
  onOverlaySettingsChange,
  onGenerate,
  onNext,
  onBack,
}: EditorStepProps) => {
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
          <Film className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-lg text-foreground">
            Video Editor
          </h2>
          <p className="text-sm text-muted-foreground">
            Atur template, overlay, timeline, dan merge video
          </p>
        </div>
      </div>

      {/* Preview and Editor Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Preview */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-medium text-foreground text-sm mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live Preview
          </h3>
          <VideoPreview
            newsText={newsText}
            template={selectedTemplate}
            isGenerating={isGenerating}
            mediaFiles={mediaFiles}
            subtitleWords={subtitleWords}
            currentTime={currentTime}
            isAudioPlaying={isPlaying}
            audioDuration={audioDuration}
            overlaySettings={overlaySettings}
          />
        </div>

        {/* Timeline Editor */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-medium text-foreground text-sm mb-4">Timeline Editor</h3>
          <VideoEditor
            mediaFiles={mediaFiles}
            onMediaUpdate={onMediaUpdate}
            audioDuration={audioDuration}
          />
        </div>
      </div>

      {/* Template Selection */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <Layers className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-foreground text-sm">Template Video</h3>
            <p className="text-xs text-muted-foreground">Pilih layout untuk video Anda</p>
          </div>
        </div>
        <TemplateSelector selected={selectedTemplate} onChange={onSelectTemplate} />
      </div>

      {/* Overlay & Watermark Settings */}
      <div className="glass-card rounded-xl p-5">
        <OverlaySelector settings={overlaySettings} onChange={onOverlaySettingsChange} />
        
        {/* Template Manager */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Template Overlay</p>
              <p className="text-xs text-muted-foreground">Simpan atau muat pengaturan overlay</p>
            </div>
            <OverlayTemplateManager
              currentSettings={overlaySettings}
              onLoadTemplate={onOverlaySettingsChange}
            />
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="glass-card rounded-xl p-5">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Siap untuk generate video final?
          </p>
          <Button
            variant="news"
            size="xl"
            onClick={onGenerate}
            disabled={isGenerating}
            className="w-full max-w-md"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Memproses Video...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate & Simpan Video
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="pt-4 flex gap-3">
        <Button variant="glass" size="lg" onClick={onBack} className="flex-shrink-0">
          <ChevronLeft className="w-5 h-5" />
          Kembali
        </Button>
        <Button variant="news" size="lg" className="flex-1" onClick={onNext}>
          Lanjut ke Download
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
};

export default EditorStep;
