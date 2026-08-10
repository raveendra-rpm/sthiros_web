import re

with open('servicesinner.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract HTML
html_match = re.search(r'<!-- Start the conversation section -->\s*<section id=" skithedesksec\>.*?</section>', content, re.DOTALL)
html_str = html_match.group(0) if html_match else ''

with open('industry.html', 'r', encoding='utf-8') as f:
 ind_content = f.read()

# Insert HTML after </section> of #choosehowrostartsec
# We find </section> after <section id=\choosehowrostartsec\>
parts = ind_content.split('id=\choosehowrostartsec\>')
if len(parts) > 1:
 before = parts[0] + 'id=\choosehowrostartsec\>'
 after_parts = parts[1].split('</section>', 1)
 # The first </section> closes choosehowrostartsec
 new_ind_content = before + after_parts[0] + '</section>\n\n ' + html_str + '\n' + after_parts[1]
 
 with open('industry.html', 'w', encoding='utf-8') as f:
 f.write(new_ind_content)
 print('HTML injected.')
else:
 print('Could not find choosehowrostartsec')

