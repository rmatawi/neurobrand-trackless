import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Composition, continueRender, delayRender } from 'remotion';
import { Player } from '@remotion/player';
import { Transitions, Fade } from '@remotion/transitions';
import VideoComposition from '../remotion/VideoComposition';

const TracklessVideoEditor = () => {
  const [activeTab, setActiveTab] = useState("templates");
  const [downloadUrl, setDownloadUrl] = useState();

  const [chillinRenders, setChillinRenders] = useState([]);

  // Helper function to get required videos for a template
  const getRequiredVideos = (templateId) => {
    // Check if this is a custom template
    const customTemplate = customTemplates.find(t => t.id === templateId);
    if (customTemplate) {
      return customTemplate.requiredVideos;
    }

    switch (templateId) {
      case 1:
        return 2; // Two videos: 3s + 3s
      case 2:
        return 3; // Three videos: 3s + 1s + 3s
      case 3:
        return 2; // Two videos with overlay from 3-5s (7s total)
      default:
        return 2;
    }
  };

  // State for video handling
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [videoAudioTracks, setVideoAudioTracks] = useState({});
  const [videoVolumes, setVideoVolumes] = useState({}); // For video tracks
  const [audioVolumes, setAudioVolumes] = useState({}); // For audio tracks

  // State for custom templates
  const [customTemplates, setCustomTemplates] = useState([]);
  const [template, setTemplate] = useState(1);
  const [chillinProjectJson, setChillinProjectJson] = useState(null);
  const [templatePreviewJson, setTemplatePreviewJson] = useState(null);
  const [showTemplatePreviewDialog, setShowTemplatePreviewDialog] = useState(false);

  // State for dialogs
  const [createTemplateDialogOpen, setCreateTemplateDialogOpen] = useState(false);
  const [createFromCurrentDialogOpen, setCreateFromCurrentDialogOpen] = useState(false);
  const [editTemplateDialogOpen, setEditTemplateDialogOpen] = useState(false);
  const [editTemplateId, setEditTemplateId] = useState(null);
  const [deleteTemplateDialogOpen, setDeleteTemplateDialogOpen] = useState(false);
  const [deleteTemplateId, setDeleteTemplateId] = useState(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [inOutDialogOpen, setInOutDialogOpen] = useState(false);
  const [inPoint, setInPoint] = useState(0);
  const [outPoint, setOutPoint] = useState(10);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(null);
  const [videoName, setVideoName] = useState('');
  const [videoDuration, setVideoDuration] = useState(10);

  // State for alert dialogs
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertCallback, setAlertCallback] = useState(null);

  // Get the environment variables
  const apiVideoKey = process.env.REACT_APP_API_VIDEO_KEY;
  const chillinApiKey = process.env.REACT_APP_CHILLIN;

  // Clean up object URLs when videos change
  React.useEffect(() => {
    return () => {
      selectedVideos.forEach(video => {
        if (video.blob && video.src && video.src.startsWith('blob:')) {
          URL.revokeObjectURL(video.src);
        }
      });
    };
  }, [selectedVideos]);

  // Load custom templates from localStorage on component mount
  React.useEffect(() => {
    const savedTemplates = localStorage.getItem("customTemplates");
    if (savedTemplates) {
      try {
        setCustomTemplates(JSON.parse(savedTemplates));
      } catch (error) {
        console.error("Error parsing custom templates from localStorage:", error);
        setCustomTemplates([]);
      }
    }
  }, []);

  // Load render jobs from localStorage when component mounts
  React.useEffect(() => {
    const storedRenders = JSON.parse(
      localStorage.getItem("chillinRenders") || "[]"
    );
    // Sort renders by timestamp, latest first (newest timestamp first)
    const sortedRenders = storedRenders.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    setChillinRenders(sortedRenders);
  }, []);

  // Function to save custom templates to localStorage
  const saveCustomTemplates = (templates) => {
    try {
      localStorage.setItem("customTemplates", JSON.stringify(templates));
      setCustomTemplates(templates);
    } catch (error) {
      console.error("Error saving custom templates to localStorage:", error);
    }
  };

  // Function to create a custom template from scratch
  const createCustomTemplate = () => {
    setCreateTemplateDialogOpen(true);
  };

  // Function to create a custom template based on current selection
  const createTemplateFromCurrent = () => {
    if (!template || selectedVideos.length === 0) {
      showAlert("Please select a template and add videos before creating a custom template", "Missing Template or Videos");
      return;
    }
    setCreateFromCurrentDialogOpen(true);
  };

  // Function to load a custom template
  const loadCustomTemplate = (customTemplate) => {
    if (customTemplate.type === "from-current") {
      // Load template from current selection
      setTemplate(customTemplate.originalTemplateId);
      setSelectedVideos(customTemplate.videos);
      setVideoAudioTracks(customTemplate.videoAudioTracks);
      setVideoVolumes(customTemplate.videoVolumes);
      setAudioVolumes(customTemplate.audioVolumes);
    } else {
      // For custom templates created from scratch, set it as a new template selection
      setTemplate(customTemplate.id); // Use the custom template ID to identify it
      setSelectedVideos([]);
      setVideoAudioTracks({});
      setVideoVolumes({});
      setAudioVolumes({});
    }
  };

  // Function to edit a custom template
  const editCustomTemplate = (templateId) => {
    const templateToEdit = customTemplates.find(t => t.id === templateId);
    if (!templateToEdit) {
      showAlert("Template not found", "Error");
      return;
    }

    setVideoName(templateToEdit.name); // Set the current name in the input field
    setEditTemplateId(templateId);
    setEditTemplateDialogOpen(true);
  };

  // Handle editing a custom template
  const handleEditTemplate = () => {
    if (!editTemplateId) return;

    const templateToEdit = customTemplates.find(t => t.id === editTemplateId);
    if (!templateToEdit) {
      showAlert("Template not found", "Error");
      return;
    }

    const newName = videoName.trim();
    if (!newName) {
      showAlert("Template name cannot be empty", "Invalid Name");
      return;
    }

    // Check if another template exists with the same name (excluding the current template)
    if (
      customTemplates.some(
        (t) => t.id !== editTemplateId && t.name === newName
      )
    ) {
      showAlert("A template with this name already exists", "Duplicate Name");
      return;
    }

    // Handle templates based on their type
    if (templateToEdit.type === "from-current") {
      // For templates created from current selection, we can only edit the name
      const updatedTemplates = customTemplates.map(t =>
        t.id === editTemplateId ? { ...t, name: newName } : t
      );
      saveCustomTemplates(updatedTemplates);
      showAlert("Template name updated successfully", "Success");
    } else {
      // For templates created from scratch, we can edit name, required videos, and descriptions
      const numVideosStr = prompt(`How many videos does this template require? (Current: ${templateToEdit.requiredVideos})`, templateToEdit.requiredVideos);
      const num = parseInt(numVideosStr);
      if (isNaN(num) || num <= 0 || num > 10) {
        showAlert("Please enter a valid number between 1 and 10", "Invalid Number");
        return;
      }

      // Get new descriptions for each video
      let descriptionIndex = 0;
      const newDescriptions = [];
      const newVideoDurations = []; // New array for durations
      const collectNewDescriptionsAndDurations = () => {
        if (descriptionIndex < num) {
          const currentDescription = templateToEdit.videoDescriptions?.[descriptionIndex] || "";
          const currentDuration = templateToEdit.videoDurations?.[descriptionIndex] !== undefined
            ? templateToEdit.videoDurations[descriptionIndex]
            : 3; // Default to 3 seconds if not set

          const description = prompt(`Enter description for video ${descriptionIndex + 1} (optional):`, currentDescription);

          if (description !== null) {
            newDescriptions.push(description || "");

            const durationInput = prompt(`Enter duration for video ${descriptionIndex + 1} in seconds (e.g., 5 for 5 seconds):`, currentDuration.toString());
            const duration = parseFloat(durationInput);
            if (isNaN(duration) || duration <= 0) {
              showAlert("Please enter a valid positive number for duration.", "Invalid Duration");
              // Re-collect for the current video if invalid
              collectNewDescriptionsAndDurations();
              return;
            }
            newVideoDurations.push(duration);
            descriptionIndex++;
            collectNewDescriptionsAndDurations(); // Recursive call for next video
          }
        } else {
          // All descriptions and durations collected, update the template
          const updatedTemplates = customTemplates.map(t =>
            t.id === editTemplateId
              ? {
                  ...t,
                  name: newName.trim(),
                  requiredVideos: num,
                  videoDescriptions: newDescriptions,
                  videoDurations: newVideoDurations, // Store new durations
                }
              : t
          );
          saveCustomTemplates(updatedTemplates);
          showAlert("Template updated successfully", "Success");
        }
      };

      // Start collecting new descriptions and durations
      collectNewDescriptionsAndDurations();
    }

    setEditTemplateDialogOpen(false);
    setEditTemplateId(null);
    setVideoName('');
  };

  // Function to delete a custom template
  const deleteCustomTemplate = (templateId) => {
    setDeleteTemplateId(templateId);
    setDeleteTemplateDialogOpen(true);
  };

  // Handle picking video from device
  const handlePickFromDevice = async (requiredVideos, currentTemplate, targetIndex = null) => {
    // Check if videos have already been added for Template 1 or 3 but we need 2, or Template 2 but we need 3
    if (targetIndex === null && selectedVideos.length >= requiredVideos) {
      showAlert(`Template ${currentTemplate} requires exactly ${requiredVideos} videos. Remove current videos before adding more.`, "Too Many Videos");
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
          inOutPoints: { inPoint: 0, outPoint: videoDuration }
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
            showAlert(`Template ${currentTemplate} requires exactly ${requiredVideos} videos.`, "Video Limit Reached");
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
        showAlert(`Error loading video: ${error.message}`, "Processing Error");
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
      return selectedVideos[index].inOutPoints || { inPoint: 0, outPoint: selectedVideos[index].duration || 10 };
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
            const shouldTrim = window.confirm(
              `Video duration is ${videoDuration.toFixed(
                2
              )}s, but audio is ${audioDuration.toFixed(
                2
              )}s long. Trim audio to match video length?`
            );

            if (shouldTrim) {
              // User wants to trim audio, store audio reference with video
              addAudioToVideo(
                videoIndex,
                file,
                true,
                videoDuration
              );
            } else {
              // User doesn't want to trim, use full audio
              addAudioToVideo(
                videoIndex,
                file,
                false,
                audioDuration
              );
            }
          } else {
            // Video is longer than or equal to audio, no need to trim
            addAudioToVideo(videoIndex, file, false, audioDuration);
          }
        };

        audioElement.onerror = () => {
          showAlert("Could not load audio to get duration", "Error");
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

    showAlert(`Audio file added to Video ${videoIndex + 1}`, "Audio Added");
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

    showAlert(`Audio removed from Video ${videoIndex + 1}`, "Audio Removed");
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

  // Function to open volume adjustment dialog
  const openVolumeDialog = (videoIndex, isAudioTrack = false) => {
    const currentVolume = isAudioTrack
      ? audioVolumes[videoIndex] !== undefined
        ? audioVolumes[videoIndex]
        : 1
      : videoVolumes[videoIndex] !== undefined
      ? videoVolumes[videoIndex]
      : 1;

    const trackType = isAudioTrack ? "Audio" : "Video";

    // Create a custom modal dialog with a slider for volume adjustment
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';
    modal.style.flexDirection = 'column';
    modal.style.padding = '20px';

    modal.innerHTML = `
      <div style="width: 80%; max-width: 500px; background: white; padding: 30px; border-radius: 8px; position: relative; text-align: center;">
        <h3>Adjust ${trackType} Volume - Track ${videoIndex + 1}</h3>
        <p style="margin: 20px 0;">Volume Level: <span id="volume-value-${videoIndex}-${
      isAudioTrack ? "audio" : "video"
    }">${(currentVolume * 100).toFixed(0)}%</span></p>
        <input
          type="range"
          id="volume-slider-${videoIndex}-${
      isAudioTrack ? "audio" : "video"
    }"
          min="0"
          max="1"
          step="0.01"
          value="${currentVolume}"
          style="width: 100%; height: 8px; border-radius: 4px;"
        />
        <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 12px; color: #666;">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
        <div style="margin-top: 30px; display: flex; justify-content: space-between;">
          <button id="ok-btn-${videoIndex}-${isAudioTrack ? "audio" : "video"}" style="background-color: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 16px;">OK</button>
          <button id="cancel-btn-${videoIndex}-${isAudioTrack ? "audio" : "video"}" style="background-color: #f44336; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 16px;">Cancel</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Get references to the slider, value display, and buttons
    const slider = document.getElementById(`volume-slider-${videoIndex}-${isAudioTrack ? "audio" : "video"}`);
    const valueDisplay = document.getElementById(`volume-value-${videoIndex}-${isAudioTrack ? "audio" : "video"}`);
    const okBtn = document.getElementById(`ok-btn-${videoIndex}-${isAudioTrack ? "audio" : "video"}`);
    const cancelBtn = document.getElementById(`cancel-btn-${videoIndex}-${isAudioTrack ? "audio" : "video"}`);

    // Update the volume display as the slider moves
    slider.addEventListener("input", () => {
      valueDisplay.textContent = `${(parseFloat(slider.value) * 100).toFixed(0)}%`;
    });

    // Handle OK button click
    okBtn.onclick = () => {
      const newVolume = parseFloat(slider.value);
      if (isAudioTrack) {
        setAudioVolume(videoIndex, newVolume);
      } else {
        setVideoVolume(videoIndex, newVolume);
      }

      // Remove modal
      document.body.removeChild(modal);
    };

    // Handle Cancel button click
    cancelBtn.onclick = () => {
      // Remove modal
      document.body.removeChild(modal);
    };
  };

  // Function to move a video back in the sequence
  const moveVideoBack = (videoIndex) => {
    if (videoIndex <= 0) return; // Can't move the first video back

    // Swap the video at videoIndex with the one before it
    const newVideos = [...selectedVideos];
    const temp = newVideos[videoIndex - 1];
    newVideos[videoIndex - 1] = newVideos[videoIndex];
    newVideos[videoIndex] = temp;
    setSelectedVideos(newVideos);

    // Also move any associated data (audio tracks, volumes, in/out points)
    const newVideoAudioTracks = { ...videoAudioTracks };
    const newVideoVolumes = { ...videoVolumes };
    const newAudioVolumes = { ...audioVolumes };

    // Swap audio tracks
    const audioTemp = newVideoAudioTracks[videoIndex - 1];
    newVideoAudioTracks[videoIndex - 1] = newVideoAudioTracks[videoIndex];
    newVideoAudioTracks[videoIndex] = audioTemp;

    // Swap video volumes
    const videoVolumeTemp = newVideoVolumes[videoIndex - 1];
    newVideoVolumes[videoIndex - 1] = newVideoVolumes[videoIndex];
    newVideoVolumes[videoIndex] = videoVolumeTemp;

    // Swap audio volumes
    const audioVolumeTemp = newAudioVolumes[videoIndex - 1];
    newAudioVolumes[videoIndex - 1] = newAudioVolumes[videoIndex];
    newAudioVolumes[videoIndex] = audioVolumeTemp;

    setVideoAudioTracks(newVideoAudioTracks);
    setVideoVolumes(newVideoVolumes);
    setAudioVolumes(newAudioVolumes);
  };

  // Function to move a video forward in the sequence
  const moveVideoForward = (videoIndex) => {
    if (videoIndex >= selectedVideos.length - 1) return; // Can't move the last video forward

    // Swap the video at videoIndex with the one after it
    const newVideos = [...selectedVideos];
    const temp = newVideos[videoIndex + 1];
    newVideos[videoIndex + 1] = newVideos[videoIndex];
    newVideos[videoIndex] = temp;
    setSelectedVideos(newVideos);

    // Also move any associated data (audio tracks, volumes, in/out points)
    const newVideoAudioTracks = { ...videoAudioTracks };
    const newVideoVolumes = { ...videoVolumes };
    const newAudioVolumes = { ...audioVolumes };

    // Swap audio tracks
    const audioTemp = newVideoAudioTracks[videoIndex + 1];
    newVideoAudioTracks[videoIndex + 1] = newVideoAudioTracks[videoIndex];
    newVideoAudioTracks[videoIndex] = audioTemp;

    // Swap video volumes
    const videoVolumeTemp = newVideoVolumes[videoIndex + 1];
    newVideoVolumes[videoIndex + 1] = newVideoVolumes[videoIndex];
    newVideoVolumes[videoIndex] = videoVolumeTemp;

    // Swap audio volumes
    const audioVolumeTemp = newAudioVolumes[videoIndex + 1];
    newAudioVolumes[videoIndex + 1] = newAudioVolumes[videoIndex];
    newAudioVolumes[videoIndex] = audioVolumeTemp;

    setVideoAudioTracks(newVideoAudioTracks);
    setVideoVolumes(newVideoVolumes);
    setAudioVolumes(newAudioVolumes);
  };

  // Function to update audio duration when video in/out points change
  const updateAudioDuration = (videoIndex) => {
    // If this video has audio attached and should be trimmed, update its duration
    if (
      videoAudioTracks[videoIndex] &&
      videoAudioTracks[videoIndex].shouldTrim
    ) {
      const videoInOutPoints = getInOutPoints(videoIndex);
      const videoInPoint =
        videoInOutPoints.inPoint !== undefined ? videoInOutPoints.inPoint : 0;
      const videoOutPoint =
        videoInOutPoints.outPoint !== undefined ? videoInOutPoints.outPoint : 3; // Default to 3s
      const videoDuration = videoOutPoint - videoInPoint;

      // Update the audio track with the new duration
      setVideoAudioTracks((prevTracks) => {
        if (!prevTracks[videoIndex]) return prevTracks;

        return {
          ...prevTracks,
          [videoIndex]: {
            ...prevTracks[videoIndex],
            duration: Math.min(prevTracks[videoIndex].duration, videoDuration), // Keep the minimum of current duration and video duration
          },
        };
      });
    }
  };

  // Function to adjust positions of videos when one video's duration changes
  const adjustVideoPositions = (changedVideoIndex, durationChange) => {
    // The positions and durations will be recalculated in showChillinPreview
    // based on the updated in/out points. The key is that we need to make sure
    // when videos are arranged sequentially (trackIndex 0), that they shift properly.
  };

  // Function to handle getting render result for a specific render ID
  const handleGetRenderResult = async (renderId) => {
    try {
      const response = await fetch(
        "https://render-api.chillin.online/render/result",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${chillinApiKey}`,
          },
          body: JSON.stringify({
            render_id: renderId,
          }),
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

      const data = await response.json();
      if (data?.data?.render?.state == "success") {
        console.log({ data: data.data.render.video_url });
        setDownloadUrl(data.data.render.video_url);
        showAlert(`Your video is ready! Video URL: ${data.data.render.video_url}`, "Render Success");
      }
      if (data?.data?.render?.state == "pending") {
        setDownloadUrl();
        showAlert("Please try again later.", "Pending");
      }
      if (data?.data?.render?.state == "failed") {
        setDownloadUrl();
        showAlert("Render job failed.", "Failed");
      }
    } catch (error) {
      showAlert(`Error getting render result: ${error.message}`, "Error");
    }
  };

  // Function to handle setting in/out points for videos with video player
  const handleInOutPoints = (videoIndex) => {
    // Adjust @src/pages/TracklessVideo.jsx function handleInOutPoints(): After setting the in and out point it should also calculate and adjust the total duration of the video edit. The video edit is then played using showChillinPreview(). Important: when a video changes in duration, the surrounding video's in the sequence on the same track should also shift accordingly. Eg |--video1--|--video2--|--video3--|. When the length of video1 changes it should result in |----video1----|--video2--|--video3--|.
    const video = selectedVideos[videoIndex];

    const originalInOutPoints = getInOutPoints(videoIndex);
    const originalVideoState = {
      videoName: video.name,
      videoIndex: videoIndex,
      inPoint: originalInOutPoints.inPoint,
      outPoint: originalInOutPoints.outPoint,
    };
    console.log(
      "debugvideo: original video state",
      JSON.stringify(originalVideoState, null, 2)
    );

    // Create a temporary video element to get duration
    const videoElement = document.createElement("video");
    let videoUrl;

    if (video.blob) {
      videoUrl = URL.createObjectURL(video.blob);
    } else if (video.src) {
      videoUrl = video.src;
    } else {
      showAlert("Video source not available", "Error");
      return;
    }

    videoElement.src = videoUrl;

    videoElement.onloadedmetadata = () => {
      const duration = videoElement.duration;

      // Create a dialog with a video player to set in/out points
      const currentInOutPoints = getInOutPoints(videoIndex);
      const inPoint =
        currentInOutPoints.inPoint !== undefined
          ? currentInOutPoints.inPoint
          : 0;
      const outPoint =
        currentInOutPoints.outPoint !== undefined
          ? currentInOutPoints.outPoint
          : duration;

      // Create a simple modal for the video player
      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
      modal.style.display = 'flex';
      modal.style.justifyContent = 'center';
      modal.style.alignItems = 'center';
      modal.style.zIndex = '1000';
      modal.style.flexDirection = 'column';
      modal.style.padding = '20px';

      modal.innerHTML = `
        <div style="width: 80%; max-width: 800px; background: white; padding: 20px; border-radius: 8px; position: relative;">
          <h3>Set In/Out Points - Video ${videoIndex + 1}</h3>
          <video
            id="inout-video-${videoIndex}"
            src="${videoUrl}"
            controls
            style="width: 100%; border-radius: 8px; margin-bottom: 15px;"
          ></video>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <div style="text-align: center; flex: 1; margin-right: 5px;">
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">Duration: ${duration.toFixed(
                2
              )}s</p>
              <button id="set-in-btn-${videoIndex}" style="width: 100%; background-color: #007aff; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; font-size: 14px;">
                In: ${inPoint.toFixed(2)}s
              </button>
            </div>
            <div style="text-align: center; flex: 1; margin-left: 5px;">
              <p id="current-time-display-${videoIndex}" style="margin: 0 0 5px 0; font-size: 12px; color: #666;">Current: 0.00s</p>
              <button id="set-out-btn-${videoIndex}" style="width: 100%; background-color: #4cd964; color: white; border: none; padding: 10px; border-radius: 4px; cursor: pointer; font-size: 14px;">
                Out: ${outPoint.toFixed(2)}s
              </button>
            </div>
          </div>
          <div style="margin-top: 20px; display: flex; justify-content: space-between;">
            <button id="save-points-btn-${videoIndex}" style="background-color: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 16px;">Save Points</button>
            <button id="cancel-btn-${videoIndex}" style="background-color: #f44336; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 16px;">Cancel</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Add event listeners for the "Set to Current" buttons
      const setInBtn = document.getElementById(`set-in-btn-${videoIndex}`);
      const setOutBtn = document.getElementById(`set-out-btn-${videoIndex}`);
      const videoPlayer = document.getElementById(`inout-video-${videoIndex}`);
      const currentTimeDisplay = document.getElementById(`current-time-display-${videoIndex}`);
      const savePointsBtn = document.getElementById(`save-points-btn-${videoIndex}`);
      const cancelBtn = document.getElementById(`cancel-btn-${videoIndex}`);

      let currentInPoint = inPoint;
      let currentOutPoint = outPoint;

      // Update the current time display
      const updateCurrentTimeDisplay = () => {
        if (currentTimeDisplay && videoPlayer) {
          currentTimeDisplay.innerHTML = `Current: ${videoPlayer.currentTime.toFixed(2)}s`;
        }
      };

      // Add timeupdate listener to video player
      if (videoPlayer) {
        videoPlayer.addEventListener("timeupdate", updateCurrentTimeDisplay);

        // Set initial current time display
        updateCurrentTimeDisplay();
      }

      if (setInBtn) {
        setInBtn.onclick = () => {
          const currentTime = videoPlayer.currentTime;

          // Validate that inPoint is before outPoint
          if (currentTime >= currentOutPoint) {
            showAlert(`In point must be before out point (${currentOutPoint.toFixed(2)}s)`, "Invalid In Point");
            return;
          }

          currentInPoint = currentTime;
          setInBtn.innerHTML = `In: ${currentInPoint.toFixed(2)}s`;

          // Update audio duration if needed
          updateAudioDuration(videoIndex);
        };
      }

      if (setOutBtn) {
        setOutBtn.onclick = () => {
          const currentTime = videoPlayer.currentTime;

          // Validate that outPoint is after inPoint
          if (currentTime <= currentInPoint) {
            showAlert(`Out point must be after in point (${currentInPoint.toFixed(2)}s)`, "Invalid Out Point");
            return;
          }

          currentOutPoint = currentTime;
          setOutBtn.innerHTML = `Out: ${currentOutPoint.toFixed(2)}s`;

          // Update audio duration if needed
          updateAudioDuration(videoIndex);
        };
      }

      if (savePointsBtn) {
        savePointsBtn.onclick = () => {
          // Set the in/out points in the state
          setInPoint(videoIndex, currentInPoint);
          setOutPoint(videoIndex, currentOutPoint);

          // Update audio duration if this video has audio attached
          updateAudioDuration(videoIndex);

          // Calculate new duration for the current video
          const newVideoDuration = currentOutPoint - currentInPoint;

          // Get original duration to compare
          const originalInPoint =
            originalInOutPoints.inPoint !== undefined
              ? originalInOutPoints.inPoint
              : 0;
          const originalOutPoint =
            originalInOutPoints.outPoint !== undefined
              ? originalInOutPoints.outPoint
              : duration;
          const originalVideoDuration = originalOutPoint - originalInPoint;

          // Only adjust if the duration has actually changed
          if (Math.abs(newVideoDuration - originalVideoDuration) > 0.001) {
            // Account for floating point precision
            // Calculate the change in duration
            const durationChange = newVideoDuration - originalVideoDuration;

            // Adjust the surrounding videos on the same track
            adjustVideoPositions(videoIndex, durationChange);
          }

          // Remove modal
          document.body.removeChild(modal);

          // Revoke the object URL to free memory
          if (video.blob) {
            URL.revokeObjectURL(videoUrl);
          }
        };
      }

      if (cancelBtn) {
        cancelBtn.onclick = () => {
          // Remove modal
          document.body.removeChild(modal);

          // Revoke the object URL to free memory
          if (video.blob) {
            URL.revokeObjectURL(videoUrl);
          }
        };
      }
    };

    videoElement.onerror = () => {
      showAlert("Could not load video to get duration", "Error");
      if (video.blob) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  };

  // Function to prepare and show the Chillin project preview
  const showChillinPreview = () => {
    // Validate that we have the right number of videos for the selected template
    let requiredVideos;
    let totalDuration;

    // Check if this is a custom template
    const customTemplate = customTemplates.find((t) => t.id === template);
    if (customTemplate) {
      requiredVideos = customTemplate.requiredVideos;
      // Total duration will be calculated after video layers are created based on actual positions and durations
    } else {
      requiredVideos = getRequiredVideos(template);
      // Total duration will be calculated after video layers are created based on actual positions and durations
    }

    if (!selectedVideos || selectedVideos.length !== requiredVideos) {
      showAlert(
        `Template ${template} requires exactly ${requiredVideos} videos. You currently have ${selectedVideos.length} videos.`,
        "Incorrect Video Count"
      );
      return;
    }

    // Create a chillin project JSON based on the selected template
    let videoLayers = [];

    // For custom templates, create a simple sequence where each video plays according to its in/out points
    if (customTemplate) {
      // Calculate start times sequentially based on actual durations
      let currentTime = 0;
      videoLayers = selectedVideos.map((video, index) => {
        // Determine the video URL based on whether it's a blob or a src
        const videoUrl = video.blob
          ? URL.createObjectURL(video.blob)
          : video.src;

        // Get in/out points for this video if they exist
        const inOutPoints = getInOutPoints(index);
        const inPoint =
          inOutPoints.inPoint !== undefined ? inOutPoints.inPoint : 0;

        // Use the custom template's specified duration if no outPoint is set
        let outPoint;
        if (inOutPoints.outPoint !== undefined) {
          outPoint = inOutPoints.outPoint;
        } else if (
          customTemplate.videoDurations &&
          customTemplate.videoDurations[index] !== undefined
        ) {
          // Use the custom template's specified duration
          outPoint = inPoint + customTemplate.videoDurations[index];
        } else {
          // Fallback to 3 seconds if no custom duration is specified
          outPoint = inPoint + 3;
        }

        const sourceDuration = outPoint - inPoint;

        const layer = {
          id: video.id || `video-${index}`,
          type: "Video",
          start: currentTime, // Start after the previous video ends
          duration: sourceDuration, // Duration based on actual video length after outpoint
          trackIndex: 0,
          x: 0,
          y: 0,
          width: 1280,
          height: 720,
          blendMode: "normal",
          anchorX: 0,
          anchorY: 0,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          alpha: 1,
          skewX: 0,
          skewY: 0,
          hidden: false,
          locked: false,
          keyframes: [],
          externalUrl: videoUrl, // Use the user's video URL
          ext: "mp4",
          startInSource: inPoint,
          volume: videoVolumes[index] !== undefined ? videoVolumes[index] : 1, // Use stored volume or default to 1
          hasAudio: true,
          playrate: 1,
          isFrontTrimmed: false,
          sourceDuration: sourceDuration,
        };

        // Update the current time for the next video
        currentTime += sourceDuration;

        return layer;
      });
    } else {
      // For all other templates, use the template preview data to determine the structure
      const templateData = createTemplatePreviewData(template);
      if (
        templateData &&
        templateData.projectData &&
        templateData.projectData.view
      ) {
        // Handle same-track sequential positioning - if videos are on same track,
        // position them sequentially based on actual durations to allow proper shifting
        videoLayers = [];
        const trackStartTimes = {}; // Keep track of start times for each track

        for (let index = 0; index < selectedVideos.length; index++) {
          const video = selectedVideos[index];
          // Determine the video URL based on whether it's a blob or a src
          const videoUrl = video.blob
            ? URL.createObjectURL(video.blob)
            : video.src;

          // Get the corresponding template video configuration
          const templateVideoConfig = templateData.projectData.view[index];
          const trackIndex = templateVideoConfig
            ? templateVideoConfig.trackIndex
            : 0;

          // Get in/out points for this video if they exist
          const inOutPoints = getInOutPoints(index);
          console.log(
            `debugvideo: showChillinPreview - inOutPoints for video ${index}`,
            JSON.stringify(inOutPoints, null, 2)
          );
          const inPoint =
            inOutPoints.inPoint !== undefined ? inOutPoints.inPoint : 0;
          const outPoint =
            inOutPoints.outPoint !== undefined
              ? inOutPoints.outPoint
              : templateVideoConfig
              ? templateVideoConfig.duration
              : 3; // Default to template duration or 3
          const sourceDuration = outPoint - inPoint;

          // Determine the start time based on the track's current position
          const startTime = trackStartTimes[trackIndex] || 0;

          // Use the template configuration as a base but adjust with user's video data
          const layer = {
            id: video.id || `video-${index}`,
            type: "Video",
            start: startTime, // Position sequentially within the track
            duration: sourceDuration, // Duration based on actual video length after outpoint
            trackIndex: trackIndex,
            x: templateVideoConfig ? templateVideoConfig.x : 0,
            y: templateVideoConfig ? templateVideoConfig.y : 0,
            width: templateVideoConfig ? templateVideoConfig.width : 1280,
            height: templateVideoConfig ? templateVideoConfig.height : 720,
            blendMode: templateVideoConfig
              ? templateVideoConfig.blendMode
              : "normal",
            anchorX: templateVideoConfig ? templateVideoConfig.anchorX : 0,
            anchorY: templateVideoConfig ? templateVideoConfig.anchorY : 0,
            rotation: templateVideoConfig ? templateVideoConfig.rotation : 0,
            scaleX: templateVideoConfig ? templateVideoConfig.scaleX : 1,
            scaleY: templateVideoConfig ? templateVideoConfig.scaleY : 1,
            alpha: templateVideoConfig ? templateVideoConfig.alpha : 1,
            skewX: templateVideoConfig ? templateVideoConfig.skewX : 0,
            skewY: templateVideoConfig ? templateVideoConfig.skewY : 0,
            hidden: templateVideoConfig ? templateVideoConfig.hidden : false,
            locked: templateVideoConfig ? templateVideoConfig.locked : false,
            keyframes: templateVideoConfig ? templateVideoConfig.keyframes : [],
            externalUrl: videoUrl, // Use the user's video URL
            ext: "mp4",
            startInSource: inPoint,
            volume: videoVolumes[index] !== undefined ? videoVolumes[index] : 1, // Use stored volume or default to 1
            hasAudio: templateVideoConfig ? templateVideoConfig.hasAudio : true,
            playrate: templateVideoConfig ? templateVideoConfig.playrate : 1,
            isFrontTrimmed: templateVideoConfig
              ? templateVideoConfig.isFrontTrimmed
              : false,
            sourceDuration: sourceDuration,
          };

          // Update the start time for this track
          trackStartTimes[trackIndex] = startTime + sourceDuration;

          videoLayers.push(layer);
        }
      } else {
        // Fallback for unknown templates: create simple sequence based on actual durations
        let currentTime = 0;
        videoLayers = selectedVideos.map((video, index) => {
          // Determine the video URL based on whether it's a blob or a src
          const videoUrl = video.blob
            ? URL.createObjectURL(video.blob)
            : video.src;

          // Get in/out points for this video if they exist
          const inOutPoints = getInOutPoints(index);
          const inPoint =
            inOutPoints.inPoint !== undefined ? inOutPoints.inPoint : 0;
          const outPoint =
            inOutPoints.outPoint !== undefined ? inOutPoints.outPoint : 3; // Default to 3s
          const sourceDuration = outPoint - inPoint;

          const layer = {
            id: video.id || `video-${index}`,
            type: "Video",
            start: currentTime, // Start after the previous video ends
            duration: sourceDuration, // Duration based on actual video length after outpoint
            trackIndex: 0,
            x: 0,
            y: 0,
            width: 1280,
            height: 720,
            blendMode: "normal",
            anchorX: 0,
            anchorY: 0,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            skewX: 0,
            skewY: 0,
            hidden: false,
            locked: false,
            keyframes: [],
            externalUrl: videoUrl, // Use the user's video URL
            ext: "mp4",
            startInSource: inPoint,
            volume: videoVolumes[index] !== undefined ? videoVolumes[index] : 1, // Use stored volume or default to 1
            hasAudio: true,
            playrate: 1,
            isFrontTrimmed: false,
            sourceDuration: sourceDuration,
          };

          // Update the current time for the next video
          currentTime += sourceDuration;

          return layer;
        });
      }
    }

    // Calculate total duration based on the end times of all video layers
    // Total duration is the maximum end time across all video layers
    totalDuration =
      videoLayers.length > 0
        ? Math.max(...videoLayers.map((layer) => layer.start + layer.duration))
        : 0;

    // Create audio layers for videos that have audio tracks attached
    const audioLayers = [];
    selectedVideos.forEach((video, index) => {
      if (videoAudioTracks[index]) {
        const audioTrack = videoAudioTracks[index];
        const videoInOutPoints = getInOutPoints(index);
        const correspondingVideoLayer = videoLayers.find(
          (layer) => layer.id === (video.id || `video-${index}`)
        );
        const videoStart = correspondingVideoLayer?.start || 0;
        const videoInPoint =
          videoInOutPoints.inPoint !== undefined ? videoInOutPoints.inPoint : 0;
        const videoOutPoint =
          videoInOutPoints.outPoint !== undefined
            ? videoInOutPoints.outPoint
            : 3; // Default to 3s
        const videoDuration = videoOutPoint - videoInPoint;

        // Calculate the audio duration based on whether it should be trimmed
        const audioDuration = videoAudioTracks[index].shouldTrim
          ? Math.min(videoAudioTracks[index].duration, videoDuration)
          : videoAudioTracks[index].duration;

        // Get the stored volume for this audio track or default to 1
        const baseVolume =
          audioVolumes[index] !== undefined ? audioVolumes[index] : 1;

        // Create keyframes for fade in/out effects (500ms = 0.5s)
        const fadeDuration = 0.5; // 500ms in seconds
        const keyframes = [];

        // Fade In: Start with 0 and increase to the base volume over 500ms
        if (audioDuration > fadeDuration) {
          // Add volume keyframes for fade in
          keyframes.push({
            property: "volume",
            type: "number",
            keyframeItems: [
              { time: 0, value: 0 }, // Start at 0 volume at the beginning
              { time: fadeDuration, value: baseVolume }, // Reach base volume after 500ms
            ],
          });

          // Add volume keyframes for fade out
          keyframes.push({
            property: "volume",
            type: "number",
            keyframeItems: [
              { time: audioDuration - fadeDuration, value: baseVolume }, // Base volume until 500ms before end
              { time: audioDuration, value: 0 }, // Fade to 0 volume at the end
            ],
          });
        } else {
          // If audio is shorter than fade duration, do proportional fade
          const halfDuration = audioDuration / 2;
          keyframes.push({
            property: "volume",
            type: "number",
            keyframeItems: [
              { time: 0, value: 0 }, // Start at 0 volume
              { time: halfDuration, value: baseVolume }, // Reach base volume at midpoint
              { time: audioDuration, value: 0 }, // End at 0 volume
            ],
          });
        }

        audioLayers.push({
          id: `audio-${video.id || index}`,
          type: "Audio",
          start: videoStart, // Start at the same time as the corresponding video
          duration: audioDuration, // Duration of the audio clip
          trackIndex: correspondingVideoLayer
            ? correspondingVideoLayer.trackIndex
            : index, // Use the same track index as the corresponding video
          blendMode: "normal",
          hidden: false,
          locked: false,
          keyframes: keyframes, // Include fade in/out keyframes
          externalUrl: audioTrack.url, // Use the user's audio URL
          ext: audioTrack.file.name.split(".").pop() || "mp3", // Get file extension
          startInSource: 0, // Start from beginning of audio file
          volume: baseVolume, // Use user-set volume
          hasAudio: true,
          playrate: 1,
          isFrontTrimmed: false,
          sourceDuration: audioDuration,
        });
      }
    });

    // Create a chillin project JSON with the user's videos
    const chillinJson = {
      compositeWidth: 1280,
      compositeHeight: 720,
      fps: 30,
      projectData: {
        type: "",
        width: 1280,
        height: 720,
        fill: "#000000",
        duration: totalDuration, // Total duration based on template
        version: 0,
        view: videoLayers,
        audio: audioLayers, // Add the audio layers we created
        effect: [],
        transition: [],
      },
    };

    // Set the data and add a small delay to ensure sheet is open before rendering
    setChillinProjectJson(chillinJson);

    showAlert("Chillin preview data set! The preview would now be displayed.", "Preview Ready");
  };

  // Function to send a test job to Chillin with two 3sec videos from specified URLs
  const sendTestJobToChillin = async () => {
    const videoUrls = [
      "https://vod.api.video/vod/vi1aD6KnBMa3Qdu6o1Pl5QEK/mp4/source.mp4",
      "https://vod.api.video/vod/vi5DLuGzKHbEWXRRnRWalFii/mp4/source.mp4",
    ];

    // Create a Chillin project JSON with the test videos at lowest resolution (480x270)
    const sampleChillinJson = {
      compositeWidth: 480,
      compositeHeight: 270,
      fps: 30,
      projectData: {
        type: "",
        width: 480,
        height: 270,
        fill: "#000000",
        duration: 6, // 2 videos, 3 seconds each = 6 seconds total
        version: 0,
        view: [
          // First video: 0-3 seconds
          {
            id: "test-video-1",
            type: "Video",
            start: 0,
            duration: 3,
            trackIndex: 0,
            x: 0,
            y: 0,
            width: 480,
            height: 270,
            blendMode: "normal",
            anchorX: 240,
            anchorY: 135,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            skewX: 0,
            skewY: 0,
            hidden: false,
            locked: false,
            keyframes: [],
            externalUrl: videoUrls[0], // Use first test video URL
            ext: "mp4",
            startInSource: 0,
            volume: 1,
            hasAudio: true,
            playrate: 1,
            isFrontTrimmed: false,
            sourceDuration: 3,
          },
          // Second video: 3-6 seconds
          {
            id: "test-video-2",
            type: "Video",
            start: 3,
            duration: 3,
            trackIndex: 0,
            x: 0,
            y: 0,
            width: 480,
            height: 270,
            blendMode: "normal",
            anchorX: 240,
            anchorY: 135,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            skewX: 0,
            skewY: 0,
            hidden: false,
            locked: false,
            keyframes: [],
            externalUrl: videoUrls[1], // Use second test video URL
            ext: "mp4",
            startInSource: 0,
            volume: 1,
            hasAudio: true,
            playrate: 1,
            isFrontTrimmed: false,
            sourceDuration: 3,
          },
        ],
        audio: [], // No additional audio tracks for test
        effect: [],
        transition: [],
      },
    };

    try {
      // Show loading indicator
      showAlert("Sending test job to Chillin...", "Processing");

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
        showAlert(`Test job sent successfully! Render ID: ${result.data.render_id}`, "Success");
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
      showAlert(`Error sending test job: ${error.message}`, "Error");
    }
  };

  // Function to interact with api.video service
  const getApiVideoBaseUrl = () => {
    // For this implementation, we'll use the standard API, but you can customize based on environment
    return "https://ws.api.video";
  };

  // Function to upload video to api.video using the API key
  const uploadVideoToApiVideo = async (file) => {
    if (!apiVideoKey) {
      throw new Error("API Video key not found. Please set REACT_APP_API_VIDEO_KEY in your environment variables.");
    }

    try {
      // First, create a new video entry
      const createResponse = await fetch(`${getApiVideoBaseUrl()}/video`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiVideoKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: file.name || `TracklessVideo-${Date.now()}`,
          description: `Uploaded via TracklessVideoEditor on ${new Date().toISOString()}`
        })
      });

      if (!createResponse.ok) {
        const error = await createResponse.json().catch(() => ({ message: `HTTP ${createResponse.status}: ${createResponse.statusText}` }));
        throw new Error(error.message || `Failed to create video entry: ${createResponse.statusText}`);
      }

      const videoData = await createResponse.json();

      // Then upload the actual file
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch(
        `${getApiVideoBaseUrl()}/video/${videoData.videoId}/source`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiVideoKey}`
          },
          body: formData
        }
      );

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json().catch(() => ({ message: `HTTP ${uploadResponse.status}: ${uploadResponse.statusText}` }));
        throw new Error(error.message || `Failed to upload video: ${uploadResponse.statusText}`);
      }

      const uploadedVideo = await uploadResponse.json();
      console.log("Video uploaded successfully to api.video:", uploadedVideo);

      return uploadedVideo;
    } catch (error) {
      console.error("Error uploading video to api.video:", error);
      throw error;
    }
  };

  // Function to get video status from api.video
  const getApiVideoStatus = async (videoId) => {
    if (!apiVideoKey) {
      throw new Error("API Video key not found. Please set REACT_APP_API_VIDEO_KEY in your environment variables.");
    }

    try {
      const response = await fetch(`${getApiVideoBaseUrl()}/video/${videoId}`, {
        headers: {
          "Authorization": `Bearer ${apiVideoKey}`,
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}: ${response.statusText}` }));
        throw new Error(error.message || `Failed to get video status: ${response.statusText}`);
      }

      const videoData = await response.json();
      return videoData;
    } catch (error) {
      console.error("Error getting video status from api.video:", error);
      throw error;
    }
  };

  // Function to list videos from api.video
  const listApiVideos = async () => {
    if (!apiVideoKey) {
      throw new Error("API Video key not found. Please set REACT_APP_API_VIDEO_KEY in your environment variables.");
    }

    try {
      const response = await fetch(`${getApiVideoBaseUrl()}/videos`, {
        headers: {
          "Authorization": `Bearer ${apiVideoKey}`,
          "Accept": "application/json"
        }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `HTTP ${response.status}: ${response.statusText}` }));
        throw new Error(error.message || `Failed to list videos: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Retrieved videos from api.video:", data);
      return data;
    } catch (error) {
      console.error("Error listing videos from api.video:", error);
      throw error;
    }
  };

  // Function to display an alert using Radix UI dialog
  const showAlert = (message, title = "Alert", callback = null) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertCallback(() => callback); // Wrap the callback to make sure it's a function
    setAlertOpen(true);
  };

  // Function to handle closing the alert dialog
  const handleAlertClose = () => {
    setAlertOpen(false);
    if (typeof alertCallback === 'function') {
      alertCallback();
    }
    setAlertCallback(null);
  };

  // Create template preview data for each template
  const createTemplatePreviewData = (templateNum) => {
    switch (templateNum) {
      case 1: // Two videos: 3s + 3s
        return {
          compositeWidth: 1280,
          compositeHeight: 720,
          fps: 30,
          projectData: {
            type: "",
            width: 1280,
            height: 720,
            fill: "#000000",
            duration: 6, // 3 + 3 seconds
            version: 0,
            view: [
              {
                id: "template1-video1",
                type: "Video",
                description: "Ipsum consequat elit anim voluptate laborum quis tempor eu cillum dolore dolore ut elit.",
                start: 0,
                duration: 3,
                trackIndex: 0,
                x: 0,
                y: 0,
                width: 1280,
                height: 720,
                blendMode: "normal",
                anchorX: 0,
                anchorY: 0,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                alpha: 1,
                skewX: 0,
                skewY: 0,
                hidden: false,
                locked: false,
                keyframes: [],
                externalUrl:
                  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // Placeholder video
                ext: "mp4",
                startInSource: 0,
                volume: 1,
                hasAudio: true,
                playrate: 1,
                isFrontTrimmed: false,
                sourceDuration: 3,
              },
              {
                id: "template1-video2",
                type: "Video",
                description: "Labore dolore reprehenderit commodo aliqua.",
                start: 3,
                duration: 3,
                trackIndex: 0,
                x: 0,
                y: 0,
                width: 1280,
                height: 720,
                blendMode: "normal",
                anchorX: 0,
                anchorY: 0,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                alpha: 1,
                skewX: 0,
                skewY: 0,
                hidden: false,
                locked: false,
                keyframes: [],
                externalUrl:
                  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", // Placeholder video
                ext: "mp4",
                startInSource: 0,
                volume: 1,
                hasAudio: true,
                playrate: 1,
                isFrontTrimmed: false,
                sourceDuration: 3,
              },
            ],
            audio: [],
            effect: [],
            transition: [],
          },
        };

      case 2: // Three videos: 3s + 1s + 3s
        return {
          compositeWidth: 1280,
          compositeHeight: 720,
          fps: 30,
          projectData: {
            type: "",
            width: 1280,
            height: 720,
            fill: "#000000",
            duration: 7, // 3 + 1 + 3 seconds
            version: 0,
            view: [
              {
                id: "template2-video1",
                type: "Video",
                description: "Qui fugiat dolore cillum cillum est exercitation id officia.",
                start: 0,
                duration: 3,
                trackIndex: 0,
                x: 0,
                y: 0,
                width: 1280,
                height: 720,
                blendMode: "normal",
                anchorX: 0,
                anchorY: 0,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                alpha: 1,
                skewX: 0,
                skewY: 0,
                hidden: false,
                locked: false,
                keyframes: [],
                externalUrl:
                  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // Placeholder video
                ext: "mp4",
                startInSource: 0,
                volume: 1,
                hasAudio: true,
                playrate: 1,
                isFrontTrimmed: false,
                sourceDuration: 3,
              },
              {
                id: "template2-video2",
                type: "Video",
                description: "Ipsum ullamco ex exercitation deserunt nulla exercitation est proident.",
                start: 3,
                duration: 1,
                trackIndex: 0,
                x: 0,
                y: 0,
                width: 1280,
                height: 720,
                blendMode: "normal",
                anchorX: 0,
                anchorY: 0,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                alpha: 1,
                skewX: 0,
                skewY: 0,
                hidden: false,
                locked: false,
                keyframes: [],
                externalUrl:
                  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", // Placeholder video
                ext: "mp4",
                startInSource: 0,
                volume: 1,
                hasAudio: true,
                playrate: 1,
                isFrontTrimmed: false,
                sourceDuration: 1,
              },
              {
                id: "template2-video3",
                type: "Video",
                description: "Elit officia aliquip pariatur tempor duis cillum et ipsum.",
                start: 4,
                duration: 3,
                trackIndex: 0,
                x: 0,
                y: 0,
                width: 1280,
                height: 720,
                blendMode: "normal",
                anchorX: 0,
                anchorY: 0,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                alpha: 1,
                skewX: 0,
                skewY: 0,
                hidden: false,
                locked: false,
                keyframes: [],
                externalUrl:
                  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", // Placeholder video
                ext: "mp4",
                startInSource: 0,
                volume: 1,
                hasAudio: true,
                playrate: 1,
                isFrontTrimmed: false,
                sourceDuration: 3,
              },
            ],
            audio: [],
            effect: [],
            transition: [],
          },
        };

      case 3: // Two videos with overlay from 3-5s (7s total)
        return {
          compositeWidth: 1280,
          compositeHeight: 720,
          fps: 30,
          projectData: {
            type: "",
            width: 1280,
            height: 720,
            fill: "#000000",
            duration: 7, // 7 seconds total with overlay
            version: 0,
            view: [
              {
                id: "template3-video1",
                type: "Video",
                description: "Sint ea quis commodo aliqua dolor laborum culpa deserunt.",
                start: 0,
                duration: 7,
                trackIndex: 0,
                x: 0,
                y: 0,
                width: 1280,
                height: 720,
                blendMode: "normal",
                anchorX: 0,
                anchorY: 0,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                alpha: 1,
                skewX: 0,
                skewY: 0,
                hidden: false,
                locked: false,
                keyframes: [],
                externalUrl:
                  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // Placeholder video for main
                ext: "mp4",
                startInSource: 0,
                volume: 1,
                hasAudio: true,
                playrate: 1,
                isFrontTrimmed: false,
                sourceDuration: 7,
              },
              {
                id: "template3-video2-overlay",
                type: "Video",
                description: "Laboris eiusmod eu laboris excepteur aliquip.",
                start: 3, // Start at 3 seconds
                duration: 2, // Duration of 2 seconds (end at 5s)
                trackIndex: 1, // Overlay track
                x: (1280 - 256) / 2, // Centered horizontally
                y: (720 - 144) / 2, // Centered vertically
                width: 256, // Smaller size for overlay
                height: 144,
                blendMode: "normal",
                anchorX: 0,
                anchorY: 0,
                rotation: 0,
                scaleX: 1,
                scaleY: 1,
                alpha: 1,
                skewX: 0,
                skewY: 0,
                hidden: false,
                locked: false,
                keyframes: [],
                externalUrl:
                  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", // Placeholder video for overlay
                ext: "mp4",
                startInSource: 0,
                volume: 1,
                hasAudio: true,
                playrate: 1,
                isFrontTrimmed: false,
                sourceDuration: 2,
              },
            ],
            audio: [],
            effect: [],
            transition: [],
          },
        };

      default:
        return null;
    }
  };

  // Function to prepare and show the template preview
  const showTemplatePreview = (templateNum) => {
    // Check if this is a custom template
    const customTemplate = customTemplates.find(t => t.id === templateNum);

    if (customTemplate) {
      // For custom templates, create a preview based on required videos
      const previewData = {
        compositeWidth: 1280,
        compositeHeight: 720,
        fps: 30,
        projectData: {
          type: "",
          width: 1280,
          height: 720,
          fill: "#000000",
          duration: customTemplate.videoDurations ?
            customTemplate.videoDurations.reduce((a, b) => a + b, 0) || 6 :
            customTemplate.requiredVideos * 3, // Default to 3s per video
          version: 0,
          view: Array.from({ length: customTemplate.requiredVideos }, (_, i) => ({
            id: `custom-template-video-${i}`,
            type: "Video",
            description: customTemplate.videoDescriptions?.[i] || `Video ${i + 1}`,
            start: customTemplate.videoDurations ?
              customTemplate.videoDurations.slice(0, i).reduce((a, b) => a + b, 0) || (i * 3) :
              i * 3,
            duration: customTemplate.videoDurations?.[i] || 3,
            trackIndex: 0,
            x: 0,
            y: 0,
            width: 1280,
            height: 720,
            blendMode: "normal",
            anchorX: 0,
            anchorY: 0,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            skewX: 0,
            skewY: 0,
            hidden: false,
            locked: false,
            keyframes: [],
            externalUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // Placeholder video
            ext: "mp4",
            startInSource: 0,
            volume: 1,
            hasAudio: true,
            playrate: 1,
            isFrontTrimmed: false,
            sourceDuration: customTemplate.videoDurations?.[i] || 3,
          })),
          audio: [],
          effect: [],
          transition: [],
        },
      };

      setTemplatePreviewJson(previewData);
      setShowTemplatePreviewDialog(true);
    } else {
      const templatePreviewData = createTemplatePreviewData(templateNum);
      if (!templatePreviewData) return;

      setTemplatePreviewJson(templatePreviewData);
      setShowTemplatePreviewDialog(true);
    }
  };

  // Convert Chillin JSON to a format compatible with Remotion
  const convertChillinToRemotion = (chillinJson) => {
    // Convert Chillin project data to Remotion-compatible format
    const duration = chillinJson.projectData.duration;
    const fps = chillinJson.fps;
    const width = chillinJson.compositeWidth;
    const height = chillinJson.compositeHeight;

    // Create Remotion tracks from Chillin view layers
    const tracks = [];

    // Create a main track for video layers
    const videoTrack = {
      id: "video-track",
      name: "Video Track",
      items: [],
    };

    // Process each layer in the Chillin project
    chillinJson.projectData.view?.forEach((layer, index) => {
      const item = {
        id: layer.id || `layer-${index}`,
        type: "video",
        name: `Video Layer ${index + 1}`,
        src: layer.externalUrl,
        startTime: layer.start,
        duration: layer.duration,
        x: layer.x,
        y: layer.y,
        scale: layer.scaleX || 1,
        rotation: layer.rotation || 0,
        opacity: layer.alpha || 1,
        volume: layer.volume || 1,
        inPoint: layer.startInSource || 0,
      };

      videoTrack.items.push(item);
    });

    if (videoTrack.items.length > 0) {
      tracks.push(videoTrack);
    }

    // Process audio layers if any
    if (
      chillinJson.projectData.audio &&
      chillinJson.projectData.audio.length > 0
    ) {
      const audioTrack = {
        id: "audio-track",
        name: "Audio Track",
        items: chillinJson.projectData.audio.map((audioLayer, index) => ({
          id: audioLayer.id || `audio-${index}`,
          type: "audio",
          name: `Audio Layer ${index + 1}`,
          src: audioLayer.externalUrl,
          startTime: audioLayer.start,
          duration: audioLayer.duration,
          volume: audioLayer.volume || 1,
          inPoint: audioLayer.startInSource || 0,
        })),
      };

      tracks.push(audioTrack);
    }

    return {
      tracks,
      duration, // in seconds
      fps,
      width,
      height,
    };
  };

  // Function to get render result by render_id
  const getRenderResult = async (renderId) => {
    try {
      const response = await fetch(
        "https://render-api.chillin.online/render/result",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${chillinApiKey}`,
          },
          body: JSON.stringify({
            render_id: renderId,
          }),
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

      showAlert(`Render result retrieved successfully! Render ID: ${renderId}`, "Success");

      return result;
    } catch (error) {
      console.error("Error getting render result:", error);
      showAlert(`Error: ${error.message}`, "Error");
      throw error;
    }
  };

  // Handle Chillin project creation
  const createChillinProject = async (selectedVideos, template = null) => {
    if (!selectedVideos || selectedVideos.length === 0) {
      showAlert("No videos selected for processing. Please add videos to the sequence first.", "No Videos Selected");
      return;
    }

    const confirmation = window.confirm(
      "This will process your videos with smart chunking first before creating render project. Only the portions you've selected with in/out points will be processed. Click OK to proceed."
    );

    if (!confirmation) {
      return;
    }

    try {
      // Show processing dialog
      showAlert("Processing videos project with smart chunking...", "Processing");

      // Calculate total duration of all videos
      const totalDuration = selectedVideos.reduce((acc, video) => {
        const inPoint = video.inOutPoints?.inPoint !== undefined ? video.inOutPoints.inPoint : 0;
        const outPoint = video.inOutPoints?.outPoint !== undefined ? video.inOutPoints.outPoint : 3;
        return acc + (outPoint - inPoint);
      }, 0);

      // Generate job ID for this processing session
      const jobId = `chillin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create Chillin API request payload
      const chillinApiPayload = {
        compositeWidth: 1280,
        compositeHeight: 720,
        fps: 30,
        projectData: {
          type: "",
          width: 1280,
          height: 720,
          fill: "#000000",
          duration: totalDuration, // Total duration of all videos
          version: 0,
          view: selectedVideos.map((video, index) => {
            const inPoint = video.inOutPoints?.inPoint !== undefined ? video.inOutPoints.inPoint : 0;
            const outPoint = video.inOutPoints?.outPoint !== undefined ? video.inOutPoints.outPoint : 3;

            return {
              id: video.id || `video-${index}`,
              type: "Video",
              description: `Video ${index + 1}`,
              start: index === 0 ? 0 : selectedVideos.slice(0, index).reduce((acc, v) => {
                const prevInPoint = v.inOutPoints?.inPoint !== undefined ? v.inOutPoints.inPoint : 0;
                const prevOutPoint = v.inOutPoints?.outPoint !== undefined ? v.inOutPoints.outPoint : 3;
                return acc + (prevOutPoint - prevInPoint);
              }, 0),
              duration: outPoint - inPoint,
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
              externalUrl: video.src || URL.createObjectURL(video.blob), // Use the video source
              ext: "mp4",
              startInSource: inPoint, // Start point in source video
              sourceDuration: outPoint - inPoint,
              volume: 1,
              hasAudio: true,
              playrate: 1,
              isFrontTrimmed: false,
            };
          }),
          audio: [],
          effect: [],
          transition: [],
        },
      };

      if (!chillinApiKey) {
        throw new Error(
          "Chillin API key not found. Please set your API key in settings."
        );
      }

      // Show processing dialog
      showAlert("Sending project to Chillin renderer...", "Processing");

      // Wait 10 seconds to simulate processing
      await new Promise(resolve => setTimeout(resolve, 10000));

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
            errorData.msg || "API request failed"
          }`
        );
      }

      const result = await response.json();

      // Store the render ID in localStorage
      const storedRenders = JSON.parse(
        localStorage.getItem("chillinRenders") || "[]"
      );
      const updatedRenders = [
        ...storedRenders,
        {
          render_id: result.data.render_id,
          timestamp: new Date().toISOString(),
          status: "pending", // Default status
        },
      ];
      localStorage.setItem(
        "chillinRenders",
        JSON.stringify(updatedRenders)
      );

      // Update the state with the new renders
      setChillinRenders(updatedRenders);

      // Show success with the actual render ID from the API
      showAlert(`Video project created with smart chunking! Project ID: ${result.data.render_id}`, "Project Created");

      setActiveTab("render");
    } catch (error) {
      console.error("Error sending project to Chillin renderer:", error);
      showAlert(`Error: ${error.message}`, "Error");
    }
  };

  // Handle creating a custom template from dialog
  const handleCreateCustomTemplate = () => {
    const name = videoName.trim();
    if (!name) {
      showAlert("Template name cannot be empty", "Invalid Name");
      return;
    }

    // Check if template name already exists
    if (customTemplates.some((t) => t.name === name)) {
      showAlert("A template with this name already exists", "Duplicate Name");
      return;
    }

    const numVideos = parseInt(videoDuration);
    if (isNaN(numVideos) || numVideos <= 0 || numVideos > 10) {
      showAlert("Please enter a valid number between 1 and 10", "Invalid Number");
      return;
    }

    // Create the new template
    const newTemplate = {
      id: `custom-${Date.now()}`,
      name: name,
      requiredVideos: numVideos,
      videoDescriptions: [], // We'll collect these later
      videoDurations: [], // We'll collect these later
      type: "custom", // Mark as user-created template
      settings: {
        // Default settings for the custom template
        compositeWidth: 1280,
        compositeHeight: 720,
        fps: 30,
        fill: "#000000",
      },
    };

    const updatedTemplates = [...customTemplates, newTemplate];
    saveCustomTemplates(updatedTemplates);

    showAlert(`Custom template "${name}" has been created! Now select it to configure.`, "Template Created");
    setCreateTemplateDialogOpen(false);
    setVideoName('');
    setVideoDuration(10);
  };

  // Handle creating template from current selection
  const handleCreateTemplateFromCurrent = () => {
    const name = videoName.trim();
    if (!name) {
      showAlert("Template name cannot be empty", "Invalid Name");
      return;
    }

    // Check if template name already exists
    if (customTemplates.some((t) => t.name === name)) {
      showAlert("A template with this name already exists", "Duplicate Name");
      return;
    }

    // Create the new custom template object from current selection
    const newTemplate = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      originalTemplateId: template,
      requiredVideos: getRequiredVideos(template),
      videoDescriptions: [], // Store descriptions for each video
      videos: selectedVideos.map((video) => ({ ...video })),
      videoAudioTracks: { ...videoAudioTracks },
      videoVolumes: { ...videoVolumes },
      audioVolumes: { ...audioVolumes },
      type: "from-current", // Mark as template from current selection
    };

    const updatedTemplates = [...customTemplates, newTemplate];
    saveCustomTemplates(updatedTemplates);

    showAlert(`Custom template "${name.trim()}" has been created!`, "Template Created");
    setCreateFromCurrentDialogOpen(false);
    setVideoName('');
  };

  // Handle deleting a template
  const handleDeleteTemplate = () => {
    if (deleteTemplateId) {
      const updatedTemplates = customTemplates.filter(
        (t) => t.id !== deleteTemplateId
      );
      saveCustomTemplates(updatedTemplates);
      showAlert("Template deleted successfully", "Deleted");
    }
    setDeleteTemplateDialogOpen(false);
    setDeleteTemplateId(null);
  };

  // Handle video selection functionality with improved flow
  const handleVideoSelectionFlow = useCallback(
    async (targetIndex = null) => {
      if (!template) {
        showAlert("Please select a template first", "No Template Selected");
        return;
      }

      const requiredVideos = getRequiredVideos(template);

      // If targetIndex is specified, we're replacing a specific video
      if (targetIndex !== null && targetIndex < selectedVideos.length) {
        // For framework7 based app, we show a confirmation dialog
        const shouldReplace = window.confirm(`Replace video ${targetIndex + 1}?`);
        if (shouldReplace) {
          handlePickFromDevice(requiredVideos, template, targetIndex).catch((error) =>
            console.error("Error picking from device:", error)
          );
        }
        return;
      }

      const videosNeeded = requiredVideos - selectedVideos.length;
      if (videosNeeded <= 0) {
        showAlert(
          `Template ${template} already has the required ${requiredVideos} videos. Remove some videos before adding more.`,
          "Too Many Videos"
        );
        return;
      }

      // Show progress to indicate how many videos are needed vs selected
      showAlert(`Add videos for Template ${template}. Selected: ${selectedVideos.length}/${requiredVideos} videos`, "Add Videos");

      // Call the function to pick from device
      handlePickFromDevice(requiredVideos, template).catch((error) =>
        console.error("Error picking from device:", error)
      );
    },
    [
      template,
      selectedVideos,
      handlePickFromDevice,
      customTemplates,
    ]
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <div className="bg-[#0F1A21] text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Trackless Video</h1>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={activeTab === "templates" ? "default" : "outline"}
              onClick={() => setActiveTab("templates")}
              className={activeTab === "templates" ? "bg-[#1E97A0] hover:bg-[#157a82]" : "bg-white text-[#0F1A21]"}
            >
              Templates
            </Button>
            <Button
              variant={activeTab === "sequence" ? "default" : "outline"}
              onClick={() => setActiveTab("sequence")}
              className={activeTab === "sequence" ? "bg-[#1E97A0] hover:bg-[#157a82]" : "bg-white text-[#0F1A21]"}
            >
              Sequence
            </Button>
            <Button
              variant={activeTab === "render" ? "default" : "outline"}
              onClick={() => {
                setActiveTab("render");
                // Load renders when the tab is clicked
                const storedRenders = JSON.parse(
                  localStorage.getItem("chillinRenders") || "[]"
                );
                // Sort renders by timestamp, latest first (newest timestamp first)
                const sortedRenders = storedRenders.sort(
                  (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
                );
                setChillinRenders(sortedRenders);
              }}
              className={activeTab === "render" ? "bg-[#1E97A0] hover:bg-[#157a82]" : "bg-white text-[#0F1A21]"}
            >
              Render Jobs
            </Button>
            <Button
              variant={activeTab === "management" ? "default" : "outline"}
              onClick={() => setActiveTab("management")}
              className={activeTab === "management" ? "bg-[#1E97A0] hover:bg-[#157a82]" : "bg-white text-[#0F1A21]"}
            >
              Management
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        {/* Templates Tab */}
        {activeTab === "templates" && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Custom Template Manager</h2>

              <div className="flex space-x-4 mb-6">
                <Button
                  className="bg-[#1E97A0] hover:bg-[#157a82]"
                  onClick={createCustomTemplate}
                >
                  Create Custom Template
                </Button>
                <Button
                  variant="outline"
                  className="border-[#1E97A0] text-[#1E97A0]"
                  onClick={createTemplateFromCurrent}
                >
                  Create from Current
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customTemplates.map((customTemplate) => (
                  <Card key={customTemplate.id} className={`border rounded-lg p-4 bg-white shadow-sm ${template === customTemplate.id ? 'border-blue-500 border-2' : ''} cursor-pointer`}
                        onClick={() => loadCustomTemplate(customTemplate)}>
                    <CardHeader>
                      <CardTitle>{customTemplate.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Videos required: {customTemplate.requiredVideos}
                      </p>
                      {template === customTemplate.id && (
                        <div className="mt-4 flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              showTemplatePreview(customTemplate.id);
                            }}
                          >
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab("sequence");
                            }}
                          >
                            Add Videos
                          </Button>
                        </div>
                      )}
                      <div className="flex space-x-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            loadCustomTemplate(customTemplate);
                          }}
                        >
                          Load
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            editCustomTemplate(customTemplate.id);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCustomTemplate(customTemplate.id);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Template Selection</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={`border rounded-lg p-4 bg-white shadow-sm cursor-pointer ${template === 1 ? 'border-blue-500 border-2' : ''}`}
                      onClick={() => {setTemplate(1);}}>
                  <CardHeader>
                    <CardTitle>Template 1</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">Two videos: 3s + 3s</p>
                  </CardContent>
                  {template === 1 && (
                    <div className="mt-4 flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          showTemplatePreview(1);
                        }}
                      >
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab("sequence");
                          setTimeout(() => handleVideoSelectionFlow(), 100); // Small delay to ensure tab has switched
                        }}
                      >
                        Add Videos
                      </Button>
                    </div>
                  )}
                </Card>
                <Card className={`border rounded-lg p-4 bg-white shadow-sm cursor-pointer ${template === 2 ? 'border-blue-500 border-2' : ''}`}
                      onClick={() => {setTemplate(2);}}>
                  <CardHeader>
                    <CardTitle>Template 2</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">Three videos: 3s + 1s + 3s</p>
                  </CardContent>
                  {template === 2 && (
                    <div className="mt-4 flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          showTemplatePreview(2);
                        }}
                      >
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab("sequence");
                          setTimeout(() => handleVideoSelectionFlow(), 100); // Small delay to ensure tab has switched
                        }}
                      >
                        Add Videos
                      </Button>
                    </div>
                  )}
                </Card>
                <Card className={`border rounded-lg p-4 bg-white shadow-sm cursor-pointer ${template === 3 ? 'border-blue-500 border-2' : ''}`}
                      onClick={() => {setTemplate(3);}}>
                  <CardHeader>
                    <CardTitle>Template 3</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">Two videos with overlay</p>
                  </CardContent>
                  {template === 3 && (
                    <div className="mt-4 flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          showTemplatePreview(3);
                        }}
                      >
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab("sequence");
                          setTimeout(() => handleVideoSelectionFlow(), 100); // Small delay to ensure tab has switched
                        }}
                      >
                        Add Videos
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Sequence Tab */}
        {activeTab === "sequence" && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Video Sequence Display</h2>

              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="w-full border-dashed border-2 border-gray-300"
                  onClick={() => handleVideoSelectionFlow()}
                >
                  + Add Videos
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-dashed border-2 border-gray-300 bg-blue-50 text-blue-700"
                  onClick={() => sendTestJobToChillin()}
                >
                  Send Test Job to Chillin
                </Button>
              </div>

              {/* Video Preview Player */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Preview</h3>
                <div className="w-full h-64 bg-black rounded-lg overflow-hidden">
                  {selectedVideos && selectedVideos.length > 0 ? (
                    <Player
                      component={VideoComposition}
                      durationInFrames={selectedVideos.reduce((acc, video) => {
                        const inPoint = video.inOutPoints?.inPoint || 0;
                        const outPoint = video.inOutPoints?.outPoint || video.duration || 10;
                        return acc + Math.round((outPoint - inPoint) * 30); // 30fps
                      }, 0)}
                      fps={30}
                      compositionWidth={1280}
                      compositionHeight={720}
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                      inputProps={{
                        layers: selectedVideos.map((video, index) => {
                          const inPoint = video.inOutPoints?.inPoint || 0;
                          const outPoint = video.inOutPoints?.outPoint || video.duration || 10;
                          const startTime = index === 0 ? 0 : selectedVideos.slice(0, index).reduce((acc, v) => {
                            const vIn = v.inOutPoints?.inPoint || 0;
                            const vOut = v.inOutPoints?.outPoint || v.duration || 10;
                            return acc + (vOut - vIn);
                          }, 0);

                          return {
                            id: video.id || `video-${index}`,
                            type: "Video",
                            start: startTime,
                            duration: outPoint - inPoint,
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
                            externalUrl: video.src || URL.createObjectURL(video.blob),
                            ext: "mp4",
                            startInSource: inPoint,
                            sourceDuration: outPoint - inPoint,
                            volume: 1,
                            hasAudio: true,
                            playrate: 1,
                            isFrontTrimmed: false,
                          };
                        })
                      }}
                      controls
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      Add videos to see preview
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {selectedVideos.map((video, index) => (
                  <Card key={video.id || index} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                      <div className="flex-1">
                        <h3 className="font-semibold">{video.name || `Video ${index + 1}`}</h3>
                        <p className="text-sm text-gray-600">
                          Duration: {video.inOutPoints ?
                            `${video.inOutPoints.outPoint - video.inOutPoints.inPoint}s` :
                            `${video.duration || 10}s`}
                        </p>
                        {videoAudioTracks[index] && (
                          <p className="text-sm text-green-600">Audio attached</p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openInOutDialog(index)}>
                          In/Out
                        </Button>
                        {videoAudioTracks[index] ? (
                          <>
                            <Button size="sm" variant="outline" onClick={() => openVolumeDialog(index, true)}>
                              Audio Vol
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => removeAudioFromVideo(index)}>
                              Remove Audio
                            </Button>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleAddAudioToVideo(index)}>
                            Add Audio
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => openVolumeDialog(index, false)}>
                          Video Vol
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => removeVideo(index)}>
                          Remove
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => moveVideoBack(index)}
                        disabled={index === 0}>
                        ← Move Back
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => moveVideoForward(index)}
                        disabled={index === selectedVideos.length - 1}>
                        Move Forward →
                      </Button>
                    </div>
                  </Card>
                ))}

                {selectedVideos.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No videos added yet. Click "Add Videos" to get started.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Render Jobs Tab */}
        {activeTab === "render" && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Render Jobs</h2>

              <div className="mb-4">
                <Button
                  className="bg-[#A01E25] hover:bg-[#80171e]"
                  onClick={() => createChillinProject(selectedVideos, template)}
                >
                  Start New Render
                </Button>
              </div>

              <div className="space-y-4">
                {chillinRenders.length > 0 ? (
                  chillinRenders.map((render, index) => (
                    <Card key={render.render_id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">Render Job #{index + 1}</h3>
                          <p className="text-sm text-gray-600">ID: {render.render_id}</p>
                          <p className="text-sm text-gray-600">Status: {render.status}</p>
                          <p className="text-sm text-gray-600">Created: {render.timestamp}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleGetRenderResult(render.render_id)}>
                            Check Status
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No render jobs yet. Create a project and start a render.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Management Tab */}
        {activeTab === "management" && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Video Management</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Saved Projects</h3>
                  <div className="space-y-2">
                    <Card className="border rounded-lg p-3 bg-white">
                      <h4 className="font-medium">Project 1</h4>
                      <p className="text-sm text-gray-600">Last modified: Today</p>
                    </Card>
                    <Card className="border rounded-lg p-3 bg-white">
                      <h4 className="font-medium">Project 2</h4>
                      <p className="text-sm text-gray-600">Last modified: 2 days ago</p>
                    </Card>
                    <Card className="border rounded-lg p-3 bg-white">
                      <h4 className="font-medium">Project 3</h4>
                      <p className="text-sm text-gray-600">Last modified: 1 week ago</p>
                    </Card>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Export Options</h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      Export Project JSON
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Export Template
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Share Project
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Download Final Video
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Custom Template Dialog */}
      <Dialog open={createTemplateDialogOpen} onOpenChange={setCreateTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Template</DialogTitle>
            <DialogDescription>
              Enter a name for your custom template and specify how many videos it requires.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                value={videoName}
                onChange={(e) => setVideoName(e.target.value)}
                placeholder="Enter template name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numVideos">Number of Required Videos</Label>
              <Input
                id="numVideos"
                type="number"
                value={videoDuration}
                onChange={(e) => setVideoDuration(Number(e.target.value))}
                min="1"
                max="10"
                placeholder="Enter number of videos (1-10)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTemplateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCustomTemplate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Template from Current Dialog */}
      <Dialog open={createFromCurrentDialogOpen} onOpenChange={setCreateFromCurrentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Template from Current</DialogTitle>
            <DialogDescription>
              Enter a name for your custom template based on the current selection.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentTemplateName">Template Name</Label>
              <Input
                id="currentTemplateName"
                value={videoName}
                onChange={(e) => setVideoName(e.target.value)}
                placeholder="Enter template name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFromCurrentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTemplateFromCurrent}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Custom Template Dialog */}
      <Dialog open={editTemplateDialogOpen} onOpenChange={setEditTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Custom Template</DialogTitle>
            <DialogDescription>
              Update the name of your custom template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editTemplateName">Template Name</Label>
              <Input
                id="editTemplateName"
                value={videoName}
                onChange={(e) => setVideoName(e.target.value)}
                placeholder="Enter new template name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTemplateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditTemplate}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Confirmation Dialog */}
      <Dialog open={deleteTemplateDialogOpen} onOpenChange={setDeleteTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this custom template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTemplateDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteTemplate}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* In/Out Points Dialog */}
      <Dialog open={inOutDialogOpen} onOpenChange={setInOutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set In/Out Points</DialogTitle>
            <DialogDescription>
              Set the in and out points for the video clip.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inPoint">In Point (seconds)</Label>
              <Slider
                id="inPoint"
                min={0}
                max={outPoint}
                step={0.1}
                value={[inPoint]}
                onValueChange={(value) => setInPoint(value[0])}
                className="w-full"
              />
              <Input
                type="number"
                value={inPoint}
                onChange={(e) => setInPoint(Number(e.target.value))}
                min="0"
                max={outPoint}
                step="0.1"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outPoint">Out Point (seconds)</Label>
              <Slider
                id="outPoint"
                min={inPoint}
                max={30}
                step={0.1}
                value={[outPoint]}
                onValueChange={(value) => setOutPoint(value[0])}
                className="w-full"
              />
              <Input
                type="number"
                value={outPoint}
                onChange={(e) => setOutPoint(Number(e.target.value))}
                min={inPoint}
                max="30"
                step="0.1"
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInOutDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSetInOutPoints}>Set</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={showTemplatePreviewDialog} onOpenChange={setShowTemplatePreviewDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview of the selected template
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {templatePreviewJson ? (
              <div className="w-full h-64 bg-black rounded-lg overflow-hidden">
                <Player
                  component={VideoComposition}
                  durationInFrames={Math.round(templatePreviewJson.projectData.duration * 30)}
                  fps={30}
                  compositionWidth={1280}
                  compositionHeight={720}
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                  inputProps={{
                    layers: templatePreviewJson.projectData.view
                  }}
                  controls
                />
              </div>
            ) : (
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-64 mt-4 flex items-center justify-center">
                Preview Area
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTemplatePreviewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Replacement */}
      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{alertTitle}</DialogTitle>
            <DialogDescription>
              {alertMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleAlertClose}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TracklessVideoEditor;