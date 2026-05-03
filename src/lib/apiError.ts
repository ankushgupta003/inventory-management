import axios from 'axios';

export function getErrorMessage(error: unknown, fallback = 'Something went wrong') {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;

    if (responseData && typeof responseData === 'object') {
      const apiError = 'error' in responseData ? responseData.error : undefined;
      const apiMessage = 'message' in responseData ? responseData.message : undefined;

      if (typeof apiError === 'string' && apiError.trim()) return apiError;
      if (typeof apiMessage === 'string' && apiMessage.trim()) return apiMessage;
    }

    if (error.message) return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
