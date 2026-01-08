import { motion } from "framer-motion";
import { Video, Mic, Smartphone, Zap, Download, Play, Sparkles, ArrowRight, CheckCircle2, Star, Quote } from "lucide-react";
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
      description: "Ubah teks menjadi suara natural dengan berbagai pilihan suara profesional",
    },
    {
      icon: Smartphone,
      title: "Format 9:16",
      description: "Optimized untuk TikTok, Instagram Reels, dan YouTube Shorts",
    },
    {
      icon: Zap,
      title: "Proses Cepat",
      description: "Buat video berita dalam hitungan menit tanpa skill editing",
    },
    {
      icon: Download,
      title: "Export MP4",
      description: "Download video berkualitas tinggi siap upload ke sosial media",
    },
  ];

  const steps = [
    { number: "01", title: "Tulis Berita", description: "Masukkan teks berita yang ingin dijadikan video" },
    { number: "02", title: "Pilih Suara", description: "Pilih voice over AI sesuai kebutuhan konten Anda" },
    { number: "03", title: "Generate & Export", description: "Proses otomatis dan download video siap upload" },
  ];

  const testimonials = [
    {
      name: "Andi Pratama",
      role: "Content Creator",
      avatar: "AP",
      rating: 5,
      content: "Short News benar-benar mengubah cara saya membuat konten. Dulu butuh berjam-jam, sekarang cuma hitungan menit!",
    },
    {
      name: "Siti Rahma",
      role: "Social Media Manager",
      avatar: "SR",
      rating: 5,
      content: "Voice AI-nya sangat natural. Klien saya tidak percaya kalau ini dibuat dengan AI. Highly recommended!",
    },
    {
      name: "Budi Santoso",
      role: "News Portal Owner",
      avatar: "BS",
      rating: 5,
      content: "Produktivitas tim saya meningkat 5x lipat sejak pakai Short News. Tools wajib untuk media digital!",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      </div>

      <Header />
      
      <main className="relative pt-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 md:py-32 lg:py-40">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-6">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Video Creation</span>
              </div>
              
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Buat Video Berita{" "}
                <span className="relative">
                  <span className="gradient-news bg-clip-text text-transparent">Profesional</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                    <path d="M2 10C50 2 150 2 198 10" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" className="opacity-50"/>
                  </svg>
                </span>
                <br />dalam Hitungan Detik
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                Transformasi teks berita menjadi video vertikal berkualitas tinggi dengan voice over AI. 
                Sempurna untuk kreator konten dan media sosial.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {user ? (
                  <Link to="/editor">
                    <Button size="lg" className="gradient-news text-primary-foreground shadow-glow group">
                      <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                      Buka Editor
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth?mode=signup">
                      <Button size="lg" className="gradient-news text-primary-foreground shadow-glow group">
                        <Sparkles className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                        Mulai Gratis
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                    <Link to="/auth">
                      <Button size="lg" variant="outline" className="group">
                        Sudah punya akun?
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-6 mt-8 pt-8 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Gratis untuk dicoba</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Tanpa watermark</span>
                </div>
              </div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Phone mockup */}
                <div className="relative mx-auto w-64 h-[500px] bg-gradient-to-br from-muted to-muted/50 rounded-[3rem] p-2 shadow-2xl border border-border/50">
                  <div className="w-full h-full bg-background rounded-[2.5rem] overflow-hidden relative">
                    {/* Screen content simulation */}
                    <div className="absolute inset-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center">
                      <div className="text-center p-6">
                        <div className="w-16 h-16 rounded-2xl gradient-news flex items-center justify-center mx-auto mb-4 shadow-glow">
                          <Video className="w-8 h-8 text-primary-foreground" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 w-32 bg-foreground/20 rounded-full mx-auto" />
                          <div className="h-3 w-24 bg-foreground/10 rounded-full mx-auto" />
                          <div className="h-3 w-28 bg-foreground/10 rounded-full mx-auto" />
                        </div>
                      </div>
                    </div>
                    {/* Notch */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-muted rounded-full" />
                  </div>
                </div>
                
                {/* Floating elements */}
                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -left-8 top-20 glass-card p-4 rounded-xl shadow-lg border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Mic className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Voice AI</p>
                      <p className="text-sm font-semibold text-foreground">Recording...</p>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div
                  animate={{ y: [10, -10, 10] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-8 bottom-32 glass-card p-4 rounded-xl shadow-lg border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Download className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Export</p>
                      <p className="text-sm font-semibold text-foreground">1080p MP4</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-4">
              Cara Kerja
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              3 Langkah Mudah
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Buat video profesional tanpa keahlian editing
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="relative"
              >
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
                <div className="relative z-10 glass-card p-8 rounded-2xl border border-border/50 text-center hover:border-primary/30 transition-colors group">
                  <div className="text-5xl font-bold gradient-news bg-clip-text text-transparent mb-4 group-hover:scale-110 transition-transform">
                    {step.number}
                  </div>
                  <h3 className="font-display font-semibold text-xl text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Fitur Unggulan
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Semua yang Anda Butuhkan
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Tools lengkap untuk membuat video berita yang menarik dan profesional
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div className="glass-card p-6 rounded-2xl border border-border/50 h-full hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all">
                  <div className="w-14 h-14 rounded-2xl gradient-news flex items-center justify-center mb-5 shadow-glow group-hover:scale-110 transition-transform">
                    <feature.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              Testimonial
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Apa Kata Mereka?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Bergabung dengan ribuan kreator yang sudah merasakan kemudahan Short News
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div className="glass-card p-6 rounded-2xl border border-border/50 h-full hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all relative">
                  <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/10" />
                  
                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  
                  {/* Content */}
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full gradient-news flex items-center justify-center text-primary-foreground font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl"
          >
            <div className="absolute inset-0 gradient-news opacity-90" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi0yLTQgMi00IDItNCAyIDIgMiA0LTIgNC0yIDQtMiAyLTIgNCAyIDQgMiA0IDIgMiAyIDRoLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
            
            <div className="relative z-10 p-8 md:p-16 text-center">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
                Siap Membuat Video Berita?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto text-lg">
                Bergabung sekarang dan mulai buat video berita profesional dalam hitungan menit.
              </p>
              {user ? (
                <Link to="/editor">
                  <Button size="lg" variant="secondary" className="shadow-xl group">
                    <Play className="w-5 h-5 mr-2" />
                    Buka Editor
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <Link to="/auth?mode=signup">
                  <Button size="lg" variant="secondary" className="shadow-xl group">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Daftar Gratis Sekarang
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 py-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-news flex items-center justify-center shadow-glow">
                <Video className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display font-bold text-foreground">Short News</span>
                <span className="text-muted-foreground text-sm ml-1">Video Maker</span>
              </div>
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