const fs = require('fs');
const html = fs.readFileSync('services.html', 'utf8');
const headerMatch = html.match(/<!-- ═══════════════ SITE HEADER ═══════════════ -->[\s\S]*?<!-- services hero banner section -->/);
const footerMatch = html.match(/<!-- ═══════════════ FOOTER ═══════════════ -->[\s\S]*?<\/body>/);
const header = headerMatch ? headerMatch[0].replace('<!-- services hero banner section -->', '').trim() : '';
const footer = footerMatch ? footerMatch[0].replace('</body>', '').trim() : '';

let inner = fs.readFileSync('servicesinner.html', 'utf8');
inner = inner.replace('<body>', '<body class="loading">\n\n' + header + '\n');
inner = inner.replace(/<\/body>[\s\S]*?<\/html>/, footer + '\n</body>\n</html>');
fs.writeFileSync('servicesinner.html', inner);
