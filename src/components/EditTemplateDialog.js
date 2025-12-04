import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';

const EditTemplateDialog = ({
  open,
  onOpenChange,
  numVideos,
  setNumVideos,
  videoDescriptions,
  setVideoDescriptions,
  videoDurations,
  setVideoDurations,
  onConfirm,
  videoName,
  setVideoName
}) => {
  const [tempNumVideos, setTempNumVideos] = useState(numVideos);
  const [tempVideoDescriptions, setTempVideoDescriptions] = useState([...videoDescriptions]);
  const [tempVideoDurations, setTempVideoDurations] = useState([...videoDurations]);
  const [tempVideoName, setTempVideoName] = useState(videoName || '');

  console.log("[ETD-DEBUG] EditTemplateDialog rendered with props:", {
    open,
    numVideos,
    videoDescriptions,
    videoDurations,
    videoName
  });

  // Sync with parent state when dialog opens
  useEffect(() => {
    console.log("[ETD-DEBUG] Dialog sync effect, open:", open);
    if (open) {
      console.log("[ETD-DEBUG] Setting temp values from parent - numVideos:", numVideos,
                  "videoName:", videoName,
                  "videoDescriptions:", videoDescriptions,
                  "videoDurations:", videoDurations);
      setTempNumVideos(numVideos);
      setTempVideoDescriptions([...videoDescriptions]);
      setTempVideoDurations([...videoDurations]);
      setTempVideoName(videoName || '');
    }
  }, [open, numVideos, videoDescriptions, videoDurations, videoName]);

  // Adjust arrays when number of videos changes
  useEffect(() => {
    console.log("[ETD-DEBUG] Temp num videos changed to:", tempNumVideos,
                "tempVideoDescriptions length:", tempVideoDescriptions.length);
    if (tempNumVideos > tempVideoDescriptions.length) {
      // Add new empty descriptions and default durations
      const newDescriptions = [...tempVideoDescriptions];
      const newDurations = [...tempVideoDurations];
      for (let i = tempVideoDescriptions.length; i < tempNumVideos; i++) {
        newDescriptions.push('');
        newDurations.push(3);
      }
      console.log("[ETD-DEBUG] Added new items, new descriptions:", newDescriptions,
                  "new durations:", newDurations);
      setTempVideoDescriptions(newDescriptions);
      setTempVideoDurations(newDurations);
    } else if (tempNumVideos < tempVideoDescriptions.length) {
      // Remove extra descriptions and durations
      const newDescriptions = tempVideoDescriptions.slice(0, tempNumVideos);
      const newDurations = tempVideoDurations.slice(0, tempNumVideos);
      console.log("[ETD-DEBUG] Removed extra items, new descriptions:", newDescriptions,
                  "new durations:", newDurations);
      setTempVideoDescriptions(newDescriptions);
      setTempVideoDurations(newDurations);
    }
  }, [tempNumVideos, tempVideoDescriptions, tempVideoDurations.length]);

  const handleConfirm = () => {
    console.log("[ETD-DEBUG] handleConfirm called with temp values:", {
      tempVideoName,
      tempNumVideos,
      tempVideoDescriptions,
      tempVideoDurations
    });

    // Update parent state with temp values
    console.log("[ETD-DEBUG] Updating parent state with values:", {
      numVideos: tempNumVideos,
      videoName: tempVideoName
    });
    setNumVideos(tempNumVideos);
    setVideoDescriptions([...tempVideoDescriptions]);
    setVideoDurations([...tempVideoDurations]);
    setVideoName(tempVideoName);

    console.log("[ETD-DEBUG] Updated parent state, values passed:", {
      numVideos: tempNumVideos,
      videoName: tempVideoName,
      videoDescriptions: [...tempVideoDescriptions],
      videoDurations: [...tempVideoDurations]
    });

    // Call the parent confirm function with the updated values to ensure we have fresh data
    onConfirm(tempVideoName, tempNumVideos, [...tempVideoDescriptions], [...tempVideoDurations]);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-96 max-w-90vw z-50 max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-xl font-bold mb-4">Edit Template</Dialog.Title>
          <Dialog.Description className="mb-4 text-gray-600">
            Configure the details for this template.
          </Dialog.Description>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={tempVideoName}
                onChange={(e) => {
                  console.log("[ETD-DEBUG] Template name changed to:", e.target.value);
                  setTempVideoName(e.target.value);
                }}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Enter template name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Number of videos (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={tempNumVideos}
                onChange={(e) => {
                  const newValue = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                  console.log("[ETD-DEBUG] Number of videos changed to:", newValue);
                  setTempNumVideos(newValue);
                }}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>

            {Array.from({ length: tempNumVideos }).map((_, index) => (
              <div key={index} className="border-t pt-4">
                <h3 className="font-medium mb-2">Video {index + 1}</h3>

                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={tempVideoDescriptions[index] || ''}
                    onChange={(e) => {
                      console.log("[ETD-DEBUG] Description for video", index + 1, "changed to:", e.target.value);
                      const newDescriptions = [...tempVideoDescriptions];
                      newDescriptions[index] = e.target.value;
                      setTempVideoDescriptions(newDescriptions);
                    }}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="Enter description..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={tempVideoDurations[index] || 3}
                    onChange={(e) => {
                      const newDuration = parseFloat(e.target.value) || 3;
                      console.log("[ETD-DEBUG] Duration for video", index + 1, "changed to:", newDuration);
                      const newDurations = [...tempVideoDurations];
                      newDurations[index] = newDuration;
                      setTempVideoDurations(newDurations);
                    }}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="Duration in seconds..."
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Dialog.Close asChild>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300">
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <Cross2Icon />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default EditTemplateDialog;