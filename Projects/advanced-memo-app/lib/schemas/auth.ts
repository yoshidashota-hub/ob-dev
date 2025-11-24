import { z } from 'zod';

/**
 * ユーザー登録スキーマ
 *
 * パスワード要件:
 * - 8文字以上
 * - 大文字を含む
 * - 小文字を含む
 * - 数字を含む
 * - 特殊文字を含む
 */
export const RegisterSchema = z.object({
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('有効なメールアドレスを入力してください')
    .max(255, 'メールアドレスは255文字以内である必要があります'),

  password: z
    .string()
    .min(8, 'パスワードは8文字以上である必要があります')
    .max(100, 'パスワードは100文字以内である必要があります')
    .regex(/[A-Z]/, 'パスワードには大文字を含む必要があります')
    .regex(/[a-z]/, 'パスワードには小文字を含む必要があります')
    .regex(/[0-9]/, 'パスワードには数字を含む必要があります')
    .regex(/[^A-Za-z0-9]/, 'パスワードには特殊文字を含む必要があります'),

  name: z
    .string()
    .min(1, '名前を入力してください')
    .max(100, '名前は100文字以内である必要があります')
    .trim(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

/**
 * ログインスキーマ
 */
export const LoginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * トークンリフレッシュスキーマ
 */
export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'リフレッシュトークンが必要です'),
});

export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

/**
 * 認証レスポンススキーマ
 */
export const AuthResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string(),
  }),
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

/**
 * ユーザースキーマ（パスワードを含まない）
 */
export const UserSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  name: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof UserSchema>;
