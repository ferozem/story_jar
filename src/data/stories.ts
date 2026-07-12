import { Story } from '@/types/story';
import { assembleStory } from './story-assembler';
import { ContentManifest, parseManifest } from './content-manifest';
import bundled from './manifest.bundled.json';

function assembleAll(m: ContentManifest): Story[] {
  return m.stories.map((e) => assembleStory(e, m.baseUrl));
}

// Module snapshot of the current catalog. Starts from the bundled manifest so the app
// renders offline on first paint; ContentProvider replaces it when a newer remote manifest loads.
let current: Story[] = assembleAll(parseManifest(bundled));

// Called by ContentProvider after a successful remote fetch.
export function setCatalog(m: ContentManifest): void {
  current = assembleAll(m);
}

export function getStories(): Story[] {
  return current;
}

export function getStory(id: string): Story | undefined {
  return current.find((s) => s.id === id);
}

export default current;
