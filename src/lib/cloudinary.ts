import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export type UploadResult = {
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
};

/**
 * Upload a file buffer to Cloudinary.
 * @param buffer   - File data as Buffer
 * @param folder   - Cloudinary folder, e.g. "avatars" | "resources"
 * @param publicId - Optional fixed public_id (omit to auto-generate)
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  publicId?: string,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const options: Record<string, unknown> = {
      folder: `pathai/${folder}`,
      resource_type: "auto",
      ...(publicId && { public_id: publicId, overwrite: true }),
    };

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) return reject(error ?? new Error("Upload failed"));
      resolve({
        public_id: result.public_id,
        secure_url: result.secure_url,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
      });
    });

    stream.end(buffer);
  });
}

/**
 * Delete a file from Cloudinary by public_id.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

/**
 * Build a transformation URL for image resizing/optimization.
 * Example: transformUrl(publicId, { width: 200, height: 200, crop: "fill" })
 */
export function transformUrl(
  publicId: string,
  options: { width?: number; height?: number; crop?: string; quality?: string | number },
): string {
  return cloudinary.url(publicId, {
    secure: true,
    ...options,
  });
}
