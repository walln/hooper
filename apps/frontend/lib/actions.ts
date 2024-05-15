"use server";

import { auth } from "@hooper/auth/next-client";
import { db } from "@hooper/db";
import { chats } from "@hooper/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Chat, ServerActionResult } from "./types";

export async function refreshHistory(path: string) {
	redirect(path);
}

export type InsertChat = typeof chats.$inferInsert;

export async function saveChat(chat: InsertChat) {
	const session = await auth();

	if (session.type !== "user") {
		return;
	}

	const { id, sharePath, ...chatData } = chat;
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

	if (session.type !== "user") {
		return {
			error: "Unauthorized",
		};
	}

	const chat = await db.select().from(chats).where(eq(chats.id, id)).get();
	if (!chat || chat.userId !== session.properties.userId) {
		return {
			error: "Something went wrong",
		};
	}

	const payload = {
		...chat,
		sharePath: `/share/${chat.id}`,
	};

	await db
		.update(chats)
		.set({
			sharePath: payload.sharePath,
		})
		.where(eq(chats.id, chat.id))
		.run();

	return payload;
}

export async function getSharedChat(id: string) {
	const chat = await db.select().from(chats).where(eq(chats.id, id)).get();

	if (!chat || !chat.sharePath) {
		return null;
	}

	return chat;
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

	if (session.type !== "user") {
		return {
			error: "Unauthorized",
		};
	}

	const found = await db
		.select()
		.from(chats)
		.where(eq(chats.userId, session.properties.userId))
		.all();

	if (!found.length) {
		return redirect("/");
	}

	await db
		.delete(chats)
		.where(eq(chats.userId, session.properties.userId))
		.run();

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
	if (session.type !== "user" || userId !== session.properties.userId) {
		return {
			error: "Unauthorized",
		};
	}

	await db.delete(chats).where(eq(chats.id, id)).run();

	revalidatePath("/");
	return revalidatePath(path);
}
