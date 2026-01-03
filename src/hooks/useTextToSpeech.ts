import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";

export interface VoiceSettingsValues {
  speed: number;
  stability: number;
  similarity: number;
  style: number;
}

interface UseTextToSpeechReturn {
  generateSpeech: (text: string, voiceId: string, voiceSettings?: VoiceSettingsValues) => Promise<string | null>;
  isGenerating: boolean;
  audioUrl: string | null;
  playAudio: () => void;
  pauseAudio: () => void;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const generateSpeech = useCallback(async (
    text: string, 
    voiceId: string,
    voiceSettings?: VoiceSettingsValues
  ): Promise<string | null> => {
    if (!text.trim()) {
      toast.error("Teks tidak boleh kosong");
      return null;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, voiceId, voiceSettings }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal generate audio");
      }

      const data = await response.json();
      
      // Clean up previous audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      // Create audio URL from base64
      const url = `data:audio/mpeg;base64,${data.audioContent}`;
      setAudioUrl(url);

      // Create audio element for playback
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration);
      });

      audio.addEventListener("timeupdate", () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });

      toast.success("Audio berhasil di-generate!");
      return url;
    } catch (error) {
      console.error("TTS error:", error);
      toast.error(error instanceof Error ? error.message : "Gagal generate audio");
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [audioUrl]);

  const playAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  return {
    generateSpeech,
    isGenerating,
    audioUrl,
    playAudio,
    pauseAudio,
    isPlaying,
    duration,
    currentTime,
  };
}
