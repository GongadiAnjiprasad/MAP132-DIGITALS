const activeFaces = new Map<string, FontFace>();

export async function previewFont(name: string, bytes: Uint8Array): Promise<{ family: string; cssFamily: string; revoke: () => void }> {
  const family = 'MAP132-' + name.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 48) + '-' + crypto.randomUUID().slice(0, 8);
  const face = new FontFace(family, bytes.slice().buffer);
  await face.load();
  document.fonts.add(face);
  activeFaces.set(family, face);
  return {
    family,
    cssFamily: JSON.stringify(family),
    revoke: () => {
      const current = activeFaces.get(family);
      if (current) {
        document.fonts.delete(current);
        activeFaces.delete(family);
      }
    },
  };
}

export function clearFontPreviews(): void {
  for (const face of activeFaces.values()) document.fonts.delete(face);
  activeFaces.clear();
}
