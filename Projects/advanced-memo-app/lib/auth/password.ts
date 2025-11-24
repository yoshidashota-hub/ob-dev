import bcrypt from 'bcryptjs';

/**
 * パスワードのソルトラウンド数
 * 値が大きいほどセキュアだが処理が遅くなる
 * 10は推奨される値
 */
const SALT_ROUNDS = 10;

/**
 * パスワードをハッシュ化
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * パスワードを検証
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * パスワードの強度を検証（追加のセキュリティチェック）
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('パスワードは8文字以上である必要があります');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('パスワードには大文字を含む必要があります');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('パスワードには小文字を含む必要があります');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('パスワードには数字を含む必要があります');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('パスワードには特殊文字を含む必要があります');
  }

  // 一般的な弱いパスワードのチェック
  const commonPasswords = [
    'password',
    '12345678',
    'qwerty',
    'abc12345',
    'password123',
  ];

  if (commonPasswords.some((common) => password.toLowerCase().includes(common))) {
    errors.push('一般的な弱いパスワードは使用できません');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
