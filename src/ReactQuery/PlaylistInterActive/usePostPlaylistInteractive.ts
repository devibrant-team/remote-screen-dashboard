import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { postplaylistinteractiveApi } from '../../API/API';

interface PlaylistResponse {
  success: boolean;
  message: string;
  data?: any;
}

export const usePostPlaylistInteractive = () => {
//   const token = localStorage.getItem('token');

  const postPlaylist = async (payload: FormData): Promise<PlaylistResponse> => {
    const response = await axios.post(postplaylistinteractiveApi, payload, {
      headers: {
        // Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  };

  return useMutation({
    mutationFn: postPlaylist,
  });
};
