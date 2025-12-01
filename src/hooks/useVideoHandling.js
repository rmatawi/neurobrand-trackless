import { useState } from 'react';

// Custom hook for managing video handling
export const useVideoHandling = (chillinApiKey, dialogManager) => {
  // State for video handling
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [videoAudioTracks, setVideoAudioTracks] = useState({});
  const [videoVolumes, setVideoVolumes] = useState({}); // For video tracks
  const [audioVolumes, setAudioVolumes] = useState({}); // For audio tracks
  const [inOutDialogOpen, setInOutDialogOpen] = useState(false);
  const [inPoint, setInPoint] = useState(0);
  const [outPoint, setOutPoint] = useState(10);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(null);
  const [videoDuration, setVideoDuration] = useState(10);

  // Clean up object URLs when videos change
  const cleanupVideoUrls = (videos) => {
    videos.forEach((video) => {
      if (video.blob && video.src && video.src.startsWith("blob:")) {
        URL.revokeObjectURL(video.src);
      }
    });
  };

  // Handle picking video from device
  const handlePickFromDevice = async (
    requiredVideos,
    currentTemplate,
    targetIndex = null
  ) => {
    // Check if videos have already been added for Template 1 or 3 but we need 2, or Template 2 but we need 3
    if (targetIndex === null && selectedVideos.length >= requiredVideos) {
      dialogManager.create({
        title: "Too Many Videos",
        text: `Template ${currentTemplate} requires exactly ${requiredVideos} videos. Remove current videos before adding more.`,
        buttons: [
          {
            text: "OK",
            onClick: () => {}
          }
        ]
      }).open();
      return;
    }

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "video/*";
    fileInput.multiple = false;

    fileInput.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) {
        return;
      }

      try {
        const deviceVideo = {
          id: `device-${Date.now()}`,
          name: file.name,
          blob: file,
          timestamp: Date.now(),
          size: file.size,
          duration: videoDuration, // Duration specified by the user
          inOutPoints: { inPoint: 0, outPoint: videoDuration },
        };

        if (targetIndex !== null) {
          // Replace the video at the specific index
          setSelectedVideos((prev) => {
            const newVideos = [...prev];
            newVideos[targetIndex] = deviceVideo; // Replace at specific index
            return newVideos;
          });
        } else {
          // Check if we've reached the limit for current template
          if (selectedVideos.length >= requiredVideos) {
            dialogManager.create({
              title: "Video Limit Reached",
              text: `Template ${currentTemplate} requires exactly ${requiredVideos} videos.`,
              buttons: [
                {
                  text: "OK",
                  onClick: () => {}
                }
              ]
            }).open();
            return;
          }

          // Add the selected video from device to collection
          setSelectedVideos((prev) => {
            const newVideos = [...prev, deviceVideo];
            return newVideos;
          });
        }
      } catch (error) {
        console.error("Error processing device video:", error);
        dialogManager.create({
          title: "Processing Error",
          text: `Error loading video: ${error.message}`,
          buttons: [
            {
              text: "OK",
              onClick: () => {}
            }
          ]
        }).open();
      }
    };

    fileInput.click();
  };

  // Handle opening in/out point dialog for a video
  const openInOutDialog = (index) => {
    const video = selectedVideos[index];
    if (video && video.inOutPoints) {
      setInPoint(video.inOutPoints.inPoint || 0);
      setOutPoint(video.inOutPoints.outPoint || video.duration || 10);
    } else {
      setInPoint(0);
      setOutPoint(video.duration || 10);
    }
    setCurrentVideoIndex(index);
    setInOutDialogOpen(true);
  };

  // Function to get in/out points for a video
  const getInOutPoints = (index) => {
    if (index >= 0 && index < selectedVideos.length) {
      return (
        selectedVideos[index].inOutPoints || {
          inPoint: 0,
          outPoint: selectedVideos[index].duration || 10,
        }
      );
    }
    return { inPoint: 0, outPoint: 10 };
  };

  // Set in/out points for a video
  const setInOutPoints = (index, inPoint, outPoint) => {
    if (index >= 0 && index < selectedVideos.length) {
      setSelectedVideos((prev) => {
        const newVideos = [...prev];
        if (!newVideos[index].inOutPoints) {
          newVideos[index].inOutPoints = {};
        }
        newVideos[index].inOutPoints = { inPoint, outPoint };
        return newVideos;
      });
    }
  };

  // Helper function to set only in point for a video
  const setInPointForVideo = (index, value) => {
    const current = getInOutPoints(index);
    setInOutPoints(index, value, current.outPoint);
  };

  // Helper function to set only out point for a video
  const setOutPointForVideo = (index, value) => {
    const current = getInOutPoints(index);
    setInOutPoints(index, current.inPoint, value);
  };

  // Handle setting in/out points
  const handleSetInOutPoints = () => {
    if (currentVideoIndex !== null) {
      setInOutPoints(currentVideoIndex, inPoint, outPoint);
    }
    setInOutDialogOpen(false);
  };

  // Remove a video
  const removeVideo = (index) => {
    setSelectedVideos((prev) => prev.filter((_, i) => i !== index));
  };

  // Function to handle adding audio to a specific video
  const handleAddAudioToVideo = (videoIndex) => {
    // Create a file input to select audio files
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "audio/*"; // Accept all audio formats

    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        // Create an audio element to get duration
        const audioElement = document.createElement("audio");
        const audioUrl = URL.createObjectURL(file);

        audioElement.src = audioUrl;

        audioElement.onloadedmetadata = () => {
          const audioDuration = audioElement.duration;

          // Ask user if they want to trim the audio to match the video length
          const videoInOutPoints = getInOutPoints(videoIndex);
          const videoOutPoint =
            videoInOutPoints.outPoint !== undefined
              ? videoInOutPoints.outPoint
              : 3;
          const videoInPoint =
            videoInOutPoints.inPoint !== undefined
              ? videoInOutPoints.inPoint
              : 0;
          const videoDuration = videoOutPoint - videoInPoint;

          // Check if video duration is less than audio duration
          if (videoDuration < audioDuration) {
            dialogManager
              .create({
                title: "Audio Duration Mismatch",
                text: `Video duration is ${videoDuration.toFixed(2)}s, but audio is ${audioDuration.toFixed(2)}s long. Trim audio to match video length?`,
                buttons: [
                  {
                    text: "Yes, Trim Audio",
                    onClick: () => {
                      // User wants to trim audio, store audio reference with video
                      addAudioToVideo(videoIndex, file, true, videoDuration);
                    },
                  },
                  {
                    text: "No, Use Full Audio",
                    onClick: () => {
                      // User doesn't want to trim, use full audio
                      addAudioToVideo(videoIndex, file, false, audioDuration);
                    },
                  },
                ],
              })
              .open();
          } else {
            // Video is longer than or equal to audio, no need to trim
            addAudioToVideo(videoIndex, file, false, audioDuration);
          }
        };

        audioElement.onerror = () => {
          dialogManager.create({
            title: "Error",
            text: "Could not load audio to get duration",
            buttons: [
              {
                text: "OK",
                onClick: () => {}
              }
            ]
          }).open();
          URL.revokeObjectURL(audioUrl);
        };
      }
    };

    fileInput.click();
  };

  // Helper function to add audio to a video
  const addAudioToVideo = (
    videoIndex,
    audioFile,
    shouldTrim,
    audioDuration
  ) => {
    // Update the videoAudioTracks state to store the audio file for this video index
    setVideoAudioTracks((prevTracks) => ({
      ...prevTracks,
      [videoIndex]: {
        file: audioFile,
        shouldTrim: shouldTrim,
        duration: audioDuration,
        url: URL.createObjectURL(audioFile), // Create URL for the audio file
      },
    }));

    dialogManager.create({
      title: "Audio Added",
      text: `Audio file added to Video ${videoIndex + 1}`,
      buttons: [
        {
          text: "OK",
          onClick: () => {}
        }
      ]
    }).open();
  };

  // Function to remove audio from a video
  const removeAudioFromVideo = (videoIndex) => {
    setVideoAudioTracks((prevTracks) => {
      const newTracks = { ...prevTracks };
      if (newTracks[videoIndex]) {
        // Revoke the object URL to free memory
        URL.revokeObjectURL(newTracks[videoIndex].url);
        delete newTracks[videoIndex];
      }
      return newTracks;
    });

    dialogManager.create({
      title: "Audio Removed",
      text: `Audio removed from Video ${videoIndex + 1}`,
      buttons: [
        {
          text: "OK",
          onClick: () => {}
        }
      ]
    }).open();
  };

  // Function to set video volume
  const setVideoVolume = (videoIndex, volume) => {
    setVideoVolumes((prevVolumes) => ({
      ...prevVolumes,
      [videoIndex]: volume,
    }));
  };

  // Function to set audio volume
  const setAudioVolume = (videoIndex, volume) => {
    setAudioVolumes((prevVolumes) => ({
      ...prevVolumes,
      [videoIndex]: volume,
    }));
  };

  // Move video to previous position (backwards in the list)
  const moveVideoBack = (index) => {
    if (index <= 0 || index >= selectedVideos.length) return;

    setSelectedVideos((prev) => {
      const newVideos = [...prev];
      // Swap current index with the previous index
      [newVideos[index], newVideos[index - 1]] = [newVideos[index - 1], newVideos[index]];
      return newVideos;
    });
  };

  // Move video to next position (forward in the list)
  const moveVideoForward = (index) => {
    if (index < 0 || index >= selectedVideos.length - 1) return;

    setSelectedVideos((prev) => {
      const newVideos = [...prev];
      // Swap current index with the next index
      [newVideos[index], newVideos[index + 1]] = [newVideos[index + 1], newVideos[index]];
      return newVideos;
    });
  };

  // Function to open volume dialog - simplified to just return the current volume
  const openVolumeDialog = (index, isAudio) => {
    const currentVolume = isAudio
      ? (audioVolumes[index] !== undefined ? audioVolumes[index] : 1.0)
      : (videoVolumes[index] !== undefined ? videoVolumes[index] : 1.0);
    return currentVolume;
  };

  return {
    // State
    selectedVideos,
    setSelectedVideos,
    videoAudioTracks,
    setVideoAudioTracks,
    videoVolumes,
    setVideoVolumes,
    audioVolumes,
    setAudioVolumes,
    inOutDialogOpen,
    setInOutDialogOpen,
    inPoint,
    setInPoint,
    outPoint,
    setOutPoint,
    currentVideoIndex,
    setCurrentVideoIndex,
    videoDuration,
    setVideoDuration,

    // Functions
    cleanupVideoUrls,
    handlePickFromDevice,
    openInOutDialog,
    getInOutPoints,
    setInOutPoints,
    setInPointForVideo,
    setOutPointForVideo,
    handleSetInOutPoints,
    removeVideo,
    handleAddAudioToVideo,
    addAudioToVideo,
    removeAudioFromVideo,
    setVideoVolume,
    setAudioVolume,
    openVolumeDialog,
    moveVideoBack,
    moveVideoForward
  };
};