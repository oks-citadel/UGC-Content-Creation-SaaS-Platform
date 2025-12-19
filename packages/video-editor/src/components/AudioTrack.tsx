import React, { useState, useRef, useEffect } from 'react';
import type { AudioClip } from '../types';

interface AudioTrackProps {
  clip: AudioClip;
  onVolumeChange?: (clipId: string, volume: number) => void;
  onRemove?: (clipId: string) => void;
  onUpdate?: (clipId: string, updates: Partial<AudioClip>) => void;
}

export const AudioTrack: React.FC<AudioTrackProps> = ({
  clip,
  onVolumeChange,
  onRemove,
  onUpdate,
}) => {
  const [volume, setVolume] = useState(clip.volume);
  const [isMuted, setIsMuted] = useState(false);
  const [waveform, setWaveform] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    loadWaveform();
  }, [clip.url]);

  useEffect(() => {
    drawWaveform();
  }, [waveform]);

  const loadWaveform = async () => {
    try {
      // Create audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      // Fetch audio data
      const response = await fetch(clip.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

      // Extract waveform data
      const rawData = audioBuffer.getChannelData(0);
      const samples = 200; // Number of waveform bars
      const blockSize = Math.floor(rawData.length / samples);
      const filteredData: number[] = [];

      for (let i = 0; i < samples; i++) {
        const blockStart = blockSize * i;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[blockStart + j]);
        }
        filteredData.push(sum / blockSize);
      }

      // Normalize
      const max = Math.max(...filteredData);
      const normalized = filteredData.map((n) => n / max);

      setWaveform(normalized);
    } catch (error) {
      console.error('Failed to load waveform:', error);
    }
  };

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas || waveform.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const barWidth = width / waveform.length;
    const halfHeight = height / 2;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw waveform
    ctx.fillStyle = isMuted ? '#666' : '#10b981';
    waveform.forEach((value, index) => {
      const barHeight = value * halfHeight * volume;
      const x = index * barWidth;
      const y = halfHeight - barHeight / 2;

      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });

    // Draw center line
    ctx.strokeStyle = '#444';
    ctx.beginPath();
    ctx.moveTo(0, halfHeight);
    ctx.lineTo(width, halfHeight);
    ctx.stroke();
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    onVolumeChange?.(clip.id, newVolume);
  };

  const handleMuteToggle = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    onUpdate?.(clip.id, { volume: newMuted ? 0 : volume });
  };

  return (
    <div className="audio-track">
      <div className="audio-track-header">
        <span className="audio-track-name">{clip.file.name || 'Audio Track'}</span>
        <button
          onClick={() => onRemove?.(clip.id)}
          className="audio-track-remove"
          title="Remove track"
        >
          ×
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={80}
        style={{ width: '100%', height: '80px' }}
      />

      <div className="audio-track-controls">
        <button
          onClick={handleMuteToggle}
          className={`audio-mute-button ${isMuted ? 'muted' : ''}`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          disabled={isMuted}
          className="audio-volume-slider"
        />

        <span className="audio-volume-label">{Math.round(volume * 100)}%</span>
      </div>

      <div className="audio-track-info">
        <span>Duration: {formatDuration(clip.duration)}</span>
        <span>
          Time: {formatDuration(clip.startTime)} - {formatDuration(clip.endTime)}
        </span>
      </div>
    </div>
  );
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
