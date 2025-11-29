#!/usr/bin/env python3
import sys

# Read the file
with open('src/hooks/useChillinAPI.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix #1: Update Chillin API payload structure
old_payload = '''      // Create Chillin API request payload with chunk URLs
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
      };'''

new_payload = '''      // Create Chillin API request payload with chunk URLs
      const chillinApiPayload = {
        compositeWidth: 1280,
        compositeHeight: 720,
        fps: 30,
        projectData: {
          type: "",
          width: 1280,
          height: 720,
          fill: "#000000", // Background fill color
          duration: totalDuration,
          version: 0,
          view: updatedTracks[0].items.map((item, index) => ({
            ...item,
            type: "Video", // Capitalize for Chillin API
            externalUrl: item.src, // Map src to externalUrl
            startInSource: item.inPoint, // Map inPoint to startInSource
            sourceDuration: item.sourceDuration,
          })),
          audio: [],
          effect: [],
          transition: [],
        },
      };'''

if old_payload in content:
    content = content.replace(old_payload, new_payload)
    print("Fix #1 applied: Chillin API payload updated")
else:
    print("WARNING: Could not find old_payload - may already be fixed")

# Fix #2: Add 10-second wait
old_wait = '''      // Show a 10-second simulation
      dialogManager.create({
        title: "Processing",
        text: "Preparing project for Chillin renderer (simulating 10s process)...",
        buttons: [
          {
            text: "OK",
            onClick: () => {}
          }
        ]
      }).open();

      // Separate function for the API call'''

new_wait = '''      // Show a 10-second preloader to allow api.video to finish processing
      dialogManager.create({
        title: "Processing",
        text: "Preparing project for Chillin renderer...",
        buttons: [
          {
            text: "OK",
            onClick: () => {}
          }
        ]
      }).open();

      // Wait for 10 seconds to allow api.video to finish processing uploaded chunks
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Wait 500ms before showing confirmation dialog
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Separate function for the API call'''

if old_wait in content:
    content = content.replace(old_wait, new_wait)
    print("Fix #2 applied: 10-second wait added")
else:
    print("WARNING: Could not find old_wait - may already be fixed")

# Write the updated content
with open('src/hooks/useChillinAPI.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done! Fixes applied to useChillinAPI.js")
