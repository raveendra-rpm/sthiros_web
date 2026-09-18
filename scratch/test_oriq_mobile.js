const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: "new"
    });
    
    // Mobile Viewport (iPhone 15 Pro size roughly)
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 });
    
    await page.goto('http://localhost:8000/oriq.html');
    
    // Wait for load
    await new Promise(r => setTimeout(r, 2000));
    
    // Take screenshot of Dark Mode
    await page.screenshot({ path: 'oriq_mobile_dark.png' });
    
    // Switch to Light Mode
    await page.evaluate(() => {
        document.body.classList.add('light-mode');
    });
    
    await new Promise(r => setTimeout(r, 500));
    
    // Take screenshot of Light Mode
    await page.screenshot({ path: 'oriq_mobile_light.png' });
    
    await browser.close();
    console.log("Screenshots saved: oriq_mobile_dark.png, oriq_mobile_light.png");
})();
