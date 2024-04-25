"use server";

import { auth } from "@/auth";
import { db } from "@hooper/db";
import { chats } from "@hooper/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Chat, ServerActionResult } from "./types";

export async function refreshHistory(path: string) {
	redirect(path);
}

export async function getMissingKeys() {
	const keysRequired = ["OPENAI_API_KEY"];
	return keysRequired
		.map((key) => (process.env[key] ? "" : key))
		.filter((key) => key !== "");
}

export type InsertChat = typeof chats.$inferInsert;

export async function saveChat(chat: InsertChat) {
	const session = await auth();

	if (!session?.user?.id) {
		return;
	}

	const { id, ...chatData } = chat;
	await db
		.insert(chats)
		.values(chat)
		.onConflictDoUpdate({
			target: chats.id,
			set: chatData,
		})
		.returning()
		.get();
}

export async function shareChat(id: string): ServerActionResult<Chat> {
	const session = await auth();

	if (!session?.user?.id) {
		return {
			error: "Unauthorized",
		};
	}

	const chat = await db.select().from(chats).where(eq(chats.id, id)).get();
	if (!chat || chat.userId !== session.user.id) {
		return {
			error: "Something went wrong",
		};
	}

	const payload = {
		...chat,
		sharePath: `/share/${chat.id}`,
	};

	return payload;
}

export async function getChats(userId?: string | null) {
	if (!userId) {
		return [];
	}

	try {
		const found = await db
			.select()
			.from(chats)
			.where(eq(chats.userId, userId))
			.all();
		return found;
	} catch {
		return [];
	}
}

export async function getChat(chatId: string, userId?: string) {
	const chat = await db.select().from(chats).where(eq(chats.id, chatId)).get();

	if (!chat || (userId && chat.userId !== userId)) {
		return;
	}

	return chat;
}

export async function clearChats() {
	const session = await auth();

	if (!session?.user?.id) {
		return {
			error: "Unauthorized",
		};
	}

	const found = await db
		.select()
		.from(chats)
		.where(eq(chats.userId, session.user.id))
		.all();

	if (!found.length) {
		return redirect("/");
	}

	await db.delete(chats).where(eq(chats.userId, session.user.id)).run();

	revalidatePath("/");
	return redirect("/");
}

export async function removeChat({ id, path }: { id: string; path: string }) {
	const session = await auth();

	if (!session) {
		return {
			error: "Unauthorized",
		};
	}

	const chat = await db.select().from(chats).where(eq(chats.id, id)).get();
	const userId = chat?.userId;

	if (userId !== session?.user?.id) {
		return {
			error: "Unauthorized",
		};
	}

	await db.delete(chats).where(eq(chats.id, id)).run();

	revalidatePath("/");
	return revalidatePath(path);
}
