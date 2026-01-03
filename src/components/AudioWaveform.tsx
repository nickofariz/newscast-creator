import { useEffect, useRef, useState } from "react";

interface AudioWaveformProps {
  audioUrl: string;
  width: number;
  height?: number;
  barWidth?: number;
  barGap?: number;
  barColor?: string;
  barRadius?: number;
}

const AudioWaveform = ({
  audioUrl,
  width,
  height = 24,
  barWidth = 2,
  barGap = 1,
  barColor = "rgb(34 197 94 / 0.7)",
  barRadius = 1,
}: AudioWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!audioUrl) return;

    const analyzeAudio = async () => {
      setIsLoading(true);
      try {
        const audioContext = new AudioContext();
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Get audio data from the first channel
        const rawData = audioBuffer.getChannelData(0);
        
        // Calculate how many bars we can fit
        const totalBars = Math.floor(width / (barWidth + barGap));
        const blockSize = Math.floor(rawData.length / totalBars);
        
        const normalizedData: number[] = [];
        
        for (let i = 0; i < totalBars; i++) {
          const start = blockSize * i;
          let sum = 0;
          
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[start + j] || 0);
          }
          
          // Normalize to 0-1 range
          normalizedData.push(sum / blockSize);
        }
        
        // Find max value for better normalization
        const maxVal = Math.max(...normalizedData);
        const normalized = normalizedData.map(v => v / maxVal);
        
        setWaveformData(normalized);
        await audioContext.close();
      } catch (error) {
        console.error("Error analyzing audio:", error);
        // Generate placeholder waveform on error
        const totalBars = Math.floor(width / (barWidth + barGap));
        const placeholder = Array.from({ length: totalBars }, () => 0.3 + Math.random() * 0.7);
        setWaveformData(placeholder);
      } finally {
        setIsLoading(false);
      }
    };

    analyzeAudio();
  }, [audioUrl, width, barWidth, barGap]);

  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw waveform bars
    ctx.fillStyle = barColor;

    waveformData.forEach((value, index) => {
      const x = index * (barWidth + barGap);
      const barHeight = Math.max(2, value * (height - 4));
      const y = (height - barHeight) / 2;

      // Draw rounded rectangle
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, barRadius);
      ctx.fill();
    });
  }, [waveformData, width, height, barWidth, barGap, barColor, barRadius]);

  if (isLoading) {
    return (
      <div 
        className="flex items-center justify-center gap-0.5 animate-pulse"
        style={{ width, height }}
      >
        {Array.from({ length: Math.min(30, Math.floor(width / (barWidth + barGap + 2))) }).map((_, i) => (
          <div
            key={i}
            className="rounded-full bg-green-500/30"
            style={{ 
              width: barWidth, 
              height: `${20 + Math.random() * 60}%`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="block"
    />
  );
};

export default AudioWaveform;
