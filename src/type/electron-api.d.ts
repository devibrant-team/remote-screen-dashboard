// src/types/electron.d.ts
export {};

declare global {
  interface Window {
    electronAPI?: {
      sendLog?: (...args: any[]) => void;
      getMachineId?: () => Promise<string>;
      downloadFile?: (args: { url: string; filename?: string }) => void;
      onDownloadProgress?: (cb: (p: any) => void) => () => void;
      onDownloadComplete?: (cb: (p: any) => void) => () => void;
      onDownloadError?: (cb: (p: any) => void) => () => void;
         startUpdate?: () => void;
    };
  }
}
