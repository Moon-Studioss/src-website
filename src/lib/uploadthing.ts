import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { requireAdmin } from "@/lib/auth";

const f = createUploadthing();

export const uploadRouter = {
  // Store photos (products and category tiles): admin only
  productImages: f({ image: { maxFileSize: "4MB", maxFileCount: 5 } })
    .middleware(async () => {
      try {
        await requireAdmin();
      } catch {
        throw new UploadThingError("Log in to the admin panel to upload photos");
      }
      return {};
    })
    .onUploadComplete(async ({ file }) => ({ url: file.ufsUrl })),

  // Accepts 1 file only — max 1MB
  projectFiles: f({
    pdf:   { maxFileSize: "1MB", maxFileCount: 1 },
    blob:  { maxFileSize: "1MB", maxFileCount: 1 },
    image: { maxFileSize: "1MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      // Public upload — no auth required (students submit without accounts)
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      // File metadata is returned to the client after upload
      return { key: file.key, url: file.ufsUrl, name: file.name, size: file.size };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
