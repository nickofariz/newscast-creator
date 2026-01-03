import { useEffect, useCallback, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Sparkles, Play, Pause, Settings2, Palette, Volume2, Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VideoEditor, { EditedClip } from "@/components/VideoEditor";
import VideoPreview, { VideoFormatType } from "@/components/VideoPreview";
import { MediaFile } from "@/components/FootageUploader";
import { OverlaySettings } from "@/components/OverlaySelector";
import OverlaySelector from "@/components/OverlaySelector";
import OverlayTemplateManager from "@/components/OverlayTemplateManager";
import TemplateSelector from "@/components/TemplateSelector";
import ScrubBar from "@/components/ScrubBar";

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
  videoFormat?: VideoFormatType;
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
  videoFormat = "short",
  onGenerate,
  onNext,
  onBack,
  audioUrl,
  onPlay,
  onPause,
  onSeek,
}: EditorStepProps) => {
  const [editedClips, setEditedClips] = useState<EditedClip[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Escape key to exit fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClipsChange = useCallback((clips: EditedClip[]) => {
    setEditedClips(clips);
  }, []);

  // Convert editedClips to thumbnail sources for ScrubBar
  const thumbnailSources = useMemo(() => {
    return editedClips.map(clip => ({
      id: clip.id,
      previewUrl: clip.previewUrl,
      type: clip.type,
      startTime: clip.startTime,
      endTime: clip.endTime
    }));
  }, [editedClips]);

  // Handle reorder from mini timeline
  const handleThumbnailReorder = useCallback((reorderedIds: string[]) => {
    // Reorder mediaFiles based on the new order
    const reorderedMedia = reorderedIds
      .map(id => mediaFiles.find(m => m.id === id))
      .filter((m): m is MediaFile => m !== undefined);
    
    if (reorderedMedia.length === mediaFiles.length) {
      onMediaUpdate(reorderedMedia);
    }
  }, [mediaFiles, onMediaUpdate]);

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
    <>
      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background flex flex-col"
          >
            {/* Fullscreen Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-medium text-foreground">Timeline Editor</span>
                </div>
                {audioUrl && (
                  <div className="flex items-center gap-3 ml-4 pl-4 border-l border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={isPlaying ? onPause : onPlay}
                      className="h-8 px-3"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <span className="text-sm font-mono text-muted-foreground">
                      {formatTime(currentTime)} / {formatTime(audioDuration)}
                    </span>
                    {onSeek && (
                      <ScrubBar
                        progress={progress}
                        duration={audioDuration}
                        onSeek={onSeek}
                        className="w-40"
                        height="sm"
                        thumbnails={thumbnailSources}
                        showThumbnailPreview={thumbnailSources.length > 0}
                      />
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground hidden md:flex items-center gap-3 mr-4">
                  <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Space</kbd> Play/Pause</span>
                  <span><kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> Keluar</span>
                </div>
                <Button variant="outline" size="sm" onClick={toggleFullscreen} className="h-8">
                  <X className="w-4 h-4 mr-2" />
                  Tutup
                </Button>
              </div>
            </div>

            {/* Fullscreen Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Preview Panel - Fixed width on side */}
              <div className="w-56 flex-shrink-0 border-r border-border bg-card/30 p-3 flex flex-col">
                <span className="text-xs text-muted-foreground mb-2">Preview</span>
                <div className="flex-1 flex items-start">
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
                    videoFormat={videoFormat}
                    onPlay={onPlay}
                    onPause={onPause}
                  />
                </div>
              </div>

              {/* Timeline Panel - Takes remaining space */}
              <div className="flex-1 p-4 overflow-auto">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Normal Layout */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-4"
      >
      {/* Full Width Editor Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {/* Left: Preview Panel - Compact */}
        <div className="lg:col-span-1">
          <div className="glass-card rounded-xl p-3 lg:sticky lg:top-4">
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

            {/* Draggable Scrub bar */}
            {audioUrl && onSeek && (
              <ScrubBar
                progress={progress}
                duration={audioDuration}
                onSeek={onSeek}
                className="mb-3"
                thumbnails={thumbnailSources}
                showThumbnailPreview={thumbnailSources.length > 0}
                showMiniTimeline={thumbnailSources.length > 1}
                onReorderThumbnails={handleThumbnailReorder}
              />
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
              videoFormat={videoFormat}
              onPlay={onPlay}
              onPause={onPause}
            />
          </div>
        </div>

        {/* Right: Editor Controls - Takes more space */}
        <div className="lg:col-span-3 xl:col-span-4 space-y-3">
          {/* Tabbed Controls */}
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-3">
              <TabsTrigger value="timeline" className="flex items-center gap-1.5 text-sm">
                <Play className="w-3.5 h-3.5" />
                <span>Timeline</span>
              </TabsTrigger>
              <TabsTrigger value="template" className="flex items-center gap-1.5 text-sm">
                <Palette className="w-3.5 h-3.5" />
                <span>Template</span>
              </TabsTrigger>
              <TabsTrigger value="overlay" className="flex items-center gap-1.5 text-sm">
                <Settings2 className="w-3.5 h-3.5" />
                <span>Overlay</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-0">
              <div className="glass-card rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-muted-foreground">Timeline Editor</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="h-7 px-2 text-xs"
                  >
                    <Maximize2 className="w-3.5 h-3.5 mr-1" />
                    Fullscreen
                  </Button>
                </div>
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
    </>
  );
};

export default EditorStep;
