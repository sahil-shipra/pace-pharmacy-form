import Axios from '@/lib/Axios';
import type { ApiResponse } from '@/types/common.api';
import axios from 'axios';

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

/** Prefer API flat envelope message; fall back to legacy nested `error.message`. */
function getServerMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") return undefined;
  const body = data as Record<string, unknown>;

  if (typeof body.message === "string" && body.message.trim()) {
    return body.message;
  }

  const nested = body.error;
  if (nested && typeof nested === "object") {
    const nestedMessage = (nested as { message?: unknown }).message;
    if (typeof nestedMessage === "string" && nestedMessage.trim()) {
      return nestedMessage;
    }
  }

  return undefined;
}

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    // Case 1: request never got a response
    if (!err.response) {
      if (err.code === "ECONNABORTED") {
        return "The request timed out. Please check your connection and try again.";
      }
      if (err.code === "ERR_NETWORK") {
        return "Can't reach the server. Please check your internet connection.";
      }
      return "No response from the server. Please try again shortly.";
    }

    // Case 2: server responded with an error status (flat ErrorResponse)
    const status = err.response.status;
    const serverMessage = getServerMessage(err.response.data);

    switch (status) {
      case 400:
        return serverMessage ?? "The request was invalid. Please check your input.";
      case 401:
        return "Your session has expired. Please log in again.";
      case 403:
        return "You don't have permission to do that.";
      case 404:
        return "The requested resource could not be found.";
      case 409:
        return serverMessage ?? "This email address is already registered.";
      case 422:
        return serverMessage ?? "Some fields are invalid. Please review and try again.";
      case 429:
        return "Too many requests. Please wait a moment and try again.";
      case 500:
      case 502:
      case 503:
        return serverMessage ?? "Something went wrong on our end. Please try again later.";
      default:
        return serverMessage ?? `Request failed (${status}). Please try again.`;
    }
  }

  // Case 3: thrown Error (including envelope → new Error(message))
  if (err instanceof Error) {
    return err.message;
  }

  // Case 4: plain ErrorResponse-like object
  const plainMessage = getServerMessage(err);
  if (plainMessage) {
    return plainMessage;
  }

  return "An unexpected error occurred. Please try again.";
}

export function buildErrorReport(error: unknown, message: string) {
  const timestamp = new Date().toISOString();
  const url = window.location.href;

  let debugInfo = "";
  if (axios.isAxiosError(error)) {
    debugInfo = `
Status: ${error.response?.status ?? "N/A"}
Endpoint: ${error.config?.url ?? "N/A"}
Method: ${error.config?.method?.toUpperCase() ?? "N/A"}`;
  }

  return `Error Report
------------
Message: ${message}
Page: ${url}
Time: ${timestamp}${debugInfo}
`;
}

/** Non-PII context for Sentry — never include form field values. */
export type SafeSubmitErrorContext = {
  pageUrl: string;
  pagePath: string;
  userMessage: string;
  apiEndpoint: string;
  apiMethod: string;
  httpStatus: number | null;
  axiosCode: string | null;
  apiErrorCode: string | null;
  requestUrl: string | null;
  requestMethod: string | null;
  documentCount?: number;
  paymentMethod?: string;
  preferredLocation?: string | null;
  hasAccountDraft: boolean;
  hasPaymentDraft: boolean;
  hasAckDraft: boolean;
  hasMedicalDraft: boolean;
};

export function getSafeSubmitErrorContext(
  error: unknown,
  message: string,
  extras?: {
    documentCount?: number;
    paymentMethod?: string;
    preferredLocation?: string | null;
    hasAccountDraft?: boolean;
    hasPaymentDraft?: boolean;
    hasAckDraft?: boolean;
    hasMedicalDraft?: boolean;
  }
): SafeSubmitErrorContext {
  const context: SafeSubmitErrorContext = {
    pageUrl: window.location.href,
    pagePath: window.location.pathname,
    userMessage: message,
    apiEndpoint: "/account",
    apiMethod: "POST",
    httpStatus: null,
    axiosCode: null,
    apiErrorCode: null,
    requestUrl: null,
    requestMethod: null,
    documentCount: extras?.documentCount,
    paymentMethod: extras?.paymentMethod,
    preferredLocation: extras?.preferredLocation ?? null,
    hasAccountDraft: extras?.hasAccountDraft ?? false,
    hasPaymentDraft: extras?.hasPaymentDraft ?? false,
    hasAckDraft: extras?.hasAckDraft ?? false,
    hasMedicalDraft: extras?.hasMedicalDraft ?? false,
  };

  if (axios.isAxiosError(error)) {
    context.httpStatus = error.response?.status ?? null;
    context.axiosCode = error.code ?? null;
    context.requestUrl = error.config?.url ?? null;
    context.requestMethod = error.config?.method?.toUpperCase() ?? null;

    const data = error.response?.data;
    if (data && typeof data === "object" && typeof (data as { code?: unknown }).code === "string") {
      context.apiErrorCode = (data as { code: string }).code;
    }
  }

  return context;
}

/** Sanitized Error so Axios request bodies (PII) are not attached to Sentry. */
export function toAccountSubmitError(error: unknown, message: string): Error {
  const err = new Error(message);
  err.name = "AccountSubmitError";
  if (error instanceof Error && error.stack) {
    err.stack = error.stack;
  }
  return err;
}