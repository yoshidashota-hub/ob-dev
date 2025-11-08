/**
 * Route Handler: /api/auth
 *
 * Simple authentication example (デモ用)
 * 本番環境では Next-Auth, Clerk, Supabase Auth などを使用
 *
 * - POST: Login (generate simple token)
 */

import { NextRequest, NextResponse } from "next/server";

// デモ用のユーザーデータ
const DEMO_USERS = [
  {
    id: "1",
    email: "user@example.com",
    password: "password123",
    name: "山田太郎",
  },
  { id: "2", email: "admin@example.com", password: "admin123", name: "管理者" },
];

/**
 * POST /api/auth
 *
 * Login and generate a simple token
 *
 * Request Body:
 * {
 *   email: string;
 *   password: string;
 * }
 *
 * @example
 * POST /api/auth
 * Body: { "email": "user@example.com", "password": "password123" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // バリデーション
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Email is required",
        },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Password is required",
        },
        { status: 400 }
      );
    }

    // ユーザー検証
    const user = DEMO_USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 }
      );
    }

    // 簡易的なトークン生成（デモ用）
    // 本番環境では JWT や セッション管理を使用
    const token = Buffer.from(
      `${user.id}:${user.email}:${Date.now()}`
    ).toString("base64");

    // レスポンスを作成
    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          token,
        },
        message: "Login successful",
      },
      { status: 200 }
    );

    // Cookie にトークンをセット（オプション）
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24時間
    });

    return response;
  } catch (error) {
    console.error("Error during authentication:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Authentication failed",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth
 *
 * Logout (clear token)
 *
 * @example
 * DELETE /api/auth
 */
export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json(
      {
        success: true,
        message: "Logout successful",
      },
      { status: 200 }
    );

    // Cookie を削除
    response.cookies.delete("auth-token");

    return response;
  } catch (error) {
    console.error("Error during logout:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Logout failed",
      },
      { status: 500 }
    );
  }
}
