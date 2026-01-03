import { motion } from "framer-motion";
import { Mic, User, UserRound } from "lucide-react";

type VoiceType = "male" | "female";

interface VoiceSelectorProps {
  selected: VoiceType;
  onChange: (voice: VoiceType) => void;
}

const VoiceSelector = ({ selected, onChange }: VoiceSelectorProps) => {
  const voices = [
    { id: "male" as VoiceType, label: "Pria", icon: User, description: "Suara pria profesional" },
    { id: "female" as VoiceType, label: "Wanita", icon: UserRound, description: "Suara wanita profesional" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-3"
    >
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Mic className="w-4 h-4 text-primary" />
        Pilih Suara
      </label>

      <div className="grid grid-cols-2 gap-3">
        {voices.map((voice) => {
          const Icon = voice.icon;
          const isSelected = selected === voice.id;

          return (
            <motion.button
              key={voice.id}
              onClick={() => onChange(voice.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-glow"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isSelected ? "gradient-news" : "bg-secondary"
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      isSelected ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                  />
                </div>
                <div className="text-center">
                  <p className={`font-semibold ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                    {voice.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {voice.description}
                  </p>
                </div>
              </div>

              {isSelected && (
                <motion.div
                  layoutId="voiceIndicator"
                  className="absolute top-2 right-2 w-3 h-3 rounded-full bg-primary"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default VoiceSelector;
