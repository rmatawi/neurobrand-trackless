import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Player } from "@remotion/player";
import VideoComposition from "../remotion/VideoComposition";
import ProgressIndicator from "./ui/ProgressIndicator";
import TimelineVisualization from "./TimelineVisualization";
import VideoCard from "./VideoCard";

import { useDialogManager } from "../hooks/useDialogManager";
import { useTemplateManagement } from "../hooks/useTemplateManagement";
import { useVideoHandling } from "../hooks/useVideoHandling";
import { useChillinAPI } from "../hooks/useChillinAPI";

const TracklessVideoEditor = () => {
  const [activeTab, setActiveTab] = useState("templates");

  // Use dialog manager
  const dialogManager = useDialogManager();

  // State for dialogs not managed by hooks
  const [showTemplatePreviewDialog, setShowTemplatePreviewDialog] =
    useState(false);
  const [templatePreviewJson, setTemplatePreviewJson] = useState(null);
  const [chillinProjectJson, setChillinProjectJson] = useState(null);

  // Use the custom hooks to manage different aspects of the editor
  const {
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
    showChillinPreview,
    showTemplatePreview,
  } = useTemplateManagement(
    chillinProjectJson,
    setChillinProjectJson,
    setTemplatePreviewJson,
    setShowTemplatePreviewDialog,
    dialogManager
  );

  const {
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
    moveVideoForward,
  } = useVideoHandling(process.env.REACT_APP_CHILLIN, dialogManager);

  // Video preview state for In/Out dialog
  const [videoPreviewRef, setVideoPreviewRef] = useState(null);
  const [isVideoPreviewPlaying, setIsVideoPreviewPlaying] = useState(false);

  // Video selection state for sequence tab
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(null);

  // Volume dialog state
  const [volumeDialogOpen, setVolumeDialogOpen] = useState(false);
  const [currentVolumeVideoIndex, setCurrentVolumeVideoIndex] = useState(null);
  const [isAudioVolume, setIsAudioVolume] = useState(false);
  const [volumeValue, setVolumeValue] = useState(1.0);

  const {
    // State
    chillinRenders,
    setChillinRenders,
    downloadUrl,
    setDownloadUrl,
    // Functions
    processVideoUploadAndCreateProject,
    getRenderResult,
    sendChillinProjectToRenderer,
    sendTestJobToChillin,
  } = useChillinAPI(dialogManager);

  // Effect to handle video preview when dialog opens or current video changes
  React.useEffect(() => {
    if (!inOutDialogOpen || currentVideoIndex === null || !selectedVideos[currentVideoIndex]) {
      return;
    }

    const video = videoPreviewRef;
    if (!video) return;

    // Get the current video
    const currentVideo = selectedVideos[currentVideoIndex];
    if (!currentVideo || !currentVideo.blob) return;

    // Create object URL for the video blob
    const url = URL.createObjectURL(currentVideo.blob);
    video.src = url;

    // Clean up the URL when effect ends
    return () => {
      video.src = "";
      URL.revokeObjectURL(url);
    };
  }, [inOutDialogOpen, currentVideoIndex, selectedVideos, videoPreviewRef]);

  // Effect to handle video preview when in/out points change
  React.useEffect(() => {
    if (!videoPreviewRef || !inOutDialogOpen) return;

    // Update video preview when in/out points change
    const handleTimeUpdate = () => {
      if (videoPreviewRef.currentTime > outPoint) {
        videoPreviewRef.currentTime = inPoint; // Loop back to in point when reaching out point
      }
    };

    const video = videoPreviewRef;
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [inPoint, outPoint, videoPreviewRef, inOutDialogOpen]);

  // Function to jump to in point
  const jumpToInPoint = () => {
    if (videoPreviewRef) {
      videoPreviewRef.currentTime = inPoint;
    }
  };

  // Function to play preview between in and out points
  const playPreview = async () => {
    if (!videoPreviewRef) return;

    try {
      // Jump to in point
      videoPreviewRef.currentTime = inPoint;
      setIsVideoPreviewPlaying(true);

      // Start playing
      await videoPreviewRef.play();

      // Handle end of preview (when reaching out point)
      const handleTimeUpdate = () => {
        if (videoPreviewRef.currentTime >= outPoint) {
          videoPreviewRef.pause();
          setIsVideoPreviewPlaying(false);
          videoPreviewRef.currentTime = inPoint; // Return to in point
          videoPreviewRef.removeEventListener('timeupdate', handleTimeUpdate);
        }
      };

      videoPreviewRef.addEventListener('timeupdate', handleTimeUpdate);
    } catch (error) {
      console.error("Error playing video preview:", error);
      setIsVideoPreviewPlaying(false);
    }
  };

  // Function to pause preview
  const pausePreview = () => {
    if (videoPreviewRef) {
      videoPreviewRef.pause();
      setIsVideoPreviewPlaying(false);
    }
  };

  // Clean up object URLs when videos change
  React.useEffect(() => {
    return () => {
      cleanupVideoUrls(selectedVideos);
    };
  }, [selectedVideos, cleanupVideoUrls]);

  // ThumbnailVideo component to properly manage URL object lifecycle
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

  // Main render method
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <div className="bg-[#0F1A21] text-white p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">Trackless Video</h1>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant={activeTab === "templates" ? "default" : "outline"}
              onClick={() => setActiveTab("templates")}
              className={
                activeTab === "templates"
                  ? "bg-[#1E97A0] hover:bg-[#157a82]"
                  : "bg-white text-[#0F1A21]"
              }
            >
              Templates
            </Button>
            <Button
              variant={activeTab === "sequence" ? "default" : "outline"}
              onClick={() => setActiveTab("sequence")}
              className={
                activeTab === "sequence"
                  ? "bg-[#1E97A0] hover:bg-[#157a82]"
                  : "bg-white text-[#0F1A21]"
              }
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
              className={
                activeTab === "render"
                  ? "bg-[#1E97A0] hover:bg-[#157a82]"
                  : "bg-white text-[#0F1A21]"
              }
            >
              Render Jobs
            </Button>
            <Button
              variant={activeTab === "management" ? "default" : "outline"}
              onClick={() => setActiveTab("management")}
              className={
                activeTab === "management"
                  ? "bg-[#1E97A0] hover:bg-[#157a82]"
                  : "bg-white text-[#0F1A21]"
              }
            >
              Management
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <ProgressIndicator
        currentStep={
          activeTab === "templates" ? 1 :
          activeTab === "sequence" ? 2 :
          activeTab === "render" ? 3 : 1
        }
        totalSteps={3}
        labels={["Template", "Sequence", "Render"]}
      />

      {/* Main Content Area */}
      <div className="p-6">
        {/* Templates Tab */}
        {activeTab === "templates" && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">
                Custom Template Manager
              </h2>

              <div className="flex flex-wrap gap-4 mb-6">
                <Button
                  className="bg-[#1E97A0] hover:bg-[#157a82]"
                  onClick={createCustomTemplate}
                >
                  Create Custom Template
                </Button>
                <Button
                  variant="outline"
                  className="border-[#1E97A0] text-[#1E97A0]"
                  onClick={() =>
                    createTemplateFromCurrent(selectedVideos, template)
                  }
                >
                  Create from Current
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customTemplates.map((customTemplate) => (
                  <Card
                    key={customTemplate.id}
                    className={`border rounded-lg p-4 bg-white shadow-sm ${
                      template === customTemplate.id
                        ? "border-blue-500 border-2"
                        : ""
                    } cursor-pointer`}
                    onClick={() =>
                      loadCustomTemplate(
                        customTemplate,
                        setTemplate,
                        setSelectedVideos,
                        setVideoAudioTracks,
                        setVideoVolumes,
                        setAudioVolumes
                      )
                    }
                  >
                    <CardHeader>
                      <CardTitle>{customTemplate.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        Videos required: {customTemplate.requiredVideos}
                      </p>
                      {template === customTemplate.id && (
                        <div className="mt-4 flex flex-wrap gap-2">
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
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            loadCustomTemplate(
                              customTemplate,
                              setTemplate,
                              setSelectedVideos,
                              setVideoAudioTracks,
                              setVideoVolumes,
                              setAudioVolumes
                            );
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
                <Card
                  className={`border rounded-lg p-4 bg-white shadow-sm cursor-pointer ${
                    template === 1 ? "border-blue-500 border-2" : ""
                  }`}
                  onClick={() => {
                    setTemplate(1);
                  }}
                >
                  <CardHeader>
                    <CardTitle>Template 1</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">Two videos: 3s + 3s</p>
                  </CardContent>
                  {template === 1 && (
                    <div className="mt-4 flex flex-wrap gap-2">
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
                          setTimeout(() => {
                            if (!template) {
                              dialogManager
                                .create({
                                  title: "No Template Selected",
                                  text: "Please select a template first",
                                  buttons: [
                                    {
                                      text: "OK",
                                      onClick: () => {},
                                    },
                                  ],
                                })
                                .open();
                              return;
                            }
                            const requiredVideos = getRequiredVideos(template);
                            const videosNeeded =
                              requiredVideos - selectedVideos.length;
                            if (videosNeeded <= 0) {
                              dialogManager
                                .create({
                                  title: "Too Many Videos",
                                  text: `Template ${template} already has the required ${requiredVideos} videos. Remove some videos before adding more.`,
                                  buttons: [
                                    {
                                      text: "OK",
                                      onClick: () => {},
                                    },
                                  ],
                                })
                                .open();
                              return;
                            }
                            // Go straight to file selection without showing a dialog
                            handlePickFromDevice(
                              requiredVideos,
                              template
                            ).catch((error) =>
                              console.error("Error picking from device:", error)
                            );
                          }, 100); // Small delay to ensure tab has switched
                        }}
                      >
                        Add Videos
                      </Button>
                    </div>
                  )}
                </Card>
                <Card
                  className={`border rounded-lg p-4 bg-white shadow-sm cursor-pointer ${
                    template === 2 ? "border-blue-500 border-2" : ""
                  }`}
                  onClick={() => {
                    setTemplate(2);
                  }}
                >
                  <CardHeader>
                    <CardTitle>Template 2</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Three videos: 3s + 1s + 3s
                    </p>
                  </CardContent>
                  {template === 2 && (
                    <div className="mt-4 flex flex-wrap gap-2">
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
                          setTimeout(() => {
                            if (!template) {
                              dialogManager
                                .create({
                                  title: "No Template Selected",
                                  text: "Please select a template first",
                                  buttons: [
                                    {
                                      text: "OK",
                                      onClick: () => {},
                                    },
                                  ],
                                })
                                .open();
                              return;
                            }
                            const requiredVideos = getRequiredVideos(template);
                            const videosNeeded =
                              requiredVideos - selectedVideos.length;
                            if (videosNeeded <= 0) {
                              dialogManager
                                .create({
                                  title: "Too Many Videos",
                                  text: `Template ${template} already has the required ${requiredVideos} videos. Remove some videos before adding more.`,
                                  buttons: [
                                    {
                                      text: "OK",
                                      onClick: () => {},
                                    },
                                  ],
                                })
                                .open();
                              return;
                            }
                            // Go straight to file selection without showing a dialog
                            handlePickFromDevice(
                              requiredVideos,
                              template
                            ).catch((error) =>
                              console.error("Error picking from device:", error)
                            );
                          }, 100); // Small delay to ensure tab has switched
                        }}
                      >
                        Add Videos
                      </Button>
                    </div>
                  )}
                </Card>
                <Card
                  className={`border rounded-lg p-4 bg-white shadow-sm cursor-pointer ${
                    template === 3 ? "border-blue-500 border-2" : ""
                  }`}
                  onClick={() => {
                    setTemplate(3);
                  }}
                >
                  <CardHeader>
                    <CardTitle>Template 3</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600">
                      Two videos with overlay
                    </p>
                  </CardContent>
                  {template === 3 && (
                    <div className="mt-4 flex flex-wrap gap-2">
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
                          setTimeout(() => {
                            if (!template) {
                              dialogManager
                                .create({
                                  title: "No Template Selected",
                                  text: "Please select a template first",
                                  buttons: [
                                    {
                                      text: "OK",
                                      onClick: () => {},
                                    },
                                  ],
                                })
                                .open();
                              return;
                            }
                            const requiredVideos = getRequiredVideos(template);
                            const videosNeeded =
                              requiredVideos - selectedVideos.length;
                            if (videosNeeded <= 0) {
                              dialogManager
                                .create({
                                  title: "Too Many Videos",
                                  text: `Template ${template} already has the required ${requiredVideos} videos. Remove some videos before adding more.`,
                                  buttons: [
                                    {
                                      text: "OK",
                                      onClick: () => {},
                                    },
                                  ],
                                })
                                .open();
                              return;
                            }
                            // Go straight to file selection without showing a dialog
                            handlePickFromDevice(
                              requiredVideos,
                              template
                            ).catch((error) =>
                              console.error("Error picking from device:", error)
                            );
                          }, 100); // Small delay to ensure tab has switched
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

              <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="w-full border-dashed border-2 border-gray-300"
                  onClick={() => {
                    if (!template) {
                      dialogManager
                        .create({
                          title: "No Template Selected",
                          text: "Please select a template first",
                          buttons: [
                            {
                              text: "OK",
                              onClick: () => {},
                            },
                          ],
                        })
                        .open();
                      return;
                    }
                    const requiredVideos = getRequiredVideos(template);
                    const videosNeeded = requiredVideos - selectedVideos.length;
                    if (videosNeeded <= 0) {
                      dialogManager
                        .create({
                          title: "Too Many Videos",
                          text: `Template ${template} already has the required ${requiredVideos} videos. Remove some videos before adding more.`,
                          buttons: [
                            {
                              text: "OK",
                              onClick: () => {},
                            },
                          ],
                        })
                        .open();
                      return;
                    }
                    // Go straight to file selection without showing a dialog
                    handlePickFromDevice(requiredVideos, template).catch(
                      (error) =>
                        console.error("Error picking from device:", error)
                    );
                  }}
                >
                  + Add Videos
                </Button>
                <Button
                  className="w-full bg-[#A01E25] hover:bg-[#80171e] text-white"
                  onClick={() => {
                    dialogManager
                      .create({
                        title: "Start Render",
                        text: `Are you sure you want to start rendering? You have ${selectedVideos.length} video(s) selected with template ${template}.`,
                        buttons: [
                          {
                            text: "Start Render",
                            onClick: () => {
                              sendChillinProjectToRenderer(
                                selectedVideos,
                                template,
                                customTemplates,
                                videoVolumes,
                                audioVolumes
                              );
                            },
                          },
                          {
                            text: "Cancel",
                            onClick: () => {},
                          },
                        ],
                      })
                      .open();
                  }}
                >
                  Start Render
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
                        const outPoint =
                          video.inOutPoints?.outPoint || video.duration || 10;
                        return acc + Math.round((outPoint - inPoint) * 30); // 30fps
                      }, 0)}
                      fps={30}
                      compositionWidth={1280}
                      compositionHeight={720}
                      style={{
                        width: "100%",
                        height: "100%",
                      }}
                      inputProps={{
                        layers: [
                          // Video layers
                          ...selectedVideos.map((video, index) => {
                            const inPoint = video.inOutPoints?.inPoint || 0;
                            const outPoint =
                              video.inOutPoints?.outPoint ||
                              video.duration ||
                              10;
                            const startTime =
                              index === 0
                                ? 0
                                : selectedVideos
                                    .slice(0, index)
                                    .reduce((acc, v) => {
                                      const vIn = v.inOutPoints?.inPoint || 0;
                                      const vOut =
                                        v.inOutPoints?.outPoint ||
                                        v.duration ||
                                        10;
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
                              externalUrl:
                                video.src || URL.createObjectURL(video.blob),
                              ext: "mp4",
                              startInSource: inPoint,
                              sourceDuration: outPoint - inPoint,
                              volume:
                                videoVolumes[index] !== undefined
                                  ? videoVolumes[index]
                                  : 1,
                              hasAudio: true,
                              playrate: 1,
                              isFrontTrimmed: false,
                            };
                          }),
                          // Audio layers for separately added audio tracks
                          ...selectedVideos
                            .map((video, index) => {
                              const audioTrack = videoAudioTracks[index];
                              if (!audioTrack) return null; // Skip if no audio track for this video index

                              const inPoint = video.inOutPoints?.inPoint || 0;
                              const outPoint =
                                video.inOutPoints?.outPoint ||
                                video.duration ||
                                10;
                              const startTime =
                                index === 0
                                  ? 0
                                  : selectedVideos
                                      .slice(0, index)
                                      .reduce((acc, v) => {
                                        const vIn = v.inOutPoints?.inPoint || 0;
                                        const vOut =
                                          v.inOutPoints?.outPoint ||
                                          v.duration ||
                                          10;
                                        return acc + (vOut - vIn);
                                      }, 0);

                              return {
                                id: `audio-${video.id || index}`,
                                type: "Audio",
                                start: startTime,
                                duration: audioTrack.duration,
                                trackIndex: 10 + index, // Different track index for audio
                                externalUrl: audioTrack.url,
                                ext: "mp3", // Determine from the audio file
                                startInSource: 0,
                                sourceDuration: audioTrack.duration,
                                volume:
                                  audioVolumes[index] !== undefined
                                    ? audioVolumes[index]
                                    : 1,
                                playrate: 1,
                                isFrontTrimmed: false,
                              };
                            })
                            .filter((layer) => layer !== null), // Remove null entries
                        ],
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
                  <Card
                    key={video.id || index}
                    className="border rounded-lg p-4 bg-white"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-x-0 sm:space-x-4 space-y-3 sm:space-y-0">
                      {video.blob ? (
                        <ThumbnailVideo blob={video.blob} />
                      ) : (
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex-shrink-0" />
                      )}
                      <div className="flex-1 w-full">
                        <h3 className="font-semibold truncate">
                          {video.name || `Video ${index + 1}`}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Duration:{" "}
                          {video.inOutPoints
                            ? `${
                                video.inOutPoints.outPoint -
                                video.inOutPoints.inPoint
                              }s`
                            : `${video.duration || 10}s`}
                        </p>
                        {videoAudioTracks[index] && (
                          <p className="text-sm text-green-600">
                            Audio attached
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openInOutDialog(index)}
                      >
                        In/Out
                      </Button>
                      {videoAudioTracks[index] ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCurrentVolumeVideoIndex(index);
                              setIsAudioVolume(true);
                              setVolumeValue(
                                audioVolumes[index] !== undefined
                                  ? audioVolumes[index]
                                  : 1.0
                              );
                              setVolumeDialogOpen(true);
                            }}
                          >
                            Audio Vol
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeAudioFromVideo(index)}
                          >
                            Remove Audio
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddAudioToVideo(index)}
                        >
                          Add Audio
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCurrentVolumeVideoIndex(index);
                          setIsAudioVolume(false);
                          setVolumeValue(
                            videoVolumes[index] !== undefined
                              ? videoVolumes[index]
                              : 1.0
                          );
                          setVolumeDialogOpen(true);
                        }}
                      >
                        Video Vol
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeVideo(index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveVideoBack(index)}
                        disabled={index === 0}
                      >
                        ← Move Back
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveVideoForward(index)}
                        disabled={index === selectedVideos.length - 1}
                      >
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
                  onClick={() => {
                    dialogManager
                      .create({
                        title: "Start New Render",
                        text: `Are you sure you want to start a new render? You have ${selectedVideos.length} video(s) selected with template ${template}.`,
                        buttons: [
                          {
                            text: "Start Render",
                            onClick: () => {
                              sendChillinProjectToRenderer(
                                selectedVideos,
                                template,
                                customTemplates,
                                videoVolumes,
                                audioVolumes
                              );
                            },
                          },
                          {
                            text: "Cancel",
                            onClick: () => {},
                          },
                        ],
                      })
                      .open();
                  }}
                >
                  Start New Render
                </Button>
              </div>

              <div className="space-y-4">
                {chillinRenders.length > 0 ? (
                  chillinRenders.map((render, index) => (
                    <Card
                      key={render.id}
                      className="border rounded-lg p-4 bg-white"
                    >
                      <CardHeader>
                        <CardTitle className="text-base">
                          Render Job {index + 1}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">
                          <strong>ID:</strong> {render.id}
                        </p>
                        <p className="text-sm">
                          <strong>Status:</strong> {render.status || "pending"}
                        </p>
                        <p className="text-sm">
                          <strong>Created:</strong>{" "}
                          {new Date(render.timestamp).toLocaleString()}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                const response = await fetch(
                                  "https://render-api.chillin.online/render/result",
                                  {
                                    method: "POST",
                                    headers: {
                                      Accept: "application/json",
                                      "Content-Type": "application/json",
                                      Authorization: `Bearer ${process.env.REACT_APP_CHILLIN}`,
                                    },
                                    body: JSON.stringify({
                                      render_id: render.id,
                                    }),
                                  }
                                );

                                const data = await response.json();

                                if (data?.data?.render?.state === "success") {
                                  setDownloadUrl(data.data.render.video_url);
                                  dialogManager
                                    .create({
                                      title: "Render Success",
                                      text: `Your video is ready! Video URL: ${data.data.render.video_url}`,
                                      buttons: [
                                        {
                                          text: "OK",
                                          onClick: () => {},
                                        },
                                      ],
                                    })
                                    .open();
                                } else if (
                                  data?.data?.render?.state === "pending"
                                ) {
                                  dialogManager
                                    .create({
                                      title: "Pending",
                                      text: "Please try again later.",
                                      buttons: [
                                        {
                                          text: "OK",
                                          onClick: () => {},
                                        },
                                      ],
                                    })
                                    .open();
                                } else if (
                                  data?.data?.render?.state === "failed"
                                ) {
                                  dialogManager
                                    .create({
                                      title: "Failed",
                                      text: "Render job failed.",
                                      buttons: [
                                        {
                                          text: "OK",
                                          onClick: () => {},
                                        },
                                      ],
                                    })
                                    .open();
                                }
                              } catch (error) {
                                dialogManager
                                  .create({
                                    title: "Error",
                                    text: `Error getting render result: ${error.message}`,
                                    buttons: [
                                      {
                                        text: "OK",
                                        onClick: () => {},
                                      },
                                    ],
                                  })
                                  .open();
                              }
                            }}
                          >
                            Check Status
                          </Button>
                          {downloadUrl && (
                            <a
                              href={downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button size="sm" variant="outline">
                                Download
                              </Button>
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No render jobs yet. Start a new render to see it here.
                  </div>
                )}
              </div>

              {downloadUrl && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <p className="font-bold mb-2">Download Ready!</p>
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {downloadUrl}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Management Tab */}
        {activeTab === "management" && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-bold mb-4">Management</h2>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">
                      <strong>Selected Template:</strong> {template}
                    </p>
                    <p className="text-sm mb-2">
                      <strong>Videos:</strong> {selectedVideos.length} /{" "}
                      {getRequiredVideos(template)}
                    </p>
                    <p className="text-sm">
                      <strong>Custom Templates:</strong>{" "}
                      {customTemplates.length}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSelectedVideos([]);
                        setVideoAudioTracks({});
                        setVideoVolumes({});
                        setAudioVolumes({});
                        dialogManager
                          .create({
                            title: "Cleared",
                            text: "All videos cleared",
                            buttons: [
                              {
                                text: "OK",
                                onClick: () => {},
                              },
                            ],
                          })
                          .open();
                      }}
                    >
                      Clear All Videos
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        dialogManager
                          .create({
                            title: "Clear Templates",
                            text: "Are you sure you want to clear all custom templates?",
                            buttons: [
                              {
                                text: "Clear",
                                onClick: () => {
                                  setCustomTemplates([]);
                                  localStorage.removeItem("customTemplates");
                                  dialogManager
                                    .create({
                                      title: "Cleared",
                                      text: "All custom templates cleared",
                                      buttons: [
                                        {
                                          text: "OK",
                                          onClick: () => {},
                                        },
                                      ],
                                    })
                                    .open();
                                },
                              },
                              {
                                text: "Cancel",
                                onClick: () => {},
                              },
                            ],
                          })
                          .open();
                      }}
                    >
                      Clear All Templates
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        dialogManager
                          .create({
                            title: "Clear Render History",
                            text: "Are you sure you want to clear all render jobs?",
                            buttons: [
                              {
                                text: "Clear",
                                onClick: () => {
                                  setChillinRenders([]);
                                  localStorage.removeItem("chillinRenders");
                                  dialogManager
                                    .create({
                                      title: "Cleared",
                                      text: "All render jobs cleared",
                                      buttons: [
                                        {
                                          text: "OK",
                                          onClick: () => {},
                                        },
                                      ],
                                    })
                                    .open();
                                },
                              },
                              {
                                text: "Cancel",
                                onClick: () => {},
                              },
                            ],
                          })
                          .open();
                      }}
                    >
                      Clear Render History
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs - These would be managed components */}
      {/* Create Template Dialog */}
      <Dialog
        open={createTemplateDialogOpen}
        onOpenChange={setCreateTemplateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Custom Template</DialogTitle>
            <DialogDescription>
              Enter the details for your new custom template.
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
              <Label htmlFor="numVideos">Number of Videos</Label>
              <Input
                id="numVideos"
                type="number"
                min="1"
                max="10"
                value={numVideosForTemplate}
                onChange={(e) =>
                  setNumVideosForTemplate(parseInt(e.target.value))
                }
                placeholder="Number of required videos"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateTemplateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCustomTemplate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create from Current Dialog */}
      <Dialog
        open={createFromCurrentDialogOpen}
        onOpenChange={setCreateFromCurrentDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Template from Current</DialogTitle>
            <DialogDescription>
              Enter a name for your template based on current selection.
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
            <Button
              variant="outline"
              onClick={() => setCreateFromCurrentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                handleCreateTemplateFromCurrent(
                  selectedVideos,
                  videoAudioTracks,
                  videoVolumes,
                  audioVolumes
                )
              }
            >
              Create from Current
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog
        open={editTemplateDialogOpen}
        onOpenChange={setEditTemplateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
            <DialogDescription>
              Modify the details of your template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editTemplateName">Template Name</Label>
              <Input
                id="editTemplateName"
                value={videoName}
                onChange={(e) => setVideoName(e.target.value)}
                placeholder="Enter template name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditTemplateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                handleEditTemplate(
                  selectedVideos,
                  videoAudioTracks,
                  videoVolumes,
                  audioVolumes
                )
              }
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Confirmation Dialog */}
      <Dialog
        open={deleteTemplateDialogOpen}
        onOpenChange={setDeleteTemplateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this custom template? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTemplateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTemplate}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* In/Out Points Dialog */}
      <Dialog open={inOutDialogOpen} onOpenChange={setInOutDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Set In/Out Points</DialogTitle>
            <DialogDescription>
              Set the in and out points for the video clip.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Video Preview Section */}
            <div className="space-y-2">
              <Label>Video Preview</Label>
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={setVideoPreviewRef}
                  className="w-full h-48 object-contain bg-black"
                  controls={false}
                  preload="metadata"
                  onLoadedMetadata={() => {
                    if (videoPreviewRef) {
                      videoPreviewRef.currentTime = inPoint;
                    }
                  }}
                  onClick={() => {
                    if (isVideoPreviewPlaying) {
                      pausePreview();
                    } else {
                      playPreview();
                    }
                  }}
                />
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                  {videoPreviewRef && videoPreviewRef.currentTime ?
                    videoPreviewRef.currentTime.toFixed(2) + 's / ' +
                    (currentVideoIndex !== null && selectedVideos[currentVideoIndex] ?
                      (selectedVideos[currentVideoIndex].duration || 10).toFixed(2) + 's' : '0.00s')
                    : '0.00s / 0.00s'}
                </div>
              </div>

              {/* Video Controls */}
              <div className="flex flex-wrap gap-2 mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={jumpToInPoint}
                >
                  Jump to In ({inPoint.toFixed(2)}s)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={isVideoPreviewPlaying ? pausePreview : playPreview}
                >
                  {isVideoPreviewPlaying ? 'Pause Preview' : 'Play Preview'}
                </Button>
                {isVideoPreviewPlaying && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={pausePreview}
                  >
                    Stop
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inPoint">In Point (seconds)</Label>
              <Slider
                id="inPoint"
                min={0}
                max={currentVideoIndex !== null && selectedVideos[currentVideoIndex] ? selectedVideos[currentVideoIndex].duration || 10 : 10}
                step={0.1}
                value={[inPoint]}
                onValueChange={(value) => {
                  setInPoint(value[0]);
                  // Update video preview to show the new inpoint
                  if (videoPreviewRef && !isVideoPreviewPlaying) {
                    // Move the video preview to the new inpoint position to let user see it
                    videoPreviewRef.currentTime = value[0];
                  }
                }}
                className="w-full"
              />
              <Input
                type="number"
                min={0}
                max={currentVideoIndex !== null && selectedVideos[currentVideoIndex] ? selectedVideos[currentVideoIndex].duration || 10 : 10}
                value={inPoint}
                onChange={(e) => setInPoint(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outPoint">Out Point (seconds)</Label>
              <Slider
                id="outPoint"
                min={inPoint}
                max={currentVideoIndex !== null && selectedVideos[currentVideoIndex] ? selectedVideos[currentVideoIndex].duration || 10 : 10}
                step={0.1}
                value={[outPoint]}
                onValueChange={(value) => {
                  setOutPoint(value[0]);
                  // Update video preview to show the new outpoint
                  if (videoPreviewRef && !isVideoPreviewPlaying) {
                    // Move the video preview to the new outpoint position to let user see it
                    videoPreviewRef.currentTime = value[0];
                  }
                }}
                className="w-full"
              />
              <Input
                type="number"
                min={inPoint}
                max={currentVideoIndex !== null && selectedVideos[currentVideoIndex] ? selectedVideos[currentVideoIndex].duration || 10 : 10}
                value={outPoint}
                onChange={(e) => setOutPoint(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInOutDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetInOutPoints}>Set Points</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Volume Dialog */}
      <Dialog open={volumeDialogOpen} onOpenChange={setVolumeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isAudioVolume ? "Audio" : "Video"} Volume for Video{" "}
              {currentVolumeVideoIndex !== null
                ? currentVolumeVideoIndex + 1
                : ""}
            </DialogTitle>
            <DialogDescription>
              Set the volume level for the {isAudioVolume ? "audio" : "video"}{" "}
              track.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="volumeSlider">Volume Level (0.0 - 1.0)</Label>
              <Slider
                id="volumeSlider"
                min={0}
                max={1}
                step={0.01}
                value={[volumeValue]}
                onValueChange={(value) => setVolumeValue(value[0])}
                className="w-full"
              />
              <div className="flex justify-between">
                <span>0.0</span>
                <span className="font-bold">{volumeValue.toFixed(2)}</span>
                <span>1.0</span>
              </div>
              <Input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={volumeValue}
                onChange={(e) =>
                  setVolumeValue(parseFloat(e.target.value) || 0)
                }
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVolumeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (isAudioVolume) {
                  setAudioVolume(currentVolumeVideoIndex, volumeValue);
                } else {
                  setVideoVolume(currentVolumeVideoIndex, volumeValue);
                }
                setVolumeDialogOpen(false);
              }}
            >
              Set Volume
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog
        open={showTemplatePreviewDialog}
        onOpenChange={setShowTemplatePreviewDialog}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Preview of the selected template
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {chillinProjectJson?.project ? (
              <div className="w-full h-64 bg-black rounded-lg overflow-hidden">
                <Player
                  component={VideoComposition}
                  durationInFrames={Math.round(
                    chillinProjectJson.project.duration * 30
                  )}
                  fps={30}
                  compositionWidth={1280}
                  compositionHeight={720}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  inputProps={{
                    layers: chillinProjectJson.project.view,
                  }}
                  controls
                />
              </div>
            ) : (
              <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-64 mt-4 flex items-center justify-center">
                <p className="text-gray-500">
                  No preview available. Please generate a preview first.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTemplatePreviewDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TracklessVideoEditor;
