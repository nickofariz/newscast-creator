import { motion } from "framer-motion";
import { Layout, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type TemplateType = "headline-top" | "minimal" | "breaking";
type VideoFormatType = "short" | "tv";

interface TemplateSelectorProps {
  selected: TemplateType;
  onChange: (template: TemplateType) => void;
  videoFormat?: VideoFormatType;
}

const TemplateSelector = ({ selected, onChange, videoFormat = "short" }: TemplateSelectorProps) => {
  const isTV = videoFormat === "tv";
  
  const templates = [
    {
      id: "headline-top" as TemplateType,
      name: "Headline Top",
      description: isTV ? "Judul di atas layar lebar" : "Judul di atas, subtitle di bawah",
      preview: (
        <div className={cn(
          "w-full h-full bg-news-darker rounded-md flex flex-col p-2",
          isTV ? "aspect-video" : "aspect-[9/16]"
        )}>
          <div className={cn("bg-primary rounded-sm mb-1", isTV ? "h-2 w-20" : "h-3 w-16")} />
          <div className={cn("bg-primary/50 rounded-sm", isTV ? "h-1.5 w-16" : "h-2 w-12")} />
          <div className="flex-1" />
          <div className="space-y-1">
            <div className={cn("w-full bg-foreground/80 rounded-sm", isTV ? "h-1" : "h-1.5")} />
            <div className={cn("bg-foreground/60 rounded-sm", isTV ? "h-1 w-4/5" : "h-1.5 w-3/4")} />
          </div>
        </div>
      ),
    },
    {
      id: "minimal" as TemplateType,
      name: "Minimal",
      description: isTV ? "Clean look untuk TV" : "Hanya subtitle, clean look",
      preview: (
        <div className={cn(
          "w-full h-full bg-news-darker rounded-md flex flex-col p-2",
          isTV ? "aspect-video" : "aspect-[9/16]"
        )}>
          <div className="flex-1" />
          <div className="space-y-1">
            <div className={cn("w-full bg-foreground/80 rounded-sm", isTV ? "h-1" : "h-1.5")} />
            <div className={cn("bg-foreground/60 rounded-sm", isTV ? "h-1 w-3/4" : "h-1.5 w-2/3")} />
          </div>
        </div>
      ),
    },
    {
      id: "breaking" as TemplateType,
      name: "Breaking News",
      description: isTV ? "Style breaking untuk TV" : "Style berita breaking",
      preview: (
        <div className={cn(
          "w-full h-full bg-news-darker rounded-md flex flex-col p-2",
          isTV ? "aspect-video" : "aspect-[9/16]"
        )}>
          <div className={cn(
            "gradient-news rounded-sm mb-1 flex items-center justify-center",
            isTV ? "h-2 w-20" : "h-2.5 w-14"
          )}>
            <span className="text-[4px] text-primary-foreground font-bold">BREAKING</span>
          </div>
          <div className={cn("bg-foreground/80 rounded-sm", isTV ? "h-1.5 w-24" : "h-2 w-16")} />
          <div className="flex-1" />
          <div className={cn("p-1 bg-primary/20 rounded-sm", isTV ? "mx-2" : "")}>
            <div className={cn("w-full bg-foreground/80 rounded-sm", isTV ? "h-1" : "h-1.5")} />
          </div>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="space-y-3"
    >
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Layout className="w-4 h-4 text-primary" />
        Template Video
        <span className="text-xs text-muted-foreground">
          ({isTV ? "16:9 Landscape" : "9:16 Portrait"})
        </span>
      </label>

      <div className="grid grid-cols-3 gap-3">
        {templates.map((template) => {
          const isSelected = selected === template.id;

          return (
            <motion.button
              key={template.id}
              onClick={() => onChange(template.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "relative p-3 rounded-xl border-2 transition-all duration-300",
                isSelected
                  ? "border-primary bg-primary/10 shadow-glow"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div className={cn(
                "w-full mb-2",
                isTV ? "aspect-video" : "aspect-[9/16]"
              )}>
                {template.preview}
              </div>
              <div className="text-center">
                <p className={cn(
                  "text-xs font-semibold",
                  isSelected ? "text-foreground" : "text-muted-foreground"
                )}>
                  {template.name}
                </p>
              </div>

              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full gradient-news flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-primary-foreground" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default TemplateSelector;
