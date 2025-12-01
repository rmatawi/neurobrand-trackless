import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import AudioWaveform from './AudioWaveform';
import { Volume2, VolumeX, Scissors } from 'lucide-react';
import { cn } from '../../lib/utils';

const AdvancedTimeline = ({ 
  videos = [], 
  audioTracks = {}, 
  videoVolumes = {},
  audioVolumes = {},
  onInOutChange,
  onVolumeChange,
  selectedVideoIndex = null
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Calculate the total duration of the sequence
  const totalDuration = videos.reduce((acc, video) => {
    const inOut = video.inOutPoints || { inPoint: 0, outPoint: video.duration || 10 };
    return acc + (inOut.outPoint - inOut.inPoint);
  }, 0);

  // Calculate positions for each video in the timeline
  const getVideoPositions = () => {
    let currentTime = 0;
    return videos.map((video, index) => {
      const inOut = video.inOutPoints || { inPoint: 0, outPoint: video.duration || 10 };
      const duration = inOut.outPoint - inOut.inPoint;
      
      const position = {
        index,
        start: currentTime,
        end: currentTime + duration,
        duration,
        video
      };
      
      currentTime += duration;
      return position;
    });
  };

  const videoPositions = getVideoPositions();

  // Function to format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full bg-background border rounded-lg overflow-hidden">
      {/* Timeline controls */}
      <div className="flex items-center justify-between p-2 bg-secondary">
        <div className="flex items-center space-x-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <span className="text-sm font-mono px-2 py-1 bg-muted rounded">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm">Zoom:</span>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
          >
            -
          </Button>
          <span className="text-sm w-12 text-center">{(zoomLevel * 100).toFixed(0)}%</span>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
          >
            +
          </Button>
        </div>
      </div>

      {/* Timeline ruler */}
      <div className="relative h-8 bg-muted border-b">
        <div className="absolute inset-0 flex">
          {Array.from({ length: Math.ceil(totalDuration / 5) + 1 }, (_, i) => (
            <div 
              key={i} 
              className="h-full border-r border-muted-foreground/30 flex items-end pb-1"
              style={{ width: `${(5 / totalDuration) * 100 * zoomLevel}%` }}
            >
              <span className="text-xs text-muted-foreground ml-1">
                {formatTime(i * 5)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Video tracks */}
      <div className="relative p-2 min-h-[120px]">
        {videoPositions.map((pos, idx) => (
          <div 
            key={pos.index}
            className={cn(
              "absolute h-10 mb-2 rounded cursor-pointer transition-all duration-150",
              idx === selectedVideoIndex 
                ? "ring-2 ring-primary ring-offset-1" 
                : "ring-1 ring-border"
            )}
            style={{
              left: `${(pos.start / totalDuration) * 100 * zoomLevel}%`,
              width: `${(pos.duration / totalDuration) * 100 * zoomLevel}%`,
              backgroundColor: idx === selectedVideoIndex ? 'hsl(var(--primary)/0.2)' : 'hsl(var(--secondary))',
            }}
            onClick={() => onInOutChange && onInOutChange(pos.index)}
          >
            <div className="p-1 h-full flex items-center justify-center truncate text-xs">
              {pos.video.name ? pos.video.name.substring(0, 15) + (pos.video.name.length > 15 ? '...' : '') : `Video ${pos.index + 1}`}
            </div>
          </div>
        ))}

        {/* Audio tracks (if any) */}
        {Object.keys(audioTracks).length > 0 && (
          <div className="mt-12 pt-4 border-t border-muted">
            <h4 className="text-sm font-medium mb-2">Audio Tracks</h4>
            {Object.entries(audioTracks).map(([videoIndex, audioTrack]) => (
              <div key={videoIndex} className="mb-3">
                <div className="flex items-center mb-1">
                  <span className="text-xs mr-2">Audio {parseInt(videoIndex) + 1}:</span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-6 w-6 p-0"
                    onClick={() => onVolumeChange && onVolumeChange('audio', videoIndex, audioVolumes[videoIndex] > 0 ? 0 : 1)}
                  >
                    {audioVolumes[videoIndex] > 0 ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                  </Button>
                  <span className="text-xs ml-1 w-10">
                    {(audioVolumes[videoIndex] || 0).toFixed(2)}
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-6 text-xs ml-2"
                    onClick={() => onInOutChange && onInOutChange(videoIndex, true)} // true for audio
                  >
                    <Scissors className="h-3 w-3 mr-1" />
                    Trim
                  </Button>
                </div>
                <AudioWaveform 
                  duration={audioTrack.duration || 10}
                  color={selectedVideoIndex === parseInt(videoIndex) ? '#1E97A0' : '#888888'}
                  height={40}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Playhead */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
        style={{ 
          left: `${(currentTime / totalDuration) * 100 * zoomLevel}%`,
        }}
      >
        <div className="absolute -top-2 -ml-2 w-4 h-4 bg-red-500 rounded-full"></div>
      </div>
    </div>
  );
};

export default AdvancedTimeline;