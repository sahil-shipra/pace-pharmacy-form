import Axios from '@/lib/Axios';
import type { ApiResponse } from '@/types/common.api';

/**
 * Creates a new account.
 * @param {Object} data - Account details payload.
 * @returns {Promise<Object>} Response data from the server.
 */
export const createAccount = async (data: FormData): Promise<ApiResponse<any>> => {
  try {
    const response = await Axios.post(`/account`,
      data,
      {
        headers: {
          'Content-Type': 'multipart/form-data', // optional, Axios can also handle this automatically
        },
      });
    return response.data;
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
};