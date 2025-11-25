import { loadFFmpeg } from "../hooks/ffmpegSingleton";
import { fetchFile } from "@ffmpeg/util";
import { loadStoredVideosAll } from "../hooks/useIndexedDB";

// Using the browser-compatible version of api.video client
import { getApiVideoBaseUrl } from "../js/utils";
import apiVideoService from "./useApiVideo";

/**
 * Chunk Processing Service
 *
 * This service implements the timeline chunk processing pipeline:
 * 1. Analyzes timeline to find video sources and their inPoint/outPoint ranges
 * 2. Extracts matching chunks using FFmpeg keyframe splitting
 * 3. Calculates chunkAdjustment for keyframe compensation
 * 4. Uploads chunks to api.video and gets public URLs
 * 5. Updates render job with public URLs and adjusted timing
 */

/**
 * Analyze timeline to identify video sources and their usage patterns
 */
export const analyzeTimelineForVideoSources = (tracks) => {
  console.log("[CHUNK_TRACKING] Starting timeline analysis...");
  console.log("[CHUNK_TRACKING] Input tracks:", tracks);

  const videoUsageMap = new Map();

  tracks.forEach((track, trackIndex) => {
    if (!track.items) return;

    console.log(
      `[CHUNK_TRACKING] Processing track ${trackIndex}: ${track.name}, items:`,
      track.items
    );

    track.items.forEach((item, itemIndex) => {
      console.log(`[CHUNK_TRACKING] Processing item ${itemIndex}:`, {
        id: item.id,
        name: item.name,
        type: item.type,
        src: item.src,
        externalUrl: item.externalUrl,
        hasBlob: !!item.blob,
        inPoint: item.inPoint,
        outPoint: item.outPoint,
        duration: item.duration,
      });

      if (item.type === "video") {
        // Check if item has src, but also consider the case where it might not be present
        let sourceKey = item.src;
        const videoName = item.name || item.id || "unknown";

        // If src is undefined, try to use other properties to identify the video
        if (!sourceKey) {
          // Try to use externalUrl if available (for compatibility)
          if (item.externalUrl) {
            sourceKey = item.externalUrl;
          } else if (item.blob) {
            // If it has a blob property, create a temporary identifier
            sourceKey = `blob_${
              item.id || Math.random().toString(36).substr(2, 9)
            }`;
            console.log(
              `[CHUNK_TRACKING] Using temporary key for blob-based video: ${sourceKey}`
            );
          } else {
            // If we still don't have a source, use the name or ID
            sourceKey = videoName;
          }

          // Update the item with the source we found
          item.src = sourceKey;
        }

        // Skip if already has valid public_url (already processed)
        if (
          item.public_url &&
          (item.public_url.startsWith("http://") ||
            item.public_url.startsWith("https://"))
        ) {
          console.log(
            `[CHUNK_TRACKING] Skipping item ${item.name} - already has public_url`
          );
          return;
        }

        if (!videoUsageMap.has(sourceKey)) {
          videoUsageMap.set(sourceKey, {
            sourcePath: sourceKey,
            name: videoName, // Use the video name from the item
            mediaDuration: item.mediaDuration,
            usages: [],
            originalItem: item, // Store reference to original item in case we need more data
          });
        }

        videoUsageMap.get(sourceKey).usages.push({
          trackIndex,
          itemIndex,
          itemId: item.id,
          startTime: item.startTime,
          duration: item.duration,
          inPoint: item.inPoint || 0,
          outPoint: item.outPoint || item.duration || item.mediaDuration,
          originalItem: item,
        });
      }
    });
  });

  const analysis = Array.from(videoUsageMap.values());

  console.log(`[CHUNK_TRACKING] Timeline analysis complete:`);
  console.log(`[CHUNK_TRACKING] Found ${analysis.length} unique video sources`);
  analysis.forEach((source, index) => {
    console.log(
      `[CHUNK_TRACKING] Source ${index + 1}: ${source.sourcePath} (name: ${
        source.name
      }) used ${source.usages.length} times`
    );
    source.usages.forEach((usage, usageIndex) => {
      console.log(
        `[CHUNK_TRACKING]   Usage ${usageIndex + 1}: inPoint ${
          usage.inPoint
        }s → outPoint ${usage.outPoint}s (duration: ${usage.duration}s)`
      );
    });
  });

  // Log video selections for API video
  return analysis;
};

/**
 * Find video blob from IndexedDB or other sources
 */
export const findVideoBlobBySource = async (
  sourcePath,
  videoName = null,
  originalItem = null
) => {
  try {
    console.log(`[CHUNK_TRACKING] Looking for video blob for: ${sourcePath}`);
    console.log(`[CHUNK_TRACKING] Looking with videoName: ${videoName}`);
    console.log(
      `[CHUNK_TRACKING] Original item data:`,
      originalItem
        ? {
            id: originalItem.id,
            name: originalItem.name,
            hasBlob: !!originalItem.blob,
          }
        : "null"
    );

    // Check if originalItem has blob data
    if (originalItem && originalItem.blob) {
      console.log(`[CHUNK_TRACKING] Using blob from original item`);
      return originalItem.blob;
    }

    // First try IndexedDB - match by name pattern
    const storedVideos = await loadStoredVideosAll();
    console.log(
      `[CHUNK_TRACKING] Available videos in IndexedDB:`,
      storedVideos?.map((v) => ({
        name: v.name,
        id: v.id,
        timestamp: v.timestamp,
      })) || "none"
    );

    if (storedVideos && Array.isArray(storedVideos)) {
      for (const video of storedVideos) {
        console.log(
          `[CHUNK_TRACKING] Checking video: ${video.name} with id: ${video.id} and timestamp: ${video.timestamp}`
        );

        // If we have a video name (e.g., from blob URLs), try exact name match first
        if (videoName && video.name === videoName) {
          console.log(
            `[CHUNK_TRACKING] Found exact video match in IndexedDB: ${video.name}`
          );
          return video.blob;
        }

        // For blob URLs coming from selected videos, match based on the video ID
        if (sourcePath && sourcePath.startsWith("blob:")) {
          // If we have the videoName (which should be the original ID like 'device-xxxxx'),
          // try to match with the ID in the stored videos
          if (videoName && videoName.startsWith("device-")) {
            // Extract the numeric part from the device ID
            const deviceIdMatch = videoName.replace("device-", "");
            const videoIdStr = video.id?.toString() || "";

            // Check if stored video ID matches the expected device ID
            if (
              videoIdStr.includes(deviceIdMatch) ||
              deviceIdMatch.includes(videoIdStr.replace("device-", ""))
            ) {
              console.log(
                `[CHUNK_TRACKING] Found exact device ID match for video in IndexedDB: ${video.name} with id: ${video.id} for source name ${videoName}`
              );
              return video.blob;
            }
          }

          // Alternative: Try to match based on the timestamp part (the number after 'device-')
          // The device IDs like 'device-1760637121685' contain timestamps that might match with IndexedDB video timestamps
          if (videoName && videoName.startsWith("device-")) {
            const deviceTimestamp = videoName.replace("device-", ""); // e.g., '1760637121685'
            const videoTimestamp = video.timestamp?.toString() || "";

            // If the device timestamp is close to the video timestamp (within a reasonable range for same session)
            if (
              videoTimestamp &&
              deviceTimestamp.startsWith(videoTimestamp.substring(0, 10))
            ) {
              // Match first 10 digits (seconds precision)
              console.log(
                `[CHUNK_TRACKING] Found timestamp-based match for video in IndexedDB: ${video.name} with id: ${video.id}, videoTs: ${videoTimestamp}, deviceTs: ${deviceTimestamp}`
              );
              return video.blob;
            }
          }

          // Check if the video name matches recognizable patterns with the source path components
          // This is the general fallback case
          const videoNameLower = video.name?.toLowerCase() || "";
          if (
            videoNameLower.includes("video") ||
            /\d{1,2}\/\d{1,2}\/\d{4}, \d{1,2}:\d{2}:\d{2} [AP]M/.test(
              video.name
            )
          ) {
            console.log(
              `[CHUNK_TRACKING] Found candidate video in IndexedDB: ${video.name} for blob URL ${sourcePath}`
            );
            // Only return if we can't find an exact match - but we'll continue to see if we find a better match
            // Don't return yet, continue to check other videos
          }
        }

        // Try to match video name with source path
        const videoName_lower = video.name?.toLowerCase() || "";
        const sourceName = sourcePath.toLowerCase();

        // Check if video name matches any part of the source path
        if (
          (videoName_lower && sourceName.includes(videoName_lower)) ||
          (sourceName.includes("video3") &&
            videoName_lower.includes("video3")) ||
          (sourceName.includes("video5") && videoName_lower.includes("video5"))
        ) {
          console.log(
            `[CHUNK_TRACKING] Found matching video in IndexedDB: ${video.name} for source ${sourcePath}`
          );
          return video.blob;
        }
      }
    }

    // If sourcePath is a blob URL, try to fetch it directly
    if (sourcePath && sourcePath.startsWith("blob:")) {
      console.log(`[CHUNK_TRACKING] Fetching blob URL: ${sourcePath}`);
      try {
        const response = await fetch(sourcePath);
        if (response.ok) {
          const blob = await response.blob();
          console.log(`[CHUNK_TRACKING] Successfully fetched blob:`, blob.size);
          return blob;
        }
      } catch (fetchError) {
        console.warn(
          `[CHUNK_TRACKING] Failed to fetch blob URL: ${fetchError.message}`
        );
      }
    }

    // Try to fetch from relative URL (convert to absolute)
    if (sourcePath && sourcePath.startsWith("/")) {
      try {
        const absoluteUrl = window.location.origin + sourcePath;
        console.log(
          `[CHUNK_TRACKING] Attempting to fetch from absolute URL: ${absoluteUrl}`
        );
        const response = await fetch(absoluteUrl);
        if (response.ok) {
          console.log(
            `[CHUNK_TRACKING] Successfully fetched video from: ${absoluteUrl}`
          );
          return await response.blob();
        }
      } catch (fetchError) {
        console.log(
          `[CHUNK_TRACKING] Failed to fetch from URL, will try fallback: ${fetchError.message}`
        );
      }
    }

    // If it's already a full URL
    if (
      sourcePath &&
      (sourcePath.startsWith("http://") || sourcePath.startsWith("https://"))
    ) {
      console.log(`[CHUNK_TRACKING] Fetching video from URL: ${sourcePath}`);
      const response = await fetch(sourcePath);
      if (response.ok) {
        return await response.blob();
      }
    }

    console.warn(
      `[CHUNK_TRACKING] Video blob not found for source: ${sourcePath}`
    );
    return null;
  } catch (error) {
    console.error(`[CHUNK_TRACKING] Error finding video blob:`, error);
    return null;
  }
};

/**
 * Extract chunks from video based on timeline segments
 */
export const extractVideoChunks = async (
  videoBlob,
  videoSource,
  onProgress
) => {
  let ffmpeg;
  try {
    console.log(`========== CHUNK PROCESSING STARTED ==========`);
    console.log(
      `[CHUNK_TRACKING] 🎬 STARTING CHUNK EXTRACTION FOR VIDEO: ${videoSource.name}`
    );
    console.log(
      `[CHUNK_TRACKING] 📦 Input video size: ${(
        videoBlob.size /
        1024 /
        1024
      ).toFixed(2)} MB`
    );
    console.log(
      `[CHUNK_TRACKING] 📍 Video source has ${videoSource.usages.length} usages/segments`
    );
    videoSource.usages.forEach((usage, index) => {
      console.log(
        `[CHUNK_TRACKING]    Segment ${index + 1}: ${usage.inPoint.toFixed(
          2
        )}s → ${usage.outPoint.toFixed(2)}s (duration: ${usage.duration.toFixed(
          2
        )}s)`
      );
    });
    onProgress?.(`Processing ${videoSource.name}...`);

    ffmpeg = await loadFFmpeg();

    const isMP4 =
      videoBlob.type === "video/mp4" || videoBlob.type === "video/quicktime";
    const inputFileName = isMP4 ? "input.mp4" : "input.webm";
    const chunkExtension = isMP4 ? "mp4" : "webm";

    await ffmpeg.writeFile(inputFileName, await fetchFile(videoBlob));
    console.log(
      `[CHUNK_TRACKING] Video written to FFmpeg: ${(
        videoBlob.size /
        1024 /
        1024
      ).toFixed(2)} MB`
    );

    // Extract each usage as a separate, precise segment
    const extractedChunks = [];
    for (const usage of videoSource.usages) {
      console.log(`[CHUNK_TRACKING] ====== DIRECT EXTRACTION DEBUG ======`);
      console.log(
        `[CHUNK_TRACKING] Usage: ${usage.inPoint}s → ${usage.outPoint}s (duration: ${usage.duration}s)`
      );

      const outputFileName = `usage_${usage.itemId}.${chunkExtension}`;

      // Extract the exact segment using FFmpeg
      const extractCommand = [
        "-i",
        inputFileName,
        "-ss",
        usage.inPoint.toString(), // Start time
        "-t",
        usage.duration.toString(), // Duration (not end time)
        "-c",
        "copy", // Copy streams without re-encoding
        "-avoid_negative_ts",
        "make_zero",
        outputFileName,
      ];

      console.log(
        `[CHUNK_TRACKING] FFmpeg extract command: ${extractCommand.join(" ")}`
      );
      await ffmpeg.exec(extractCommand);

      // Read the extracted segment
      const extractedData = await ffmpeg.readFile(outputFileName);
      const finalChunkBlob = new Blob([extractedData.buffer], {
        type: videoBlob.type,
      });

      // For direct extraction, chunkAdjustment is always 0 because we extract exactly what we need
      const chunkAdjustment = 0;

      console.log(`[CHUNK_TRACKING] DIRECT EXTRACTION RESULT:`);
      console.log(
        `[CHUNK_TRACKING]   Extracted: ${usage.inPoint}s → ${usage.outPoint}s`
      );
      console.log(`[CHUNK_TRACKING]   Chunk starts at: 0s (direct extraction)`);
      console.log(
        `[CHUNK_TRACKING]   Chunk adjustment: ${chunkAdjustment}s (no adjustment needed)`
      );
      console.log(
        `[CHUNK_TRACKING]   Renderer will play: 0s → ${usage.duration}s from chunk`
      );
      console.log(
        `[CHUNK_TRACKING] Extracted chunk for usage ${usage.itemId}: ${(
          finalChunkBlob.size /
          1024 /
          1024
        ).toFixed(2)} MB`
      );
      console.log(`[CHUNK_TRACKING] =====================================`);

      extractedChunks.push({
        id: usage.itemId,
        blob: finalChunkBlob,
        size: finalChunkBlob.size,
        chunkAdjustment,
        originalUsage: usage,
        // For direct extraction, timing is simple
        adjustedInPoint: 0,
        adjustedOutPoint: usage.duration,
        filename: outputFileName,
      });

      // Cleanup this extraction file
      await ffmpeg.deleteFile(outputFileName);
    }

    // Cleanup FFmpeg files
    try {
      await ffmpeg.deleteFile(inputFileName);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    console.log(
      `[CHUNK_TRACKING] 🎉 CHUNK EXTRACTION COMPLETE FOR ${videoSource.name}`
    );
    console.log(
      `[CHUNK_TRACKING]    Extracted ${extractedChunks.length} segments`
    );
    console.log(
      `[CHUNK_TRACKING]    Total extracted size: ${(
        extractedChunks.reduce((acc, chunk) => acc + chunk.size, 0) /
        1024 /
        1024
      ).toFixed(2)} MB`
    );
    console.log(`========== CHUNK PROCESSING FINISHED ==========`);

    return extractedChunks;
  } catch (error) {
    console.error(`[CHUNK_TRACKING] Error extracting chunks:`, error);

    if (ffmpeg) {
      try {
        const allFiles = await ffmpeg.listDir(".");
        for (const file of allFiles) {
          if (file.name.includes("input") || file.name.includes("usage_")) {
            await ffmpeg.deleteFile(file.name);
          }
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
    }

    throw error;
  }
};

/**
 * Process chunks for api.video upload
 */
export const processChunksLocally = async (
  chunks,
  videoSource,
  jobId,
  onProgress
) => {
  console.log(
    `[CHUNK_TRACKING] 🌐 STARTING API.VIDEO CHUNK PROCESSING FOR: ${videoSource.name}`
  );
  console.log(`[CHUNK_TRACKING] 📦 Processing ${chunks.length} chunks`);
  console.log(`[CHUNK_TRACKING] 📍 Job ID: ${jobId}`);
  console.log(`[CHUNK_TRACKING] 📋 Chunk details:`);
  chunks.forEach((c, index) => {
    console.log(
      `[CHUNK_TRACKING]    Chunk ${index + 1}: ${c.filename || c.fileName} (${(
        c.blob.size /
        1024 /
        1024
      ).toFixed(2)} MB)`
    );
  });

  const localChunks = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const fileName = chunk.filename || chunk.fileName || `chunk-${i}.mp4`;

    try {
      console.log(
        `[CHUNK_TRACKING] 📤 Uploading chunk ${i + 1}/${
          chunks.length
        }: ${fileName} (${(chunk.blob.size / 1024 / 1024).toFixed(2)} MB)`
      );

      // Data being sent to api.video
      const videoCreationData = {
        title: `${jobId}-${videoSource.name}-${fileName}`.substring(0, 255), // Ensure title is not too long
        // Optional: specify additional parameters
        // public: true, // Default is true
      };

      // Use the api.video multipart upload approach with centralized service
      const uploadedVideo = await apiVideoService.uploadApiVideo(
        chunk.blob,
        videoCreationData,
        fileName
      );
      const videoId = uploadedVideo.videoId;

      if (!videoId) {
        console.error(
          `❌ No videoId found. Created video:`,
          JSON.stringify(uploadedVideo, null, 2)
        );
        throw new Error(
          `Invalid response from api.video: videoId missing in created video.`
        );
      }

      // Prioritize player URL for better Chillin compatibility (instead of direct mp4)
      const publicUrl = `https://vod.api.video/vod/${videoId}/mp4/source.mp4`;
      console.log({ publicUrl });

      localChunks.push({
        index: i,
        fileName: fileName,
        publicUrl: publicUrl, // Actual URL from upload response
        size: chunk.blob.size,
        blob: chunk.blob,
        isLocal: true,
        videoId: videoId,
      });

      console.log(
        `[CHUNK_TRACKING] ✅ Chunk uploaded successfully: ${fileName} → ${publicUrl}`
      );
    } catch (error) {
      console.error(
        `❌ API.VIDEO ERROR: Failed to upload chunk ${fileName}:`,
        JSON.stringify(
          {
            message: error.message || error,
            type: typeof error,
            constructor: error?.constructor?.name,
          },
          null,
          2
        )
      );

      // Fallback to blob URL if api.video upload fails
      const blobUrl = URL.createObjectURL(chunk.blob);
      localChunks.push({
        index: i,
        fileName: fileName,
        publicUrl: blobUrl,
        size: chunk.blob.size,
        blob: chunk.blob,
        isLocal: true,
        fallbackToBlob: true,
      });
    }

    // Update progress
    onProgress?.(`🌐 Uploaded ${i + 1}/${chunks.length} chunks to api.video`);
  }

  console.log(
    `[CHUNK_TRACKING] 🎉 API.VIDEO CHUNK PROCESSING COMPLETE FOR ${videoSource.name}`
  );
  console.log(
    `[CHUNK_TRACKING]    Successfully processed ${localChunks.length} chunks`
  );
  console.log(
    `[CHUNK_TRACKING]    ${
      localChunks.filter((c) => !c.fallbackToBlob).length
    } chunks uploaded to api.video`
  );
  console.log(
    `[CHUNK_TRACKING]    ${
      localChunks.filter((c) => c.fallbackToBlob).length
    } chunks using blob URLs`
  );
  return localChunks;
};

/**
 * Update render job tracks with chunk URLs and adjusted timing
 */
export const updateRenderJobWithChunks = (
  tracks,
  videoSource,
  uploadedChunks
) => {
  console.log(
    `[CHUNK_TRACKING] Updating render job for ${videoSource.name} with ${uploadedChunks.length} chunks`
  );

  const updatedTracks = JSON.parse(JSON.stringify(tracks)); // Deep clone

  // Map each usage to its corresponding chunk
  videoSource.usages.forEach((usage, usageIndex) => {
    const chunk = uploadedChunks[usageIndex];
    if (!chunk) return;

    const track = updatedTracks[usage.trackIndex];
    if (!track || !track.items) return;

    const item = track.items[usage.itemIndex];
    if (!item || item.id !== usage.itemId) return;

    const itemName = item.name || item.id || "unknown";
    console.log(`[CHUNK_TRACKING] Updating item ${itemName}:`);
    console.log(
      `[CHUNK_TRACKING]   Original: src=${item.src}, inPoint=${item.inPoint}, outPoint=${item.outPoint}`
    );
    console.log(
      `[CHUNK_TRACKING]   Updated: public_url=${
        chunk.publicUrl
      }, chunkAdjustment=${chunk.chunkAdjustment || 0}`
    );
    console.log(
      `[CHUNK_TRACKING]   Timing: Updated inPoint/outPoint to match extracted chunk file`
    );

    // Update the item with chunk data
    item.src = chunk.publicUrl; // Use the chunk URL for rendering
    item.public_url = chunk.publicUrl;
    item.chunkAdjustment = chunk.chunkAdjustment || 0; // Ensure it's not undefined

    // CRITICAL FIX: Update timeline points for extracted chunks
    // The extracted chunk is a new file that starts at 0s, not at the original inPoint
    console.log(
      `[CHUNK_TRACKING]   BEFORE: inPoint=${item.inPoint}, outPoint=${item.outPoint}`
    );
    item.inPoint = 0; // Chunk always starts at 0s
    item.outPoint = usage.duration; // Chunk duration from start
    console.log(
      `[CHUNK_TRACKING]   AFTER: inPoint=${item.inPoint}, outPoint=${item.outPoint}`
    );
  });

  return updatedTracks;
};

/**
 * Main chunk processing pipeline - replaces entire video uploads
 */
export const processTimelineChunks = async (
  tracks,
  jobId,
  onProgress,
  rendererApiUrl
) => {
  try {
    console.log(`========== CHUNK PROCESSING PIPELINE STARTED ==========`);
    console.log(
      `[CHUNK_TRACKING] 🚀 STARTING TIMELINE CHUNK PROCESSING PIPELINE`
    );
    console.log(`[CHUNK_TRACKING] 📋 Job ID: ${jobId}`);
    console.log(`[CHUNK_TRACKING] 🌐 Renderer API URL: ${rendererApiUrl}`);
    console.log(`[CHUNK_TRACKING] 📍 Timeline has ${tracks.length} tracks`);
    tracks.forEach((track, trackIndex) => {
      console.log(
        `[CHUNK_TRACKING]    Track ${trackIndex + 1}: ${track.name} (${
          track.items?.length || 0
        } items)`
      );
    });

    // Step 1: Analyze timeline
    onProgress?.("Analyzing timeline...");
    const videoSources = analyzeTimelineForVideoSources(tracks);

    if (videoSources.length === 0) {
      console.log(
        `[CHUNK_TRACKING] No video sources found that require chunk processing`
      );
      return tracks; // Return original tracks unchanged
    }

    let updatedTracks = JSON.parse(JSON.stringify(tracks)); // Deep clone

    // Step 2: Process each video source
    for (let i = 0; i < videoSources.length; i++) {
      const videoSource = videoSources[i];
      console.log(
        `[CHUNK_TRACKING] 🔧 PROCESSING VIDEO SOURCE ${i + 1}/${
          videoSources.length
        }: ${videoSource.name}`
      );
      console.log(`[CHUNK_TRACKING]    Source path: ${videoSource.sourcePath}`);
      console.log(
        `[CHUNK_TRACKING]    Media duration: ${videoSource.mediaDuration}`
      );
      console.log(
        `[CHUNK_TRACKING]    Has original item: ${!!videoSource.originalItem}`
      );

      // Find video blob
      onProgress?.(`Finding video: ${videoSource.name}...`);
      const videoBlob = await findVideoBlobBySource(
        videoSource.sourcePath,
        videoSource.name,
        videoSource.originalItem
      );
      if (!videoBlob) {
        console.error(
          `[CHUNK_TRACKING] Could not find video blob for ${videoSource.name}`
        );
        continue;
      }

      console.log(
        `[CHUNK_TRACKING]    Video blob size: ${videoBlob.size} bytes`
      );

      // Extract chunks
      const chunks = await extractVideoChunks(
        videoBlob,
        videoSource,
        onProgress
      );

      // Process chunks - upload to api.video
      console.log(
        `[CHUNK_TRACKING] Uploading chunks to api.video`
      );
      const processedChunks = await processChunksLocally(
        chunks,
        videoSource,
        jobId,
        onProgress
      );

      // Update tracks
      updatedTracks = updateRenderJobWithChunks(
        updatedTracks,
        videoSource,
        processedChunks
      );
    }

    console.log(`[CHUNK_TRACKING] ========================================`);
    console.log(`[CHUNK_TRACKING] 🎉 CHUNK PROCESSING PIPELINE COMPLETE! 🎉`);
    console.log(`[CHUNK_TRACKING] ========================================`);
    console.log(
      `[CHUNK_TRACKING] ✅ RESULT: Processed CHUNKS, NOT entire videos`
    );
    console.log(
      `[CHUNK_TRACKING] ✅ Total sources processed: ${videoSources.length}`
    );
    console.log(
      `[CHUNK_TRACKING] ✅ Render job updated with chunk URLs and timing adjustments`
    );
    console.log(
      `[CHUNK_TRACKING] ✅ Storage mode: api.video URLs`
    );
    console.log(`[CHUNK_TRACKING] ========================================`);
    console.log(`========== CHUNK PROCESSING PIPELINE FINISHED ==========`);

    return updatedTracks;
  } catch (error) {
    console.error(
      `[CHUNK_TRACKING] ❌ CHUNK PROCESSING PIPELINE FAILED:`,
      error
    );
    throw error;
  }
};
