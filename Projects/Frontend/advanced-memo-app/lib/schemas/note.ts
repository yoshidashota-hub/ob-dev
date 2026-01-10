import { z } from 'zod';

/**
 * メモスキーマ
 */
export const NoteSchema = z.object({
  id: z.string().cuid(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  userId: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Note = z.infer<typeof NoteSchema>;

/**
 * メモ作成スキーマ
 */
export const CreateNoteSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルを入力してください')
    .max(200, 'タイトルは200文字以内である必要があります')
    .trim(),

  content: z
    .string()
    .max(50000, '本文は50000文字以内である必要があります')
    .default(''),

  tags: z
    .array(z.string().min(1).max(50))
    .max(10, 'タグは10個までです')
    .default([])
    .transform((tags) => tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)),
});

export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;

/**
 * メモ更新スキーマ
 */
export const UpdateNoteSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルを入力してください')
    .max(200, 'タイトルは200文字以内である必要があります')
    .trim()
    .optional(),

  content: z.string().max(50000, '本文は50000文字以内である必要があります').optional(),

  tags: z
    .array(z.string().min(1).max(50))
    .max(10, 'タグは10個までです')
    .transform((tags) => tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0))
    .optional(),
});

export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;

/**
 * メモ検索スキーマ
 */
export const SearchNotesSchema = z.object({
  query: z.string().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type SearchNotesInput = z.infer<typeof SearchNotesSchema>;

/**
 * メモレスポンススキーマ（クライアント用）
 */
export const NoteResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  createdAt: z.string(), // ISO 8601形式
  updatedAt: z.string(), // ISO 8601形式
});

export type NoteResponse = z.infer<typeof NoteResponseSchema>;
