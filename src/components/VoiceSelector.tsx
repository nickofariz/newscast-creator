import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Play, Pause, ChevronDown, Globe, User, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface Voice {
  id: string;
  name: string;
  description: string;
  gender: "male" | "female";
  accent: string;
  category: "popular" | "character" | "professional";
  previewUrl?: string;
}

// ElevenLabs Top Voices
const VOICE_LIBRARY: Voice[] = [
  // Popular Voices
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", description: "Suara wanita natural & warm", gender: "female", accent: "American", category: "popular" },
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George", description: "Suara pria dewasa & tegas", gender: "male", accent: "British", category: "popular" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", description: "Suara pria muda & energik", gender: "male", accent: "British", category: "popular" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", description: "Suara wanita friendly", gender: "female", accent: "American", category: "popular" },
  
  // Professional Voices
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", description: "Suara news anchor profesional", gender: "male", accent: "American", category: "professional" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", description: "Suara narator wanita", gender: "female", accent: "American", category: "professional" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", description: "Suara pria casual & friendly", gender: "male", accent: "Australian", category: "professional" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian", description: "Suara narator pria deep", gender: "male", accent: "American", category: "professional" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", description: "Suara wanita muda & ceria", gender: "female", accent: "British", category: "professional" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", description: "Suara wanita ekspresif", gender: "female", accent: "American", category: "professional" },
  
  // Character Voices
  { id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum", description: "Suara hoarse & karakteristik", gender: "male", accent: "Transatlantic", category: "character" },
  { id: "SAz9YHcvj6GT2YYXdXww", name: "River", description: "Suara non-binary & unik", gender: "male", accent: "American", category: "character" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", description: "Suara pria muda artikulatif", gender: "male", accent: "American", category: "character" },
  { id: "cjVigY5qzO86Huf0OWal", name: "Eric", description: "Suara pria friendly & casual", gender: "male", accent: "American", category: "character" },
  { id: "bIHbv24MWmeRgasZH58o", name: "Will", description: "Suara pria friendly POC", gender: "male", accent: "American", category: "character" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", description: "Suara wanita British confident", gender: "female", accent: "British", category: "character" },
];

const CATEGORIES = [
  { id: "popular", label: "Populer" },
  { id: "professional", label: "Profesional" },
  { id: "character", label: "Karakter" },
];

interface VoiceSelectorProps {
  selected: string;
  onChange: (voiceId: string) => void;
}

const VoiceSelector = ({ selected, onChange }: VoiceSelectorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("popular");
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);

  const selectedVoice = VOICE_LIBRARY.find(v => v.id === selected) || VOICE_LIBRARY[0];
  const filteredVoices = VOICE_LIBRARY.filter(v => v.category === activeCategory);

  const handlePlayPreview = async (voice: Voice, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (playingVoice === voice.id) {
      setPlayingVoice(null);
      return;
    }

    setPlayingVoice(voice.id);
    
    // Simulate preview duration
    setTimeout(() => {
      setPlayingVoice(null);
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-3"
    >
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Mic className="w-4 h-4 text-primary" />
        Voice Over Library
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
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {selectedVoice.accent}
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
              <ScrollArea className="h-[240px]">
                <div className="space-y-2 pr-2">
                  {filteredVoices.map((voice) => {
                    const isSelected = selected === voice.id;
                    const isPlaying = playingVoice === voice.id;

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
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                              {voice.accent}
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
                          className="h-8 w-8 flex-shrink-0"
                          onClick={(e) => handlePlayPreview(voice, e)}
                        >
                          {isPlaying ? (
                            <Volume2 className="w-4 h-4 text-primary animate-pulse" />
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
                Powered by ElevenLabs • 16 voices tersedia
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
