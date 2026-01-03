import { motion } from "framer-motion";
import { Settings2, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface VoiceSettingsValues {
  speed: number;
  stability: number;
  similarity: number;
  style: number;
}

interface VoiceSettingsProps {
  settings: VoiceSettingsValues;
  onChange: (settings: VoiceSettingsValues) => void;
}

const DEFAULT_SETTINGS: VoiceSettingsValues = {
  speed: 1.0,
  stability: 0.5,
  similarity: 0.75,
  style: 0.0,
};

const VoiceSettings = ({ settings, onChange }: VoiceSettingsProps) => {
  const handleReset = () => {
    onChange(DEFAULT_SETTINGS);
  };

  const updateSetting = (key: keyof VoiceSettingsValues, value: number) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Settings2 className="w-4 h-4 text-primary" />
          Voice Settings
        </label>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={handleReset}
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </Button>
      </div>

      <div className="p-4 rounded-xl bg-card border border-border space-y-5">
        {/* Speed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Speed</span>
            <span className="text-xs font-mono text-muted-foreground">
              {settings.speed.toFixed(1)}x
            </span>
          </div>
          <div className="relative">
            <Slider
              value={[settings.speed]}
              onValueChange={([value]) => updateSetting("speed", value)}
              min={0.7}
              max={1.2}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">Slower</span>
              <span className="text-[10px] text-muted-foreground">Faster</span>
            </div>
          </div>
        </div>

        {/* Stability */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Stability</span>
            <span className="text-xs font-mono text-muted-foreground">
              {Math.round(settings.stability * 100)}%
            </span>
          </div>
          <div className="relative">
            <div 
              className="absolute inset-0 rounded-full h-2 top-[9px]"
              style={{
                background: "linear-gradient(90deg, hsl(280 70% 50%), hsl(200 80% 50%), hsl(30 90% 60%))"
              }}
            />
            <Slider
              value={[settings.stability]}
              onValueChange={([value]) => updateSetting("stability", value)}
              min={0}
              max={1}
              step={0.05}
              className={cn("w-full relative", "[&_.bg-primary]:bg-transparent")}
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">More variable</span>
              <span className="text-[10px] text-muted-foreground">More stable</span>
            </div>
          </div>
        </div>

        {/* Similarity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Similarity</span>
            <span className="text-xs font-mono text-muted-foreground">
              {Math.round(settings.similarity * 100)}%
            </span>
          </div>
          <div className="relative">
            <Slider
              value={[settings.similarity]}
              onValueChange={([value]) => updateSetting("similarity", value)}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">Low</span>
              <span className="text-[10px] text-muted-foreground">High</span>
            </div>
          </div>
        </div>

        {/* Style Exaggeration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Style Exaggeration</span>
            <span className="text-xs font-mono text-muted-foreground">
              {Math.round(settings.style * 100)}%
            </span>
          </div>
          <div className="relative">
            <Slider
              value={[settings.style]}
              onValueChange={([value]) => updateSetting("style", value)}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-muted-foreground">None</span>
              <span className="text-[10px] text-muted-foreground">Exaggerated</span>
            </div>
          </div>
        </div>

        {/* Info */}
        <p className="text-[10px] text-muted-foreground pt-2 border-t border-border">
          Stability rendah = lebih ekspresif. Similarity tinggi = lebih mirip suara asli.
        </p>
      </div>
    </motion.div>
  );
};

export default VoiceSettings;
export { DEFAULT_SETTINGS };
