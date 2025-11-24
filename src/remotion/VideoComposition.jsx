import React from 'react';
import { AbsoluteFill, Sequence, Video, Audio, Img, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';
import { Fade } from '@remotion/transitions';

const VideoComposition = ({ layers = [] }) => {
  const { width, height, fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {layers.map((layer, index) => {
        // Calculate start time based on the layer's start property
        const startTime = layer.start || 0;
        const startFrame = Math.round(startTime * fps);

        // Calculate duration based on the layer's duration property
        const duration = layer.duration || 3;
        const durationInFrames = Math.round(duration * fps);

        // Calculate in/out points for the layer source
        const inPoint = layer.startInSource || 0;
        const outPoint = layer.sourceDuration ? inPoint + layer.sourceDuration : inPoint + duration;

        // Determine layer type
        const isVideo = layer.type?.toLowerCase() === 'video' || layer.externalUrl?.includes('.mp4') || layer.ext === 'mp4';
        const isImage = layer.type?.toLowerCase() === 'image' || layer.ext === 'jpg' || layer.ext === 'png';

        // Calculate position and size
        const layerWidth = layer.width || width;
        const layerHeight = layer.height || height;
        const positionX = layer.x || 0;
        const positionY = layer.y || 0;

        // Apply transformations
        const scale = layer.scaleX || layer.scale || 1;
        const rotation = layer.rotation || 0;
        const opacity = layer.alpha !== undefined ? layer.alpha : 1;

        const style = {
          position: 'absolute',
          left: `${(positionX / width) * 100}%`,
          top: `${(positionY / height) * 100}%`,
          width: `${(layerWidth / width) * 100}%`,
          height: `${(layerHeight / height) * 100}%`,
          transform: `rotate(${rotation}deg) scale(${scale})`,
          opacity: opacity,
          objectFit: 'cover',
          zIndex: layer.trackIndex || index
        };

        if (isVideo) {
          return (
            <Sequence
              key={layer.id || `video-${index}`}
              from={startFrame}
              durationInFrames={durationInFrames}
            >
              <Video
                src={layer.externalUrl}
                style={style}
                startFrom={Math.round(inPoint * fps)}
                endAt={Math.round(outPoint * fps)}
                volume={layer.volume || 1}
              />
            </Sequence>
          );
        } else if (isImage) {
          return (
            <Sequence
              key={layer.id || `image-${index}`}
              from={startFrame}
              durationInFrames={durationInFrames}
            >
              <Img
                src={layer.externalUrl}
                style={style}
              />
            </Sequence>
          );
        } else {
          // For other types of layers, return a default element
          return (
            <Sequence
              key={layer.id || `layer-${index}`}
              from={startFrame}
              durationInFrames={durationInFrames}
            >
              <div
                style={{
                  ...style,
                  backgroundColor: layer.fill || 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  color: 'white',
                }}
              >
                {layer.description || layer.type}
              </div>
            </Sequence>
          );
        }
      })}
    </AbsoluteFill>
  );
};

export default VideoComposition;