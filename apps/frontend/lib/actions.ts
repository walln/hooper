"use server";

import { auth } from "@/auth";
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

export async function saveChat(chat: Chat) {
	const session = await auth();

	if (session?.user) {
		// const pipeline = kv.pipeline()
		// pipeline.hmset(`chat:${chat.id}`, chat)
		// pipeline.zadd(`user:chat:${chat.userId}`, {
		//   score: Date.now(),
		//   member: `chat:${chat.id}`
		// })
		// await pipeline.exec()
	} else {
		return;
	}
}

export async function shareChat(id: string): ServerActionResult<Chat> {
	const session = await auth();

	if (!session?.user?.id) {
		return {
			error: "Unauthorized",
		};
	}

	// const chat = await kv.hgetall<Chat>(`chat:${id}`)

	// if (!chat || chat.userId !== session.user.id) {
	//   return {
	//     error: 'Something went wrong'
	//   }
	// }

	// const payload = {
	// 	...chat,
	// 	sharePath: `/share/${chat.id}`,
	// };

	// await kv.hmset(`chat:${chat.id}`, payload)

	const payload = {
		sharePath: `/share/${id}`,
	};

	return payload as Chat;
}
