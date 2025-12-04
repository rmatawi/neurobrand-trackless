import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  Scissors,
  Volume2,
  VolumeX,
  Music,
  Trash,
  Upload,
  ArrowLeft,
  ArrowRight,
  Volume,
} from "lucide-react";

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
  totalVideos,
  thumbnailRenderer: ThumbnailRenderer,
}) => {
  const duration = video.inOutPoints
    ? video.inOutPoints.outPoint - video.inOutPoints.inPoint
    : video.duration || 10;

  return (
    <Card
      className={`border rounded-lg p-4 bg-white transition-all duration-200 ${
        isSelected
          ? "ring-2 ring-primary ring-offset-2 border-primary"
          : "border border-input"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex flex-col">
          <div
            className="flex"
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            {video.blob ? (
              <ThumbnailRenderer blob={video.blob} />
            ) : (
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex-shrink-0" />
            )}
            <div className="flex gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMoveBack(index)}
                disabled={index === 0}
                aria-label={`Move Video ${index + 1} Back`}
                className="p-1 h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMoveForward(index)}
                disabled={index === totalVideos - 1}
                aria-label={`Move Video ${index + 1} Forward`}
                className="p-1 h-8 w-8"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
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
              <div className="flex flex-col items-end space-y-1 self-start">
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
            aria-label={`Set In/Out points for Video ${
              index + 1
            } (${duration.toFixed(2)}s)`}
          >
            <Scissors className="h-4 w-4" />
          </Button>

          {videoAudioTracks[index] ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onAudioVolumeDialog(index);
                }}
                aria-label={`Set Audio Volume for Video ${index + 1}`}
              >
                <Volume2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onRemoveAudio(index)}
                aria-label={`Remove Audio from Video ${index + 1}`}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddAudio(index)}
              aria-label={`Add Audio to Video ${index + 1}`}
            >
              <Music className="h-4 w-4" />
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => onVideoVolumeDialog(index)}
            aria-label={`Set Video Volume for Video ${index + 1}`}
          >
            <Volume className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onRemoveVideo(index)}
            aria-label={`Remove Video ${index + 1}`}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoCard;
