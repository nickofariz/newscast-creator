import { useEffect, useCallback, useState, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Play, 
  Pause, 
  Layers, 
  Type as TypeIcon, 
  Image as ImageIcon, 
  Settings, 
  Expand, 
  X, 
  Captions, 
  Video, 
  Monitor, 
  Smartphone,
  Volume2
} from "lucide-react";
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
import MiniTimeline from "@/components/MiniTimeline";
import SubtitlePreview, { SubtitleStyleSettings, DEFAULT_SUBTITLE_STYLE } from "@/components/SubtitlePreview";
import ExportDialog from "@/components/ExportDialog";
import { useVideoExporter } from "@/hooks/useVideoExporter";

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
  onVideoFormatChange?: (format: VideoFormatType) => void;
  onGenerate: () => void;
  onNext: () => void;
  onBack: () => void;
  // Audio controls
  audioUrl?: string | null;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
  // Subtitle generation
  isGeneratingSubtitles?: boolean;
  onGenerateSubtitles?: () => void;
  onDownloadSRT?: () => void;
  // Video export callback
  onVideoExported?: (videoBlob: Blob, videoUrl: string) => void;
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
  onVideoFormatChange,
  onGenerate,
  onNext,
  onBack,
  audioUrl,
  onPlay,
  onPause,
  onSeek,
  isGeneratingSubtitles = false,
  onGenerateSubtitles,
  onDownloadSRT,
  onVideoExported,
}: EditorStepProps) => {
  const [editedClips, setEditedClips] = useState<EditedClip[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyleSettings>(DEFAULT_SUBTITLE_STYLE);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);

  // Video exporter hook
  const {
    exportVideo,
    cancelExport,
    downloadVideo,
    resetExport,
    preloadFFmpeg,
    exportProgress,
    exportedVideoUrl,
    isExporting,
  } = useVideoExporter();

  // Preload FFmpeg when editor opens for faster export
  useEffect(() => {
    preloadFFmpeg();
  }, [preloadFFmpeg]);

  // Handle export start
  const handleStartExport = useCallback(async (quality: "720p" | "1080p", bitrate: "low" | "medium" | "high") => {
    const videoUrl = await exportVideo({
      mediaFiles,
      editedClips,
      subtitleWords,
      audioUrl: audioUrl || null,
      audioDuration,
      subtitleStyle,
      quality,
      bitrate,
    });

    // If export successful, don't auto-save - let user choose via "Save to Cloud" button
    console.log("Export completed:", videoUrl);
  }, [exportVideo, mediaFiles, editedClips, subtitleWords, audioUrl, audioDuration, subtitleStyle]);

  // Handle save to cloud after export
  const handleSaveToCloud = useCallback(async () => {
    if (!exportedVideoUrl || !onVideoExported) return;
    
    setIsSavingToCloud(true);
    try {
      const response = await fetch(exportedVideoUrl);
      const blob = await response.blob();
      await onVideoExported(blob, exportedVideoUrl);
    } catch (error) {
      console.error("Error saving to cloud:", error);
    } finally {
      setIsSavingToCloud(false);
    }
  }, [exportedVideoUrl, onVideoExported]);

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
                      className="h-8 w-8 p-0"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </Button>
                    <span className="text-xs font-mono text-muted-foreground tabular-nums">
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
                    subtitleStyle={subtitleStyle}
                    onPlay={onPlay}
                    onPause={onPause}
                    onSeek={onSeek}
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
              
              {/* Video Format Toggle */}
              {onVideoFormatChange && (
                <div className="flex items-center gap-1 p-0.5 bg-muted rounded-lg">
                  <button
                    onClick={() => onVideoFormatChange("short")}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                      videoFormat === "short"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Portrait 9:16"
                  >
                    <Smartphone className="w-3 h-3" />
                    <span className="hidden sm:inline">9:16</span>
                  </button>
                  <button
                    onClick={() => onVideoFormatChange("tv")}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                      videoFormat === "tv"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title="Landscape 16:9"
                  >
                    <Monitor className="w-3 h-3" />
                    <span className="hidden sm:inline">16:9</span>
                  </button>
                </div>
              )}
            </div>

            {/* Audio Player - now below header */}
            {audioUrl && onPlay && onPause && (
              <div className="flex items-center justify-between mb-3 px-2 py-1.5 bg-muted/50 rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isPlaying ? onPause : onPlay}
                  className="h-7 w-7 p-0"
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                </Button>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Volume2 className="w-3 h-3" />
                  <span className="font-mono text-[10px]">{formatTime(currentTime)}/{formatTime(audioDuration)}</span>
                </div>
              </div>
            )}
            
            {!audioUrl && (
              <p className="text-xs text-muted-foreground text-center mb-3">Belum ada audio</p>
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
              subtitleStyle={subtitleStyle}
              onPlay={onPlay}
              onPause={onPause}
              onSeek={onSeek}
            />
          </div>
        </div>

        {/* Right: Editor Controls - Takes more space */}
        <div className="lg:col-span-3 xl:col-span-4 space-y-3">
          {/* Tabbed Controls */}
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-3 h-9">
              <TabsTrigger value="timeline" className="flex items-center gap-1.5 text-xs">
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Timeline</span>
              </TabsTrigger>
              <TabsTrigger value="subtitle" className="flex items-center gap-1.5 text-xs">
                <Captions className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Subtitle</span>
              </TabsTrigger>
              <TabsTrigger value="template" className="flex items-center gap-1.5 text-xs">
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Template</span>
              </TabsTrigger>
              <TabsTrigger value="overlay" className="flex items-center gap-1.5 text-xs">
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Overlay</span>
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
                    <Expand className="w-3.5 h-3.5 mr-1" />
                    Fullscreen
                  </Button>
                </div>
                <VideoEditor
                  mediaFiles={mediaFiles}
                  onMediaUpdate={onMediaUpdate}
                  audioDuration={audioDuration}
                  audioUrl={audioUrl}
                  overlayText=""
                  overlayImage={overlaySettings.logo.enabled ? overlaySettings.logo.url : null}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                  onSeek={onSeek}
                  onClipsChange={handleClipsChange}
                />
              </div>

              {/* Mini Timeline - Quick navigation */}
              {thumbnailSources.length > 0 && onSeek && (
                <MiniTimeline
                  thumbnails={thumbnailSources}
                  currentTime={currentTime}
                  duration={audioDuration}
                  onSeek={onSeek}
                  onReorder={handleThumbnailReorder}
                  className="mt-3"
                />
              )}
            </TabsContent>

            <TabsContent value="subtitle" className="mt-0">
              <div className="glass-card rounded-xl p-4">
                <SubtitlePreview
                  words={subtitleWords}
                  isGenerating={isGeneratingSubtitles}
                  currentTime={currentTime}
                  onGenerate={onGenerateSubtitles || (() => {})}
                  disabled={!audioUrl}
                  onDownloadSRT={onDownloadSRT || (() => {})}
                  styleSettings={subtitleStyle}
                  onStyleChange={setSubtitleStyle}
                />
              </div>
            </TabsContent>

            <TabsContent value="template" className="mt-0">
              <div className="glass-card rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-4">Pilih layout untuk video Anda</p>
                <TemplateSelector selected={selectedTemplate} onChange={onSelectTemplate} videoFormat={videoFormat} />
              </div>
            </TabsContent>

            <TabsContent value="overlay" className="mt-0">
              <div className="glass-card rounded-xl p-4 space-y-4">
                <OverlaySelector settings={overlaySettings} onChange={onOverlaySettingsChange} videoFormat={videoFormat} />
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

      {/* Seek Bar - Bottom of Editor */}
      {audioUrl && onSeek && (
        <div className="glass-card rounded-xl p-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={isPlaying ? onPause : onPlay}
              className="h-8 w-8 p-0 flex-shrink-0"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <div className="flex-1">
              <ScrubBar
                progress={progress}
                duration={audioDuration}
                onSeek={onSeek}
                thumbnails={thumbnailSources}
                showThumbnailPreview={thumbnailSources.length > 0}
                showMiniTimeline={false}
              />
            </div>
            <span className="text-xs font-mono text-muted-foreground flex-shrink-0">
              {formatTime(currentTime)} / {formatTime(audioDuration)}
            </span>
          </div>
        </div>
      )}

      {/* Generate & Navigation */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Button variant="ghost" size="default" onClick={onBack} className="sm:w-auto gap-2">
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Button>
        
        {/* Export Video Button - Renders full MP4 with burned subtitles */}
        <Button
          variant="default"
          size="default"
          onClick={() => setIsExportDialogOpen(true)}
          disabled={isGenerating || isExporting || mediaFiles.length === 0}
          className="flex-1 gap-2"
        >
          <Video className="w-4 h-4" />
          Export MP4
        </Button>

        {/* Quick save - saves audio and metadata only */}
        <Button
          variant="outline"
          size="default"
          onClick={onGenerate}
          disabled={isGenerating}
          className="sm:w-auto gap-2"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Draft
            </>
          )}
        </Button>
        
        <Button variant="ghost" size="default" onClick={onNext} className="sm:w-auto gap-2">
          Lanjut
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Export Dialog */}
      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        exportProgress={exportProgress}
        exportedVideoUrl={exportedVideoUrl}
        isExporting={isExporting}
        onStartExport={handleStartExport}
        onCancel={cancelExport}
        onDownload={downloadVideo}
        onReset={resetExport}
        onSaveToCloud={onVideoExported ? handleSaveToCloud : undefined}
        isSavingToCloud={isSavingToCloud}
        hasSubtitles={subtitleWords.length > 0}
        hasAudio={!!audioUrl}
        hasMedia={mediaFiles.length > 0}
      />
    </motion.div>
    </>
  );
};

export default EditorStep;
