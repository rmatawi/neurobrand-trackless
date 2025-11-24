import React from 'react';
import { Composition } from 'remotion';
import VideoComposition from './VideoComposition';

// Each <Composition> is an entry in the timeline
export const RemotionVideoCompositions = () => {
  return (
    <>
      <Composition
        id="VideoComposition"
        component={VideoComposition}
        durationInFrames={150} // Default duration, will be updated based on actual video length
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          videos: [],
        }}
      />
    </>
  );
};