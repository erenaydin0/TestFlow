-- CreateTable
CREATE TABLE "Test" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT NOT NULL,
    "suite" TEXT NOT NULL,
    "workflow" TEXT NOT NULL,
    "isExecutable" BOOLEAN NOT NULL DEFAULT true,
    "enableScreenshots" BOOLEAN NOT NULL DEFAULT false,
    "enableRecording" BOOLEAN NOT NULL DEFAULT false,
    "headlessMode" BOOLEAN NOT NULL DEFAULT false,
    "browserType" TEXT NOT NULL DEFAULT 'chromium',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScheduledTest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastRun" DATETIME,
    "nextRun" DATETIME,
    "lastDuration" INTEGER,
    "successRate" REAL,
    "suite" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnFailure" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnSuccess" BOOLEAN NOT NULL DEFAULT false,
    "retryOnFailure" BOOLEAN NOT NULL DEFAULT false,
    "maxRetries" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ScheduledTest_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Execution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "workflowName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "duration" INTEGER,
    "suite" TEXT,
    "tags" TEXT,
    "options" TEXT NOT NULL,
    "steps" TEXT NOT NULL,
    "screenshots" TEXT NOT NULL,
    "logs" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "videoPath" TEXT,
    "error" TEXT,
    "successRate" REAL,
    "scheduledTestId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
