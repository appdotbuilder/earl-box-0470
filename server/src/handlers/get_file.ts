
import { db } from '../db';
import { filesTable } from '../db/schema';
import { type GetFileInput, type FileUpload } from '../schema';
import { eq } from 'drizzle-orm';

export async function getFile(input: GetFileInput): Promise<FileUpload | null> {
  try {
    const result = await db.select()
      .from(filesTable)
      .where(eq(filesTable.id, input.id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const file = result[0];
    return {
      id: file.id,
      original_name: file.original_name,
      file_path: file.file_path,
      file_size: file.file_size, // bigint with mode: 'number' already returns number
      mime_type: file.mime_type,
      upload_date: file.upload_date,
    };
  } catch (error) {
    console.error('Get file failed:', error);
    throw error;
  }
}
