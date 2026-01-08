import { motion } from "framer-motion";
import { Video, Mic, Smartphone, Zap, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";

const Landing = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Mic,
      title: "Voice Over AI",
      description: "Ubah teks menjadi suara natural dengan berbagai pilihan suara",
    },
    {
      icon: Smartphone,
      title: "Format 9:16",
      description: "Optimized untuk TikTok, Instagram Reels, dan YouTube Shorts",
    },
    {
      icon: Zap,
      title: "Proses Cepat",
      description: "Buat video berita dalam hitungan menit",
    },
    {
      icon: Download,
      title: "Export MP4",
      description: "Download video berkualitas tinggi siap upload",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 text-sm text-muted-foreground mb-6">
              <Zap className="w-4 h-4 text-accent" />
              <span>MVP Version - Short News Video Maker</span>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Buat Video Berita Profesional dalam{" "}
              <span className="gradient-news bg-clip-text text-transparent">
                Hitungan Detik
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Ubah teks berita menjadi video vertikal dengan voice over AI. 
              Sempurna untuk konten sosial media Anda.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link to="/editor">
                  <Button size="lg" className="gradient-news text-primary-foreground shadow-glow">
                    <Video className="w-5 h-5 mr-2" />
                    Buka Editor
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth?mode=signup">
                    <Button size="lg" className="gradient-news text-primary-foreground shadow-glow">
                      <Video className="w-5 h-5 mr-2" />
                      Mulai Sekarang
                    </Button>
                  </Link>
                  <Link to="/auth">
                    <Button size="lg" variant="outline">
                      Sudah punya akun? Masuk
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
              Fitur Unggulan
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Semua yang Anda butuhkan untuk membuat video berita yang menarik
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className="glass-card p-6 rounded-xl border border-border/50 text-center"
              >
                <div className="w-12 h-12 rounded-xl gradient-news flex items-center justify-center mx-auto mb-4 shadow-glow">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="glass-card rounded-2xl p-8 md:p-12 text-center border border-border/50"
          >
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
              Siap Membuat Video Berita?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Mulai buat video berita profesional sekarang. Gratis dan mudah digunakan.
            </p>
            {user ? (
              <Link to="/editor">
                <Button size="lg" className="gradient-news text-primary-foreground shadow-glow">
                  Buka Editor
                </Button>
              </Link>
            ) : (
              <Link to="/auth?mode=signup">
                <Button size="lg" className="gradient-news text-primary-foreground shadow-glow">
                  Daftar Gratis
                </Button>
              </Link>
            )}
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-news flex items-center justify-center">
                <Video className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-semibold text-foreground">Short News</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 Short News Video Maker. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Landing;
