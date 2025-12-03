import React from 'react';
import { cn } from '@/lib/utils';

const AudioWaveform = ({ 
  peaks, 
  duration = 10, 
  height = 60, 
  width = '100%', 
  color = '#1E97A0', 
  onPlayheadChange = null 
}) => {
  // If we don't have peaks, create simulated ones for visual purposes
  const audioPeaks = peaks || Array.from({ length: 100 }, () => Math.random());

  const handleWaveformClick = (e) => {
    if (onPlayheadChange) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickPosition = e.clientX - rect.left;
      const percentage = clickPosition / rect.width;
      const time = percentage * duration;
      onPlayheadChange(time);
    }
  };

  return (
    <div 
      className="relative bg-muted rounded-md overflow-hidden cursor-pointer"
      style={{ width, height }}
      onClick={handleWaveformClick}
    >
      <div className="absolute inset-0 flex items-center justify-between px-1 py-2">
        {audioPeaks.map((peak, index) => (
          <div
            key={index}
            className="w-1 bg-primary rounded-sm"
            style={{
              height: `${Math.abs(peak) * 100}%`,
              minHeight: '2px',
              maxHeight: `${height - 8}px`,
              marginLeft: '0.5px',
              marginRight: '0.5px',
              backgroundColor: color,
            }}
          />
        ))}
      </div>
      {onPlayheadChange && (
        <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none"></div>
      )}
    </div>
  );
};

export default AudioWaveform;