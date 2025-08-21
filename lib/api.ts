import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const createApiResponse = <T>(
  res: NextApiResponse,
  data: T,
  statusCode: number = 200
) => {
  return res.status(statusCode).json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  });
};

export const createApiError = (
  res: NextApiResponse,
  error: ApiError | Error,
  statusCode: number = 500
) => {
  const isApiError = error instanceof ApiError;
  const message = isApiError ? error.message : 'Internal server error';
  const code = isApiError ? error.code : 'INTERNAL_ERROR';

  return res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      timestamp: new Date().toISOString(),
    },
  });
};

export const validateRequest = <T>(
  req: NextApiRequest,
  schema: z.ZodSchema<T>
): T => {
  try {
    return schema.parse(req.body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError(400, 'Validation failed', 'VALIDATION_ERROR');
    }
    throw error;
  }
};

export const withErrorHandler = (
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof ApiError) {
        return createApiError(res, error, error.statusCode);
      }
      
      return createApiError(res, error as Error);
    }
  };
};

export const withAuth = (
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // This will be implemented with Clerk auth
    // For now, just call the handler
    return handler(req, res);
  };
};
