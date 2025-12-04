import { useState, useEffect } from 'react';
import { showNotification } from '../components/NotificationSystem';

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

  // State for editing form
  const [editNumVideos, setEditNumVideos] = useState(2);
  const [editVideoDescriptions, setEditVideoDescriptions] = useState([]);
  const [editVideoDurations, setEditVideoDurations] = useState([]);

  // Load custom templates from localStorage on component mount
  useEffect(() => {
    console.log("[TM-DEBUG] Loading custom templates from localStorage");
    const savedTemplates = localStorage.getItem("customTemplates");
    console.log("[TM-DEBUG] Retrieved from localStorage:", savedTemplates);
    if (savedTemplates) {
      try {
        const parsedTemplates = JSON.parse(savedTemplates);
        console.log("[TM-DEBUG] Parsed templates:", parsedTemplates);
        setCustomTemplates(parsedTemplates);
      } catch (error) {
        console.error(
          "Error parsing custom templates from localStorage:",
          error
        );
        setCustomTemplates([]);
      }
    } else {
      console.log("[TM-DEBUG] No custom templates found in localStorage");
    }
  }, []);

  // Function to save custom templates to localStorage
  const saveCustomTemplates = (templates) => {
    console.log("[TM-DEBUG] saveCustomTemplates called with templates:", templates);
    try {
      localStorage.setItem("customTemplates", JSON.stringify(templates));
      setCustomTemplates(templates);
      console.log("[TM-DEBUG] Custom templates state updated:", templates);
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
      showNotification.warning("Please select a template and add videos before creating a custom template");
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
    console.log("[TM-DEBUG] editCustomTemplate called with templateId:", templateId);
    console.log("[TM-DEBUG] Current customTemplates:", customTemplates);

    const templateToEdit = customTemplates.find((t) => t.id === templateId);
    if (!templateToEdit) {
      console.log("[TM-DEBUG] Template not found for id:", templateId);
      dialogManager.create({
        title: "Error",
        text: "Template not found",
        buttons: [{ text: "OK", onClick: () => {} }]
      }).open();
      return;
    }

    console.log("[TM-DEBUG] Template to edit:", templateToEdit);
    console.log("[TM-DEBUG] Template type:", templateToEdit.type);

    setVideoName(templateToEdit.name); // Set the current name in the input field
    setEditTemplateId(templateId);

    // Initialize form state based on template type
    if (templateToEdit.type === "from-current") {
      console.log("[TM-DEBUG] Initializing from-current template with", templateToEdit.requiredVideos, "videos");
      // For from-current templates, we only edit the name
      setEditNumVideos(templateToEdit.requiredVideos || 2);
      setEditVideoDescriptions([]);
      setEditVideoDurations([]);
    } else {
      console.log("[TM-DEBUG] Initializing custom template with", templateToEdit.requiredVideos, "videos");
      // For custom templates, initialize with existing values
      const numVideos = templateToEdit.requiredVideos || 2;
      setEditNumVideos(numVideos);

      // Initialize descriptions and durations with existing values or defaults
      const descriptions = [];
      const durations = [];

      for (let i = 0; i < numVideos; i++) {
        const desc = templateToEdit.videoDescriptions?.[i] || "";
        const duration = templateToEdit.videoDurations?.[i] !== undefined ? templateToEdit.videoDurations[i] : 3;
        descriptions.push(desc);
        durations.push(duration);
        console.log("[TM-DEBUG] Video", i, "description:", desc, "duration:", duration);
      }

      setEditVideoDescriptions(descriptions);
      setEditVideoDurations(durations);
      console.log("[TM-DEBUG] Initialized descriptions:", descriptions);
      console.log("[TM-DEBUG] Initialized durations:", durations);
    }

    console.log("[TM-DEBUG] Setting dialog open with videoName:", videoName);
    setEditTemplateDialogOpen(true);
  };

  // Handle editing a custom template
  const handleEditTemplate = (selectedVideos, videoAudioTracks, videoVolumes, audioVolumes, updatedVideoName, updatedNumVideos, updatedVideoDescriptions, updatedVideoDurations) => {
    console.log("[TM-DEBUG] handleEditTemplate called with editTemplateId:", editTemplateId);
    console.log("[TM-DEBUG] Current customTemplates:", customTemplates);

    // If updated values are passed, use them; otherwise use current state values
    const newName = (updatedVideoName !== undefined ? updatedVideoName : videoName).trim();
    const numVideosToUse = updatedNumVideos !== undefined ? updatedNumVideos : editNumVideos;
    const videoDescriptionsToUse = updatedVideoDescriptions !== undefined ? updatedVideoDescriptions : editVideoDescriptions;
    const videoDurationsToUse = updatedVideoDurations !== undefined ? updatedVideoDurations : editVideoDurations;

    console.log("[TM-DEBUG] Using values - Name:", newName, "Num videos:", numVideosToUse,
                "Descriptions:", videoDescriptionsToUse, "Durations:", videoDurationsToUse);

    if (!editTemplateId) {
      console.log("[TM-DEBUG] No editTemplateId provided, returning");
      return;
    }

    const templateToEdit = customTemplates.find((t) => t.id === editTemplateId);
    if (!templateToEdit) {
      console.log("[TM-DEBUG] Template not found for id:", editTemplateId);
      showNotification.error("Template not found");
      return;
    }

    console.log("[TM-DEBUG] Template to edit:", templateToEdit);

    if (!newName) {
      console.log("[TM-DEBUG] Template name is empty");
      showNotification.error("Template name cannot be empty");
      return;
    }

    // Check if another template exists with the same name (excluding the current template)
    if (
      customTemplates.some((t) => t.id !== editTemplateId && t.name === newName)
    ) {
      console.log("[TM-DEBUG] Template name already exists:", newName);
      showNotification.error("A template with this name already exists");
      return;
    }

    // Handle templates based on their type
    if (templateToEdit.type === "from-current") {
      console.log("[TM-DEBUG] Editing from-current template, only updating name from:", templateToEdit.name, "to:", newName);
      // For templates created from current selection, we can only edit the name
      const updatedTemplates = customTemplates.map((t) =>
        t.id === editTemplateId ? { ...t, name: newName } : t
      );
      console.log("[TM-DEBUG] Updated templates:", updatedTemplates);
      saveCustomTemplates(updatedTemplates);
      showNotification.success("Template name updated successfully");
    } else {
      console.log("[TM-DEBUG] Editing custom template, updating name, numVideos, descriptions, and durations");
      console.log("[TM-DEBUG] New name:", newName);
      console.log("[TM-DEBUG] New numVideos:", numVideosToUse);
      console.log("[TM-DEBUG] New descriptions:", videoDescriptionsToUse);
      console.log("[TM-DEBUG] New durations:", videoDurationsToUse);

      // For templates created from scratch, we can edit name, required videos, and descriptions
      // Validation for number of videos
      if (isNaN(numVideosToUse) || numVideosToUse <= 0 || numVideosToUse > 10) {
        console.log("[TM-DEBUG] Invalid number of videos:", numVideosToUse);
        dialogManager.create({
          title: "Invalid Number",
          text: "Please enter a valid number between 1 and 10",
          buttons: [{ text: "OK", onClick: () => {} }]
        }).open();
        return;
      }

      // Validate durations and create new arrays
      const newDescriptions = [];
      const newVideoDurations = [];
      let hasInvalidDuration = false;

      for (let i = 0; i < numVideosToUse; i++) {
        const desc = videoDescriptionsToUse[i] || "";
        newDescriptions.push(desc);

        const duration = parseFloat(videoDurationsToUse[i]);
        if (isNaN(duration) || duration <= 0) {
          console.log("[TM-DEBUG] Invalid duration for video", i + 1, ":", videoDurationsToUse[i]);
          showNotification.error(`Please enter a valid positive number for duration of video ${i + 1}.`);
          hasInvalidDuration = true;
          break;
        }
        newVideoDurations.push(duration);
      }

      if (hasInvalidDuration) {
        console.log("[TM-DEBUG] Has invalid duration, returning");
        return;
      }

      // Update the template with new values
      const updatedTemplates = customTemplates.map((t) =>
        t.id === editTemplateId
          ? {
              ...t,
              name: newName.trim(),
              requiredVideos: numVideosToUse,
              videoDescriptions: newDescriptions,
              videoDurations: newVideoDurations,
            }
          : t
      );
      console.log("[TM-DEBUG] About to save updated templates:", updatedTemplates);
      saveCustomTemplates(updatedTemplates);
      dialogManager.create({
        title: "Success",
        text: "Template updated successfully",
        buttons: [{ text: "OK", onClick: () => {} }]
      }).open();
      console.log("[TM-DEBUG] Dialog closed, template updated successfully");
    }

    // Reset the dialog state after successful update
    console.log("[TM-DEBUG] Resetting dialog state");
    setEditTemplateDialogOpen(false);
    setEditTemplateId(null);
    setVideoName("");
    setEditNumVideos(2);
    setEditVideoDescriptions([]);
    setEditVideoDurations([]);
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
      showNotification.success("Template deleted successfully");
    }
    setDeleteTemplateDialogOpen(false);
    setDeleteTemplateId(null);
  };

  // Handle creating a custom template from dialog
  const handleCreateCustomTemplate = () => {
    const name = videoName.trim();
    if (!name) {
      showNotification.error("Template name cannot be empty");
      return;
    }

    // Check if template name already exists
    if (customTemplates.some((t) => t.name === name)) {
      showNotification.error("A template with this name already exists");
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
      showNotification.error("Template name cannot be empty");
      return;
    }

    // Check if template name already exists
    if (customTemplates.some((t) => t.name === name)) {
      showNotification.error("A template with this name already exists");
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

    showNotification.success(`Custom template "${name.trim()}" has been created!`);
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
      showNotification.warning(`Template ${template} requires exactly ${requiredVideos} videos. You currently have ${selectedVideos.length} videos.`);
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

    showNotification.info("Chillin preview data set! The preview would now be displayed.");

    setShowTemplatePreviewDialog(true);
  };

  // Wrapper function to maintain backward compatibility
  const handleEditTemplateWrapper = (selectedVideos, videoAudioTracks, videoVolumes, audioVolumes, updatedVideoName, updatedNumVideos, updatedVideoDescriptions, updatedVideoDurations) => {
    // If updated values are provided (from EditTemplateDialog), use them; otherwise use current state values
    if (updatedVideoName !== undefined) {
      return handleEditTemplate(selectedVideos, videoAudioTracks, videoVolumes, audioVolumes, updatedVideoName, updatedNumVideos, updatedVideoDescriptions, updatedVideoDurations);
    } else {
      return handleEditTemplate(selectedVideos, videoAudioTracks, videoVolumes, audioVolumes, videoName, editNumVideos, editVideoDescriptions, editVideoDurations);
    }
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
    editNumVideos,
    setEditNumVideos,
    editVideoDescriptions,
    setEditVideoDescriptions,
    editVideoDurations,
    setEditVideoDurations,

    // Functions
    getRequiredVideos,
    createCustomTemplate,
    createTemplateFromCurrent,
    loadCustomTemplate,
    editCustomTemplate,
    handleEditTemplate: handleEditTemplateWrapper,
    deleteCustomTemplate,
    handleDeleteTemplate,
    handleCreateCustomTemplate,
    handleCreateTemplateFromCurrent,
    showChillinPreview
  };
};