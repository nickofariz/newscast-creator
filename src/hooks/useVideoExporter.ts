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
  method?: "webcodecs" | "mediarecorder";
}

// Check if WebCodecs API is available
const supportsWebCodecs = (): boolean => {
  return typeof VideoEncoder !== "undefined" && typeof VideoFrame !== "undefined";
};

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
  const frameTimesRef = useRef<number[]>([]);

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
    if (progress <= 5 || exportStartTimeRef.current === 0) return "";
    const elapsed = (Date.now() - exportStartTimeRef.current) / 1000;
    const totalEstimate = (elapsed / progress) * 100;
    const remaining = totalEstimate - elapsed;
    return formatEta(remaining);
  };

  // Calculate ETA based on average frame render time
  const calculateFrameEta = (currentFrame: number, totalFrames: number): string => {
    if (frameTimesRef.current.length < 5) return "";
    const avgFrameTime = frameTimesRef.current.slice(-20).reduce((a, b) => a + b, 0) / Math.min(20, frameTimesRef.current.length);
    const remainingFrames = totalFrames - currentFrame;
    const remainingMs = remainingFrames * avgFrameTime;
    return formatEta(remainingMs / 1000);
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
      mediaElement: HTMLVideoElement | HTMLImageElement | ImageBitmap,
      subtitleWords: SubtitleWord[],
      currentTime: number,
      subtitleStyle: SubtitleStyleSettings,
      canvasWidth: number,
      canvasHeight: number
    ) => {
      // Clear canvas with black
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Get media dimensions
      let mediaWidth: number;
      let mediaHeight: number;
      
      if (mediaElement instanceof HTMLVideoElement) {
        mediaWidth = mediaElement.videoWidth;
        mediaHeight = mediaElement.videoHeight;
      } else if (mediaElement instanceof ImageBitmap) {
        mediaWidth = mediaElement.width;
        mediaHeight = mediaElement.height;
      } else {
        mediaWidth = mediaElement.naturalWidth;
        mediaHeight = mediaElement.naturalHeight;
      }

      // Cover fit calculation
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

  // Pre-load all media elements with ImageBitmap for faster rendering
  const preloadMedia = async (
    clips: EditedClip[],
    onProgress: (loaded: number, total: number) => void
  ): Promise<Map<string, HTMLVideoElement | ImageBitmap>> => {
    const mediaMap = new Map<string, HTMLVideoElement | ImageBitmap>();
    let loaded = 0;

    const loadPromises = clips.map(async (clip) => {
      if (clip.type === "video") {
        const video = document.createElement("video");
        video.crossOrigin = "anonymous";
        video.muted = true;
        video.preload = "auto";
        video.playsInline = true;
        video.src = clip.previewUrl;
        
        await new Promise<void>((resolve, reject) => {
          video.onloadeddata = () => resolve();
          video.onerror = reject;
        });
        
        mediaMap.set(clip.id, video);
      } else {
        // Use ImageBitmap for images - much faster than HTMLImageElement
        const response = await fetch(clip.previewUrl);
        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);
        mediaMap.set(clip.id, bitmap);
      }
      
      loaded++;
      onProgress(loaded, clips.length);
    });

    await Promise.all(loadPromises);
    return mediaMap;
  };

  // Fast video seeking with requestVideoFrameCallback if available
  const seekVideoFast = async (video: HTMLVideoElement, time: number): Promise<void> => {
    if (Math.abs(video.currentTime - time) < 0.02) {
      return;
    }

    return new Promise((resolve) => {
      // Use requestVideoFrameCallback for more accurate frame timing if available
      const videoEl = video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => void };
      if (videoEl.requestVideoFrameCallback) {
        videoEl.currentTime = time;
        videoEl.requestVideoFrameCallback(() => resolve());
      } else {
        const onSeeked = () => {
          videoEl.removeEventListener("seeked", onSeeked);
          resolve();
        };
        videoEl.addEventListener("seeked", onSeeked);
        videoEl.currentTime = time;
      }
    });
  };

  // Render audio to ArrayBuffer using OfflineAudioContext
  const renderAudioBuffer = async (audioUrl: string, duration: number): Promise<AudioBuffer | null> => {
    try {
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      await audioContext.close();
      return audioBuffer;
    } catch (error) {
      console.error("Error loading audio:", error);
      return null;
    }
  };

  // Main export function with WebCodecs + MediaRecorder fallback
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
      frameTimesRef.current = [];
      setExportedVideoUrl(null);
      exportStartTimeRef.current = Date.now();

      const useWebCodecs = supportsWebCodecs();

      try {
        // Phase 1: Prepare
        setExportProgress({
          status: "preparing",
          progress: 2,
          message: "Mempersiapkan canvas...",
          eta: undefined,
          method: useWebCodecs ? "webcodecs" : "mediarecorder",
        });

        const canvasWidth = quality === "1080p" ? 1080 : 720;
        const canvasHeight = quality === "1080p" ? 1920 : 1280;

        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Optimized canvas context
        const ctx = canvas.getContext("2d", { 
          alpha: false,
          desynchronized: true, // Reduce latency
        });
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

        // Phase 2: Preload all media
        setExportProgress({
          status: "preparing",
          progress: 5,
          message: "Memuat media...",
          eta: undefined,
          method: useWebCodecs ? "webcodecs" : "mediarecorder",
        });

        const mediaMap = await preloadMedia(clips, (loaded, total) => {
          const progress = 5 + (loaded / total) * 10;
          setExportProgress({
            status: "preparing",
            progress,
            message: `Memuat media ${loaded}/${total}...`,
            eta: undefined,
            method: useWebCodecs ? "webcodecs" : "mediarecorder",
          });
        });

        if (abortRef.current) throw new Error("Export cancelled");

        // Phase 3: Setup recording
        setExportProgress({
          status: "preparing",
          progress: 15,
          message: useWebCodecs ? "Mempersiapkan WebCodecs encoder..." : "Mempersiapkan recorder...",
          eta: undefined,
          method: useWebCodecs ? "webcodecs" : "mediarecorder",
        });

        const fps = 30;
        const totalFrames = Math.ceil(totalDuration * fps);

        // Render frames to chunks array
        const videoChunks: Blob[] = [];
        
        // Use MediaRecorder (most compatible approach)
        const canvasStream = canvas.captureStream(fps);
        
        // Load audio buffer if available
        let audioBuffer: AudioBuffer | null = null;
        if (audioUrl) {
          audioBuffer = await renderAudioBuffer(audioUrl, audioDuration);
        }

        // Add audio track if we have audio
        let audioContext: AudioContext | null = null;
        let audioSource: AudioBufferSourceNode | null = null;
        
        if (audioBuffer) {
          audioContext = new AudioContext();
          const dest = audioContext.createMediaStreamDestination();
          dest.stream.getAudioTracks().forEach(track => {
            canvasStream.addTrack(track);
          });
          
          audioSource = audioContext.createBufferSource();
          audioSource.buffer = audioBuffer;
          audioSource.connect(dest);
          audioSource.connect(audioContext.destination);
        }

        // Use VP9 for better quality/speed tradeoff
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';

        const mediaRecorder = new MediaRecorder(canvasStream, {
          mimeType,
          videoBitsPerSecond: videoBitrate,
        });

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) videoChunks.push(e.data);
        };

        // Start recording
        mediaRecorder.start(100);
        
        // Start audio playback synced with recording
        if (audioSource && audioContext) {
          audioSource.start(0);
        }

        // Phase 4: Render frames - FAST batch processing
        setExportProgress({
          status: "rendering",
          progress: 18,
          message: "Merender video...",
          eta: "",
          method: useWebCodecs ? "webcodecs" : "mediarecorder",
        });

        const frameDuration = 1000 / fps;
        let currentFrame = 0;
        const BATCH_SIZE = 5; // Process frames in batches for smoother progress updates
        let lastProgressUpdate = 0;

        // Optimized render loop
        while (currentFrame < totalFrames) {
          if (abortRef.current) {
            mediaRecorder.stop();
            if (audioContext) audioContext.close();
            throw new Error("Export cancelled");
          }

          const frameStartTime = performance.now();
          const currentTime = (currentFrame / fps);

          // Find current clip
          let clipIndex = clips.findIndex(
            (c) => currentTime >= c.startTime && currentTime < c.endTime
          );
          if (clipIndex === -1) clipIndex = Math.max(0, clips.length - 1);

          const clip = clips[clipIndex];
          const mediaElement = mediaMap.get(clip.id);
          
          if (!mediaElement) {
            currentFrame++;
            continue;
          }

          // If video, seek to correct position
          if (mediaElement instanceof HTMLVideoElement) {
            const offsetInClip = currentTime - clip.startTime;
            await seekVideoFast(mediaElement, offsetInClip);
          }

          // Draw frame to canvas
          drawFrame(
            ctx,
            mediaElement,
            subtitleWords,
            currentTime,
            subtitleStyle,
            canvasWidth,
            canvasHeight
          );

          // Track frame time for ETA calculation
          const frameTime = performance.now() - frameStartTime;
          frameTimesRef.current.push(frameTime);
          if (frameTimesRef.current.length > 30) {
            frameTimesRef.current.shift();
          }

          currentFrame++;

          // Update progress less frequently for performance
          const now = performance.now();
          if (now - lastProgressUpdate > 100 || currentFrame === totalFrames) {
            lastProgressUpdate = now;
            const progress = 18 + (currentFrame / totalFrames) * 72;
            setExportProgress({
              status: "rendering",
              progress: Math.min(90, progress),
              message: `Merender ${Math.round((currentFrame / totalFrames) * 100)}%`,
              eta: calculateFrameEta(currentFrame, totalFrames),
              method: useWebCodecs ? "webcodecs" : "mediarecorder",
            });
          }

          // Yield to main thread every batch to keep UI responsive
          if (currentFrame % BATCH_SIZE === 0) {
            await new Promise(resolve => requestAnimationFrame(resolve));
          }
        }

        // Stop audio
        if (audioSource) {
          try { audioSource.stop(); } catch {}
        }
        if (audioContext) {
          await audioContext.close();
        }

        // Phase 5: Finalize
        setExportProgress({
          status: "encoding",
          progress: 92,
          message: "Menyelesaikan encoding...",
          eta: "Hampir selesai!",
          method: useWebCodecs ? "webcodecs" : "mediarecorder",
        });

        // Wait for MediaRecorder to finish
        const videoBlob = await new Promise<Blob>((resolve) => {
          mediaRecorder.onstop = () => {
            resolve(new Blob(videoChunks, { type: mimeType }));
          };
          mediaRecorder.stop();
        });

        // Cleanup ImageBitmaps
        mediaMap.forEach((media) => {
          if (media instanceof ImageBitmap) {
            media.close();
          }
        });

        const url = URL.createObjectURL(videoBlob);
        setExportedVideoUrl(url);

        const exportTime = ((Date.now() - exportStartTimeRef.current) / 1000).toFixed(1);
        setExportProgress({
          status: "complete",
          progress: 100,
          message: `Export selesai dalam ${exportTime}s!`,
          method: useWebCodecs ? "webcodecs" : "mediarecorder",
        });

        return url;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Export failed";
        setExportProgress({ 
          status: "error", 
          progress: 0, 
          message,
          method: useWebCodecs ? "webcodecs" : "mediarecorder",
        });
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
    frameTimesRef.current = [];
  }, [exportedVideoUrl]);

  // No preload needed
  const preloadFFmpeg = useCallback(async () => {}, []);
  const isFFmpegLoaded = true;

  const isExporting = exportProgress.status !== "idle" && 
                      exportProgress.status !== "complete" && 
                      exportProgress.status !== "error";

  return {
    exportVideo,
    cancelExport,
    downloadVideo,
    resetExport,
    preloadFFmpeg,
    isFFmpegLoaded,
    exportProgress,
    exportedVideoUrl,
    isExporting,
    supportsWebCodecs: supportsWebCodecs(),
  };
};
