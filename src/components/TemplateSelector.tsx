import { motion } from "framer-motion";
import { Layout, Check } from "lucide-react";

type TemplateType = "headline-top" | "minimal" | "breaking";

interface TemplateSelectorProps {
  selected: TemplateType;
  onChange: (template: TemplateType) => void;
}

const TemplateSelector = ({ selected, onChange }: TemplateSelectorProps) => {
  const templates = [
    {
      id: "headline-top" as TemplateType,
      name: "Headline Top",
      description: "Judul di atas, subtitle di bawah",
      preview: (
        <div className="w-full h-full bg-news-darker rounded-md flex flex-col p-2">
          <div className="h-3 w-16 bg-primary rounded-sm mb-1" />
          <div className="h-2 w-12 bg-primary/50 rounded-sm" />
          <div className="flex-1" />
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-foreground/80 rounded-sm" />
            <div className="h-1.5 w-3/4 bg-foreground/60 rounded-sm" />
          </div>
        </div>
      ),
    },
    {
      id: "minimal" as TemplateType,
      name: "Minimal",
      description: "Hanya subtitle, clean look",
      preview: (
        <div className="w-full h-full bg-news-darker rounded-md flex flex-col p-2">
          <div className="flex-1" />
          <div className="space-y-1">
            <div className="h-1.5 w-full bg-foreground/80 rounded-sm" />
            <div className="h-1.5 w-2/3 bg-foreground/60 rounded-sm" />
          </div>
        </div>
      ),
    },
    {
      id: "breaking" as TemplateType,
      name: "Breaking News",
      description: "Style berita breaking",
      preview: (
        <div className="w-full h-full bg-news-darker rounded-md flex flex-col p-2">
          <div className="h-2.5 w-14 gradient-news rounded-sm mb-1 flex items-center justify-center">
            <span className="text-[4px] text-primary-foreground font-bold">BREAKING</span>
          </div>
          <div className="h-2 w-16 bg-foreground/80 rounded-sm" />
          <div className="flex-1" />
          <div className="p-1 bg-primary/20 rounded-sm">
            <div className="h-1.5 w-full bg-foreground/80 rounded-sm" />
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
              className={`relative p-3 rounded-xl border-2 transition-all duration-300 ${
                isSelected
                  ? "border-primary bg-primary/10 shadow-glow"
                  : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className="aspect-[9/16] w-full mb-2">
                {template.preview}
              </div>
              <div className="text-center">
                <p className={`text-xs font-semibold ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
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
