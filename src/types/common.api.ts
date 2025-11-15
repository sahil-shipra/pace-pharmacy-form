// types/common.api.ts
export type SuccessResponse<T = any> = {
    success: true;
    data: T;
    message?: string;
    timestamp: string;
};

export type ErrorResponse = {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
    };
    timestamp: string;
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