import os
import glob

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    
    # --- RENAME IN HEADER ---
    # Desktop nav
    content = content.replace('<li><a href="aboutus.html">ABOUT US</a></li>', '<li><a href="aboutus.html">WHO WE ARE</a></li>')
    content = content.replace('<li><a href="aboutus.html" target="_blank">ABOUT US</a></li>', '<li><a href="aboutus.html" target="_blank">WHO WE ARE</a></li>')
    # Mobile nav
    content = content.replace('<a href="aboutus.html" target="_blank" class="nav-link">ABOUT US</a>', '<a href="aboutus.html" target="_blank" class="nav-link">WHO WE ARE</a>')
    content = content.replace('<a href="aboutus.html" class="nav-link">ABOUT US</a>', '<a href="aboutus.html" class="nav-link">WHO WE ARE</a>')

    # Industries rename
    content = content.replace('INDUSTRIES <img src="assets/images/sthiros_arrow_btn.png"', 'WHO WE SERVE <img src="assets/images/sthiros_arrow_btn.png"')
    content = content.replace('<h2 class="mega-main-title">INDUSTRIES <img', '<h2 class="mega-main-title">WHO WE SERVE <img')

    # --- REORDER IN DESKTOP HEADER ---
    # We need to swap:
    # <li><a href="repository.html" target="_blank">THE REPOSITORY</a></li>
    # <li><a href="products.html" target="_blank">ORIQ</a></li>
    # WITH the entire INDUSTRIES (now WHO WE SERVE) mega-menu block.
    # The block ends right before <li><a href="contactus.html">CONTACT US</a></li>

    # Let's extract the repository and oriq lines
    repo_str1 = '<li><a href="repository.html" target="_blank">THE REPOSITORY</a></li>\n                <li><a href="products.html" target="_blank">ORIQ</a></li>'
    repo_str2 = '<li><a href="repository.html">THE REPOSITORY</a></li>\n                <li><a href="products.html">ORIQ</a></li>'

    if repo_str1 in content:
        repo_str = repo_str1
    elif repo_str2 in content:
        repo_str = repo_str2
    else:
        repo_str = None

    if repo_str:
        # Remove it from its current position
        content = content.replace(repo_str + '\n', '')
        content = content.replace(repo_str, '')

        # Now insert it right before the CONTACT US list item
        contact_str = '<li>\n                    <a href="contactus.html">CONTACT US</a>\n                </li>'
        if contact_str in content:
            content = content.replace(contact_str, repo_str + '\n                ' + contact_str)
        else:
            # Maybe it's one line
            contact_str2 = '<li><a href="contactus.html">CONTACT US</a></li>'
            if contact_str2 in content:
                content = content.replace(contact_str2, repo_str + '\n                ' + contact_str2)

    # --- REORDER IN MOBILE HEADER ---
    # Mobile nav
    m_repo_str1 = '<a href="repository.html" target="_blank" class="nav-link">THE REPOSITORY</a>\n                <a href="products.html" target="_blank" class="nav-link">ORIQ</a>'
    m_repo_str2 = '<a href="repository.html" class="nav-link">THE REPOSITORY</a>\n                <a href="products.html" class="nav-link">ORIQ</a>'
    
    if m_repo_str1 in content:
        m_repo_str = m_repo_str1
    elif m_repo_str2 in content:
        m_repo_str = m_repo_str2
    else:
        m_repo_str = None
        
    if m_repo_str:
        content = content.replace(m_repo_str + '\n', '')
        content = content.replace(m_repo_str, '')
        
        # Insert before CONTACT US mobile link
        m_contact = '<a href="contactus.html" class="nav-link">CONTACT US</a>'
        if m_contact in content:
            content = content.replace(m_contact, m_repo_str + '\n\n                ' + m_contact)

    # Write back if changed
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for filepath in glob.glob("*.html"):
    process_file(filepath)
