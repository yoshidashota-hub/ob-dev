import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '1h') as string;
const JWT_REFRESH_EXPIRES_IN = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as string;

export interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

/**
 * アクセストークンを生成
 */
export function generateAccessToken(userId: string, email: string): string {
  const payload: TokenPayload = {
    userId,
    email,
    type: 'access',
  };

  // @ts-expect-error - jsonwebtoken type definitions issue with string expiresIn
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * リフレッシュトークンを生成
 */
export function generateRefreshToken(userId: string, email: string): string {
  const payload: TokenPayload = {
    userId,
    email,
    type: 'refresh',
  };

  // @ts-expect-error - jsonwebtoken type definitions issue with string expiresIn
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
}

/**
 * トークンを検証
 */
export function verifyToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('トークンの有効期限が切れています');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('無効なトークンです');
    }
    throw new Error('トークンの検証に失敗しました');
  }
}

/**
 * トークンをデコード（検証なし）
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * トークンの有効期限を取得（秒）
 */
export function getTokenExpiration(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 3600; // デフォルト1時間

  const value = parseInt(match[1] ?? '1', 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 60 * 60 * 24;
    default:
      return 3600;
  }
}
