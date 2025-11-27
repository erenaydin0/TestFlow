import { z } from 'zod';

// Step configuration schema
export const stepConfigSchema = z.object({
    type: z.string(),
    stepId: z.string().optional(),
}).passthrough(); // Allow other properties based on step type

// Test step schema
export const testStepSchema = z.object({
    id: z.string(),
    type: z.string(),
    config: stepConfigSchema.optional(),
}).passthrough();

// Execution options schema
export const executionOptionsSchema = z.object({
    enableScreenshots: z.boolean().optional(),
    enableRecording: z.boolean().optional(),
    headlessMode: z.boolean().optional(),
    browserType: z.enum(['chromium', 'firefox', 'webkit', 'msedge']).optional(),
});

// Execution request schema
export const executionRequestSchema = z.object({
    workflowId: z.string().optional().default('manual'),
    workflowName: z.string().optional().default('Manual Test'),
    steps: z.array(testStepSchema).min(1, 'Steps must be a non-empty array'),
    suite: z.string().optional().default('Default'),
    tags: z.array(z.string()).optional().default([]),
    options: executionOptionsSchema.optional().default({}),
});

// Test request schema
export const testRequestSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    workflow: z.array(testStepSchema).min(1, 'Workflow must be a non-empty array'),
    suite: z.string().optional().default('Default'),
    tags: z.array(z.string()).optional().default([]),
    browserType: z.enum(['chromium', 'firefox', 'webkit', 'msedge']).optional().default('chromium'),
});

// Scheduled test request schema
export const scheduledTestRequestSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    testId: z.string().min(1, 'Test ID is required'),
    schedule: z.string().min(1, 'Schedule is required'), // Could add cron validation here
    environment: z.string().optional().default('default'),
    enabled: z.boolean().optional().default(true),
    retryOnFailure: z.boolean().optional().default(false),
    maxRetries: z.number().optional().default(0),
});
