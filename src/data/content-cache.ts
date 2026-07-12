import { File, Directory, Paths } from 'expo-file-system';

const AUDIO_DIR = 'story-audio';

// Deterministic flat filename for a remote url: encode the path, keep the extension.
export function cacheFilenameFor(url: string): string {
  const ext = url.split('.').pop()?.split('?')[0] ?? 'mp3';
  const base = encodeURIComponent(url).replace(/%/g, '_');
  return `${base}.${ext}`;
}

// Returns a local file:// uri for the audio, downloading it once and reusing the cache after.
// On any failure (offline first-play), returns the remote url so expo-audio can stream instead.
export async function getCachedAudioUri(url: string): Promise<string> {
  try {
    const dir = new Directory(Paths.cache, AUDIO_DIR);
    if (!dir.exists) dir.create();
    const file = new File(dir, cacheFilenameFor(url));
    if (file.exists) return file.uri;
    const out = await File.downloadFileAsync(url, dir);
    return out.uri;
  } catch {
    return url; // fall back to streaming the remote url
  }
}
