import axios from 'axios';
import { playlisttypeApi } from '../../API/API';

export const fetchPlaylistTypes = async () => {
  const response = await axios.get(playlisttypeApi); 
 return response.data.playListStyle;
};
