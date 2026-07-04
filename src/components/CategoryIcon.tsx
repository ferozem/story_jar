import Svg, { Path, Rect } from 'react-native-svg';
import { StoryCategory } from '@/types/story';

/**
 * Single-color line icon per virtue. Paths are the ones signed off in the
 * design mock — one consistent stroke style across all nine categories.
 */
const ICONS: Record<StoryCategory, string[]> = {
  'Honesty & Trust': [
    'M12 2.8l6.5 2.6v4.4c0 4.2-2.8 7.6-6.5 9.4-3.7-1.8-6.5-5.2-6.5-9.4V5.4L12 2.8z',
    'M9 11.6l2.2 2.2L15.2 9',
  ],
  'Kindness & Compassion': [
    'M12 20.5C6.9 16.9 3.5 13.6 3.5 9.7A3.7 3.7 0 0 1 12 7.2 3.7 3.7 0 0 1 20.5 9.7c0 3.9-3.4 7.2-8.5 10.8z',
  ],
  'Humility & Service': [
    'M12 21v-8',
    'M12 13c0-3.6-2.7-5.4-7.2-5.4C4.8 11.2 7.5 13 12 13z',
    'M12 11.5c0-3.6 2.7-5.4 7.2-5.4C19.2 9.7 16.5 11.5 12 11.5z',
  ],
  'Forgiveness': [
    'M5 19C9 16.5 11.8 12.5 12.8 6.5',
    'M12.8 6.5c1.6-.4 3-.1 4.1.9-1 1.4-2.3 2-4 1.6z',
    'M11.4 10.6c1.5-.5 2.9-.3 4 .6-.9 1.4-2.1 2-3.7 1.7z',
    'M10 14.4c1.4-.6 2.8-.5 3.9.3-.8 1.3-2 2-3.5 1.9z',
  ],
  'Fairness': [
    'M12 4v16',
    'M8 20h8',
    'M5 7l7-1.6L19 7',
    'M5 7L2.8 12.2a2.8 2.8 0 0 0 4.4 0L5 7z',
    'M19 7l-2.2 5.2a2.8 2.8 0 0 0 4.4 0L19 7z',
  ],
  'Patience': [
    'M6.5 3.5h11M6.5 20.5h11',
    'M7.5 3.5c0 3.8 3.4 4.9 4.5 6 1.1-1.1 4.5-2.2 4.5-6',
    'M7.5 20.5c0-3.8 3.4-4.9 4.5-6 1.1 1.1 4.5 2.2 4.5 6',
  ],
  'Sharing & Generosity': [
    'M5 13v7.5h14V13',
    'M12 8.5v12',
    'M12 8.5C11 6 9.5 4 8 4.6 6.6 5.2 7.6 8 12 8.5z',
    'M12 8.5C13 6 14.5 4 16 4.6 17.4 5.2 16.4 8 12 8.5z',
  ],
  'Courage': [
    'M12 21.5c3.6 0 6.3-2.5 6.3-6.3 0-3.6-2.7-5.4-3.6-8.1-.5 1.8-1.8 2.7-2.7 2.7.5-2.7-.9-4.5-2.7-5.4.5 2.7-.9 3.6-1.8 5.4-.6 1.2-.9 2.4-.9 3.6 0 3.8 2.7 8.1 5.4 8.1z',
  ],
  'Gratitude & Contentment': [
    'M11 3.5l1.6 3.8 3.8 1.6-3.8 1.6L11 14.3 9.4 10.5 5.6 8.9l3.8-1.6z',
    'M17.5 14l.9 2 2 .9-2 .9-.9 2-.9-2-2-.9 2-.9z',
  ],
};

// Sharing's gift box also needs a rounded rect (the lid) which Path can't express cleanly.
const RECTS: Partial<Record<StoryCategory, { x: number; y: number; w: number; h: number; rx: number }>> = {
  'Sharing & Generosity': { x: 3.5, y: 8.5, w: 17, h: 4.5, rx: 1 },
};

interface Props {
  category: StoryCategory;
  size?: number;
  color: string;
}

export function CategoryIcon({ category, size = 24, color }: Props) {
  const rect = RECTS[category];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {rect && (
        <Rect
          x={rect.x}
          y={rect.y}
          width={rect.w}
          height={rect.h}
          rx={rect.rx}
          stroke={color}
          strokeWidth={1.9}
        />
      )}
      {ICONS[category].map((d, i) => (
        <Path
          key={i}
          d={d}
          stroke={color}
          strokeWidth={1.9}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </Svg>
  );
}
