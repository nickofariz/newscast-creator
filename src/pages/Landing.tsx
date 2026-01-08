import { motion } from "framer-motion";
import { Video, Mic, Smartphone, Zap, Download, Play, Sparkles, ArrowRight, CheckCircle2, Star, Quote, Users, TrendingUp, Clock, PenLine, AudioWaveform, Rocket } from "lucide-react";
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
    { number: "01", title: "Tulis Berita", description: "Masukkan teks berita yang ingin dijadikan video", icon: PenLine },
    { number: "02", title: "Pilih Suara", description: "Pilih voice over AI sesuai kebutuhan konten Anda", icon: AudioWaveform },
    { number: "03", title: "Generate & Export", description: "Proses otomatis dan download video siap upload", icon: Rocket },
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

  const stats = [
    { icon: Users, value: "10K+", label: "Pengguna Aktif" },
    { icon: Video, value: "50K+", label: "Video Dibuat" },
    { icon: TrendingUp, value: "99%", label: "Kepuasan" },
    { icon: Clock, value: "<2min", label: "Waktu Proses" },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 md:w-96 h-64 md:h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-0 w-64 md:w-96 h-64 md:h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <Header />
      
      <main className="relative pt-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center lg:text-left"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-xs sm:text-sm text-primary mb-4 sm:mb-6"
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>AI-Powered Video Creation</span>
              </motion.div>
              
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
                Buat Video Berita{" "}
                <span className="relative inline-block">
                  <span className="gradient-news bg-clip-text text-transparent">Profesional</span>
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="absolute -bottom-1 sm:-bottom-2 left-0 right-0 h-1 sm:h-1.5 gradient-news rounded-full origin-left"
                  />
                </span>
                <br className="hidden sm:block" />
                <span className="sm:hidden"> </span>dalam Hitungan Detik
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Transformasi teks berita menjadi video vertikal berkualitas tinggi dengan voice over AI. 
                Sempurna untuk kreator konten dan media sosial.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                {user ? (
                  <Link to="/editor" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full sm:w-auto gradient-news text-primary-foreground shadow-glow group text-base">
                      <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                      Buka Editor
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth?mode=signup" className="w-full sm:w-auto">
                      <Button size="lg" className="w-full sm:w-auto gradient-news text-primary-foreground shadow-glow group text-base">
                        <Sparkles className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                        Mulai Gratis
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                    <Link to="/auth" className="w-full sm:w-auto">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto group text-base">
                        Sudah punya akun?
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border/50">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Gratis untuk dicoba</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Tanpa watermark</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>Export HD</span>
                </div>
              </div>
            </motion.div>

            {/* Hero Visual - Enhanced for tablet */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative mt-8 lg:mt-0"
            >
              <div className="relative max-w-xs sm:max-w-sm mx-auto">
                {/* Glow effect behind phone */}
                <div className="absolute inset-0 gradient-news opacity-20 blur-3xl scale-150" />
                
                {/* Phone mockup */}
                <div className="relative mx-auto w-48 sm:w-56 md:w-64 h-[380px] sm:h-[440px] md:h-[500px] bg-gradient-to-br from-muted to-muted/50 rounded-[2rem] sm:rounded-[3rem] p-1.5 sm:p-2 shadow-2xl border border-border/50">
                  <div className="w-full h-full bg-background rounded-[1.75rem] sm:rounded-[2.5rem] overflow-hidden relative">
                    {/* Screen content simulation */}
                    <div className="absolute inset-3 sm:inset-4 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center p-4 sm:p-6">
                      <motion.div 
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-12 sm:w-16 h-12 sm:h-16 rounded-xl sm:rounded-2xl gradient-news flex items-center justify-center mb-3 sm:mb-4 shadow-glow"
                      >
                        <Video className="w-6 sm:w-8 h-6 sm:h-8 text-primary-foreground" />
                      </motion.div>
                      <div className="space-y-2 w-full">
                        <div className="h-2 sm:h-3 w-3/4 bg-foreground/20 rounded-full mx-auto" />
                        <div className="h-2 sm:h-3 w-1/2 bg-foreground/10 rounded-full mx-auto" />
                        <div className="h-2 sm:h-3 w-2/3 bg-foreground/10 rounded-full mx-auto" />
                      </div>
                      {/* Play button overlay */}
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-primary/30 backdrop-blur-sm flex items-center justify-center">
                          <Play className="w-5 sm:w-6 h-5 sm:h-6 text-primary-foreground ml-1" />
                        </div>
                      </motion.div>
                    </div>
                    {/* Notch */}
                    <div className="absolute top-1.5 sm:top-2 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-4 sm:h-6 bg-muted rounded-full" />
                  </div>
                </div>
                
                {/* Floating elements - Hidden on very small screens, visible from sm */}
                <motion.div
                  animate={{ y: [-8, 8, -8] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -left-2 sm:-left-6 md:-left-8 top-16 sm:top-20 glass-card p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl shadow-lg border border-border/50 hidden sm:block"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <Mic className="w-4 sm:w-5 h-4 sm:h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Voice AI</p>
                      <p className="text-xs sm:text-sm font-semibold text-foreground">Recording...</p>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div
                  animate={{ y: [8, -8, 8] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-2 sm:-right-6 md:-right-8 bottom-24 sm:bottom-32 glass-card p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl shadow-lg border border-border/50 hidden sm:block"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Download className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Export</p>
                      <p className="text-xs sm:text-sm font-semibold text-foreground">1080p MP4</p>
                    </div>
                  </div>
                </motion.div>

                {/* Additional floating element */}
                <motion.div
                  animate={{ x: [-5, 5, -5], y: [5, -5, 5] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-4 top-8 w-8 h-8 sm:w-10 sm:h-10 rounded-full gradient-news flex items-center justify-center shadow-glow hidden sm:flex"
                >
                  <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 text-primary-foreground" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-border/50 text-center group hover:border-primary/30 transition-colors"
              >
                <stat.icon className="w-6 sm:w-8 h-6 sm:h-8 mx-auto mb-2 sm:mb-3 text-primary group-hover:scale-110 transition-transform" />
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-news bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* How It Works Section */}
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 sm:mb-16"
          >
            <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs sm:text-sm font-medium mb-3 sm:mb-4">
              Cara Kerja
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              3 Langkah Mudah
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto px-4">
              Buat video profesional tanpa keahlian editing
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
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
                  <div className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
                <div className="relative z-10 glass-card p-5 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border border-border/50 text-center hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5 group">
                  <div className="w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 rounded-xl sm:rounded-2xl gradient-news flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-glow group-hover:scale-110 transition-transform">
                    <step.icon className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 text-primary-foreground" />
                  </div>
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-news bg-clip-text text-transparent mb-2 sm:mb-3 inline-block">
                    {step.number}
                  </div>
                  <h3 className="font-display font-semibold text-lg sm:text-xl text-foreground mb-2">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 sm:mb-16"
          >
            <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-3 sm:mb-4">
              Fitur Unggulan
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Semua yang Anda Butuhkan
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto px-4">
              Tools lengkap untuk membuat video berita yang menarik dan profesional
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div className="glass-card p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-border/50 h-full hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all">
                  <div className="w-10 sm:w-12 md:w-14 h-10 sm:h-12 md:h-14 rounded-lg sm:rounded-xl md:rounded-2xl gradient-news flex items-center justify-center mb-3 sm:mb-4 md:mb-5 shadow-glow group-hover:scale-110 transition-transform">
                    <feature.icon className="w-5 sm:w-6 md:w-7 h-5 sm:h-6 md:h-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base md:text-lg text-foreground mb-1 sm:mb-2">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10 sm:mb-16"
          >
            <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-accent/10 text-accent text-xs sm:text-sm font-medium mb-3 sm:mb-4">
              Testimonial
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
              Apa Kata Mereka?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto px-4">
              Bergabung dengan ribuan kreator yang sudah merasakan kemudahan Short News
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div className="glass-card p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl border border-border/50 h-full hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all relative">
                  <Quote className="absolute top-3 sm:top-4 right-3 sm:right-4 w-6 sm:w-8 h-6 sm:h-8 text-primary/10" />
                  
                  {/* Rating */}
                  <div className="flex gap-0.5 sm:gap-1 mb-3 sm:mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-3 sm:w-4 h-3 sm:h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  
                  {/* Content */}
                  <p className="text-xs sm:text-sm md:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  
                  {/* Author */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full gradient-news flex items-center justify-center text-primary-foreground font-semibold text-sm sm:text-base">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-sm sm:text-base text-foreground">{testimonial.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
          >
            <div className="absolute inset-0 gradient-news opacity-90" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi0yLTQgMi00IDItNCAyIDIgMiA0LTIgNC0yIDQtMiAyLTIgNCAyIDQgMiA0IDIgMiAyIDRoLTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
            
            <div className="relative z-10 p-6 sm:p-8 md:p-12 lg:p-16 text-center">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-3 sm:mb-4">
                  Siap Membuat Video Berita?
                </h2>
                <p className="text-primary-foreground/80 mb-6 sm:mb-8 max-w-xl mx-auto text-sm sm:text-base md:text-lg px-4">
                  Bergabung sekarang dan mulai buat video berita profesional dalam hitungan menit.
                </p>
                {user ? (
                  <Link to="/editor">
                    <Button size="lg" variant="secondary" className="shadow-xl group text-sm sm:text-base">
                      <Play className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                      Buka Editor
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/auth?mode=signup">
                    <Button size="lg" variant="secondary" className="shadow-xl group text-sm sm:text-base">
                      <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
                      Daftar Gratis Sekarang
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                )}
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 border-t border-border/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg sm:rounded-xl gradient-news flex items-center justify-center shadow-glow">
                <Video className="w-4 sm:w-5 h-4 sm:h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display font-bold text-sm sm:text-base text-foreground">Short News</span>
                <span className="text-muted-foreground text-xs sm:text-sm ml-1">Video Maker</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-right">
              © 2026 Short News Video Maker. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Landing;