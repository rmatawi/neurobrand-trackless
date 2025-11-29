#!/bin/bash
# Read the entire file
FILE="src/hooks/useChillinAPI.js"

# Create a temporary Python script to do the replacement
cat > /tmp/fix_view.py << 'PYTHON'
with open('src/hooks/useChillinAPI.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the view line
old = "          view: updatedTracks[0].items, // Use updated tracks from chunking"
new = """          view: updatedTracks[0].items.map((item, index) => ({
            ...item,
            type: "Video", // Capitalize for Chillin API
            externalUrl: item.src, // Map src to externalUrl
            startInSource: item.inPoint, // Map inPoint to startInSource
            sourceDuration: item.sourceDuration,
          })),"""

content = content.replace(old, new)

with open('src/hooks/useChillinAPI.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("View mapping fix applied!")
PYTHON

python /tmp/fix_view.py
