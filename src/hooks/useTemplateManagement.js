import { useState, useEffect } from 'react';

// Custom hook for managing templates
export const useTemplateManagement = (chillinProjectJson, setChillinProjectJson, setTemplatePreviewJson, setShowTemplatePreviewDialog, dialogManager) => {
  // State for custom templates
  const [customTemplates, setCustomTemplates] = useState([]);
  const [template, setTemplate] = useState(1);
  
  // State for template dialogs
  const [createTemplateDialogOpen, setCreateTemplateDialogOpen] = useState(false);
  const [createFromCurrentDialogOpen, setCreateFromCurrentDialogOpen] = useState(false);
  const [editTemplateDialogOpen, setEditTemplateDialogOpen] = useState(false);
  const [editTemplateId, setEditTemplateId] = useState(null);
  const [deleteTemplateDialogOpen, setDeleteTemplateDialogOpen] = useState(false);
  const [deleteTemplateId, setDeleteTemplateId] = useState(null);
  const [videoName, setVideoName] = useState("");
  const [numVideosForTemplate, setNumVideosForTemplate] = useState(2);

  // Load custom templates from localStorage on component mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem("customTemplates");
    if (savedTemplates) {
      try {
        setCustomTemplates(JSON.parse(savedTemplates));
      } catch (error) {
        console.error(
          "Error parsing custom templates from localStorage:",
          error
        );
        setCustomTemplates([]);
      }
    }
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

  // Helper function to get required videos for a template
  const getRequiredVideos = (templateId) => {
    // Check if this is a custom template
    const customTemplate = customTemplates.find((t) => t.id === templateId);
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

  // Function to create a custom template from scratch
  const createCustomTemplate = () => {
    setCreateTemplateDialogOpen(true);
  };

  // Function to create a custom template based on current selection
  const createTemplateFromCurrent = (selectedVideos, template) => {
    if (!template || selectedVideos.length === 0) {
      dialogManager.create({
        title: "Missing Template or Videos",
        text: "Please select a template and add videos before creating a custom template",
        buttons: [
          {
            text: "OK",
            onClick: () => {}
          }
        ]
      }).open();
      return;
    }
    setCreateFromCurrentDialogOpen(true);
  };

  // Function to load a custom template
  const loadCustomTemplate = (customTemplate, setTemplate, setSelectedVideos, setVideoAudioTracks, setVideoVolumes, setAudioVolumes) => {
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
    const templateToEdit = customTemplates.find((t) => t.id === templateId);
    if (!templateToEdit) {
      dialogManager.create({
        title: "Error",
        text: "Template not found",
        buttons: [{ text: "OK", onClick: () => {} }]
      }).open();
      return;
    }

    setVideoName(templateToEdit.name); // Set the current name in the input field
    setEditTemplateId(templateId);
    setEditTemplateDialogOpen(true);
  };

  // Handle editing a custom template
  const handleEditTemplate = (selectedVideos, videoAudioTracks, videoVolumes, audioVolumes) => {
    if (!editTemplateId) return;

    const templateToEdit = customTemplates.find((t) => t.id === editTemplateId);
    if (!templateToEdit) {
      dialogManager.create({
        title: "Error",
        text: "Template not found",
        buttons: [{ text: "OK", onClick: () => {} }]
      }).open();
      return;
    }

    const newName = videoName.trim();
    if (!newName) {
      dialogManager.create({
        title: "Invalid Name",
        text: "Template name cannot be empty",
        buttons: [{ text: "OK", onClick: () => {} }]
      }).open();
      return;
    }

    // Check if another template exists with the same name (excluding the current template)
    if (
      customTemplates.some((t) => t.id !== editTemplateId && t.name === newName)
    ) {
      dialogManager.create({
        title: "Duplicate Name",
        text: "A template with this name already exists",
        buttons: [{ text: "OK", onClick: () => {} }]
      }).open();
      return;
    }

    // Handle templates based on their type
    if (templateToEdit.type === "from-current") {
      // For templates created from current selection, we can only edit the name
      const updatedTemplates = customTemplates.map((t) =>
        t.id === editTemplateId ? { ...t, name: newName } : t
      );
      saveCustomTemplates(updatedTemplates);
      dialogManager.create({
        title: "Success",
        text: "Template name updated successfully",
        buttons: [{ text: "OK", onClick: () => {} }]
      }).open();
    } else {
      // For templates created from scratch, we can edit name, required videos, and descriptions
      const numVideosStr = prompt(
        `How many videos does this template require? (Current: ${templateToEdit.requiredVideos})`,
        templateToEdit.requiredVideos
      );
      const num = parseInt(numVideosStr);
      if (isNaN(num) || num <= 0 || num > 10) {
        dialogManager.create({
          title: "Invalid Number",
          text: "Please enter a valid number between 1 and 10",
          buttons: [{ text: "OK", onClick: () => {} }]
        }).open();
        return;
      }

      // Get new descriptions for each video
      let descriptionIndex = 0;
      const newDescriptions = [];
      const newVideoDurations = []; // New array for durations
      const collectNewDescriptionsAndDurations = () => {
        if (descriptionIndex < num) {
          const currentDescription =
            templateToEdit.videoDescriptions?.[descriptionIndex] || "";
          const currentDuration =
            templateToEdit.videoDurations?.[descriptionIndex] !== undefined
            ? templateToEdit.videoDurations[descriptionIndex]
            : 3; // Default to 3 seconds if not set

          const description = prompt(
            `Enter description for video ${descriptionIndex + 1} (optional):`,
            currentDescription
          );

          if (description !== null) {
            newDescriptions.push(description || "");

            const durationInput = prompt(
              `Enter duration for video ${
                descriptionIndex + 1
              } in seconds (e.g., 5 for 5 seconds):`,
              currentDuration.toString()
            );
            const duration = parseFloat(durationInput);
            if (isNaN(duration) || duration <= 0) {
              dialogManager.create({
                title: "Invalid Duration",
                text: "Please enter a valid positive number for duration.",
                buttons: [
                  {
                    text: "OK",
                    onClick: () => {
                      // Re-collect for the current video if invalid
                      collectNewDescriptionsAndDurations();
                    }
                  }
                ]
              }).open();
              return;
            }
            newVideoDurations.push(duration);
            descriptionIndex++;
            collectNewDescriptionsAndDurations(); // Recursive call for next video
          }
        } else {
          // All descriptions and durations collected, update the template
          const updatedTemplates = customTemplates.map((t) =>
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
          dialogManager.create({
            title: "Success",
            text: "Template updated successfully",
            buttons: [{ text: "OK", onClick: () => {} }]
          }).open();
        }
      };

      // Start collecting new descriptions and durations
      collectNewDescriptionsAndDurations();
    }

    setEditTemplateDialogOpen(false);
    setEditTemplateId(null);
    setVideoName("");
  };

  // Function to delete a custom template
  const deleteCustomTemplate = (templateId) => {
    setDeleteTemplateId(templateId);
    setDeleteTemplateDialogOpen(true);
  };

  // Handle deleting a template
  const handleDeleteTemplate = () => {
    if (deleteTemplateId) {
      const updatedTemplates = customTemplates.filter(
        (t) => t.id !== deleteTemplateId
      );
      saveCustomTemplates(updatedTemplates);
      dialogManager.create({
        title: "Deleted",
        text: "Template deleted successfully",
        buttons: [{ text: "OK", onClick: () => {} }]
      }).open();
    }
    setDeleteTemplateDialogOpen(false);
    setDeleteTemplateId(null);
  };

  // Handle creating a custom template from dialog
  const handleCreateCustomTemplate = () => {
    const name = videoName.trim();
    if (!name) {
      dialogManager.create({
        title: "Invalid Name",
        text: "Template name cannot be empty",
        buttons: [{ text: "OK", onClick: () => {} }]
      }).open();
      return;
    }

    // Check if template name already exists
    if (customTemplates.some((t) => t.name === name)) {
      dialogManager.create({
        title: "Duplicate Name",
        text: "A template with this name already exists",
        buttons: [{ text: "OK", onClick: () => {} }]
      }).open();
      return;
    }

    const numVideos = parseInt(numVideosForTemplate);
    if (isNaN(numVideos) || numVideos <= 0 || numVideos > 10) {
      dialogManager.create({
        title: "Invalid Number",
        text: "Please enter a valid number between 1 and 10",
        buttons: [{ text: "OK", onClick: () => {} }]
      }).open();
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

    dialogManager.create({
      title: "Template Created",
      text: `Custom template "${name}" has been created! Now select it to configure.`,
      buttons: [{ text: "OK", onClick: () => {} }]
    }).open();
    setCreateTemplateDialogOpen(false);
    setVideoName("");
    setNumVideosForTemplate(2); // Reset to default
  };

  // Handle creating template from current selection
  const handleCreateTemplateFromCurrent = (selectedVideos, videoAudioTracks, videoVolumes, audioVolumes) => {
    const name = videoName.trim();
    if (!name) {
      dialogManager.create({
        title: "Invalid Name",
        text: "Template name cannot be empty",
        buttons: [{ text: "OK", onClick: () => {} }]
      }).open();
      return;
    }

    // Check if template name already exists
    if (customTemplates.some((t) => t.name === name)) {
      dialogManager.create({
        title: "Duplicate Name",
        text: "A template with this name already exists",
        buttons: [{ text: "OK", onClick: () => {} }]
      }).open();
      return;
    }

    // Create the new custom template object from current selection
    const newTemplate = {
      id: `custom-${Date.now()}`,
      name: name,
      originalTemplateId: template,
      videos: selectedVideos.map((video) => ({ ...video })),
      videoAudioTracks: { ...videoAudioTracks },
      videoVolumes: { ...videoVolumes },
      audioVolumes: { ...audioVolumes },
      type: "from-current", // Mark as template from current selection
    };

    const updatedTemplates = [...customTemplates, newTemplate];
    saveCustomTemplates(updatedTemplates);

    dialogManager.create({
      title: "Template Created",
      text: `Custom template "${name.trim()}" has been created!`,
      buttons: [{ text: "OK", onClick: () => {} }]
    }).open();
    setCreateFromCurrentDialogOpen(false);
    setVideoName("");
  };

  // Function to prepare and show the Chillin project preview
  const showChillinPreview = (selectedVideos, template, videoVolumes, audioVolumes, videoAudioTracks) => {
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
      dialogManager.create({
        title: "Add Videos",
        text: `Template ${template} requires exactly ${requiredVideos} videos. You currently have ${selectedVideos.length} videos.`,
        buttons: [{ text: "OK", onClick: () => {} }]
      }).open();
      return;
    }

    // Create a chillin project JSON based on the selected template
    let videoLayers = [];
    let audioLayers = []; // Array to hold audio layers

    // Calculate total duration based on template and videos
    switch (template) {
      case 1: // Two videos: 3s + 3s = 6s total
        videoLayers = selectedVideos.slice(0, 2).map((video, index) => {
          const inOutPoints = video.inOutPoints || {
            inPoint: 0,
            outPoint: video.duration || 3,
          };
          const duration = inOutPoints.outPoint - inOutPoints.inPoint;

          return {
            id: video.id || `video-${index}`,
            type: "video",
            name: video.name || `Video ${index + 1}`,
            duration: duration,
            start: index === 0 ? 0 : selectedVideos[0].duration || 3, // Stacked start times
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
            src: video.src || URL.createObjectURL(video.blob),
            blob: video.blob,
            inPoint: inOutPoints.inPoint,
            outPoint: inOutPoints.outPoint,
            volume: videoVolumes[index] !== undefined ? videoVolumes[index] : 1,
            hasAudio: true,
            playrate: 1,
            isFrontTrimmed: false,
          };
        });
        totalDuration = (selectedVideos[0].duration || 3) + (selectedVideos[1].duration || 3);
        break;
      case 2: // Three videos: 3s + 1s + 3s = 7s total
        videoLayers = selectedVideos.slice(0, 3).map((video, index) => {
          const inOutPoints = video.inOutPoints || {
            inPoint: 0,
            outPoint: video.duration || (index === 1 ? 1 : 3), // Second video shorter
          };
          const duration = inOutPoints.outPoint - inOutPoints.inPoint;
          const startTime =
            index === 0
              ? 0
              : selectedVideos.slice(0, index).reduce((acc, v, prevIndex) => {
                  const prevInOut = selectedVideos[prevIndex].inOutPoints || {
                    inPoint: 0,
                    outPoint: v.duration || (prevIndex === 1 ? 1 : 3),
                  };
                  return acc + (prevInOut.outPoint - prevInOut.inPoint);
                }, 0);

          return {
            id: video.id || `video-${index}`,
            type: "video",
            name: video.name || `Video ${index + 1}`,
            duration: duration,
            start: startTime,
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
            src: video.src || URL.createObjectURL(video.blob),
            blob: video.blob,
            inPoint: inOutPoints.inPoint,
            outPoint: inOutPoints.outPoint,
            volume: videoVolumes[index] !== undefined ? videoVolumes[index] : 1,
            hasAudio: true,
            playrate: 1,
            isFrontTrimmed: false,
          };
        });
        totalDuration = selectedVideos.reduce((total, video, index) => {
          const inOut = video.inOutPoints || {
            inPoint: 0,
            outPoint: video.duration || (index === 1 ? 1 : 3),
          };
          return total + (inOut.outPoint - inOut.inPoint);
        }, 0);
        break;
      case 3: // Two videos with overlay from 3-5s (7s total)
        videoLayers = selectedVideos.slice(0, 2).map((video, index) => {
          const inOutPoints = video.inOutPoints || {
            inPoint: 0,
            outPoint: index === 0 ? 7 : 2, // First video full length, second video 2s overlay
          };
          const duration = inOutPoints.outPoint - inOutPoints.inPoint;
          const startTime = index === 0 ? 0 : 3; // Second video starts at 3s

          return {
            id: video.id || `video-${index}`,
            type: "video",
            name: video.name || `Video ${index + 1}`,
            duration: duration,
            start: startTime,
            trackIndex: index,
            x: index === 1 ? 640 : 0, // Second video as overlay
            y: index === 1 ? 360 : 0,
            width: index === 1 ? 640 : 1280,
            height: index === 1 ? 360 : 720,
            blendMode: "normal",
            anchorX: 320,
            anchorY: 180,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            skewX: 0,
            skewY: 0,
            hidden: false,
            locked: false,
            keyframes: [],
            src: video.src || URL.createObjectURL(video.blob),
            blob: video.blob,
            inPoint: inOutPoints.inPoint,
            outPoint: inOutPoints.outPoint,
            volume: videoVolumes[index] !== undefined ? videoVolumes[index] : 1,
            hasAudio: true,
            playrate: 1,
            isFrontTrimmed: false,
          };
        });
        totalDuration = 7; // Fixed duration for this template
        break;
      default:
        // For custom templates or unknown templates
        videoLayers = selectedVideos.map((video, index) => {
          const inOutPoints = video.inOutPoints || {
            inPoint: 0,
            outPoint: video.duration || 3,
          };
          const duration = inOutPoints.outPoint - inOutPoints.inPoint;
          const startTime = selectedVideos.slice(0, index).reduce((acc, v, prevIndex) => {
            const prevInOut = v.inOutPoints || {
              inPoint: 0,
              outPoint: v.duration || 3,
            };
            return acc + (prevInOut.outPoint - prevInOut.inPoint);
          }, 0);

          return {
            id: video.id || `video-${index}`,
            type: "video",
            name: video.name || `Video ${index + 1}`,
            duration: duration,
            start: startTime,
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
            src: video.src || URL.createObjectURL(video.blob),
            blob: video.blob,
            inPoint: inOutPoints.inPoint,
            outPoint: inOutPoints.outPoint,
            volume: videoVolumes[index] !== undefined ? videoVolumes[index] : 1,
            hasAudio: true,
            playrate: 1,
            isFrontTrimmed: false,
          };
        });
        totalDuration = selectedVideos.reduce((total, video) => {
          const inOut = video.inOutPoints || {
            inPoint: 0,
            outPoint: video.duration || 3,
          };
          return total + (inOut.outPoint - inOut.inPoint);
        }, 0);
    }

    // Handle audio tracks if they exist
    selectedVideos.forEach((video, index) => {
      const audioTrack = videoAudioTracks[index];
      if (audioTrack) {
        audioLayers.push({
          id: `audio-${index}`,
          type: "audio",
          name: `Audio ${index + 1}`,
          start: 0,
          duration: audioTrack.duration,
          trackIndex: index + 10, // Audio tracks on different track indices
          src: audioTrack.url,
          volume: audioVolumes[index] !== undefined ? audioVolumes[index] : 1,
          playrate: 1,
        });
      }
    });

    // Create the chillin project JSON
    const chillinJson = {
      project: {
        type: "chillin-project",
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

    dialogManager.create({
      title: "Preview Ready",
      text: "Chillin preview data set! The preview would now be displayed.",
      buttons: [{ text: "OK", onClick: () => {} }]
    }).open();

    setShowTemplatePreviewDialog(true);
  };

  return {
    // State
    customTemplates,
    setCustomTemplates,
    template,
    setTemplate,
    createTemplateDialogOpen,
    setCreateTemplateDialogOpen,
    createFromCurrentDialogOpen,
    setCreateFromCurrentDialogOpen,
    editTemplateDialogOpen,
    setEditTemplateDialogOpen,
    editTemplateId,
    setEditTemplateId,
    deleteTemplateDialogOpen,
    setDeleteTemplateDialogOpen,
    deleteTemplateId,
    setDeleteTemplateId,
    videoName,
    setVideoName,
    numVideosForTemplate,
    setNumVideosForTemplate,
    
    // Functions
    getRequiredVideos,
    createCustomTemplate,
    createTemplateFromCurrent,
    loadCustomTemplate,
    editCustomTemplate,
    handleEditTemplate,
    deleteCustomTemplate,
    handleDeleteTemplate,
    handleCreateCustomTemplate,
    handleCreateTemplateFromCurrent,
    showChillinPreview
  };
};