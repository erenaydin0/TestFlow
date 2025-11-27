
// import fetch from 'node-fetch'; // Native fetch in Node 18+
import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:3004/api';

async function runVerification() {
    console.log('🚀 Starting API Verification...');

    // 1. Health Check
    try {
        const health = await fetch(`${API_URL}/health`).then(res => res.json());
        console.log('✅ Health Check:', health);
    } catch (error) {
        console.error('❌ Health Check Failed:', error);
        process.exit(1);
    }

    // 2. Create Test
    const testId = uuidv4();
    const testPayload = {
        id: testId,
        name: 'Verification Test',
        description: 'Created by verification script',
        steps: [], // Frontend sends steps, backend maps to workflow
        workflow: [
            {
                id: 'step-1',
                type: 'goto',
                url: 'https://example.com',
                status: 'pending'
            }
        ],
        tags: ['verification'],
        status: 'draft'
    };

    // We need to match what frontend sends.
    // Based on tests.ts:
    // const testData = req.validatedData;
    // And validateTestRequest uses testRequestSchema.

    // Let's try to create a test.
    let createdTest;
    try {
        const res = await fetch(`${API_URL}/tests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testPayload)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(`Failed to create test: ${JSON.stringify(err)}`);
        }

        createdTest = await res.json();
        console.log('✅ Test Created:', createdTest.id);
    } catch (error) {
        console.error('❌ Create Test Failed:', error);
        process.exit(1);
    }

    // 3. Get Test
    try {
        const res = await fetch(`${API_URL}/tests/${createdTest.id}`);
        if (!res.ok) throw new Error('Failed to get test');
        const fetchedTest = await res.json();
        if (fetchedTest.id !== createdTest.id) throw new Error('ID mismatch');
        console.log('✅ Test Fetched:', fetchedTest.id);
    } catch (error) {
        console.error('❌ Get Test Failed:', error);
        process.exit(1);
    }

    // 4. Create Scheduled Test
    let createdSchedule;
    try {
        const schedulePayload = {
            testId: createdTest.id,
            name: 'Verification Schedule',
            schedule: '0 0 * * *', // Daily
            enabled: true,
            environment: 'development'
        };

        const res = await fetch(`${API_URL}/scheduled-tests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(schedulePayload)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(`Failed to create schedule: ${JSON.stringify(err)}`);
        }

        createdSchedule = await res.json();
        console.log('✅ Schedule Created:', createdSchedule.id);
    } catch (error) {
        console.error('❌ Create Schedule Failed:', error);
        process.exit(1);
    }

    // 5. Delete Schedule
    try {
        const res = await fetch(`${API_URL}/scheduled-tests/${createdSchedule.id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete schedule');
        console.log('✅ Schedule Deleted');
    } catch (error) {
        console.error('❌ Delete Schedule Failed:', error);
        process.exit(1);
    }

    // 6. Delete Test
    try {
        const res = await fetch(`${API_URL}/tests/${createdTest.id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete test');
        console.log('✅ Test Deleted');
    } catch (error) {
        console.error('❌ Delete Test Failed:', error);
        process.exit(1);
    }

    console.log('🎉 Verification Completed Successfully!');
}

runVerification();
