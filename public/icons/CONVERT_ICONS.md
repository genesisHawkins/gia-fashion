# How to Convert SVG to PNG Icons

## Method 1: Online Converter (Easiest)

1. Go to: https://cloudconvert.com/svg-to-png
2. Upload `icon-template.svg`
3. Set width to 512px (height will auto-adjust)
4. Download and save as `icon-512.png`
5. Repeat with width 192px and save as `icon-192.png`

## Method 2: Using Figma (Recommended for customization)

1. Open Figma (https://figma.com)
2. Create new file
3. Import `icon-template.svg`
4. Customize colors, text, or design as needed
5. Export as PNG:
   - Select the icon
   - Right panel → Export
   - Add export: 512w PNG
   - Add export: 192w PNG
   - Export both

## Method 3: Using Inkscape (Free Desktop App)

1. Download Inkscape: https://inkscape.org/
2. Open `icon-template.svg`
3. File → Export PNG Image
4. Set width to 512px
5. Export as `icon-512.png`
6. Repeat with 192px for `icon-192.png`

## Method 4: Using ImageMagick (Command Line)

If you have ImageMagick installed:

```bash
# Convert to 512x512
magick icon-template.svg -resize 512x512 icon-512.png

# Convert to 192x192
magick icon-template.svg -resize 192x192 icon-192.png
```

## Method 5: Using Node.js (if you have sharp installed)

```bash
npm install sharp
```

Create a file `convert-icons.js`:
```javascript
const sharp = require('sharp');
const fs = require('fs');

const svg = fs.readFileSync('icon-template.svg');

// 512x512
sharp(svg)
  .resize(512, 512)
  .png()
  .toFile('icon-512.png');

// 192x192
sharp(svg)
  .resize(192, 192)
  .png()
  .toFile('icon-192.png');
```

Run: `node convert-icons.js`

## Quick Test:

After creating the icons, test them:

1. Place both PNG files in `public/icons/`
2. Restart your dev server
3. Open browser DevTools → Application → Manifest
4. Check if icons load correctly
5. Try "Add to Home Screen" on mobile

## Customization Tips:

Before converting, you can edit `icon-template.svg` to:
- Change the letter "G" to a different design
- Adjust colors in the gradient
- Add more sparkles or fashion elements
- Change the background shape or color

The current template is a simple starting point!
