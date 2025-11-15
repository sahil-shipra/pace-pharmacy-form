import Axios from '@/lib/Axios';
import type { ApiResponse } from '@/types/common.api';
import type { FormSchema as ApplicationRequest } from '.';

type Application = {
  id: number;
  accountId: number;
  referenceCode: string;
  expiryDate: string; // ISO date string
  isActive: boolean;
  isExpired: boolean;
  isSubmitted: boolean;
  submittedDate: string; // ISO date string
  prescriptionRequirement: "withPrescription" | "withoutPrescription";
};

export type ApplicationResponse = {
  application: Application;
  accountHolder: string;
  organizationName: string;
  medicalDirectorName: string;
  medicalDirectorEmail: string;
};

/**
 * Creates a new account.
 * @param {string} referenceCode - Account details payload.
 * @returns {Promise<Object>} Response data from the server.
 */
export const getApplication = async (
  referenceCode: string
): Promise<ApiResponse<ApplicationResponse>> => {
  const response = await Axios.get<ApiResponse<ApplicationResponse>>('/application', {
    params: {
      referenceCode
    }
  });
  return response.data;
};

export const submitApplication = async (
  data: ApplicationRequest
): Promise<ApiResponse<any>> => {
  const response = await Axios.post<ApiResponse<any>>('/application', {
    ...data
  });
  return response.data;
};