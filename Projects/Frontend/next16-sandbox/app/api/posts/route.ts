/**
 * Route Handler: /api/posts
 *
 * RESTful API for posts management
 * - GET: Fetch all posts
 * - POST: Create new post
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllPosts, createPost, type Post } from "@/app/actions/posts";

/**
 * GET /api/posts
 *
 * クエリパラメータ:
 * - published: "true" | "false" (optional)
 * - limit: number (optional)
 *
 * @example
 * GET /api/posts
 * GET /api/posts?published=true
 * GET /api/posts?limit=5
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const publishedFilter = searchParams.get("published");
    const limit = searchParams.get("limit");

    // すべての投稿を取得
    let posts = getAllPosts();

    // published フィルタリング
    if (publishedFilter === "true") {
      posts = posts.filter((post) => post.published);
    } else if (publishedFilter === "false") {
      posts = posts.filter((post) => !post.published);
    }

    // limit 適用
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        posts = posts.slice(0, limitNum);
      }
    }

    // レスポンス返却
    return NextResponse.json(
      {
        success: true,
        data: posts,
        count: posts.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch posts",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/posts
 *
 * Create a new post
 *
 * Request Body:
 * {
 *   title: string;
 *   content: string;
 *   author: string;
 *   published: boolean;
 * }
 *
 * @example
 * POST /api/posts
 * Body: { "title": "Test", "content": "...", "author": "John", "published": true }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // バリデーション
    const { title, content, author, published } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Title is required and must be a non-empty string",
        },
        { status: 400 }
      );
    }

    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Content is required and must be a non-empty string",
        },
        { status: 400 }
      );
    }

    if (!author || typeof author !== "string" || author.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Author is required and must be a non-empty string",
        },
        { status: 400 }
      );
    }

    if (typeof published !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "Published must be a boolean",
        },
        { status: 400 }
      );
    }

    // 投稿作成
    const newPost = createPost({
      title: title.trim(),
      content: content.trim(),
      author: author.trim(),
      published,
    });

    // 201 Created で返却
    return NextResponse.json(
      {
        success: true,
        data: newPost,
        message: "Post created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create post",
      },
      { status: 500 }
    );
  }
}
