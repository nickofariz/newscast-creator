import { motion } from "framer-motion";
import { Subtitles, Loader2, Download, Palette, Type, AlignVerticalJustifyCenter, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export interface SubtitleWord {
  text: string;
  start: number;
  end: number;
}

export interface SubtitleStyleSettings {
  enabled: boolean;
  fontSize: "small" | "medium" | "large";
  position: "top" | "center" | "bottom";
  highlightColor: string;
  backgroundColor: string;
  backgroundOpacity: number;
}

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyleSettings = {
  enabled: true,
  fontSize: "medium",
  position: "bottom",
  highlightColor: "#DC2626",
  backgroundColor: "#000000",
  backgroundOpacity: 85,
};

// Preset styles
interface StylePreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  settings: Omit<SubtitleStyleSettings, "enabled">;
}

const STYLE_PRESETS: StylePreset[] = [
  {
    id: "news",
    name: "News Style",
    icon: "📺",
    description: "Bold, profesional untuk berita",
    settings: {
      fontSize: "large",
      position: "bottom",
      highlightColor: "#DC2626",
      backgroundColor: "#000000",
      backgroundOpacity: 90,
    },
  },
  {
    id: "karaoke",
    name: "Karaoke",
    icon: "🎤",
    description: "Warna cerah, dinamis",
    settings: {
      fontSize: "medium",
      position: "center",
      highlightColor: "#EAB308",
      backgroundColor: "#000000",
      backgroundOpacity: 70,
    },
  },
  {
    id: "minimal",
    name: "Minimal",
    icon: "✨",
    description: "Bersih, sederhana",
    settings: {
      fontSize: "small",
      position: "bottom",
      highlightColor: "#FFFFFF",
      backgroundColor: "#000000",
      backgroundOpacity: 60,
    },
  },
  {
    id: "neon",
    name: "Neon",
    icon: "💜",
    description: "Glow effect, modern",
    settings: {
      fontSize: "medium",
      position: "bottom",
      highlightColor: "#9333EA",
      backgroundColor: "#1a1a2e",
      backgroundOpacity: 80,
    },
  },
  {
    id: "sport",
    name: "Sport",
    icon: "⚽",
    description: "Energik, bold",
    settings: {
      fontSize: "large",
      position: "top",
      highlightColor: "#16A34A",
      backgroundColor: "#000000",
      backgroundOpacity: 85,
    },
  },
];

interface SubtitlePreviewProps {
  words: SubtitleWord[];
  isGenerating: boolean;
  currentTime: number;
  onGenerate: () => void;
  disabled: boolean;
  onDownloadSRT: () => void;
  styleSettings?: SubtitleStyleSettings;
  onStyleChange?: (settings: SubtitleStyleSettings) => void;
}

const COLOR_PRESETS = [
  { id: "red", color: "#DC2626" },
  { id: "orange", color: "#EA580C" },
  { id: "blue", color: "#2563EB" },
  { id: "green", color: "#16A34A" },
  { id: "purple", color: "#9333EA" },
  { id: "yellow", color: "#EAB308" },
];

const SubtitlePreview = ({
  words,
  isGenerating,
  currentTime,
  onGenerate,
  disabled,
  onDownloadSRT,
  styleSettings = DEFAULT_SUBTITLE_STYLE,
  onStyleChange,
}: SubtitlePreviewProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
  };

  // Find active word based on current time
  const activeWordIndex = words.findIndex(
    (word) => currentTime >= word.start && currentTime <= word.end
  );

  const updateStyle = (updates: Partial<SubtitleStyleSettings>) => {
    if (onStyleChange) {
      onStyleChange({ ...styleSettings, ...updates });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Subtitles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Auto Subtitle</span>
        </div>
        {words.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDownloadSRT}
            className="text-xs"
          >
            <Download className="w-3 h-3 mr-1" />
            Download SRT
          </Button>
        )}
      </div>

      {/* Subtitle Generator Section */}
      <div className="p-4 rounded-xl bg-card/50 border border-border/50">
        {words.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Subtitles className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Generate subtitle dari audio yang sudah dibuat
            </p>
            <Button
              variant="newsOutline"
              size="sm"
              onClick={onGenerate}
              disabled={disabled || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Subtitles className="w-4 h-4" />
                  Generate Subtitle
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <ScrollArea className="h-32 rounded-lg bg-background/50 p-3">
              <div className="flex flex-wrap gap-1">
                {words.map((word, index) => (
                  <motion.span
                    key={index}
                    className={`inline-block px-1.5 py-0.5 rounded text-sm transition-all ${
                      index === activeWordIndex
                        ? "bg-primary text-primary-foreground font-medium scale-105"
                        : currentTime > word.end
                        ? "text-muted-foreground"
                        : "text-foreground"
                    }`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    {word.text}
                  </motion.span>
                ))}
              </div>
            </ScrollArea>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{words.length} kata</span>
              <span>
                Durasi: {formatTime(words[words.length - 1]?.end || 0)}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onGenerate}
              disabled={isGenerating}
              className="w-full text-xs"
            >
              {isGenerating ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : null}
              Regenerate Subtitle
            </Button>
          </div>
        )}
      </div>

      {/* Style Settings Section */}
      {onStyleChange && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Palette className="w-4 h-4 text-primary" />
            <span>Style Settings</span>
          </div>

          {/* Preset Styles */}
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              <Label className="text-xs text-muted-foreground">Preset Style</Label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {STYLE_PRESETS.map((preset) => {
                const isActive = 
                  styleSettings.fontSize === preset.settings.fontSize &&
                  styleSettings.position === preset.settings.position &&
                  styleSettings.highlightColor === preset.settings.highlightColor;
                
                return (
                  <motion.button
                    key={preset.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateStyle(preset.settings)}
                    className={cn(
                      "p-3 rounded-xl text-center transition-all border-2",
                      isActive
                        ? "border-primary bg-primary/10"
                        : "border-transparent bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <span className="text-xl block mb-1">{preset.icon}</span>
                    <span className="text-xs font-medium block">{preset.name}</span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5 line-clamp-1">
                      {preset.description}
                    </span>
                    {/* Color preview */}
                    <div 
                      className="w-4 h-4 rounded-full mx-auto mt-2 ring-2 ring-offset-1 ring-offset-background ring-white/20"
                      style={{ backgroundColor: preset.settings.highlightColor }}
                    />
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Font Size */}
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-3">
              <Type className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-2 block">Ukuran Font</Label>
                <div className="flex gap-1">
                  {(["small", "medium", "large"] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => updateStyle({ fontSize: size })}
                      className={cn(
                        "px-3 py-1.5 rounded text-xs capitalize transition-all flex-1",
                        styleSettings.fontSize === size
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {size === "small" ? "Kecil" : size === "medium" ? "Sedang" : "Besar"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Position */}
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-3">
              <AlignVerticalJustifyCenter className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-2 block">Posisi</Label>
                <div className="flex gap-1">
                  {(["top", "center", "bottom"] as const).map((pos) => (
                    <button
                      key={pos}
                      onClick={() => updateStyle({ position: pos })}
                      className={cn(
                        "px-3 py-1.5 rounded text-xs capitalize transition-all flex-1",
                        styleSettings.position === pos
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {pos === "top" ? "Atas" : pos === "center" ? "Tengah" : "Bawah"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Highlight Color */}
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-3">
              <Palette className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-2 block">Warna Highlight</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => updateStyle({ highlightColor: preset.color })}
                      className={cn(
                        "w-7 h-7 rounded-full transition-all",
                        styleSettings.highlightColor === preset.color
                          ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                          : "hover:scale-110"
                      )}
                      style={{ backgroundColor: preset.color }}
                    />
                  ))}
                  <div className="relative">
                    <input
                      type="color"
                      value={styleSettings.highlightColor}
                      onChange={(e) => updateStyle({ highlightColor: e.target.value })}
                      className="absolute inset-0 opacity-0 cursor-pointer w-7 h-7"
                    />
                    <div className="w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center">
                      <Palette className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Background Opacity */}
          <div className="p-3 rounded-lg bg-secondary/30">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Background Opacity</Label>
                <span className="text-xs font-mono text-muted-foreground">{styleSettings.backgroundOpacity}%</span>
              </div>
              <Slider
                value={[styleSettings.backgroundOpacity]}
                onValueChange={([value]) => updateStyle({ backgroundOpacity: value })}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SubtitlePreview;