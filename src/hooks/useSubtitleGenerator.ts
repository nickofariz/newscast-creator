import { useState, useCallback } from "react";
import { toast } from "sonner";

export interface SubtitleWord {
  text: string;
  start: number;
  end: number;
}

interface UseSubtitleGeneratorReturn {
  generateSubtitles: (audioUrl: string) => Promise<SubtitleWord[] | null>;
  isGenerating: boolean;
  words: SubtitleWord[];
  downloadSRT: () => void;
}

export function useSubtitleGenerator(): UseSubtitleGeneratorReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [words, setWords] = useState<SubtitleWord[]>([]);

  const generateSubtitles = useCallback(async (audioUrl: string): Promise<SubtitleWord[] | null> => {
    if (!audioUrl) {
      toast.error("Generate audio terlebih dahulu");
      return null;
    }

    setIsGenerating(true);

    try {
      // Fetch the audio from the data URL and convert to blob
      const response = await fetch(audioUrl);
      const audioBlob = await response.blob();
      
      // Create FormData with audio file
      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.mp3");

      const transcribeResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
        {
          method: "POST",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json();
        throw new Error(errorData.error || "Gagal generate subtitle");
      }

      const data = await transcribeResponse.json();
      
      // Map the words from the API response
      const subtitleWords: SubtitleWord[] = (data.words || []).map((word: { text: string; start: number; end: number }) => ({
        text: word.text,
        start: word.start,
        end: word.end,
      }));

      setWords(subtitleWords);
      toast.success("Subtitle berhasil di-generate!");
      return subtitleWords;
    } catch (error) {
      console.error("Subtitle generation error:", error);
      toast.error(error instanceof Error ? error.message : "Gagal generate subtitle");
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const downloadSRT = useCallback(() => {
    if (words.length === 0) {
      toast.error("Tidak ada subtitle untuk di-download");
      return;
    }

    // Generate SRT format
    const srtContent = words.reduce((acc, word, index) => {
      const startTime = formatSRTTime(word.start);
      const endTime = formatSRTTime(word.end);
      return acc + `${index + 1}\n${startTime} --> ${endTime}\n${word.text}\n\n`;
    }, "");

    // Create and download file
    const blob = new Blob([srtContent], { type: "text/srt" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subtitle.srt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Subtitle downloaded!");
  }, [words]);

  return {
    generateSubtitles,
    isGenerating,
    words,
    downloadSRT,
  };
}

// Convert seconds to SRT time format (HH:MM:SS,mmm)
function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
}
