"use client";

import { SidebarActions } from "@/components/chat/sidebar/sidebar-actions";
import { SidebarItem } from "@/components/chat/sidebar/sidebar-item";
import { removeChat, shareChat } from "@/lib/actions";
import type { Chat } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";

interface SidebarItemsProps {
	chats?: Chat[];
}

export function SidebarItems({ chats }: SidebarItemsProps) {
	if (!chats?.length) return null;

	return (
		<AnimatePresence>
			{chats.map(
				(chat, index) =>
					// biome-ignore lint/correctness/useJsxKeyInIterable: motion.div key not detected by biome
					chat && (
						<motion.div
							key={chat?.id}
							exit={{
								opacity: 0,
								height: 0,
							}}
						>
							<SidebarItem index={index} chat={chat}>
								<SidebarActions
									chat={chat}
									removeChat={removeChat}
									shareChat={shareChat}
								/>
							</SidebarItem>
						</motion.div>
					),
			)}
		</AnimatePresence>
	);
}
