import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { addBranchApi } from '../../API/API';

interface BranchResponse {
  success: boolean;
  message: string;
  data?: { id: number | string; name: string };
}

export const useAddBranch = () => {
  const addBranch = async (name: string): Promise<BranchResponse> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found');
    const res = await axios.post(
      addBranchApi,
      { name },
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );
    return res.data;
  };

  return useMutation({ mutationFn: addBranch });
};
