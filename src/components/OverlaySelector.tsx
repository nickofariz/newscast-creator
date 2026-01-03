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

type VideoFormatType = "short" | "tv";

interface OverlaySelectorProps {
  settings: OverlaySettings;
  onChange: (settings: OverlaySettings) => void;
  videoFormat?: VideoFormatType;
}

const COLOR_PRESETS = [
  { id: "red", color: "#DC2626" },
  { id: "orange", color: "#EA580C" },
  { id: "blue", color: "#2563EB" },
  { id: "green", color: "#16A34A" },
  { id: "purple", color: "#9333EA" },
  { id: "black", color: "#171717" },
];

// Mini preview component - adapts to video format
const MiniPreview = ({ 
  children, 
  className, 
  isTV = false 
}: { 
  children: React.ReactNode; 
  className?: string;
  isTV?: boolean;
}) => (
  <div className={cn(
    "rounded-sm bg-gray-700 relative overflow-hidden flex-shrink-0 border border-border",
    isTV ? "w-16 h-10" : "w-10 h-16",
    className
  )}>
    {children}
  </div>
);

const OverlaySelector = ({ settings, onChange, videoFormat = "short" }: OverlaySelectorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isTV = videoFormat === "tv";

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

  // Get logo position classes
  const getLogoPositionClasses = (position: string) => {
    switch (position) {
      case "top-left": return "top-0.5 left-0.5";
      case "top-right": return "top-0.5 right-0.5";
      case "bottom-left": return "bottom-0.5 left-0.5";
      case "bottom-right": return "bottom-0.5 right-0.5";
      default: return "top-0.5 right-0.5";
    }
  };

  return (
    <div className="space-y-3">
      {/* Subtitle Settings */}
      <div className="p-3 rounded-lg bg-secondary/30">
        <div className="flex items-center gap-3">
          {/* Mini Preview */}
          <MiniPreview isTV={isTV}>
            <div className={cn(
              "absolute inset-0",
              isTV ? "bg-gradient-to-r from-gray-600 to-gray-800" : "bg-gradient-to-b from-gray-600 to-gray-800"
            )} />
            {settings.headline.showSubtitle && (
              <div 
                className={cn(
                  "absolute rounded-sm",
                  isTV 
                    ? "bottom-1 left-1 right-1 h-1.5" 
                    : "bottom-1 left-0.5 right-0.5 h-2"
                )}
                style={{ backgroundColor: settings.headline.color }}
              >
                <div className={cn(
                  "bg-white/80 mx-auto",
                  isTV ? "w-[90%] h-0.5 mt-0.5" : "w-[80%] h-0.5 mt-0.5"
                )} />
              </div>
            )}
          </MiniPreview>

          {/* Controls */}
          <div className="flex-1 space-y-2">
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
              <div className="flex gap-1 flex-wrap">
                {COLOR_PRESETS.slice(0, 4).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() =>
                      onChange({
                        ...settings,
                        headline: { ...settings.headline, color: preset.color },
                      })
                    }
                    className={cn(
                      "w-5 h-5 rounded transition-all",
                      settings.headline.color === preset.color
                        ? "ring-2 ring-offset-1 ring-offset-background ring-primary"
                        : "hover:scale-110"
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
                    className="absolute inset-0 opacity-0 cursor-pointer w-5 h-5"
                  />
                  <div className="w-5 h-5 rounded border border-dashed border-muted-foreground flex items-center justify-center">
                    <Palette className="w-2.5 h-2.5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logo Settings */}
      <div className="p-3 rounded-lg bg-secondary/30">
        <div className="flex items-center gap-3">
          {/* Mini Preview */}
          <MiniPreview isTV={isTV}>
            <div className={cn(
              "absolute inset-0",
              isTV ? "bg-gradient-to-r from-gray-600 to-gray-800" : "bg-gradient-to-b from-gray-600 to-gray-800"
            )} />
            {settings.logo.enabled && (
              <div 
                className={cn(
                  "absolute rounded-sm bg-purple-500/80 flex items-center justify-center",
                  isTV ? "w-2.5 h-2.5" : "w-3 h-3",
                  getLogoPositionClasses(settings.logo.position)
                )}
              >
                {settings.logo.url ? (
                  <img src={settings.logo.url} alt="" className="w-full h-full object-contain" />
                ) : (
                  <Image className={cn(isTV ? "w-1.5 h-1.5" : "w-2 h-2", "text-white")} />
                )}
              </div>
            )}
          </MiniPreview>

          {/* Controls */}
          <div className="flex-1 space-y-2">
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
              <div className="space-y-2">
                {/* Upload or show uploaded */}
                {settings.logo.url ? (
                  <div className="flex items-center gap-2">
                    <img src={settings.logo.url} alt="Logo" className="w-6 h-6 object-contain rounded" />
                    <button
                      onClick={() => onChange({ ...settings, logo: { ...settings.logo, url: null } })}
                      className="text-[10px] text-destructive hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" /> Upload
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />

                {/* Position grid */}
                <div className="grid grid-cols-4 gap-0.5">
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
                        "p-1 rounded text-[8px] transition-all",
                        settings.logo.position === pos
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {pos.split("-").map(w => w[0].toUpperCase()).join("")}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Frame Settings */}
      <div className="p-3 rounded-lg bg-secondary/30">
        <div className="flex items-center gap-3">
          {/* Mini Preview */}
          <MiniPreview isTV={isTV}>
            <div className={cn(
              "absolute inset-0",
              isTV ? "bg-gradient-to-r from-gray-600 to-gray-800" : "bg-gradient-to-b from-gray-600 to-gray-800"
            )} />
            {settings.frame.enabled && (
              <>
                {settings.frame.style === "border" && (
                  <div 
                    className={cn(
                      "absolute rounded-sm",
                      isTV ? "inset-0.5 border" : "inset-0.5 border-2"
                    )}
                    style={{ borderColor: settings.frame.color }}
                  />
                )}
                {settings.frame.style === "bars" && (
                  <>
                    <div 
                      className={cn(
                        "absolute top-0 left-0 right-0",
                        isTV ? "h-0.5" : "h-1"
                      )}
                      style={{ backgroundColor: settings.frame.color }}
                    />
                    <div 
                      className={cn(
                        "absolute bottom-0 left-0 right-0",
                        isTV ? "h-0.5" : "h-1"
                      )}
                      style={{ backgroundColor: settings.frame.color }}
                    />
                  </>
                )}
                {settings.frame.style === "corner" && (
                  <>
                    <div className={cn(
                      "absolute top-0.5 left-0.5 border-t border-l",
                      isTV ? "w-1.5 h-1.5" : "w-2 h-2 border-t-2 border-l-2"
                    )} style={{ borderColor: settings.frame.color }} />
                    <div className={cn(
                      "absolute top-0.5 right-0.5 border-t border-r",
                      isTV ? "w-1.5 h-1.5" : "w-2 h-2 border-t-2 border-r-2"
                    )} style={{ borderColor: settings.frame.color }} />
                    <div className={cn(
                      "absolute bottom-0.5 left-0.5 border-b border-l",
                      isTV ? "w-1.5 h-1.5" : "w-2 h-2 border-b-2 border-l-2"
                    )} style={{ borderColor: settings.frame.color }} />
                    <div className={cn(
                      "absolute bottom-0.5 right-0.5 border-b border-r",
                      isTV ? "w-1.5 h-1.5" : "w-2 h-2 border-b-2 border-r-2"
                    )} style={{ borderColor: settings.frame.color }} />
                  </>
                )}
              </>
            )}
          </MiniPreview>

          {/* Controls */}
          <div className="flex-1 space-y-2">
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
              <div className="space-y-2">
                {/* Style */}
                <div className="flex gap-1">
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
                        "px-2 py-0.5 rounded text-[10px] capitalize transition-all",
                        settings.frame.style === style
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {style}
                    </button>
                  ))}
                </div>

                {/* Color */}
                <div className="flex gap-1">
                  {COLOR_PRESETS.slice(0, 4).map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() =>
                        onChange({
                          ...settings,
                          frame: { ...settings.frame, color: preset.color },
                        })
                      }
                      className={cn(
                        "w-5 h-5 rounded transition-all",
                        settings.frame.color === preset.color
                          ? "ring-2 ring-offset-1 ring-offset-background ring-primary"
                          : "hover:scale-110"
                      )}
                      style={{ backgroundColor: preset.color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverlaySelector;
