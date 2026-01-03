import { motion } from "framer-motion";
import { Subtitles, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface SubtitleWord {
  text: string;
  start: number;
  end: number;
}

interface SubtitlePreviewProps {
  words: SubtitleWord[];
  isGenerating: boolean;
  currentTime: number;
  onGenerate: () => void;
  disabled: boolean;
  onDownloadSRT: () => void;
}

const SubtitlePreview = ({
  words,
  isGenerating,
  currentTime,
  onGenerate,
  disabled,
  onDownloadSRT,
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="space-y-3"
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
    </motion.div>
  );
};

export default SubtitlePreview;
