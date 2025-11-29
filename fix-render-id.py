with open('src/hooks/useChillinAPI.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_code = """          const result = await response.json();
          
          // Update the chillinRenders state
          const newRenderJob = {
            id: result.data.render.render_id,
            name: `Render Job ${Date.now()}`,
            status: "created",
            timestamp: new Date().toISOString(),
            videoUrl: null,
          };"""

new_code = """          const result = await response.json();

          // Log the actual response structure for debugging
          console.log("[CHILLIN_API] Full API response:", result);
          console.log("[CHILLIN_API] Response data:", result.data);

          // Extract render_id from response (handle different possible structures)
          const renderId = result.data?.render_id || result.render_id || result.data?.render?.render_id;

          if (!renderId) {
            console.error("[CHILLIN_API] Could not find render_id in response:", result);
            throw new Error("Invalid Chillin API response: render_id not found");
          }

          console.log("[CHILLIN_API] Extracted render_id:", renderId);

          // Update the chillinRenders state
          const newRenderJob = {
            id: renderId,
            name: `Render Job ${Date.now()}`,
            status: "created",
            timestamp: new Date().toISOString(),
            videoUrl: null,
          };"""

if old_code in content:
    content = content.replace(old_code, new_code)
    print("Fix applied: Added logging and flexible render_id extraction")
else:
    print("WARNING: Could not find exact match. Trying alternate pattern...")
    # Try with different whitespace
    import re
    # Just replace the problematic line
    content = re.sub(
        r'id: result\.data\.render\.render_id,',
        r'id: result.data?.render_id || result.render_id || result.data?.render?.render_id,',
        content
    )
    print("Applied regex-based fix for render_id line")

with open('src/hooks/useChillinAPI.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done!")
