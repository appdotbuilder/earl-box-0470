
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { filesTable } from '../db/schema';
import { type GetFileInput } from '../schema';
import { getFile } from '../handlers/get_file';

// Test file data
const testFile = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  original_name: 'test-file.pdf',
  file_path: '/uploads/test-file.pdf',
  file_size: 1024000, // 1MB in bytes
  mime_type: 'application/pdf',
};

describe('getFile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return file when it exists', async () => {
    // Insert test file
    await db.insert(filesTable)
      .values(testFile)
      .execute();

    const input: GetFileInput = { id: testFile.id };
    const result = await getFile(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testFile.id);
    expect(result!.original_name).toEqual('test-file.pdf');
    expect(result!.file_path).toEqual('/uploads/test-file.pdf');
    expect(result!.file_size).toEqual(1024000);
    expect(result!.mime_type).toEqual('application/pdf');
    expect(result!.upload_date).toBeInstanceOf(Date);
  });

  it('should return null when file does not exist', async () => {
    const input: GetFileInput = { id: '550e8400-e29b-41d4-a716-446655440001' };
    const result = await getFile(input);

    expect(result).toBeNull();
  });

  it('should handle file size as number', async () => {
    // Insert file with large size to test bigint handling
    const largeFile = {
      ...testFile,
      id: '550e8400-e29b-41d4-a716-446655440002',
      file_size: 100000000, // 100MB
    };

    await db.insert(filesTable)
      .values(largeFile)
      .execute();

    const input: GetFileInput = { id: largeFile.id };
    const result = await getFile(input);

    expect(result).not.toBeNull();
    expect(result!.file_size).toEqual(100000000);
    expect(typeof result!.file_size).toBe('number');
  });
});
