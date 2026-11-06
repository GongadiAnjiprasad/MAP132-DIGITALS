import { useCallback, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';

export const SERVICE_THEME_ACCENTS = {
  cinematic: '#FFCB78',
  celebrations: '#FFB45B',
  advertising: '#FFFFFF',
  ai: '#00F2FF',
  reels: '#BC13FE',
  youtube: '#FF0000',
} as const;

export type ServiceThemeKey = keyof typeof SERVICE_THEME_ACCENTS;

export function resolveServiceAccent(key: string | null | undefined): string {
  return key && key in SERVICE_THEME_ACCENTS
    ? SERVICE_THEME_ACCENTS[key as ServiceThemeKey]
    : '#080D18';
}

export function useAmbientServiceTheme() {
  const [previewKey, setPreviewKey] = useState<ServiceThemeKey | null>(null);
  const [pinnedKey, setPinnedKey] = useState<ServiceThemeKey | null>(null);
  const [playbackKey, setPlaybackKey] = useState<ServiceThemeKey | null>(null);
  const activeKey = playbackKey || previewKey || pinnedKey;
  const style = useMemo<CSSProperties>(() => ({
    '--ms-ambient-accent': resolveServiceAccent(activeKey),
  } as CSSProperties), [activeKey]);
  const preview = useCallback((key: ServiceThemeKey) => setPreviewKey(key), []);
  const clearPreview = useCallback(() => setPreviewKey(null), []);
  const pin = useCallback((key: ServiceThemeKey) => {
    setPinnedKey(current => current === key ? null : key);
    setPreviewKey(null);
  }, []);
  const setPlayback = useCallback((key: ServiceThemeKey) => setPlaybackKey(key), []);
  const clearPlayback = useCallback(() => setPlaybackKey(null), []);
  return { style, preview, clearPreview, pin, setPlayback, clearPlayback };
}
