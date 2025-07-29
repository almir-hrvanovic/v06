import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('Test endpoint hit!');
  const url = new URL(request.url);
  const body = await request.text();
  
  console.log('Query params:', Object.fromEntries(url.searchParams));
  console.log('Body:', body);
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  
  return NextResponse.json({ message: 'Test successful' });
}