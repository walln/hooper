import * as React from "react";

import { ButtonScrollToBottom } from "@/components/chat/button-scroll-to-bottom";
import { ChatShareDialog } from "@/components/chat/chat-share-dialog";
import { PromptForm } from "@/components/chat/prompt-form";
import { FooterText } from "@/components/footer";
import { IconShare } from "@/components/ui/icons";
import { shareChat } from "@/lib/actions";
import type { AI } from "@/lib/chat/actions";
import { Button } from "@hooper/ui/button";
import { useAIState, useActions, useUIState } from "ai/rsc";
import { nanoid } from "nanoid";
import { UserMessage } from "./message";

export interface ChatPanelProps {
	id?: string;
	title: string | undefined;
	input: string;
	shared?: boolean;
	setInput: (value: string) => void;
	isAtBottom: boolean;
	scrollToBottom: () => void;
}

export function ChatPanel({
	id,
	title,
	input,
	shared,
	setInput,
	isAtBottom,
	scrollToBottom,
}: ChatPanelProps) {
	const [aiState] = useAIState();
	const [messages, setMessages] = useUIState<typeof AI>();
	const { submitUserMessage } = useActions();
	const [shareDialogOpen, setShareDialogOpen] = React.useState(false);

	const exampleMessages = [
		{
			heading: "What are the",
			subheading: "scores for today's games?",
			message: "What are the scores for today's games?",
		},
		{
			heading: "What are the top",
			subheading: "headlines around the NBA?",
			message: "What are the top headlines around the NBA?",
		},
		{
			heading: "Who is leading the league",
			subheading: "in points per game?",
			message: "Who is leading the league in points per game?",
		},
		{
			heading: "Who is most likely",
			subheading: "to win the MVP?",
			message: "Who is most likely to win the MVP?",
		},
	];

	return (
		<div className="fixed inset-x-0 bottom-0 w-full bg-gradient-to-b from-muted/30 from-0% to-muted/30 to-50% duration-300 ease-in-out animate-in dark:from-background/10 dark:from-10% dark:to-background/80 peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]">
			<ButtonScrollToBottom
				isAtBottom={isAtBottom}
				scrollToBottom={scrollToBottom}
			/>

			<div className="mx-auto sm:max-w-2xl sm:px-4">
				<div className="mb-4 grid grid-cols-2 gap-2 px-4 sm:px-0">
					{messages.length === 0 &&
						exampleMessages.map((example, index) => (
							<div
								key={example.heading}
								className={`cursor-pointer rounded-lg border  p-4 hover:bg-muted ${
									index > 1 && "hidden md:block"
								}`}
								onClick={async () => {
									setMessages((currentMessages) => [
										...currentMessages,
										{
											id: nanoid(),
											display: <UserMessage>{example.message}</UserMessage>,
										},
									]);

									const responseMessage = await submitUserMessage(
										example.message,
									);

									setMessages((currentMessages) => [
										...currentMessages,
										responseMessage,
									]);
								}}
								onKeyDown={() => {
									alert("NOT IMPLEMENTED");
								}}
							>
								<div className="text-sm font-semibold">{example.heading}</div>
								<div className="text-sm text-muted-foreground">
									{example.subheading}
								</div>
							</div>
						))}
				</div>

				{messages?.length >= 2 ? (
					<div className="flex h-12 items-center justify-center">
						<div className="flex space-x-2">
							{id && title && (
								<>
									<Button
										variant="outline"
										onClick={() => setShareDialogOpen(true)}
									>
										<IconShare className="mr-2" />
										Share
									</Button>
									<ChatShareDialog
										open={shareDialogOpen}
										onOpenChange={setShareDialogOpen}
										onCopy={() => setShareDialogOpen(false)}
										shareChat={shareChat}
										chat={{
											id,
											title: title,
											messages: aiState.messages,
										}}
									/>
								</>
							)}
						</div>
					</div>
				) : null}

				<div className="space-y-4 px-4 py-2 md:py-4 bg-background">
					{/* TODO: Check that if the chat has been shared that it cannot be edited */}
					{!shared && <PromptForm input={input} setInput={setInput} />}
					<FooterText className="hidden sm:block" />
				</div>
			</div>
		</div>
	);
}
