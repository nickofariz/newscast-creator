import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Download, History, ChevronRight, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import NewsInput from "@/components/NewsInput";
import VoiceSelector from "@/components/VoiceSelector";
import TemplateSelector from "@/components/TemplateSelector";
import VideoPreview from "@/components/VideoPreview";
import VideoHistory, { VideoItem } from "@/components/VideoHistory";
import { toast } from "sonner";

type VoiceType = "male" | "female";
type TemplateType = "headline-top" | "minimal" | "breaking";

const Index = () => {
  const [newsText, setNewsText] = useState("");
  const [selectedVoice, setSelectedVoice] = useState<VoiceType>("female");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>("headline-top");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Mock video history
  const [videos, setVideos] = useState<VideoItem[]>([
    {
      id: "1",
      title: "Breaking: Kebijakan Ekonomi Baru 2024",
      createdAt: new Date(Date.now() - 3600000),
      duration: 32,
      status: "completed",
    },
    {
      id: "2",
      title: "Update: Perkembangan Teknologi AI",
      createdAt: new Date(Date.now() - 86400000),
      duration: 28,
      status: "completed",
    },
  ]);

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
    toast.info("Memproses video...");

    // Simulate video generation
    setTimeout(() => {
      const newVideo: VideoItem = {
        id: Date.now().toString(),
        title: newsText.substring(0, 40) + (newsText.length > 40 ? "..." : ""),
        createdAt: new Date(),
        duration: Math.round((newsText.split(/\s+/).length / 150) * 60),
        status: "completed",
      };

      setVideos((prev) => [newVideo, ...prev]);
      setIsGenerating(false);
      toast.success("Video berhasil dibuat!");
    }, 3000);
  };

  const handleDownload = (id: string) => {
    toast.success("Mengunduh video...");
    // In real implementation, this would trigger the actual download
  };

  const handleDelete = (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
    toast.success("Video dihapus");
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
                <TemplateSelector selected={selectedTemplate} onChange={setSelectedTemplate} />

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
                />

                {/* Quick Actions */}
                <div className="mt-6 flex gap-3">
                  <Button
                    variant="glass"
                    className="flex-1"
                    disabled={videos.length === 0 || isGenerating}
                    onClick={() => videos[0] && handleDownload(videos[0].id)}
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
