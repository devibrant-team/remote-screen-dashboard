// src/types/electron.d.ts
export {};

declare global {
  interface Window {
    electronAPI?: {
      sendLog?: (...args: any[]) => void;
      getMachineId?: () => Promise<string>;
      startUpdate?: () => void;

      downloadFile?: (args: { url: string; filename?: string }) => void;

      openExternal?: (url: string) => void;

      onDownloadProgress?: (cb: (p: any) => void) => () => void;
      onDownloadComplete?: (cb: (p: any) => void) => () => void;
      onDownloadError?: (cb: (p: any) => void) => () => void;
    };
  }
}
