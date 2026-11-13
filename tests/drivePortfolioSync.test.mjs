import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDrivePortfolioItems, drivePortfolioCategory } from '../src/modules/drive-portfolio/drivePortfolio.ts';

const candidate = (fileName, relativePath, driveFileId, extension = 'mp4', assetKind = 'video') => ({
  fileName, relativePath, driveFileId, extension, assetKind,
});

test('maps Drive folder names into the existing portfolio categories', () => {
  assert.equal(drivePortfolioCategory('Portfolio/Cinematic Trailers', 'teaser.mp4'), 'Cinematic Films');
  assert.equal(drivePortfolioCategory('Portfolio/Wedding', 'highlight.mp4'), 'Wedding & Events');
  assert.equal(drivePortfolioCategory('Portfolio/Birthday', 'party.mp4'), 'Birthday Films');
  assert.equal(drivePortfolioCategory('Portfolio/Ads', 'brand.mp4'), 'Brand Promotions');
  assert.equal(drivePortfolioCategory('Portfolio/AI Services', 'scene.mp4'), 'AI Video Creation');
  assert.equal(drivePortfolioCategory('Portfolio/Insta Reels', 'cut.mp4'), 'Reels & Shorts');
  assert.equal(drivePortfolioCategory('Portfolio/YouTube', 'podcast.mp4'), 'YouTube Videos');
});

test('publishes only supported video candidates and deduplicates Drive IDs', () => {
  const items = buildDrivePortfolioItems([
    candidate('Wedding_Highlight.mp4', 'Portfolio/Wedding', 'file-1'),
    candidate('Wedding_Highlight.mp4', 'Portfolio/Wedding', 'file-1'),
    candidate('font.ttf', 'Portfolio/Fonts', 'file-2', 'ttf', 'font'),
    candidate('logo.png', 'Portfolio/Images', 'file-3', 'png', 'image'),
  ], 'folder-1');
  assert.equal(items.length, 1);
  assert.equal(items[0].driveFileId, 'file-1');
  assert.equal(items[0].title, 'Wedding Highlight');
  assert.equal(items[0].source, 'drive');
  assert.equal(items[0].kind, 'video');
});

test('preserves the existing portfolio item ID when a Drive file is re-synced', () => {
  const previous = { id: 'stable-project-id', driveFileId: 'file-1', driveFolderId: 'folder-1' };
  const [item] = buildDrivePortfolioItems([
    candidate('New_Title.mp4', 'Portfolio/Reels', 'file-1'),
  ], 'folder-1', [previous]);
  assert.equal(item.id, 'stable-project-id');
  assert.equal(item.category, 'Reels & Shorts');
});

test('does not reuse an item identity from another selected folder', () => {
  const previous = { id: 'other-folder-id', driveFileId: 'file-1', driveFolderId: 'folder-2' };
  const [item] = buildDrivePortfolioItems([
    candidate('trailer.mp4', 'Portfolio/Trailers', 'file-1'),
  ], 'folder-1', [previous]);
  assert.equal(item.id, 'drive-file-1');
});
