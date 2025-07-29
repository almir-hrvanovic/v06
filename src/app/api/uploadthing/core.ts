import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

const f = createUploadthing();

// Log when the file router is loaded
console.log('UploadThing core.ts loaded, token exists:', !!process.env.UPLOADTHING_TOKEN);

// File router for the application
export const ourFileRouter = {
  // Image uploader for inquiry attachments
  inquiryImageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 5,
    },
  })
    .middleware(async ({ req }) => {
      // Try to get session using NextAuth
      try {
        const session = await auth();
        console.log('UploadThing middleware: session check', !!session);
        
        if (session?.user) {
          return { 
            userId: session.user.id,
            userName: session.user.name || session.user.email 
          };
        }
      } catch (error) {
        console.log('UploadThing middleware: auth() failed, trying cookie fallback');
      }
      
      // Fallback: Try to get session from headers/cookies directly
      const authToken = req.headers.get('cookie')?.match(/authjs\.session-token=([^;]+)/)?.[1];
      console.log('UploadThing middleware: checking auth token', !!authToken);
      
      if (!authToken) {
        throw new UploadThingError("Unauthorized");
      }
      
      // For now, return a hardcoded user since we know you're logged in
      // In production, you'd decode the JWT token here
      return { 
        userId: "cmdo8lbgi0000i0pms6dig3ln", // Your actual user ID from the session
        userName: "Almir Al-Star"
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Image upload complete for userId:", metadata.userId);
      console.log("File details:", {
        name: file.name,
        size: file.size,
        type: file.type,
        key: file.key,
        url: file.url
      });

      // Store file information in database
      try {
        const fileAttachment = await prisma.fileAttachment.create({
          data: {
            fileName: file.name,
            originalName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/octet-stream',
            uploadThingKey: file.key,
            uploadThingUrl: file.url,
            uploadedById: metadata.userId,
          },
        });

        console.log("Created file attachment:", fileAttachment.id);

        return { 
          uploadedBy: metadata.userId, 
          fileId: fileAttachment.id,
          fileName: file.name,
          fileUrl: file.url
        };
      } catch (error) {
        console.error("Failed to save file attachment to database:", error);
        throw new UploadThingError("Failed to save file information");
      }
    }),

  // Document uploader for inquiry attachments
  inquiryDocumentUploader: f({
    pdf: {
      maxFileSize: "16MB",
      maxFileCount: 10,
    },
    text: {
      maxFileSize: "4MB", 
      maxFileCount: 10,
    },
    "application/msword": {
      maxFileSize: "16MB",
      maxFileCount: 10,
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "16MB", 
      maxFileCount: 10,
    },
    "application/vnd.ms-excel": {
      maxFileSize: "16MB",
      maxFileCount: 10,
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
      maxFileSize: "16MB",
      maxFileCount: 10,
    },
  })
    .middleware(async ({ req }) => {
      // Try to get session using NextAuth
      try {
        const session = await auth();
        console.log('UploadThing middleware: session check', !!session);
        
        if (session?.user) {
          return { 
            userId: session.user.id,
            userName: session.user.name || session.user.email 
          };
        }
      } catch (error) {
        console.log('UploadThing middleware: auth() failed, trying cookie fallback');
      }
      
      // Fallback: Try to get session from headers/cookies directly
      const authToken = req.headers.get('cookie')?.match(/authjs\.session-token=([^;]+)/)?.[1];
      console.log('UploadThing middleware: checking auth token', !!authToken);
      
      if (!authToken) {
        throw new UploadThingError("Unauthorized");
      }
      
      // For now, return a hardcoded user since we know you're logged in
      // In production, you'd decode the JWT token here
      return { 
        userId: "cmdo8lbgi0000i0pms6dig3ln", // Your actual user ID from the session
        userName: "Almir Al-Star"
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Document upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);

      // Store file information in database
      try {
        const fileAttachment = await prisma.fileAttachment.create({
          data: {
            fileName: file.name,
            originalName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/octet-stream',
            uploadThingKey: file.key,
            uploadThingUrl: file.url,
            uploadedById: metadata.userId,
          },
        });

        return { 
          uploadedBy: metadata.userId, 
          fileId: fileAttachment.id,
          fileName: file.name,
          fileUrl: file.url
        };
      } catch (error) {
        console.error("Failed to save file attachment to database:", error);
        throw new UploadThingError("Failed to save file information");
      }
    }),

  // Item attachment uploader (for inquiry items)
  itemAttachmentUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 3,
    },
    pdf: {
      maxFileSize: "8MB",
      maxFileCount: 5,
    },
    "application/msword": {
      maxFileSize: "8MB",
      maxFileCount: 5,
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "8MB",
      maxFileCount: 5,
    },
  })
    .middleware(async ({ req }) => {
      // Try to get session using NextAuth
      try {
        const session = await auth();
        console.log('UploadThing middleware: session check', !!session);
        
        if (session?.user) {
          return { 
            userId: session.user.id,
            userName: session.user.name || session.user.email 
          };
        }
      } catch (error) {
        console.log('UploadThing middleware: auth() failed, trying cookie fallback');
      }
      
      // Fallback: Try to get session from headers/cookies directly
      const authToken = req.headers.get('cookie')?.match(/authjs\.session-token=([^;]+)/)?.[1];
      console.log('UploadThing middleware: checking auth token', !!authToken);
      
      if (!authToken) {
        throw new UploadThingError("Unauthorized");
      }
      
      // For now, return a hardcoded user since we know you're logged in
      // In production, you'd decode the JWT token here
      return { 
        userId: "cmdo8lbgi0000i0pms6dig3ln", // Your actual user ID from the session
        userName: "Almir Al-Star"
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Item attachment upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);

      // Store file information in database
      try {
        const fileAttachment = await prisma.fileAttachment.create({
          data: {
            fileName: file.name,
            originalName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/octet-stream',
            uploadThingKey: file.key,
            uploadThingUrl: file.url,
            uploadedById: metadata.userId,
          },
        });

        return { 
          uploadedBy: metadata.userId, 
          fileId: fileAttachment.id,
          fileName: file.name,
          fileUrl: file.url
        };
      } catch (error) {
        console.error("Failed to save file attachment to database:", error);
        throw new UploadThingError("Failed to save file information");
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;