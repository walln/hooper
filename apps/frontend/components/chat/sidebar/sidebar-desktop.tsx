import { ChatHistory } from "@/components/chat/chat-history";
import { Sidebar } from "@/components/chat/sidebar/sidebar";
import { auth } from "@hooper/auth/next-client";

export async function SidebarDesktop() {
	const session = await auth();

	if (session.type !== "user") {
		return null;
	}

	return (
		<Sidebar className="peer absolute inset-y-0 z-30 hidden -translate-x-full border-r bg-muted duration-300 ease-in-out data-[state=open]:translate-x-0 lg:flex lg:w-[250px] xl:w-[300px]">
			<ChatHistory userId={session.properties.userId} />
		</Sidebar>
	);
}
