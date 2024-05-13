import { Chat } from "@/components/chat/chat";
import { AI } from "@/lib/chat/actions";
import { nanoid } from "@/lib/utils";
import { auth } from "@hooper/auth/next-client";

export const metadata = {
	title: "Next.js AI Chatbot",
};

export default async function IndexPage() {
	const id = nanoid();
	const session = await auth();

	return (
		<AI initialAIState={{ chatId: id, messages: [] }}>
			<Chat id={id} session={session} />
		</AI>
	);
}
