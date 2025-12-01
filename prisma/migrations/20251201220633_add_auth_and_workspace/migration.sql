-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Execution" (
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
    "updatedAt" DATETIME NOT NULL,
    "workspaceId" TEXT,
    CONSTRAINT "Execution_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Execution" ("createdAt", "duration", "endTime", "error", "id", "logs", "options", "progress", "scheduledTestId", "screenshots", "startTime", "status", "steps", "successRate", "suite", "tags", "updatedAt", "videoPath", "workflowId", "workflowName") SELECT "createdAt", "duration", "endTime", "error", "id", "logs", "options", "progress", "scheduledTestId", "screenshots", "startTime", "status", "steps", "successRate", "suite", "tags", "updatedAt", "videoPath", "workflowId", "workflowName" FROM "Execution";
DROP TABLE "Execution";
ALTER TABLE "new_Execution" RENAME TO "Execution";
CREATE TABLE "new_ScheduledTest" (
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
    "workspaceId" TEXT,
    CONSTRAINT "ScheduledTest_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ScheduledTest_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ScheduledTest" ("createdAt", "description", "enabled", "environment", "frequency", "id", "lastDuration", "lastRun", "maxRetries", "name", "nextRun", "notifyOnFailure", "notifyOnSuccess", "retryOnFailure", "schedule", "status", "successRate", "suite", "testId", "updatedAt") SELECT "createdAt", "description", "enabled", "environment", "frequency", "id", "lastDuration", "lastRun", "maxRetries", "name", "nextRun", "notifyOnFailure", "notifyOnSuccess", "retryOnFailure", "schedule", "status", "successRate", "suite", "testId", "updatedAt" FROM "ScheduledTest";
DROP TABLE "ScheduledTest";
ALTER TABLE "new_ScheduledTest" RENAME TO "ScheduledTest";
CREATE TABLE "new_Test" (
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
    "updatedAt" DATETIME NOT NULL,
    "workspaceId" TEXT,
    CONSTRAINT "Test_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Test" ("browserType", "createdAt", "description", "duration", "enableRecording", "enableScreenshots", "headlessMode", "id", "isExecutable", "name", "status", "suite", "tags", "updatedAt", "workflow") SELECT "browserType", "createdAt", "description", "duration", "enableRecording", "enableScreenshots", "headlessMode", "id", "isExecutable", "name", "status", "suite", "tags", "updatedAt", "workflow" FROM "Test";
DROP TABLE "Test";
ALTER TABLE "new_Test" RENAME TO "Test";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_userId_workspaceId_key" ON "WorkspaceMember"("userId", "workspaceId");
