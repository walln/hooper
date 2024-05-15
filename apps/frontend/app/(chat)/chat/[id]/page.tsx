import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Chat } from "@/components/chat/chat";
import { getChat } from "@/lib/actions";
import { AI } from "@/lib/chat/actions";
import { auth } from "@hooper/auth/next-client";

export interface ChatPageProps {
	params: {
		id: string;
	};
}

export async function generateMetadata({
	params,
}: ChatPageProps): Promise<Metadata> {
	const session = await auth();

	if (session.type !== "user") {
		return {};
	}

	const chat = await getChat(params.id, session.properties.userId);
	return {
		title: chat?.title.toString().slice(0, 50) ?? "Chat",
	};
}

export default async function ChatPage({ params }: ChatPageProps) {
	const session = await auth();

	if (session.type !== "user") {
		redirect(`/login?next=/chat/${params.id}`);
	}

	const userId = session.properties.userId;
	const chat = await getChat(params.id, userId);

	if (!chat) {
		redirect("/");
	}

	return (
		<AI initialAIState={{ chatId: chat.id, messages: chat.messages }}>
			<Chat
				id={chat.id}
				title={chat.title}
				session={session}
				initialMessages={chat.messages}
			/>
		</AI>
	);
}
