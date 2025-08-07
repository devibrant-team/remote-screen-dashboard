import axios from "axios";
import type { PlaylistState } from "../../Redux/Playlist/ToolBarFunc/NormalPlaylistSlice";



// Format and send playlist to backend
export const savePlaylistToDatabase = async (playlist: PlaylistState) => {
  const payload = formatPlaylistPayload(playlist);

  const response = await axios.post("https://your-api.com/api/playlists", payload); // 🔁 Replace with your API URL
  return response.data;
};

// Format the payload structure
export const formatPlaylistPayload = (playlist: PlaylistState) => {
  return {
    id: playlist.id,
    name: playlist.name,
    type: playlist.type,
    slides: playlist.slides,
    NumberOfSlides: playlist.slides.length,
  };
};
