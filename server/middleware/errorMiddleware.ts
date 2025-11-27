/**
 * Error handling middleware for Express
 */

import { Request, Response, NextFunction } from 'express';
import errorHandler from '../services/errorHandler.js';
import { ERROR_CODES, ERROR_CATEGORY } from '../types/errors.js';

interface CustomRequest extends Request {
    id?: string;
    user?: {
        id: string;
        [key: string]: unknown;
    };
}

/**
 * Global error handling middleware
 */
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Add request context to error
    const context: any = {
        // @ts-ignore
        requestId: req.id || req.headers['x-request-id'],
        method: req.method,
        url: req.url,
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection.remoteAddress,
        // @ts-ignore
        userId: req.user?.id,
        body: req.body,
        query: req.query,
        params: req.params
    };

    // Log the error
    errorHandler.logError(err, context).then(errorId => {
        context.errorId = errorId;
    });

    // Send error response
    const errorResponse = errorHandler.formatApiError(err, context);

    // Set appropriate HTTP status code
    const statusCode = getHttpStatusCode(err);
    res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
    const customReq = req as CustomRequest;
    const error = errorHandler.createCustomError(
        ERROR_CODES.RESOURCE_NOT_FOUND,
        `Route ${req.method} ${req.url} not found`,
        { method: req.method, url: req.url }
    );

    res.status(404).json(errorHandler.formatApiError(error, {
        requestId: customReq.id,
        method: req.method,
        url: req.url
    }));
};

/**
 * Validation error handler
 */
export const validationErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const customReq = req as CustomRequest;
    if (err.name === 'ValidationError' || err.name === 'CastError') {
        const error = errorHandler.createCustomError(
            ERROR_CODES.VALIDATION_ERROR,
            err.message || 'Validation failed',
            { validationErrors: err.errors }
        );

        res.status(400).json(errorHandler.formatApiError(error, {
            requestId: customReq.id,
            validationErrors: err.errors
        }));
    } else {
        next(err);
    }
};

/**
 * JWT error handler
 */
export const jwtErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const customReq = req as CustomRequest;
    if (err.name === 'JsonWebTokenError') {
        const error = errorHandler.createCustomError(
            ERROR_CODES.TOKEN_INVALID,
            'Invalid token',
            { token: req.headers.authorization }
        );

        res.status(401).json(errorHandler.formatApiError(error, {
            requestId: customReq.id
        }));
    } else if (err.name === 'TokenExpiredError') {
        const error = errorHandler.createCustomError(
            ERROR_CODES.TOKEN_EXPIRED,
            'Token expired',
            { token: req.headers.authorization }
        );

        res.status(401).json(errorHandler.formatApiError(error, {
            requestId: customReq.id
        }));
    } else {
        next(err);
    }
};

/**
 * Rate limit error handler
 */
export const rateLimitErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    const customReq = req as CustomRequest;
    if (err.status === 429) {
        const error = errorHandler.createCustomError(
            ERROR_CODES.EXTERNAL_API_RATE_LIMIT,
            'Too many requests',
            {
                ip: req.ip,
                userAgent: req.headers['user-agent']
            }
        );

        res.status(429).json(errorHandler.formatApiError(error, {
            requestId: customReq.id,
            retryAfter: err.retryAfter
        }));
    } else {
        next(err);
    }
};

/**
 * Get HTTP status code from error
 */
function getHttpStatusCode(error: any): number {
    // Check if error has a status code
    if (error.status || error.statusCode) {
        return error.status || error.statusCode;
    }

    // Check if error has a code
    if (error.code) {
        const statusMap: Record<number, number> = {
            [ERROR_CODES.VALIDATION_ERROR]: 400,
            [ERROR_CODES.INVALID_INPUT]: 400,
            [ERROR_CODES.MISSING_REQUIRED_FIELD]: 400,
            [ERROR_CODES.INVALID_FORMAT]: 400,
            [ERROR_CODES.INVALID_RANGE]: 400,
            [ERROR_CODES.AUTH_REQUIRED]: 401,
            [ERROR_CODES.INVALID_CREDENTIALS]: 401,
            [ERROR_CODES.TOKEN_EXPIRED]: 401,
            [ERROR_CODES.TOKEN_INVALID]: 401,
            [ERROR_CODES.SESSION_EXPIRED]: 401,
            [ERROR_CODES.PERMISSION_DENIED]: 403,
            [ERROR_CODES.INSUFFICIENT_PRIVILEGES]: 403,
            [ERROR_CODES.RESOURCE_ACCESS_DENIED]: 403,
            [ERROR_CODES.RESOURCE_NOT_FOUND]: 404,
            [ERROR_CODES.NETWORK_ERROR]: 408,
            [ERROR_CODES.CONNECTION_TIMEOUT]: 408,
            [ERROR_CODES.EXTERNAL_API_RATE_LIMIT]: 429,
            [ERROR_CODES.DATABASE_CONNECTION_ERROR]: 500,
            [ERROR_CODES.QUERY_ERROR]: 500,
            [ERROR_CODES.INTERNAL_SERVER_ERROR]: 500,
            [ERROR_CODES.SERVICE_UNAVAILABLE]: 503
        };

        return statusMap[error.code] || 500;
    }

    // Default status codes based on error name
    const nameStatusMap: Record<string, number> = {
        'ValidationError': 400,
        'CastError': 400,
        'JsonWebTokenError': 401,
        'TokenExpiredError': 401,
        'UnauthorizedError': 401,
        'ForbiddenError': 403,
        'NotFoundError': 404,
        'TimeoutError': 408,
        'RateLimitError': 429,
        'DatabaseError': 500,
        'InternalServerError': 500
    };

    return nameStatusMap[error.name] || 500;
}

/**
 * Error recovery middleware
 */
export const errorRecoveryMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
    const strategy = errorHandler.getRecoveryStrategy(err, {
        // @ts-ignore
        requestId: req.id,
        method: req.method,
        url: req.url
    });

    switch (strategy) {
        case 'retry':
            // Add retry headers
            res.set('Retry-After', '5');
            res.set('X-Retry-Strategy', 'retry');
            break;
        case 'fallback':
            // Add fallback headers
            res.set('X-Fallback-Strategy', 'fallback');
            break;
        case 'skip':
            // Add skip headers
            res.set('X-Skip-Strategy', 'skip');
            break;
        case 'abort':
            // Add abort headers
            res.set('X-Abort-Strategy', 'abort');
            break;
        case 'notify':
            // Add notify headers
            res.set('X-Notify-Strategy', 'notify');
            break;
    }

    next(err);
};
