import { useCallback } from "react";
import { calculateTotalRecordedTime } from "../js/utils";
import dialog from "../lib/dialog";

const DB_NAME = "recordings";
const DEFAULT_DB_VERSION = 1;
const VERSION_KEY = "indexeddb_version";
const REQUIRED_STORES = ["chunks", "videos", "video_projects", "audio_tracks"];
const LATEST_ID_KEY = "indexeddb_latest_id";
const latestID = "d1a2b3c4-e5f6-4789-a0b1-c2d3e4f5g6h8"; // Updated for video_projects store

function getStoredDBVersion() {
  const stored = parseInt(localStorage.getItem(VERSION_KEY), 10);
  return Number.isInteger(stored) ? stored : DEFAULT_DB_VERSION;
}

function setStoredDBVersion(version) {
  localStorage.setItem(VERSION_KEY, version.toString());
}

function getStoredLatestID() {
  return localStorage.getItem(LATEST_ID_KEY);
}

function setStoredLatestID(id) {
  localStorage.setItem(LATEST_ID_KEY, id);
}

export async function openDB() {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      console.warn("❌ IndexedDB not supported.");
      return resolve(null);
    }

    let version = getStoredDBVersion();
    const storedLatestID = getStoredLatestID();

    if (storedLatestID !== latestID) {
      version += 1;
      setStoredLatestID(latestID);
      setStoredDBVersion(version);
      console.log("⬆️ Bumped DB version due to latestID change:", version);
    }

    let request;

    try {
      request = indexedDB.open(DB_NAME, version);
    } catch (err) {
      if (err.name === "VersionError") {
        console.warn("⚠️ Version mismatch. Trying to recover…");

        const detect = indexedDB.open(DB_NAME);
        detect.onsuccess = () => {
          const existingVersion = detect.result.version;
          setStoredDBVersion(existingVersion);
          detect.result.close();
          console.log("🔁 Retrying openDB with version:", existingVersion);
          openDB().then(resolve);
        };
        detect.onerror = () => {
          console.error("❌ Could not detect DB version.");
          resolve(null);
        };
        return;
      }

      console.warn("❌ Unexpected openDB error:", err);
      return resolve(null);
    }

    request.onupgradeneeded = (e) => {
      console.log("🔥 Running onupgradeneeded, upgrading DB…");
      const db = e.target.result;

      for (const storeName of REQUIRED_STORES) {
        let store;
        if (!db.objectStoreNames.contains(storeName)) {
          store = db.createObjectStore(storeName, {
            keyPath: "id",
            autoIncrement: true,
          });
        } else {
          store = e.target.transaction.objectStore(storeName);
        }

        if (
          storeName === "videos" &&
          !store.indexNames.contains("project_id")
        ) {
          store.createIndex("project_id", "project_id", { unique: false });
        }
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      setStoredDBVersion(db.version);
      resolve(db);
    };

    request.onerror = () => {
      const err = request.error;
      console.error("❌ IndexedDB open error:", err);

      if (err?.name === "VersionError") {
        console.warn("⚠️ Attempting fallback version detection…");

        const detect = indexedDB.open(DB_NAME);

        detect.onsuccess = () => {
          const db = detect.result;
          const actualVersion = db.version;
          db.close();

          console.log("🔍 Detected actual DB version:", actualVersion);
          setStoredDBVersion(actualVersion);

          openDB().then(resolve);
        };

        detect.onerror = () => {
          console.error("❌ Could not recover from version error.");
          resolve(null);
        };

        return;
      }

      resolve(null);
    };

    request.onblocked = () => {
      console.warn("⚠️ IndexedDB open blocked.");
      resolve(null);
    };
  });
}

export async function saveChunkToIndexedDB(blob) {
  console.log("📦 Saving recording chunk to IndexedDB", blob);
  const db = await openDB();
  const tx = db.transaction("chunks", "readwrite");
  const store = tx.objectStore("chunks");
  store.add({ blob, timestamp: Date.now() });
}

export async function getChunksFromIndexedDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("chunks", "readwrite");
    const store = tx.objectStore("chunks");
    const request = store.getAll();

    request.onsuccess = () => {
      const result = request.result || [];
      if (!Array.isArray(result)) {
        console.error("IndexedDB 'chunks' store returned non-array:", result);
        return resolve([]);
      }

      const blobs = result.map((entry) => entry.blob).filter(Boolean);
      resolve(blobs);
    };

    request.onerror = () => reject(request.error);
  });
}

export async function clearChunksFromIndexedDB() {
  const db = await openDB();
  const tx = db.transaction("chunks", "readwrite");
  tx.objectStore("chunks").clear();
}

export async function saveToIndexedDB({
  blob,
  name,
  project_id,
  handleLoadStoredVideos = null,
}) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("videos", "readwrite");
    const store = tx.objectStore("videos");

    const request = store.add({
      blob,
      name: name || "Untitled",
      project_id,
      timestamp: Date.now(),
    });

    request.onsuccess = async () => {
      console.log("✅ Video successfully saved to IndexedDB", {
        id: request.result,
      });
      if (handleLoadStoredVideos) await handleLoadStoredVideos();
      resolve(request.result);
    };

    request.onerror = () => {
      console.error("❌ Failed to save video to IndexedDB", request.error);
      reject(request.error);
    };
  });
}

export async function loadStoredVideosAll() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("videos", "readwrite");
    const store = tx.objectStore("videos");
    const request = store.getAll(); // ✅ get all, no filtering

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadStoredVideosByID(project_id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction("videos", "readonly");
    const store = tx.objectStore("videos");

    const handleResult = (videos) => {
      if (project_id) {
        resolve(videos.filter((v) => v.project_id === project_id));
      } else {
        const grouped = videos.reduce((acc, video) => {
          const pid = video.project_id || "unknown";
          if (!acc[pid]) acc[pid] = [];
          acc[pid].push(video);
          return acc;
        }, {});
        resolve(grouped);
      }
    };

    const request = store.getAll();

    request.onsuccess = () => handleResult(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function renameVideoInIndexedDB(id, newName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("videos", "readwrite");
    const store = tx.objectStore("videos");

    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const video = getRequest.result;
      if (!video) {
        return reject(new Error(`Video with id ${id} not found.`));
      }

      video.name = newName;

      const updateRequest = store.put(video);
      updateRequest.onsuccess = () => {
        resolve(updateRequest.result);
      };
      updateRequest.onerror = () => reject(updateRequest.error);
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

export async function resetIndexedDB() {
  // Clear all IndexedDB data
  indexedDB.deleteDatabase(DB_NAME);
  dialog.create({
    title: "Database Reset",
    text: "IndexedDB has been reset.",
    buttons: [
      {
        text: "OK",
        onClick: () => {
          location.reload();
        }
      }
    ]
  }).open();
}

// HOOK
export const useIndexedDBVideos = ({
  project_id,
  handleLoadStoredVideos,
} = {}) => {
  const getVideosFromIndexedDB = useCallback(async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("videos", "readwrite");
      const store = tx.objectStore("videos");

      console.log("project_id", project_id);

      if (project_id == "foo") {
        try {
          const index = store.index("project_id");
          const request = index.getAll(project_id);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        } catch (err) {
          console.warn("Index 'project_id' not available:", err);
          resolve([]); // fallback to empty if index doesn't exist
        }
      } else {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }
    });
  }, [project_id]); // ⬅️ important to add as dependency

  const deleteVideoFromIndexedDB = useCallback(
    async (id) => {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction("videos", "readwrite");
        const store = tx.objectStore("videos");
        const request = store.delete(id);

        request.onsuccess = async () => {
          if (handleLoadStoredVideos) await handleLoadStoredVideos();
          resolve(true);
        };
        request.onerror = () => reject(request.error);
      });
    },
    [handleLoadStoredVideos]
  );

  async function putToIndexedDB({ id, blob, name, timestamp, project_id }) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("videos", "readwrite");
      const store = tx.objectStore("videos");

      const request = store.put({ id, blob, name, timestamp, project_id });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  const moveVideoInIndexedDB = useCallback(
    async (index, direction = "up") => {
      const videos = await getVideosFromIndexedDB();
      const targetIndex = direction === "up" ? index - 1 : index + 1;

      if (
        index < 0 ||
        index >= videos.length ||
        targetIndex < 0 ||
        targetIndex >= videos.length
      ) {
        return videos;
      }

      const fields = ["name", "timestamp", "project_id", "blob"];

      // Swap fields between current index and target index
      const temp = {};
      fields.forEach((field) => {
        temp[field] = videos[targetIndex][field];
        videos[targetIndex][field] = videos[index][field];
        videos[index][field] = temp[field];
      });

      for (const video of videos) {
        await putToIndexedDB(video);
      }

      if (handleLoadStoredVideos) {
        await handleLoadStoredVideos();
      }

      return videos;
    },
    [getVideosFromIndexedDB, handleLoadStoredVideos]
  );

  // Video Projects Management Functions
  const saveVideoProject = useCallback(async (projectData) => {
    const db = await openDB();
    if (!db) throw new Error("IndexedDB not available");
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction("video_projects", "readwrite");
      const store = tx.objectStore("video_projects");
      
      const projectToSave = {
        id: projectData.id || `project_${Date.now()}`,
        name: projectData.name || "Untitled Project",
        created: projectData.created || Date.now(),
        modified: Date.now(),
        videos: projectData.videos || [],
        audio: projectData.audio || [],
        settings: projectData.settings || {}
      };
      
      const request = store.put(projectToSave);
      
      request.onsuccess = () => {
        console.log("✅ Video project saved:", projectToSave.id);
        resolve(projectToSave.id);
      };
      request.onerror = () => {
        console.error("❌ Error saving video project:", request.error);
        reject(request.error);
      };
    });
  }, []);

  const loadVideoProject = useCallback(async (projectId) => {
    const db = await openDB();
    if (!db) throw new Error("IndexedDB not available");
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction("video_projects", "readonly");
      const store = tx.objectStore("video_projects");
      const request = store.get(projectId);
      
      request.onsuccess = () => {
        if (request.result) {
          console.log("✅ Video project loaded:", projectId);
          resolve(request.result);
        } else {
          console.warn("⚠️ Video project not found:", projectId);
          resolve(null);
        }
      };
      request.onerror = () => {
        console.error("❌ Error loading video project:", request.error);
        reject(request.error);
      };
    });
  }, []);

  const getAllVideoProjects = useCallback(async () => {
    const db = await openDB();
    if (!db) throw new Error("IndexedDB not available");
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction("video_projects", "readonly");
      const store = tx.objectStore("video_projects");
      const request = store.getAll();
      
      request.onsuccess = () => {
        // Sort by modified date, newest first
        const projects = request.result.sort((a, b) => b.modified - a.modified);
        console.log(`✅ Loaded ${projects.length} video projects`);
        resolve(projects);
      };
      request.onerror = () => {
        console.error("❌ Error loading video projects:", request.error);
        reject(request.error);
      };
    });
  }, []);

  const deleteVideoProject = useCallback(async (projectId) => {
    const db = await openDB();
    if (!db) throw new Error("IndexedDB not available");
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction("video_projects", "readwrite");
      const store = tx.objectStore("video_projects");
      const request = store.delete(projectId);
      
      request.onsuccess = () => {
        console.log("✅ Video project deleted:", projectId);
        resolve(true);
      };
      request.onerror = () => {
        console.error("❌ Error deleting video project:", request.error);
        reject(request.error);
      };
    });
  }, []);

  // Audio Track Management Functions
  const saveAudioTrack = useCallback(async (audioData) => {
    const db = await openDB();
    if (!db) throw new Error("IndexedDB not available");
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction("audio_tracks", "readwrite");
      const store = tx.objectStore("audio_tracks");
      
      const trackToSave = {
        id: audioData.id || `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: audioData.name || "Untitled Audio",
        type: audioData.type, // "music", "effects", "voiceover", "preview"
        blob: audioData.blob,
        projectId: audioData.projectId,
        startTime: audioData.startTime || 0,
        duration: audioData.duration || 0,
        volume: audioData.volume || 100,
        fadeIn: audioData.fadeIn || 0,
        fadeOut: audioData.fadeOut || 0,
        trimStart: audioData.trimStart || 0,
        trimEnd: audioData.trimEnd || audioData.duration || 0,
        created: Date.now(),
        modified: Date.now()
      };
      
      const request = store.put(trackToSave);
      
      request.onsuccess = () => {
        console.log("✅ Audio track saved:", trackToSave.id);
        resolve(trackToSave);
      };
      request.onerror = () => {
        console.error("❌ Error saving audio track:", request.error);
        reject(request.error);
      };
    });
  }, []);

  const loadAudioTracks = useCallback(async (projectId, type = null) => {
    const db = await openDB();
    if (!db) throw new Error("IndexedDB not available");
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction("audio_tracks", "readonly");
      const store = tx.objectStore("audio_tracks");
      const request = store.getAll();
      
      request.onsuccess = () => {
        let tracks = request.result;
        
        // Filter by project ID
        if (projectId) {
          tracks = tracks.filter(track => track.projectId === projectId);
        }
        
        // Filter by type if specified
        if (type) {
          tracks = tracks.filter(track => track.type === type);
        }
        
        // Sort by start time for timeline
        tracks.sort((a, b) => a.startTime - b.startTime);
        
        console.log(`✅ Loaded ${tracks.length} audio tracks`);
        resolve(tracks);
      };
      request.onerror = () => {
        console.error("❌ Error loading audio tracks:", request.error);
        reject(request.error);
      };
    });
  }, []);

  const deleteAudioTrack = useCallback(async (trackId) => {
    const db = await openDB();
    if (!db) throw new Error("IndexedDB not available");
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction("audio_tracks", "readwrite");
      const store = tx.objectStore("audio_tracks");
      const request = store.delete(trackId);
      
      request.onsuccess = () => {
        console.log("✅ Audio track deleted:", trackId);
        resolve(true);
      };
      request.onerror = () => {
        console.error("❌ Error deleting audio track:", request.error);
        reject(request.error);
      };
    });
  }, []);

  const updateAudioTrack = useCallback(async (trackId, updates) => {
    const db = await openDB();
    if (!db) throw new Error("IndexedDB not available");
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction("audio_tracks", "readwrite");
      const store = tx.objectStore("audio_tracks");
      
      const getRequest = store.get(trackId);
      getRequest.onsuccess = () => {
        const track = getRequest.result;
        if (!track) {
          return reject(new Error(`Audio track with id ${trackId} not found`));
        }
        
        const updatedTrack = {
          ...track,
          ...updates,
          modified: Date.now()
        };
        
        const updateRequest = store.put(updatedTrack);
        updateRequest.onsuccess = () => {
          console.log("✅ Audio track updated:", trackId);
          resolve(updatedTrack);
        };
        updateRequest.onerror = () => reject(updateRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }, []);

  return {
    getVideosFromIndexedDB,
    deleteVideoFromIndexedDB,
    moveVideoInIndexedDB,
    // Video Projects functions
    saveVideoProject,
    loadVideoProject,
    getAllVideoProjects,
    deleteVideoProject,
    // Audio Track functions
    saveAudioTrack,
    loadAudioTracks,
    deleteAudioTrack,
    updateAudioTrack,
  };
};
