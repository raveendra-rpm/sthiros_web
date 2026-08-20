import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace H350 with H800 in hero-mobile-right-svg
match = re.search(r'(<div class="hero-mobile-right-svg">.*?)(</div>)', content, re.DOTALL)
if match:
    svg_content = match.group(1)
    svg_content = svg_content.replace('H350', 'H800')
    svg_content = svg_content.replace('width="350"', 'width="800"')
    svg_content = svg_content.replace('viewBox="0 0 350 250"', 'viewBox="0 0 800 250"')
    content = content[:match.start()] + svg_content + match.group(2) + content[match.end():]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Replaced successfully')
