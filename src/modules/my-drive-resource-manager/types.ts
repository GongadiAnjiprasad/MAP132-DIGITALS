export type MyDriveSourceKind = 'google-drive-folder' | 'google-drive-zip' | 'local-zip';

export type CreativeAssetKind =
  | 'font'
  | 'audio'
  | 'video'
  | 'image'
  | 'template'
  | 'texture'
  | 'archive'
  | 'other';

export type SupportedFontFormat = 'ttf' | 'otf' | 'woff' | 'woff2';

export interface ImportSource {
  kind: MyDriveSourceKind;
  sourceId: string;
  displayName: string;
  parentPath?: string;
}

export interface ImportCandidate {
  source: ImportSource;
  relativePath: string;
  fileName: string;
  extension: string;
  assetKind: CreativeAssetKind;
  fontFormat?: SupportedFontFormat;
  mimeType?: string;
  byteSize?: number;
  modifiedTime?: string;
  licence: 'verified' | 'unknown';
  contentSha256?: string;
}

export interface ImportIssue {
  sourceName: string;
  path?: string;
  code:
    | 'unsupported-file'
    | 'unsafe-path'
    | 'encrypted-entry'
    | 'unsupported-compression'
    | 'symlink-entry'
    | 'archive-limit-exceeded'
    | 'corrupt-archive'
    | 'duplicate'
    | 'font-load-failed'
    | 'drive-permission-denied'
    | 'drive-item-unavailable';
  message: string;
}

export interface ImportSummary {
  scanned: number;
  imported: number;
  skipped: number;
  duplicates: number;
  issues: ImportIssue[];
}

export interface DriveFolderPage {
  files: Array<{
    id: string;
    name: string;
    mimeType: string;
    size?: string;
    modifiedTime?: string;
    webViewLink?: string;
  }>;
  nextPageToken?: string;
}
