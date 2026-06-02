export const theme = {
  colors: {
    background: '#FFF8F0',
    surface: '#FFFFFF',
    primary: '#FF6B35',
    secondary: '#4ECDC4',
    accent: '#FFE66D',
    text: '#2D2D2D',
    textSecondary: '#7A7A7A',
    border: '#F0E6D8',
  },
  fontSizes: {
    heading: 32,
    subheading: 22,
    body: 18,
    caption: 14,
  },
  fontWeights: {
    regular: '400' as const,
    bold: '700' as const,
  },
  radii: {
    sm: 8,
    md: 16,
    lg: 24,
    full: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 40,
  },
} as const;
