import { theme } from '@/constants/theme';

describe('theme constants', () => {
  describe('colors', () => {
    it('has all required color properties', () => {
      expect(theme.colors).toHaveProperty('background');
      expect(theme.colors).toHaveProperty('surface');
      expect(theme.colors).toHaveProperty('primary');
      expect(theme.colors).toHaveProperty('secondary');
      expect(theme.colors).toHaveProperty('accent');
      expect(theme.colors).toHaveProperty('text');
      expect(theme.colors).toHaveProperty('textSecondary');
      expect(theme.colors).toHaveProperty('border');
    });

    it('all colors are valid hex strings', () => {
      const hexRegex = /^#[0-9A-F]{6}$/i;
      Object.values(theme.colors).forEach((color) => {
        expect(hexRegex.test(color)).toBe(true);
      });
    });

    it('background color is defined', () => {
      expect(theme.colors.background).toBe('#FFF8F0');
    });

    it('primary color is defined', () => {
      expect(theme.colors.primary).toBe('#FF6B35');
    });

    it('secondary color is defined', () => {
      expect(theme.colors.secondary).toBe('#4ECDC4');
    });

    it('text colors are defined', () => {
      expect(theme.colors.text).toBe('#2D2D2D');
      expect(theme.colors.textSecondary).toBe('#7A7A7A');
    });
  });

  describe('fontSizes', () => {
    it('has all required font size properties', () => {
      expect(theme.fontSizes).toHaveProperty('heading');
      expect(theme.fontSizes).toHaveProperty('subheading');
      expect(theme.fontSizes).toHaveProperty('body');
      expect(theme.fontSizes).toHaveProperty('caption');
    });

    it('font sizes are positive numbers', () => {
      Object.values(theme.fontSizes).forEach((size) => {
        expect(typeof size).toBe('number');
        expect(size).toBeGreaterThan(0);
      });
    });

    it('font sizes are in reasonable range', () => {
      expect(theme.fontSizes.heading).toBe(32);
      expect(theme.fontSizes.subheading).toBe(22);
      expect(theme.fontSizes.body).toBe(18);
      expect(theme.fontSizes.caption).toBe(14);
    });

    it('heading is larger than subheading', () => {
      expect(theme.fontSizes.heading).toBeGreaterThan(
        theme.fontSizes.subheading
      );
    });

    it('caption is smallest font size', () => {
      const sizes = Object.values(theme.fontSizes);
      const minSize = Math.min(...sizes);
      expect(minSize).toBe(theme.fontSizes.caption);
    });
  });

  describe('fontWeights', () => {
    it('has all required font weight properties', () => {
      expect(theme.fontWeights).toHaveProperty('regular');
      expect(theme.fontWeights).toHaveProperty('bold');
    });

    it('font weights are valid string values', () => {
      expect(theme.fontWeights.regular).toBe('400');
      expect(theme.fontWeights.bold).toBe('700');
    });

    it('bold weight is heavier than regular', () => {
      const boldVal = parseInt(theme.fontWeights.bold);
      const regularVal = parseInt(theme.fontWeights.regular);
      expect(boldVal).toBeGreaterThan(regularVal);
    });
  });

  describe('radii (border radius)', () => {
    it('has all required border radius properties', () => {
      expect(theme.radii).toHaveProperty('sm');
      expect(theme.radii).toHaveProperty('md');
      expect(theme.radii).toHaveProperty('lg');
      expect(theme.radii).toHaveProperty('full');
    });

    it('border radii are positive numbers', () => {
      Object.values(theme.radii).forEach((radius) => {
        expect(typeof radius).toBe('number');
        expect(radius).toBeGreaterThan(0);
      });
    });

    it('border radii are in ascending order', () => {
      expect(theme.radii.sm).toBe(8);
      expect(theme.radii.md).toBe(16);
      expect(theme.radii.lg).toBe(24);
      expect(theme.radii.full).toBe(9999);
    });

    it('full radius is very large for circular effect', () => {
      expect(theme.radii.full).toBeGreaterThan(100);
    });
  });

  describe('spacing', () => {
    it('has all required spacing properties', () => {
      expect(theme.spacing).toHaveProperty('xs');
      expect(theme.spacing).toHaveProperty('sm');
      expect(theme.spacing).toHaveProperty('md');
      expect(theme.spacing).toHaveProperty('lg');
      expect(theme.spacing).toHaveProperty('xl');
    });

    it('spacing values are positive numbers', () => {
      Object.values(theme.spacing).forEach((space) => {
        expect(typeof space).toBe('number');
        expect(space).toBeGreaterThan(0);
      });
    });

    it('spacing values are in ascending order', () => {
      expect(theme.spacing.xs).toBe(4);
      expect(theme.spacing.sm).toBe(8);
      expect(theme.spacing.md).toBe(16);
      expect(theme.spacing.lg).toBe(24);
      expect(theme.spacing.xl).toBe(40);
    });

    it('spacing follows consistent scale', () => {
      expect(theme.spacing.sm).toBe(theme.spacing.xs * 2);
      expect(theme.spacing.md).toBe(theme.spacing.sm * 2);
    });

    it('xl spacing is largest', () => {
      const spacings = Object.values(theme.spacing);
      const maxSpacing = Math.max(...spacings);
      expect(maxSpacing).toBe(theme.spacing.xl);
    });
  });

  describe('theme object', () => {
    it('theme is an object', () => {
      expect(typeof theme).toBe('object');
      expect(theme).not.toBeNull();
    });

    it('all theme sections are defined', () => {
      expect(theme.colors).toBeDefined();
      expect(theme.fontSizes).toBeDefined();
      expect(theme.fontWeights).toBeDefined();
      expect(theme.radii).toBeDefined();
      expect(theme.spacing).toBeDefined();
    });

    it('theme has expected number of sections', () => {
      const sections = Object.keys(theme);
      expect(sections.length).toBe(5);
    });
  });
});
