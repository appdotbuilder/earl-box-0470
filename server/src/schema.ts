
import { z } from 'zod';

// File upload schema
export const fileUploadSchema = z.object({
  id: z.string(), // UUID for file identification
  original_name: z.string(),
  file_path: z.string(), // Path to stored file
  file_size: z.number().int().positive(),
  mime_type: z.string(),
  upload_date: z.coerce.date(),
});

export type FileUpload = z.infer<typeof fileUploadSchema>;

// Input schema for uploading files
export const uploadFileInputSchema = z.object({
  file_name: z.string().min(1, "File name is required"),
  file_size: z.number().int().positive().max(200 * 1024 * 1024, "File size must be under 200MB"), // 200MB limit
  mime_type: z.string(),
  file_data: z.string(), // Base64 encoded file data
});

export type UploadFileInput = z.infer<typeof uploadFileInputSchema>;

// Response schema for file upload
export const fileUploadResponseSchema = z.object({
  id: z.string(),
  download_url: z.string(),
  original_name: z.string(),
  file_size: z.number(),
});

export type FileUploadResponse = z.infer<typeof fileUploadResponseSchema>;

// Schema for file statistics
export const fileStatsSchema = z.object({
  total_files: z.number().int().nonnegative(),
  total_size: z.number().nonnegative(),
});

export type FileStats = z.infer<typeof fileStatsSchema>;

// Input schema for getting file by ID
export const getFileInputSchema = z.object({
  id: z.string().uuid(),
});

export type GetFileInput = z.infer<typeof getFileInputSchema>;
