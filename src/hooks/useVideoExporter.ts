import { useState, useCallback, useRef } from "react";
import { SubtitleStyleSettings, DEFAULT_SUBTITLE_STYLE } from "@/components/SubtitlePreview";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

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

  const abortRef = useRef(false);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const ffmpegLoadedRef = useRef(false);

  const loadFFmpeg = useCallback(async () => {
    if (ffmpegLoadedRef.current && ffmpegRef.current) {
      return ffmpegRef.current;
    }

    const ffmpeg = new FFmpeg();
    ffmpegRef.current = ffmpeg;

    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    ffmpegLoadedRef.current = true;
    return ffmpeg;
  }, []);

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

  // Wait for video to seek to specific time
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
        format = "mp4",
      } = options;

      abortRef.current = false;
      setExportedVideoUrl(null);
      exportStartTimeRef.current = Date.now();

      try {
        // Phase 1: Prepare (0-5%)
        setExportProgress({
          status: "preparing",
          progress: 0,
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

        // Phase 2: Load FFmpeg (5-10%)
        setExportProgress({
          status: "preparing",
          progress: 5,
          message: "Loading FFmpeg...",
          eta: calculateEta(5),
        });

        const ffmpeg = await loadFFmpeg();

        ffmpeg.on("log", ({ message }) => {
          console.log("[FFmpeg]", message);
        });

        // Phase 3: Load Media (10-15%)
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

        // Phase 4: Render Frames (15-70%)
        setExportProgress({
          status: "rendering",
          progress: 15,
          message: "Memulai render frame...",
          eta: calculateEta(15),
        });

        const fps = 30;
        const totalFrames = Math.ceil(totalDuration * fps);
        let frameIndex = 0;

        for (let frameNum = 0; frameNum < totalFrames; frameNum++) {
          if (abortRef.current) throw new Error("Export cancelled");

          const currentTime = frameNum / fps;

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

          // Capture frame as JPEG (faster than PNG)
          const frameData = canvas.toDataURL("image/jpeg", 0.92);
          const base64Data = frameData.split(",")[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Write frame to FFmpeg filesystem
          const frameName = `frame${String(frameIndex).padStart(5, "0")}.jpg`;
          await ffmpeg.writeFile(frameName, bytes);
          frameIndex++;

          // Update progress
          const progress = 15 + (frameNum / totalFrames) * 55;
          if (frameNum % 5 === 0) {
            setExportProgress({
              status: "rendering",
              progress,
              message: `Rendering frame ${frameNum + 1}/${totalFrames} (${Math.floor(
                currentTime
              )}s / ${Math.floor(totalDuration)}s)`,
              eta: calculateEta(progress),
            });
          }
        }

        // Phase 5: Prepare Audio (70-75%)
        setExportProgress({
          status: "encoding",
          progress: 70,
          message: "Mempersiapkan audio...",
          eta: calculateEta(70),
        });

        let hasAudioFile = false;
        if (audioUrl) {
          try {
            const audioData = await fetchFile(audioUrl);
            await ffmpeg.writeFile("audio.mp3", audioData);
            hasAudioFile = true;
          } catch (e) {
            console.warn("Could not load audio:", e);
          }
        }

        // Phase 6: Encode Video (75-95%)
        setExportProgress({
          status: "encoding",
          progress: 75,
          message: "Encoding video dengan FFmpeg...",
          eta: calculateEta(75),
        });

        ffmpeg.on("progress", ({ progress }) => {
          const encodeProgress = 75 + progress * 20;
          setExportProgress({
            status: "encoding",
            progress: Math.min(95, encodeProgress),
            message: `Encoding MP4... ${Math.round(progress * 100)}%`,
            eta: calculateEta(Math.min(95, encodeProgress)),
          });
        });

        const outputFormat = format === "mp4" ? "mp4" : "webm";
        const outputFile = `output.${outputFormat}`;

        if (format === "mp4") {
          if (hasAudioFile) {
            await ffmpeg.exec([
              "-framerate",
              String(fps),
              "-i",
              "frame%05d.jpg",
              "-i",
              "audio.mp3",
              "-c:v",
              "libx264",
              "-preset",
              "ultrafast",
              "-crf",
              "23",
              "-pix_fmt",
              "yuv420p",
              "-c:a",
              "aac",
              "-b:a",
              "128k",
              "-shortest",
              "-movflags",
              "+faststart",
              outputFile,
            ]);
          } else {
            await ffmpeg.exec([
              "-framerate",
              String(fps),
              "-i",
              "frame%05d.jpg",
              "-c:v",
              "libx264",
              "-preset",
              "ultrafast",
              "-crf",
              "23",
              "-pix_fmt",
              "yuv420p",
              "-movflags",
              "+faststart",
              outputFile,
            ]);
          }
        } else {
          // WebM format
          if (hasAudioFile) {
            await ffmpeg.exec([
              "-framerate",
              String(fps),
              "-i",
              "frame%05d.jpg",
              "-i",
              "audio.mp3",
              "-c:v",
              "libvpx-vp9",
              "-crf",
              "30",
              "-b:v",
              "0",
              "-c:a",
              "libopus",
              "-shortest",
              outputFile,
            ]);
          } else {
            await ffmpeg.exec([
              "-framerate",
              String(fps),
              "-i",
              "frame%05d.jpg",
              "-c:v",
              "libvpx-vp9",
              "-crf",
              "30",
              "-b:v",
              "0",
              outputFile,
            ]);
          }
        }

        // Phase 7: Finalize (95-100%)
        setExportProgress({
          status: "encoding",
          progress: 95,
          message: "Finalizing...",
          eta: "Almost done!",
        });

        const outputData = await ffmpeg.readFile(outputFile);
        let outputBytes: Uint8Array;
        if (typeof outputData === "string") {
          const encoder = new TextEncoder();
          outputBytes = encoder.encode(outputData);
        } else {
          const buffer = new ArrayBuffer(outputData.byteLength);
          new Uint8Array(buffer).set(outputData);
          outputBytes = new Uint8Array(buffer);
        }

        const mimeType = format === "mp4" ? "video/mp4" : "video/webm";
        const finalBlob = new Blob([outputBytes.buffer as ArrayBuffer], { type: mimeType });
        const url = URL.createObjectURL(finalBlob);

        // Cleanup FFmpeg files
        for (let i = 0; i < frameIndex; i++) {
          try {
            await ffmpeg.deleteFile(`frame${String(i).padStart(5, "0")}.jpg`);
          } catch {}
        }
        try {
          await ffmpeg.deleteFile(outputFile);
          if (hasAudioFile) await ffmpeg.deleteFile("audio.mp3");
        } catch {}

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
    [drawFrame, loadFFmpeg]
  );

  const cancelExport = useCallback(() => {
    abortRef.current = true;
    setExportProgress({ status: "idle", progress: 0, message: "" });
  }, []);

  const downloadVideo = useCallback(
    (filename: string = "video-with-subtitle.mp4") => {
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

  return {
    exportVideo,
    cancelExport,
    downloadVideo,
    resetExport,
    exportProgress,
    exportedVideoUrl,
    isExporting:
      exportProgress.status !== "idle" &&
      exportProgress.status !== "complete" &&
      exportProgress.status !== "error",
  };
};
