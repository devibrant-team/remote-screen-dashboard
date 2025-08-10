export type PlayListStyle = "Normal" | "Interactive";
export interface PlayListItem {
  id: number;
  name: string;
  playListStyle: PlayListStyle;
  duration: number;
  slideNumber: number; 
  grid: string | null;
  media: string | null;
}
export interface PlayListsResponse {
  success: boolean;
  playLists: PlayListItem[];
}