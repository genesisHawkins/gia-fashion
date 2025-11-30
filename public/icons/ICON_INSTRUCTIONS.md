# PWA Icon Instructions

You need to create two icon files for the Progressive Web App to work properly:

## Required Icons:

1. **icon-192.png** (192x192 pixels)
2. **icon-512.png** (512x512 pixels)

## Design Guidelines:

### Icon Design:
- **Theme**: Fashion/Style related
- **Colors**: Use the app's color palette:
  - Primary Gold: `#C9A961`
  - Secondary Beige: `#E8DCC4`
  - Dark: `#2B2B2B`
  - Background: `#FAF9F6`

### Suggested Icon Ideas:
1. **Option 1**: Stylized "G" letter with sparkles ✨
2. **Option 2**: Hanger icon with AI elements
3. **Option 3**: Fashion mannequin silhouette
4. **Option 4**: Dress/outfit icon with modern design

### Technical Requirements:
- Format: PNG with transparency
- Safe area: Keep important elements within 80% of the canvas
- Background: Can be transparent or use app's background color
- Style: Modern, clean, recognizable at small sizes

## Quick Creation Options:

### Option 1: Use Figma/Canva
1. Create a 512x512 canvas
2. Design your icon
3. Export as PNG
4. Resize to 192x192 for the smaller version

### Option 2: Use AI Image Generator
Prompt example:
```
"Create a minimalist app icon for a fashion AI assistant named Gia. 
Use gold (#C9A961) and beige (#E8DCC4) colors. 
Include sparkles or fashion elements. 
Modern, clean design. 512x512 pixels."
```

### Option 3: Use Icon Generator Tools
- https://realfavicongenerator.net/
- https://www.favicon-generator.org/
- https://favicon.io/

## File Placement:
```
public/
  icons/
    icon-192.png  ← Place here
    icon-512.png  ← Place here
```

## Testing:
After creating the icons:
1. Clear browser cache
2. Reload the app
3. Check browser console for any icon loading errors
4. Test "Add to Home Screen" functionality on mobile

## Temporary Placeholder:
If you need a quick placeholder, you can:
1. Take a screenshot of the Gia avatar from the app
2. Crop it to square
3. Resize to 192x192 and 512x512
4. Use until you create proper icons
