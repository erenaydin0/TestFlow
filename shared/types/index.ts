export type ExecutionStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type StepStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
export type BrowserType = 'chromium' | 'firefox' | 'webkit' | 'msedge';
export type TestStatus = 'draft' | 'active' | 'archived';

export interface Test {
    id: string;
    name: string;
    description: string;
    status: TestStatus | string;
    duration: number;
    tags: string[];
    suite: string;
    workflow?: any[]; // Using any[] for flexibility as steps can be complex
    isExecutable?: boolean;
    enableScreenshots?: boolean;
    enableRecording?: boolean;
    headlessMode?: boolean;
    browserType?: BrowserType | string;
    createdAt?: Date;
    updatedAt?: Date;
    workspaceId?: string;
}

export interface Schedule {
    id: string;
    name: string;
    schedule: string;
    testId: string;
    enabled: boolean;
    status: string;
    lastRun?: Date;
    nextRun?: Date;
    retryOnFailure?: boolean;
    maxRetries?: number;
    workspaceId?: string;
    [key: string]: any;
}

export interface ExecutionOptions {
    enableScreenshots: boolean;
    enableRecording: boolean;
    headlessMode: boolean;
    browserType?: BrowserType | string;
}

export interface TestStep {
    stepId: string;
    type: string;
    status: StepStatus;
    config: StepConfig;
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    screenshot?: string | null;
    error?: string | null;
}

export interface Execution {
    id: string;
    workflowId: string;
    workflowName: string;
    status: ExecutionStatus;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    suite?: string;
    tags?: string[];
    options: ExecutionOptions;
    steps: TestStep[];
    screenshots: string[];
    logs: string[];
    progress: number;
    videoPath?: string;
    error?: string;
    successRate?: number;
    scheduledTestId?: string;
    workspaceId?: string;
}

export interface StepConfig {
    type: string;
    stepId?: string;
    [key: string]: any;
}

export interface StepResult {
    success: boolean;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    logs: string[];
    screenshot: string | null;
    error: string | null;
}

export interface TestRunnerOptions {
    headless?: boolean;
    viewport?: { width: number; height: number };
    timeout?: number;
    enableRecording?: boolean;
    executionId?: string;
    browserType?: string;
    enableScreenshots?: boolean;
}
