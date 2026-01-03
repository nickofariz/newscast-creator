import { useState, useCallback, useRef } from "react";
import { SubtitleStyleSettings, DEFAULT_SUBTITLE_STYLE } from "@/components/SubtitlePreview";

interface SubtitleWord {
  text: string;
  start: number;
  end: number;
}

interface MediaFile {
  id: string;
  file: File;
  type: "video" | "image";
  previewUrl: string;
  duration?: number;
}

interface EditedClip {
  id: string;
  previewUrl: string;
  type: "video" | "image";
  startTime: number;
  endTime: number;
  effectiveDuration: number;
}

interface ExportOptions {
  mediaFiles: MediaFile[];
  editedClips: EditedClip[];
  subtitleWords: SubtitleWord[];
  audioUrl: string | null;
  audioDuration: number;
  subtitleStyle?: SubtitleStyleSettings;
  quality?: "720p" | "1080p";
}

interface ExportProgress {
  status: "idle" | "preparing" | "rendering" | "encoding" | "complete" | "error";
  progress: number; // 0-100
  message: string;
}

export const useVideoExporter = () => {
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    status: "idle",
    progress: 0,
    message: "",
  });
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const abortRef = useRef(false);

  const getActiveSubtitle = useCallback((
    subtitleWords: SubtitleWord[],
    currentTime: number,
    subtitleStyle: SubtitleStyleSettings
  ): { text: string; isActive: boolean }[] => {
    const contextSize = 4;
    const currentIndex = subtitleWords.findIndex(
      (word) => currentTime >= word.start && currentTime <= word.end
    );

    let startIdx: number;
    let endIdx: number;

    if (currentIndex === -1) {
      const nextWordIndex = subtitleWords.findIndex((word) => word.start > currentTime);
      if (nextWordIndex === -1) {
        startIdx = Math.max(0, subtitleWords.length - contextSize);
        endIdx = subtitleWords.length;
      } else if (nextWordIndex === 0) {
        startIdx = 0;
        endIdx = Math.min(subtitleWords.length, contextSize);
      } else {
        startIdx = Math.max(0, nextWordIndex - 2);
        endIdx = Math.min(subtitleWords.length, nextWordIndex + contextSize - 2);
      }
    } else {
      startIdx = Math.max(0, currentIndex - 2);
      endIdx = Math.min(subtitleWords.length, currentIndex + contextSize);
    }

    return subtitleWords.slice(startIdx, endIdx).map((w) => {
      const isActive = currentTime >= w.start && currentTime <= w.end;
      return { text: w.text, isActive };
    });
  }, []);

  const drawFrame = useCallback((
    ctx: CanvasRenderingContext2D,
    mediaElement: HTMLVideoElement | HTMLImageElement,
    subtitleWords: SubtitleWord[],
    currentTime: number,
    subtitleStyle: SubtitleStyleSettings,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    // Clear canvas
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw media (cover fit)
    const mediaWidth = mediaElement instanceof HTMLVideoElement ? mediaElement.videoWidth : mediaElement.naturalWidth;
    const mediaHeight = mediaElement instanceof HTMLVideoElement ? mediaElement.videoHeight : mediaElement.naturalHeight;
    
    const scale = Math.max(canvasWidth / mediaWidth, canvasHeight / mediaHeight);
    const scaledWidth = mediaWidth * scale;
    const scaledHeight = mediaHeight * scale;
    const x = (canvasWidth - scaledWidth) / 2;
    const y = (canvasHeight - scaledHeight) / 2;

    ctx.drawImage(mediaElement, x, y, scaledWidth, scaledHeight);

    // Draw subtitles
    if (subtitleWords.length > 0) {
      const activeWords = getActiveSubtitle(subtitleWords, currentTime, subtitleStyle);
      
      if (activeWords.length > 0) {
        // Map fontSize setting to pixel value
        const fontSizeMap = { small: 20, medium: 28, large: 36 };
        const fontSize = fontSizeMap[subtitleStyle.fontSize] || 28;
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.textAlign = "center";
        
        // Calculate subtitle position
        let subtitleY: number;
        switch (subtitleStyle.position) {
          case "top":
            subtitleY = canvasHeight * 0.15;
            break;
          case "center":
            subtitleY = canvasHeight * 0.5;
            break;
          case "bottom":
          default:
            subtitleY = canvasHeight * 0.85;
            break;
        }

        // Draw background
        const fullText = activeWords.map(w => w.text).join(" ");
        const metrics = ctx.measureText(fullText);
        const bgPadding = 12;
        const bgHeight = fontSize + bgPadding * 2;
        const bgWidth = metrics.width + bgPadding * 4;
        
        const opacity = (subtitleStyle.backgroundOpacity ?? 85) / 100;
        ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
        ctx.beginPath();
        ctx.roundRect(
          canvasWidth / 2 - bgWidth / 2,
          subtitleY - fontSize / 2 - bgPadding,
          bgWidth,
          bgHeight,
          8
        );
        ctx.fill();

        // Draw words
        let currentX = canvasWidth / 2 - metrics.width / 2;
        activeWords.forEach((word) => {
          const wordMetrics = ctx.measureText(word.text + " ");
          
          if (word.isActive) {
            ctx.fillStyle = subtitleStyle.highlightColor || "#DC2626";
          } else {
            ctx.fillStyle = "#ffffff";
          }
          
          ctx.fillText(word.text, currentX + wordMetrics.width / 2, subtitleY);
          currentX += wordMetrics.width;
        });
      }
    }
  }, [getActiveSubtitle]);

  const loadMedia = (src: string, type: "video" | "image"): Promise<HTMLVideoElement | HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (type === "video") {
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.preload = "auto";
        video.src = src;
        video.onloadeddata = () => resolve(video);
        video.onerror = reject;
      } else {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
      }
    });
  };

  const exportVideo = useCallback(async (options: ExportOptions): Promise<string | null> => {
    const {
      mediaFiles,
      editedClips,
      subtitleWords,
      audioUrl,
      audioDuration,
      subtitleStyle = DEFAULT_SUBTITLE_STYLE,
      quality = "720p",
    } = options;

    abortRef.current = false;
    recordedChunksRef.current = [];
    setExportedVideoUrl(null);

    try {
      setExportProgress({ status: "preparing", progress: 0, message: "Mempersiapkan canvas..." });

      // Create canvas
      const canvasWidth = quality === "1080p" ? 1080 : 720;
      const canvasHeight = quality === "1080p" ? 1920 : 1280;
      
      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      canvasRef.current = canvas;
      
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) throw new Error("Could not get canvas context");

      // Prepare clips
      const hasEditedClips = editedClips.length > 0;
      const clips = hasEditedClips ? editedClips : mediaFiles.map((m, i) => ({
        id: m.id,
        previewUrl: m.previewUrl,
        type: m.type,
        startTime: i * (audioDuration / mediaFiles.length),
        endTime: (i + 1) * (audioDuration / mediaFiles.length),
        effectiveDuration: audioDuration / mediaFiles.length,
      }));

      const totalDuration = audioDuration || clips.reduce((acc, c) => acc + c.effectiveDuration, 0);

      setExportProgress({ status: "preparing", progress: 10, message: "Memuat media..." });

      // Preload all media
      const mediaElements: (HTMLVideoElement | HTMLImageElement)[] = [];
      for (const clip of clips) {
        if (abortRef.current) throw new Error("Export cancelled");
        const element = await loadMedia(clip.previewUrl, clip.type);
        mediaElements.push(element);
      }

      setExportProgress({ status: "rendering", progress: 20, message: "Memulai render..." });

      // Setup MediaRecorder
      const stream = canvas.captureStream(30);
      
      // Add audio track if available
      let audioContext: AudioContext | null = null;
      let audioSource: MediaElementAudioSourceNode | null = null;
      let audioDestination: MediaStreamAudioDestinationNode | null = null;
      let audioElement: HTMLAudioElement | null = null;

      if (audioUrl) {
        audioContext = new AudioContext();
        audioDestination = audioContext.createMediaStreamDestination();
        
        audioElement = new Audio(audioUrl);
        audioElement.crossOrigin = "anonymous";
        await new Promise<void>((resolve) => {
          audioElement!.oncanplaythrough = () => resolve();
          audioElement!.load();
        });
        
        audioSource = audioContext.createMediaElementSource(audioElement);
        audioSource.connect(audioDestination);
        audioSource.connect(audioContext.destination);
        
        // Add audio track to stream
        audioDestination.stream.getAudioTracks().forEach(track => {
          stream.addTrack(track);
        });
      }

      // Determine supported codec
      const mimeTypes = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ];
      
      let selectedMimeType = "video/webm";
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMimeType = mime;
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: quality === "1080p" ? 8000000 : 5000000,
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      // Start recording
      mediaRecorder.start(100);
      if (audioElement) {
        audioElement.play();
      }

      // Render frames
      const fps = 30;
      const frameInterval = 1000 / fps;
      let currentTime = 0;
      const startRenderTime = Date.now();

      while (currentTime < totalDuration) {
        if (abortRef.current) {
          mediaRecorder.stop();
          throw new Error("Export cancelled");
        }

        // Find current clip
        let clipIndex = clips.findIndex(
          (c) => currentTime >= c.startTime && currentTime < c.endTime
        );
        if (clipIndex === -1) clipIndex = clips.length - 1;

        const mediaElement = mediaElements[clipIndex];
        
        // If video, seek to correct position
        if (mediaElement instanceof HTMLVideoElement) {
          const clip = clips[clipIndex];
          const offsetInClip = currentTime - clip.startTime;
          mediaElement.currentTime = offsetInClip;
          await new Promise(r => setTimeout(r, 10)); // Wait for seek
        }

        // Draw frame
        drawFrame(ctx, mediaElement, subtitleWords, currentTime, subtitleStyle, canvasWidth, canvasHeight);

        // Update progress
        const progress = 20 + (currentTime / totalDuration) * 70;
        setExportProgress({
          status: "rendering",
          progress: Math.min(90, progress),
          message: `Rendering ${Math.floor(currentTime)}s / ${Math.floor(totalDuration)}s`,
        });

        currentTime += 1 / fps;
        
        // Wait for next frame
        const elapsed = Date.now() - startRenderTime;
        const expectedTime = (currentTime * 1000);
        if (expectedTime > elapsed) {
          await new Promise((r) => setTimeout(r, Math.min(frameInterval, expectedTime - elapsed)));
        }
      }

      // Stop recording
      setExportProgress({ status: "encoding", progress: 95, message: "Finishing encoding..." });
      
      if (audioElement) {
        audioElement.pause();
      }
      
      await new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => resolve();
        mediaRecorder.stop();
      });

      // Cleanup audio
      if (audioSource) audioSource.disconnect();
      if (audioContext) audioContext.close();

      // Create blob and URL
      const blob = new Blob(recordedChunksRef.current, { type: selectedMimeType });
      const url = URL.createObjectURL(blob);
      
      setExportedVideoUrl(url);
      setExportProgress({ status: "complete", progress: 100, message: "Export selesai!" });
      
      return url;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export failed";
      setExportProgress({ status: "error", progress: 0, message });
      return null;
    }
  }, [drawFrame]);

  const cancelExport = useCallback(() => {
    abortRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setExportProgress({ status: "idle", progress: 0, message: "" });
  }, []);

  const downloadVideo = useCallback((filename: string = "video-with-subtitle.webm") => {
    if (!exportedVideoUrl) return;
    
    const a = document.createElement("a");
    a.href = exportedVideoUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [exportedVideoUrl]);

  const resetExport = useCallback(() => {
    if (exportedVideoUrl) {
      URL.revokeObjectURL(exportedVideoUrl);
    }
    setExportedVideoUrl(null);
    setExportProgress({ status: "idle", progress: 0, message: "" });
    recordedChunksRef.current = [];
  }, [exportedVideoUrl]);

  return {
    exportVideo,
    cancelExport,
    downloadVideo,
    resetExport,
    exportProgress,
    exportedVideoUrl,
    isExporting: exportProgress.status !== "idle" && exportProgress.status !== "complete" && exportProgress.status !== "error",
  };
};
