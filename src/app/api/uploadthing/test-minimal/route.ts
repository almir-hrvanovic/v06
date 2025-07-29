import { createUploadthing, type FileRouter } from "uploadthing/next";
import { createRouteHandler } from "uploadthing/next";

const f = createUploadthing();

// Minimal file router with no authentication
const testFileRouter = {
  testUploader: f({ image: { maxFileSize: "4MB" } })
    .middleware(async () => {
      console.log("Test middleware called");
      return { userId: "test-user" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete:", file.url);
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export const { GET, POST } = createRouteHandler({
  router: testFileRouter,
});