
import { type UploadFileInput, type FileUploadResponse } from '../schema';
import { db } from '../db';
import { filesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

export async function uploadFile(input: UploadFileInput): Promise<FileUploadResponse> {
  try {
    // Validate MIME type (basic validation)
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!allowedMimeTypes.includes(input.mime_type)) {
      throw new Error(`Unsupported file type: ${input.mime_type}`);
    }

    // Decode base64 data
    const fileBuffer = Buffer.from(input.file_data, 'base64');
    
    // Verify actual file size matches reported size
    if (fileBuffer.length !== input.file_size) {
      throw new Error('File size mismatch');
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Insert file record to database first to get UUID
    const result = await db.insert(filesTable)
      .values({
        original_name: input.file_name,
        file_path: '', // Will update after saving file
        file_size: input.file_size,
        mime_type: input.mime_type,
      })
      .returning()
      .execute();

    const fileRecord = result[0];
    const fileId = fileRecord.id;

    // Generate safe filename using UUID
    const fileExtension = path.extname(input.file_name);
    const safeFileName = `${fileId}${fileExtension}`;
    const filePath = path.join(uploadsDir, safeFileName);

    // Save file to disk
    fs.writeFileSync(filePath, fileBuffer);

    // Update database record with file path
    await db.update(filesTable)
      .set({
        file_path: filePath
      })
      .where(eq(filesTable.id, fileId))
      .execute();

    return {
      id: fileId,
      download_url: `/files/${fileId}`,
      original_name: input.file_name,
      file_size: input.file_size,
    };

  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
}
