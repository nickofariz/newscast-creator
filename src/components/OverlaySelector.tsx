import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Image, 
  Type, 
  AlertTriangle, 
  Upload, 
  X, 
  Check,
  Layers,
  Palette,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Frame,
  Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export interface OverlaySettings {
  logo: {
    enabled: boolean;
    url: string | null;
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
    size: number; // 20-100
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
    color: "#DC2626", // Red
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
  { id: "red", color: "#DC2626", label: "Merah" },
  { id: "orange", color: "#EA580C", label: "Oranye" },
  { id: "blue", color: "#2563EB", label: "Biru" },
  { id: "green", color: "#16A34A", label: "Hijau" },
  { id: "purple", color: "#9333EA", label: "Ungu" },
  { id: "black", color: "#171717", label: "Hitam" },
];

const OverlaySelector = ({ settings, onChange }: OverlaySelectorProps) => {
  const [activeTab, setActiveTab] = useState<"headline" | "logo" | "credit" | "frame">("headline");
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

  const overlayTabs = [
    { id: "headline" as const, label: "Headline", icon: Type },
    { id: "logo" as const, label: "Logo", icon: Image },
    { id: "credit" as const, label: "Credit", icon: Link2 },
    { id: "frame" as const, label: "Frame", icon: Frame },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <Layers className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-medium text-foreground text-sm">Overlay & Watermark</h3>
          <p className="text-xs text-muted-foreground">Kustomisasi tampilan video Anda</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
        {overlayTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isEnabled = 
            tab.id === "headline" ? settings.headline.enabled :
            tab.id === "logo" ? settings.logo.enabled :
            tab.id === "credit" ? settings.credit.enabled :
            settings.frame.enabled;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium transition-all",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              {isEnabled && (
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 bg-secondary/30 rounded-lg space-y-4"
      >
        {/* Headline Tab */}
        {activeTab === "headline" && (
          <>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Headline Box</Label>
              <button
                onClick={() =>
                  onChange({
                    ...settings,
                    headline: { ...settings.headline, enabled: !settings.headline.enabled },
                  })
                }
                className={cn(
                  "w-10 h-6 rounded-full transition-colors relative",
                  settings.headline.enabled ? "bg-primary" : "bg-muted"
                )}
              >
                <div
                  className={cn(
                    "absolute w-4 h-4 rounded-full bg-white top-1 transition-all",
                    settings.headline.enabled ? "left-5" : "left-1"
                  )}
                />
              </button>
            </div>

            {settings.headline.enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4"
              >
                {/* Position */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Posisi</Label>
                  <div className="flex gap-2">
                    {[
                      { id: "top" as const, icon: AlignVerticalJustifyStart, label: "Atas" },
                      { id: "center" as const, icon: AlignVerticalJustifyCenter, label: "Tengah" },
                      { id: "bottom" as const, icon: AlignVerticalJustifyEnd, label: "Bawah" },
                    ].map((pos) => {
                      const Icon = pos.icon;
                      return (
                        <button
                          key={pos.id}
                          onClick={() =>
                            onChange({
                              ...settings,
                              headline: { ...settings.headline, position: pos.id },
                            })
                          }
                          className={cn(
                            "flex-1 flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border",
                            settings.headline.position === pos.id
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background border-border hover:border-primary/50"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          {pos.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Style */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Style</Label>
                  <div className="flex gap-2">
                    {[
                      { id: "solid" as const, label: "Solid", preview: "bg-red-600" },
                      { id: "gradient" as const, label: "Gradient", preview: "bg-gradient-to-t from-orange-500 to-transparent" },
                      { id: "transparent" as const, label: "Transparan", preview: "bg-black/50" },
                    ].map((style) => (
                      <button
                        key={style.id}
                        onClick={() =>
                          onChange({
                            ...settings,
                            headline: { ...settings.headline, style: style.id },
                          })
                        }
                        className={cn(
                          "flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border",
                          settings.headline.style === style.id
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className={cn("h-6 rounded mb-1", style.preview)} />
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Warna</Label>
                  <div className="flex gap-2 flex-wrap">
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
                          "w-8 h-8 rounded-lg transition-all border-2",
                          settings.headline.color === preset.color
                            ? "border-foreground scale-110"
                            : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: preset.color }}
                        title={preset.label}
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
                      <div className="w-8 h-8 rounded-lg border-2 border-dashed border-muted-foreground flex items-center justify-center">
                        <Palette className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Show Subtitle Toggle */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Tampilkan Subtitle</Label>
                  <button
                    onClick={() =>
                      onChange({
                        ...settings,
                        headline: { ...settings.headline, showSubtitle: !settings.headline.showSubtitle },
                      })
                    }
                    className={cn(
                      "w-8 h-5 rounded-full transition-colors relative",
                      settings.headline.showSubtitle ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute w-3 h-3 rounded-full bg-white top-1 transition-all",
                        settings.headline.showSubtitle ? "left-4" : "left-1"
                      )}
                    />
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Logo Tab */}
        {activeTab === "logo" && (
          <>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Logo Watermark</Label>
              <button
                onClick={() =>
                  onChange({
                    ...settings,
                    logo: { ...settings.logo, enabled: !settings.logo.enabled },
                  })
                }
                className={cn(
                  "w-10 h-6 rounded-full transition-colors relative",
                  settings.logo.enabled ? "bg-primary" : "bg-muted"
                )}
              >
                <div
                  className={cn(
                    "absolute w-4 h-4 rounded-full bg-white top-1 transition-all",
                    settings.logo.enabled ? "left-5" : "left-1"
                  )}
                />
              </button>
            </div>

            {settings.logo.enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4"
              >
                {/* Logo Upload */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Upload Logo</Label>
                  {settings.logo.url ? (
                    <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                      <img
                        src={settings.logo.url}
                        alt="Logo"
                        className="w-12 h-12 object-contain rounded"
                      />
                      <div className="flex-1">
                        <p className="text-xs text-foreground font-medium">Logo uploaded</p>
                        <p className="text-xs text-muted-foreground">Click to change</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onChange({ ...settings, logo: { ...settings.logo, url: null } })}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full p-4 border-2 border-dashed border-border rounded-lg text-center hover:border-primary/50 transition-colors"
                    >
                      <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Klik untuk upload logo (PNG, JPG)</p>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </div>

                {/* Logo Position */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Posisi Logo</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "top-left" as const, label: "Kiri Atas" },
                      { id: "top-right" as const, label: "Kanan Atas" },
                      { id: "bottom-left" as const, label: "Kiri Bawah" },
                      { id: "bottom-right" as const, label: "Kanan Bawah" },
                    ].map((pos) => (
                      <button
                        key={pos.id}
                        onClick={() =>
                          onChange({
                            ...settings,
                            logo: { ...settings.logo, position: pos.id },
                          })
                        }
                        className={cn(
                          "px-3 py-2 rounded-lg text-xs font-medium transition-all border",
                          settings.logo.position === pos.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:border-primary/50"
                        )}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo Size */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Ukuran: {settings.logo.size}px
                  </Label>
                  <Slider
                    value={[settings.logo.size]}
                    onValueChange={([value]) =>
                      onChange({ ...settings, logo: { ...settings.logo, size: value } })
                    }
                    min={20}
                    max={80}
                    step={5}
                    className="w-full"
                  />
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Credit Tab */}
        {activeTab === "credit" && (
          <>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Credit / Watermark Text</Label>
              <button
                onClick={() =>
                  onChange({
                    ...settings,
                    credit: { ...settings.credit, enabled: !settings.credit.enabled },
                  })
                }
                className={cn(
                  "w-10 h-6 rounded-full transition-colors relative",
                  settings.credit.enabled ? "bg-primary" : "bg-muted"
                )}
              >
                <div
                  className={cn(
                    "absolute w-4 h-4 rounded-full bg-white top-1 transition-all",
                    settings.credit.enabled ? "left-5" : "left-1"
                  )}
                />
              </button>
            </div>

            {settings.credit.enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4"
              >
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Teks Utama</Label>
                  <Input
                    value={settings.credit.text}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        credit: { ...settings.credit, text: e.target.value },
                      })
                    }
                    placeholder="Baca selengkapnya: website.com"
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Teks Sekunder</Label>
                  <Input
                    value={settings.credit.secondaryText}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        credit: { ...settings.credit, secondaryText: e.target.value },
                      })
                    }
                    placeholder="Part of Media Network"
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Posisi</Label>
                  <div className="flex gap-2">
                    {[
                      { id: "top" as const, label: "Atas" },
                      { id: "bottom" as const, label: "Bawah" },
                    ].map((pos) => (
                      <button
                        key={pos.id}
                        onClick={() =>
                          onChange({
                            ...settings,
                            credit: { ...settings.credit, position: pos.id },
                          })
                        }
                        className={cn(
                          "flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border",
                          settings.credit.position === pos.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:border-primary/50"
                        )}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Frame Tab */}
        {activeTab === "frame" && (
          <>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Frame / Border</Label>
              <button
                onClick={() =>
                  onChange({
                    ...settings,
                    frame: { ...settings.frame, enabled: !settings.frame.enabled },
                  })
                }
                className={cn(
                  "w-10 h-6 rounded-full transition-colors relative",
                  settings.frame.enabled ? "bg-primary" : "bg-muted"
                )}
              >
                <div
                  className={cn(
                    "absolute w-4 h-4 rounded-full bg-white top-1 transition-all",
                    settings.frame.enabled ? "left-5" : "left-1"
                  )}
                />
              </button>
            </div>

            {settings.frame.enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4"
              >
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Style Frame</Label>
                  <div className="flex gap-2">
                    {[
                      { id: "border" as const, label: "Border" },
                      { id: "bars" as const, label: "Bars" },
                      { id: "corner" as const, label: "Corner" },
                    ].map((style) => (
                      <button
                        key={style.id}
                        onClick={() =>
                          onChange({
                            ...settings,
                            frame: { ...settings.frame, style: style.id },
                          })
                        }
                        className={cn(
                          "flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border",
                          settings.frame.style === style.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:border-primary/50"
                        )}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Warna Frame</Label>
                  <div className="flex gap-2 flex-wrap">
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
                          "w-8 h-8 rounded-lg transition-all border-2",
                          settings.frame.color === preset.color
                            ? "border-foreground scale-110"
                            : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: preset.color }}
                        title={preset.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="p-3 bg-black/80 rounded-lg">
                  <p className="text-[10px] text-muted-foreground mb-2">Preview:</p>
                  <div 
                    className={cn(
                      "w-16 h-24 bg-gray-600 mx-auto relative",
                      settings.frame.style === "border" && "border-4",
                      settings.frame.style === "corner" && "border-0"
                    )}
                    style={{ 
                      borderColor: settings.frame.style === "border" ? settings.frame.color : undefined 
                    }}
                  >
                    {settings.frame.style === "bars" && (
                      <>
                        <div 
                          className="absolute top-0 left-0 right-0 h-2" 
                          style={{ backgroundColor: settings.frame.color }}
                        />
                        <div 
                          className="absolute bottom-0 left-0 right-0 h-2" 
                          style={{ backgroundColor: settings.frame.color }}
                        />
                      </>
                    )}
                    {settings.frame.style === "corner" && (
                      <>
                        <div 
                          className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2" 
                          style={{ borderColor: settings.frame.color }}
                        />
                        <div 
                          className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2" 
                          style={{ borderColor: settings.frame.color }}
                        />
                        <div 
                          className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2" 
                          style={{ borderColor: settings.frame.color }}
                        />
                        <div 
                          className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2" 
                          style={{ borderColor: settings.frame.color }}
                        />
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>

      {/* Active Overlays Summary */}
      {(settings.headline.enabled || settings.logo.enabled || settings.credit.enabled || settings.frame.enabled) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Aktif:</span>
          {settings.headline.enabled && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
              <Check className="w-3 h-3" /> Headline
            </span>
          )}
          {settings.logo.enabled && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
              <Check className="w-3 h-3" /> Logo
            </span>
          )}
          {settings.credit.enabled && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
              <Check className="w-3 h-3" /> Credit
            </span>
          )}
          {settings.frame.enabled && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
              <Check className="w-3 h-3" /> Frame
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default OverlaySelector;
