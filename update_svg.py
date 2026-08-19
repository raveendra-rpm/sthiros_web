import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the SVG part
svg_match = re.search(r'<div class="hero-mobile-right-svg">.*?</div>', content, re.DOTALL)
if not svg_match:
    print('SVG not found')
    exit(1)

svg_str = svg_match.group(0)

# Replace width and viewBox width (200 -> 300)
svg_str = re.sub(r'width="200" height="250" viewBox="0 0 200 250"', 'width="300" height="250" viewBox="0 0 300 250"', svg_str)

# Replace horizontal lines (200 -> 300)
svg_str = svg_str.replace('H200', 'H300')

new_content = content.replace(svg_match.group(0), svg_str)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Updated successfully to H300')
