export type ScreenRow = {
  id: number;
  folderId: number;
  name: string;
  publicToken: string;
  revision: number;
  sortOrder: number;
  slideshowPath: string;
};

export type ScreenItem = {
  id: number;
  type: string;
  durationMs: number;
  sortOrder: number;
  mimeType: string;
};
