import os
import glob

def process():
    # Read the new header block
    with open('index.html', 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # In index.html, <header class="site-header"> is at line 20 (index 19)
    # The PRELOADER comment is at line 285 (index 284)
    # We want lines 19 to 284 (exclusive, so up to 284)
    start_line = -1
    end_line = -1
    for i, line in enumerate(lines):
        if '<header class="site-header">' in line and start_line == -1:
            start_line = i
        if '<!-- ═══════════════ PRELOADER ═══════════════ -->' in line and end_line == -1:
            end_line = i
            break
            
    if start_line == -1 or end_line == -1:
        print("Could not find header boundaries in index.html")
        return
        
    new_header = "".join(lines[start_line:end_line])

    html_files = glob.glob('*.html')
    if 'index.html' in html_files: html_files.remove('index.html')
    if 'index_backup.html' in html_files: html_files.remove('index_backup.html')

    for file in html_files:
        try:
            with open(file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Find start of header
            start_idx = content.find('<header class="site-header">')
            if start_idx == -1:
                print(f"Skipping {file} (no <header class=\"site-header\">)")
                continue
            
            # Find end of overlay/header. Look for PRELOADER comment.
            end_idx = content.find('<!-- ═══════════════ PRELOADER ═══════════════ -->')
            if end_idx == -1:
                end_idx = content.find('<div id="preloader">')
            if end_idx == -1:
                end_idx = content.find('<!-- ── WebGL Background Disabled ── -->')
            if end_idx == -1:
                # Fallback to look for closing </nav> followed by </div></div>
                # This is risky, but let's try
                nav_end = content.find('</nav>', start_idx)
                if nav_end != -1:
                    div1 = content.find('</div>', nav_end)
                    div2 = content.find('</div>', div1 + 6)
                    end_idx = div2 + 6
                
            if start_idx != -1 and end_idx != -1:
                # keep whatever was before start_idx, insert new header, then whatever was after end_idx
                new_content = content[:start_idx] + new_header + content[end_idx:]
                with open(file, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Updated {file}")
            else:
                print(f"Could not find boundaries in {file}")
                
        except Exception as e:
            print(f"Error on {file}: {e}")

if __name__ == '__main__':
    process()
