"use server";

/**
 * Server Action: 投稿更新
 *
 * 既存の投稿を更新
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updatePost as updatePostInStore } from "./posts";

export interface UpdatePostFormState {
  errors?: {
    title?: string[];
    content?: string[];
    author?: string[];
  };
  message?: string;
}

export async function updatePost(
  id: string,
  prevState: UpdatePostFormState,
  formData: FormData
): Promise<UpdatePostFormState> {
  // フォームデータの取得
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const author = formData.get("author") as string;
  const published = formData.get("published") === "on";

  // バリデーション
  const errors: UpdatePostFormState["errors"] = {};

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

  // データベースを更新
  try {
    const updated = updatePostInStore(id, {
      title: title.trim(),
      content: content.trim(),
      author: author.trim(),
      published,
    });

    if (!updated) {
      return {
        message: "投稿が見つかりません",
      };
    }

    // キャッシュの無効化
    revalidatePath("/forms");
    revalidatePath(`/forms/edit/${id}`);

    // 一覧ページにリダイレクト
    redirect("/forms");
  } catch (error) {
    return {
      message: "投稿の更新に失敗しました",
    };
  }
}
