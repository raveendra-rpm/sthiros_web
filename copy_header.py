import os
import glob
import re

def process_headers():
    # 1. Read index.html and extract the header
    with open('index.html', 'r', encoding='utf-8') as f:
        index_content = f.read()

    # Find the header block
    header_match = re.search(r'(<header class="site-header".*?</header>)', index_content, re.DOTALL)
    if not header_match:
        print("Header not found in index.html")
        return
        
    latest_header = header_match.group(1)

    # 2. Iterate through all other HTML files and replace their header block
    for filepath in glob.glob("*.html"):
        if filepath == 'index.html' or filepath == 'index_backup.html':
            continue
            
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = re.sub(r'<header class="site-header".*?</header>', latest_header, content, flags=re.DOTALL)
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated header in {filepath}")
        else:
            print(f"No changes needed for {filepath}")

process_headers()
