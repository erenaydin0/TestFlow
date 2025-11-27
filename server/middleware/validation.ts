import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { executionRequestSchema, testRequestSchema, scheduledTestRequestSchema } from './validationSchemas.js';

// Extend Request interface to include validatedData
declare global {
    namespace Express {
        interface Request {
            validatedData?: any;
        }
    }
}

/**
 * Generic request validation middleware factory
 */
const validateRequest = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            const validatedData = schema.parse(req.body);
            req.validatedData = validatedData;
            next();
        } catch (error: any) {
            return res.status(400).json({
                error: 'Validation Error',
                code: 'VALIDATION_ERROR',
                details: error.errors || error.message
            });
        }
    };
};

export const validateExecutionRequest = validateRequest(executionRequestSchema);
export const validateTestRequest = validateRequest(testRequestSchema);
export const validateScheduledTestRequest = validateRequest(scheduledTestRequestSchema);

