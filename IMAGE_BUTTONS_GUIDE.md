# Image Buttons Feature - Complete Guide

## Overview

The switch scanner now supports **image-based buttons** instead of plain text buttons. This provides a more realistic and engaging experience, especially for users who use physical switches in their daily lives.

## Features

✅ **Built-in Switch Images** - 4 colors (blue, green, red, yellow)
✅ **Two States** - Normal and depressed (pressed) states
✅ **Custom Image Support** - Use your own switch images
✅ **Configurable** - Easy to enable/disable via settings
✅ **Elimination Mode Support** - Works with multi-switch elimination scanning

## Quick Start

### Using Built-in Switches

```html
<switch-scanner
    use-image-button="true"
    button-color="blue">
</switch-scanner>
```

Available colors:
- `blue` (default)
- `green`
- `red`
- `yellow`

### Using Custom Images

```html
<switch-scanner
    use-image-button="true"
    custom-button-normal="/path/to/my-switch-normal.png"
    custom-button-pressed="/path/to/my-switch-pressed.png">
</switch-scanner>
```

## Configuration Options

### via HTML Attributes (Recommended)

```html
<switch-scanner
    use-image-button="true"
    button-color="green">
</switch-scanner>
```

### via JavaScript

```javascript
const scanner = document.querySelector('switch-scanner');
scanner.config = {
    useImageButton: true,
    buttonColor: 'red',
    customButtonImages: {
        normal: '../switches/switch-blue.png',
        pressed: '../switches/switch-blue-depressed.png'
    }
};
```

### Note: Developer Configuration Only

Button settings are **developer-level configuration**, not shown in the settings UI to end users. Configure them via HTML attributes or JavaScript when embedding the scanner component.

## Image Specifications

### Built-in Images

Located in `/public/switches/`:
```
switches/
├── switch-blue.png                (277KB)
├── switch-blue-depressed.png      (399KB)
├── switch-green.png               (290KB)
├── switch-green-depressed.png     (247KB)
├── switch-red.png                 (295KB)
├── switch-red-depressed.png       (486KB)
├── switch-yellow.png              (299KB)
└── switch-yellow-depressed.png    (444KB)
```

### Custom Image Guidelines

**Recommended Specifications:**
- **Format:** PNG (supports transparency)
- **Size:** 200x200px to 400x400px
- **Resolution:** 72 DPI (web) to 150 DPI (print)
- **Background:** Transparent PNG preferred
- **State:** Two images needed (normal and pressed)

**Tips:**
- Keep file size under 500KB each for fast loading
- Use lossless compression for PNGs
- Test both normal and depressed states
- Ensure good contrast between states

## Behavior

### Pressed State

The depressed image is shown:
- **On mousedown** - When user presses the button
- **Until mouseup** - While holding the button down
- **Resets on mouseleave** - If cursor leaves button while pressed

This provides realistic tactile feedback!

### Keyboard Users

Keyboard users (Tab + Enter/Space) still see visual feedback through the `:active` CSS state, even with image buttons.

## Examples

### Example 1: Blue Switches (Default)

```html
<!DOCTYPE html>
<html>
<head>
    <script type="module" src="/src/main.ts"></script>
</head>
<body>
    <switch-scanner
        use-image-button="true"
        button-color="blue"
        grid-size="16"
        scan-pattern="linear">
    </switch-scanner>
</body>
</html>
```

### Example 2: Green Switches with Keyboard

```html
<switch-scanner
    use-image-button="true"
    button-color="green"
    grid-content="keyboard"
    grid-size="64">
</switch-scanner>
```

### Example 3: Custom Branded Switches

```html
<switch-scanner
    use-image-button="true"
    custom-button-normal="/assets/our-logo-switch.png"
    custom-button-pressed="/assets/our-logo-switch-down.png"
    scan-pattern="elimination"
    elimination-switch-count="4">
</switch-scanner>
```

### Example 4: Elimination Scanning with Colored Switches

```html
<switch-scanner
    use-image-button="true"
    button-color="red"
    scan-pattern="elimination"
    elimination-switch-count="4"
    scan-rate="1500">
</switch-scanner>
```

This will show 4 red switch buttons, each representing one quadrant.

## Accessibility

Image buttons maintain full accessibility:

✅ **Alt Text** - Images have descriptive alt text
✅ **Keyboard Navigation** - Tab, Enter, Space still work
✅ **Screen Reader Support** - Action names are announced
✅ **Visual Focus** - Focus rings still visible
✅ **ARIA Labels** - Proper ARIA attributes maintained

### Screen Reader Example

```
[Image: Switch 1] - button
[Image: Switch 2] - button
[Image: Reset] - button
```

The action is still announced when buttons are activated.

## Browser Compatibility

✅ Chrome/Edge 90+
✅ Firefox 88+
✅ Safari 14+
✅ Mobile browsers (iOS Safari, Chrome Android)

### Fallback

If images fail to load, the buttons still work (invisible but functional).

## Performance

- **File Size:** ~300KB per switch color (2 states)
- **Loading:** Images load asynchronously
- **Caching:** Browser caching applies
- **Lazy Loading:** Only loaded when `useImageButton=true`

**Tips:**
1. Use CDN for production if hosting custom images
2. Preload critical images if needed
3. Consider image optimization (WebP format)

## Troubleshooting

### Images Not Showing

**Problem:** Buttons are blank or show alt text

**Solutions:**
1. Check browser console for 404 errors
2. Verify image paths are correct (relative to `/public/`)
3. Ensure `useImageButton="true"` is set
4. Check image file permissions

### Images Not Changing on Press

**Problem:** Depressed state not showing

**Solutions:**
1. Verify both normal and pressed images exist
2. Check JavaScript console for errors
3. Test in different browser
4. Ensure no CSS `pointer-events: none` on images

### Wrong Color Showing

**Problem:** Different color than expected

**Solutions:**
1. Check `button-color` attribute spelling
2. Clear browser cache
3. Verify color is one of: blue, green, red, yellow
4. Check if custom images override built-in

### Performance Issues

**Problem:** Slow page load

**Solutions:**
1. Optimize image sizes (compress PNGs)
2. Consider WebP format instead of PNG
3. Use lazy loading for images
4. Host images on CDN

## Migration from Text Buttons

### Before (Text Buttons)

```html
<switch-scanner
    grid-size="16"
    scan-pattern="linear">
</switch-scanner>
```

Shows: `[Select (1)] [Step (2)] [Reset (R)]`

### After (Image Buttons)

```html
<switch-scanner
    use-image-button="true"
    button-color="blue"
    grid-size="16"
    scan-pattern="linear">
</switch-scanner>
```

Shows: 🖼️ [Blue switch] [Blue switch] [Blue switch]

### Disabling Image Buttons

```html
<switch-scanner
    use-image-button="false"
    grid-size="16">
</switch-scanner>
```

Or simply remove the attribute (defaults to `false`).

## Advanced Usage

### Programmatic Control

```javascript
const scanner = document.querySelector('switch-scanner');

// Enable image buttons
scanner.config.useImageButton = true;

// Change color dynamically
scanner.config.buttonColor = 'green';

// Use custom images
scanner.config.customButtonImages = {
    normal: '/my-switch.png',
    pressed: '/my-switch-down.png'
};

// Disable image buttons
scanner.config.useImageButton = false;
```

### Detecting Image Button Support

```javascript
const scanner = document.querySelector('switch-scanner');
const hasImageButtons = scanner.config.useImageButton;

if (hasImageButtons) {
    console.log('Using image buttons');
    // Adjust layout for larger buttons
} else {
    console.log('Using text buttons');
}
```

### Custom Image Loading Handler

```javascript
const scanner = document.querySelector('switch-scanner');

// Listen for config changes
scanner.addEventListener('configChanged', (e) => {
    if (e.detail.useImageButton) {
        console.log('Image buttons enabled');

        // Preload images
        const img = new Image();
        img.src = '../switches/switch-blue.png';
        img.onload = () => console.log('Button image loaded');
    }
});
```

## CSS Customization

While image buttons use actual images, you can still adjust layout:

```css
/* Make image buttons larger */
.controls button {
    min-width: 120px !important;
    min-height: 120px !important;
}

/* Adjust spacing between buttons */
.controls {
    gap: 20px !important;
}

/* Add custom border around images */
.controls button img {
    border: 2px solid #333;
    border-radius: 8px;
}
```

## Future Enhancements

Planned features:
- [ ] Animated transitions between states
- [ ] Additional built-in colors (purple, orange, etc.)
- [ ] SVG vector switch support
- [ ] Switch sound effects integration
- [ ] Theme-based auto-selection

## Resources

- **Built-in Images:** `/public/switches/`
- **Demo:** See main scanner with `useImageButton=true`
- **Config:** `src/ConfigManager.ts` (AppConfig interface)
- **Rendering:** `src/SwitchScannerElement.ts` (createButton method)
- **Settings:** `src/SettingsUI.ts` (Button Settings section)

## Support

For issues or questions:
1. Check browser console for errors
2. Verify image paths and permissions
3. Test in different browser
4. Review this guide's troubleshooting section
5. Check GitHub Issues for known problems

---

**Version:** 1.0.0
**Last Updated:** 2025-02-02
**Feature Status:** ✅ Production Ready
