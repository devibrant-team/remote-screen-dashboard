export type ScreenRef = { screenId: number };
export type GroupRef = { groupId: number };

export type ScheduleItem = {
  id: string;         
  title: string;       
  playlistId: string;   
  startDate: string;    
  startTime: string;  
  endDate: string;    
  endTime: string;      
  screens: ScreenRef[]; 
  groups: GroupRef[];   
};

export type ScheduleState = {
  byId: Record<string, ScheduleItem>;
  allIds: string[];
   currentName: string;  
   currentId: string | null;
};
