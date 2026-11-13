import type { ImportCandidate } from '../my-drive-resource-manager/types';

export type ExistingDrivePortfolioItem = { id: string; driveFileId?: string; driveFolderId?: string };

export type DrivePortfolioItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  kind: 'video';
  url: string;
  source: 'drive';
  driveFileId: string;
  driveFolderId: string;
};

const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'm4v']);

function categoryFromText(value: string): string | null {
  const text = value.toLowerCase().replace(/[_-]+/g, ' ');
  if (/(wedding|marriage|pelli)/.test(text)) return 'Wedding & Events';
  if (/(birthday|bday|birth day)/.test(text)) return 'Birthday Films';
  if (/(advert|\bads?\b|promotion|promo|brand)/.test(text)) return 'Brand Promotions';
  if (/(\bai\b|artificial intelligence|generative)/.test(text)) return 'AI Video Creation';
  if (/(reel|instagram|\binsta\b|shorts?)/.test(text)) return 'Reels & Shorts';
  if (/(youtube|podcast|interview)/.test(text)) return 'YouTube Videos';
  if (/(cinematic|trailer|teaser)/.test(text)) return 'Cinematic Films';
  return null;
}

export function drivePortfolioCategory(relativePath: string, fileName: string): string {
  const folderPath = relativePath.replace(/\/[^/]*$/, '');
  return categoryFromText(folderPath) || categoryFromText(fileName) || 'Other Projects';
}

function titleFromFileName(name: string): string {
  return name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Untitled video';
}

/** Maps only supported video files from one selected Drive folder into public portfolio records. */
export function buildDrivePortfolioItems(
  candidates: ImportCandidate[],
  folderId: string,
  existingItems: ExistingDrivePortfolioItem[] = [],
): DrivePortfolioItem[] {
  const existingByFile = new Map(existingItems.filter(item => item.driveFolderId === folderId && item.driveFileId).map(item => [item.driveFileId as string, item]));
  const seen = new Set<string>();
  const result: DrivePortfolioItem[] = [];
  for (const candidate of candidates) {
    const fileId = candidate.driveFileId;
    if (!fileId || !VIDEO_EXTENSIONS.has(candidate.extension.toLowerCase()) || candidate.assetKind !== 'video' || seen.has(fileId)) continue;
    seen.add(fileId);
    const existing = existingByFile.get(fileId);
    result.push({
      id: existing?.id || 'drive-' + fileId,
      title: titleFromFileName(candidate.fileName),
      category: drivePortfolioCategory(candidate.relativePath, candidate.fileName),
      description: candidate.relativePath,
      kind: 'video',
      url: 'https://drive.google.com/file/d/' + encodeURIComponent(fileId) + '/view',
      source: 'drive',
      driveFileId: fileId,
      driveFolderId: folderId,
    });
  }
  return result;
}
