
import { db } from '../db';
import { filesTable } from '../db/schema';
import { type GetFileInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function serveFile(input: GetFileInput): Promise<{
    filePath: string;
    originalName: string;
    mimeType: string;
} | null> {
    try {
        // Query the database for the file by ID
        const files = await db.select()
            .from(filesTable)
            .where(eq(filesTable.id, input.id))
            .execute();

        // Return null if file not found
        if (files.length === 0) {
            return null;
        }

        const file = files[0];

        // Return file information for serving
        return {
            filePath: file.file_path,
            originalName: file.original_name,
            mimeType: file.mime_type
        };
    } catch (error) {
        console.error('File retrieval failed:', error);
        throw error;
    }
}
