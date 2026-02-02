# Image Buttons - Developer Configuration Guide

Button image settings are **developer-level configuration** only. They are NOT exposed in the settings UI to end users.

## Quick Reference

### Enable/Disable Image Buttons

```html
<!-- Enable (default) -->
<switch-scanner use-image-button="true"></switch-scanner>

<!-- Disable (text mode) -->
<switch-scanner use-image-button="false"></switch-scanner>
```

### Change Button Color

```html
<!-- Blue (default) -->
<switch-scanner button-color="blue"></switch-scanner>

<!-- Green -->
<switch-scanner button-color="green"></switch-scanner>

<!-- Red -->
<switch-scanner button-color="red"></switch-scanner>

<!-- Yellow -->
<switch-scanner button-color="yellow"></switch-scanner>
```

### Use Custom Images

```html
<switch-scanner
    custom-button-normal="/assets/my-switch.png"
    custom-button-pressed="/assets/my-switch-down.png">
</switch-scanner>
```

### Combined Example

```html
<switch-scanner
    use-image-button="true"
    button-color="green"
    grid-size="64"
    scan-pattern="elimination"
    elimination-switch-count="4">
</switch-scanner>
```

## Configuration API

### AppConfig Interface

```typescript
interface AppConfig {
  // Button visualization (developer-only)
  useImageButton: boolean;      // Default: true
  buttonColor: 'blue' | 'green' | 'red' | 'yellow';  // Default: 'blue'
  customButtonImages: {
    normal?: string;  // Path to normal state image
    pressed?: string; // Path to pressed state image
  };
}
```

### Programmatic Configuration

```javascript
// Get scanner element
const scanner = document.querySelector('switch-scanner');

// Enable image buttons
scanner.config.useImageButton = true;

// Change color
scanner.config.buttonColor = 'green';

// Set custom images
scanner.config.customButtonImages = {
    normal: '/my-custom-switch.png',
    pressed: '/my-custom-switch-pressed.png'
};
```

## Built-in Image Paths

Images are located at `/public/switches/` (source) and copied to `dist/switches/` during build.

When accessing from the built JavaScript (in `dist/assets/`), use relative paths:

```
../switches/switch-blue.png
../switches/switch-blue-depressed.png
../switches/switch-green.png
../switches/switch-green-depressed.png
../switches/switch-red.png
../switches/switch-red-depressed.png
../switches/switch-yellow.png
../switches/switch-yellow-depressed.png
```

**Note:** For GitHub Pages deployment or other subdirectory deployments, always use relative paths (`../switches/`) rather than absolute paths (`/switches/`) to ensure correct resolution.

## Color Mapping

### Standard Mode
All buttons use `buttonColor` (same color for all actions)

### Elimination Mode
Each switch uses a predefined color (ignores `buttonColor`):
- Switch 1: Blue (top-left)
- Switch 2: Red (top-right)
- Switch 3: Green (bottom-left)
- Switch 4: Yellow (bottom-right)
- Switches 5-8: Pattern repeats

### Override with Custom Images
To use custom images for specific switches in elimination mode, you'd need to modify the `createButton()` method in `SwitchScannerElement.ts`.

## Common Use Cases

### Use Case 1: Default Setup
```html
<!-- Just use defaults (image buttons enabled, blue color) -->
<switch-scanner></switch-scanner>
```

### Use Case 2: Brand Color Match
```html
<!-- Match your brand color -->
<switch-scanner button-color="green"></switch-scanner>
```

### Use Case 3: Custom Accessibility Switches
```html
<!-- Use your own accessibility switch images -->
<switch-scanner
    custom-button-normal="/switches/big-red-button.png"
    custom-button-pressed="/switches/big-red-button-pressed.png">
</switch-scanner>
```

### Use Case 4: Development/Testing
```html
<!-- Use text buttons during development -->
<switch-scanner use-image-button="false"></switch-scanner>
```

### Use Case 5: Production Deployment
```html
<!-- Use image buttons in production -->
<switch-scanner
    use-image-button="true"
    button-color="blue"
    scan-pattern="elimination"
    elimination-switch-count="4">
</switch-scanner>
```

## Migration Guide

### From Text Buttons (Old)
```html
<switch-scanner grid-size="16"></switch-scanner>
```
Shows: Text buttons (if `useImageButton` was false)

### To Image Buttons (New Default)
```html
<switch-scanner grid-size="16"></switch-scanner>
```
Shows: Blue image buttons (default behavior)

### Explicit Text Mode
```html
<switch-scanner grid-size="16" use-image-button="false"></switch-scanner>
```
Shows: Text buttons (explicitly disabled)

## Why Developer-Only?

**Reasons button settings are not in the settings UI:**

1. **Implementation Detail** - Whether to use images or text is a design choice, not a user preference
2. **Asset Management** - Custom image paths require developer knowledge of file structure
3. **Branding Consistency** - Switch appearance should match the app's design system
4. **Simplified UX** - Settings UI focuses on functional options (timing, patterns, visualization)
5. **Less Confusion** - End users don't need to understand implementation details

## Troubleshooting

### Images Not Showing

**Check:**
1. Verify `use-image-button="true"` is set
2. Check browser console for 404 errors on `/switches/*.png`
3. Ensure images exist in `public/switches/` directory
4. Verify file permissions (readable by web server)

### Wrong Color

**Check:**
1. Verify `button-color` attribute value (must be: blue, green, red, yellow)
2. In elimination mode, colors are predefined (see "Color Mapping" above)
3. Clear browser cache
4. Check for custom image override

### Want to Revert to Text Buttons

**Solution:**
```html
<switch-scanner use-image-button="false"></switch-scanner>
```

## File Locations

- **Source Images:** `public/switches/*.png`
- **Component Code:** `src/SwitchScannerElement.ts` (createButton method)
- **Config:** `src/ConfigManager.ts` (AppConfig interface)
- **Settings UI:** `src/SettingsUI.ts` (NO button settings - developer-only)

## Related Documentation

- **IMAGE_BUTTONS_GUIDE.md** - Complete user guide
- **IMAGE_BUTTONS_SUMMARY.md** - Implementation summary
- **demo-image-buttons.html** - Interactive demo

---

**Last Updated:** 2025-02-02
**Status:** ✅ Developer configuration only (not in settings UI)
