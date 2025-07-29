import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";
import { NextRequest } from "next/server";

// Log environment check
console.log('UploadThing route.ts - Environment check:', {
  hasToken: !!process.env.UPLOADTHING_TOKEN,
  tokenLength: process.env.UPLOADTHING_TOKEN?.length,
  nodeEnv: process.env.NODE_ENV,
});

// Create handlers with detailed error handling
const handlers = createRouteHandler({
  router: ourFileRouter,
});

// Enhanced error logging wrapper
export const GET = async (req: NextRequest) => {
  console.log('[UploadThing] GET Request:', {
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
  });
  
  try {
    const response = await handlers.GET(req as any);
    console.log('[UploadThing] GET Response:', response.status);
    return response;
  } catch (error: any) {
    console.error('[UploadThing] GET Error:', error);
    console.error('[UploadThing] Error stack:', error.stack);
    throw error;
  }
};

export const POST = async (req: NextRequest) => {
  console.log('[UploadThing] POST Request:', {
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
  });
  
  try {
    // Clone request to read body without consuming it
    const clonedReq = req.clone();
    const body = await clonedReq.text();
    console.log('[UploadThing] POST Body:', body);
    
    const response = await handlers.POST(req as any);
    console.log('[UploadThing] POST Response:', response.status);
    
    if (response.status >= 400) {
      const responseText = await response.clone().text();
      console.error('[UploadThing] Error Response:', responseText);
    }
    
    return response;
  } catch (error: any) {
    console.error('[UploadThing] POST Error:', error);
    console.error('[UploadThing] Error stack:', error.stack);
    console.error('[UploadThing] Error type:', error.constructor.name);
    throw error;
  }
};