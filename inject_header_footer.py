import sys

def process():
    try:
        with open('index.html', 'r', encoding='utf-8') as f:
            idx_lines = f.readlines()
        
        # Header from index.html (lines 19 to 130) -> indices 18 to 130
        header_lines = idx_lines[18:130]
        
        # Footer from index.html (lines 1185 to 1236) -> indices 1184 to 1236
        footer_lines = idx_lines[1184:1236]
        
        with open('aboutus.html', 'r', encoding='utf-8') as f:
            abt_lines = f.readlines()
            
        body_idx = -1
        script_idx = -1
        
        for i, line in enumerate(abt_lines):
            if '<body>' in line:
                body_idx = i
            if '<script>' in line and script_idx == -1:
                script_idx = i
                
        if body_idx == -1 or script_idx == -1:
            print(f"Error: body_idx={body_idx}, script_idx={script_idx}")
            return
            
        # We need to adjust script_idx if we insert header before it
        new_abt_lines = abt_lines[:body_idx+1] + header_lines + abt_lines[body_idx+1:script_idx] + footer_lines + ['\n'] + abt_lines[script_idx:]
        
        with open('aboutus.html', 'w', encoding='utf-8') as f:
            f.writelines(new_abt_lines)
            
        print("Success! Injected header and footer.")
    except Exception as e:
        print(f"Failed: {e}")

process()
