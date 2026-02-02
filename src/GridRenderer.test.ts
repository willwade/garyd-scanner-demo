import { describe, it, expect, beforeEach } from 'vitest';
import { GridRenderer, GridItem } from './GridRenderer';

describe('GridRenderer - Highlight Visualization', () => {
  let container: HTMLElement;
  let renderer: GridRenderer;
  let items: GridItem[];

  beforeEach(() => {
    // Create a fresh container for each test
    container = document.createElement('div');
    document.body.appendChild(container);

    renderer = new GridRenderer(container);
    items = Array.from({ length: 9 }, (_, i) => ({
      id: `item-${i}`,
      label: `${i}`
    }));
    renderer.render(items, 3);
  });

  describe('updateHighlightStyles', () => {
    it('should set CSS custom properties for border width', () => {
      renderer.updateHighlightStyles({
        highlightBorderWidth: 8,
        highlightBorderColor: '#FF0000',
        highlightScale: 1.0,
        highlightOpacity: 1.0,
        highlightAnimation: false
      });

      expect(container.style.getPropertyValue('--focus-border-width')).toBe('8px');
    });

    it('should set CSS custom properties for border color', () => {
      renderer.updateHighlightStyles({
        highlightBorderWidth: 4,
        highlightBorderColor: '#00FF00',
        highlightScale: 1.0,
        highlightOpacity: 1.0,
        highlightAnimation: false
      });

      expect(container.style.getPropertyValue('--focus-color')).toBe('#00FF00');
    });

    it('should set CSS custom properties for scale', () => {
      renderer.updateHighlightStyles({
        highlightBorderWidth: 4,
        highlightBorderColor: '#FF9800',
        highlightScale: 1.3,
        highlightOpacity: 1.0,
        highlightAnimation: false
      });

      expect(container.style.getPropertyValue('--focus-scale')).toBe('1.3');
    });

    it('should set CSS custom properties for opacity', () => {
      renderer.updateHighlightStyles({
        highlightBorderWidth: 4,
        highlightBorderColor: '#FF9800',
        highlightScale: 1.0,
        highlightOpacity: 0.6,
        highlightAnimation: false
      });

      expect(container.style.getPropertyValue('--focus-opacity')).toBe('0.6');
    });

    it('should set CSS custom property for animation', () => {
      renderer.updateHighlightStyles({
        highlightBorderWidth: 4,
        highlightBorderColor: '#FF9800',
        highlightScale: 1.0,
        highlightOpacity: 1.0,
        highlightAnimation: true
      });

      expect(container.style.getPropertyValue('--focus-animation')).toBe('pulse');
    });

    it('should set animation to none when disabled', () => {
      renderer.updateHighlightStyles({
        highlightBorderWidth: 4,
        highlightBorderColor: '#FF9800',
        highlightScale: 1.0,
        highlightOpacity: 1.0,
        highlightAnimation: false
      });

      expect(container.style.getPropertyValue('--focus-animation')).toBe('none');
    });
  });

  describe('setFocus with config', () => {
    it('should apply animation class when animation is enabled', () => {
      renderer.setFocus([0], {
        highlightBorderWidth: 4,
        highlightBorderColor: '#FF9800',
        highlightScale: 1.0,
        highlightOpacity: 1.0,
        highlightAnimation: true
      });

      const element = renderer.getElement(0);
      expect(element?.classList.contains('animate-pulse')).toBe(true);
    });

    it('should not apply animation class when animation is disabled', () => {
      renderer.setFocus([0], {
        highlightBorderWidth: 4,
        highlightBorderColor: '#FF9800',
        highlightScale: 1.0,
        highlightOpacity: 1.0,
        highlightAnimation: false
      });

      const element = renderer.getElement(0);
      expect(element?.classList.contains('animate-pulse')).toBe(false);
    });

    it('should update styles when config is provided', () => {
      renderer.setFocus([0], {
        highlightBorderWidth: 6,
        highlightBorderColor: '#0000FF',
        highlightScale: 1.2,
        highlightOpacity: 0.8,
        highlightAnimation: false
      });

      expect(container.style.getPropertyValue('--focus-border-width')).toBe('6px');
      expect(container.style.getPropertyValue('--focus-color')).toBe('#0000FF');
      expect(container.style.getPropertyValue('--focus-scale')).toBe('1.2');
      expect(container.style.getPropertyValue('--focus-opacity')).toBe('0.8');
    });

    it('should clear focus from all elements before applying new focus', () => {
      renderer.setFocus([0, 1, 2]);
      expect(renderer.getElement(0)?.classList.contains('scan-focus')).toBe(true);
      expect(renderer.getElement(1)?.classList.contains('scan-focus')).toBe(true);

      renderer.setFocus([3]);

      expect(renderer.getElement(0)?.classList.contains('scan-focus')).toBe(false);
      expect(renderer.getElement(1)?.classList.contains('scan-focus')).toBe(false);
      expect(renderer.getElement(3)?.classList.contains('scan-focus')).toBe(true);
    });

    it('should remove animation class when updating focus', () => {
      renderer.setFocus([0], {
        highlightBorderWidth: 4,
        highlightBorderColor: '#FF9800',
        highlightScale: 1.0,
        highlightOpacity: 1.0,
        highlightAnimation: true
      });

      expect(renderer.getElement(0)?.classList.contains('animate-pulse')).toBe(true);

      // Focus on different element without animation
      renderer.setFocus([1], {
        highlightBorderWidth: 4,
        highlightBorderColor: '#FF9800',
        highlightScale: 1.0,
        highlightOpacity: 1.0,
        highlightAnimation: false
      });

      expect(renderer.getElement(0)?.classList.contains('animate-pulse')).toBe(false);
      expect(renderer.getElement(1)?.classList.contains('animate-pulse')).toBe(false);
    });
  });

  describe('Compatibility with other styles', () => {
    it('should not interfere with backgroundColor', () => {
      const element = renderer.getElement(0);
      element?.style.setProperty('background-color', '#FF0000');

      renderer.setFocus([0], {
        highlightBorderWidth: 4,
        highlightBorderColor: '#00FF00',
        highlightScale: 1.2,
        highlightOpacity: 0.8,
        highlightAnimation: false
      });

      // Background color should be preserved
      expect(element?.style.backgroundColor).toBe('rgb(255, 0, 0)');
      // Focus class should be applied
      expect(element?.classList.contains('scan-focus')).toBe(true);
    });

    it('should not interfere with boxShadow', () => {
      const element = renderer.getElement(0);
      element?.style.setProperty('box-shadow', '0 0 10px #FF0000');

      renderer.setFocus([0], {
        highlightBorderWidth: 4,
        highlightBorderColor: '#00FF00',
        highlightScale: 1.2,
        highlightOpacity: 0.8,
        highlightAnimation: false
      });

      // Box shadow should be preserved
      expect(element?.style.boxShadow).toBe('0 0 10px #FF0000');
      // Focus class should be applied
      expect(element?.classList.contains('scan-focus')).toBe(true);
    });
  });
});
