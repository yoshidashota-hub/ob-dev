/**
 * Route Handler: /api/posts/[id]
 *
 * RESTful API for single post operations
 * - GET: Fetch a specific post by ID
 * - PUT: Update a post
 * - DELETE: Delete a post
 */

import { deletePost, getPostById, updatePost } from "@/app/actions/posts";
import { NextRequest, NextResponse } from "next/server";

// Context type for dynamic route params
type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/posts/[id]
 *
 * Fetch a specific post by ID
 *
 * @example
 * GET /api/posts/1
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const post = getPostById(id);

    if (!post) {
      return NextResponse.json(
        {
          success: false,
          error: "Post not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: post,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch post",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/posts/[id]
 *
 * Update a post
 *
 * Request Body (all fields optional):
 * {
 *   title?: string;
 *   content?: string;
 *   author?: string;
 *   published?: boolean;
 * }
 *
 * @example
 * PUT /api/posts/1
 * Body: { "title": "Updated Title" }
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // バリデーション
    const { title, content, author, published } = body;

    // 少なくとも1つのフィールドが必要
    if (
      title === undefined &&
      content === undefined &&
      author === undefined &&
      published === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one field must be provided for update",
        },
        { status: 400 }
      );
    }

    // 型チェック
    if (
      title !== undefined &&
      (typeof title !== "string" || title.trim().length === 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Title must be a non-empty string",
        },
        { status: 400 }
      );
    }

    if (
      content !== undefined &&
      (typeof content !== "string" || content.trim().length === 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Content must be a non-empty string",
        },
        { status: 400 }
      );
    }

    if (
      author !== undefined &&
      (typeof author !== "string" || author.trim().length === 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Author must be a non-empty string",
        },
        { status: 400 }
      );
    }

    if (published !== undefined && typeof published !== "boolean") {
      return NextResponse.json(
        {
          success: false,
          error: "Published must be a boolean",
        },
        { status: 400 }
      );
    }

    // データの準備
    const updateData: {
      title?: string;
      content?: string;
      author?: string;
      published?: boolean;
    } = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (author !== undefined) updateData.author = author.trim();
    if (published !== undefined) updateData.published = published;

    // 更新実行
    const updatedPost = updatePost(id, updateData);

    if (!updatedPost) {
      return NextResponse.json(
        {
          success: false,
          error: "Post not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedPost,
        message: "Post updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update post",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/posts/[id]
 *
 * Delete a post
 *
 * @example
 * DELETE /api/posts/1
 */
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const deleted = deletePost(id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: "Post not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Post deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete post",
      },
      { status: 500 }
    );
  }
}
