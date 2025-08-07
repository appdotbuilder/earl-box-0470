
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { filesTable } from '../db/schema';
import { type UploadFileInput } from '../schema';
import { uploadFile } from '../handlers/upload_file';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

// Create test base64 data for a small text file
const createTestFileData = (content: string = 'Test file content') => {
  return Buffer.from(content).toString('base64');
};

const testInput: UploadFileInput = {
  file_name: 'test.txt',
  file_size: 17, // Length of "Test file content"
  mime_type: 'text/plain',
  file_data: createTestFileData(),
};

describe('uploadFile', () => {
  beforeEach(createDB);
  
  afterEach(async () => {
    // Clean up uploaded files
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(uploadsDir, file));
      });
    }
    await resetDB();
  });

  it('should upload a file successfully', async () => {
    const result = await uploadFile(testInput);

    // Validate response structure
    expect(result.id).toBeDefined();
    expect(result.download_url).toEqual(`/files/${result.id}`);
    expect(result.original_name).toEqual('test.txt');
    expect(result.file_size).toEqual(17);
  });

  it('should save file metadata to database', async () => {
    const result = await uploadFile(testInput);

    // Query database to verify file was saved
    const files = await db.select()
      .from(filesTable)
      .where(eq(filesTable.id, result.id))
      .execute();

    expect(files).toHaveLength(1);
    const fileRecord = files[0];
    expect(fileRecord.original_name).toEqual('test.txt');
    expect(fileRecord.file_size).toEqual(17);
    expect(fileRecord.mime_type).toEqual('text/plain');
    expect(fileRecord.file_path).toContain(result.id);
    expect(fileRecord.upload_date).toBeInstanceOf(Date);
  });

  it('should save file to disk', async () => {
    const result = await uploadFile(testInput);

    // Check if file exists on disk
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const files = fs.readdirSync(uploadsDir);
    
    expect(files).toHaveLength(1);
    expect(files[0]).toContain(result.id);

    // Verify file content
    const filePath = path.join(uploadsDir, files[0]);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    expect(fileContent).toEqual('Test file content');
  });

  it('should reject unsupported file types', async () => {
    const invalidInput: UploadFileInput = {
      ...testInput,
      mime_type: 'application/x-executable',
    };

    expect(() => uploadFile(invalidInput)).toThrow(/Unsupported file type/i);
  });

  it('should reject files with size mismatch', async () => {
    const invalidInput: UploadFileInput = {
      ...testInput,
      file_size: 999, // Wrong size
    };

    expect(() => uploadFile(invalidInput)).toThrow(/File size mismatch/i);
  });

  it('should handle different file types', async () => {
    const imageInput: UploadFileInput = {
      file_name: 'test.jpg',
      file_size: 10,
      mime_type: 'image/jpeg',
      file_data: createTestFileData('fake image'),
    };

    const result = await uploadFile(imageInput);

    expect(result.original_name).toEqual('test.jpg');
    expect(result.file_size).toEqual(10);
  });

  it('should handle large file names correctly', async () => {
    const longNameInput: UploadFileInput = {
      ...testInput,
      file_name: 'very_long_file_name_with_lots_of_characters_and_spaces_and_special_chars_@#$%^&*()_+.txt',
    };

    const result = await uploadFile(longNameInput);

    expect(result.original_name).toEqual(longNameInput.file_name);
    
    // Verify file was saved with UUID-based name
    const files = await db.select()
      .from(filesTable)
      .where(eq(filesTable.id, result.id))
      .execute();
    
    expect(files[0].file_path).toContain(result.id);
  });
});
