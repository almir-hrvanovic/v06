import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, data, timestamp } = body;

    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs', 'console');
    await mkdir(logsDir, { recursive: true });

    // Write console data to file
    const filePath = path.join(logsDir, filename);
    const content = JSON.stringify({
      captureTime: timestamp,
      url: request.headers.get('referer') || 'unknown',
      data: data
    }, null, 2);

    await writeFile(filePath, content, 'utf-8');

    // Also write a summary file that Claude can easily read
    const summaryPath = path.join(logsDir, 'latest-console-summary.txt');
    const summaryContent = data.map((entry: any) => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      return `[${time}] ${entry.type.toUpperCase()}: ${entry.message}${entry.stack ? '\n' + entry.stack : ''}`;
    }).join('\n\n');

    await writeFile(summaryPath, summaryContent, 'utf-8');

    return NextResponse.json({ 
      success: true, 
      message: 'Console data saved',
      file: filename 
    });
  } catch (error) {
    console.error('Error saving console data:', error);
    return NextResponse.json(
      { error: 'Failed to save console data' },
      { status: 500 }
    );
  }
}