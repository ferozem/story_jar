import { VIRTUE_REFLECTIONS } from '@/data/virtue-reflections';
import { STORY_CATEGORIES } from '@/types/story';

test('every virtue category has a complete reflection set', () => {
  for (const category of STORY_CATEGORIES) {
    const r = VIRTUE_REFLECTIONS[category];
    expect(r).toBeDefined();
    expect(r.question.trim().length).toBeGreaterThan(0);
    expect(r.choices).toHaveLength(2);
    for (const choice of r.choices) {
      expect(choice.label.trim().length).toBeGreaterThan(0);
      expect(choice.feedback.trim().length).toBeGreaterThan(0);
    }
    expect(r.talkStarters.length).toBeGreaterThanOrEqual(2);
    for (const t of r.talkStarters) {
      expect(t.trim().length).toBeGreaterThan(0);
    }
  }
});
