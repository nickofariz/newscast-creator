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
  format?: "webm" | "mp4";
  bitrate?: "low" | "medium" | "high";
}

interface ExportProgress {
  status: "idle" | "preparing" | "rendering" | "encoding" | "complete" | "error";
  progress: number;
  message: string;
  eta?: string;
}

export const useVideoExporter = () => {
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    status: "idle",
    progress: 0,
    message: "",
    eta: undefined,
  });
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const exportStartTimeRef = useRef<number>(0);
  const abortRef = useRef(false);

  const formatEta = (seconds: number): string => {
    if (seconds <= 0 || !isFinite(seconds)) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    if (mins > 0) {
      return `~${mins}m ${secs}s remaining`;
    }
    return `~${secs}s remaining`;
  };

  const calculateEta = (progress: number): string => {
    if (progress <= 0 || exportStartTimeRef.current === 0) return "";
    const elapsed = (Date.now() - exportStartTimeRef.current) / 1000;
    const totalEstimate = (elapsed / progress) * 100;
    const remaining = totalEstimate - elapsed;
    return formatEta(remaining);
  };

  const getActiveSubtitle = useCallback(
    (
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
    },
    []
  );

  const drawFrame = useCallback(
    (
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
      const mediaWidth =
        mediaElement instanceof HTMLVideoElement
          ? mediaElement.videoWidth
          : mediaElement.naturalWidth;
      const mediaHeight =
        mediaElement instanceof HTMLVideoElement
          ? mediaElement.videoHeight
          : mediaElement.naturalHeight;

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
          const fontSizeMap = { small: 20, medium: 28, large: 36 };
          const fontSize = fontSizeMap[subtitleStyle.fontSize] || 28;
          ctx.font = `bold ${fontSize}px Arial, sans-serif`;
          ctx.textAlign = "center";

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

          const fullText = activeWords.map((w) => w.text).join(" ");
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
    },
    [getActiveSubtitle]
  );

  const loadMedia = (
    src: string,
    type: "video" | "image"
  ): Promise<HTMLVideoElement | HTMLImageElement> => {
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

  const seekVideo = (video: HTMLVideoElement, time: number): Promise<void> => {
    return new Promise((resolve) => {
      if (Math.abs(video.currentTime - time) < 0.01) {
        resolve();
        return;
      }
      const onSeeked = () => {
        video.removeEventListener("seeked", onSeeked);
        resolve();
      };
      video.addEventListener("seeked", onSeeked);
      video.currentTime = time;
    });
  };

  const exportVideo = useCallback(
    async (options: ExportOptions): Promise<string | null> => {
      const {
        mediaFiles,
        editedClips,
        subtitleWords,
        audioUrl,
        audioDuration,
        subtitleStyle = DEFAULT_SUBTITLE_STYLE,
        quality = "720p",
        bitrate = "medium",
      } = options;

      const bitrateMap = { low: 1_000_000, medium: 2_500_000, high: 5_000_000 };
      const videoBitrate = bitrateMap[bitrate];

      abortRef.current = false;
      setExportedVideoUrl(null);
      exportStartTimeRef.current = Date.now();

      try {
        // Phase 1: Prepare
        setExportProgress({
          status: "preparing",
          progress: 5,
          message: "Mempersiapkan canvas...",
          eta: undefined,
        });

        const canvasWidth = quality === "1080p" ? 1080 : 720;
        const canvasHeight = quality === "1080p" ? 1920 : 1280;

        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) throw new Error("Could not get canvas context");

        // Prepare clips
        const hasEditedClips = editedClips.length > 0;
        const clips = hasEditedClips
          ? editedClips
          : mediaFiles.map((m, i) => ({
              id: m.id,
              previewUrl: m.previewUrl,
              type: m.type,
              startTime: i * (audioDuration / mediaFiles.length),
              endTime: (i + 1) * (audioDuration / mediaFiles.length),
              effectiveDuration: audioDuration / mediaFiles.length,
            }));

        const totalDuration =
          audioDuration || clips.reduce((acc, c) => acc + c.effectiveDuration, 0);

        // Phase 2: Load Media
        setExportProgress({
          status: "preparing",
          progress: 10,
          message: "Memuat media...",
          eta: calculateEta(10),
        });

        const mediaElements: (HTMLVideoElement | HTMLImageElement)[] = [];
        for (const clip of clips) {
          if (abortRef.current) throw new Error("Export cancelled");
          const element = await loadMedia(clip.previewUrl, clip.type);
          mediaElements.push(element);
        }

        // Load audio if available
        let audioElement: HTMLAudioElement | null = null;
        if (audioUrl) {
          audioElement = new Audio(audioUrl);
          audioElement.crossOrigin = "anonymous";
          await new Promise<void>((resolve, reject) => {
            audioElement!.oncanplaythrough = () => resolve();
            audioElement!.onerror = reject;
            audioElement!.load();
          });
        }

        // Phase 3: Setup MediaRecorder (Native browser API - FAST!)
        setExportProgress({
          status: "preparing",
          progress: 15,
          message: "Mempersiapkan recorder...",
          eta: calculateEta(15),
        });

        const canvasStream = canvas.captureStream(30);
        
        // Add audio track if available
        if (audioElement) {
          const audioContext = new AudioContext();
          const source = audioContext.createMediaElementSource(audioElement);
          const dest = audioContext.createMediaStreamDestination();
          source.connect(dest);
          source.connect(audioContext.destination);
          
          dest.stream.getAudioTracks().forEach(track => {
            canvasStream.addTrack(track);
          });
        }

        // Use WebM for fastest encoding
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm';

        const mediaRecorder = new MediaRecorder(canvasStream, {
          mimeType,
          videoBitsPerSecond: videoBitrate,
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        // Phase 4: Render in realtime
        setExportProgress({
          status: "rendering",
          progress: 20,
          message: "Merender video...",
          eta: calculateEta(20),
        });

        const fps = 30;
        const frameDuration = 1000 / fps;
        let currentTime = 0;

        // Start recording
        mediaRecorder.start(100); // Collect data every 100ms

        // Start audio playback
        if (audioElement) {
          audioElement.currentTime = 0;
          audioElement.play();
        }

        // Render frames
        while (currentTime < totalDuration) {
          if (abortRef.current) {
            mediaRecorder.stop();
            if (audioElement) audioElement.pause();
            throw new Error("Export cancelled");
          }

          // Find current clip
          let clipIndex = clips.findIndex(
            (c) => currentTime >= c.startTime && currentTime < c.endTime
          );
          if (clipIndex === -1) clipIndex = Math.max(0, clips.length - 1);

          const mediaElement = mediaElements[clipIndex];
          const clip = clips[clipIndex];

          // If video, seek to correct position
          if (mediaElement instanceof HTMLVideoElement) {
            const offsetInClip = currentTime - clip.startTime;
            await seekVideo(mediaElement, offsetInClip);
          }

          // Draw frame
          drawFrame(
            ctx,
            mediaElement,
            subtitleWords,
            currentTime,
            subtitleStyle,
            canvasWidth,
            canvasHeight
          );

          // Advance time
          currentTime += frameDuration / 1000;

          // Update progress
          const progress = 20 + (currentTime / totalDuration) * 70;
          setExportProgress({
            status: "rendering",
            progress: Math.min(90, progress),
            message: `Merender ${Math.round((currentTime / totalDuration) * 100)}%`,
            eta: calculateEta(progress),
          });

          // Wait for next frame (rendering at ~30fps)
          await new Promise(resolve => setTimeout(resolve, frameDuration / 3));
        }

        // Stop recording
        if (audioElement) audioElement.pause();
        
        setExportProgress({
          status: "encoding",
          progress: 92,
          message: "Menyelesaikan export...",
          eta: "Hampir selesai!",
        });

        // Wait for mediaRecorder to finish
        const videoBlob = await new Promise<Blob>((resolve) => {
          mediaRecorder.onstop = () => {
            resolve(new Blob(chunks, { type: mimeType }));
          };
          mediaRecorder.stop();
        });

        const url = URL.createObjectURL(videoBlob);
        setExportedVideoUrl(url);
        
        setExportProgress({
          status: "complete",
          progress: 100,
          message: "Export selesai!",
        });

        return url;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Export failed";
        setExportProgress({ status: "error", progress: 0, message });
        return null;
      }
    },
    [drawFrame]
  );

  const cancelExport = useCallback(() => {
    abortRef.current = true;
    setExportProgress({ status: "idle", progress: 0, message: "" });
  }, []);

  const downloadVideo = useCallback(
    (filename: string = "video-with-subtitle.webm") => {
      if (!exportedVideoUrl) return;

      const a = document.createElement("a");
      a.href = exportedVideoUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },
    [exportedVideoUrl]
  );

  const resetExport = useCallback(() => {
    if (exportedVideoUrl) {
      URL.revokeObjectURL(exportedVideoUrl);
    }
    setExportedVideoUrl(null);
    setExportProgress({ status: "idle", progress: 0, message: "" });
  }, [exportedVideoUrl]);

  // No preload needed - using native MediaRecorder
  const preloadFFmpeg = useCallback(() => {
    // Native API - no preload required
  }, []);

  return {
    exportVideo,
    cancelExport,
    downloadVideo,
    resetExport,
    preloadFFmpeg,
    exportProgress,
    exportedVideoUrl,
    isExporting:
      exportProgress.status !== "idle" &&
      exportProgress.status !== "complete" &&
      exportProgress.status !== "error",
    isFFmpegLoaded: true, // Always ready with native API
  };
};
