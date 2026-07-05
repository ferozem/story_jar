import { StoryCategory } from '@/types/story';

export type CategoryHeroArtSet = 'soft' | 'vibrant';

export const activeCategoryHeroArtSet: CategoryHeroArtSet = 'vibrant';

export const categoryHeroArtSets: Record<CategoryHeroArtSet, Record<StoryCategory, number>> = {
  soft: {
    'Honesty & Trust': require('@/assets/decorative/category-heroes/honesty-trust.png'),
    'Humility & Service': require('@/assets/decorative/category-heroes/humility-service.png'),
    'Kindness & Compassion': require('@/assets/decorative/category-heroes/kindness-compassion.png'),
    'Sharing & Generosity': require('@/assets/decorative/category-heroes/sharing-generosity.png'),
    Forgiveness: require('@/assets/decorative/category-heroes/forgiveness.png'),
    Patience: require('@/assets/decorative/category-heroes/patience.png'),
    Courage: require('@/assets/decorative/category-heroes/courage.png'),
    Fairness: require('@/assets/decorative/category-heroes/fairness.png'),
    'Gratitude & Contentment': require('@/assets/decorative/category-heroes/gratitude-contentment.png'),
  },
  vibrant: {
    'Honesty & Trust': require('@/assets/decorative/category-heroes-vibrant-optimized/honesty-trust.jpg'),
    'Humility & Service': require('@/assets/decorative/category-heroes-vibrant-optimized/humility-service.jpg'),
    'Kindness & Compassion': require('@/assets/decorative/category-heroes-vibrant-optimized/kindness-compassion.jpg'),
    'Sharing & Generosity': require('@/assets/decorative/category-heroes-vibrant-optimized/sharing-generosity.jpg'),
    Forgiveness: require('@/assets/decorative/category-heroes-vibrant-optimized/forgiveness.jpg'),
    Patience: require('@/assets/decorative/category-heroes-vibrant-optimized/patience.jpg'),
    Courage: require('@/assets/decorative/category-heroes-vibrant-optimized/courage.jpg'),
    Fairness: require('@/assets/decorative/category-heroes-vibrant-optimized/fairness.jpg'),
    'Gratitude & Contentment': require('@/assets/decorative/category-heroes-vibrant-optimized/gratitude-contentment.jpg'),
  },
};

export const categoryHeroArt = categoryHeroArtSets[activeCategoryHeroArtSet];

export const landingArt = {
  top: [
    require('@/assets/decorative/landing-top-options-optimized/scenic-play-2-v2.jpg'),
    require('@/assets/decorative/landing/top-2.png'),
    require('@/assets/decorative/landing/top-3.png'),
  ],
  bottom: [
    require('@/assets/decorative/landing/bottom-1.png'),
    require('@/assets/decorative/landing/bottom-2.png'),
    require('@/assets/decorative/landing/bottom-3.png'),
  ],
} as const;

export const cardThemeArt = {
  mint: require('@/assets/decorative/card-themes/mint.png'),
  peach: require('@/assets/decorative/card-themes/peach.png'),
  lavender: require('@/assets/decorative/card-themes/lavender.png'),
  gold: require('@/assets/decorative/card-themes/gold.png'),
} as const;

export type CardThemeArtKey = keyof typeof cardThemeArt;
