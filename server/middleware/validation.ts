/**
 * Request validation middleware
 */

import { Request, Response, NextFunction } from 'express';

// Extend Request interface to include validatedData
declare global {
    namespace Express {
        interface Request {
            validatedData?: any;
        }
    }
}

/**
 * Validate execution request body
 */
function validateExecutionRequest(req: Request, res: Response, next: NextFunction) {
    const { workflowId, workflowName, steps, suite, tags, options = {} } = req.body;

    // Check required fields
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
        return res.status(400).json({
            error: 'Invalid or empty steps provided',
            code: 'INVALID_STEPS',
            details: 'Steps must be a non-empty array'
        });
    }

    // Validate steps structure
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        if (!step.id || !step.type) {
            return res.status(400).json({
                error: 'Invalid step structure',
                code: 'INVALID_STEP_STRUCTURE',
                details: `Step at index ${i} must have id and type properties`
            });
        }
    }

    // Add validated data to request
    req.validatedData = {
        workflowId: workflowId || 'manual',
        workflowName: workflowName || 'Manual Test',
        steps,
        suite: suite || 'Default',
        tags: tags || [],
        options
    };

    next();
}

/**
 * Validate test request body
 */
function validateTestRequest(req: Request, res: Response, next: NextFunction) {
    const { name, workflow, suite, tags, browserType } = req.body;

    if (!name || !workflow) {
        return res.status(400).json({
            error: 'Missing required fields',
            code: 'MISSING_FIELDS',
            details: 'Name and workflow are required'
        });
    }

    if (!Array.isArray(workflow) || workflow.length === 0) {
        return res.status(400).json({
            error: 'Invalid workflow',
            code: 'INVALID_WORKFLOW',
            details: 'Workflow must be a non-empty array'
        });
    }

    req.validatedData = {
        name,
        workflow,
        suite: suite || 'Default',
        tags: tags || [],
        browserType: browserType || 'chromium'
    };

    next();
}

/**
 * Validate scheduled test request body
 */
function validateScheduledTestRequest(req: Request, res: Response, next: NextFunction) {
    const { name, testId, schedule, environment } = req.body;

    if (!name || !testId || !schedule) {
        return res.status(400).json({
            error: 'Missing required fields',
            code: 'MISSING_FIELDS',
            details: 'Name, testId, and schedule are required'
        });
    }

    // Basic cron validation (simple check)
    if (typeof schedule !== 'string' || schedule.trim().length === 0) {
        return res.status(400).json({
            error: 'Invalid schedule',
            code: 'INVALID_SCHEDULE',
            details: 'Schedule must be a valid cron expression'
        });
    }

    req.validatedData = {
        name,
        testId,
        schedule,
        environment: environment || 'default'
    };

    next();
}

export {
    validateExecutionRequest,
    validateTestRequest,
    validateScheduledTestRequest
};
