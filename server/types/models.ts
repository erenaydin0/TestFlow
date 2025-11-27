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
    [key: string]: any;
}

export interface ExecutionOptions {
    enableScreenshots: boolean;
    enableRecording: boolean;
    headlessMode: boolean;
    browserType: string;
}

export interface TestStep {
    stepId: string;
    type: string;
    status: 'pending' | 'running' | 'passed' | 'failed';
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
    status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
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
