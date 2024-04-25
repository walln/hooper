import "server-only";

import { auth } from "@/auth";
import {
	BotCard,
	BotMessage,
	SpinnerMessage,
	UserMessage,
} from "@/components/chat/message";
import { nanoid } from "@/lib/utils";
import {
	createAI,
	createStreamableUI,
	createStreamableValue,
	getAIState,
	getMutableAIState,
	render,
} from "ai/rsc";
import { OpenAI } from "openai";

import type { Chat } from "@/lib/types";
import { saveChat } from "../actions";

export type Message = {
	role: "user" | "assistant" | "system" | "function" | "data" | "tool";
	content: string;
	id: string;
	name?: string;
};

export type AIState = {
	chatId: string;
	messages: Message[];
};

export type UIState = {
	id: string;
	display: React.ReactNode;
}[];

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

async function submitUserMessage(content: string) {
	"use server";

	const aiState = getMutableAIState<typeof AI>();

	aiState.update({
		...aiState.get(),
		messages: [
			...aiState.get().messages,
			{
				id: nanoid(),
				role: "user",
				content,
			},
		],
	});

	let textStream: undefined | ReturnType<typeof createStreamableValue<string>>;
	let textNode: undefined | React.ReactNode;

	const ui = render({
		provider: openai,
		model: "gpt-3.5-turbo",
		initial: <SpinnerMessage />,
		messages: [
			{
				role: "system",
				content: `\
You are an AI agent that helps users ask questions and get information about what is going on in the NBA. 
You are allowed to respond like die-hard NBA fan and have opinions about players and teams, but always remember to be respectful and helpful.
Today's date is ${new Date().toLocaleDateString()}
`,
			},
			// biome-ignore lint/suspicious/noExplicitAny: TODO: use ChatCompletion union types
			...aiState.get().messages.map((info: any) => ({
				role: info.role,
				content: info.content,
				name: info.name,
			})),
		],
		text: ({ content, done, delta }) => {
			if (!textStream) {
				textStream = createStreamableValue("");
				textNode = <BotMessage content={textStream.value} />;
			}

			if (done) {
				textStream.done();
				aiState.done({
					...aiState.get(),
					messages: [
						...aiState.get().messages,
						{
							id: nanoid(),
							role: "assistant",
							content,
						},
					],
				});
			} else {
				textStream.update(delta);
			}

			return textNode;
		},
		temperature: 0,
	});

	return {
		id: Date.now(),
		display: ui,
	};
}

// AI is a provider you wrap your application with so you can access AI and UI state in your components.
export const AI = createAI<AIState, UIState>({
	actions: {
		submitUserMessage,
	},
	initialUIState: [],
	initialAIState: { chatId: nanoid(), messages: [] },
	onGetUIState: async () => {
		"use server";

		const session = await auth();

		if (session?.user) {
			const aiState = getAIState();

			if (aiState) {
				console.log("AI State: ", aiState);

				const uiState = getUIStateFromAIState(aiState);
				return uiState;
			}
		} else {
			return;
		}
	},
	onSetAIState: async ({ state, done }) => {
		"use server";

		const session = await auth();

		if (session?.user) {
			const { chatId, messages } = state;

			const createdAt = new Date();
			const userId = session.user.id as string;
			const path = `/chat/${chatId}`;
			const title = messages[0].content.substring(0, 100);

			const chat: Chat = {
				id: chatId,
				title,
				userId,
				createdAt,
				messages,
				path,
				sharePath: null,
			};

			await saveChat(chat);
		} else {
			return;
		}
	},
});

export const getUIStateFromAIState = (aiState: Chat) => {
	console.log(typeof aiState.messages);

	return aiState.messages
		.filter((message) => message.role !== "system")
		.map((message, index) => ({
			id: `${aiState.id}-${index}`,
			display:
				message.role ===
				// TODO: function calling based on message.name
				"function" ? null : // message.name === "listStocks" ? (
				message.role === "user" ? (
					<UserMessage>{message.content}</UserMessage>
				) : (
					<BotMessage content={message.content} />
				),
		}));
};
