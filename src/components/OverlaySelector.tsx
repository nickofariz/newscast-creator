import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Image, 
  Type, 
  AlertTriangle, 
  Upload, 
  X, 
  Check,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface OverlaySettings {
  logo: {
    enabled: boolean;
    url: string | null;
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
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

const OverlaySelector = ({ settings, onChange }: OverlaySelectorProps) => {
  const [activeTab, setActiveTab] = useState<"logo" | "lowerThird" | "breakingNews">("logo");
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

  const handleRemoveLogo = () => {
    onChange({
      ...settings,
      logo: { ...settings.logo, url: null, enabled: false },
    });
  };

  const overlayTabs = [
    { id: "logo" as const, label: "Logo", icon: Image },
    { id: "lowerThird" as const, label: "Lower Third", icon: Type },
    { id: "breakingNews" as const, label: "Breaking News", icon: AlertTriangle },
  ];

  const logoPositions = [
    { id: "top-left" as const, label: "Kiri Atas" },
    { id: "top-right" as const, label: "Kanan Atas" },
    { id: "bottom-left" as const, label: "Kiri Bawah" },
    { id: "bottom-right" as const, label: "Kanan Bawah" },
  ];

  const lowerThirdStyles = [
    { id: "modern" as const, label: "Modern", preview: "bg-gradient-to-r from-primary to-primary/80" },
    { id: "classic" as const, label: "Classic", preview: "bg-black/80" },
    { id: "minimal" as const, label: "Minimal", preview: "bg-white/90 text-black" },
  ];

  const breakingNewsStyles = [
    { id: "red" as const, label: "Merah", color: "bg-red-600" },
    { id: "blue" as const, label: "Biru", color: "bg-blue-600" },
    { id: "orange" as const, label: "Oranye", color: "bg-orange-500" },
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
          <p className="text-xs text-muted-foreground">Tambahkan logo, lower third, atau banner</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-secondary/50 rounded-lg">
        {overlayTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isEnabled = settings[tab.id].enabled;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all",
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
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Upload Logo
                  </Label>
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
                        onClick={handleRemoveLogo}
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
                      <p className="text-xs text-muted-foreground">
                        Klik untuk upload logo (PNG, JPG)
                      </p>
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
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Posisi Logo
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {logoPositions.map((pos) => (
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
              </motion.div>
            )}
          </>
        )}

        {/* Lower Third Tab */}
        {activeTab === "lowerThird" && (
          <>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Lower Third</Label>
              <button
                onClick={() =>
                  onChange({
                    ...settings,
                    lowerThird: { ...settings.lowerThird, enabled: !settings.lowerThird.enabled },
                  })
                }
                className={cn(
                  "w-10 h-6 rounded-full transition-colors relative",
                  settings.lowerThird.enabled ? "bg-primary" : "bg-muted"
                )}
              >
                <div
                  className={cn(
                    "absolute w-4 h-4 rounded-full bg-white top-1 transition-all",
                    settings.lowerThird.enabled ? "left-5" : "left-1"
                  )}
                />
              </button>
            </div>

            {settings.lowerThird.enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4"
              >
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Nama / Judul
                  </Label>
                  <Input
                    value={settings.lowerThird.title}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        lowerThird: { ...settings.lowerThird, title: e.target.value },
                      })
                    }
                    placeholder="Nama Reporter"
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Subtitle / Jabatan
                  </Label>
                  <Input
                    value={settings.lowerThird.subtitle}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        lowerThird: { ...settings.lowerThird, subtitle: e.target.value },
                      })
                    }
                    placeholder="Reporter Senior"
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Style
                  </Label>
                  <div className="flex gap-2">
                    {lowerThirdStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() =>
                          onChange({
                            ...settings,
                            lowerThird: { ...settings.lowerThird, style: style.id },
                          })
                        }
                        className={cn(
                          "flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border",
                          settings.lowerThird.style === style.id
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className={cn("h-4 rounded mb-1", style.preview)} />
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="p-3 bg-black/80 rounded-lg">
                  <p className="text-[10px] text-muted-foreground mb-2">Preview:</p>
                  <div
                    className={cn(
                      "inline-block px-3 py-1.5 rounded",
                      settings.lowerThird.style === "modern" && "bg-gradient-to-r from-primary to-primary/80 text-white",
                      settings.lowerThird.style === "classic" && "bg-black/90 text-white border-l-4 border-primary",
                      settings.lowerThird.style === "minimal" && "bg-white/95 text-black"
                    )}
                  >
                    <p className="text-xs font-semibold">
                      {settings.lowerThird.title || "Nama Reporter"}
                    </p>
                    <p className="text-[10px] opacity-80">
                      {settings.lowerThird.subtitle || "Reporter Senior"}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Breaking News Tab */}
        {activeTab === "breakingNews" && (
          <>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Breaking News Banner</Label>
              <button
                onClick={() =>
                  onChange({
                    ...settings,
                    breakingNews: { ...settings.breakingNews, enabled: !settings.breakingNews.enabled },
                  })
                }
                className={cn(
                  "w-10 h-6 rounded-full transition-colors relative",
                  settings.breakingNews.enabled ? "bg-primary" : "bg-muted"
                )}
              >
                <div
                  className={cn(
                    "absolute w-4 h-4 rounded-full bg-white top-1 transition-all",
                    settings.breakingNews.enabled ? "left-5" : "left-1"
                  )}
                />
              </button>
            </div>

            {settings.breakingNews.enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-4"
              >
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Teks Banner
                  </Label>
                  <Input
                    value={settings.breakingNews.text}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        breakingNews: { ...settings.breakingNews, text: e.target.value },
                      })
                    }
                    placeholder="BREAKING NEWS"
                    className="text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Warna Banner
                  </Label>
                  <div className="flex gap-2">
                    {breakingNewsStyles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() =>
                          onChange({
                            ...settings,
                            breakingNews: { ...settings.breakingNews, style: style.id },
                          })
                        }
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border",
                          settings.breakingNews.style === style.id
                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className={cn("w-4 h-4 rounded", style.color)} />
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="p-3 bg-black/80 rounded-lg">
                  <p className="text-[10px] text-muted-foreground mb-2">Preview:</p>
                  <div
                    className={cn(
                      "px-4 py-2 text-white text-xs font-bold text-center animate-pulse",
                      settings.breakingNews.style === "red" && "bg-red-600",
                      settings.breakingNews.style === "blue" && "bg-blue-600",
                      settings.breakingNews.style === "orange" && "bg-orange-500"
                    )}
                  >
                    {settings.breakingNews.text || "BREAKING NEWS"}
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </motion.div>

      {/* Active Overlays Summary */}
      {(settings.logo.enabled || settings.lowerThird.enabled || settings.breakingNews.enabled) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Aktif:</span>
          {settings.logo.enabled && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
              <Check className="w-3 h-3" /> Logo
            </span>
          )}
          {settings.lowerThird.enabled && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
              <Check className="w-3 h-3" /> Lower Third
            </span>
          )}
          {settings.breakingNews.enabled && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
              <Check className="w-3 h-3" /> Breaking News
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default OverlaySelector;
