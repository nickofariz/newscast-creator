import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Video } from "lucide-react";
import Header from "@/components/Header";
import OnboardingStepper, { StepId } from "@/components/OnboardingStepper";
import MediaStep from "@/components/steps/MediaStep";
import VoiceOverStep from "@/components/steps/VoiceOverStep";
import EditorStep from "@/components/steps/EditorStep";
import ExportStep from "@/components/steps/ExportStep";
import { MediaFile } from "@/components/FootageUploader";
import { VideoItem } from "@/components/VideoHistory";
import { VoiceSettingsValues, DEFAULT_SETTINGS } from "@/components/VoiceSettings";
import { OverlaySettings, DEFAULT_OVERLAY_SETTINGS } from "@/components/OverlaySelector";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useSubtitleGenerator } from "@/hooks/useSubtitleGenerator";
import { useVideoStorage } from "@/hooks/useVideoStorage";
import { toast } from "sonner";

type TemplateType = "headline-top" | "minimal" | "breaking";
export type VideoFormatType = "short" | "tv";

const Index = () => {
  // Step navigation
  const [currentStep, setCurrentStep] = useState<StepId>("media");
  const [completedSteps, setCompletedSteps] = useState<StepId[]>([]);

  // Media state
  const [uploadedMedia, setUploadedMedia] = useState<MediaFile[]>([]);
  const [videoFormat, setVideoFormat] = useState<VideoFormatType>("short");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("headline-top");
  const [overlaySettings, setOverlaySettings] = useState<OverlaySettings>(DEFAULT_OVERLAY_SETTINGS);

  // Voice over state
  const [newsText, setNewsText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("HnnPtoATgzx4ubChwm24");
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettingsValues>(DEFAULT_SETTINGS);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);

  // Hooks
  const {
    generateSpeech,
    isGenerating: isGeneratingAudio,
    audioUrl,
    playAudio,
    pauseAudio,
    isPlaying,
    duration,
    currentTime,
    seekTo,
  } = useTextToSpeech();

  const {
    generateSubtitles,
    isGenerating: isGeneratingSubtitles,
    words: subtitleWords,
    downloadSRT,
  } = useSubtitleGenerator();

  const {
    videos: storedVideos,
    isLoading: isLoadingVideos,
    isSaving,
    saveVideo,
    deleteVideo: deleteStoredVideo,
  } = useVideoStorage();

  // Convert stored videos to VideoItem format
  const videos: VideoItem[] = storedVideos.map((v) => ({
    id: v.id,
    title: v.title,
    createdAt: new Date(v.created_at),
    duration: v.duration,
    status: v.status as "completed" | "processing" | "failed",
    videoUrl: v.video_url,
    audioUrl: v.audio_url || undefined,
  }));

  // Step navigation handlers
  const markStepComplete = useCallback((step: StepId) => {
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
  }, []);

  const goToStep = useCallback((step: StepId) => {
    setCurrentStep(step);
  }, []);

  const handleMediaNext = useCallback(() => {
    markStepComplete("media");
    setCurrentStep("voiceover");
  }, [markStepComplete]);

  const handleVoiceOverNext = useCallback(() => {
    markStepComplete("voiceover");
    setCurrentStep("editor");
  }, [markStepComplete]);

  const handleEditorNext = useCallback(() => {
    markStepComplete("editor");
    setCurrentStep("export");
  }, [markStepComplete]);

  // Audio generation
  const handleGenerateAudio = useCallback(() => {
    generateSpeech(newsText, selectedVoice, voiceSettings);
  }, [generateSpeech, newsText, selectedVoice, voiceSettings]);

  // Subtitle generation
  const handleGenerateSubtitles = useCallback(() => {
    if (audioUrl) {
      generateSubtitles(audioUrl);
    }
  }, [audioUrl, generateSubtitles]);

  // Video generation
  const handleGenerate = useCallback(async () => {
    if (!newsText.trim()) {
      toast.error("Masukkan teks berita terlebih dahulu");
      return;
    }

    if (newsText.length > 1500) {
      toast.error("Teks terlalu panjang, maksimal 1500 karakter");
      return;
    }

    setIsGenerating(true);
    toast.info("Menyimpan ke cloud...");

    await saveVideo({
      title: newsText.substring(0, 40) + (newsText.length > 40 ? "..." : ""),
      audioUrl: audioUrl || undefined,
      subtitleWords: subtitleWords,
      duration: Math.round(duration) || Math.round((newsText.split(/\s+/).length / 150) * 60),
      template: selectedTemplate,
      voice: selectedVoice,
    });

    setIsGenerating(false);
    markStepComplete("editor");
    setCurrentStep("export");
  }, [newsText, audioUrl, subtitleWords, duration, selectedTemplate, selectedVoice, saveVideo, markStepComplete]);

  // Download handler
  const handleDownload = useCallback((id: string, url?: string) => {
    if (url) {
      window.open(url, "_blank");
    } else {
      toast.info("Video sedang diproses");
    }
  }, []);

  // Delete handler
  const handleDelete = useCallback(async (id: string) => {
    await deleteStoredVideo(id);
  }, [deleteStoredVideo]);

  // Start new video
  const handleStartNew = useCallback(() => {
    setCurrentStep("media");
    setCompletedSteps([]);
    setUploadedMedia([]);
    setNewsText("");
  }, []);

  // Check if we're in editor mode (needs full width)
  const isEditorMode = currentStep === "editor";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className={`pt-20 pb-12 ${isEditorMode ? 'px-2 md:px-4' : 'px-4'}`}>
        <div className={`mx-auto ${isEditorMode ? 'max-w-[1920px] w-full' : 'container max-w-4xl'}`}>
          {/* Hero Section - hide in editor mode */}
          {!isEditorMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-4">
                <Video className="w-4 h-4" />
                <span>Buat video berita dalam hitungan detik</span>
              </div>
              <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                Short News <span className="text-gradient">Video Maker</span>
              </h1>
              <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                Ubah teks berita menjadi video vertikal profesional dengan voice over AI.
              </p>
            </motion.div>
          )}

          {/* Stepper */}
          <OnboardingStepper
            currentStep={currentStep}
            onStepClick={goToStep}
            completedSteps={completedSteps}
          />

          {/* Step Content */}
          <div className={`glass-card rounded-2xl ${isEditorMode ? 'p-2 md:p-4' : 'p-6 md:p-8'}`}>
            <AnimatePresence mode="wait">
              {currentStep === "media" && (
                <MediaStep
                  key="media"
                  uploadedMedia={uploadedMedia}
                  onUploadMedia={setUploadedMedia}
                  videoFormat={videoFormat}
                  onVideoFormatChange={setVideoFormat}
                  onNext={handleMediaNext}
                />
              )}

              {currentStep === "voiceover" && (
                <VoiceOverStep
                  key="voiceover"
                  newsText={newsText}
                  onNewsTextChange={setNewsText}
                  selectedVoice={selectedVoice}
                  onVoiceChange={setSelectedVoice}
                  voiceSettings={voiceSettings}
                  onVoiceSettingsChange={setVoiceSettings}
                  isGeneratingAudio={isGeneratingAudio}
                  audioUrl={audioUrl}
                  isPlaying={isPlaying}
                  duration={duration}
                  currentTime={currentTime}
                  onPlay={playAudio}
                  onPause={pauseAudio}
                  onGenerateAudio={handleGenerateAudio}
                  onNext={handleVoiceOverNext}
                  onBack={() => setCurrentStep("media")}
                />
              )}

              {currentStep === "editor" && (
                <EditorStep
                  key="editor"
                  mediaFiles={uploadedMedia}
                  onMediaUpdate={setUploadedMedia}
                  audioDuration={duration}
                  newsText={newsText}
                  selectedTemplate={selectedTemplate}
                  onSelectTemplate={setSelectedTemplate}
                  subtitleWords={subtitleWords}
                  currentTime={currentTime}
                  isPlaying={isPlaying}
                  isGenerating={isGenerating}
                  overlaySettings={overlaySettings}
                  onOverlaySettingsChange={setOverlaySettings}
                  videoFormat={videoFormat}
                  onGenerate={handleGenerate}
                  onNext={handleEditorNext}
                  onBack={() => setCurrentStep("voiceover")}
                  audioUrl={audioUrl}
                  onPlay={playAudio}
                  onPause={pauseAudio}
                  onSeek={seekTo}
                  isGeneratingSubtitles={isGeneratingSubtitles}
                  onGenerateSubtitles={handleGenerateSubtitles}
                  onDownloadSRT={downloadSRT}
                />
              )}

              {currentStep === "export" && (
                <ExportStep
                  key="export"
                  videos={videos}
                  isLoadingVideos={isLoadingVideos}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  onBack={() => setCurrentStep("editor")}
                  onStartNew={handleStartNew}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Features Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {[
              { icon: "🎙️", title: "Voice AI", desc: "Bahasa Indonesia" },
              { icon: "📱", title: "Format 9:16", desc: "TikTok Ready" },
              { icon: "⚡", title: "Cepat", desc: "< 1 menit" },
              { icon: "💾", title: "Export MP4", desc: "HD Quality" },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-card/50 border border-border/50 text-center"
              >
                <span className="text-xl">{feature.icon}</span>
                <p className="font-semibold text-foreground text-xs mt-1">{feature.title}</p>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Index;
