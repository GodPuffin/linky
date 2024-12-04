// Simple in-memory store for progress tracking
const progressStore = new Map<string, number>();

export const setProgress = (url: string, progress: number) => {
  progressStore.set(url, progress);
};

export const getProgress = (url: string): number => {
  return progressStore.get(url) || 0;
};

export const clearProgress = (url: string) => {
  progressStore.delete(url);
};
