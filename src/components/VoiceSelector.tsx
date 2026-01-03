import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Play, Square, ChevronDown, User, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface Voice {
  id: string;
  name: string;
  description: string;
  gender: "male" | "female";
  category: "berita" | "narasi" | "casual";
}

// Indonesian Voice Library dari ElevenLabs
const VOICE_LIBRARY: Voice[] = [
  // Berita & News
  { id: "HnnPtoATgzx4ubChwm24", name: "Zaak", description: "Suara wanita muda, cocok untuk berita & iklan", gender: "female", category: "berita" },
  { id: "3mAVBNEqop5UbHtD8oxQ", name: "Zephlyn", description: "Suara pria muda untuk berita & narasi", gender: "male", category: "berita" },
  { id: "F414PgPuQGviai32J141", name: "Hendro Atmoko", description: "Suara pria muda untuk berita & film", gender: "male", category: "berita" },
  { id: "7ExgohZ4jKVjuJLwSEWl", name: "Nova", description: "Suara wanita hangat & berwibawa", gender: "female", category: "berita" },
  { id: "xDHG0ZvXAzrqzDSjDtKa", name: "Deandra Putri", description: "Suara wanita berkarakter untuk berita", gender: "female", category: "berita" },
  
  // Narasi & Storytelling
  { id: "4RK3Moe6TpBQ4otXBFtc", name: "Suara Narasi", description: "Suara pria nyaman untuk narasi", gender: "male", category: "narasi" },
  { id: "lFjzhZHq0NwTRiu2GQxy", name: "Tri Nugraha", description: "Suara pria dewasa untuk storytelling", gender: "male", category: "narasi" },
  { id: "I7sakys8pBZ1Z5f0UhT9", name: "Putri Maharani", description: "Suara wanita ekspresif & hangat", gender: "female", category: "narasi" },
  { id: "JaUVfDrFcfwGIsv8X2kN", name: "Defasyalala", description: "Suara wanita hangat untuk storytelling", gender: "female", category: "narasi" },
  { id: "kPgkc35gNKgkdAQnjIow", name: "Bagas", description: "Suara pria dewasa profesional", gender: "male", category: "narasi" },
  { id: "IALUBpQ56gzxhNH8HDDK", name: "Mizani", description: "Suara pria hangat untuk audiobook", gender: "male", category: "narasi" },
  
  // Casual & Social Media
  { id: "iWydkXKoiVtvdn4vLKp9", name: "Cahaya", description: "Suara wanita trendy untuk sosmed", gender: "female", category: "casual" },
  { id: "QC3gSHMyKh8m20lGyUNZ", name: "Jonathan", description: "Suara pria muda santai & profesional", gender: "male", category: "casual" },
  { id: "n2qPGxujWlmlL7krJ7OC", name: "Belly Rachdianto", description: "Suara pria muda untuk edukasi", gender: "male", category: "casual" },
  { id: "wWRuqXP4yAwzRerUveS8", name: "Mila Rahmadhania", description: "Suara wanita ceria & friendly", gender: "female", category: "casual" },
  { id: "plgKUYgnlZ1DCNh54DwJ", name: "Dakocan", description: "Suara pria muda casual untuk podcast", gender: "male", category: "casual" },
];

const CATEGORIES = [
  { id: "berita", label: "Berita" },
  { id: "narasi", label: "Narasi" },
  { id: "casual", label: "Casual" },
];

const SAMPLE_TEXT = "Halo, ini adalah contoh suara saya. Bagaimana menurut Anda?";

interface VoiceSelectorProps {
  selected: string;
  onChange: (voiceId: string) => void;
}

const VoiceSelector = ({ selected, onChange }: VoiceSelectorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("berita");
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [loadingVoice, setLoadingVoice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCache = useRef<Map<string, string>>(new Map());

  const selectedVoice = VOICE_LIBRARY.find(v => v.id === selected) || VOICE_LIBRARY[0];
  const filteredVoices = VOICE_LIBRARY.filter(v => v.category === activeCategory);

  const stopCurrentAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlayingVoice(null);
  }, []);

  const handlePlayPreview = useCallback(async (voice: Voice, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // If already playing this voice, stop it
    if (playingVoice === voice.id) {
      stopCurrentAudio();
      return;
    }

    // Stop any currently playing audio
    stopCurrentAudio();

    // Check cache first
    const cachedUrl = audioCache.current.get(voice.id);
    if (cachedUrl) {
      const audio = new Audio(cachedUrl);
      audioRef.current = audio;
      setPlayingVoice(voice.id);
      
      audio.onended = () => {
        setPlayingVoice(null);
      };
      
      audio.play().catch(() => {
        setPlayingVoice(null);
        toast.error("Gagal memutar audio");
      });
      return;
    }

    // Generate new preview
    setLoadingVoice(voice.id);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            text: SAMPLE_TEXT, 
            voiceId: voice.id 
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate preview");
      }

      const data = await response.json();
      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      
      // Cache the audio URL
      audioCache.current.set(voice.id, audioUrl);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setPlayingVoice(voice.id);
      setLoadingVoice(null);

      audio.onended = () => {
        setPlayingVoice(null);
      };

      audio.play().catch(() => {
        setPlayingVoice(null);
        toast.error("Gagal memutar audio");
      });
    } catch (error) {
      console.error("Preview error:", error);
      setLoadingVoice(null);
      toast.error("Gagal generate preview suara");
    }
  }, [playingVoice, stopCurrentAudio]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-3"
    >
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Mic className="w-4 h-4 text-primary" />
        Voice Over Indonesia
      </label>

      {/* Selected Voice Preview */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full p-3 rounded-xl border-2 transition-all duration-300 flex items-center justify-between",
          isExpanded
            ? "border-primary bg-primary/10"
            : "border-border bg-card hover:border-primary/50"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            selectedVoice.gender === "female" ? "bg-pink-500/20" : "bg-blue-500/20"
          )}>
            <User className={cn(
              "w-5 h-5",
              selectedVoice.gender === "female" ? "text-pink-400" : "text-blue-400"
            )} />
          </div>
          <div className="text-left">
            <p className="font-semibold text-foreground text-sm">{selectedVoice.name}</p>
            <p className="text-xs text-muted-foreground">{selectedVoice.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-[10px] px-2 py-0.5 rounded-full",
            selectedVoice.gender === "female" ? "bg-pink-500/20 text-pink-400" : "bg-blue-500/20 text-blue-400"
          )}>
            {selectedVoice.gender === "female" ? "Perempuan" : "Laki-laki"}
          </span>
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            isExpanded && "rotate-180"
          )} />
        </div>
      </motion.button>

      {/* Voice Library */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              {/* Category Tabs */}
              <div className="flex gap-1 p-1 rounded-lg bg-secondary/50">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                      activeCategory === cat.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Voice List */}
              <ScrollArea className="h-[260px]">
                <div className="space-y-2 pr-2">
                  {filteredVoices.map((voice) => {
                    const isSelected = selected === voice.id;
                    const isPlaying = playingVoice === voice.id;
                    const isLoading = loadingVoice === voice.id;

                    return (
                      <motion.div
                        key={voice.id}
                        onClick={() => onChange(voice.id)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className={cn(
                          "relative p-3 rounded-lg cursor-pointer transition-all flex items-center gap-3",
                          isSelected
                            ? "bg-primary/15 border border-primary"
                            : "bg-secondary/30 border border-transparent hover:bg-secondary/60"
                        )}
                      >
                        {/* Avatar */}
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                          voice.gender === "female" ? "bg-pink-500/20" : "bg-blue-500/20"
                        )}>
                          <User className={cn(
                            "w-5 h-5",
                            voice.gender === "female" ? "text-pink-400" : "text-blue-400"
                          )} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-foreground">{voice.name}</p>
                            <span className={cn(
                              "text-[9px] px-1.5 py-0.5 rounded",
                              voice.gender === "female" ? "bg-pink-500/20 text-pink-400" : "bg-blue-500/20 text-blue-400"
                            )}>
                              {voice.gender === "female" ? "♀" : "♂"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {voice.description}
                          </p>
                        </div>

                        {/* Play Preview */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8 flex-shrink-0",
                            isPlaying && "bg-primary/20"
                          )}
                          onClick={(e) => handlePlayPreview(voice, e)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : isPlaying ? (
                            <Square className="w-3 h-3 text-primary fill-primary" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>

                        {/* Selected Indicator */}
                        {isSelected && (
                          <motion.div
                            layoutId="selectedVoice"
                            className="absolute inset-0 rounded-lg border-2 border-primary pointer-events-none"
                            initial={false}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Info */}
              <p className="text-[10px] text-muted-foreground text-center">
                Powered by ElevenLabs • 16 suara Indonesia tersedia
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VoiceSelector;
export { VOICE_LIBRARY };
