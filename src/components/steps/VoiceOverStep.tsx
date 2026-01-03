import { motion } from "framer-motion";
import { ChevronRight, ChevronLeft, Mic, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import NewsInput from "@/components/NewsInput";
import VoiceSelector from "@/components/VoiceSelector";
import VoiceSettings, { VoiceSettingsValues } from "@/components/VoiceSettings";
import AudioPreview from "@/components/AudioPreview";

interface VoiceOverStepProps {
  newsText: string;
  onNewsTextChange: (text: string) => void;
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  voiceSettings: VoiceSettingsValues;
  onVoiceSettingsChange: (settings: VoiceSettingsValues) => void;
  // Audio
  isGeneratingAudio: boolean;
  audioUrl: string | null;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  onPlay: () => void;
  onPause: () => void;
  onGenerateAudio: () => void;
  // Navigation
  onNext: () => void;
  onBack: () => void;
}

const VoiceOverStep = ({
  newsText,
  onNewsTextChange,
  selectedVoice,
  onVoiceChange,
  voiceSettings,
  onVoiceSettingsChange,
  isGeneratingAudio,
  audioUrl,
  isPlaying,
  duration,
  currentTime,
  onPlay,
  onPause,
  onGenerateAudio,
  onNext,
  onBack,
}: VoiceOverStepProps) => {
  const hasAudio = !!audioUrl;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Mic className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-lg text-foreground">
            Voice Over Generator
          </h2>
          <p className="text-sm text-muted-foreground">
            Tulis teks berita dan generate suara AI
          </p>
        </div>
      </div>

      {/* News Text Input */}
      <div className="glass-card rounded-xl p-5">
        <NewsInput value={newsText} onChange={onNewsTextChange} />
      </div>

      {/* Voice Selection */}
      <div className="glass-card rounded-xl p-5">
        <VoiceSelector selected={selectedVoice} onChange={onVoiceChange} />
      </div>

      {/* Voice Settings */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
            <Settings className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-foreground text-sm">Voice Settings</h3>
            <p className="text-xs text-muted-foreground">Sesuaikan karakter suara</p>
          </div>
        </div>
        <VoiceSettings settings={voiceSettings} onChange={onVoiceSettingsChange} />
      </div>

      {/* Audio Preview */}
      <div className="glass-card rounded-xl p-5">
        <AudioPreview
          isGenerating={isGeneratingAudio}
          audioUrl={audioUrl}
          isPlaying={isPlaying}
          duration={duration}
          currentTime={currentTime}
          onPlay={onPlay}
          onPause={onPause}
          onGenerate={onGenerateAudio}
          disabled={!newsText.trim()}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="pt-4 flex flex-col gap-3">
        <div className="flex gap-3">
          <Button variant="glass" size="lg" onClick={onBack} className="flex-shrink-0">
            <ChevronLeft className="w-5 h-5" />
            Kembali
          </Button>
          <Button
            variant="news"
            size="lg"
            className="flex-1"
            onClick={onNext}
            disabled={!hasAudio}
          >
            {hasAudio ? (
              <>
                Lanjut ke Editor
                <ChevronRight className="w-5 h-5" />
              </>
            ) : (
              <>Generate Audio Terlebih Dahulu</>
            )}
          </Button>
        </div>
        
        {/* Skip Voice Over Option */}
        {!hasAudio && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onNext}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip Voice Over - Lanjut tanpa audio
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default VoiceOverStep;
