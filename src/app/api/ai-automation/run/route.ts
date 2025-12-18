import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { workspaceId, task, provider, model, apiKey, headless } = body;

    if (!workspaceId || !task || !provider || !apiKey) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user has access to workspace
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });

    if (!workspaceMember) {
      return NextResponse.json(
        { message: 'Access denied to workspace' },
        { status: 403 }
      );
    }

    // Get workspace API keys to verify
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      return NextResponse.json(
        { message: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Use the existing Python script from aiautomation directory
    const pythonScriptPath = path.join(process.cwd(), 'aiautomation', 'run_agent.py');
    
    // Create a wrapper script that calls the agent function
    const wrapperScript = `
import asyncio
import os
import sys
import json

# Add aiautomation to path
sys.path.insert(0, '${path.join(process.cwd(), 'aiautomation').replace(/\\/g, '/')}')

# Set API key in environment
os.environ['${provider === 'google' ? 'GOOGLE_API_KEY' : 'OPENAI_API_KEY'}'] = '${apiKey.replace(/'/g, "\\'")}'

try:
    from app import run_agent
    
    async def main():
        result = await run_agent(
            task='''${task.replace(/'/g, "\\'").replace(/\n/g, '\\n')}''',
            api_key='${apiKey.replace(/'/g, "\\'")}',
            headless=${headless},
            provider='${provider}',
            model='${model}'
        )
        
        # Convert result to JSON-serializable format
        output = {
            'success': result.get('success', False),
            'error': result.get('error'),
            'logs': [],
            'screenshots': []
        }
        
        if result.get('result'):
            agent_result = result['result']
            if hasattr(agent_result, 'final_result'):
                output['final_result'] = str(agent_result.final_result())
            if hasattr(agent_result, 'urls'):
                output['urls'] = list(agent_result.urls())
            if hasattr(agent_result, 'errors'):
                output['errors'] = [str(e) for e in agent_result.errors()]
            if hasattr(agent_result, 'screenshots'):
                screenshots = agent_result.screenshots()
                for screenshot in screenshots:
                    if isinstance(screenshot, str) and os.path.exists(screenshot):
                        import base64
                        with open(screenshot, 'rb') as f:
                            img_data = base64.b64encode(f.read()).decode('utf-8')
                            output['screenshots'].append(f'data:image/png;base64,{img_data}')
        
        print(json.dumps(output))
    
    asyncio.run(main())
    
except ImportError as e:
    print(json.dumps({
        'success': False,
        'error': f'Import error: {str(e)}. Please ensure browser-use is installed: pip install browser-use playwright'
    }))
except Exception as e:
    print(json.dumps({
        'success': False,
        'error': f'Agent execution failed: {str(e)}'
    }))
`;

    // Write temporary wrapper script
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const scriptPath = path.join(tmpDir, `agent_${Date.now()}.py`);
    fs.writeFileSync(scriptPath, wrapperScript);

    try {
      // Run Python script with proper environment
      const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
      const { stdout, stderr } = await execAsync(
        `${pythonCmd} ${scriptPath}`,
        { 
          timeout: 300000, // 5 minutes timeout
          cwd: process.cwd(),
          env: {
            ...process.env,
            PYTHONPATH: path.join(process.cwd(), 'aiautomation'),
          }
        }
      );

      // Clean up script
      if (fs.existsSync(scriptPath)) {
        fs.unlinkSync(scriptPath);
      }

      // Parse output (last line should be JSON)
      const lines = stdout.trim().split('\n');
      const jsonLine = lines[lines.length - 1];
      
      let output;
      try {
        output = JSON.parse(jsonLine);
      } catch {
        // If last line is not JSON, try to find JSON in output
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          output = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON output found');
        }
      }

      // Add logs if available
      if (lines.length > 1) {
        output.logs = lines.slice(0, -1);
      }

      return NextResponse.json(output);
    } catch (error: any) {
      // Clean up script
      if (fs.existsSync(scriptPath)) {
        fs.unlinkSync(scriptPath);
      }

      if (error.code === 'ETIMEDOUT') {
        return NextResponse.json(
          { success: false, error: 'Test execution timed out (5 minutes)' },
          { status: 408 }
        );
      }

      return NextResponse.json(
        { 
          success: false, 
          error: error.message || 'Failed to execute test. Make sure Python 3.11+ and browser-use are installed.' 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in AI automation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

