import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { createClient } from "@/utils/supabase/server";
import { db } from "@/lib/db/index";
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
      // Get session using Supabase
      try {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        console.log('UploadThing middleware: session check', !!user);
        
        if (error || !user) {
          throw new UploadThingError("Unauthorized");
        }
        
        // Get user details from database
        const dbUser = await db.user.findUnique({
          where: { email: user.email! },
          select: {
            id: true,
            name: true,
            email: true
          }
        });
        
        if (!dbUser) {
          throw new UploadThingError("User not found");
        }
        
        return { 
          userId: dbUser.id,
          userName: dbUser.name || dbUser.email 
        };
      } catch (error) {
        console.log('UploadThing middleware: auth failed', error);
        throw new UploadThingError("Unauthorized");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Image upload complete for userId:", metadata.userId);
      console.log("File details:", {
        name: file.name,
        size: file.size,
        type: file.type,
        key: file.key,
        url: file.appUrl || file.url
      });

      // Store file information in database
      try {
        const fileAttachment = await db.fileAttachment.create({
          data: {
            fileName: file.name,
            originalName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/octet-stream',
            uploadThingKey: file.key,
            uploadThingUrl: file.appUrl || file.url,
            uploadedById: metadata.userId,
          },
        });

        console.log("Created file attachment:", fileAttachment.id);

        return { 
          uploadedBy: metadata.userId, 
          fileId: fileAttachment.id,
          fileName: file.name,
          fileUrl: file.appUrl || file.url
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
      // Get session using Supabase
      try {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        console.log('UploadThing middleware: session check', !!user);
        
        if (error || !user) {
          throw new UploadThingError("Unauthorized");
        }
        
        // Get user details from database
        const dbUser = await db.user.findUnique({
          where: { email: user.email! },
          select: {
            id: true,
            name: true,
            email: true
          }
        });
        
        if (!dbUser) {
          throw new UploadThingError("User not found");
        }
        
        return { 
          userId: dbUser.id,
          userName: dbUser.name || dbUser.email 
        };
      } catch (error) {
        console.log('UploadThing middleware: auth failed', error);
        throw new UploadThingError("Unauthorized");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Document upload complete for userId:", metadata.userId);
      console.log("File URL:", file.appUrl || file.url);

      // Store file information in database
      try {
        const fileAttachment = await db.fileAttachment.create({
          data: {
            fileName: file.name,
            originalName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/octet-stream',
            uploadThingKey: file.key,
            uploadThingUrl: file.appUrl || file.url,
            uploadedById: metadata.userId,
          },
        });

        return { 
          uploadedBy: metadata.userId, 
          fileId: fileAttachment.id,
          fileName: file.name,
          fileUrl: file.appUrl || file.url
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
      // Get session using Supabase
      try {
        const supabase = await createClient();
        const { data: { user }, error } = await supabase.auth.getUser();
        
        console.log('UploadThing middleware: session check', !!user);
        
        if (error || !user) {
          throw new UploadThingError("Unauthorized");
        }
        
        // Get user details from database
        const dbUser = await db.user.findUnique({
          where: { email: user.email! },
          select: {
            id: true,
            name: true,
            email: true
          }
        });
        
        if (!dbUser) {
          throw new UploadThingError("User not found");
        }
        
        return { 
          userId: dbUser.id,
          userName: dbUser.name || dbUser.email 
        };
      } catch (error) {
        console.log('UploadThing middleware: auth failed', error);
        throw new UploadThingError("Unauthorized");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Item attachment upload complete for userId:", metadata.userId);
      console.log("File URL:", file.appUrl || file.url);

      // Store file information in database
      try {
        const fileAttachment = await db.fileAttachment.create({
          data: {
            fileName: file.name,
            originalName: file.name,
            fileSize: file.size,
            mimeType: file.type || 'application/octet-stream',
            uploadThingKey: file.key,
            uploadThingUrl: file.appUrl || file.url,
            uploadedById: metadata.userId,
          },
        });

        return { 
          uploadedBy: metadata.userId, 
          fileId: fileAttachment.id,
          fileName: file.name,
          fileUrl: file.appUrl || file.url
        };
      } catch (error) {
        console.error("Failed to save file attachment to database:", error);
        throw new UploadThingError("Failed to save file information");
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;