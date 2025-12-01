import React from 'react';
import { cn } from '../../lib/utils';

const TimelineVisualization = ({ 
  videos, 
  selectedVideoIndex, 
  onClickVideo,
  totalDuration 
}) => {
  if (!videos || videos.length === 0) {
    return (
      <div className="w-full h-16 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
        No videos added yet
      </div>
    );
  }

  // Calculate total duration if not provided
  const calculatedTotalDuration = totalDuration || videos.reduce((acc, video) => {
    const inOut = video.inOutPoints || { inPoint: 0, outPoint: video.duration || 10 };
    return acc + (inOut.outPoint - inOut.inPoint);
  }, 0);

  return (
    <div className="w-full bg-muted rounded-lg p-2 relative">
      {/* Timeline ruler */}
      <div className="h-1 bg-background rounded-full mb-2 relative">
        {/* Render each video as a segment */}
        {videos.map((video, index) => {
          const inOut = video.inOutPoints || { inPoint: 0, outPoint: video.duration || 10 };
          const duration = inOut.outPoint - inOut.inPoint;
          
          const startPercentage = (videos.slice(0, index).reduce((acc, v) => {
            const vInOut = v.inOutPoints || { inPoint: 0, outPoint: v.duration || 10 };
            return acc + (vInOut.outPoint - vInOut.inPoint);
          }, 0) / calculatedTotalDuration) * 100;
          
          const widthPercentage = (duration / calculatedTotalDuration) * 100;
          
          return (
            <div
              key={video.id || index}
              className={cn(
                "absolute h-full rounded-sm cursor-pointer transition-all duration-150 hover:opacity-90",
                index === selectedVideoIndex 
                  ? "bg-primary" 
                  : "bg-secondary"
              )}
              style={{
                left: `${startPercentage}%`,
                width: `${widthPercentage}%`,
              }}
              onClick={() => onClickVideo && onClickVideo(index)}
              title={`${video.name || `Video ${index + 1}`}: ${duration.toFixed(2)}s`}
            >
              {widthPercentage > 10 && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">
                  {video.name ? video.name.substring(0, 10) + (video.name.length > 10 ? '...' : '') : `V${index + 1}`}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Timeline markers */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>0s</span>
        <span>{calculatedTotalDuration.toFixed(2)}s</span>
      </div>
    </div>
  );
};

export default TimelineVisualization;