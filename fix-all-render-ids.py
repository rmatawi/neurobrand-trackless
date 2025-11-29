with open('src/hooks/useChillinAPI.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the success dialog message (line 389)
content = content.replace(
    'text: `Video project created with smart chunking! Project ID: ${result.data.render_id}`,',
    'text: `Video project created with smart chunking! Project ID: ${renderId}`,',
)

# Fix the test job success message (line 680) - this one keeps result.data.render_id since it's a different function
# We'll fix that separately if needed

with open('src/hooks/useChillinAPI.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed success dialog to use renderId variable")
