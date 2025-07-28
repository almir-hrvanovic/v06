import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getServerAuth } from "@/lib/auth-helpers";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const f = createUploadthing();

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
      const session = await getServerAuth();
      
      if (!session) {
        throw new UploadThingError("Unauthorized");
      }

      return { 
        userId: session.user.id,
        userName: session.user.name || session.user.email 
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Image upload complete for userId:", metadata.userId);
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
      const session = await getServerAuth();
      
      if (!session) {
        throw new UploadThingError("Unauthorized");
      }

      return { 
        userId: session.user.id,
        userName: session.user.name || session.user.email 
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
      const session = await getServerAuth();
      
      if (!session) {
        throw new UploadThingError("Unauthorized");
      }

      return { 
        userId: session.user.id,
        userName: session.user.name || session.user.email 
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