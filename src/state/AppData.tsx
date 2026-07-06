import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@storyjar/appdata';

export type LastRead = { storyId: string; pageIndex: number; updatedAt: number };
export type AppData = { favorites: string[]; lastRead: LastRead | null; readIds: string[] };

const EMPTY: AppData = { favorites: [], lastRead: null, readIds: [] };

type Ctx = {
  hydrated: boolean;
  data: AppData;
  setData: (updater: (prev: AppData) => AppData) => void;
};

const AppDataContext = createContext<Ctx | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setDataState] = useState<AppData>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!active) return;
      if (raw) {
        try {
          setDataState({ ...EMPTY, ...JSON.parse(raw) });
        } catch {
          // corrupt payload — start clean
        }
      }
      setHydrated(true);
    });
    return () => { active = false; };
  }, []);

  const setData = (updater: (prev: AppData) => AppData) => {
    setDataState((prev) => {
      const next = updater(prev);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  return (
    <AppDataContext.Provider value={{ hydrated, data, setData }}>
      {children}
    </AppDataContext.Provider>
  );
}

function useCtx(): Ctx {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}

export function useFavorites() {
  const { data, setData } = useCtx();
  const ids = new Set(data.favorites);
  return {
    ids,
    isFavorite: (id: string) => ids.has(id),
    toggle: (id: string) =>
      setData((prev) => ({
        ...prev,
        favorites: prev.favorites.includes(id)
          ? prev.favorites.filter((f) => f !== id)
          : [...prev.favorites, id],
      })),
  };
}

export function useRead() {
  const { data, setData } = useCtx();
  const ids = new Set(data.readIds);
  return {
    isRead: (id: string) => ids.has(id),
    markRead: (id: string) => {
      if (ids.has(id)) return; // already read — skip the redundant storage write
      setData((prev) =>
        prev.readIds.includes(id) ? prev : { ...prev, readIds: [...prev.readIds, id] },
      );
    },
  };
}

export function useContinue() {
  const { data, setData } = useCtx();
  return {
    last: data.lastRead,
    setLast: (storyId: string, pageIndex: number) =>
      setData((prev) => ({ ...prev, lastRead: { storyId, pageIndex, updatedAt: Date.now() } })),
    clear: () => setData((prev) => ({ ...prev, lastRead: null })),
  };
}
