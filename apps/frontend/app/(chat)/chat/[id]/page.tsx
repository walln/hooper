import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { Chat } from "@/components/chat/chat";
import { getChat, getMissingKeys } from "@/lib/actions";
import { AI } from "@/lib/chat/actions";
import { logger } from "@/lib/logger";
import type { Session } from "@/lib/types";

export interface ChatPageProps {
	params: {
		id: string;
	};
}

export async function generateMetadata({
	params,
}: ChatPageProps): Promise<Metadata> {
	const session = await auth();

	if (!session?.user) {
		return {};
	}

	const chat = await getChat(params.id, session.user.id);
	return {
		title: chat?.title.toString().slice(0, 50) ?? "Chat",
	};
}

export default async function ChatPage({ params }: ChatPageProps) {
	const session = (await auth()) as Session;
	const missingKeys = await getMissingKeys();

	if (!session?.user) {
		redirect(`/login?next=/chat/${params.id}`);
	}

	const userId = session.user.id as string;
	const chat = await getChat(params.id, userId);

	if (!chat) {
		redirect("/");
	}

	logger.info("ChatPage", { chat });

	return (
		<AI initialAIState={{ chatId: chat.id, messages: chat.messages }}>
			<Chat
				id={chat.id}
				title={chat.title}
				session={session}
				initialMessages={chat.messages}
				missingKeys={missingKeys}
			/>
		</AI>
	);
}
