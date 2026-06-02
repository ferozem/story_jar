import { Story } from '@/types/story';
import { assembleStory } from './story-assembler';

import tornMap from './stories/the-torn-map.json';
import lockedBox from './stories/the-locked-suggestion-box.json';
import forgottenDiary from './stories/the-forgotten-diary.json';
import brokenLantern from './stories/the-broken-lantern.json';
import hilltopTrail from './stories/the-hilltop-trail.json';
import boyNearGate from './stories/the-boy-near-the-gate.json';

const stories: Story[] = [
  assembleStory(tornMap),
  assembleStory(lockedBox),
  assembleStory(forgottenDiary),
  assembleStory(brokenLantern),
  assembleStory(hilltopTrail),
  assembleStory(boyNearGate),
];

export function getStories(): Story[] {
  return stories;
}

export function getStory(id: string): Story | undefined {
  return stories.find((s) => s.id === id);
}

export default stories;
