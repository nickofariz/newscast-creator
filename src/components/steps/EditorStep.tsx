import { useEffect, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ChevronLeft, Sparkles, Play, Pause, Settings2, Palette, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VideoEditor, { EditedClip } from "@/components/VideoEditor";
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
  // Audio controls
  audioUrl?: string | null;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
}

const SEEK_STEP = 5; // seconds

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
  audioUrl,
  onPlay,
  onPause,
  onSeek,
}: EditorStepProps) => {
  const [editedClips, setEditedClips] = useState<EditedClip[]>([]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClipsChange = useCallback((clips: EditedClip[]) => {
    setEditedClips(clips);
  }, []);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if user is typing in an input/textarea
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (e.code) {
      case "Space":
        e.preventDefault();
        if (audioUrl) {
          isPlaying ? onPause?.() : onPlay?.();
        }
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (onSeek && audioDuration > 0) {
          const newTime = Math.max(0, currentTime - SEEK_STEP);
          onSeek(newTime);
        }
        break;
      case "ArrowRight":
        e.preventDefault();
        if (onSeek && audioDuration > 0) {
          const newTime = Math.min(audioDuration, currentTime + SEEK_STEP);
          onSeek(newTime);
        }
        break;
    }
  }, [audioUrl, isPlaying, onPlay, onPause, onSeek, currentTime, audioDuration]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      {/* Full Width Editor Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left: Preview Panel */}
        <div className="xl:col-span-1">
          <div className="glass-card rounded-xl p-4 sticky top-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-foreground">Preview</span>
              </div>
              
              {/* Audio Player */}
              {audioUrl && onPlay && onPause && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isPlaying ? onPause : onPlay}
                    className="h-8 px-3"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Volume2 className="w-3 h-3" />
                    <span className="font-mono text-[10px]">{formatTime(currentTime)}/{formatTime(audioDuration)}</span>
                  </div>
                </div>
              )}
              
              {!audioUrl && (
                <span className="text-xs text-muted-foreground">Belum ada audio</span>
              )}
            </div>

            {/* Progress bar */}
            {audioUrl && (
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                <div 
                  className="h-full bg-primary transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            <VideoPreview
              newsText={newsText}
              template={selectedTemplate}
              isGenerating={isGenerating}
              mediaFiles={mediaFiles}
              editedClips={editedClips}
              subtitleWords={subtitleWords}
              currentTime={currentTime}
              isAudioPlaying={isPlaying}
              audioDuration={audioDuration}
              overlaySettings={overlaySettings}
              onPlay={onPlay}
              onPause={onPause}
            />
          </div>
        </div>

        {/* Right: Editor Controls */}
        <div className="xl:col-span-2 space-y-4">
          {/* Tabbed Controls */}
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                <span>Timeline</span>
              </TabsTrigger>
              <TabsTrigger value="template" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <span>Template</span>
              </TabsTrigger>
              <TabsTrigger value="overlay" className="flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                <span>Overlay</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-0">
              <div className="glass-card rounded-xl p-4">
                <VideoEditor
                  mediaFiles={mediaFiles}
                  onMediaUpdate={onMediaUpdate}
                  audioDuration={audioDuration}
                  audioUrl={audioUrl}
                  overlayText={newsText}
                  overlayImage={overlaySettings.logo.enabled ? overlaySettings.logo.url : null}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                  onSeek={onSeek}
                  onClipsChange={handleClipsChange}
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
        </div>
      </div>

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
