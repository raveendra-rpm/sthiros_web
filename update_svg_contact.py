import re

with open('contactus.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove margin-top: -80px
content = re.sub(r'\s*#btmsvgsecdiv\s*\{\s*margin-top:\s*-80px;\s*\}', '', content)

# 2. Update aspect-ratio
content = re.sub(r'aspect-ratio:\s*1702\s*/\s*1900;', 'aspect-ratio: 1702 / 1700;', content)

# 3. Update svg tag
content = re.sub(r'height="1800"\s*viewBox="0\s*0\s*1702\s*1800"', 'height="1700" viewBox="0 0 1702 1700"', content)

# 4. Update paths (replace 1800 with 1700 only within herosvgsecdivcont)
match = re.search(r'(<section id="herosvgsecdivcont">.*?)(</section>)', content, re.DOTALL)
if match:
    svg_content = match.group(1)
    svg_content_updated = svg_content.replace('1800', '1700')
    content = content[:match.start()] + svg_content_updated + match.group(2) + content[match.end():]

with open('contactus.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated successfully!')
