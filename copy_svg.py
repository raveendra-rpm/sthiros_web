import sys

def main():
    # Read servicesinner.html
    with open('servicesinner.html', 'r', encoding='utf-8') as f:
        content = f.read()

    css_to_insert = """
        #herosvgtrack {
            margin-top: -5rem;
            position: relative;
            z-index: 5;
            width: 100%;
            overflow: visible;
        }

        .herosvgtracks {
            width: 50%;
            margin-left: 28px;
        }

        #herosvgtrack svg {
            width: 100%;
            height: auto;
            display: block;
            overflow: visible;
        }
"""

    # Extract HTML block
    html_start_str = '    <!-- hero bottom svg section -->\n    <section id="herosvgtrack">\n        <div class="herosvgtracks">\n'
    html_end_str = '        <p class="herotrackspara">\n'
    html_start = content.find(html_start_str)
    html_end = content.find(html_end_str)
    
    if html_start == -1 or html_end == -1:
        print("Could not find HTML block!")
        sys.exit(1)
        
    html_code = content[html_start:html_end] + '    </section>\n'

    # Read industry.html
    with open('industry.html', 'r', encoding='utf-8') as f:
        ind_content = f.read()

    # Insert CSS into industry.html before </style>
    ind_content = ind_content.replace('</style>', css_to_insert + '    </style>')

    # Insert HTML into industry.html before </body>
    ind_content = ind_content.replace('</body>', html_code + '\n</body>')

    # Write back to industry.html
    with open('industry.html', 'w', encoding='utf-8') as f:
        f.write(ind_content)

    print('Success')

if __name__ == '__main__':
    main()
