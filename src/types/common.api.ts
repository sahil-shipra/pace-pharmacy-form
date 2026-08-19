// types/common.api.ts
export type SuccessResponse<T = any> = {
    success: true;
    data: T;
    message?: string;
    timestamp?: string;
};

/** Flat error envelope from the API (matches backend createErrorResponse). */
export type ErrorResponse = {
    success: false;
    code: string;
    message: string;
    field?: string;
    fields?: Record<string, string>;
    timestamp?: string;
};

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Type guard helper
export const isSuccessResponse = <T>(
    response: ApiResponse<T>
): response is SuccessResponse<T> => {
    return response.success === true;
};

export const isErrorResponse = (
    response: ApiResponse<any>
): response is ErrorResponse => {
    return response.success === false;
};
