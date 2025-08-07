
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { filesTable } from '../db/schema';
import { getFileStats } from '../handlers/get_file_stats';

describe('getFileStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero stats when no files exist', async () => {
    const result = await getFileStats();

    expect(result.total_files).toEqual(0);
    expect(result.total_size).toEqual(0);
  });

  it('should return correct stats for single file', async () => {
    // Insert test file
    await db.insert(filesTable).values({
      original_name: 'test.txt',
      file_path: '/uploads/test.txt',
      file_size: 1024,
      mime_type: 'text/plain',
    }).execute();

    const result = await getFileStats();

    expect(result.total_files).toEqual(1);
    expect(result.total_size).toEqual(1024);
  });

  it('should return correct stats for multiple files', async () => {
    // Insert multiple test files
    await db.insert(filesTable).values([
      {
        original_name: 'file1.txt',
        file_path: '/uploads/file1.txt',
        file_size: 500,
        mime_type: 'text/plain',
      },
      {
        original_name: 'file2.jpg',
        file_path: '/uploads/file2.jpg',
        file_size: 2048,
        mime_type: 'image/jpeg',
      },
      {
        original_name: 'file3.pdf',
        file_path: '/uploads/file3.pdf',
        file_size: 1500,
        mime_type: 'application/pdf',
      }
    ]).execute();

    const result = await getFileStats();

    expect(result.total_files).toEqual(3);
    expect(result.total_size).toEqual(4048); // 500 + 2048 + 1500
  });

  it('should handle large file sizes correctly', async () => {
    const largeFileSize = 100 * 1024 * 1024; // 100MB

    await db.insert(filesTable).values({
      original_name: 'large_file.zip',
      file_path: '/uploads/large_file.zip',
      file_size: largeFileSize,
      mime_type: 'application/zip',
    }).execute();

    const result = await getFileStats();

    expect(result.total_files).toEqual(1);
    expect(result.total_size).toEqual(largeFileSize);
    expect(typeof result.total_size).toBe('number');
  });
});
