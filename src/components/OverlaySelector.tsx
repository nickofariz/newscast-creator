import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Image, 
  Type, 
  Upload, 
  X, 
  Palette,
  Frame
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export interface OverlaySettings {
  logo: {
    enabled: boolean;
    url: string | null;
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    size: number;
  };
  headline: {
    enabled: boolean;
    position: "top" | "center" | "bottom";
    style: "solid" | "gradient" | "transparent";
    color: string;
    showSubtitle: boolean;
  };
  credit: {
    enabled: boolean;
    text: string;
    secondaryText: string;
    position: "top" | "bottom";
  };
  frame: {
    enabled: boolean;
    style: "border" | "bars" | "corner";
    color: string;
  };
  lowerThird: {
    enabled: boolean;
    title: string;
    subtitle: string;
    style: "modern" | "classic" | "minimal";
  };
  breakingNews: {
    enabled: boolean;
    text: string;
    style: "red" | "blue" | "orange";
  };
}

export const DEFAULT_OVERLAY_SETTINGS: OverlaySettings = {
  logo: {
    enabled: false,
    url: null,
    position: "top-right",
    size: 40,
  },
  headline: {
    enabled: true,
    position: "bottom",
    style: "solid",
    color: "#DC2626",
    showSubtitle: true,
  },
  credit: {
    enabled: false,
    text: "",
    secondaryText: "",
    position: "bottom",
  },
  frame: {
    enabled: false,
    style: "border",
    color: "#DC2626",
  },
  lowerThird: {
    enabled: false,
    title: "",
    subtitle: "",
    style: "modern",
  },
  breakingNews: {
    enabled: false,
    text: "BREAKING NEWS",
    style: "red",
  },
};

interface OverlaySelectorProps {
  settings: OverlaySettings;
  onChange: (settings: OverlaySettings) => void;
}

const COLOR_PRESETS = [
  { id: "red", color: "#DC2626" },
  { id: "orange", color: "#EA580C" },
  { id: "blue", color: "#2563EB" },
  { id: "green", color: "#16A34A" },
  { id: "purple", color: "#9333EA" },
  { id: "black", color: "#171717" },
];

const OverlaySelector = ({ settings, onChange }: OverlaySelectorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onChange({
        ...settings,
        logo: { ...settings.logo, url, enabled: true },
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Subtitle Settings */}
      <div className="p-3 rounded-lg bg-secondary/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-yellow-500" />
            <Label className="text-sm font-medium">Subtitle</Label>
          </div>
          <Switch
            checked={settings.headline.showSubtitle}
            onCheckedChange={(checked) =>
              onChange({
                ...settings,
                headline: { ...settings.headline, showSubtitle: checked },
              })
            }
          />
        </div>
        
        {settings.headline.showSubtitle && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-2"
          >
            <Label className="text-xs text-muted-foreground">Warna Background</Label>
            <div className="flex gap-1.5 flex-wrap">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() =>
                    onChange({
                      ...settings,
                      headline: { ...settings.headline, color: preset.color },
                    })
                  }
                  className={cn(
                    "w-7 h-7 rounded-md transition-all",
                    settings.headline.color === preset.color
                      ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                      : "hover:scale-105"
                  )}
                  style={{ backgroundColor: preset.color }}
                />
              ))}
              <div className="relative">
                <input
                  type="color"
                  value={settings.headline.color}
                  onChange={(e) =>
                    onChange({
                      ...settings,
                      headline: { ...settings.headline, color: e.target.value },
                    })
                  }
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="w-7 h-7 rounded-md border border-dashed border-muted-foreground flex items-center justify-center">
                  <Palette className="w-3 h-3 text-muted-foreground" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Logo Settings */}
      <div className="p-3 rounded-lg bg-secondary/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-purple-500" />
            <Label className="text-sm font-medium">Logo</Label>
          </div>
          <Switch
            checked={settings.logo.enabled}
            onCheckedChange={(checked) =>
              onChange({
                ...settings,
                logo: { ...settings.logo, enabled: checked },
              })
            }
          />
        </div>

        {settings.logo.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-3"
          >
            {/* Upload */}
            {settings.logo.url ? (
              <div className="flex items-center gap-2 p-2 bg-background rounded-md border border-border">
                <img
                  src={settings.logo.url}
                  alt="Logo"
                  className="w-10 h-10 object-contain rounded"
                />
                <span className="text-xs text-muted-foreground flex-1">Logo uploaded</span>
                <button
                  onClick={() => onChange({ ...settings, logo: { ...settings.logo, url: null } })}
                  className="p-1 hover:bg-destructive/10 rounded"
                >
                  <X className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-3 border border-dashed border-border rounded-md text-center hover:border-primary/50 transition-colors"
              >
                <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Upload logo</p>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />

            {/* Position */}
            <div className="grid grid-cols-4 gap-1">
              {(["top-left", "top-right", "bottom-left", "bottom-right"] as const).map((pos) => (
                <button
                  key={pos}
                  onClick={() =>
                    onChange({
                      ...settings,
                      logo: { ...settings.logo, position: pos },
                    })
                  }
                  className={cn(
                    "p-2 rounded text-[10px] transition-all border",
                    settings.logo.position === pos
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50"
                  )}
                >
                  {pos.split("-").map(w => w[0].toUpperCase()).join("")}
                </button>
              ))}
            </div>

            {/* Size */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Ukuran</span>
                <span>{settings.logo.size}px</span>
              </div>
              <Slider
                value={[settings.logo.size]}
                onValueChange={([value]) =>
                  onChange({ ...settings, logo: { ...settings.logo, size: value } })
                }
                min={20}
                max={80}
                step={5}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Frame Settings */}
      <div className="p-3 rounded-lg bg-secondary/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Frame className="w-4 h-4 text-blue-500" />
            <Label className="text-sm font-medium">Frame</Label>
          </div>
          <Switch
            checked={settings.frame.enabled}
            onCheckedChange={(checked) =>
              onChange({
                ...settings,
                frame: { ...settings.frame, enabled: checked },
              })
            }
          />
        </div>

        {settings.frame.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-3"
          >
            {/* Style */}
            <div className="grid grid-cols-3 gap-1">
              {(["border", "bars", "corner"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() =>
                    onChange({
                      ...settings,
                      frame: { ...settings.frame, style },
                    })
                  }
                  className={cn(
                    "p-2 rounded text-xs capitalize transition-all border",
                    settings.frame.style === style
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/50"
                  )}
                >
                  {style}
                </button>
              ))}
            </div>

            {/* Color */}
            <div className="flex gap-1.5 flex-wrap">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() =>
                    onChange({
                      ...settings,
                      frame: { ...settings.frame, color: preset.color },
                    })
                  }
                  className={cn(
                    "w-7 h-7 rounded-md transition-all",
                    settings.frame.color === preset.color
                      ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                      : "hover:scale-105"
                  )}
                  style={{ backgroundColor: preset.color }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default OverlaySelector;
