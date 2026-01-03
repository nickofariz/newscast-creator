import { motion } from "framer-motion";
import { ChevronRight, ChevronLeft, Sparkles, Play, Settings2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      className="space-y-4"
    >
      {/* Live Preview - Always Visible */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-foreground">Preview</span>
        </div>
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

      {/* Tabbed Controls */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="template" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Template</span>
          </TabsTrigger>
          <TabsTrigger value="overlay" className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">Overlay</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-0">
          <div className="glass-card rounded-xl p-4">
            <VideoEditor
              mediaFiles={mediaFiles}
              onMediaUpdate={onMediaUpdate}
              audioDuration={audioDuration}
            />
          </div>
        </TabsContent>

        <TabsContent value="template" className="mt-0">
          <div className="glass-card rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-4">Pilih layout untuk video Anda</p>
            <TemplateSelector selected={selectedTemplate} onChange={onSelectTemplate} />
          </div>
        </TabsContent>

        <TabsContent value="overlay" className="mt-0">
          <div className="glass-card rounded-xl p-4 space-y-4">
            <OverlaySelector settings={overlaySettings} onChange={onOverlaySettingsChange} />
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Template Overlay</p>
                  <p className="text-xs text-muted-foreground">Simpan atau muat pengaturan</p>
                </div>
                <OverlayTemplateManager
                  currentSettings={overlaySettings}
                  onLoadTemplate={onOverlaySettingsChange}
                />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Generate & Navigation */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button variant="glass" size="lg" onClick={onBack} className="sm:w-auto">
          <ChevronLeft className="w-5 h-5" />
          Kembali
        </Button>
        <Button
          variant="news"
          size="lg"
          onClick={onGenerate}
          disabled={isGenerating}
          className="flex-1"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Video
            </>
          )}
        </Button>
        <Button variant="glass" size="lg" onClick={onNext} className="sm:w-auto">
          Lanjut
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
};

export default EditorStep;
