import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace H270 with H350 in hero-mobile-right-svg
match = re.search(r'(<div class="hero-mobile-right-svg">.*?)(</div>)', content, re.DOTALL)
if match:
    svg_content = match.group(1)
    svg_content = svg_content.replace('H270', 'H350')
    svg_content = svg_content.replace('width="270"', 'width="350"')
    svg_content = svg_content.replace('viewBox="0 0 270 250"', 'viewBox="0 0 350 250"')
    content = content[:match.start()] + svg_content + match.group(2) + content[match.end():]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('Replaced successfully')
