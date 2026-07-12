export interface ManifestPage { text: string; audio?: string }
export interface ManifestStory {
  id: string;
  title: string;
  readingTime: string;
  category: string;
  moral?: string;
  cover?: string;
  pages: ManifestPage[];
}
export interface ContentManifest {
  version: string;
  baseUrl: string;
  stories: ManifestStory[];
}

export function parseManifest(raw: unknown): ContentManifest {
  const m = raw as Partial<ContentManifest>;
  if (!m || typeof m.version !== 'string' || typeof m.baseUrl !== 'string' || !Array.isArray(m.stories)) {
    throw new Error('Malformed manifest: missing version, baseUrl, or stories[].');
  }
  return m as ContentManifest;
}

// baseUrl always ends with '/'; key is relative. Undefined key => undefined url.
export function resolveUrl(baseUrl: string, key?: string): string | undefined {
  return key ? baseUrl + key : undefined;
}

const MANIFEST_PATH = 'manifest.json';

// Fetches the remote manifest. Throws on network/parse failure so callers can fall back.
export async function fetchRemoteManifest(baseUrl: string): Promise<ContentManifest> {
  const res = await fetch(baseUrl + MANIFEST_PATH, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Manifest fetch failed: ${res.status}`);
  return parseManifest(await res.json());
}
