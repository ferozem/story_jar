import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { parseManifest, fetchRemoteManifest, ContentManifest } from '@/data/content-manifest';
import { setCatalog } from '@/data/stories';
import bundled from '@/data/manifest.bundled.json';

const VersionContext = createContext<string>('');

// Loads bundled content synchronously, then tries the remote manifest and swaps if newer.
export function ContentProvider({ children }: { children: ReactNode }) {
  const initial = parseManifest(bundled);
  const [version, setVersion] = useState(initial.version);

  useEffect(() => {
    let active = true;
    fetchRemoteManifest(initial.baseUrl)
      .then((remote: ContentManifest) => {
        if (!active) return;
        if (remote.version !== initial.version) {
          setCatalog(remote);
          setVersion(remote.version); // re-render consumers so new stories appear this session
        }
      })
      .catch(() => { /* offline or fetch failed — bundled snapshot stands */ });
    return () => { active = false; };
  }, [initial.baseUrl, initial.version]);

  return <VersionContext.Provider value={version}>{children}</VersionContext.Provider>;
}

// Screens read this so they re-render when the remote catalog swaps in.
export function useCatalogVersion(): string {
  return useContext(VersionContext);
}
