import { useState, useEffect } from 'react';
import { processTimelineChunks } from '../services/chunkProcessingService';

// Custom hook for managing Chillin API operations
export const useChillinAPI = (dialogManager) => {
  const [chillinRenders, setChillinRenders] = useState([]);
  const [chillinProjectJson, setChillinProjectJson] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState();
  
  // Get the environment variables
  const apiVideoKey = process.env.REACT_APP_API_VIDEO_KEY;
  const chillinApiKey = process.env.REACT_APP_CHILLIN;

  // Load render jobs from localStorage when component mounts
  useEffect(() => {
    const storedRenders = JSON.parse(
      localStorage.getItem("chillinRenders") || "[]"
    );
    // Sort renders by timestamp, latest first (newest timestamp first)
    const sortedRenders = storedRenders.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    setChillinRenders(sortedRenders);
  }, []);

  // Internal function to handle the actual upload and project creation using chunking
  const processVideoUploadAndCreateProject = async (
    selectedVideos,
    template = null,
    customTemplates = []
  ) => {
    try {
      selectedVideos.forEach((video, index) => {
        const inPoint =
          video.inOutPoints?.inPoint !== undefined
            ? video.inOutPoints.inPoint
            : 0;

        // Determine outPoint based on custom template durations if applicable
        let outPoint;
        if (video.inOutPoints?.outPoint !== undefined) {
          outPoint = video.inOutPoints.outPoint;
        } else {
          // Check if there's a custom template and use its duration
          const customTemplate = customTemplates.find((t) => t.id === template);
          if (
            customTemplate &&
            customTemplate.videoDurations &&
            customTemplate.videoDurations[index] !== undefined
          ) {
            // Use the custom template's specified duration
            outPoint = inPoint + customTemplate.videoDurations[index];
          } else {
            // Fallback to video duration or 3 seconds
            outPoint = inPoint + (video.duration || 3);
          }
        }

        const sourceDuration = outPoint - inPoint;
        console.log(
          `[CHILLIN_CHUNKING]    Video ${index + 1}: ${
            video.name || `Video ${index + 1}`
          } (${inPoint.toFixed(2)}s → ${outPoint.toFixed(
            2
          )}s, duration: ${sourceDuration.toFixed(2)}s)`
        );
      });

      // Show loading dialog during processing
      dialogManager.showAlert("Processing", "Processing videos project with smart chunking...");

      // Check if there are any selected videos to process
      if (!selectedVideos || selectedVideos.length === 0) {
        throw new Error(
          "No videos selected for processing. Please add videos to the sequence first."
        );
      }

      // Create video layers with in/out points for chunking system
      const videoLayers = selectedVideos.map((video, index) => {
        // Get in/out points if they exist
        const inPoint =
          video.inOutPoints?.inPoint !== undefined
            ? video.inOutPoints.inPoint
            : 0;

        // Determine outPoint based on custom template durations if applicable
        let outPoint;
        if (video.inOutPoints?.outPoint !== undefined) {
          outPoint = video.inOutPoints.outPoint;
        } else {
          // Check if there's a custom template and use its duration
          const customTemplate = customTemplates.find((t) => t.id === template);
          if (
            customTemplate &&
            customTemplate.videoDurations &&
            customTemplate.videoDurations[index] !== undefined
          ) {
            // Use the custom template's specified duration
            outPoint = inPoint + customTemplate.videoDurations[index];
          } else {
            // Fallback to video duration or 3 seconds
            outPoint = inPoint + (video.duration || 3);
          }
        }

        const sourceDuration = outPoint - inPoint;

        // Calculate start time based on previous videos' durations (using in/out points)
        const startTime =
          index === 0
            ? 0
            : selectedVideos.slice(0, index).reduce((acc, v, prevIndex) => {
                const prevInPoint =
                  v.inOutPoints?.inPoint !== undefined
                    ? v.inOutPoints.inPoint
                    : 0;

                // Calculate outPoint for the previous video considering custom template
                let prevOutPoint;
                if (v.inOutPoints?.outPoint !== undefined) {
                  prevOutPoint = v.inOutPoints.outPoint;
                } else {
                  const customTemplate = customTemplates.find(
                    (t) => t.id === template
                  );
                  if (
                    customTemplate &&
                    customTemplate.videoDurations &&
                    customTemplate.videoDurations[prevIndex] !== undefined
                  ) {
                    // Use the custom template's specified duration
                    prevOutPoint =
                      prevInPoint + customTemplate.videoDurations[prevIndex];
                  } else {
                    // Fallback to video duration or 3 seconds
                    prevOutPoint = prevInPoint + (v.duration || 3);
                  }
                }

                return acc + (prevOutPoint - prevInPoint);
              }, 0);

        // Create src URL from blob if available
        let videoSrc = video.src;
        if (!videoSrc && video.blob) {
          videoSrc = URL.createObjectURL(video.blob);
        }

        return {
          id: video.id || `video-${index}`,
          name: video.name || `Video ${index + 1}`, // ✅ CRITICAL: Pass name for tracking
          type: "video", // Lowercase for chunking system
          start: startTime, // Start position in the timeline
          duration: sourceDuration, // Duration based on in/out points
          trackIndex: 0,
          x: 0,
          y: 0,
          width: 1280,
          height: 720,
          blendMode: "normal",
          anchorX: 640,
          anchorY: 360,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          alpha: 1,
          skewX: 0,
          skewY: 0,
          hidden: false,
          locked: false,
          keyframes: [],
          src: videoSrc, // Original source for chunking system to process
          blob: video.blob, // ✅ CRITICAL: Pass the blob to chunking service
          ext: "mp4", // Assuming all videos are mp4
          inPoint: inPoint, // Start point in source video
          outPoint: outPoint, // End point in source video
          volume: 1,
          hasAudio: true,
          playrate: 1,
          isFrontTrimmed: false,
          sourceDuration: sourceDuration,
          mediaDuration: sourceDuration,
        };
      });

      // Create tracks structure for chunking system
      const tracks = [
        {
          id: "video-track-0",
          name: "Video Track",
          items: videoLayers,
          type: "video",
        },
      ];

      // Calculate total duration of all videos
      const totalDuration = selectedVideos.reduce((acc, video) => {
        const inPoint =
          video.inOutPoints?.inPoint !== undefined
            ? video.inOutPoints.inPoint
            : 0;
        const outPoint =
          video.inOutPoints?.outPoint !== undefined
            ? video.inOutPoints.outPoint
            : video.duration || 3;
        return acc + (outPoint - inPoint);
      }, 0);

      console.log(
        `[CHILLIN_CHUNKING] Final composite duration: ${totalDuration.toFixed(2)}s`
      );
      console.log(
        `[CHILLIN_CHUNKING] Total videos in sequence: ${selectedVideos.length}`
      );

      // Process chunks using the smart chunking system
      dialogManager.showAlert("Processing", "Analyzing videos and extracting chunks...");

      const jobId = `chillin_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Update the progress callback function
      const onProgress = (message) => {
        console.log(message);
        // In a real UI, you would update a progress bar here
      };

      // Process chunks using the actual chunk processing service
      const updatedTracks = await processTimelineChunks(
        tracks,
        totalDuration,
        jobId,
        onProgress,
        "http://localhost" // Renderer API URL - using local by default for chunk processing
      );

      dialogManager.showAlert("Processing", "Creating Chillin project with chunked videos...");

      // Create Chillin API request payload with chunk URLs
      const chillinApiPayload = {
        compositeWidth: 1280,
        compositeHeight: 720,
        fps: 30,
        projectData: {
          type: "",
          width: 1280,
          height: 720,
          duration: totalDuration,
          version: 0,
          view: updatedTracks[0].items, // Use updated tracks from chunking
          audio: [],
          effect: [],
          transition: [],
        },
      };

      // Make the actual API call to Chillin
      dialogManager.showAlert("Processing", "Sending project to Chillin renderer...");

      // Show a 10-second simulation
      dialogManager.showAlert("Processing", "Preparing project for Chillin renderer (simulating 10s process)...");

      // Separate function for the API call
      const handleSendToChillin = async () => {
        try {
          dialogManager.showAlert("Processing", "Sending project to Chillin renderer...");

          const response = await fetch(
            "https://render-api.chillin.online/render/v1",
            {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Bearer ${chillinApiKey}`,
              },
              body: JSON.stringify(chillinApiPayload),
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              `${response.status} ${response.statusText}: ${
                errorData.error_message || "API request failed"
              }`
            );
          }

          const result = await response.json();
          
          // Update the chillinRenders state
          const newRenderJob = {
            id: result.data.render.render_id,
            name: `Render Job ${Date.now()}`,
            status: "created",
            timestamp: new Date().toISOString(),
            videoUrl: null,
          };
          
          const updatedRenders = [newRenderJob, ...chillinRenders];
          localStorage.setItem("chillinRenders", JSON.stringify(updatedRenders));
          setChillinRenders(updatedRenders);

          dialogManager.showAlert("Project Created", `Video project created with smart chunking! Project ID: ${result.data.render_id}`);

          // Note: We don't update selectedVideos here since we're using chunks and the user may want to keep their original videos
          return result;
        } catch (error) {
          console.error("Error sending project to Chillin renderer:", error);
          dialogManager.showAlert("API Error", `Error: ${error.message}`);
          throw error;
        }
      };

      // Simulate the confirmation dialog behavior with a simple confirmation
      const confirmSend = window.confirm(
        "Click OK to send your project to the Chillin renderer?"
      );
      if (confirmSend) {
        return handleSendToChillin();
      } else {
        // User cancelled
        const cancellationError = new Error(
          "User cancelled Chillin project submission"
        );
        cancellationError.userCancelled = true;
        throw cancellationError;
      }
    } catch (error) {
      console.error("Error in processVideoUploadAndCreateProject:", error);
      if (!error.userCancelled) {
        dialogManager.showAlert("Processing Error", `Error: ${error.message}`);
      }
      throw error; // Re-throw the error so calling code can handle it if needed
    }
  };

  // Function to get render result by render_id
  const getRenderResult = async (renderId) => {
    try {
      // In the original code, it seems like we'd fetch the result from the API
      // For now, let's just simulate or use local data
      const response = await fetch(
        `https://render-api.chillin.online/render/v1/${renderId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${chillinApiKey}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `${response.status} ${response.statusText}: ${
            errorData.error_message || "Failed to get render result"
          }`
        );
      }

      const result = await response.json();
      console.log("Chillin render result:", result);

      dialogManager.showAlert("Success", `Render result retrieved successfully! Render ID: ${renderId}`);

      return result;
    } catch (error) {
      console.error("Error getting render result:", error);
      dialogManager.showAlert("Render Result Error", `Error: ${error.message}`);
      throw error;
    }
  };

  // Function to send the Chillin project to the renderer
  const sendChillinProjectToRenderer = async (selectedVideos, template, customTemplates) => {
    try {
      // Validate that we have videos to process
      if (!selectedVideos || selectedVideos.length === 0) {
        dialogManager.showAlert("No Videos Selected", "No videos selected. Please add videos before sending to renderer.");
        return;
      }

      // Use the createChillinProject function we defined above
      await processVideoUploadAndCreateProject(
        selectedVideos,
        template,
        customTemplates
      );
    } catch (error) {
      if (!error.userCancelled) {
        dialogManager.showAlert("Processing Error", `Error: ${error.message}`);
      }
      throw error;
    }
  };

  // Function to send a test job to Chillin with two 3sec videos from specified URLs
  const sendTestJobToChillin = async () => {
    try {
      // Sample Chillin JSON project
      const sampleChillinJson = {
        compositeWidth: 1280,
        compositeHeight: 720,
        fps: 30,
        projectData: {
          type: "",
          width: 1280,
          height: 720,
          duration: 6,
          version: 0,
          view: [
            {
              id: "video-1",
              type: "video",
              name: "Test Video 1",
              duration: 3,
              start: 0,
              trackIndex: 0,
              x: 0,
              y: 0,
              width: 1280,
              height: 720,
              blendMode: "normal",
              anchorX: 640,
              anchorY: 360,
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
              alpha: 1,
              skewX: 0,
              skewY: 0,
              hidden: false,
              locked: false,
              keyframes: [],
              src: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/hd/Big_Buck_Bunny_1080_10s_1MB.mp4", // Example test video
              inPoint: 0,
              outPoint: 3,
              volume: 1,
              hasAudio: true,
              playrate: 1,
              isFrontTrimmed: false,
            },
            {
              id: "video-2",
              type: "video",
              name: "Test Video 2",
              duration: 3,
              start: 3,
              trackIndex: 0,
              x: 0,
              y: 0,
              width: 1280,
              height: 720,
              blendMode: "normal",
              anchorX: 640,
              anchorY: 360,
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
              alpha: 1,
              skewX: 0,
              skewY: 0,
              hidden: false,
              locked: false,
              keyframes: [],
              src: "https://test-videos.co.uk/vids/bigbuckbunny/mp4/hd/Big_Buck_Bunny_1080_10s_1MB.mp4", // Example test video
              inPoint: 0,
              outPoint: 3,
              volume: 1,
              hasAudio: true,
              playrate: 1,
              isFrontTrimmed: false,
            },
          ],
          audio: [],
          effect: [],
          transition: [],
        },
      };

      // Show loading indicator
      dialogManager.showAlert("Processing", "Sending test job to Chillin...");

      // Send the job to the Chillin API using the same endpoint and auth as in useChillinAPI
      const response = await fetch(
        "https://render-api.chillin.online/render/v1",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${chillinApiKey}`, // Use the same API key as in useChillinAPI
          },
          body: JSON.stringify(sampleChillinJson),
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Test job sent successfully:", result);

        // Show success with the actual render ID from the API (same as in useChillinAPI)
        dialogManager.showAlert("Success", `Test job sent successfully! Render ID: ${result.data.render_id}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `${response.status} ${response.statusText}: ${
            errorData.msg || "API request failed"
          }`
        );
      }
    } catch (error) {
      console.error("Error sending test job to Chillin:", error);
      dialogManager.showAlert("Error", `Error sending test job: ${error.message}`);
    }
  };

  return {
    // State
    chillinRenders,
    setChillinRenders,
    chillinProjectJson,
    setChillinProjectJson,
    downloadUrl,
    setDownloadUrl,
    
    // Functions
    processVideoUploadAndCreateProject,
    getRenderResult,
    sendChillinProjectToRenderer,
    sendTestJobToChillin
  };
};