import os
import re
import glob

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Rename ABOUT US -> WHO WE ARE (Desktop Nav)
    content = re.sub(
        r'<a href="aboutus\.html">ABOUT US</a>',
        r'<a href="aboutus.html">WHO WE ARE</a>',
        content
    )
    # Rename ABOUT US -> WHO WE ARE (Mobile Nav)
    content = re.sub(
        r'<a href="aboutus\.html" class="nav-link">ABOUT US</a>',
        r'<a href="aboutus.html" class="nav-link">WHO WE ARE</a>',
        content
    )

    # Rename INDUSTRIES -> WHO WE SERVE (Desktop Mega Menu)
    content = re.sub(
        r'<a href="#">INDUSTRIES <img',
        r'<a href="#">WHO WE SERVE <img',
        content
    )
    content = re.sub(
        r'<h2 class="mega-main-title">INDUSTRIES <img',
        r'<h2 class="mega-main-title">WHO WE SERVE <img',
        content
    )

    # Rename INDUSTRIES -> WHO WE SERVE (Mobile Dropdown)
    content = re.sub(
        r'<a href="#" class="nav-link dropdown-toggle">INDUSTRIES <img',
        r'<a href="#" class="nav-link dropdown-toggle">WHO WE SERVE <img',
        content
    )

    # Reorder Desktop Nav
    # Match THE REPOSITORY and ORIQ
    repo_oriq_regex = re.compile(
        r'(\s*<li>\s*<a href="repository\.html"[^>]*>THE REPOSITORY</a>\s*</li>\s*<li>\s*<a href="products\.html"[^>]*>ORIQ</a>\s*</li>)',
        re.DOTALL
    )
    # Match INDUSTRIES mega menu (now WHO WE SERVE)
    serve_regex = re.compile(
        r'(\s*<li class="has-mega-menu">\s*<a href="#">WHO WE SERVE <img.*?<!-- Card 3: AI -->.*?\s*</li>)',
        re.DOTALL
    )

    # Wait, instead of complicated regex for the whole block, let's just find the blocks and swap them.
    # Actually, the INDUSTRIES mega menu doesn't have "Card 3: AI" inside it, that's in the page body!
    pass

