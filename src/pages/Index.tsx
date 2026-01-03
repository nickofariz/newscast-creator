import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Download, History, ChevronRight, Video, Cloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import NewsInput from "@/components/NewsInput";
import VoiceSelector from "@/components/VoiceSelector";
import TemplateSelector from "@/components/TemplateSelector";
import VideoPreview from "@/components/VideoPreview";
import VideoHistory, { VideoItem } from "@/components/VideoHistory";
import FootageUploader from "@/components/FootageUploader";
import AudioPreview from "@/components/AudioPreview";
import SubtitlePreview from "@/components/SubtitlePreview";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useSubtitleGenerator } from "@/hooks/useSubtitleGenerator";
import { useVideoStorage } from "@/hooks/useVideoStorage";
import { toast } from "sonner";

type VoiceType = "male" | "female";
type TemplateType = "headline-top" | "minimal" | "breaking";

const Index = () => {
  const [newsText, setNewsText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState<VoiceType>("female");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("headline-top");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [uploadedFootage, setUploadedFootage] = useState<File | null>(null);
  
  const {
    generateSpeech,
    isGenerating: isGeneratingAudio,
    audioUrl,
    playAudio,
    pauseAudio,
    isPlaying,
    duration,
    currentTime,
  } = useTextToSpeech();

  const {
    generateSubtitles,
    isGenerating: isGeneratingSubtitles,
    words: subtitleWords,
    downloadSRT,
  } = useSubtitleGenerator();

  const handleGenerateAudio = () => {
    generateSpeech(newsText, selectedVoice);
  };

  const handleGenerateSubtitles = () => {
    if (audioUrl) {
      generateSubtitles(audioUrl);
    }
  };

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


  const handleGenerate = async () => {
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

    // Save to cloud storage
    await saveVideo({
      title: newsText.substring(0, 40) + (newsText.length > 40 ? "..." : ""),
      audioUrl: audioUrl || undefined,
      subtitleWords: subtitleWords,
      duration: Math.round(duration) || Math.round((newsText.split(/\s+/).length / 150) * 60),
      template: selectedTemplate,
      voice: selectedVoice,
    });

    setIsGenerating(false);
  };

  const handleDownload = (id: string, url?: string) => {
    if (url) {
      window.open(url, "_blank");
    } else {
      toast.info("Video sedang diproses");
    }
  };

  const handleDelete = async (id: string) => {
    await deleteStoredVideo(id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-4">
              <Video className="w-4 h-4" />
              <span>Buat video berita dalam hitungan detik</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
              Short News <span className="text-gradient">Video Maker</span>
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Ubah teks berita menjadi video vertikal profesional dengan voice over AI.
              Siap upload ke TikTok, Reels, & Shorts.
            </p>
          </motion.div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Controls */}
            <div className="lg:col-span-2 space-y-6">
              <div className="glass-card rounded-2xl p-6 space-y-6">
                <NewsInput value={newsText} onChange={setNewsText} />
                <VoiceSelector selected={selectedVoice} onChange={setSelectedVoice} />
                <AudioPreview
                  isGenerating={isGeneratingAudio}
                  audioUrl={audioUrl}
                  isPlaying={isPlaying}
                  duration={duration}
                  currentTime={currentTime}
                  onPlay={playAudio}
                  onPause={pauseAudio}
                  onGenerate={handleGenerateAudio}
                  disabled={!newsText.trim()}
                />
                <SubtitlePreview
                  words={subtitleWords}
                  isGenerating={isGeneratingSubtitles}
                  currentTime={currentTime}
                  onGenerate={handleGenerateSubtitles}
                  disabled={!audioUrl}
                  onDownloadSRT={downloadSRT}
                />
                <TemplateSelector selected={selectedTemplate} onChange={setSelectedTemplate} />
                <FootageUploader onUpload={setUploadedFootage} uploadedFile={uploadedFootage} />

                {/* Generate Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="pt-4"
                >
                  <Button
                    variant="news"
                    size="xl"
                    className="w-full"
                    onClick={handleGenerate}
                    disabled={isGenerating || !newsText.trim()}
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Memproses Video...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Video
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </div>

              {/* History Toggle for Mobile */}
              <div className="lg:hidden">
                <Button
                  variant="glass"
                  className="w-full"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <History className="w-4 h-4 mr-2" />
                  {showHistory ? "Sembunyikan" : "Lihat"} Riwayat ({videos.length})
                </Button>

                {showHistory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 glass-card rounded-2xl p-4"
                  >
                    <VideoHistory
                      videos={videos}
                      onDownload={handleDownload}
                      onDelete={handleDelete}
                    />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Right Column - Preview & History */}
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-6 sticky top-24">
                <VideoPreview
                  newsText={newsText}
                  template={selectedTemplate}
                  isGenerating={isGenerating}
                  footageFile={uploadedFootage}
                  subtitleWords={subtitleWords}
                  currentTime={currentTime}
                  isAudioPlaying={isPlaying}
                />

                {/* Quick Actions */}
                <div className="mt-6 flex gap-3">
                  <Button
                    variant="glass"
                    className="flex-1"
                    disabled={videos.length === 0 || isGenerating}
                    onClick={() => videos[0] && handleDownload(videos[0].id, videos[0].videoUrl || videos[0].audioUrl)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              {/* History - Desktop */}
              <div className="hidden lg:block glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    Riwayat Video
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {videos.length} video
                  </span>
                </div>
                <VideoHistory
                  videos={videos}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                />
              </div>
            </div>
          </div>

          {/* Features Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {[
              { icon: "🎙️", title: "Voice AI", desc: "Bahasa Indonesia" },
              { icon: "📱", title: "Format 9:16", desc: "TikTok Ready" },
              { icon: "⚡", title: "Cepat", desc: "< 1 menit" },
              { icon: "💾", title: "Export MP4", desc: "HD Quality" },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-card/50 border border-border/50 text-center"
              >
                <span className="text-2xl">{feature.icon}</span>
                <p className="font-semibold text-foreground text-sm mt-2">{feature.title}</p>
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
