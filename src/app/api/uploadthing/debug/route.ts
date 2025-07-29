import { NextResponse } from 'next/server';
import { createUploadthing } from "uploadthing/next";

export async function GET() {
  try {
    // Try to create an instance
    const f = createUploadthing();
    
    // Check if token is present
    const token = process.env.UPLOADTHING_TOKEN;
    const tokenInfo = {
      exists: !!token,
      length: token?.length,
      firstChars: token?.substring(0, 10),
      lastChars: token?.substring((token?.length || 10) - 10),
    };

    // Try to decode the token (it's base64)
    let decodedToken = null;
    if (token) {
      try {
        decodedToken = JSON.parse(Buffer.from(token, 'base64').toString());
      } catch (e) {
        decodedToken = 'Failed to decode';
      }
    }

    return NextResponse.json({
      success: true,
      uploadthingCreated: !!f,
      token: tokenInfo,
      decodedToken,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        UPLOADTHING_APP_ID: process.env.UPLOADTHING_APP_ID,
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}