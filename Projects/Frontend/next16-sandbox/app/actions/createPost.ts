"use server";

/**
 * Server Action: 投稿作成
 *
 * フォームから送信されたデータを受け取り、新しい投稿を作成
 * revalidatePathでキャッシュを無効化
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPost as createPostInStore } from "./posts";

export interface CreatePostFormState {
  errors?: {
    title?: string[];
    content?: string[];
    author?: string[];
  };
  message?: string;
}

export async function createPost(
  prevState: CreatePostFormState,
  formData: FormData
): Promise<CreatePostFormState> {
  // フォームデータの取得
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const author = formData.get("author") as string;
  const published = formData.get("published") === "on";

  // バリデーション
  const errors: CreatePostFormState["errors"] = {};

  if (!title || title.trim().length === 0) {
    errors.title = ["タイトルは必須です"];
  } else if (title.length < 3) {
    errors.title = ["タイトルは3文字以上で入力してください"];
  } else if (title.length > 100) {
    errors.title = ["タイトルは100文字以内で入力してください"];
  }

  if (!content || content.trim().length === 0) {
    errors.content = ["本文は必須です"];
  } else if (content.length < 10) {
    errors.content = ["本文は10文字以上で入力してください"];
  }

  if (!author || author.trim().length === 0) {
    errors.author = ["著者名は必須です"];
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // データベースに保存（ここではメモリ内ストア）
  try {
    createPostInStore({
      title: title.trim(),
      content: content.trim(),
      author: author.trim(),
      published,
    });

    // キャッシュの無効化
    revalidatePath("/forms");
    revalidatePath("/forms/create");

    // 一覧ページにリダイレクト
    redirect("/forms");
  } catch (error) {
    return {
      message: "投稿の作成に失敗しました",
    };
  }
}
