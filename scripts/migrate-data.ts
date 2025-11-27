import { prisma } from '../server/lib/prisma';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_DIR = path.join(__dirname, '../server/storage');

async function migrateTests() {
    const testsDir = path.join(STORAGE_DIR, 'tests');
    if (!fs.existsSync(testsDir)) return;

    const files = await fs.readdir(testsDir);
    console.log(`Found ${files.length} tests to migrate...`);

    for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const content = await fs.readJson(path.join(testsDir, file));

        try {
            await prisma.test.create({
                data: {
                    id: content.id,
                    name: content.name,
                    description: content.description || '',
                    status: content.status || 'draft',
                    duration: content.duration || 0,
                    tags: JSON.stringify(content.tags || []),
                    suite: content.suite || 'Default',
                    workflow: JSON.stringify(content.workflow || []),
                    isExecutable: content.isExecutable ?? true,
                    enableScreenshots: content.enableScreenshots ?? false,
                    enableRecording: content.enableRecording ?? false,
                    headlessMode: content.headlessMode ?? false,
                    browserType: content.browserType || 'chromium',
                    createdAt: content.createdAt ? new Date(content.createdAt) : new Date(),
                    updatedAt: content.updatedAt ? new Date(content.updatedAt) : new Date(),
                }
            });
            console.log(`Migrated test: ${content.name}`);
        } catch (error) {
            console.error(`Failed to migrate test ${file}:`, error);
        }
    }
}

async function migrateExecutions() {
    const executionsDir = path.join(STORAGE_DIR, 'executions');
    if (!fs.existsSync(executionsDir)) return;

    const files = await fs.readdir(executionsDir);
    console.log(`Found ${files.length} executions to migrate...`);

    for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const content = await fs.readJson(path.join(executionsDir, file));

        try {
            await prisma.execution.create({
                data: {
                    id: content.id,
                    workflowId: content.workflowId,
                    workflowName: content.workflowName,
                    status: content.status,
                    startTime: new Date(content.startTime),
                    endTime: content.endTime ? new Date(content.endTime) : null,
                    duration: content.duration,
                    suite: content.suite,
                    tags: JSON.stringify(content.tags || []),
                    options: JSON.stringify(content.options || {}),
                    steps: JSON.stringify(content.steps || []),
                    screenshots: JSON.stringify(content.screenshots || []),
                    logs: JSON.stringify(content.logs || []),
                    progress: content.progress || 0,
                    videoPath: content.videoPath,
                    error: content.error,
                    successRate: content.successRate,
                    scheduledTestId: content.scheduledTestId,
                    createdAt: content.startTime ? new Date(content.startTime) : new Date(),
                    updatedAt: content.endTime ? new Date(content.endTime) : new Date(),
                }
            });
            console.log(`Migrated execution: ${content.id}`);
        } catch (error) {
            console.error(`Failed to migrate execution ${file}:`, error);
        }
    }
}

async function migrateSchedules() {
    const schedulesDir = path.join(STORAGE_DIR, 'scheduled-tests');
    if (!fs.existsSync(schedulesDir)) return;

    const files = await fs.readdir(schedulesDir);
    console.log(`Found ${files.length} schedules to migrate...`);

    for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const content = await fs.readJson(path.join(schedulesDir, file));

        try {
            // Check if test exists first
            const testExists = await prisma.test.findUnique({ where: { id: content.testId } });
            if (!testExists) {
                console.warn(`Skipping schedule ${content.name} because test ${content.testId} does not exist.`);
                continue;
            }

            await prisma.scheduledTest.create({
                data: {
                    id: content.id,
                    testId: content.testId,
                    name: content.name,
                    description: content.description || '',
                    schedule: content.schedule,
                    frequency: content.frequency || 'custom',
                    status: content.status || 'active',
                    lastRun: content.lastRun ? new Date(content.lastRun) : null,
                    nextRun: content.nextRun ? new Date(content.nextRun) : null,
                    lastDuration: content.lastDuration,
                    successRate: content.successRate,
                    suite: content.suite || 'Default',
                    environment: content.environment || 'development',
                    enabled: content.enabled ?? true,
                    notifyOnFailure: content.notifyOnFailure ?? false,
                    notifyOnSuccess: content.notifyOnSuccess ?? false,
                    retryOnFailure: content.retryOnFailure ?? false,
                    maxRetries: content.maxRetries || 0,
                    createdAt: content.createdAt ? new Date(content.createdAt) : new Date(),
                    updatedAt: content.updatedAt ? new Date(content.updatedAt) : new Date(),
                }
            });
            console.log(`Migrated schedule: ${content.name}`);
        } catch (error) {
            console.error(`Failed to migrate schedule ${file}:`, error);
        }
    }
}

async function main() {
    console.log('Starting migration...');
    await migrateTests();
    await migrateSchedules(); // Schedules depend on Tests
    await migrateExecutions();
    console.log('Migration completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
