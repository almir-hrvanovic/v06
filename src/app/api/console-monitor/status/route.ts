import { NextResponse } from 'next/server';
import { access } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const sessionFile = path.join(process.cwd(), 'logs', 'console', '.monitoring-session');
    
    // Check if monitoring session file exists
    try {
      await access(sessionFile);
      return NextResponse.json({ active: true });
    } catch {
      return NextResponse.json({ active: false });
    }
  } catch (error) {
    return NextResponse.json({ active: false });
  }
}