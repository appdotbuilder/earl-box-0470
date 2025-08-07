
import { db } from '../db';
import { filesTable } from '../db/schema';
import { count, sum } from 'drizzle-orm';
import { type FileStats } from '../schema';

export async function getFileStats(): Promise<FileStats> {
  try {
    // Query database to get total files count and total size
    const result = await db.select({
      total_files: count(filesTable.id),
      total_size: sum(filesTable.file_size)
    })
    .from(filesTable)
    .execute();

    const stats = result[0];

    return {
      total_files: Number(stats.total_files) || 0,
      total_size: Number(stats.total_size) || 0,
    };
  } catch (error) {
    console.error('Failed to get file stats:', error);
    throw error;
  }
}
