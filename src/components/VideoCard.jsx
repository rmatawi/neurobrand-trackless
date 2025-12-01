import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

const VideoCard = ({
  video,
  index,
  videoAudioTracks,
  videoVolumes,
  audioVolumes,
  onInOutDialog,
  onAudioVolumeDialog,
  onVideoVolumeDialog,
  onRemoveAudio,
  onAddAudio,
  onRemoveVideo,
  onMoveBack,
  onMoveForward,
  isSelected,
  totalVideos
}) => {
  const ThumbnailVideo = ({ blob }) => {
    const videoRef = React.useRef(null);
    const [url, setUrl] = React.useState(null);

    React.useEffect(() => {
      if (blob) {
        const objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);

        return () => {
          URL.revokeObjectURL(objectUrl);
        };
      }
    }, [blob]);

    React.useEffect(() => {
      if (videoRef.current && url) {
        videoRef.current.src = url;
      }
    }, [url]);

    return (
      <video
        ref={videoRef}
        className="w-16 h-16 flex-shrink-0 rounded-xl object-cover border-2 border-gray-200"
        muted
        preload="metadata"
        poster="" // No poster since we want to show the actual first frame
      />
    );
  };

  const duration = video.inOutPoints
    ? (video.inOutPoints.outPoint - video.inOutPoints.inPoint)
    : (video.duration || 10);

  return (
    <Card 
      className={`border rounded-lg p-4 bg-white transition-all duration-200 ${
        isSelected 
          ? "ring-2 ring-primary ring-offset-2 border-primary" 
          : "border border-input"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-x-0 sm:space-x-4 space-y-3 sm:space-y-0">
          {video.blob ? (
            <ThumbnailVideo blob={video.blob} />
          ) : (
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex-shrink-0" />
          )}
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold truncate max-w-xs">
                  {video.name || `Video ${index + 1}`}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Duration: {duration.toFixed(2)}s
                </p>
                {videoAudioTracks[index] && (
                  <p className="text-sm text-green-600 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                    Audio attached
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end space-y-1">
                <span className="text-xs px-2 py-1 bg-secondary rounded">
                  #{index + 1}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onInOutDialog(index)}
          >
            In/Out ({duration.toFixed(2)}s)
          </Button>
          
          {videoAudioTracks[index] ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onAudioVolumeDialog(index);
                }}
              >
                Audio Vol
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRemoveAudio(index)}
              >
                Remove Audio
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddAudio(index)}
            >
              Add Audio
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onVideoVolumeDialog(index)}
          >
            Video Vol
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRemoveVideo(index)}
          >
            Remove
          </Button>
        </div>
        
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMoveBack(index)}
            disabled={index === 0}
          >
            ← Move Back
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMoveForward(index)}
            disabled={index === totalVideos - 1}
          >
            Move Forward →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoCard;