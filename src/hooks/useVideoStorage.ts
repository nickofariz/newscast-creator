import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StoredVideo {
  id: string;
  title: string;
  video_url: string;
  audio_url: string | null;
  subtitle_url: string | null;
  duration: number;
  template: string;
  voice: string;
  status: string;
  created_at: string;
}

interface UseVideoStorageReturn {
  videos: StoredVideo[];
  isLoading: boolean;
  isSaving: boolean;
  fetchVideos: () => Promise<void>;
  saveVideo: (params: SaveVideoParams) => Promise<StoredVideo | null>;
  deleteVideo: (id: string) => Promise<boolean>;
  uploadFile: (file: Blob, path: string) => Promise<string | null>;
}

interface SaveVideoParams {
  title: string;
  videoBlob?: Blob;
  audioUrl?: string;
  subtitleWords?: { text: string; start: number; end: number }[];
  duration: number;
  template: string;
  voice: string;
}

export function useVideoStorage(): UseVideoStorageReturn {
  const [videos, setVideos] = useState<StoredVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast.error("Gagal memuat daftar video");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const uploadFile = useCallback(async (file: Blob, path: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from("videos")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("videos")
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      return null;
    }
  }, []);

  const saveVideo = useCallback(async (params: SaveVideoParams): Promise<StoredVideo | null> => {
    setIsSaving(true);
    try {
      const timestamp = Date.now();
      const basePath = `${timestamp}`;

      let videoUrl = "";
      let audioUrl: string | null = null;
      let subtitleUrl: string | null = null;

      // Upload video if provided (WebM format from MediaRecorder)
      if (params.videoBlob) {
        const uploadedUrl = await uploadFile(params.videoBlob, `${basePath}/video.webm`);
        if (uploadedUrl) {
          videoUrl = uploadedUrl;
        }
      }

      // Upload audio if provided (convert from data URL to blob)
      if (params.audioUrl) {
        const audioResponse = await fetch(params.audioUrl);
        const audioBlob = await audioResponse.blob();
        const uploadedAudioUrl = await uploadFile(audioBlob, `${basePath}/audio.mp3`);
        if (uploadedAudioUrl) {
          audioUrl = uploadedAudioUrl;
        }
      }

      // Upload subtitles as SRT file if provided
      if (params.subtitleWords && params.subtitleWords.length > 0) {
        const srtContent = generateSRT(params.subtitleWords);
        const srtBlob = new Blob([srtContent], { type: "text/srt" });
        const uploadedSubtitleUrl = await uploadFile(srtBlob, `${basePath}/subtitle.srt`);
        if (uploadedSubtitleUrl) {
          subtitleUrl = uploadedSubtitleUrl;
        }
      }

      // Save metadata to database
      const { data, error } = await supabase
        .from("videos")
        .insert({
          title: params.title,
          video_url: videoUrl || "pending",
          audio_url: audioUrl,
          subtitle_url: subtitleUrl,
          duration: params.duration,
          template: params.template,
          voice: params.voice,
          status: "completed",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Video berhasil disimpan ke cloud!");
      await fetchVideos();
      return data;
    } catch (error) {
      console.error("Error saving video:", error);
      toast.error("Gagal menyimpan video");
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [uploadFile, fetchVideos]);

  const deleteVideo = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("videos")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setVideos((prev) => prev.filter((v) => v.id !== id));
      toast.success("Video berhasil dihapus");
      return true;
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Gagal menghapus video");
      return false;
    }
  }, []);

  // Fetch videos on mount
  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  return {
    videos,
    isLoading,
    isSaving,
    fetchVideos,
    saveVideo,
    deleteVideo,
    uploadFile,
  };
}

// Helper function to generate SRT content
function generateSRT(words: { text: string; start: number; end: number }[]): string {
  return words.reduce((acc, word, index) => {
    const startTime = formatSRTTime(word.start);
    const endTime = formatSRTTime(word.end);
    return acc + `${index + 1}\n${startTime} --> ${endTime}\n${word.text}\n\n`;
  }, "");
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
}
