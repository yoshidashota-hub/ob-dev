"use server";

/**
 * Server Action: 投稿削除
 *
 * 投稿を削除し、キャッシュを無効化
 */

import { revalidatePath } from "next/cache";
import { deletePost as deletePostFromStore } from "./posts";

export async function deletePost(id: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const deleted = deletePostFromStore(id);

    if (!deleted) {
      return {
        success: false,
        message: "投稿が見つかりません",
      };
    }

    // キャッシュの無効化
    revalidatePath("/forms");

    return {
      success: true,
      message: "投稿を削除しました",
    };
  } catch (error) {
    return {
      success: false,
      message: "削除に失敗しました",
    };
  }
}
