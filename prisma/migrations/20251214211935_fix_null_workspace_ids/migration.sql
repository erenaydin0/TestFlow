-- Fix NULL workspaceId values for existing records
-- This migration assigns the first available workspace to records that have NULL workspaceId
-- This ensures backward compatibility with WebSocket notifications

-- Update Execution records with NULL workspaceId
UPDATE "Execution" 
SET "workspaceId" = (SELECT "id" FROM "Workspace" LIMIT 1)
WHERE "workspaceId" IS NULL AND EXISTS (SELECT 1 FROM "Workspace");

-- Update ScheduledTest records with NULL workspaceId
UPDATE "ScheduledTest" 
SET "workspaceId" = (SELECT "id" FROM "Workspace" LIMIT 1)
WHERE "workspaceId" IS NULL AND EXISTS (SELECT 1 FROM "Workspace");

-- Update Test records with NULL workspaceId
UPDATE "Test" 
SET "workspaceId" = (SELECT "id" FROM "Workspace" LIMIT 1)
WHERE "workspaceId" IS NULL AND EXISTS (SELECT 1 FROM "Workspace");
