
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { filesTable } from '../db/schema';
import { type GetFileInput } from '../schema';
import { serveFile } from '../handlers/serve_file';
import { eq } from 'drizzle-orm';

const testFileData = {
    original_name: 'test-document.pdf',
    file_path: '/uploads/2024/test-document.pdf',
    file_size: 1024,
    mime_type: 'application/pdf'
};

describe('serveFile', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should return file info for existing file', async () => {
        // Create test file in database
        const insertResult = await db.insert(filesTable)
            .values(testFileData)
            .returning()
            .execute();

        const fileId = insertResult[0].id;
        const input: GetFileInput = { id: fileId };

        const result = await serveFile(input);

        expect(result).not.toBeNull();
        expect(result?.filePath).toEqual('/uploads/2024/test-document.pdf');
        expect(result?.originalName).toEqual('test-document.pdf');
        expect(result?.mimeType).toEqual('application/pdf');
    });

    it('should return null for non-existent file', async () => {
        const input: GetFileInput = { id: '550e8400-e29b-41d4-a716-446655440000' };

        const result = await serveFile(input);

        expect(result).toBeNull();
    });

    it('should retrieve correct file when multiple files exist', async () => {
        // Create multiple test files
        const file1Data = { ...testFileData, original_name: 'file1.pdf' };
        const file2Data = { ...testFileData, original_name: 'file2.pdf' };

        const [file1Result, file2Result] = await Promise.all([
            db.insert(filesTable).values(file1Data).returning().execute(),
            db.insert(filesTable).values(file2Data).returning().execute()
        ]);

        const file1Id = file1Result[0].id;
        const file2Id = file2Result[0].id;

        // Test retrieving specific file
        const result1 = await serveFile({ id: file1Id });
        const result2 = await serveFile({ id: file2Id });

        expect(result1?.originalName).toEqual('file1.pdf');
        expect(result2?.originalName).toEqual('file2.pdf');
    });

    it('should handle different mime types correctly', async () => {
        const imageFileData = {
            ...testFileData,
            original_name: 'image.jpg',
            mime_type: 'image/jpeg',
            file_path: '/uploads/2024/image.jpg'
        };

        const insertResult = await db.insert(filesTable)
            .values(imageFileData)
            .returning()
            .execute();

        const fileId = insertResult[0].id;
        const result = await serveFile({ id: fileId });

        expect(result?.mimeType).toEqual('image/jpeg');
        expect(result?.originalName).toEqual('image.jpg');
        expect(result?.filePath).toEqual('/uploads/2024/image.jpg');
    });

    it('should verify file exists in database after retrieval', async () => {
        // Create test file
        const insertResult = await db.insert(filesTable)
            .values(testFileData)
            .returning()
            .execute();

        const fileId = insertResult[0].id;
        
        // Use handler to retrieve file info
        const result = await serveFile({ id: fileId });

        // Verify file still exists in database
        const dbFiles = await db.select()
            .from(filesTable)
            .where(eq(filesTable.id, fileId))
            .execute();

        expect(dbFiles).toHaveLength(1);
        expect(result).not.toBeNull();
        
        // Add null check before comparing
        if (result) {
            expect(dbFiles[0].original_name).toEqual(result.originalName);
        }
    });
});
