
import { pgTable, text, timestamp, bigint, uuid } from 'drizzle-orm/pg-core';

export const filesTable = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  original_name: text('original_name').notNull(),
  file_path: text('file_path').notNull(),
  file_size: bigint('file_size', { mode: 'number' }).notNull(), // Store file size as number
  mime_type: text('mime_type').notNull(),
  upload_date: timestamp('upload_date').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type File = typeof filesTable.$inferSelect; // For SELECT operations
export type NewFile = typeof filesTable.$inferInsert; // For INSERT operations

// Export all tables for proper query building
export const tables = { files: filesTable };
